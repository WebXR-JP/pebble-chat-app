import { useState, useEffect, useRef } from 'react'
import { SetupProgress } from './components/SetupProgress'
import { UrlDisplay } from './components/UrlDisplay'
import { SourceSelectModal } from './components/SourceSelectModal'
import { useSetup } from './hooks/useSetup'
import { useStreaming } from './hooks/useStreaming'
import { useCapture } from './hooks/useCapture'
import { CaptureSource } from '../../shared/types'

type StreamMode = 'direct' | 'obs'
type AppState = 'idle' | 'selecting' | 'streaming'

function App() {
  const setup = useSetup()
  const streaming = useStreaming()
  const capture = useCapture()
  const [streamMode, setStreamMode] = useState<StreamMode>('direct')
  const [appState, setAppState] = useState<AppState>('idle')
  const [selectedSource, setSelectedSource] = useState<CaptureSource | null>(null)

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

  // コンテンツに応じてウィンドウサイズを調整
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const resizeWindow = () => {
      if (containerRef.current) {
        const height = containerRef.current.scrollHeight + 48 // padding分を追加
        const clampedHeight = Math.max(400, Math.min(height, 800)) // 400〜800の範囲
        window.electronAPI.resizeWindow(clampedHeight)
      }
    }
    // 少し遅延させてDOMが更新されてから計測
    const timer = setTimeout(resizeWindow, 100)
    return () => clearTimeout(timer)
  }, [appState, setup.isReady, streaming.streamInfo.publicUrl])

  return (
    <div ref={containerRef} style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>PebbleChat</h1>
        <p style={styles.subtitle}>VRChat/XRift 向け配信アプリ</p>
      </header>

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
          <div style={styles.streamingScreen}>
            {/* ステータス */}
            <div style={styles.statusCard}>
              <div style={styles.statusHeader}>
                <span
                  style={{
                    ...styles.statusDot,
                    backgroundColor: capture.connectionState === 'connected' || streaming.isStreaming ? '#4caf50' : '#ff9800'
                  }}
                />
                <span style={styles.statusText}>
                  {capture.connectionState === 'connected'
                    ? '配信中'
                    : streaming.isStreaming
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
                  <span style={styles.previewName}>{selectedSource.name}</span>
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
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    boxSizing: 'border-box',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: `linear-gradient(180deg, ${colors.bgPrimary} 0%, ${colors.bgSecondary} 100%)`,
    minHeight: '100vh'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  title: {
    margin: 0,
    fontSize: '26px',
    fontWeight: 700,
    color: colors.stoneDark,
    letterSpacing: '-0.5px'
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
    gap: '20px'
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
    marginTop: '8px'
  },
  // 配信中画面
  streamingScreen: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
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
  previewName: {
    flex: 1,
    fontSize: '13px',
    color: colors.textPrimary,
    fontWeight: 500,
    wordBreak: 'break-word'
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
