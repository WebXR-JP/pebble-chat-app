import { useEffect, useState, useCallback, ChangeEvent, MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { CaptureSource, Platform, ScreenRecordingPermission } from '../../../shared/types'

type TabType = 'screen' | 'window'

interface Props {
  sources: CaptureSource[]
  isLoading: boolean
  permission: ScreenRecordingPermission
  platform: Platform | null
  onRefresh: () => void
  onSelect: (sourceId: string, enableAudio: boolean) => void
  onCancel: () => void
  onOpenSettings: () => void
}

export function SourceSelectModal({
  sources,
  isLoading,
  permission,
  platform,
  onRefresh,
  onSelect,
  onCancel,
  onOpenSettings
}: Props) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabType>('screen')
  const [enableAudio, setEnableAudio] = useState(true)

  // 権限がない場合のメッセージ
  const needsPermission = permission !== 'granted' && permission !== 'unknown'

  // タブでフィルタリングしたソース
  const filteredSources = sources.filter((source) => source.type === activeTab)

  // モーダル表示時にソース一覧を取得
  useEffect(() => {
    onRefresh()
  }, [])

  // タブ選択ハンドラ
  const handleSelectScreenTab = useCallback(() => {
    setActiveTab('screen')
  }, [])

  const handleSelectWindowTab = useCallback(() => {
    setActiveTab('window')
  }, [])

  // 音声共有チェックボックスハンドラ
  const handleAudioChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setEnableAudio(e.target.checked)
  }, [])

  // ソース選択ハンドラ
  const handleSelect = useCallback(
    (sourceId: string) => {
      onSelect(sourceId, enableAudio)
    },
    [onSelect, enableAudio]
  )

  // モーダルクリック時のイベント伝播停止
  const handleModalClick = useCallback((e: MouseEvent) => {
    e.stopPropagation()
  }, [])

  // 権限がない場合は別のUI
  if (needsPermission) {
    return (
      <div style={styles.overlay} onClick={onCancel}>
        <div style={styles.permissionModal} onClick={handleModalClick}>
          <div style={styles.permissionContainer}>
            <div style={styles.permissionIcon}>!</div>
            <h4 style={styles.permissionTitle}>{t('permission.title')}</h4>
            <p style={styles.permissionText}>
              {t('permission.description')}
            </p>
            <button style={styles.settingsButton} onClick={onOpenSettings}>
              {t('button.openSettings')}
            </button>
            <p style={styles.permissionNote}>
              {t('permission.note')}
            </p>
          </div>
          <div style={styles.footer}>
            <button style={styles.cancelButton} onClick={onCancel}>
              {t('button.cancel')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={handleModalClick}>
        <div style={styles.header}>
          <h3 style={styles.title}>{t('source.selectTitle')}</h3>
          <button style={styles.refreshButton} onClick={onRefresh} disabled={isLoading}>
            {t('button.refresh')}
          </button>
        </div>

        {isLoading ? (
          <div style={styles.loadingContainer}>
            <p style={styles.loadingText}>{t('source.loading')}</p>
          </div>
        ) : (
          <>
            {/* タブ */}
            <div style={styles.tabContainer}>
              <button
                style={{
                  ...styles.tab,
                  ...(activeTab === 'screen' ? styles.tabActive : styles.tabInactive)
                }}
                onClick={handleSelectScreenTab}
              >
                {t('source.tabScreen')}
              </button>
              <button
                style={{
                  ...styles.tab,
                  ...(activeTab === 'window' ? styles.tabActive : styles.tabInactive)
                }}
                onClick={handleSelectWindowTab}
              >
                {t('source.tabWindow')}
              </button>
            </div>

            <div style={styles.sourceList}>
              {filteredSources.length === 0 ? (
                <p style={styles.emptyText}>
                  {activeTab === 'screen' ? t('source.emptyScreen') : t('source.emptyWindow')}
                </p>
              ) : (
                filteredSources.map((source) => (
                  <div
                    key={source.id}
                    style={styles.sourceItem}
                    onClick={() => handleSelect(source.id)}
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
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* 音声共有チェックボックス（Windows のみ） */}
        {platform === 'win32' && (
          <div style={styles.audioOption}>
            <label style={styles.audioLabel}>
              <input
                type="checkbox"
                checked={enableAudio}
                onChange={handleAudioChange}
                style={styles.audioCheckbox}
              />
              <span style={styles.audioText}>{t('audio.shareSystem')}</span>
            </label>
          </div>
        )}

        <div style={styles.footer}>
          <button style={styles.cancelButton} onClick={onCancel}>
            {t('button.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}

// Pebble（石ころ）カラーパレット
const colors = {
  bgPrimary: '#F7F6F3',
  bgSecondary: '#EDEAE5',
  stone: '#6B7280',
  stoneDark: '#4B5563',
  stoneLight: '#9CA3AF',
  accent: '#8B7355',
  accentLight: '#A89076',
  warning: '#C4956A',
  warningBg: '#FDF6F0',
  textPrimary: '#3D3D3D',
  textSecondary: '#6B6B6B',
  textMuted: '#9B9B9B',
  white: '#FFFFFF',
  border: '#E0DDD8',
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(61, 61, 61, 0.4)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '48px',
    paddingBottom: '24px',
    zIndex: 1000
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: '18px',
    width: '90%',
    maxWidth: '480px',
    height: 'calc(100vh - 72px)',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 20px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${colors.border}`,
    // @ts-expect-error: WebKit specific property
    WebkitAppRegion: 'no-drag'
  },
  permissionModal: {
    backgroundColor: colors.white,
    borderRadius: '18px',
    width: '90%',
    maxWidth: '360px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 20px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${colors.border}`,
    // @ts-expect-error: WebKit specific property
    WebkitAppRegion: 'no-drag'
  },
  loadingModal: {
    backgroundColor: colors.white,
    borderRadius: '18px',
    width: '90%',
    maxWidth: '360px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 20px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${colors.border}`,
    // @ts-expect-error: WebKit specific property
    WebkitAppRegion: 'no-drag'
  },
  loadingContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 18px',
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.bgPrimary,
    borderRadius: '18px 18px 0 0'
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: colors.stoneDark
  },
  refreshButton: {
    padding: '7px 14px',
    fontSize: '12px',
    fontWeight: 500,
    backgroundColor: colors.white,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    color: colors.textSecondary,
    transition: 'all 0.2s ease',
    // @ts-expect-error: WebKit specific property
    WebkitAppRegion: 'no-drag'
  },
  tabContainer: {
    display: 'flex',
    padding: '0 14px',
    gap: '4px',
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.bgPrimary
  },
  tab: {
    flex: 1,
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 500,
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    color: colors.textSecondary,
    transition: 'all 0.2s ease'
  },
  tabActive: {
    color: colors.accent,
    borderBottomColor: colors.accent
  },
  tabInactive: {
    color: colors.textSecondary,
    borderBottomColor: 'transparent'
  },
  sourceList: {
    flex: 1,
    overflowY: 'auto',
    padding: '14px',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    alignContent: 'start'
  },
  loadingText: {
    margin: 0,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: '14px'
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    padding: '40px 0',
    fontSize: '14px'
  },
  permissionContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px 20px',
    textAlign: 'center'
  },
  permissionIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    backgroundColor: colors.warningBg,
    color: colors.warning,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '18px',
    border: `2px solid ${colors.warning}`
  },
  permissionTitle: {
    margin: '0 0 10px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: colors.textPrimary
  },
  permissionText: {
    margin: '0 0 22px 0',
    fontSize: '13px',
    color: colors.textSecondary,
    lineHeight: 1.6,
    whiteSpace: 'pre-line'
  },
  settingsButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentLight} 100%)`,
    color: colors.white,
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(139, 115, 85, 0.3)',
    transition: 'all 0.2s ease'
  },
  permissionNote: {
    marginTop: '18px',
    fontSize: '12px',
    color: colors.textMuted
  },
  sourceItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '10px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: `1px solid transparent`,
    backgroundColor: colors.bgPrimary,
    minWidth: 0
  },
  thumbnail: {
    width: '100%',
    aspectRatio: '16 / 9',
    objectFit: 'cover',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    display: 'block'
  },
  thumbnailPlaceholder: {
    width: '100%',
    aspectRatio: '16 / 9',
    backgroundColor: colors.bgSecondary,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    border: `1px solid ${colors.border}`
  },
  sourceInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    minWidth: 0
  },
  sourceName: {
    fontSize: '11px',
    fontWeight: 500,
    color: colors.textPrimary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  sourceType: {
    fontSize: '11px',
    color: colors.textMuted,
    fontWeight: 500
  },
  audioOption: {
    padding: '10px 18px',
    borderTop: `1px solid ${colors.border}`,
    backgroundColor: colors.bgPrimary
  },
  audioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  },
  audioCheckbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: colors.accent
  },
  audioText: {
    fontSize: '13px',
    fontWeight: 500,
    color: colors.textPrimary
  },
  footer: {
    padding: '10px 18px',
    borderTop: `1px solid ${colors.border}`,
    display: 'flex',
    justifyContent: 'flex-end',
    backgroundColor: colors.bgPrimary,
    borderRadius: '0 0 18px 18px'
  },
  cancelButton: {
    padding: '7px 14px',
    fontSize: '12px',
    fontWeight: 500,
    backgroundColor: colors.white,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    color: colors.textSecondary,
    transition: 'all 0.2s ease'
  }
}
