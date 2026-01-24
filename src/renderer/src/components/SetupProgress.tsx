import type { SetupProgress as SetupProgressType } from '../../../shared/types'

interface Props {
  progress: SetupProgressType
  isLoading: boolean
  error: string | null
  onInstall: () => void
}

export function SetupProgress({ progress, isLoading, error, onInstall }: Props) {
  const getStatusIcon = (status: string) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return '#4caf50'
      case 'downloading':
        return '#2196f3'
      case 'error':
        return '#f44336'
      default:
        return '#9e9e9e'
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>セットアップ</h2>

      <div style={styles.items}>
        <div style={styles.item}>
          <span style={{ ...styles.icon, color: getStatusColor(progress.mediamtx) }}>
            {getStatusIcon(progress.mediamtx)}
          </span>
          <span style={styles.label}>MediaMTX</span>
        </div>

        <div style={styles.item}>
          <span style={{ ...styles.icon, color: getStatusColor(progress.cloudflared) }}>
            {getStatusIcon(progress.cloudflared)}
          </span>
          <span style={styles.label}>cloudflared</span>
        </div>
      </div>

      <p style={styles.message}>{progress.message}</p>

      {error && <p style={styles.error}>{error}</p>}

      {error && !isLoading && (
        <button style={styles.button} onClick={onInstall}>
          リトライ
        </button>
      )}
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  title: {
    margin: '0 0 16px 0',
    fontSize: '18px'
  },
  items: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  icon: {
    fontSize: '16px',
    fontWeight: 'bold'
  },
  label: {
    fontSize: '14px'
  },
  message: {
    fontSize: '12px',
    color: '#666',
    marginTop: '12px'
  },
  error: {
    fontSize: '12px',
    color: '#f44336',
    marginTop: '8px'
  },
  button: {
    marginTop: '16px',
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
}
