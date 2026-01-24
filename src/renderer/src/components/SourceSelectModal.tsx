import { useEffect } from 'react'
import { CaptureSource } from '../../../shared/types'

interface Props {
  sources: CaptureSource[]
  isLoading: boolean
  onRefresh: () => void
  onSelect: (sourceId: string) => void
  onCancel: () => void
}

export function SourceSelectModal({
  sources,
  isLoading,
  onRefresh,
  onSelect,
  onCancel
}: Props) {
  // モーダル表示時にソース一覧を取得
  useEffect(() => {
    onRefresh()
  }, [])

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>キャプチャするソースを選択</h3>
          <button style={styles.refreshButton} onClick={onRefresh} disabled={isLoading}>
            更新
          </button>
        </div>

        <div style={styles.sourceList}>
          {isLoading && sources.length === 0 ? (
            <p style={styles.loadingText}>読み込み中...</p>
          ) : sources.length === 0 ? (
            <p style={styles.emptyText}>キャプチャソースが見つかりません</p>
          ) : (
            sources.map((source) => (
              <div
                key={source.id}
                style={styles.sourceItem}
                onClick={() => onSelect(source.id)}
              >
                {source.thumbnail ? (
                  <img
                    src={source.thumbnail}
                    alt={source.name}
                    style={styles.thumbnail}
                  />
                ) : (
                  <div style={styles.thumbnailPlaceholder}>
                    {source.type === 'screen' ? '🖥️' : '🪟'}
                  </div>
                )}
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

        <div style={styles.footer}>
          <button style={styles.cancelButton} onClick={onCancel}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #eee'
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
  sourceList: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px'
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    padding: '40px 0'
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    padding: '40px 0'
  },
  sourceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    ':hover': {
      backgroundColor: '#f5f5f5'
    }
  },
  thumbnail: {
    width: '80px',
    height: '45px',
    objectFit: 'cover',
    borderRadius: '4px',
    backgroundColor: '#f0f0f0'
  },
  thumbnailPlaceholder: {
    width: '80px',
    height: '45px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px'
  },
  sourceInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0
  },
  sourceName: {
    fontSize: '13px',
    color: '#333',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  sourceType: {
    fontSize: '11px',
    color: '#999'
  },
  footer: {
    padding: '12px 20px',
    borderTop: '1px solid #eee',
    display: 'flex',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    padding: '8px 16px',
    fontSize: '13px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer'
  }
}
