import { useState, useEffect, useCallback } from 'react'
import type { StreamInfo } from '../../../shared/types'

// スケルトンアニメーション用のスタイルを動的に追加
const SKELETON_STYLE_ID = 'skeleton-animation-style'
function injectSkeletonStyle() {
  if (document.getElementById(SKELETON_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = SKELETON_STYLE_ID
  style.textContent = `
    @keyframes skeleton-shimmer {
      0% { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }
    .skeleton-shimmer {
      background: linear-gradient(
        90deg,
        #E0DDD8 0%,
        #F7F6F3 50%,
        #E0DDD8 100%
      );
      background-size: 200% 100%;
      animation: skeleton-shimmer 1.5s ease-in-out infinite;
    }
  `
  document.head.appendChild(style)
}

interface Props {
  streamInfo: StreamInfo
}

export function UrlDisplay({ streamInfo }: Props) {
  const [copied, setCopied] = useState<string | null>(null)
  const isLoading = !streamInfo.readyForPlayback || !streamInfo.publicUrl

  useEffect(() => {
    injectSkeletonStyle()
  }, [])

  const handleCopyPublicUrl = useCallback(async () => {
    if (!streamInfo.publicUrl) return
    try {
      await navigator.clipboard.writeText(streamInfo.publicUrl)
      setCopied('public')
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // コピー失敗は無視
    }
  }, [streamInfo.publicUrl])

  if (isLoading) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>公開URL</h3>
        <div style={styles.section}>
          <div style={styles.skeletonLabel} className="skeleton-shimmer" />
          <div style={styles.skeletonUrl} className="skeleton-shimmer" />
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>公開URL</h3>

      <div style={styles.section}>
        <label style={styles.label}>公開URL (iwaSync用):</label>
        <div style={styles.urlRow}>
          <code style={styles.url}>{streamInfo.publicUrl}</code>
          <button style={styles.copyButton} onClick={handleCopyPublicUrl}>
            {copied === 'public' ? 'コピー済み' : 'コピー'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Pebble（石ころ）カラーパレット
const colors = {
  bgPrimary: '#F7F6F3',
  accent: '#8B7355',
  accentLight: '#A89076',
  textPrimary: '#3D3D3D',
  textSecondary: '#6B6B6B',
  white: '#FFFFFF',
  border: '#E0DDD8',
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '18px',
    backgroundColor: colors.white,
    borderRadius: '14px',
    marginBottom: '0',
    border: `1px solid ${colors.border}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
  },
  title: {
    margin: '0 0 14px 0',
    fontSize: '15px',
    fontWeight: 600,
    color: colors.textPrimary
  },
  section: {
    marginBottom: '14px'
  },
  label: {
    fontSize: '11px',
    fontWeight: 500,
    color: colors.textSecondary,
    display: 'block',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  urlRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  url: {
    flex: 1,
    padding: '10px 12px',
    backgroundColor: colors.bgPrimary,
    borderRadius: '8px',
    fontSize: '12px',
    wordBreak: 'break-all',
    fontFamily: 'SF Mono, Monaco, Consolas, monospace',
    color: colors.textPrimary,
    border: `1px solid ${colors.border}`
  },
  copyButton: {
    padding: '10px 16px',
    fontSize: '12px',
    fontWeight: 600,
    background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentLight} 100%)`,
    color: colors.white,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(139, 115, 85, 0.25)',
    transition: 'all 0.2s ease'
  },
  skeletonLabel: {
    width: '100px',
    height: '12px',
    borderRadius: '4px',
    marginBottom: '8px'
  },
  skeletonUrl: {
    width: '100%',
    height: '40px',
    borderRadius: '8px'
  }
}
