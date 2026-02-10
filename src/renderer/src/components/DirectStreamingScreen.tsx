import { useTranslation } from 'react-i18next'
import type { StreamInfo, CaptureSource, Platform, PipelineStageStatus } from '../../../shared/types'
import { UrlDisplay } from './UrlDisplay'

// パイプライン段階の定義
interface PipelineStage {
  key: string
  labelKey: string
  getStatus: (streamInfo: StreamInfo, connectionState: RTCPeerConnectionState | null) => PipelineStageStatus
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    key: 'mediamtx',
    labelKey: 'MediaMTX',
    getStatus: (streamInfo) => streamInfo.pipelineStatus?.mediamtx ?? 'pending'
  },
  {
    key: 'whip',
    labelKey: 'WHIP',
    getStatus: (_streamInfo, connectionState) => {
      if (!connectionState) return 'pending'
      if (connectionState === 'connected') return 'connected'
      if (connectionState === 'failed' || connectionState === 'disconnected' || connectionState === 'closed') return 'error'
      return 'running'
    }
  },
  {
    key: 'rtmp',
    labelKey: 'pipeline.serverConnection',
    getStatus: (streamInfo) => streamInfo.pipelineStatus?.rtmp ?? 'pending'
  },
  {
    key: 'hls',
    labelKey: 'pipeline.hlsDelivery',
    getStatus: (streamInfo) => streamInfo.pipelineStatus?.hls ?? 'pending'
  }
]

function getStageIcon(status: PipelineStageStatus): string {
  switch (status) {
    case 'connected':
    case 'ready':
      return '\u2713'
    case 'error':
    case 'timeout':
      return '\u2717'
    default:
      return '\u25CB'
  }
}

function getStageColor(status: PipelineStageStatus): string {
  switch (status) {
    case 'connected':
    case 'ready':
      return '#4caf50'
    case 'error':
    case 'timeout':
      return '#C45C4A'
    case 'running':
      return '#ff9800'
    default:
      return '#9B9B9B'
  }
}

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
  const { t } = useTranslation()
  const isError = streamInfo.status === 'error'

  const getStatusColor = (): string => {
    if (isError) return '#C45C4A'
    if (connectionState === 'connected') {
      return streamInfo.readyForPlayback ? '#4caf50' : '#ff9800'
    }
    return '#ff9800'
  }

  const getStatusText = (): string => {
    if (isError) return t('status.error')
    if (connectionState === 'connected') {
      return streamInfo.readyForPlayback ? t('status.running') : t('status.preparing')
    }
    return t('button.connecting')
  }

  // パイプラインが表示可能か（starting or running or error のとき）
  const showPipeline = streamInfo.status === 'starting' || streamInfo.status === 'running' || isError

  // パイプラインラベルの解決（翻訳キーかそのまま表示か）
  const getStageLabelText = (labelKey: string): string => {
    if (labelKey.includes('.')) return t(labelKey as 'pipeline.serverConnection')
    return labelKey
  }

  return (
    <div style={{
      ...styles.streamingScreen,
      paddingTop: platform === 'win32' ? '8px' : '32px'
    }}>
      {/* ステータス */}
      <div style={{
        ...styles.statusCard,
        ...(isError ? styles.statusCardError : {})
      }}>
        <div style={styles.statusHeader}>
          <span
            style={{
              ...styles.statusDot,
              backgroundColor: getStatusColor()
            }}
          />
          <span style={{
            ...styles.statusText,
            color: isError ? '#C45C4A' : colors.success
          }}>{getStatusText()}</span>
        </div>

        {/* エラーメッセージ */}
        {isError && streamInfo.error && (
          <div style={styles.errorMessage}>
            {streamInfo.error}
          </div>
        )}

        {/* パイプラインステータス */}
        {showPipeline && (
          <div style={styles.pipelineContainer}>
            {PIPELINE_STAGES.map((stage) => {
              const status = stage.getStatus(streamInfo, connectionState)
              return (
                <div key={stage.key} style={styles.pipelineStage}>
                  <span style={{
                    ...styles.pipelineIcon,
                    color: getStageColor(status)
                  }}>
                    {getStageIcon(status)}
                  </span>
                  <span style={{
                    ...styles.pipelineLabel,
                    color: getStageColor(status)
                  }}>
                    {getStageLabelText(stage.labelKey)}
                  </span>
                </div>
              )
            })}
          </div>
        )}

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
                {selectedSource.type === 'screen' ? t('source.tabScreen') : t('source.tabWindow')}
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
          {t('streaming.notice')}
        </span>
      </div>

      {/* 停止/接続中ボタン */}
      {isLoading && !isCapturing ? (
        <button style={styles.connectingButton} disabled>
          {t('button.connecting')}
        </button>
      ) : (
        <button style={styles.stopButton} onClick={onStop}>
          {t('button.stop')}
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
  statusCardError: {
    backgroundColor: '#FEF2F0',
    border: '1px solid rgba(196, 92, 74, 0.2)'
  },
  errorMessage: {
    marginTop: '10px',
    padding: '10px 12px',
    backgroundColor: 'rgba(196, 92, 74, 0.08)',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#C45C4A',
    lineHeight: 1.5
  },
  pipelineContainer: {
    display: 'flex',
    gap: '12px',
    marginTop: '12px',
    padding: '10px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: '8px'
  },
  pipelineStage: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  pipelineIcon: {
    fontSize: '12px',
    fontWeight: 700
  },
  pipelineLabel: {
    fontSize: '11px',
    fontWeight: 500
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
