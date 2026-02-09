// 配信状態
export type StreamStatus = 'idle' | 'starting' | 'running' | 'stopping' | 'error'

// パイプライン各段階のステータス
export type PipelineStageStatus = 'pending' | 'running' | 'connected' | 'ready' | 'error' | 'timeout'

// パイプラインステータス
export interface PipelineStatus {
  mediamtx: PipelineStageStatus
  rtmp: PipelineStageStatus
  hls: PipelineStageStatus
}

// キャプチャソース
export interface CaptureSource {
  id: string
  name: string
  thumbnail: string
  type: 'screen' | 'window'
}

// キャプチャ状態
export type CaptureStatus = 'idle' | 'capturing' | 'error'

// 画面収録権限の状態（macOS）
export type ScreenRecordingPermission = 'granted' | 'denied' | 'not-determined' | 'restricted' | 'unknown'

// キャプチャソース取得結果（権限状態を含む）
export interface CaptureSourcesResult {
  sources: CaptureSource[]
  permission: ScreenRecordingPermission
}

// キャプチャ情報
export interface CaptureInfo {
  status: CaptureStatus
  sourceId: string | null
  sourceName: string | null
  error: string | null
}

// セットアップ状態
export type SetupStatus = 'pending' | 'downloading' | 'ready' | 'error'

// セットアップ進捗
export interface SetupProgress {
  mediamtx: SetupStatus
  ffmpeg: SetupStatus
  message: string
}

// 配信情報
export interface StreamInfo {
  status: StreamStatus
  rtmpUrl: string | null
  hlsUrl: string | null
  publicUrl: string | null
  readyForPlayback: boolean  // HLSエンドポイントが実際に再生可能かどうか
  error: string | null
  pipelineStatus?: PipelineStatus
}

// アップデート情報
export interface UpdateInfo {
  available: boolean
  currentVersion: string
  latestVersion: string
  downloadUrl: string | null
  releaseDate: string | null
}

// バージョンマニフェスト（R2のversion.json）
export interface VersionManifest {
  version: string
  releaseDate: string
  downloads: Record<string, string>
}

// プラットフォーム情報
export type Platform = 'darwin' | 'win32' | 'linux'
export type Architecture = 'x64' | 'arm64'

// MediaMTX設定
export interface MediaMTXConfig {
  rtmpPort: number
  hlsPort: number
}

// IPC チャンネル
export const IPC_CHANNELS = {
  // セットアップ
  SETUP_CHECK: 'setup:check',
  SETUP_INSTALL: 'setup:install',
  SETUP_PROGRESS: 'setup:progress',

  // 配信
  STREAM_START: 'stream:start',
  STREAM_STOP: 'stream:stop',
  STREAM_STATUS: 'stream:status',

  // キャプチャ
  CAPTURE_GET_SOURCES: 'capture:getSources',
  CAPTURE_START: 'capture:start',
  CAPTURE_STOP: 'capture:stop',
  CAPTURE_STATUS: 'capture:status',
  CAPTURE_OPEN_SETTINGS: 'capture:openSettings',

  // 設定
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',

  // アップデート
  UPDATE_CHECK: 'update:check',
  UPDATE_AVAILABLE: 'update:available',
  OPEN_EXTERNAL: 'util:openExternal',

  // ウィンドウ
  WINDOW_RESIZE: 'window:resize',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_GET_PLATFORM: 'window:getPlatform'
} as const

// IPC API 型定義
export interface ElectronAPI {
  // セットアップ
  checkSetup: () => Promise<SetupProgress>
  installBinaries: () => Promise<void>
  onSetupProgress: (callback: (progress: SetupProgress) => void) => () => void

  // 配信
  startStream: (streamId?: string) => Promise<StreamInfo>
  stopStream: () => Promise<void>
  onStreamStatus: (callback: (info: StreamInfo) => void) => () => void
  getStreamStatus: () => Promise<StreamInfo>

  // キャプチャ
  getCaptureSources: () => Promise<CaptureSourcesResult>
  startCapture: (sourceId: string) => Promise<CaptureInfo>
  stopCapture: () => Promise<void>
  onCaptureStatus: (callback: (info: CaptureInfo) => void) => () => void
  getCaptureStatus: () => Promise<CaptureInfo>
  openScreenRecordingSettings: () => Promise<void>

  // アップデート
  checkForUpdate: () => Promise<UpdateInfo>
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => () => void
  openExternal: (url: string) => Promise<void>

  // ウィンドウ
  resizeWindow: (height: number) => Promise<void>
  minimizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  getPlatform: () => Promise<Platform>
}
