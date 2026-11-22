import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { execSync, execFileSync } from 'child_process'
import { getMediaMTXBinaryName, getFFmpegBinaryName, getPlatform } from './platform'
import { hasLibx264Encoder } from './ffmpeg'

// システムのFFmpegが使えるか確認するときのタイムアウト
const FFMPEG_CHECK_TIMEOUT_MS = 10_000

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

// バンドルされたFFmpegバイナリパス
export function getBundledFFmpegPath(): string {
  return path.join(getBinariesPath(), getFFmpegBinaryName())
}

// ログディレクトリ
export function getLogsPath(): string {
  return path.join(getUserDataPath(), 'logs')
}

// 一時ディレクトリ（ダウンロード用）
export function getTempPath(): string {
  return path.join(getUserDataPath(), 'temp')
}

// whichコマンドでFFmpegを探す
function findFFmpegByWhich(platform: string): string | null {
  try {
    if (platform === 'win32') {
      const result = execSync('where ffmpeg', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
      const firstLine = result.trim().split('\n')[0]
      if (firstLine && fs.existsSync(firstLine)) return firstLine
    } else {
      const result = execSync('which ffmpeg', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
      const ffmpegPath = result.trim()
      if (ffmpegPath && fs.existsSync(ffmpegPath)) return ffmpegPath
    }
  } catch {
    // whichコマンドが失敗した場合はnullを返す
  }
  return null
}

// 一般的なインストール場所にあるFFmpegを列挙する
function findFFmpegInCommonPaths(platform: string): string[] {
  const commonPaths: string[] = platform === 'darwin'
    ? [
        '/opt/homebrew/bin/ffmpeg',      // Apple Silicon Homebrew
        '/usr/local/bin/ffmpeg',          // Intel Homebrew
        '/usr/bin/ffmpeg',                // システム
      ]
    : platform === 'win32'
    ? [
        'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
        'C:\\Program Files\\ffmpeg\\ffmpeg.exe',
        'C:\\Program Files (x86)\\ffmpeg\\bin\\ffmpeg.exe',
        'C:\\ffmpeg\\bin\\ffmpeg.exe',
        'C:\\ffmpeg\\ffmpeg.exe',
        // winget / scoop / chocolatey
        `${process.env.LOCALAPPDATA}\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-7.1-full_build\\bin\\ffmpeg.exe`,
        `${process.env.USERPROFILE}\\scoop\\apps\\ffmpeg\\current\\bin\\ffmpeg.exe`,
        'C:\\ProgramData\\chocolatey\\bin\\ffmpeg.exe',
      ]
    : [
        '/usr/bin/ffmpeg',
        '/usr/local/bin/ffmpeg',
      ]

  return commonPaths.filter((ffmpegPath) => fs.existsSync(ffmpegPath))
}

// システムのFFmpegが配信に使えるか、実際に実行して確認する
// ファイルがあっても、Homebrewで依存ライブラリだけ更新されて起動できなくなっていたり、
// libx264を含まないビルドだったりすると、配信が黙って失敗するため
function isUsableFFmpeg(ffmpegPath: string): boolean {
  try {
    const output = execFileSync(ffmpegPath, ['-hide_banner', '-encoders'], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: FFMPEG_CHECK_TIMEOUT_MS
    })
    if (hasLibx264Encoder(output)) return true

    console.warn('[FFmpeg] Skipping system FFmpeg without libx264:', ffmpegPath)
    return false
  } catch (error) {
    const reason = error instanceof Error ? error.message.split('\n')[0] : String(error)
    console.warn('[FFmpeg] Skipping system FFmpeg that failed to run:', ffmpegPath, reason)
    return false
  }
}

// FFmpegのパスを検出（バンドル版を優先）
export function getFFmpegPath(): string | null {
  const platform = getPlatform()

  // まずバンドルされたFFmpegをチェック
  const bundledPath = getBundledFFmpegPath()
  if (fs.existsSync(bundledPath)) return bundledPath

  // 次にシステムのFFmpeg（whichコマンド → 一般的なインストール場所の順）から、実際に使えるものを選ぶ
  // 使えるものがなければnullを返し、セットアップでバンドル版をダウンロードさせる
  const candidates = [findFFmpegByWhich(platform), ...findFFmpegInCommonPaths(platform)]
  const uniqueCandidates = Array.from(new Set(candidates.filter((p): p is string => p !== null)))

  return uniqueCandidates.find(isUsableFFmpeg) ?? null
}
