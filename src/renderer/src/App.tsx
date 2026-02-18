import { useState, useEffect, useCallback, ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import logoImage from './assets/logo.png'
import { SetupProgress } from './components/SetupProgress'
import { ObsStreamingScreen } from './components/ObsStreamingScreen'
import { DirectStreamingScreen } from './components/DirectStreamingScreen'
import { SourceSelectModal } from './components/SourceSelectModal'
import { UpdateNotification } from './components/UpdateNotification'
import { LanguageSelector } from './components/LanguageSelector'
import { useSetup } from './hooks/useSetup'
import { useStreaming } from './hooks/useStreaming'
import { useCapture } from './hooks/useCapture'
import { useUpdateNotification } from './hooks/useUpdateNotification'
import { validateStreamId } from './utils/formatters'
import { CaptureSource, Platform } from '../../shared/types'

type StreamMode = 'direct' | 'obs'
type AppState = 'idle' | 'selecting' | 'streaming'

const STORAGE_KEY = 'pebble-stream-id'

function App() {
  const { t } = useTranslation()
  const setup = useSetup()
  const streaming = useStreaming()
  const capture = useCapture()
  const update = useUpdateNotification()
  const [streamMode, setStreamMode] = useState<StreamMode>('direct')
  const [appState, setAppState] = useState<AppState>('idle')
  const [selectedSource, setSelectedSource] = useState<CaptureSource | null>(null)
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [customStreamId, setCustomStreamId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || ''
  })
  const [streamIdError, setStreamIdError] = useState<string | null>(null)

  // プラットフォーム取得
  useEffect(() => {
    window.electronAPI.getPlatform().then(setPlatform)
  }, [])

  // ストリームID入力ハンドラ
  const handleStreamIdChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCustomStreamId(value)
    setStreamIdError(null)
    if (value) {
      localStorage.setItem(STORAGE_KEY, value)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // 配信モード選択ハンドラ
  const handleSelectDirectMode = useCallback(() => {
    setStreamMode('direct')
  }, [])

  const handleSelectObsMode = useCallback(() => {
    setStreamMode('obs')
  }, [])

  // 配信開始ボタン押下
  const handleStartClick = () => {
    // バリデーション
    const validation = validateStreamId(customStreamId)
    if (!validation.valid) {
      setStreamIdError(validation.error || null)
      return
    }
    setStreamIdError(null)

    if (streamMode === 'direct') {
      setAppState('selecting')
    } else {
      handleStartObs()
    }
  }

  // ソース選択後、キャプチャ開始
  const handleSourceSelect = async (sourceId: string, enableAudio: boolean) => {
    // 選択したソースを保存
    const source = capture.sources.find((s) => s.id === sourceId)
    setSelectedSource(source || null)
    setAppState('streaming')

    // サーバー起動（カスタムストリームIDを渡す）
    if (!streaming.isStreaming) {
      await streaming.startStream(customStreamId.trim() || undefined)
    }

    // キャプチャ開始
    await capture.startCapture(sourceId, enableAudio)
  }

  // ソース選択キャンセル
  const handleCancelSelect = () => {
    setAppState('idle')
  }

  // 配信停止
  const handleStop = async () => {
    if (streamMode === 'direct') {
      await capture.stopCapture()
    }
    await streaming.stopStream()
    setSelectedSource(null)
    setAppState('idle')
  }

  // OBS経由で開始
  const handleStartObs = async () => {
    setAppState('streaming')
    await streaming.startStream(customStreamId.trim() || undefined)
  }

  // 配信中かどうか
  const isStreaming = capture.isCapturing || streaming.isStreaming
  const isLoading = capture.isLoading || streaming.isLoading

  // ウィンドウ操作
  const handleMinimize = () => window.electronAPI.minimizeWindow()
  const handleClose = () => window.electronAPI.closeWindow()

  return (
    <div style={styles.container}>
      {/* ドラッグ領域（常に表示） */}
      <div style={styles.dragRegion} />

      {/* Windows用カスタムウィンドウコントロール */}
      {platform === 'win32' && (
        <div style={styles.windowControls}>
          <button
            style={styles.windowControlButton}
            onClick={handleMinimize}
            title={t('window.minimize')}
          >
            &#x2212;
          </button>
          <button
            style={{ ...styles.windowControlButton, ...styles.closeButton }}
            onClick={handleClose}
            title={t('window.close')}
          >
            &#x2715;
          </button>
        </div>
      )}

      {appState !== 'streaming' && (
        <header style={{
          ...styles.header,
          paddingTop: platform === 'win32' ? '8px' : '32px'
        }}>
          <img src={logoImage} alt="PebbleChat" style={styles.logo} />
          <p style={styles.subtitle}>{t('app.subtitle')} <span style={styles.version}>v{__APP_VERSION__}</span></p>
        </header>
      )}

      <main style={styles.main}>
        {/* セットアップ中 */}
        {!setup.isReady && (
          <SetupProgress
            progress={setup.progress}
            isLoading={setup.isLoading}
            error={setup.error}
            onInstall={setup.install}
          />
        )}

        {/* 待機画面 */}
        {setup.isReady && appState === 'idle' && (
          <div style={styles.idleScreen}>
            {/* ストリームID入力 */}
            <div style={styles.streamIdSection}>
              <label style={styles.streamIdLabel}>{t('streamId.label')}</label>
              <input
                type="text"
                value={customStreamId}
                onChange={handleStreamIdChange}
                placeholder={t('streamId.placeholder')}
                style={{
                  ...styles.streamIdInput,
                  ...(streamIdError ? styles.streamIdInputError : {})
                }}
              />
              {streamIdError ? (
                <span style={styles.streamIdErrorText}>{streamIdError}</span>
              ) : (
                <span style={styles.streamIdHint}>{t('streamId.hint')}</span>
              )}
            </div>

            {/* 配信モード選択 */}
            <div style={styles.modeSelector}>
              <label style={styles.modeOption}>
                <input
                  type="radio"
                  name="streamMode"
                  checked={streamMode === 'direct'}
                  onChange={handleSelectDirectMode}
                />
                <div style={styles.modeContent}>
                  <span style={styles.modeName}>{t('mode.direct')}</span>
                  <span style={styles.modeDesc}>{t('mode.directDesc')}</span>
                </div>
              </label>
              <label style={styles.modeOption}>
                <input
                  type="radio"
                  name="streamMode"
                  checked={streamMode === 'obs'}
                  onChange={handleSelectObsMode}
                />
                <div style={styles.modeContent}>
                  <span style={styles.modeName}>{t('mode.obs')}</span>
                  <span style={styles.modeDesc}>{t('mode.obsDesc')}</span>
                </div>
              </label>
            </div>

            {/* 開始ボタン */}
            <button
              style={styles.startButton}
              onClick={handleStartClick}
              disabled={isLoading}
            >
              {isLoading ? t('button.preparing') : t('button.start')}
            </button>

            {/* 言語切替 */}
            <div style={styles.langSelectorRow}>
              <LanguageSelector />
            </div>
          </div>
        )}

        {/* 配信中画面 */}
        {setup.isReady && appState === 'streaming' && (
          streamMode === 'obs'
            ? <ObsStreamingScreen
                streamInfo={streaming.streamInfo}
                onStop={handleStop}
                isLoading={isLoading && !streaming.isStreaming}
                platform={platform}
              />
            : <DirectStreamingScreen
                streamInfo={streaming.streamInfo}
                connectionState={capture.connectionState}
                selectedSource={selectedSource}
                onStop={handleStop}
                isLoading={isLoading}
                isCapturing={capture.isCapturing}
                platform={platform}
              />
        )}

        {/* エラー表示 */}
        {(streaming.error || capture.error) && (
          <p style={styles.error}>{streaming.error || capture.error}</p>
        )}
      </main>

      {/* ソース選択モーダル */}
      {appState === 'selecting' && (
        <SourceSelectModal
          sources={capture.sources}
          isLoading={capture.isLoading}
          permission={capture.permission}
          platform={platform}
          onRefresh={capture.refreshSources}
          onSelect={handleSourceSelect}
          onCancel={handleCancelSelect}
          onOpenSettings={capture.openSettings}
        />
      )}

      {/* アップデート通知 */}
      {update.visible && (
        <UpdateNotification
          updateInfo={update.updateInfo}
          onDownload={update.openDownload}
          onDismiss={update.dismiss}
        />
      )}

    </div>
  )
}

// Pebble（石ころ）カラーパレット
const colors = {
  // 背景
  bgPrimary: '#F7F6F3',      // 温かみのあるオフホワイト
  bgSecondary: '#EDEAE5',    // サンドベージュ
  // アクセント（温かみのある茶系）
  accent: '#8B7355',
  accentLight: '#A89076',
  // 状態色
  error: '#C45C4A',
  errorBg: '#FAE8E5',
  // テキスト
  textPrimary: '#3D3D3D',
  textSecondary: '#6B6B6B',
  textMuted: '#9B9B9B',
  // その他
  white: '#FFFFFF',
  border: '#E0DDD8',
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    boxSizing: 'border-box',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: `linear-gradient(180deg, ${colors.bgPrimary} 0%, ${colors.bgSecondary} 100%)`,
    minHeight: '100vh'
  },
  dragRegion: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '32px',
    // @ts-expect-error: WebKit specific property for draggable region
    WebkitAppRegion: 'drag'
  },
  windowControls: {
    position: 'absolute',
    top: 0,
    right: 0,
    display: 'flex',
    zIndex: 1000,
    // @ts-expect-error: WebKit specific property for non-draggable region
    WebkitAppRegion: 'no-drag'
  },
  windowControlButton: {
    width: '46px',
    height: '32px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    color: colors.textSecondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeButton: {
    color: colors.textPrimary
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
    paddingTop: '32px',  // タイトルバー分のスペース
    // @ts-expect-error: WebKit specific property for draggable region
    WebkitAppRegion: 'drag'
  },
  langSelectorRow: {
    display: 'flex',
    justifyContent: 'center'
  },
  logo: {
    height: '64px'
  },
  subtitle: {
    margin: '6px 0 0 0',
    fontSize: '13px',
    color: colors.textSecondary,
    fontWeight: 500
  },
  version: {
    color: colors.textMuted,
    fontWeight: 400
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  // 待機画面
  idleScreen: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    flex: 1
  },
  modeSelector: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  modeOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px 18px',
    backgroundColor: colors.white,
    borderRadius: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: `1px solid ${colors.border}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
  },
  modeContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  modeName: {
    fontSize: '15px',
    fontWeight: 600,
    color: colors.textPrimary
  },
  modeDesc: {
    fontSize: '12px',
    color: colors.textSecondary
  },
  streamIdSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  streamIdLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: colors.textSecondary
  },
  streamIdInput: {
    padding: '12px 14px',
    fontSize: '14px',
    border: `1px solid ${colors.border}`,
    borderRadius: '10px',
    backgroundColor: colors.white,
    color: colors.textPrimary,
    outline: 'none',
    transition: 'border-color 0.2s ease'
  },
  streamIdInputError: {
    borderColor: colors.error
  },
  streamIdHint: {
    fontSize: '11px',
    color: colors.textMuted
  },
  streamIdErrorText: {
    fontSize: '11px',
    color: colors.error
  },
  startButton: {
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: 600,
    color: colors.white,
    background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentLight} 100%)`,
    border: 'none',
    borderRadius: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(139, 115, 85, 0.35)',
    transition: 'all 0.2s ease',
    marginTop: 'auto'
  },
  error: {
    color: colors.error,
    fontSize: '13px',
    textAlign: 'center',
    marginTop: '12px',
    padding: '12px',
    backgroundColor: colors.errorBg,
    borderRadius: '10px'
  }
}

export default App
