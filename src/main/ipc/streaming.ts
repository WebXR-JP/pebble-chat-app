import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS, SetupProgress, StreamInfo, CaptureInfo, CaptureSource } from '../../shared/types'
import { isMediaMTXInstalled, installMediaMTX } from '../services/binary'
import { startMediaMTX, stopMediaMTX, getMediaMTXStatus } from '../services/mediamtx'
import {
  isCloudflaredInstalled,
  installCloudflared,
  startTunnel,
  stopTunnel,
  getTunnelStatus,
  getHlsPublicUrl
} from '../services/tunnel'
import {
  getCaptureSources,
  startCaptureSession,
  stopCaptureSession,
  getCaptureStatus,
  setCaptureError
} from '../services/capture'

let currentStreamInfo: StreamInfo = {
  status: 'idle',
  rtmpUrl: null,
  hlsUrl: null,
  publicUrl: null,
  error: null
}

// セットアップ状態を送信
function sendSetupProgress(window: BrowserWindow | null, progress: SetupProgress): void {
  if (window && !window.isDestroyed()) {
    window.webContents.send(IPC_CHANNELS.SETUP_PROGRESS, progress)
  }
}

// 配信状態を送信
function sendStreamStatus(window: BrowserWindow | null, info: StreamInfo): void {
  currentStreamInfo = info
  if (window && !window.isDestroyed()) {
    window.webContents.send(IPC_CHANNELS.STREAM_STATUS, info)
  }
}

// キャプチャ状態を送信
function sendCaptureStatus(window: BrowserWindow | null, info: CaptureInfo): void {
  if (window && !window.isDestroyed()) {
    window.webContents.send(IPC_CHANNELS.CAPTURE_STATUS, info)
  }
}

