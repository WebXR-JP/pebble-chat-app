import { useState, useEffect, useCallback } from 'react'
import type { SetupProgress } from '../../../shared/types'

interface UseSetupResult {
  progress: SetupProgress
  isReady: boolean
  isLoading: boolean
  error: string | null
  install: () => Promise<void>
}

export function useSetup(): UseSetupResult {
  const [progress, setProgress] = useState<SetupProgress>({
    mediamtx: 'pending',
    ffmpeg: 'pending',
    message: '確認中...'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isReady = progress.mediamtx === 'ready' && progress.ffmpeg === 'ready'

  // 初回チェック＆自動インストール
  useEffect(() => {
    const checkAndInstall = async () => {
      try {
        const result = await window.electronAPI.checkSetup()
        setProgress(result)

        // 未インストールなら自動でインストール開始
        if (result.mediamtx === 'pending' || result.ffmpeg === 'pending') {
          setIsLoading(true)
          await window.electronAPI.installBinaries()
          setIsLoading(false)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        setIsLoading(false)
      }
    }
    checkAndInstall()
  }, [])

  // 進捗更新を監視
  useEffect(() => {
    const unsubscribe = window.electronAPI.onSetupProgress((newProgress) => {
      setProgress(newProgress)
      if (newProgress.mediamtx === 'error' || newProgress.ffmpeg === 'error') {
        setError(newProgress.message)
        setIsLoading(false)
      }
    })
    return unsubscribe
  }, [])

  // インストール実行
  const install = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      await window.electronAPI.installBinaries()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { progress, isReady, isLoading, error, install }
}
