import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import { Readable, Transform } from 'stream'
import type { ReadableStream as NodeReadableStream } from 'stream/web'
import { pipeline } from 'stream/promises'
import { net } from 'electron'
import { exec } from 'child_process'
import { createHash } from 'crypto'
import * as tar from 'tar'
import { Extract } from 'unzipper'
import { getBinariesPath, getMediaMTXPath, getTempPath, getMediaMTXConfigPath, getBundledFFmpegPath, getFFmpegPath } from '../utils/paths'
import { getPlatform, getArchitecture, getMediaMTXDownloadUrl, getMediaMTXBinaryName, getFFmpegDownloadUrl, getFFmpegDownloadSha256 } from '../utils/platform'
import { createDownloadFileName, isSha256Match } from '../utils/download'
import { getMachOArchitecture, isMachOArchitectureCompatible, MACHO_HEADER_LENGTH } from '../utils/macho'

const MEDIAMTX_VERSION = '1.9.3'

// ダウンロード中に通信が途絶えたとみなすまでの時間（データを受信しない時間）
const DOWNLOAD_IDLE_TIMEOUT_MS = 60_000

// リレーサーバー設定
const RELAY_SERVER_HOST = 'pebble.xrift.net'

// MediaMTXがインストール済みか確認
export async function isMediaMTXInstalled(): Promise<boolean> {
  try {
    await fsp.access(getMediaMTXPath(), fs.constants.X_OK)
    return true
  } catch {
    return false
  }
}

// FFmpegがインストール済みか確認（バンドル版を優先し、なければシステムのFFmpegを探す）
export async function isFFmpegInstalled(): Promise<boolean> {
  const bundledPath = getBundledFFmpegPath()
  try {
    await fsp.access(bundledPath, fs.constants.X_OK)
  } catch {
    // バンドル版がない場合、システムにFFmpegがあるかチェック
    return getFFmpegPath() !== null
  }

  // 以前は Apple Silicon でも x86_64 版をダウンロードしていたため、それが残っていると
  // Rosetta のない Mac では起動できない。アーキテクチャが合わなければ未インストール扱いにして入れ直す
  if (getPlatform() !== 'darwin') return true
  return isBundledFFmpegArchitectureCompatible(bundledPath)
}

// バンドル版FFmpegが実行中のプロセスと同じアーキテクチャか（読めない場合は互換ありとして扱う）
async function isBundledFFmpegArchitectureCompatible(bundledPath: string): Promise<boolean> {
  try {
    const header = await readFileHeader(bundledPath, MACHO_HEADER_LENGTH)
    const compatible = isMachOArchitectureCompatible(getMachOArchitecture(header), getArchitecture())
    if (!compatible) console.warn('[Binary] Bundled FFmpeg architecture does not match, reinstalling:', bundledPath)
    return compatible
  } catch {
    return true
  }
}

// ファイル先頭の指定バイト数を読む
async function readFileHeader(filePath: string, length: number): Promise<Uint8Array> {
  const handle = await fsp.open(filePath, 'r')
  try {
    const buffer = Buffer.alloc(length)
    const { bytesRead } = await handle.read(buffer, 0, length, 0)
    return buffer.subarray(0, bytesRead)
  } finally {
    await handle.close()
  }
}

// ファイルのSHA256（16進）を計算する
async function computeFileSha256(filePath: string): Promise<string> {
  const hash = createHash('sha256')
  for await (const chunk of fs.createReadStream(filePath)) {
    hash.update(chunk)
  }
  return hash.digest('hex')
}

// Windows用FFmpegインストール
async function installFFmpegWindows(
  tempPath: string,
  downloadUrl: string,
  onProgress?: (message: string) => void
): Promise<void> {
  const archivePath = path.join(tempPath, createDownloadFileName('ffmpeg', 'zip', Date.now()))
  await withTempFile(archivePath, async () => {
    await downloadFile(downloadUrl, archivePath)

    onProgress?.('FFmpegを展開中...')
    await extractZip(archivePath, tempPath)
  })

  // 展開されたディレクトリからffmpeg.exeを探してコピー
  const extractedDirs = await fsp.readdir(tempPath)
  const ffmpegDir = extractedDirs.find(d => d.startsWith('ffmpeg-'))
  if (!ffmpegDir) {
    throw new Error('FFmpeg展開ディレクトリが見つかりませんでした')
  }

  const ffmpegExePath = path.join(tempPath, ffmpegDir, 'bin', 'ffmpeg.exe')
  if (!fs.existsSync(ffmpegExePath)) {
    throw new Error('FFmpegバイナリが見つかりませんでした')
  }

  await fsp.copyFile(ffmpegExePath, getBundledFFmpegPath())
  // 展開したディレクトリを削除
  await fsp.rm(path.join(tempPath, ffmpegDir), { recursive: true, force: true })
}

