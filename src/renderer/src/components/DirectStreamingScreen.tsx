import type { StreamInfo, CaptureSource, Platform } from '../../../shared/types'
import { UrlDisplay } from './UrlDisplay'

interface Props {
  streamInfo: StreamInfo
  connectionState: RTCPeerConnectionState | null
  selectedSource: CaptureSource | null
  onStop: () => void
  isLoading: boolean
  isCapturing: boolean
  platform: Platform | null
}

export function DirectStreamingScreen({
  streamInfo,
  connectionState,
  selectedSource,
  onStop,
  isLoading,
  isCapturing,
  platform
}: Props) {
  const getStatusColor = (): string => {
    if (connectionState === 'connected') {
      return streamInfo.readyForPlayback ? '#4caf50' : '#ff9800'
    }
    return '#ff9800'
  }

  const getStatusText = (): string => {
    if (connectionState === 'connected') {
      return streamInfo.readyForPlayback ? '配信中' : '準備中...'
    }
    return '接続中...'
  }

  return (
    <div style={{
      ...styles.streamingScreen,
      paddingTop: platform === 'win32' ? '8px' : '32px'
    }}>
      {/* ステータス */}
      <div style={styles.statusCard}>
        <div style={styles.statusHeader}>
          <span
            style={{
              ...styles.statusDot,
              backgroundColor: getStatusColor()
            }}
          />
          <span style={styles.statusText}>{getStatusText()}</span>
        </div>

        {/* 選択中のソース情報 */}
        {selectedSource && (
          <div style={styles.sourcePreview}>
            {selectedSource.thumbnail ? (
              <img
                src={selectedSource.thumbnail}
                alt={selectedSource.name}
                style={styles.previewThumbnail}
              />
            ) : (
              <div style={styles.previewPlaceholder}>
                {selectedSource.type === 'screen' ? '🖥️' : '🪟'}
              </div>
            )}
            <div style={styles.previewInfo}>
              <span style={styles.previewName}>{selectedSource.name}</span>
              <span style={styles.previewType}>
                {selectedSource.type === 'screen' ? '画面' : 'ウィンドウ'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* URL表示 */}
      <UrlDisplay streamInfo={streamInfo} />

      {/* 注意書き */}
      <div style={styles.notice}>
        <span style={styles.noticeText}>
          無料サーバーで運用中のため、遅延4秒以上・画質480pでの配信となります
        </span>
      </div>

      {/* 停止/接続中ボタン */}
      {isLoading && !isCapturing ? (
        <button style={styles.connectingButton} disabled>
          接続中...
        </button>
      ) : (
        <button style={styles.stopButton} onClick={onStop}>
          配信停止
        </button>
      )}
    </div>
  )
}

// Pebble（石ころ）カラーパレット
const colors = {
  bgSecondary: '#EDEAE5',
  success: '#5D8A66',
  successBg: '#E8F0EA',
  error: '#C45C4A',
  textPrimary: '#3D3D3D',
  textMuted: '#9B9B9B',
  white: '#FFFFFF',
  border: '#E0DDD8',
  stone: '#6B7280',
  stoneLight: '#9CA3AF',
}

const styles: { [key: string]: React.CSSProperties } = {
  streamingScreen: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    paddingTop: '32px',
    flex: 1
  },
  statusCard: {
    padding: '20px',
    backgroundColor: colors.successBg,
    borderRadius: '14px',
    border: '1px solid rgba(93, 138, 102, 0.2)'
  },
  statusHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    boxShadow: '0 0 8px rgba(93, 138, 102, 0.5)'
  },
  statusText: {
    fontSize: '15px',
    fontWeight: 600,
    color: colors.success
  },
  sourcePreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '14px',
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '10px',
    border: `1px solid ${colors.border}`
  },
  previewThumbnail: {
    width: '100px',
    height: '56px',
    objectFit: 'cover',
    borderRadius: '6px',
    border: `1px solid ${colors.border}`
  },
  previewPlaceholder: {
    width: '100px',
    height: '56px',
    backgroundColor: colors.bgSecondary,
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    border: `1px solid ${colors.border}`
  },
  previewInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0
  },
  previewName: {
    fontSize: '13px',
    color: colors.textPrimary,
    fontWeight: 500,
    wordBreak: 'break-word'
  },
  previewType: {
    fontSize: '11px',
    color: colors.textMuted
  },
  notice: {
    padding: '10px 14px',
    backgroundColor: colors.bgSecondary,
    borderRadius: '10px',
    border: `1px solid ${colors.border}`
  },
  noticeText: {
    fontSize: '11px',
    color: colors.textMuted,
    lineHeight: 1.5
  },
  stopButton: {
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: 600,
    color: colors.white,
    background: `linear-gradient(135deg, ${colors.error} 0%, #D4776A 100%)`,
    border: 'none',
    borderRadius: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(196, 92, 74, 0.35)',
    transition: 'all 0.2s ease',
    marginTop: 'auto'
  },
  connectingButton: {
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: 600,
    color: colors.white,
    background: `linear-gradient(135deg, ${colors.stoneLight} 0%, ${colors.stone} 100%)`,
    border: 'none',
    borderRadius: '14px',
    cursor: 'not-allowed',
    marginTop: 'auto',
    opacity: 0.7
  }
}
