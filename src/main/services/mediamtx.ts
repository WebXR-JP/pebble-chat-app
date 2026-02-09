import * as Sentry from '@sentry/electron/main'
import { spawn, ChildProcess, execSync } from 'child_process'
import { getMediaMTXPath, getMediaMTXConfigPath } from '../utils/paths'
import { isFFmpegInfoMessage } from '../utils/ffmpeg'
import { isIgnorableStderrMessage } from '../utils/mediamtx'
import { updateMediaMTXConfig } from './binary'

let mediamtxProcess: ChildProcess | null = null

// 既存のMediaMTXプロセスを強制終了（Windows用）
function killExistingMediaMTX(): void {
  if (process.platform === 'win32') {
    try {
      execSync('taskkill /F /IM mediamtx.exe', { stdio: 'ignore' })
      console.log('[MediaMTX] Killed existing process')
    } catch {
      // プロセスが存在しない場合はエラーになるが無視
    }
  }
}

export interface MediaMTXStatus {
  running: boolean
  pid: number | null
  error: string | null
}

// MediaMTXを起動
export async function startMediaMTX(streamId?: string): Promise<MediaMTXStatus> {
  if (mediamtxProcess) {
    return {
      running: true,
      pid: mediamtxProcess.pid ?? null,
      error: null
    }
  }

  // Windowsの場合、既存プロセスを強制終了
  killExistingMediaMTX()

  // 起動前に設定ファイルを再生成（ストリームIDを渡す）
  try {
    await updateMediaMTXConfig(streamId)
  } catch (error) {
    console.error('[MediaMTX] Failed to update config:', error)
  }

  return new Promise((resolve) => {
    const binaryPath = getMediaMTXPath()
    const configPath = getMediaMTXConfigPath()

    mediamtxProcess = spawn(binaryPath, [configPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false
    })

    let startupError: string | null = null
    let started = false

    // 標準出力を監視（起動確認）
    mediamtxProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString()
      console.log('[MediaMTX]', output)

      // 起動完了を検知
      if (!started && output.includes('listener opened')) {
        started = true
        resolve({
          running: true,
          pid: mediamtxProcess?.pid ?? null,
          error: null
        })
      }
    })

    // エラー出力を監視
    // 注意: FFmpegはバージョン情報などをstderrに出力するため、すべてがエラーではない
    // また、正常終了時のメッセージもstderrに出力される
    mediamtxProcess.stderr?.on('data', (data: Buffer) => {
      const output = data.toString()

      if (isIgnorableStderrMessage(output) || isFFmpegInfoMessage(output)) {
        console.log('[MediaMTX]', output.trim())
      } else {
        console.error('[MediaMTX Error]', output)
        Sentry.captureMessage(`MediaMTX stderr: ${output.trim()}`, 'error')
        startupError = output
      }
    })

    // プロセス終了を監視
    mediamtxProcess.on('close', (code) => {
      console.log(`[MediaMTX] Process exited with code ${code}`)
      mediamtxProcess = null

      if (!started) {
        resolve({
          running: false,
          pid: null,
          error: startupError || `Process exited with code ${code}`
        })
      }
    })

    mediamtxProcess.on('error', (err) => {
      console.error('[MediaMTX] Failed to start:', err)
      mediamtxProcess = null
      resolve({
        running: false,
        pid: null,
        error: err.message
      })
    })

    // タイムアウト（5秒で起動確認できなければヘルスチェックで判定）
    setTimeout(async () => {
      if (!started && mediamtxProcess) {
        started = true
        const healthy = await checkMediaMTXHealth()
        if (healthy) {
          resolve({
            running: true,
            pid: mediamtxProcess?.pid ?? null,
            error: null
          })
        } else {
          resolve({
            running: false,
            pid: null,
            error: 'MediaMTXの起動タイムアウト: ヘルスチェックに失敗しました'
          })
        }
      }
    }, 5000)
  })
}

// MediaMTXを停止
export async function stopMediaMTX(): Promise<void> {
  if (!mediamtxProcess) {
    return
  }

  return new Promise((resolve) => {
    mediamtxProcess!.on('close', () => {
      mediamtxProcess = null
      resolve()
    })

    // SIGTERMで終了要求
    mediamtxProcess!.kill('SIGTERM')

    // 3秒後にまだ動いていたらSIGKILL
    setTimeout(() => {
      if (mediamtxProcess) {
        mediamtxProcess.kill('SIGKILL')
      }
    }, 3000)
  })
}

// MediaMTXの状態を取得
export function getMediaMTXStatus(): MediaMTXStatus {
  return {
    running: mediamtxProcess !== null,
    pid: mediamtxProcess?.pid ?? null,
    error: null
  }
}

// ヘルスチェック（HLSエンドポイントに接続確認）
export async function checkMediaMTXHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:8888/live_hls/index.m3u8', {
      method: 'HEAD'
    })
    // 404も正常（配信がまだないだけ）
    return response.status === 200 || response.status === 404
  } catch {
    return false
  }
}

// リレーサーバー設定
const RELAY_SERVER_HOST = 'pebble.xrift.net'

// HLSエンドポイントが再生可能かチェック（セグメントが生成されているか）
export async function checkHlsPlaybackReady(streamId: string): Promise<boolean> {
  try {
    // リレーサーバーのHLSエンドポイントをチェック
    const response = await fetch(`https://${RELAY_SERVER_HOST}/${streamId}/index.m3u8`, {
      method: 'GET'
    })
    // 200 = セグメントが生成されており再生可能
    // 404 = まだセグメントが生成されていない（準備中）
    return response.status === 200
  } catch {
    return false
  }
}

// HLSが再生可能になるまでポーリング
export function pollHlsPlaybackReady(
  streamId: string,
  onReady: () => void,
  onTimeout: () => void,
  options: { interval?: number; maxAttempts?: number } = {}
): () => void {
  const { interval = 1000, maxAttempts = 60 } = options
  let attempts = 0
  let stopped = false
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const poll = async (): Promise<void> => {
    if (stopped) return

    attempts++
    const isReady = await checkHlsPlaybackReady(streamId)

    if (isReady) {
      console.log('[MediaMTX] HLS playback ready')
      onReady()
      return
    }

    if (attempts >= maxAttempts) {
      console.log('[MediaMTX] HLS playback check timed out')
      Sentry.captureMessage(`HLS playback check timed out after ${maxAttempts} attempts (streamId: ${streamId})`, 'warning')
      onTimeout()
      return
    }

    timeoutId = setTimeout(poll, interval)
  }

  // 最初のポーリングを開始
  poll()

  // キャンセル用の関数を返す
  return (): void => {
    stopped = true
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}
