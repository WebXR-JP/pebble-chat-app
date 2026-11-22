import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import https from 'https'
import type { IncomingMessage } from 'http'
import { pipeline } from 'stream/promises'
import { exec } from 'child_process'
import * as tar from 'tar'
import { Extract } from 'unzipper'
import { getBinariesPath, getMediaMTXPath, getTempPath, getMediaMTXConfigPath, getBundledFFmpegPath, getFFmpegPath } from '../utils/paths'
import { getPlatform, getMediaMTXDownloadUrl, getMediaMTXBinaryName, getFFmpegDownloadUrl } from '../utils/platform'
import { resolveRedirectUrl, createDownloadFileName } from '../utils/download'

const MEDIAMTX_VERSION = '1.9.3'

// ダウンロード時に辿るリダイレクトの最大回数
const MAX_REDIRECTS = 5

// ダウンロード中に通信が途絶えたとみなすまでの時間（ソケットのアイドル時間）
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

// FFmpegがインストール済みか確認（バンドル版のみチェック）
export async function isFFmpegInstalled(): Promise<boolean> {
  // バンドル版があるかチェック
  const bundledPath = getBundledFFmpegPath()
  try {
    await fsp.access(bundledPath, fs.constants.X_OK)
    return true
  } catch {
    // バンドル版がない場合、システムにFFmpegがあるかチェック
    const systemPath = getFFmpegPath()
    return systemPath !== null
  }
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
  onProgress?: (message: string) => void
): Promise<void> {
  const archivePath = path.join(tempPath, createDownloadFileName('ffmpeg', 'zip', Date.now()))
  await withTempFile(archivePath, async () => {
    await downloadFile(downloadUrl, archivePath)

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

  onProgress?.('FFmpegをダウンロード中...（100MB以上あるため時間がかかります）')

  if (platform === 'win32') {
    await installFFmpegWindows(tempPath, downloadUrl, onProgress)
  } else if (platform === 'darwin') {
    await installFFmpegMacOS(binPath, tempPath, downloadUrl, onProgress)
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

// HTTPS GETしてレスポンスを返す（ボディは未読のまま）
// ソケットが一定時間無通信になったらリクエストを破棄する。
// レスポンス受信後（ボディのダウンロード中）に途絶えた場合もレスポンスがエラーになり、pipelineが失敗する
function httpsGet(url: string): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { timeout: DOWNLOAD_IDLE_TIMEOUT_MS }, resolve)
    request.on('timeout', () => {
      request.destroy(new Error(`Download timed out: no data for ${DOWNLOAD_IDLE_TIMEOUT_MS / 1000}s`))
    })
    request.on('error', reject)
  })
}

// リダイレクトを辿り、ステータス200のレスポンスを返す
async function openDownloadResponse(url: string): Promise<IncomingMessage> {
  let currentUrl = url

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const response = await httpsGet(currentUrl)
    const redirectUrl = resolveRedirectUrl(response.statusCode, response.headers.location, currentUrl)

    if (redirectUrl) {
      // ボディを読み捨ててソケットを解放する
      response.resume()
      currentUrl = redirectUrl
      continue
    }

    if (response.statusCode !== 200) {
      response.resume()
      throw new Error(`Download failed: ${response.statusCode}`)
    }

    return response
  }

  throw new Error('Download failed: too many redirects')
}

// ファイルダウンロード
// 書き込みストリームはステータス200を確認してから開き、pipelineで扱う。
// pipelineはエラー時に両ストリームを破棄するため、ファイルハンドルが開いたまま残らない
// （以前は失敗時にハンドルを開いたままunlinkしており、Windowsで削除待ちのファイルが残って
// 再試行時の書き込みがEPERMになり、さらに未処理のerrorイベントでクラッシュしていた）
async function downloadFile(url: string, destPath: string): Promise<void> {
  const response = await openDownloadResponse(url)
  await pipeline(response, fs.createWriteStream(destPath))
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

# HLS出力設定（ローカル確認用、通常は使用しない）
hls: yes
hlsAddress: :8888
hlsVariant: mpegts
hlsSegmentCount: 3
hlsSegmentDuration: 1s
hlsPartDuration: 200ms
hlsAllowOrigin: '*'
hlsAlwaysRemux: yes

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
