import { contextBridge, ipcRenderer, desktopCapturer } from 'electron'
import { IPC_CHANNELS, ElectronAPI, SetupProgress, StreamInfo, CaptureInfo, CaptureSource } from '../shared/types'

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
  getCaptureSources: async (): Promise<CaptureSource[]> => {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 320, height: 180 },
      fetchWindowIcons: true
    })

    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
      type: source.id.startsWith('screen:') ? 'screen' : 'window'
    }))
  },

  startCapture: (sourceId: string) => ipcRenderer.invoke(IPC_CHANNELS.CAPTURE_START, sourceId),

  stopCapture: () => ipcRenderer.invoke(IPC_CHANNELS.CAPTURE_STOP),

  onCaptureStatus: (callback: (info: CaptureInfo) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, info: CaptureInfo) => callback(info)
    ipcRenderer.on(IPC_CHANNELS.CAPTURE_STATUS, handler)
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.CAPTURE_STATUS, handler)
    }
  },

  getCaptureStatus: () => ipcRenderer.invoke(IPC_CHANNELS.CAPTURE_STATUS)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
