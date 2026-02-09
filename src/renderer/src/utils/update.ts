import type { UpdateInfo } from '../../../shared/types'

// 通知を表示すべきかどうか判定
export function shouldShowUpdateNotification(
  info: UpdateInfo,
  dismissed: boolean
): boolean {
  return info.available && !dismissed
}

// dismiss済みバージョンと一致するか判定
export function isDismissedVersion(
  latestVersion: string,
  dismissedVersion: string | null
): boolean {
  if (!dismissedVersion) return false
  return dismissedVersion === latestVersion
}
