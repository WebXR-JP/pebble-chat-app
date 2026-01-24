import { spawn, ChildProcess } from 'child_process'
import { getMediaMTXPath, getMediaMTXConfigPath } from '../utils/paths'

let mediamtxProcess: ChildProcess | null = null

export interface MediaMTXStatus {
  running: boolean
  pid: number | null
  error: string | null
}

// MediaMTXを起動
export async function startMediaMTX(): Promise<MediaMTXStatus> {
  if (mediamtxProcess) {
    return {
      running: true,
      pid: mediamtxProcess.pid ?? null,
      error: null
    }
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
    mediamtxProcess.stderr?.on('data', (data: Buffer) => {
      const output = data.toString()
      console.error('[MediaMTX Error]', output)
      startupError = output
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

    // タイムアウト（5秒で起動確認できなければ成功とみなす）
    setTimeout(() => {
      if (!started && mediamtxProcess) {
        started = true
        resolve({
          running: true,
          pid: mediamtxProcess.pid ?? null,
          error: null
        })
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
