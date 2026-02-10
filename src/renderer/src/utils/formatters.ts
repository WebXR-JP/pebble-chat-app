import type { SetupStatus, StreamStatus } from '../../../shared/types'
import { i18n } from '../i18n'

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
    return { valid: false, error: i18n.t('streamId.errorLength') }
  }
  if (!/^[a-zA-Z0-9-]+$/.test(id)) {
    return { valid: false, error: i18n.t('streamId.errorChars') }
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
      return i18n.t('status.idle')
    case 'starting':
      return i18n.t('status.starting')
    case 'running':
      return i18n.t('status.running')
    case 'stopping':
      return i18n.t('status.stopping')
    case 'error':
      return i18n.t('status.error')
    default:
      return i18n.t('status.unknown')
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
      return i18n.t('connection.connecting')
    case 'connected':
      return i18n.t('connection.connected')
    case 'disconnected':
      return i18n.t('connection.disconnected')
    case 'failed':
      return i18n.t('connection.failed')
    default:
      return state
  }
}

// ストリームボタンのテキストを取得
export function getStreamButtonText(isLoading: boolean, isStreaming: boolean): string {
  if (isLoading) {
    return isStreaming ? i18n.t('button.stopping') : i18n.t('button.starting')
  }
  return isStreaming ? i18n.t('button.stop') : i18n.t('button.start')
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
