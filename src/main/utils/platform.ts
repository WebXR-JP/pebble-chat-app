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
