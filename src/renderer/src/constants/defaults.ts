import type { SetupProgress, CaptureSource, CaptureInfo, StreamInfo } from '../../../shared/types'

export const DEFAULT_SETUP_PROGRESS: SetupProgress = {
  mediamtx: 'pending',
  ffmpeg: 'pending',
  message: '確認中...'
}

export const DEFAULT_CAPTURE_SOURCES: CaptureSource[] = []

export const DEFAULT_CAPTURE_INFO: CaptureInfo = {
  status: 'idle',
  sourceId: null,
  sourceName: null,
  error: null
}

export const DEFAULT_STREAM_INFO: StreamInfo = {
  status: 'idle',
  rtmpUrl: null,
  hlsUrl: null,
  publicUrl: null,
  readyForPlayback: false,
  error: null
}
