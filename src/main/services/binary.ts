import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import https from 'https'
import { execSync, exec } from 'child_process'
import { createGunzip } from 'zlib'
import { pipeline } from 'stream/promises'
import { Extract } from 'unzipper'
import * as tar from 'tar'
import { getBinariesPath, getMediaMTXPath, getTempPath, getMediaMTXConfigPath, getCloudflaredPath, getFFmpegPath } from '../utils/paths'
import { getPlatform, getMediaMTXDownloadUrl, getMediaMTXBinaryName, getCloudflaredDownloadUrl, getCloudflaredBinaryName } from '../utils/platform'

const MEDIAMTX_VERSION = '1.9.3'
const CLOUDFLARED_VERSION = '2024.12.2'

// MediaMTXがインストール済みか確認
export async function isMediaMTXInstalled(): Promise<boolean> {
  try {
    await fsp.access(getMediaMTXPath(), fs.constants.X_OK)
    return true
  } catch {
    return false
  }
}

// cloudflaredがインストール済みか確認
export async function isCloudflaredInstalled(): Promise<boolean> {
  try {
    await fsp.access(getCloudflaredPath(), fs.constants.X_OK)
    return true
  } catch {
    return false
  }
}

// cloudflaredをダウンロード・インストール
export async function installCloudflared(
  onProgress?: (message: string) => void
): Promise<void> {
  const binPath = getBinariesPath()
  const tempPath = getTempPath()
  const platform = getPlatform()

  // ディレクトリ作成
  await fsp.mkdir(binPath, { recursive: true })
  await fsp.mkdir(tempPath, { recursive: true })

  const downloadUrl = getCloudflaredDownloadUrl(CLOUDFLARED_VERSION)

  onProgress?.('cloudflaredをダウンロード中...')

  if (platform === 'win32') {
    // Windowsは直接exeをダウンロード
    await downloadFile(downloadUrl, getCloudflaredPath())
  } else if (platform === 'darwin') {
    // macOSはtgzをダウンロードして展開
    const archivePath = path.join(tempPath, 'cloudflared.tgz')
    await downloadFile(downloadUrl, archivePath)

    onProgress?.('cloudflaredを展開中...')
    await extractTgz(archivePath, binPath)

    // 一時ファイル削除
    await fsp.rm(archivePath, { force: true })
  } else {
    // Linuxは直接バイナリをダウンロード
    await downloadFile(downloadUrl, getCloudflaredPath())
  }

  // macOSの場合、Gatekeeper対応
  if (platform === 'darwin') {
    onProgress?.('Gatekeeper対応中...')
    await removeQuarantine(getCloudflaredPath())
  }

  // 実行権限付与
  if (platform !== 'win32') {
    await fsp.chmod(getCloudflaredPath(), 0o755)
  }

  onProgress?.('cloudflaredのインストール完了')
}

// tgz展開（cloudflared用）
async function extractTgz(archivePath: string, destPath: string): Promise<void> {
  await tar.extract({
    file: archivePath,
    cwd: destPath
  })
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
          // リダイレクト対応
          if (response.statusCode === 302 || response.statusCode === 301) {
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
    exec(`xattr -dr com.apple.quarantine "${filePath}"`, (error) => {
      // エラーが出ても続行（属性がない場合など）
      resolve()
    })
  })
}

// MediaMTX設定ファイルを生成（FFmpegパスを動的に検出）
export async function updateMediaMTXConfig(): Promise<void> {
  // FFmpegのパスを検出
  const ffmpegPath = getFFmpegPath()
  const ffmpegCommand = ffmpegPath || 'ffmpeg' // 見つからない場合はffmpegを使う（PATHにあることを期待）

  console.log('[Binary] FFmpeg path detected:', ffmpegPath || 'not found, using default')

  const configContent = `
# MediaMTX Configuration for XRift Stream

# ログ設定
logLevel: info
logDestinations: [stdout]

# RTSP設定（FFmpegトランスコード用）
rtsp: yes
rtspAddress: :8554

# RTMP入力設定
rtmp: yes
rtmpAddress: :1935

# WebRTC/WHIP入力設定
webrtc: yes
webrtcAddress: :8889

# HLS出力設定（低遅延向け）
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
    # WebRTC入力後、FFmpegでH.264に変換（低遅延設定）
    runOnReady: ${ffmpegCommand} -fflags nobuffer -flags low_delay -i rtsp://localhost:8554/live -c:v libx264 -preset ultrafast -tune zerolatency -g 30 -f flv rtmp://localhost:1935/live_hls
    runOnReadyRestart: yes

  live_hls:
    # HLS用パス（H.264）

  all_others:
`.trim()

  await fsp.writeFile(getMediaMTXConfigPath(), configContent, 'utf-8')
}
