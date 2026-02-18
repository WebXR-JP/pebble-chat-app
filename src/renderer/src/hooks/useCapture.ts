import { useState, useEffect, useCallback, useRef } from 'react'
import { CaptureSource, CaptureInfo, ScreenRecordingPermission } from '../../../shared/types'
import { WHIPClient } from '../lib/whip'
import { DEFAULT_CAPTURE_SOURCES, DEFAULT_CAPTURE_INFO } from '../constants/defaults'
import { i18n } from '../i18n'

interface UseCaptureResult {
  sources: CaptureSource[]
  captureInfo: CaptureInfo
  isCapturing: boolean
  isLoading: boolean
  error: string | null
  connectionState: RTCPeerConnectionState | null
  permission: ScreenRecordingPermission
  refreshSources: () => Promise<void>
  startCapture: (sourceId: string, enableAudio: boolean) => Promise<void>
  stopCapture: () => Promise<void>
  openSettings: () => Promise<void>
}

export function useCapture(): UseCaptureResult {
  const [sources, setSources] = useState<CaptureSource[]>(DEFAULT_CAPTURE_SOURCES)
  const [captureInfo, setCaptureInfo] = useState<CaptureInfo>(DEFAULT_CAPTURE_INFO)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState | null>(null)
  const [permission, setPermission] = useState<ScreenRecordingPermission>('unknown')

  const whipClientRef = useRef<WHIPClient | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  // キャプチャ状態の監視
  useEffect(() => {
    const unsubscribe = window.electronAPI.onCaptureStatus((info) => {
      setCaptureInfo(info)
    })
    return unsubscribe
  }, [])

  // 初期状態を取得
  useEffect(() => {
    window.electronAPI.getCaptureStatus().then(setCaptureInfo)
  }, [])

  // キャプチャソース一覧を更新
  const refreshSources = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await window.electronAPI.getCaptureSources()
      setSources(result.sources)
      setPermission(result.permission)
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n.t('error.fetchSources'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // システム設定を開く
  const openSettings = useCallback(async () => {
    try {
      await window.electronAPI.openScreenRecordingSettings()
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n.t('error.openSettings'))
    }
  }, [])

  // キャプチャ開始
  const startCapture = useCallback(async (sourceId: string, enableAudio: boolean) => {
    try {
      setIsLoading(true)
      setError(null)

      // メインプロセスにキャプチャ開始を通知
      await window.electronAPI.startCapture(sourceId)

      // platform を取得
      const platform = await window.electronAPI.getPlatform()

      // MediaStreamを取得
      // Windows かつ enableAudio の場合のみシステム音声をキャプチャ
      const stream = await navigator.mediaDevices.getUserMedia({
        audio:
          enableAudio && platform === 'win32'
            ? ({ mandatory: { chromeMediaSource: 'desktop' } } as MediaTrackConstraints)
            : false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
            maxWidth: 1920,
            maxHeight: 1080,
            maxFrameRate: 30
          }
        } as MediaTrackConstraints
      })

      mediaStreamRef.current = stream

      // WHIPクライアントで送信
      const whipClient = new WHIPClient({
        onConnectionStateChange: (state) => {
          setConnectionState(state)
          if (state === 'failed' || state === 'disconnected') {
            setError(i18n.t('error.webrtcDisconnected'))
          }
        },
        onError: (err) => {
          setError(err.message)
        }
      })

      whipClientRef.current = whipClient
      await whipClient.publish(stream)
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n.t('error.captureStart'))
      await stopCapture()
    } finally {
      setIsLoading(false)
    }
  }, [])

  // キャプチャ停止
  const stopCapture = useCallback(async () => {
    try {
      setIsLoading(true)

      // WHIPクライアントを停止
      if (whipClientRef.current) {
        await whipClientRef.current.stop()
        whipClientRef.current = null
      }

      // MediaStreamを停止
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
      }

      // メインプロセスに通知
      await window.electronAPI.stopCapture()
      setConnectionState(null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n.t('error.captureStop'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      if (whipClientRef.current) {
        whipClientRef.current.stop()
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  return {
    sources,
    captureInfo,
    isCapturing: captureInfo.status === 'capturing',
    isLoading,
    error,
    connectionState,
    permission,
    refreshSources,
    startCapture,
    stopCapture,
    openSettings
  }
}
