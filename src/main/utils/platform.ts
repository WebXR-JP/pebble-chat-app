import os from 'os'
import type { Platform, Architecture } from '../../shared/types'

export function getPlatform(): Platform {
  const platform = os.platform()
  if (platform === 'darwin' || platform === 'win32' || platform === 'linux') {
    return platform
  }
  throw new Error(`Unsupported platform: ${platform}`)
}

export function getArchitecture(): Architecture {
  const arch = os.arch()
  if (arch === 'x64' || arch === 'arm64') {
    return arch
  }
  throw new Error(`Unsupported architecture: ${arch}`)
}

// MediaMTXダウンロードURL生成
export function getMediaMTXDownloadUrl(version: string): string {
  const platform = getPlatform()
  const arch = getArchitecture()

  const platformMap: Record<Platform, string> = {
    darwin: 'darwin',
    win32: 'windows',
    linux: 'linux'
  }

  const archMap: Record<Architecture, string> = {
    x64: 'amd64',
    arm64: 'arm64'
  }

  const ext = platform === 'win32' ? 'zip' : 'tar.gz'
  const osName = platformMap[platform]
  const archName = archMap[arch]

  return `https://github.com/bluenviron/mediamtx/releases/download/v${version}/mediamtx_v${version}_${osName}_${archName}.${ext}`
}

// MediaMTXバイナリ名
export function getMediaMTXBinaryName(): string {
  return getPlatform() === 'win32' ? 'mediamtx.exe' : 'mediamtx'
}

// macOS用FFmpeg（Martin Riedl氏のビルドサーバーが配布する GPL 静的ビルド、libx264 入り）
// arm64 ネイティブ版があるため、Rosetta のない Apple Silicon Mac でも動く。
// latest へのリダイレクトではなくバージョン固定のURLを使い、配布物の中身が勝手に変わらないようにする
// （過去のリリースも 2022 年分から残されている）。ダウンロード後に SHA256 を照合する。
// 更新時は https://ffmpeg.martin-riedl.de/ の Release ビルドの URL と、併記されている SHA256 に差し替える。
// zip の直下に ffmpeg バイナリが1つだけ入っている
const MACOS_FFMPEG_DOWNLOADS: Record<Architecture, { url: string; sha256: string }> = {
  arm64: {
    url: 'https://ffmpeg.martin-riedl.de/download/macos/arm64/1795207104_9.1/ffmpeg.zip',
    sha256: '1f66e9a690a7f1c9e60b012379f8869c11818d1797f45b21dbb2f2564ba61ae1'
  },
  x64: {
    url: 'https://ffmpeg.martin-riedl.de/download/macos/amd64/1795212433_9.1/ffmpeg.zip',
    sha256: '35b3d82cccc2c1d644d49d15f5e57eb913a08ef68f798042c90eecec62c51f1e'
  }
}

// FFmpegダウンロードURL生成（Windows / macOS 用。Linux はシステムのFFmpegを使用）
export function getFFmpegDownloadUrl(): string {
  const platform = getPlatform()

  // gyan.devのessentialsビルドを使用（軽量版）
  if (platform === 'win32') return 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip'
  if (platform === 'darwin') return MACOS_FFMPEG_DOWNLOADS[getArchitecture()].url

  // Linuxはシステムのffmpegを使用（自動ダウンロード非対応）
  return ''
}

// ダウンロードしたFFmpegアーカイブの期待するSHA256（照合しない場合は null）
// Windows の gyan.dev は常に最新版を指すURLのため、固定のハッシュを持てない
export function getFFmpegDownloadSha256(): string | null {
  if (getPlatform() !== 'darwin') return null
  return MACOS_FFMPEG_DOWNLOADS[getArchitecture()].sha256
}

// FFmpegバイナリ名
export function getFFmpegBinaryName(): string {
  return getPlatform() === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
}
