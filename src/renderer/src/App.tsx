import { useState, useEffect } from 'react'
import logoImage from './assets/logo.png'
import { SetupProgress } from './components/SetupProgress'
import { UrlDisplay } from './components/UrlDisplay'
import { SourceSelectModal } from './components/SourceSelectModal'
import { useSetup } from './hooks/useSetup'
import { useStreaming } from './hooks/useStreaming'
import { useCapture } from './hooks/useCapture'
import { CaptureSource, Platform } from '../../shared/types'

type StreamMode = 'direct' | 'obs'
type AppState = 'idle' | 'selecting' | 'streaming'

function App() {
  const setup = useSetup()
  const streaming = useStreaming()
  const capture = useCapture()
  const [streamMode, setStreamMode] = useState<StreamMode>('direct')
  const [appState, setAppState] = useState<AppState>('idle')
  const [selectedSource, setSelectedSource] = useState<CaptureSource | null>(null)
  const [platform, setPlatform] = useState<Platform | null>(null)

  // プラットフォーム取得
  useEffect(() => {
    window.electronAPI.getPlatform().then(setPlatform)
  }, [])

  // 配信開始ボタン押下
  const handleStartClick = () => {
    if (streamMode === 'direct') {
      setAppState('selecting')
    } else {
      handleStartObs()
    }
  }

  // ソース選択後、キャプチャ開始
  const handleSourceSelect = async (sourceId: string) => {
    // 選択したソースを保存
    const source = capture.sources.find((s) => s.id === sourceId)
    setSelectedSource(source || null)
    setAppState('streaming')

    // サーバー起動
    if (!streaming.isStreaming) {
      await streaming.startStream()
    }

    // キャプチャ開始
    await capture.startCapture(sourceId)
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
    await streaming.startStream()
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
            title="最小化"
          >
            &#x2212;
          </button>
          <button
            style={{ ...styles.windowControlButton, ...styles.closeButton }}
            onClick={handleClose}
            title="閉じる"
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
          <p style={styles.subtitle}>VRChat/XRift 向け配信アプリ</p>
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
            {/* 注意書き */}
            <div style={styles.notice}>
              <span style={styles.noticeText}>
                無料サービスのため、配信の開始/停止を短時間に繰り返すと一時的に制限がかかる場合があります
              </span>
            </div>

            {/* 配信モード選択 */}
            <div style={styles.modeSelector}>
              <label style={styles.modeOption}>
                <input
                  type="radio"
                  name="streamMode"
                  checked={streamMode === 'direct'}
                  onChange={() => setStreamMode('direct')}
                />
                <div style={styles.modeContent}>
                  <span style={styles.modeName}>直接配信</span>
                  <span style={styles.modeDesc}>アプリから直接画面をキャプチャ（推奨）</span>
                </div>
              </label>
              <label style={styles.modeOption}>
                <input
                  type="radio"
                  name="streamMode"
                  checked={streamMode === 'obs'}
                  onChange={() => setStreamMode('obs')}
                />
                <div style={styles.modeContent}>
                  <span style={styles.modeName}>OBS経由</span>
                  <span style={styles.modeDesc}>OBSで配信設定をカスタマイズ</span>
                </div>
              </label>
            </div>

            {/* 開始ボタン */}
            <button
              style={styles.startButton}
              onClick={handleStartClick}
              disabled={isLoading}
            >
              {isLoading ? '準備中...' : '配信開始'}
            </button>
          </div>
        )}

        {/* 配信中画面 */}
        {setup.isReady && appState === 'streaming' && (
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
                    backgroundColor: capture.connectionState === 'connected'
                      ? streaming.streamInfo.readyForPlayback
                        ? '#4caf50'  // 配信中（再生可能）
                        : '#ff9800'  // 準備中
                      : streaming.isStreaming
                        ? '#ff9800'  // OBS接続待ち
                        : '#ff9800'  // 接続中
                  }}
                />
                <span style={styles.statusText}>
                  {capture.connectionState === 'connected'
                    ? streaming.streamInfo.readyForPlayback
                      ? '配信中'
                      : '準備中...'
                    : streamMode === 'obs' && streaming.isStreaming
                      ? 'OBS接続待ち'
                      : '接続中...'}
                </span>
              </div>

              {/* 選択中のソース情報 */}
              {streamMode === 'direct' && selectedSource && (
                <div style={styles.sourcePreview}>
                  {selectedSource.thumbnail ? (
                    <img
                      src={selectedSource.thumbnail}
                      alt={selectedSource.name}
                      style={styles.previewThumbnail}
                    />
                  ) : (
                    <div style={styles.previewPlaceholder}>
                      {selectedSource.type === 'screen' ? '🖥️' : '🪟'}
                    </div>
                  )}
                  <div style={styles.previewInfo}>
                    <span style={styles.previewName}>{selectedSource.name}</span>
                    <span style={styles.previewType}>
                      {selectedSource.type === 'screen' ? '画面' : 'ウィンドウ'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* URL表示 */}
            <UrlDisplay streamInfo={streaming.streamInfo} mode={streamMode} />

            {/* 停止/接続中ボタン */}
            {isLoading && !capture.isCapturing && !streaming.isStreaming ? (
              <button style={styles.connectingButton} disabled>
                接続中...
              </button>
            ) : (
              <button style={styles.stopButton} onClick={handleStop}>
                配信停止
              </button>
            )}
          </div>
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
          onRefresh={capture.refreshSources}
          onSelect={handleSourceSelect}
          onCancel={handleCancelSelect}
          onOpenSettings={capture.openSettings}
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
  // 石っぽいグレー
  stone: '#6B7280',
  stoneDark: '#4B5563',
  stoneLight: '#9CA3AF',
  // アクセント（温かみのある茶系）
  accent: '#8B7355',
  accentLight: '#A89076',
  // 状態色
  success: '#5D8A66',
  successBg: '#E8F0EA',
  error: '#C45C4A',
  errorBg: '#FAE8E5',
  warning: '#C4956A',
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
  logo: {
    height: '64px'
  },
  subtitle: {
    margin: '6px 0 0 0',
    fontSize: '13px',
    color: colors.textSecondary,
    fontWeight: 500
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
  // 配信中画面
  streamingScreen: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    paddingTop: '32px',  // タイトルバー分のスペース
    flex: 1
  },
  statusCard: {
    padding: '20px',
    backgroundColor: colors.successBg,
    borderRadius: '14px',
    border: `1px solid rgba(93, 138, 102, 0.2)`
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
  sourcePreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '14px',
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '10px',
    border: `1px solid ${colors.border}`
  },
  previewThumbnail: {
    width: '100px',
    height: '56px',
    objectFit: 'cover',
    borderRadius: '6px',
    border: `1px solid ${colors.border}`
  },
  previewPlaceholder: {
    width: '100px',
    height: '56px',
    backgroundColor: colors.bgSecondary,
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    border: `1px solid ${colors.border}`
  },
  previewInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0
  },
  previewName: {
    fontSize: '13px',
    color: colors.textPrimary,
    fontWeight: 500,
    wordBreak: 'break-word'
  },
  previewType: {
    fontSize: '11px',
    color: colors.textMuted
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
  error: {
    color: colors.error,
    fontSize: '13px',
    textAlign: 'center',
    marginTop: '12px',
    padding: '12px',
    backgroundColor: colors.errorBg,
    borderRadius: '10px'
  },
  footer: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '11px',
    color: colors.textMuted,
    fontWeight: 500
  }
}

export default App
