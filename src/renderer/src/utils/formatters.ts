import type { SetupStatus, StreamStatus } from '../../../shared/types'

// ストリームIDのバリデーション結果
export interface StreamIdValidationResult {
  valid: boolean
  error?: string
}

// ストリームIDのバリデーション
export function validateStreamId(id: string): StreamIdValidationResult {
  if (!id.trim()) {
    return { valid: true } // 空欄はOK（ランダム生成される）
  }
  if (id.length < 3 || id.length > 20) {
    return { valid: false, error: 'ストリームIDは3〜20文字で入力してください' }
  }
  if (!/^[a-zA-Z0-9-]+$/.test(id)) {
    return { valid: false, error: 'ストリームIDは英数字とハイフンのみ使用できます' }
  }
  return { valid: true }
}

// セットアップステータスのアイコンを取得
export function getSetupStatusIcon(status: SetupStatus): string {
  switch (status) {
    case 'ready':
      return '✓'
    case 'downloading':
      return '↓'
    case 'error':
      return '✗'
    default:
      return '○'
  }
}

// セットアップステータスの色を取得
export function getSetupStatusColor(status: SetupStatus): string {
  switch (status) {
    case 'ready':
      return '#5D8A66'
    case 'downloading':
      return '#8B7355'
    case 'error':
      return '#C45C4A'
    default:
      return '#9CA3AF'
  }
}

// ストリームステータスのテキストを取得
export function getStreamStatusText(status: StreamStatus): string {
  switch (status) {
    case 'idle':
      return '待機中'
    case 'starting':
      return '起動中...'
    case 'running':
      return '配信中'
    case 'stopping':
      return '停止中...'
    case 'error':
      return 'エラー'
    default:
      return '不明'
  }
}

// ストリームステータスの色を取得
export function getStreamStatusColor(status: StreamStatus): string {
  switch (status) {
    case 'running':
      return '#4caf50'
    case 'error':
      return '#f44336'
    case 'starting':
    case 'stopping':
      return '#ff9800'
    default:
      return '#9e9e9e'
  }
}

// 接続状態のテキストを取得
export function getConnectionStateText(state: RTCPeerConnectionState | null): string | null {
  if (!state) return null
  switch (state) {
    case 'connecting':
      return '接続中...'
    case 'connected':
      return '配信中'
    case 'disconnected':
      return '切断'
    case 'failed':
      return '接続失敗'
    default:
      return state
  }
}

// ストリームボタンのテキストを取得
export function getStreamButtonText(isLoading: boolean, isStreaming: boolean): string {
  if (isLoading) {
    return isStreaming ? '停止中...' : '開始中...'
  }
  return isStreaming ? '配信停止' : '配信開始'
}

// RTMP URL分割結果
export interface RtmpUrlParts {
  serverUrl: string
  streamKey: string
}

// RTMP URLをサーバーURLとストリームキーに分割する
// 例: "rtmp://pebble.xrift.net:1935/mystream" → { serverUrl: "rtmp://pebble.xrift.net:1935", streamKey: "mystream" }
export function parseRtmpUrl(rtmpUrl: string): RtmpUrlParts | null {
  const lastSlash = rtmpUrl.lastIndexOf('/')
  if (lastSlash <= 0) return null

  const serverUrl = rtmpUrl.substring(0, lastSlash)
  const streamKey = rtmpUrl.substring(lastSlash + 1)
  if (!serverUrl || !streamKey) return null

  return { serverUrl, streamKey }
}
