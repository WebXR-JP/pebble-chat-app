import { getStreamButtonText } from '../utils/formatters'

interface Props {
  isStreaming: boolean
  isLoading: boolean
  isReady: boolean
  onStart: () => void
  onStop: () => void
}

export function StreamControls({ isStreaming, isLoading, isReady, onStart, onStop }: Props) {
  return (
    <div style={styles.container}>
      <button
        style={{
          ...styles.button,
          backgroundColor: isStreaming ? '#f44336' : '#4caf50',
          opacity: !isReady || isLoading ? 0.6 : 1
        }}
        onClick={isStreaming ? onStop : onStart}
        disabled={!isReady || isLoading}
      >
        {getStreamButtonText(isLoading, isStreaming)}
      </button>

      {!isReady && <p style={styles.hint}>セットアップを完了してください</p>}
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '20px'
  },
  button: {
    padding: '16px 48px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  },
  hint: {
    fontSize: '12px',
    color: '#666',
    marginTop: '8px'
  }
}
