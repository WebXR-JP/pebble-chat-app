import { spawn, ChildProcess, execSync } from 'child_process'
import { getMediaMTXPath, getMediaMTXConfigPath } from '../utils/paths'
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
export async function startMediaMTX(): Promise<MediaMTXStatus> {
  if (mediamtxProcess) {
    return {
      running: true,
      pid: mediamtxProcess.pid ?? null,
      error: null
    }
  }

  // Windowsの場合、既存プロセスを強制終了
  killExistingMediaMTX()

  // 起動前に設定ファイルを再生成（FFmpegパスを最新に）
  try {
    await updateMediaMTXConfig()
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
    mediamtxProcess.stderr?.on('data', (data: Buffer) => {
      const output = data.toString()
      // FFmpegのバージョン情報やストリーム情報など、情報的な出力はエラーとして扱わない
      const isInfoMessage =
        // FFmpegバージョン情報
        output.includes('ffmpeg version') ||
        output.includes('configuration:') ||
        output.includes('built with') ||
        // ライブラリバージョン
        output.includes('libavutil') ||
        output.includes('libavcodec') ||
        output.includes('libavformat') ||
        output.includes('libavdevice') ||
        output.includes('libavfilter') ||
        output.includes('libswscale') ||
        output.includes('libswresample') ||
        output.includes('libpostproc') ||
        // ストリーム情報（入力認識時に出力される）
        output.includes('Input #') ||
        output.includes('Stream #') ||
        output.includes('Metadata:') ||
        output.includes('Duration:') ||
        output.includes('title') ||
        // FFmpegインタラクティブメッセージ
        output.includes('Press [q] to stop') ||
        // コンテキストログ（rtsp, vp8, vist, libx264等）
        /\[(rtsp|vp8|vist#[0-9:\/]+|libx264|dec:vp8) @ 0x[0-9a-f]+\]/.test(output) ||
        // 一時的な警告（キーフレーム待ち、配信開始時に頻発するが正常）
        output.includes('Keyframe missing') ||
        output.includes('Discarding interframe without a prior keyframe') ||
        output.includes('Error submitting packet to decoder') ||
        // FFmpegエンコード進捗情報
        /^frame=\s*\d+/.test(output.trim())

      if (isInfoMessage) {
        console.log('[MediaMTX FFmpeg]', output)
      } else {
        console.error('[MediaMTX Error]', output)
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

// リレーサーバー設定
const RELAY_SERVER_IP = '161.33.189.110'

// HLSエンドポイントが再生可能かチェック（セグメントが生成されているか）
export async function checkHlsPlaybackReady(): Promise<boolean> {
  try {
    // リレーサーバーのHLSエンドポイントをチェック
    const response = await fetch(`http://${RELAY_SERVER_IP}/live/index.m3u8`, {
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
  onReady: () => void,
  options: { interval?: number; maxAttempts?: number } = {}
): () => void {
  const { interval = 1000, maxAttempts = 60 } = options
  let attempts = 0
  let stopped = false
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const poll = async (): Promise<void> => {
    if (stopped) return

    attempts++
    const isReady = await checkHlsPlaybackReady()

    if (isReady) {
      console.log('[MediaMTX] HLS playback ready')
      onReady()
      return
    }

    if (attempts >= maxAttempts) {
      console.log('[MediaMTX] HLS playback check timed out')
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
