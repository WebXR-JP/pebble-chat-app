import { desktopCapturer, systemPreferences, shell } from 'electron'
import { CaptureSource, CaptureInfo, ScreenRecordingPermission, CaptureSourcesResult } from '../../shared/types'

// キャプチャ状態
let captureInfo: CaptureInfo = {
  status: 'idle',
  sourceId: null,
  sourceName: null,
  error: null
}

// 画面収録権限の状態を取得
export function getScreenRecordingPermissionStatus(): ScreenRecordingPermission {
  if (process.platform !== 'darwin') {
    // macOS以外は常に許可とみなす
    return 'granted'
  }

  const status = systemPreferences.getMediaAccessStatus('screen')

  switch (status) {
    case 'granted':
      return 'granted'
    case 'denied':
      return 'denied'
    case 'not-determined':
      return 'not-determined'
    case 'restricted':
      return 'restricted'
    default:
      return 'unknown'
  }
}

// システム設定の画面収録設定を開く
export async function openScreenRecordingSettings(): Promise<void> {
  if (process.platform === 'darwin') {
    // macOSのシステム設定（プライバシーとセキュリティ > 画面収録）を開く
    await shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture')
  }
}

// キャプチャソース一覧を取得（権限状態を含む）
export async function getCaptureSources(): Promise<CaptureSourcesResult> {
  const permission = getScreenRecordingPermissionStatus()

  // macOSで権限がない場合は空配列を返す
  if (process.platform === 'darwin' && permission !== 'granted') {
    return {
      sources: [],
      permission
    }
  }

  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    thumbnailSize: { width: 320, height: 180 },
    fetchWindowIcons: true
  })

  const captureSourceList: CaptureSource[] = sources.map((source) => {
    // サムネイルが空の場合は空文字を返す（UI側でプレースホルダー表示）
    let thumbnail = ''
    if (!source.thumbnail.isEmpty()) {
      // toPNG()でBufferに変換してからBase64データURLを生成
      const pngBuffer = source.thumbnail.toPNG()
      thumbnail = `data:image/png;base64,${pngBuffer.toString('base64')}`
    }
    return {
      id: source.id,
      name: source.name,
      thumbnail,
      type: source.id.startsWith('screen:') ? 'screen' : 'window'
    }
  })

  return {
    sources: captureSourceList,
    permission
  }
}

// キャプチャ開始（状態管理のみ、実際のキャプチャはレンダラーで行う）
export function startCaptureSession(sourceId: string, sourceName: string): CaptureInfo {
  captureInfo = {
    status: 'capturing',
    sourceId,
    sourceName,
    error: null
  }
  return captureInfo
}

// キャプチャ停止
export function stopCaptureSession(): void {
  captureInfo = {
    status: 'idle',
    sourceId: null,
    sourceName: null,
    error: null
  }
}

// キャプチャエラー設定
export function setCaptureError(error: string): void {
  captureInfo = {
    ...captureInfo,
    status: 'error',
    error
  }
}

// キャプチャ状態取得
export function getCaptureStatus(): CaptureInfo {
  return captureInfo
}
