import { app, shell, BrowserWindow, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerAllHandlers, cleanupStreaming } from './ipc'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 600,
    minWidth: 400,
    minHeight: 500,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      // webSecurity: false は MediaMTX (localhost:8889) へのWHIP/WebRTC接続に必要
      // 本番環境でも localhost 接続のみのため、セキュリティリスクは限定的
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 開発時はdevサーバー、本番時はビルド済みファイルを読み込み
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// アプリ初期化
app.whenReady().then(() => {
  // Electron開発ツールの設定
  electronApp.setAppUserModelId('com.xrift.stream')

  // CSPを緩和してlocalhostへの接続を許可
  // - 'unsafe-inline': React のインラインスタイルに必要
  // - 'unsafe-eval': 開発モードのホットリロードに必要（本番ビルドでは不要だが互換性のため維持）
  // - connect-src localhost:*: MediaMTX (WHIP/HLS) への接続に必要
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' http://localhost:* ws://localhost:*"
        ]
      }
    })
  })

  // 開発時のF12でDevTools、本番時は無効化
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPCハンドラ登録
  registerAllHandlers(() => mainWindow)

  // ウィンドウ作成
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 全ウィンドウが閉じたら終了（macOS以外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// アプリ終了前にクリーンアップ
app.on('before-quit', async (event) => {
  event.preventDefault()
  await cleanupStreaming()
  app.exit(0)
})
