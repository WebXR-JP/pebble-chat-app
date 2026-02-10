import { useTranslation } from 'react-i18next'
import type { StreamInfo } from '../../../shared/types'
import { getStreamStatusText, getStreamStatusColor } from '../utils/formatters'

interface Props {
  streamInfo: StreamInfo
}

export function StatusDisplay({ streamInfo }: Props) {
  const { t } = useTranslation()

  return (
    <div style={styles.container}>
      <div style={styles.statusRow}>
        <span style={styles.label}>{t('status.label')}</span>
        <span style={{ ...styles.status, color: getStreamStatusColor(streamInfo.status) }}>
          {getStreamStatusText(streamInfo.status)}
        </span>
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