// macOS用FFmpegインストール
async function installFFmpegMacOS(
  binPath: string,
  tempPath: string,
  downloadUrl: string,
  expectedSha256: string | null,
  onProgress?: (message: string) => void
): Promise<void> {
  const archivePath = path.join(tempPath, createDownloadFileName('ffmpeg', 'zip', Date.now()))
  await withTempFile(archivePath, async () => {
    await downloadFile(downloadUrl, archivePath)

    // 実行するバイナリなので、配布元が公開しているハッシュと照合してから展開する
    if (expectedSha256) {
      const actualSha256 = await computeFileSha256(archivePath)
      if (!isSha256Match(actualSha256, expectedSha256)) {
        throw new Error(`FFmpegのダウンロードファイルが壊れているか改ざんされています（SHA256: ${actualSha256}）`)
      }
    }

    // 既存のバイナリ（以前の x86_64 版など）は上書きせず削除してから展開する。
    // 署名済みの実行ファイルを同じファイルのまま書き換えると、macOS がコード署名の
    // キャッシュと食い違うと判断して起動時に強制終了することがあるため
    await fsp.rm(getBundledFFmpegPath(), { force: true })

    onProgress?.('FFmpegを展開中...')
    await extractZip(archivePath, binPath)
  })

  // Gatekeeper対応
  onProgress?.('Gatekeeper対応中...')
  await removeQuarantine(getBundledFFmpegPath())

  // 実行権限付与
  await fsp.chmod(getBundledFFmpegPath(), 0o755)
}

// FFmpegをダウンロード・インストール
export async function installFFmpeg(
  onProgress?: (message: string) => void
): Promise<void> {
  const binPath = getBinariesPath()
  const tempPath = getTempPath()
  const platform = getPlatform()

  // ディレクトリ作成
  await fsp.mkdir(binPath, { recursive: true })
  await fsp.mkdir(tempPath, { recursive: true })

  const downloadUrl = getFFmpegDownloadUrl()
  if (!downloadUrl) {
    throw new Error('このプラットフォームではFFmpegの自動インストールはサポートされていません')
  }

  onProgress?.('FFmpegをダウンロード中...（サイズが大きいため時間がかかることがあります）')

  if (platform === 'win32') {
    await installFFmpegWindows(tempPath, downloadUrl, onProgress)
  } else if (platform === 'darwin') {
    await installFFmpegMacOS(binPath, tempPath, downloadUrl, getFFmpegDownloadSha256(), onProgress)
  }

  onProgress?.('FFmpegのインストール完了')
}

// MediaMTXをダウンロード・インストール
export async function installMediaMTX(
  onProgress?: (message: string) => void
): Promise<void> {
  const binPath = getBinariesPath()
  const tempPath = getTempPath()

  // ディレクトリ作成
  await fsp.mkdir(binPath, { recursive: true })
  await fsp.mkdir(tempPath, { recursive: true })

  const downloadUrl = getMediaMTXDownloadUrl(MEDIAMTX_VERSION)
  const platform = getPlatform()
  const ext = platform === 'win32' ? 'zip' : 'tar.gz'
  const archivePath = path.join(tempPath, createDownloadFileName('mediamtx', ext, Date.now()))

  onProgress?.('MediaMTXをダウンロード中...')

  await withTempFile(archivePath, async () => {
    // ダウンロード
    await downloadFile(downloadUrl, archivePath)

    onProgress?.('MediaMTXを展開中...')

    // 展開
    if (platform === 'win32') {
      await extractZip(archivePath, binPath)
    } else {
      await extractTarGz(archivePath, binPath)
    }
  })

  // macOSの場合、Gatekeeper対応
  if (platform === 'darwin') {
    onProgress?.('Gatekeeper対応中...')
    await removeQuarantine(getMediaMTXPath())
  }

  // 実行権限付与
  if (platform !== 'win32') {
    await fsp.chmod(getMediaMTXPath(), 0o755)
  }

  // 設定ファイルを生成
  await updateMediaMTXConfig()

  onProgress?.('MediaMTXのインストール完了')
}

// 一時ファイルを使う処理を実行し、成否にかかわらず最後に一時ファイルを削除する
// ダウンロード名は毎回異なるため、失敗時に残すと一時ディレクトリに溜まっていく
async function withTempFile(filePath: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn()
  } finally {
    await fsp.rm(filePath, { force: true }).catch(() => {})
  }
}

