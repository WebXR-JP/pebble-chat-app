import { spawn, ChildProcess } from 'child_process'
import { getCloudflaredPath } from '../utils/paths'

// binary.tsからエクスポートを再エクスポート
export { isCloudflaredInstalled, installCloudflared } from './binary'

let tunnelProcess: ChildProcess | null = null
let publicUrl: string | null = null

export interface TunnelStatus {
  running: boolean
  url: string | null
  error: string | null
}

// Quick Tunnelを開始（HLSサーバーを外部公開）
export async function startTunnel(localPort: number = 8888): Promise<TunnelStatus> {
  if (tunnelProcess) {
    return {
      running: true,
      url: publicUrl,
      error: null
    }
  }

  return new Promise((resolve) => {
    let resolved = false

    const doResolve = (status: TunnelStatus) => {
      if (!resolved) {
        resolved = true
        resolve(status)
      }
    }

    // タイムアウト（30秒）
    const timeout = setTimeout(() => {
      console.error('[Tunnel] Timeout waiting for URL')
      if (tunnelProcess) {
        try {
          tunnelProcess.kill()
        } catch {
          // ignore
        }
      }
      tunnelProcess = null
      publicUrl = null
      doResolve({
        running: false,
        url: null,
        error: 'Tunnel起動がタイムアウトしました'
      })
    }, 30000)

    try {
      const cloudflaredPath = getCloudflaredPath()
      console.log('[Tunnel] Starting cloudflared from:', cloudflaredPath)

      tunnelProcess = spawn(cloudflaredPath, ['tunnel', '--url', `http://localhost:${localPort}`], {
        stdio: ['ignore', 'pipe', 'pipe']
      })

      // 標準出力を監視
      tunnelProcess.stdout?.on('data', (data: Buffer) => {
        const output = data.toString()
        console.log('[Tunnel stdout]', output)

        // URLを抽出
        const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)
        if (urlMatch) {
          clearTimeout(timeout)
          publicUrl = urlMatch[0]
          console.log('[Tunnel] Started with URL:', publicUrl)

          doResolve({
            running: true,
            url: publicUrl,
            error: null
          })
        }
      })

      // 標準エラー出力を監視（cloudflaredはURLをstderrに出力することもある）
      tunnelProcess.stderr?.on('data', (data: Buffer) => {
        const output = data.toString()
        console.log('[Tunnel stderr]', output)

        // URLを抽出
        const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)
        if (urlMatch) {
          clearTimeout(timeout)
          publicUrl = urlMatch[0]
          console.log('[Tunnel] Started with URL:', publicUrl)

          doResolve({
            running: true,
            url: publicUrl,
            error: null
          })
        }
      })

      // プロセス終了を監視
      tunnelProcess.on('close', (code, signal) => {
        clearTimeout(timeout)
        console.log(`[Tunnel] Process exited with code ${code}, signal ${signal}`)
        tunnelProcess = null
        publicUrl = null

        // URLが取得される前に終了した場合
        doResolve({
          running: false,
          url: null,
          error: `Tunnelプロセスが終了しました (code: ${code})`
        })
      })

      tunnelProcess.on('error', (err) => {
        clearTimeout(timeout)
        console.error('[Tunnel] Process error:', err)
        tunnelProcess = null
        publicUrl = null

        doResolve({
          running: false,
          url: null,
          error: err.message
        })
      })
    } catch (error) {
      clearTimeout(timeout)
      tunnelProcess = null
      publicUrl = null

      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('[Tunnel] Failed to start:', errorMessage)

      doResolve({
        running: false,
        url: null,
        error: errorMessage
      })
    }
  })
}

// Tunnelを停止
export async function stopTunnel(): Promise<void> {
  if (!tunnelProcess) {
    return
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      // タイムアウトしたら強制終了
      if (tunnelProcess) {
        try {
          tunnelProcess.kill('SIGKILL')
        } catch {
          // ignore
        }
      }
      tunnelProcess = null
      publicUrl = null
      resolve()
    }, 3000)

    tunnelProcess.on('close', () => {
      clearTimeout(timeout)
      tunnelProcess = null
      publicUrl = null
      resolve()
    })

    try {
      tunnelProcess.kill('SIGTERM')
    } catch (error) {
      console.error('[Tunnel] Error stopping:', error)
      clearTimeout(timeout)
      tunnelProcess = null
      publicUrl = null
      resolve()
    }
  })
}

// Tunnelの状態を取得
export function getTunnelStatus(): TunnelStatus {
  return {
    running: tunnelProcess !== null,
    url: publicUrl,
    error: null
  }
}

// HLS URLを取得（Tunnel URL + パス）
export function getHlsPublicUrl(): string | null {
  if (!publicUrl) {
    return null
  }
  // URLの末尾スラッシュを処理
  const baseUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl
  return `${baseUrl}/live_hls/index.m3u8`
}
