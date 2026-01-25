import { useState } from 'react'
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

  return (
    <div style={styles.container}>
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

      <footer style={styles.footer}>
        <p>PebbleChat</p>
      </footer>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    padding: '20px',
    boxSizing: 'border-box',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    color: '#333'
  },
  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '14px',
    color: '#666'
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  // 待機画面
  idleScreen: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '24px'
  },
  modeSelector: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  modeOption: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f8f8f8',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'background-color 0.15s'
  },
  modeContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  modeName: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#333'
  },
  modeDesc: {
    fontSize: '12px',
    color: '#666'
  },
  startButton: {
    padding: '16px 32px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#4caf50',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer'
  },
  // 配信中画面
  streamingScreen: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  statusCard: {
    padding: '20px',
    backgroundColor: '#e8f5e9',
    borderRadius: '10px'
  },
  statusHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  statusDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%'
  },
  statusText: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333'
  },
  sourcePreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '16px',
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: '8px'
  },
  previewThumbnail: {
    width: '120px',
    height: '68px',
    objectFit: 'cover',
    borderRadius: '6px'
  },
  previewPlaceholder: {
    width: '120px',
    height: '68px',
    backgroundColor: '#e0e0e0',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px'
  },
  previewName: {
    flex: 1,
    fontSize: '13px',
    color: '#333',
    wordBreak: 'break-word'
  },
  stopButton: {
    padding: '16px 32px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#f44336',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    marginTop: 'auto'
  },
  connectingButton: {
    padding: '16px 32px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#9e9e9e',
    border: 'none',
    borderRadius: '10px',
    cursor: 'not-allowed',
    marginTop: 'auto'
  },
  error: {
    color: '#f44336',
    fontSize: '14px',
    textAlign: 'center',
    marginTop: '16px'
  },
  footer: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '12px',
    color: '#999'
  }
}

export default App
