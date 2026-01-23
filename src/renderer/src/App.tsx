import { SetupProgress } from './components/SetupProgress'
import { StreamControls } from './components/StreamControls'
import { StatusDisplay } from './components/StatusDisplay'
import { UrlDisplay } from './components/UrlDisplay'
import { useSetup } from './hooks/useSetup'
import { useStreaming } from './hooks/useStreaming'

function App() {
  const setup = useSetup()
  const streaming = useStreaming()

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

        <StatusDisplay streamInfo={streaming.streamInfo} />

        <StreamControls
          isStreaming={streaming.isStreaming}
          isLoading={streaming.isLoading}
          isReady={setup.isReady}
          onStart={streaming.startStream}
          onStop={streaming.stopStream}
        />

        <UrlDisplay streamInfo={streaming.streamInfo} />

        {streaming.error && <p style={styles.error}>{streaming.error}</p>}

        {setup.isReady && !streaming.isStreaming && (
          <div style={styles.instructions}>
            <h3 style={styles.instructionsTitle}>使い方</h3>
            <ol style={styles.instructionsList}>
              <li>「配信開始」をクリック</li>
              <li>OBSで配信設定を行う</li>
              <li>表示されたRTMP URLをOBSに設定</li>
              <li>OBSで配信開始</li>
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