// ファイルダウンロード
// Electronのnet.fetch（Chromiumのネットワークスタック）を使う。
// Node.jsのhttpsと違い、OSの証明書ストアとシステムのプロキシ設定が使われるため、
// 社内プロキシやセキュリティソフトが通信を中継する環境でも証明書エラーになりにくい。
// リダイレクトはnet.fetchが自動で辿る。
//
// pipelineはエラー時に全ストリームを破棄するため、ファイルハンドルが開いたまま残らない
// （以前は失敗時にハンドルを開いたままunlinkしており、Windowsで削除待ちのファイルが残って
// 再試行時の書き込みがEPERMになり、さらに未処理のerrorイベントでクラッシュしていた）
async function downloadFile(url: string, destPath: string): Promise<void> {
  // 一定時間データを受信しなければ中断する（接続待ち・ダウンロード中のどちらも対象）
  const controller = new AbortController()
  let idleTimer: ReturnType<typeof setTimeout> | undefined
  const resetIdleTimer = (): void => {
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      controller.abort(new Error(`Download timed out: no data for ${DOWNLOAD_IDLE_TIMEOUT_MS / 1000}s`))
    }, DOWNLOAD_IDLE_TIMEOUT_MS)
  }

  resetIdleTimer()

  try {
    // 100MB以上あるFFmpegなどをChromiumのHTTPキャッシュ（userData/Cache）に溜めないよう、キャッシュを使わない
    const response = await net.fetch(url, { signal: controller.signal, cache: 'no-store' })
    // 部分レスポンス（206など）を完全なファイルとして扱わないよう、200のみ受け付ける
    if (response.status !== 200 || !response.body) {
      // 読まないボディは破棄して、リクエストを開いたままにしない
      await response.body?.cancel().catch(() => {})
      throw new Error(`Download failed: ${response.status}`)
    }

    // 受信のたびにアイドルタイマーをリセットする
    const idleWatcher = new Transform({
      transform(chunk, _encoding, callback): void {
        resetIdleTimer()
        callback(null, chunk)
      }
    })

    await pipeline(
      Readable.fromWeb(response.body as unknown as NodeReadableStream),
      idleWatcher,
      fs.createWriteStream(destPath),
      { signal: controller.signal }
    )
  } finally {
    clearTimeout(idleTimer)
  }
}

// tar.gz展開
async function extractTarGz(archivePath: string, destPath: string): Promise<void> {
  await tar.extract({
    file: archivePath,
    cwd: destPath,
    filter: (path) => path === getMediaMTXBinaryName()
  })
}

// zip展開
// エラー時は読み込みストリームも破棄し、Windowsでアーカイブのハンドルが残って削除できなくなるのを防ぐ
async function extractZip(archivePath: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(archivePath)
    const fail = (error: Error): void => {
      readStream.destroy()
      reject(error)
    }

    readStream
      .on('error', fail)
      .pipe(Extract({ path: destPath }))
      .on('close', resolve)
      .on('error', fail)
  })
}

// macOS Gatekeeper quarantine属性を削除
async function removeQuarantine(filePath: string): Promise<void> {
  return new Promise((resolve) => {
    exec(`xattr -dr com.apple.quarantine "${filePath}"`, () => {
      // エラーが出ても続行（属性がない場合など）
      resolve()
    })
  })
}

// MediaMTX設定ファイルを生成（リレーサーバーへRTMP送出）
export async function updateMediaMTXConfig(streamId?: string): Promise<void> {
  // FFmpegのパスを検出
  const ffmpegPath = getFFmpegPath()
  // Windowsのバックスラッシュをスラッシュに変換（YAMLでエスケープ問題を回避）
  const ffmpegCommand = ffmpegPath ? ffmpegPath.replace(/\\/g, '/') : 'ffmpeg'

  console.log('[Binary] FFmpeg path detected:', ffmpegPath || 'not found, using default')

  // ストリームIDが指定されていない場合はデフォルト値を使用
  const streamPath = streamId || 'live'

  const configContent = `
# MediaMTX Configuration for PebbleChat
# WebRTC入力 → H.264エンコード → サーバーへRTMP送出

# ログ設定
logLevel: info
logDestinations: [stdout]

# RTSP設定（FFmpegトランスコード用）
rtsp: yes
rtspAddress: :8554

# RTMP入力設定（ローカルFFmpegからの受信用）
rtmp: yes
rtmpAddress: :1935

# WebRTC/WHIP入力設定
webrtc: yes
webrtcAddress: :8889

# ローカルHLS出力は使用しない（HLSはリレーサーバー側で生成する）
# 有効にすると:8888を開こうとし、Windowsで予約済みポートだった場合にMediaMTXごと起動に失敗する
hls: no

# 不要なプロトコルを無効化
api: no
metrics: no
pprof: no
srt: no

# パス設定
paths:
  live:
    # WebRTC入力後、FFmpegでH.264に変換してリレーサーバーへRTMP送出
    runOnReady: '"${ffmpegCommand}" -i rtsp://localhost:8554/live -vf "scale=-2:480" -c:v libx264 -preset ultrafast -tune zerolatency -g 30 -keyint_min 30 -b:v 1000k -f flv rtmp://${RELAY_SERVER_HOST}:1935/${streamPath}'
    runOnReadyRestart: yes

  all_others:
`.trim()

  await fsp.writeFile(getMediaMTXConfigPath(), configContent, 'utf-8')
}
