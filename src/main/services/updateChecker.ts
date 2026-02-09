import { app } from 'electron'
import os from 'os'
import type { UpdateInfo, Platform, Architecture } from '../../shared/types'
import { isNewerVersion, isValidVersionManifest, getDownloadKey } from '../utils/version'

const VERSION_URL =
  'https://pub-6e0518c74c774e0f9982db12e9536191.r2.dev/releases/version.json'

const FETCH_TIMEOUT_MS = 5000

export async function checkForUpdate(): Promise<UpdateInfo> {
  const currentVersion = app.getVersion()
  const noUpdate: UpdateInfo = {
    available: false,
    currentVersion,
    latestVersion: currentVersion,
    downloadUrl: null,
    releaseDate: null
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const response = await fetch(VERSION_URL, {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' }
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      console.log(`[UpdateChecker] Failed to fetch version.json: ${response.status}`)
      return noUpdate
    }

    const data: unknown = await response.json()
    if (!isValidVersionManifest(data)) {
      console.log('[UpdateChecker] Invalid version manifest')
      return noUpdate
    }

    if (!isNewerVersion(currentVersion, data.version)) {
      console.log(`[UpdateChecker] Up to date (current: ${currentVersion}, remote: ${data.version})`)
      return noUpdate
    }

    const platform = process.platform as Platform
    const arch = os.arch() as Architecture
    const downloadKey = getDownloadKey(platform, arch)
    const downloadUrl = data.downloads[downloadKey] || null

    console.log(`[UpdateChecker] Update available: ${currentVersion} → ${data.version}`)

    return {
      available: true,
      currentVersion,
      latestVersion: data.version,
      downloadUrl,
      releaseDate: data.releaseDate
    }
  } catch (error) {
    // ネットワークエラー等はサイレントに失敗
    console.log(`[UpdateChecker] Check failed: ${error instanceof Error ? error.message : String(error)}`)
    return noUpdate
  }
}