// IPCハンドラを登録
export function registerStreamingHandlers(getMainWindow: () => BrowserWindow | null): void {
  // セットアップ確認
  ipcMain.handle(IPC_CHANNELS.SETUP_CHECK, async (): Promise<SetupProgress> => {
    const mediamtxReady = await isMediaMTXInstalled()
    const cloudflaredReady = await isCloudflaredInstalled()

    return {
      mediamtx: mediamtxReady ? 'ready' : 'pending',
      cloudflared: cloudflaredReady ? 'ready' : 'pending',
      message:
        mediamtxReady && cloudflaredReady ? '準備完了' : 'セットアップが必要です'
    }
  })

  // バイナリインストール
  ipcMain.handle(IPC_CHANNELS.SETUP_INSTALL, async (): Promise<void> => {
    const window = getMainWindow()

    try {
      // MediaMTXインストール
      const mediamtxReady = await isMediaMTXInstalled()
      if (!mediamtxReady) {
        sendSetupProgress(window, {
          mediamtx: 'downloading',
          cloudflared: 'pending',
          message: 'MediaMTXをダウンロード中...'
        })

        await installMediaMTX((msg) => {
          sendSetupProgress(window, {
            mediamtx: 'downloading',
            cloudflared: 'pending',
            message: msg
          })
        })
      }

      sendSetupProgress(window, {
        mediamtx: 'ready',
        cloudflared: 'pending',
        message: 'cloudflaredをセットアップ中...'
      })

      // cloudflaredインストール
      const cloudflaredReady = await isCloudflaredInstalled()
      if (!cloudflaredReady) {
        sendSetupProgress(window, {
          mediamtx: 'ready',
          cloudflared: 'downloading',
          message: 'cloudflaredをダウンロード中...'
        })

        await installCloudflared((msg) => {
          sendSetupProgress(window, {
            mediamtx: 'ready',
            cloudflared: 'downloading',
            message: msg
          })
        })
      }

      sendSetupProgress(window, {
        mediamtx: 'ready',
        cloudflared: 'ready',
        message: 'セットアップ完了'
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      sendSetupProgress(window, {
        mediamtx: 'error',
        cloudflared: 'error',
        message: `セットアップ失敗: ${errorMessage}`
      })
      throw error
    }
  })

  // 配信開始
  ipcMain.handle(IPC_CHANNELS.STREAM_START, async (): Promise<StreamInfo> => {
    const window = getMainWindow()

    try {
      sendStreamStatus(window, {
        status: 'starting',
        rtmpUrl: null,
        hlsUrl: null,
        publicUrl: null,
        error: null
      })

      // MediaMTX起動
      const mediamtxStatus = await startMediaMTX()
      if (!mediamtxStatus.running) {
        throw new Error(`MediaMTXの起動に失敗: ${mediamtxStatus.error}`)
      }

      // Tunnel起動
      const tunnelStatus = await startTunnel(8888)
      if (!tunnelStatus.running) {
        await stopMediaMTX()
        throw new Error(`Tunnelの起動に失敗: ${tunnelStatus.error}`)
      }

      const info: StreamInfo = {
        status: 'running',
        rtmpUrl: 'rtmp://localhost:1935/live',
        hlsUrl: 'http://localhost:8888/live_hls/index.m3u8',
        publicUrl: getHlsPublicUrl(),
        error: null
      }

      sendStreamStatus(window, info)
      return info
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const info: StreamInfo = {
        status: 'error',
        rtmpUrl: null,
        hlsUrl: null,
        publicUrl: null,
        error: errorMessage
      }
      sendStreamStatus(window, info)
      throw error
    }
  })

  // 配信停止
  ipcMain.handle(IPC_CHANNELS.STREAM_STOP, async (): Promise<void> => {
    const window = getMainWindow()

    sendStreamStatus(window, {
      status: 'stopping',
      rtmpUrl: null,
      hlsUrl: null,
      publicUrl: null,
      error: null
    })

    await stopTunnel()
    await stopMediaMTX()

    sendStreamStatus(window, {
      status: 'idle',
      rtmpUrl: null,
      hlsUrl: null,
      publicUrl: null,
      error: null
    })
  })

  // 配信状態取得
  ipcMain.handle(IPC_CHANNELS.STREAM_STATUS, async (): Promise<StreamInfo> => {
    const mediamtxStatus = getMediaMTXStatus()
    const tunnelStatus = getTunnelStatus()

    if (mediamtxStatus.running && tunnelStatus.running) {
      return {
        status: 'running',
        rtmpUrl: 'rtmp://localhost:1935/live',
        hlsUrl: 'http://localhost:8888/live_hls/index.m3u8',
        publicUrl: getHlsPublicUrl(),
        error: null
      }
    }

    return currentStreamInfo
  })

  // キャプチャソース一覧取得
  ipcMain.handle(IPC_CHANNELS.CAPTURE_GET_SOURCES, async (): Promise<CaptureSource[]> => {
    return await getCaptureSources()
  })

  // キャプチャ開始
  ipcMain.handle(
    IPC_CHANNELS.CAPTURE_START,
    async (_event, sourceId: string): Promise<CaptureInfo> => {
      const window = getMainWindow()
      const sources = await getCaptureSources()
      const source = sources.find((s) => s.id === sourceId)

      if (!source) {
        const errorInfo: CaptureInfo = {
          status: 'error',
          sourceId: null,
          sourceName: null,
          error: 'キャプチャソースが見つかりません'
        }
        sendCaptureStatus(window, errorInfo)
        throw new Error(errorInfo.error)
      }

      const info = startCaptureSession(sourceId, source.name)
      sendCaptureStatus(window, info)
      return info
    }
  )

  // キャプチャ停止
  ipcMain.handle(IPC_CHANNELS.CAPTURE_STOP, async (): Promise<void> => {
    const window = getMainWindow()
    stopCaptureSession()
    sendCaptureStatus(window, getCaptureStatus())
  })

  // キャプチャ状態取得
  ipcMain.handle(IPC_CHANNELS.CAPTURE_STATUS, async (): Promise<CaptureInfo> => {
    return getCaptureStatus()
  })
}

// クリーンアップ（アプリ終了時に呼ぶ）
export async function cleanupStreaming(): Promise<void> {
  await stopTunnel()
  await stopMediaMTX()
}
