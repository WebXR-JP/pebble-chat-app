import { useEffect } from 'react'
import { CaptureSource } from '../../../shared/types'

interface Props {
  sources: CaptureSource[]
  selectedSourceId: string | null
  isLoading: boolean
  isCapturing: boolean
  connectionState: RTCPeerConnectionState | null
  onRefresh: () => void
  onSelect: (sourceId: string) => void
  onStartCapture: () => void
  onStopCapture: () => void
}

export function CaptureSourceSelector({
  sources,
  selectedSourceId,
  isLoading,
  isCapturing,
  connectionState,
  onRefresh,
  onSelect,
  onStartCapture,
  onStopCapture
}: Props) {
  // 初回マウント時にソース一覧を取得
  useEffect(() => {
    onRefresh()
  }, [])

  const getConnectionStateText = () => {
    if (!connectionState) return null
    switch (connectionState) {
      case 'connecting':
        return '接続中...'
      case 'connected':
        return '配信中'
      case 'disconnected':
        return '切断'
      case 'failed':
        return '接続失敗'
      default:
        return connectionState
    }
  }

  const connectionStateText = getConnectionStateText()

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>キャプチャソース</h3>
        <button
          style={styles.refreshButton}
          onClick={onRefresh}
          disabled={isLoading || isCapturing}
        >
          更新
        </button>
      </div>

      {isCapturing && connectionStateText && (
        <div style={styles.statusBar}>
          <span
            style={{
              ...styles.statusDot,
              backgroundColor: connectionState === 'connected' ? '#4caf50' : '#ff9800'
            }}
          />
          {connectionStateText}
        </div>
      )}

      <div style={styles.sourceList}>
        {sources.length === 0 ? (
          <p style={styles.emptyText}>
            {isLoading ? '読み込み中...' : 'キャプチャソースが見つかりません'}
          </p>
        ) : (
          sources.map((source) => (
            <div
              key={source.id}
              style={{
                ...styles.sourceItem,
                borderColor: source.id === selectedSourceId ? '#2196f3' : '#ddd',
                opacity: isCapturing && source.id !== selectedSourceId ? 0.5 : 1
              }}
              onClick={() => !isCapturing && onSelect(source.id)}
            >
              <img
                src={source.thumbnail}
                alt={source.name}
                style={styles.thumbnail}
              />
              <div style={styles.sourceInfo}>
                <span style={styles.sourceName}>{source.name}</span>
                <span style={styles.sourceType}>
                  {source.type === 'screen' ? '画面' : 'ウィンドウ'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={styles.controls}>
        {isCapturing ? (
          <button
            style={{ ...styles.button, backgroundColor: '#f44336' }}
            onClick={onStopCapture}
            disabled={isLoading}
          >
            {isLoading ? '停止中...' : 'キャプチャ停止'}
          </button>
        ) : (
          <button
            style={{
              ...styles.button,
              backgroundColor: '#4caf50',
              opacity: !selectedSourceId || isLoading ? 0.6 : 1
            }}
            onClick={onStartCapture}
            disabled={!selectedSourceId || isLoading}
          >
            {isLoading ? '開始中...' : 'キャプチャ開始'}
          </button>
        )}
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginBottom: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  title: {
    margin: 0,
    fontSize: '16px',
    color: '#333'
  },
  refreshButton: {
    padding: '6px 12px',
    fontSize: '12px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    marginBottom: '12px',
    fontSize: '13px',
    color: '#666'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%'
  },
  sourceList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '12px',
    maxHeight: '300px',
    overflowY: 'auto',
    marginBottom: '16px'
  },
  sourceItem: {
    padding: '8px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'border-color 0.2s, opacity 0.2s'
  },
  thumbnail: {
    width: '100%',
    aspectRatio: '16/9',
    objectFit: 'cover',
    borderRadius: '4px',
    marginBottom: '8px'
  },
  sourceInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  sourceName: {
    fontSize: '12px',
    color: '#333',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  sourceType: {
    fontSize: '10px',
    color: '#999'
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: '13px',
    gridColumn: '1 / -1'
  },
  controls: {
    display: 'flex',
    justifyContent: 'center'
  },
  button: {
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  }
}
