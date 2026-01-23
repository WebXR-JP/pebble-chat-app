// 配信状態
export type StreamStatus = 'idle' | 'starting' | 'running' | 'stopping' | 'error'

// セットアップ状態
export type SetupStatus = 'pending' | 'downloading' | 'ready' | 'error'

// セットアップ進捗
export interface SetupProgress {
  mediamtx: SetupStatus
  cloudflared: SetupStatus
  message: string
}

// 配信情報
export interface StreamInfo {
  status: StreamStatus
  rtmpUrl: string | null
  hlsUrl: string | null
  publicUrl: string | null
  error: string | null
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

  // 設定
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set'
} as const

// IPC API 型定義
export interface ElectronAPI {
  // セットアップ
  checkSetup: () => Promise<SetupProgress>
  installBinaries: () => Promise<void>
  onSetupProgress: (callback: (progress: SetupProgress) => void) => () => void

  // 配信
  startStream: () => Promise<StreamInfo>
  stopStream: () => Promise<void>
  onStreamStatus: (callback: (info: StreamInfo) => void) => () => void
  getStreamStatus: () => Promise<StreamInfo>
}
