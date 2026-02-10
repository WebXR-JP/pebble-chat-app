import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { StreamInfo, Platform } from '../../../shared/types'
import { parseRtmpUrl } from '../utils/formatters'

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
  onStop: () => void
  isLoading: boolean
  platform: Platform | null
}

export function ObsStreamingScreen({ streamInfo, onStop, isLoading, platform }: Props) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    injectSkeletonStyle()
  }, [])

  const copyToClipboard = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // コピー失敗は無視
    }
  }, [])

  const handleCopyServerUrl = useCallback(() => {
    const parts = streamInfo.rtmpUrl ? parseRtmpUrl(streamInfo.rtmpUrl) : null
    if (parts) copyToClipboard(parts.serverUrl, 'server')
  }, [streamInfo.rtmpUrl, copyToClipboard])

  const handleCopyStreamKey = useCallback(() => {
    const parts = streamInfo.rtmpUrl ? parseRtmpUrl(streamInfo.rtmpUrl) : null
    if (parts) copyToClipboard(parts.streamKey, 'key')
  }, [streamInfo.rtmpUrl, copyToClipboard])

  const handleCopyPublicUrl = useCallback(() => {
    if (streamInfo.publicUrl) copyToClipboard(streamInfo.publicUrl, 'public')
  }, [streamInfo.publicUrl, copyToClipboard])

  const rtmpParts = streamInfo.rtmpUrl ? parseRtmpUrl(streamInfo.rtmpUrl) : null
  const isStreamReady = streamInfo.readyForPlayback && streamInfo.publicUrl

  return (
    <div style={{
      ...styles.streamingScreen,
      paddingTop: platform === 'win32' ? '8px' : '32px'
    }}>
      {/* ステータス */}
      <div style={styles.statusCard}>
        <div style={styles.statusHeader}>
          <span
            style={{
              ...styles.statusDot,
              backgroundColor: isStreamReady ? '#4caf50' : '#ff9800'
            }}
          />
          <span style={styles.statusText}>
            {isStreamReady ? t('status.running') : t('status.waitingObs')}
          </span>
        </div>
      </div>

      {/* OBS設定情報（常に表示） */}
      <div style={styles.obsSettingsCard}>
        <h3 style={styles.cardTitle}>{t('obs.settingsTitle')}</h3>
        <p style={styles.obsDescription}>
          {t('obs.description')}
        </p>

        {rtmpParts ? (
          <>
            <div style={styles.section}>
              <label style={styles.label}>{t('obs.server')}</label>
              <div style={styles.urlRow}>
                <code style={styles.url}>{rtmpParts.serverUrl}</code>
                <button style={styles.copyButton} onClick={handleCopyServerUrl}>
                  {copied === 'server' ? t('button.copied') : t('button.copy')}
                </button>
              </div>
            </div>

            <div style={styles.section}>
              <label style={styles.label}>{t('obs.streamKey')}</label>
              <div style={styles.urlRow}>
                <code style={styles.url}>{rtmpParts.streamKey}</code>
                <button style={styles.copyButton} onClick={handleCopyStreamKey}>
                  {copied === 'key' ? t('button.copied') : t('button.copy')}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={styles.section}>
              <div style={styles.skeletonLabel} className="skeleton-shimmer" />
              <div style={styles.skeletonUrl} className="skeleton-shimmer" />
            </div>
            <div style={styles.section}>
              <div style={styles.skeletonLabel} className="skeleton-shimmer" />
              <div style={styles.skeletonUrl} className="skeleton-shimmer" />
            </div>
          </>
        )}
      </div>

      {/* 公開URL */}
      <div style={styles.publicUrlCard}>
        <h3 style={styles.cardTitle}>{t('url.publicTitle')}</h3>
        {isStreamReady ? (
          <div style={styles.section}>
            <label style={styles.label}>{t('url.publicLabel')}</label>
            <div style={styles.urlRow}>
              <code style={styles.url}>{streamInfo.publicUrl}</code>
              <button style={styles.copyButton} onClick={handleCopyPublicUrl}>
                {copied === 'public' ? t('button.copied') : t('button.copy')}
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.section}>
            <div style={styles.skeletonLabel} className="skeleton-shimmer" />
            <div style={styles.skeletonUrl} className="skeleton-shimmer" />
          </div>
        )}
      </div>

      {/* 注意書き */}
      <div style={styles.notice}>
        <span style={styles.noticeText}>
          {t('streaming.notice')}
        </span>
      </div>

      {/* 停止ボタン */}
      {isLoading ? (
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
  bgPrimary: '#F7F6F3',
  bgSecondary: '#EDEAE5',
  accent: '#8B7355',
  accentLight: '#A89076',
  success: '#5D8A66',
  successBg: '#E8F0EA',
  error: '#C45C4A',
  textPrimary: '#3D3D3D',
  textSecondary: '#6B6B6B',
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
  obsSettingsCard: {
    padding: '18px',
    backgroundColor: colors.white,
    borderRadius: '14px',
    border: `1px solid ${colors.border}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
  },
  cardTitle: {
    margin: '0 0 8px 0',
    fontSize: '15px',
    fontWeight: 600,
    color: colors.textPrimary
  },
  obsDescription: {
    margin: '0 0 14px 0',
    fontSize: '12px',
    color: colors.textSecondary,
    lineHeight: 1.5
  },
  publicUrlCard: {
    padding: '18px',
    backgroundColor: colors.white,
    borderRadius: '14px',
    border: `1px solid ${colors.border}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
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
