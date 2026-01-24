import { useState } from 'react'
import { SetupProgress } from './components/SetupProgress'
import { StreamControls } from './components/StreamControls'
import { StatusDisplay } from './components/StatusDisplay'
import { UrlDisplay } from './components/UrlDisplay'
import { CaptureSourceSelector } from './components/CaptureSourceSelector'
import { useSetup } from './hooks/useSetup'
import { useStreaming } from './hooks/useStreaming'
import { useCapture } from './hooks/useCapture'

type StreamMode = 'direct' | 'obs'

function App() {
  const setup = useSetup()
  const streaming = useStreaming()
  const capture = useCapture()
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)
  const [streamMode, setStreamMode] = useState<StreamMode>('direct')

  const handleStartCapture = async () => {
    if (!selectedSourceId) return

    // まずサーバーを起動（MediaMTXの起動待ちはWHIPクライアントのリトライで対応）
    if (!streaming.isStreaming) {
      await streaming.startStream()
    }

    // キャプチャ開始
    await capture.startCapture(selectedSourceId)
  }

  const handleStopCapture = async () => {
    await capture.stopCapture()
  }

  const handleStartObs = async () => {
    if (!streaming.isStreaming) {
      await streaming.startStream()
    }
  }

  const handleStopObs = async () => {
    await streaming.stopStream()
  }

  // モード切替は配信中は無効
  const canSwitchMode = !capture.isCapturing && !streaming.isStreaming

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>XRift Stream</h1>
        <p style={styles.subtitle}>VRChat / XRift 向け配信アプリ</p>
      </header>

      <main style={styles.main}>
        {!setup.isReady && (
          <SetupProgress
            progress={setup.progress}
            isLoading={setup.isLoading}
            error={setup.error}
            onInstall={setup.install}
          />
        )}

        {setup.isReady && (
          <>
            {/* 配信モード選択 */}
            <div style={styles.modeSelector}>
              <span style={styles.modeLabel}>配信モード:</span>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="streamMode"
                  value="direct"
                  checked={streamMode === 'direct'}
                  onChange={() => setStreamMode('direct')}
                  disabled={!canSwitchMode}
                />
                直接配信（推奨）
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="streamMode"
                  value="obs"
                  checked={streamMode === 'obs'}
                  onChange={() => setStreamMode('obs')}
                  disabled={!canSwitchMode}
                />
                OBS経由
              </label>
            </div>

            {/* 直接配信モード */}
            {streamMode === 'direct' && (
              <CaptureSourceSelector
                sources={capture.sources}
                selectedSourceId={selectedSourceId}
                isLoading={capture.isLoading || streaming.isLoading}
                isCapturing={capture.isCapturing}
                connectionState={capture.connectionState}
                onRefresh={capture.refreshSources}
                onSelect={setSelectedSourceId}
                onStartCapture={handleStartCapture}
                onStopCapture={handleStopCapture}
              />
            )}

            {/* OBS経由モード */}
            {streamMode === 'obs' && (
              <div style={styles.obsMode}>
                <p style={styles.obsModeText}>
                  OBSの「配信」設定で下記のRTMP URLを設定してください。
                </p>
                <div style={styles.obsControls}>
                  {streaming.isStreaming ? (
                    <button
                      style={{ ...styles.button, backgroundColor: '#f44336' }}
                      onClick={handleStopObs}
                      disabled={streaming.isLoading}
                    >
                      {streaming.isLoading ? '停止中...' : 'サーバー停止'}
                    </button>
                  ) : (
                    <button
                      style={{ ...styles.button, backgroundColor: '#4caf50' }}
                      onClick={handleStartObs}
                      disabled={streaming.isLoading}
                    >
                      {streaming.isLoading ? '起動中...' : 'サーバー起動'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <StatusDisplay streamInfo={streaming.streamInfo} />

        <UrlDisplay streamInfo={streaming.streamInfo} mode={streamMode} />

        {(streaming.error || capture.error) && (
          <p style={styles.error}>{streaming.error || capture.error}</p>
        )}

        {setup.isReady && !capture.isCapturing && !streaming.isStreaming && (
          <div style={styles.instructions}>
            <h3 style={styles.instructionsTitle}>使い方</h3>
            <ol style={styles.instructionsList}>
              {streamMode === 'direct' ? (
                <>
                  <li>キャプチャしたい画面またはウィンドウを選択</li>
                  <li>「キャプチャ開始」をクリック</li>
                  <li>公開URLをiwaSyncに貼り付け</li>
                </>
              ) : (
                <>
                  <li>「サーバー起動」をクリック</li>
                  <li>OBSの配信設定でRTMP URLを設定</li>
                  <li>OBSで配信開始</li>
                  <li>公開URLをiwaSyncに貼り付け</li>
                </>
              )}
            </ol>
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <p>Powered by XRift</p>
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
    marginBottom: '24px'
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
    flex: 1
  },
  error: {
    color: '#f44336',
    fontSize: '14px',
    textAlign: 'center'
  },
  instructions: {
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px'
  },
  instructionsTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px'
  },
  instructionsList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '13px',
    color: '#666'
  },
  modeSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  modeLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333'
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '13px',
    color: '#555',
    cursor: 'pointer'
  },
  obsMode: {
    marginBottom: '20px'
  },
  obsModeText: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '12px'
  },
  obsControls: {
    display: 'flex',
    justifyContent: 'center'
  },
  button: {
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  footer: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '12px',
    color: '#999'
  }
}

export default App
