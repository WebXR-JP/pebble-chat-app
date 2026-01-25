import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS, ElectronAPI, SetupProgress, StreamInfo, CaptureInfo, CaptureSourcesResult } from '../shared/types'

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
  startStream: () => ipcRenderer.invoke(IPC_CHANNELS.STREAM_START),

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

  openScreenRecordingSettings: () => ipcRenderer.invoke(IPC_CHANNELS.CAPTURE_OPEN_SETTINGS)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
