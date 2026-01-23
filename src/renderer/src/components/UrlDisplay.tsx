import { useState } from 'react'
import type { StreamInfo } from '../../../shared/types'

interface Props {
  streamInfo: StreamInfo
}

export function UrlDisplay({ streamInfo }: Props) {
  const [copied, setCopied] = useState<string | null>(null)

  if (streamInfo.status !== 'running') {
    return null
  }

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>配信URL</h3>

      {/* OBS設定 */}
      <div style={styles.section}>
        <label style={styles.label}>OBS RTMP URL:</label>
        <div style={styles.urlRow}>
          <code style={styles.url}>{streamInfo.rtmpUrl}</code>
          <button
            style={styles.copyButton}
            onClick={() => copyToClipboard(streamInfo.rtmpUrl!, 'rtmp')}
          >
            {copied === 'rtmp' ? 'コピーしました' : 'コピー'}
          </button>
        </div>
      </div>

      {/* 公開URL */}
      {streamInfo.publicUrl && (
        <div style={styles.section}>
          <label style={styles.label}>公開URL (iwaSync用):</label>
          <div style={styles.urlRow}>
            <code style={styles.url}>{streamInfo.publicUrl}</code>
            <button
              style={styles.copyButton}
              onClick={() => copyToClipboard(streamInfo.publicUrl!, 'public')}
            >
              {copied === 'public' ? 'コピーしました' : 'コピー'}
            </button>
          </div>
        </div>
      )}

      {/* ローカルHLS (デバッグ用) */}
      <div style={styles.section}>
        <label style={styles.label}>ローカルHLS (確認用):</label>
        <div style={styles.urlRow}>
          <code style={styles.urlSmall}>{streamInfo.hlsUrl}</code>
        </div>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '16px',
    backgroundColor: '#e8f5e9',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '16px'
  },
  section: {
    marginBottom: '12px'
  },
  label: {
    fontSize: '12px',
    color: '#666',
    display: 'block',
    marginBottom: '4px'
  },
  urlRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  url: {
    flex: 1,
    padding: '8px',
    backgroundColor: 'white',
    borderRadius: '4px',
    fontSize: '12px',
    wordBreak: 'break-all'
  },
  urlSmall: {
    flex: 1,
    padding: '4px 8px',
    backgroundColor: 'white',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#666',
    wordBreak: 'break-all'
  },
  copyButton: {
    padding: '8px 12px',
    fontSize: '12px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  }
}
