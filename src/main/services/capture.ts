import { desktopCapturer, systemPreferences } from 'electron'
import { CaptureSource, CaptureInfo } from '../../shared/types'

// キャプチャ状態
let captureInfo: CaptureInfo = {
  status: 'idle',
  sourceId: null,
  sourceName: null,
  error: null
}

// キャプチャソース一覧を取得
export async function getCaptureSources(): Promise<CaptureSource[]> {
  // macOSの場合、画面収録権限をチェック
  if (process.platform === 'darwin') {
    const status = systemPreferences.getMediaAccessStatus('screen')

    if (status !== 'granted') {
      // 権限がない場合は空配列を返す（UIで権限リクエストを促す）
      return []
    }
  }

  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    thumbnailSize: { width: 320, height: 180 },
    fetchWindowIcons: true
  })

  return sources.map((source) => ({
    id: source.id,
    name: source.name,
    thumbnail: source.thumbnail.toDataURL(),
    type: source.id.startsWith('screen:') ? 'screen' : 'window'
  }))
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
