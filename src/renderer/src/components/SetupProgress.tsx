import { useTranslation } from 'react-i18next'
import type { SetupProgress as SetupProgressType } from '../../../shared/types'
import { getSetupStatusIcon, getSetupStatusColor } from '../utils/formatters'

interface Props {
  progress: SetupProgressType
  isLoading: boolean
  error: string | null
  onInstall: () => void
}

export function SetupProgress({ progress, isLoading, error, onInstall }: Props) {
  const { t } = useTranslation()

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>{t('setup.title')}</h2>

      <div style={styles.items}>
        <div style={styles.item}>
          <span style={{ ...styles.icon, color: getSetupStatusColor(progress.mediamtx) }}>
            {getSetupStatusIcon(progress.mediamtx)}
          </span>
          <span style={styles.label}>MediaMTX</span>
        </div>

        <div style={styles.item}>
          <span style={{ ...styles.icon, color: getSetupStatusColor(progress.ffmpeg) }}>
            {getSetupStatusIcon(progress.ffmpeg)}
          </span>
          <span style={styles.label}>FFmpeg</span>
        </div>
      </div>

      <p style={styles.message}>{t(progress.message as 'setup.checking')}</p>

      {error && <p style={styles.error}>{error}</p>}

      {error && !isLoading && (
        <button style={styles.button} onClick={onInstall}>
          {t('button.retry')}
        </button>
      )}
    </div>
  )
}

// Pebble（石ころ）カラーパレット
const colors = {
  bgPrimary: '#F7F6F3',
  bgSecondary: '#EDEAE5',
  accent: '#8B7355',
  accentLight: '#A89076',
  error: '#C45C4A',
  errorBg: '#FAE8E5',
  textPrimary: '#3D3D3D',
  textSecondary: '#6B6B6B',
  white: '#FFFFFF',
  border: '#E0DDD8',
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '22px',
    backgroundColor: colors.white,
    borderRadius: '16px',
    marginBottom: '20px',
    border: `1px solid ${colors.border}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
  },
  title: {
    margin: '0 0 18px 0',
    fontSize: '17px',
    fontWeight: 600,
    color: colors.textPrimary
  },
  items: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    backgroundColor: colors.bgPrimary,
    borderRadius: '10px'
  },
  icon: {
    fontSize: '16px',
    fontWeight: 'bold'
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: colors.textPrimary
  },
  message: {
    fontSize: '13px',
    color: colors.textSecondary,
    marginTop: '16px',
    padding: '10px 14px',
    backgroundColor: colors.bgPrimary,
    borderRadius: '8px'
  },
  error: {
    fontSize: '13px',
    color: colors.error,
    marginTop: '10px',
    padding: '10px 14px',
    backgroundColor: colors.errorBg,
    borderRadius: '8px'
  },
  button: {
    marginTop: '16px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentLight} 100%)`,
    color: colors.white,
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(139, 115, 85, 0.3)'
  }
}
