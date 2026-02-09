import { useState, useEffect, useCallback } from 'react'
import type { UpdateInfo } from '../../../shared/types'
import { DEFAULT_UPDATE_INFO } from '../constants/defaults'
import { shouldShowUpdateNotification, isDismissedVersion } from '../utils/update'

const DISMISSED_VERSION_KEY = 'pebble-dismissed-update-version'

export function useUpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>(DEFAULT_UPDATE_INFO)
  const [dismissed, setDismissed] = useState(false)

  // メインプロセスからの自動通知を受け取る
  useEffect(() => {
    const unsubscribe = window.electronAPI.onUpdateAvailable((info) => {
      const dismissedVersion = localStorage.getItem(DISMISSED_VERSION_KEY)
      if (isDismissedVersion(info.latestVersion, dismissedVersion)) return
      setUpdateInfo(info)
      setDismissed(false)
    })
    return unsubscribe
  }, [])

  const dismiss = useCallback(() => {
    setDismissed(true)
    if (updateInfo.latestVersion) {
      localStorage.setItem(DISMISSED_VERSION_KEY, updateInfo.latestVersion)
    }
  }, [updateInfo.latestVersion])

  const openDownload = useCallback(() => {
    if (updateInfo.downloadUrl) {
      window.electronAPI.openExternal(updateInfo.downloadUrl)
    }
  }, [updateInfo.downloadUrl])

  const visible = shouldShowUpdateNotification(updateInfo, dismissed)

  return { updateInfo, visible, dismiss, openDownload }
}
