import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS, ElectronAPI, SetupProgress, StreamInfo, CaptureInfo, CaptureSourcesResult, UpdateInfo } from '../shared/types'

const electronAPI: ElectronAPI = {
  // セットアップ
  checkSetup: () => ipcRenderer.invoke(IPC_CHANNELS.SETUP_CHECK),

  installBinaries: () => ipcRenderer.invoke(IPC_CHANNELS.SETUP_INSTALL),

  onSetupProgress: (callback: (progress: SetupProgress) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: SetupProgress) =>
      callback(progress)
    ipcRenderer.on(IPC_CHANNELS.SETUP_PROGRESS, handler)
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.SETUP_PROGRESS, handler)
    }
  },

  // 配信
  startStream: (streamId?: string) => ipcRenderer.invoke(IPC_CHANNELS.STREAM_START, streamId),

  stopStream: () => ipcRenderer.invoke(IPC_CHANNELS.STREAM_STOP),

  onStreamStatus: (callback: (info: StreamInfo) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, info: StreamInfo) => callback(info)
    ipcRenderer.on(IPC_CHANNELS.STREAM_STATUS, handler)
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.STREAM_STATUS, handler)
    }
  },

  getStreamStatus: () => ipcRenderer.invoke(IPC_CHANNELS.STREAM_STATUS),

  // キャプチャ
  getCaptureSources: (): Promise<CaptureSourcesResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.CAPTURE_GET_SOURCES),

  startCapture: (sourceId: string) => ipcRenderer.invoke(IPC_CHANNELS.CAPTURE_START, sourceId),

  stopCapture: () => ipcRenderer.invoke(IPC_CHANNELS.CAPTURE_STOP),

  onCaptureStatus: (callback: (info: CaptureInfo) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, info: CaptureInfo) => callback(info)
    ipcRenderer.on(IPC_CHANNELS.CAPTURE_STATUS, handler)
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.CAPTURE_STATUS, handler)
    }
  },

  getCaptureStatus: () => ipcRenderer.invoke(IPC_CHANNELS.CAPTURE_STATUS),

  openScreenRecordingSettings: () => ipcRenderer.invoke(IPC_CHANNELS.CAPTURE_OPEN_SETTINGS),

  // アップデート
  checkForUpdate: () => ipcRenderer.invoke(IPC_CHANNELS.UPDATE_CHECK),

  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, info: UpdateInfo) => callback(info)
    ipcRenderer.on(IPC_CHANNELS.UPDATE_AVAILABLE, handler)
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.UPDATE_AVAILABLE, handler)
    }
  },

  openExternal: (url: string) => ipcRenderer.invoke(IPC_CHANNELS.OPEN_EXTERNAL, url),

  // ウィンドウ
  resizeWindow: (height: number) => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_RESIZE, height),
  minimizeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE),
  closeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE),
  getPlatform: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_GET_PLATFORM)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
