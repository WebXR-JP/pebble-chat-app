import { useState, useEffect, useCallback } from 'react'
import type { StreamInfo } from '../../../shared/types'
import { DEFAULT_STREAM_INFO } from '../constants/defaults'

interface UseStreamingResult {
  streamInfo: StreamInfo
  isStreaming: boolean
  isLoading: boolean
  error: string | null
  startStream: (streamId?: string) => Promise<void>
  stopStream: () => Promise<void>
}

export function useStreaming(): UseStreamingResult {
  const [streamInfo, setStreamInfo] = useState<StreamInfo>(DEFAULT_STREAM_INFO)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isStreaming = streamInfo.status === 'running'

  // 初回状態取得
  useEffect(() => {
    const getStatus = async () => {
      try {
        const status = await window.electronAPI.getStreamStatus()
        setStreamInfo(status)
      } catch (err) {
        console.error('Failed to get stream status:', err)
      }
    }
    getStatus()
  }, [])

  // 状態更新を監視
  useEffect(() => {
    const unsubscribe = window.electronAPI.onStreamStatus((info) => {
      setStreamInfo(info)
      if (info.status === 'error') {
        setError(info.error)
        setIsLoading(false)
      } else if (info.status === 'running' || info.status === 'idle') {
        setIsLoading(false)
      }
    })
    return unsubscribe
  }, [])

  // 配信開始
  const startStream = useCallback(async (streamId?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await window.electronAPI.startStream(streamId)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setIsLoading(false)
    }
  }, [])

  // 配信停止
  const stopStream = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      await window.electronAPI.stopStream()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setIsLoading(false)
    }
  }, [])

  return { streamInfo, isStreaming, isLoading, error, startStream, stopStream }
}
