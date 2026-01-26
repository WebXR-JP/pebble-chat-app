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

// cloudflaredダウンロードURL生成
export function getCloudflaredDownloadUrl(version: string): string {
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

  const osName = platformMap[platform]
  const archName = archMap[arch]

  // Windowsはexe、macOSはtgz、Linuxはバイナリ直接
  if (platform === 'win32') {
    return `https://github.com/cloudflare/cloudflared/releases/download/${version}/cloudflared-${osName}-${archName}.exe`
  } else if (platform === 'darwin') {
    return `https://github.com/cloudflare/cloudflared/releases/download/${version}/cloudflared-${osName}-${archName}.tgz`
  } else {
    return `https://github.com/cloudflare/cloudflared/releases/download/${version}/cloudflared-${osName}-${archName}`
  }
}

// cloudflaredバイナリ名
export function getCloudflaredBinaryName(): string {
  return getPlatform() === 'win32' ? 'cloudflared.exe' : 'cloudflared'
}

// FFmpegダウンロードURL生成（Windows用のみ、macOS/LinuxはシステムのFFmpegを使用）
export function getFFmpegDownloadUrl(): string {
  const platform = getPlatform()
  const arch = getArchitecture()

  if (platform === 'win32') {
    // gyan.devのessentialsビルドを使用（軽量版）
    return 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip'
  } else if (platform === 'darwin') {
    // macOS用はevermeet.cxからダウンロード
    if (arch === 'arm64') {
      return 'https://evermeet.cx/ffmpeg/ffmpeg-7.1.zip'
    } else {
      return 'https://evermeet.cx/ffmpeg/ffmpeg-7.1.zip'
    }
  } else {
    // Linuxはシステムのffmpegを使用（自動ダウンロード非対応）
    return ''
  }
}

// FFmpegバイナリ名
export function getFFmpegBinaryName(): string {
  return getPlatform() === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
}
