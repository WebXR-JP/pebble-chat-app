import type { Platform, Architecture, VersionManifest } from '../../shared/types'

// バージョン文字列を [major, minor, patch] にパース
export function parseVersion(version: string): [number, number, number] | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/)
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

// リモートバージョンが現在バージョンより新しいか判定
export function isNewerVersion(current: string, remote: string): boolean {
  const currentParts = parseVersion(current)
  const remoteParts = parseVersion(remote)
  if (!currentParts || !remoteParts) return false

  for (let i = 0; i < 3; i++) {
    if (remoteParts[i] > currentParts[i]) return true
    if (remoteParts[i] < currentParts[i]) return false
  }
  return false
}

// version.json のバリデーション
export function isValidVersionManifest(data: unknown): data is VersionManifest {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  if (typeof obj.version !== 'string') return false
  if (typeof obj.releaseDate !== 'string') return false
  if (typeof obj.downloads !== 'object' || obj.downloads === null) return false
  // version が有効なセマンティックバージョンか
  if (!parseVersion(obj.version)) return false
  return true
}

// プラットフォームとアーキテクチャに対応するダウンロードキーを取得
export function getDownloadKey(platform: Platform, arch: Architecture): string {
  const keyMap: Record<string, string> = {
    'darwin-arm64': 'mac-arm64',
    'darwin-x64': 'mac-x64',
    'win32-x64': 'win-x64',
    'win32-arm64': 'win-x64', // Windows arm64 は x64 版を使用
    'linux-x64': 'linux-x64',
    'linux-arm64': 'linux-arm64'
  }
  return keyMap[`${platform}-${arch}`] || `${platform}-${arch}`
}
