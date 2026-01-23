import type { StreamInfo } from '../../../shared/types'

interface Props {
  streamInfo: StreamInfo
}

export function StatusDisplay({ streamInfo }: Props) {
  const getStatusText = () => {
    switch (streamInfo.status) {
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

  const getStatusColor = () => {
    switch (streamInfo.status) {
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

  return (
    <div style={styles.container}>
      <div style={styles.statusRow}>
        <span style={styles.label}>ステータス:</span>
        <span style={{ ...styles.status, color: getStatusColor() }}>{getStatusText()}</span>
      </div>

      {streamInfo.error && <p style={styles.error}>{streamInfo.error}</p>}
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    color: '#666'
  },
  status: {
    fontSize: '16px',
    fontWeight: 'bold'
  },
  error: {
    fontSize: '12px',
    color: '#f44336',
    marginTop: '8px'
  }
}
