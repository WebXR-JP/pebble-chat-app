import { useState } from 'react'
import { SetupProgress } from './components/SetupProgress'
import { StreamControls } from './components/StreamControls'
import { StatusDisplay } from './components/StatusDisplay'
import { UrlDisplay } from './components/UrlDisplay'
import { CaptureSourceSelector } from './components/CaptureSourceSelector'
import { useSetup } from './hooks/useSetup'
import { useStreaming } from './hooks/useStreaming'
import { useCapture } from './hooks/useCapture'

function App() {
  const setup = useSetup()
  const streaming = useStreaming()
  const capture = useCapture()
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)

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

        <StatusDisplay streamInfo={streaming.streamInfo} />

        <UrlDisplay streamInfo={streaming.streamInfo} />

        {(streaming.error || capture.error) && (
          <p style={styles.error}>{streaming.error || capture.error}</p>
        )}

        {setup.isReady && !capture.isCapturing && (
          <div style={styles.instructions}>
            <h3 style={styles.instructionsTitle}>使い方</h3>
            <ol style={styles.instructionsList}>
              <li>キャプチャしたい画面またはウィンドウを選択</li>
              <li>「キャプチャ開始」をクリック</li>
              <li>公開URLをiwaSyncに貼り付け</li>
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
  footer: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '12px',
    color: '#999'
  }
}

export default App
