import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import https from 'https'
import { exec } from 'child_process'
import * as tar from 'tar'
import { Extract } from 'unzipper'
import { getBinariesPath, getMediaMTXPath, getTempPath, getMediaMTXConfigPath, getBundledFFmpegPath, getFFmpegPath } from '../utils/paths'
import { getPlatform, getMediaMTXDownloadUrl, getMediaMTXBinaryName, getFFmpegDownloadUrl } from '../utils/platform'

const MEDIAMTX_VERSION = '1.9.3'

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
    // Windowsはzipをダウンロードして展開
    const archivePath = path.join(tempPath, 'ffmpeg.zip')
    await downloadFile(downloadUrl, archivePath)

    onProgress?.('FFmpegを展開中...')
    await extractZip(archivePath, tempPath)

    // 展開されたディレクトリからffmpeg.exeを探してコピー
    const extractedDirs = await fsp.readdir(tempPath)
    const ffmpegDir = extractedDirs.find(d => d.startsWith('ffmpeg-'))
    if (ffmpegDir) {
      const ffmpegExePath = path.join(tempPath, ffmpegDir, 'bin', 'ffmpeg.exe')
      if (fs.existsSync(ffmpegExePath)) {
        await fsp.copyFile(ffmpegExePath, getBundledFFmpegPath())
      } else {
        throw new Error('FFmpegバイナリが見つかりませんでした')
      }
      // 展開したディレクトリを削除
      await fsp.rm(path.join(tempPath, ffmpegDir), { recursive: true, force: true })
    } else {
      throw new Error('FFmpeg展開ディレクトリが見つかりませんでした')
    }

    // 一時ファイル削除
    await fsp.rm(archivePath, { force: true })
  } else if (platform === 'darwin') {
    // macOSはzipをダウンロード
    const archivePath = path.join(tempPath, 'ffmpeg.zip')
    await downloadFile(downloadUrl, archivePath)

    onProgress?.('FFmpegを展開中...')
    await extractZip(archivePath, binPath)

    // Gatekeeper対応
    onProgress?.('Gatekeeper対応中...')
    await removeQuarantine(getBundledFFmpegPath())

    // 実行権限付与
    await fsp.chmod(getBundledFFmpegPath(), 0o755)

    // 一時ファイル削除
    await fsp.rm(archivePath, { force: true })
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
  const archivePath = path.join(tempPath, `mediamtx.${ext}`)

  onProgress?.('MediaMTXをダウンロード中...')

  // ダウンロード
  await downloadFile(downloadUrl, archivePath)

  onProgress?.('MediaMTXを展開中...')

  // 展開
  if (platform === 'win32') {
    await extractZip(archivePath, binPath)
  } else {
    await extractTarGz(archivePath, binPath)
  }

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

  // 一時ファイル削除
  await fsp.rm(archivePath, { force: true })

  onProgress?.('MediaMTXのインストール完了')
}

// ファイルダウンロード
function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath)

    const request = (currentUrl: string): void => {
      https
        .get(currentUrl, (response) => {
          // リダイレクト対応（301, 302, 303, 307, 308）
          if ([301, 302, 303, 307, 308].includes(response.statusCode || 0)) {
            const redirectUrl = response.headers.location
            if (redirectUrl) {
              request(redirectUrl)
              return
            }
          }

          if (response.statusCode !== 200) {
            reject(new Error(`Download failed: ${response.statusCode}`))
            return
          }

          response.pipe(file)

          file.on('finish', () => {
            file.close()
            resolve()
          })
        })
        .on('error', (err) => {
          fs.unlink(destPath, () => {})
          reject(err)
        })
    }

    request(url)
  })
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
async function extractZip(archivePath: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.createReadStream(archivePath)
      .pipe(Extract({ path: destPath }))
      .on('close', resolve)
      .on('error', reject)
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
hlsSegmentCount: 2
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
    runOnReady: ${ffmpegCommand} -i rtsp://localhost:8554/live -vf "scale=-2:480" -c:v libx264 -preset ultrafast -tune zerolatency -g 30 -keyint_min 30 -b:v 1000k -f flv rtmp://${RELAY_SERVER_HOST}:1935/${streamPath}
    runOnReadyRestart: yes

  all_others:
`.trim()

  await fsp.writeFile(getMediaMTXConfigPath(), configContent, 'utf-8')
}
