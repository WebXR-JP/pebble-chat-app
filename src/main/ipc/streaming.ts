import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS, SetupProgress, StreamInfo, CaptureInfo, CaptureSourcesResult } from '../../shared/types'
import { isMediaMTXInstalled, installMediaMTX, isFFmpegInstalled, installFFmpeg } from '../services/binary'
import { startMediaMTX, stopMediaMTX, getMediaMTXStatus, pollHlsPlaybackReady } from '../services/mediamtx'
import {
  getCaptureSources,
  startCaptureSession,
  stopCaptureSession,
  getCaptureStatus,
  openScreenRecordingSettings
} from '../services/capture'

// リレーサーバー設定
const RELAY_SERVER_IP = '161.33.189.110'
const RELAY_SERVER_URL = `http://${RELAY_SERVER_IP}`

let currentStreamInfo: StreamInfo = {
  status: 'idle',
  rtmpUrl: null,
  hlsUrl: null,
  publicUrl: null,
  readyForPlayback: false,
  error: null
}

// HLSポーリングのキャンセル関数を保持
let cancelHlsPolling: (() => void) | null = null

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
    const ffmpegReady = await isFFmpegInstalled()

    return {
      mediamtx: mediamtxReady ? 'ready' : 'pending',
      ffmpeg: ffmpegReady ? 'ready' : 'pending',
      message:
        mediamtxReady && ffmpegReady ? '準備完了' : 'セットアップが必要です'
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
          ffmpeg: 'pending',
          message: 'MediaMTXをダウンロード中...'
        })

        await installMediaMTX((msg) => {
          sendSetupProgress(window, {
            mediamtx: 'downloading',
            ffmpeg: 'pending',
            message: msg
          })
        })
      }

      sendSetupProgress(window, {
        mediamtx: 'ready',
        ffmpeg: 'pending',
        message: 'FFmpegをセットアップ中...'
      })

      // FFmpegインストール
      const ffmpegReady = await isFFmpegInstalled()
      if (!ffmpegReady) {
        sendSetupProgress(window, {
          mediamtx: 'ready',
          ffmpeg: 'downloading',
          message: 'FFmpegをダウンロード中...（100MB以上あるため時間がかかります）'
        })

        await installFFmpeg((msg) => {
          sendSetupProgress(window, {
            mediamtx: 'ready',
            ffmpeg: 'downloading',
            message: msg
          })
        })
      }

      sendSetupProgress(window, {
        mediamtx: 'ready',
        ffmpeg: 'ready',
        message: 'セットアップ完了'
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      sendSetupProgress(window, {
        mediamtx: 'error',
        ffmpeg: 'error',
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
        readyForPlayback: false,
        error: null
      })

      // MediaMTX起動
      const mediamtxStatus = await startMediaMTX()
      if (!mediamtxStatus.running) {
        throw new Error(`MediaMTXの起動に失敗: ${mediamtxStatus.error}`)
      }

      const info: StreamInfo = {
        status: 'running',
        rtmpUrl: `rtmp://${RELAY_SERVER_IP}:1935/live`,  // サーバーのRTMPへ送出
        hlsUrl: null,  // ローカルHLSは使用しない
        publicUrl: `${RELAY_SERVER_URL}/live/index.m3u8`,  // サーバー経由のHLS
        readyForPlayback: false,
        error: null
      }

      sendStreamStatus(window, info)

      // サーバー側のHLSが再生可能になるまでバックグラウンドでポーリング
      cancelHlsPolling = pollHlsPlaybackReady(() => {
        const currentWindow = getMainWindow()
        const readyInfo: StreamInfo = {
          ...currentStreamInfo,
          readyForPlayback: true
        }
        sendStreamStatus(currentWindow, readyInfo)
      })

      return info
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const info: StreamInfo = {
        status: 'error',
        rtmpUrl: null,
        hlsUrl: null,
        publicUrl: null,
        readyForPlayback: false,
        error: errorMessage
      }
      sendStreamStatus(window, info)
      throw error
    }
  })

  // 配信停止
  ipcMain.handle(IPC_CHANNELS.STREAM_STOP, async (): Promise<void> => {
    const window = getMainWindow()

    // HLSポーリングをキャンセル
    if (cancelHlsPolling) {
      cancelHlsPolling()
      cancelHlsPolling = null
    }

    sendStreamStatus(window, {
      status: 'stopping',
      rtmpUrl: null,
      hlsUrl: null,
      publicUrl: null,
      readyForPlayback: false,
      error: null
    })

    await stopMediaMTX()

    sendStreamStatus(window, {
      status: 'idle',
      rtmpUrl: null,
      hlsUrl: null,
      publicUrl: null,
      readyForPlayback: false,
      error: null
    })
  })

  // 配信状態取得
  ipcMain.handle(IPC_CHANNELS.STREAM_STATUS, async (): Promise<StreamInfo> => {
    const mediamtxStatus = getMediaMTXStatus()

    if (mediamtxStatus.running) {
      return {
        status: 'running',
        rtmpUrl: `rtmp://${RELAY_SERVER_IP}:1935/live`,
        hlsUrl: null,
        publicUrl: `${RELAY_SERVER_URL}/live/index.m3u8`,
        readyForPlayback: currentStreamInfo.readyForPlayback,
        error: null
      }
    }

    return currentStreamInfo
  })

  // キャプチャソース一覧取得
  ipcMain.handle(IPC_CHANNELS.CAPTURE_GET_SOURCES, async (): Promise<CaptureSourcesResult> => {
    return await getCaptureSources()
  })

  // システム設定を開く
  ipcMain.handle(IPC_CHANNELS.CAPTURE_OPEN_SETTINGS, async (): Promise<void> => {
    await openScreenRecordingSettings()
  })

  // キャプチャ開始
  ipcMain.handle(
    IPC_CHANNELS.CAPTURE_START,
    async (_event, sourceId: string): Promise<CaptureInfo> => {
      const window = getMainWindow()
      const result = await getCaptureSources()
      const source = result.sources.find((s) => s.id === sourceId)

      if (!source) {
        const errorMessage = 'キャプチャソースが見つかりません'
        const errorInfo: CaptureInfo = {
          status: 'error',
          sourceId: null,
          sourceName: null,
          error: errorMessage
        }
        sendCaptureStatus(window, errorInfo)
        throw new Error(errorMessage)
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
  await stopMediaMTX()
}
