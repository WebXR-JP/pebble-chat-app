import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import https from 'https'
import { execSync, exec } from 'child_process'
import { createGunzip } from 'zlib'
import { pipeline } from 'stream/promises'
import { Extract } from 'unzipper'
import * as tar from 'tar'
import { getBinariesPath, getMediaMTXPath, getTempPath, getMediaMTXConfigPath } from '../utils/paths'
import { getPlatform, getMediaMTXDownloadUrl, getMediaMTXBinaryName } from '../utils/platform'

const MEDIAMTX_VERSION = '1.9.3'

// MediaMTXがインストール済みか確認
export async function isMediaMTXInstalled(): Promise<boolean> {
  try {
    await fsp.access(getMediaMTXPath(), fs.constants.X_OK)
    return true
  } catch {
    return false
  }
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

  // 設定ファイルをコピー
  await copyMediaMTXConfig()

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

// MediaMTX設定ファイルをコピー
async function copyMediaMTXConfig(): Promise<void> {
  const configContent = `
# MediaMTX Configuration for XRift Stream

# ログ設定
logLevel: info
logDestinations: [stdout]

# RTMP入力設定
rtmp: yes
rtmpAddress: :1935

# HLS出力設定
hls: yes
hlsAddress: :8888
hlsVariant: lowLatency
hlsSegmentCount: 7
hlsSegmentDuration: 1s
hlsPartDuration: 200ms
hlsAllowOrigin: '*'

# 不要なプロトコルを無効化
api: no
metrics: no
pprof: no
rtsp: no
webrtc: no
srt: no

# パス設定（任意のパスを受け入れる）
paths:
  all_others:
`.trim()

  await fsp.writeFile(getMediaMTXConfigPath(), configContent, 'utf-8')
}
