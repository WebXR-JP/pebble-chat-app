import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import { getMediaMTXBinaryName, getCloudflaredBinaryName, getPlatform } from './platform'

// ユーザーデータディレクトリ（バイナリ保存場所）
export function getUserDataPath(): string {
  return app.getPath('userData')
}

// バイナリ保存ディレクトリ
export function getBinariesPath(): string {
  return path.join(getUserDataPath(), 'bin')
}

// MediaMTXバイナリパス
export function getMediaMTXPath(): string {
  return path.join(getBinariesPath(), getMediaMTXBinaryName())
}

// MediaMTX設定ファイルパス
export function getMediaMTXConfigPath(): string {
  return path.join(getBinariesPath(), 'mediamtx.yml')
}

// cloudflaredバイナリパス
export function getCloudflaredPath(): string {
  return path.join(getBinariesPath(), getCloudflaredBinaryName())
}

// ログディレクトリ
export function getLogsPath(): string {
  return path.join(getUserDataPath(), 'logs')
}

// 一時ディレクトリ（ダウンロード用）
export function getTempPath(): string {
  return path.join(getUserDataPath(), 'temp')
}

// FFmpegのパスを検出
export function getFFmpegPath(): string | null {
  const platform = getPlatform()

  // まずwhichコマンドで探す（開発環境では動作するが、パッケージ後は環境変数が異なる可能性がある）
  try {
    if (platform === 'win32') {
      const result = execSync('where ffmpeg', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
      const firstLine = result.trim().split('\n')[0]
      if (firstLine && fs.existsSync(firstLine)) {
        return firstLine
      }
    } else {
      const result = execSync('which ffmpeg', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
      const ffmpegPath = result.trim()
      if (ffmpegPath && fs.existsSync(ffmpegPath)) {
        return ffmpegPath
      }
    }
  } catch {
    // whichコマンドが失敗した場合は一般的なパスを探す
  }

  // 一般的なインストール場所を探す
  const commonPaths: string[] = platform === 'darwin'
    ? [
        '/opt/homebrew/bin/ffmpeg',      // Apple Silicon Homebrew
        '/usr/local/bin/ffmpeg',          // Intel Homebrew
        '/usr/bin/ffmpeg',                // システム
      ]
    : platform === 'win32'
    ? [
        'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
        'C:\\ffmpeg\\bin\\ffmpeg.exe',
      ]
    : [
        '/usr/bin/ffmpeg',
        '/usr/local/bin/ffmpeg',
      ]

  for (const ffmpegPath of commonPaths) {
    if (fs.existsSync(ffmpegPath)) {
      return ffmpegPath
    }
  }

  return null
}
