import { Tunnel, install, bin } from 'cloudflared'
import fs from 'fs'

let tunnelInstance: Tunnel | null = null
let publicUrl: string | null = null

export interface TunnelStatus {
  running: boolean
  url: string | null
  error: string | null
}

// cloudflaredバイナリが利用可能か確認
export async function isCloudflaredInstalled(): Promise<boolean> {
  try {
    // binはcloudflaredバイナリのパスを指す文字列
    // ファイルが存在するかチェック
    return fs.existsSync(bin)
  } catch {
    return false
  }
}

// cloudflaredをインストール
export async function installCloudflared(
  onProgress?: (message: string) => void
): Promise<void> {
  onProgress?.('cloudflaredをインストール中...')

  try {
    // デフォルトの場所にインストール
    await install(bin)
    onProgress?.('cloudflaredのインストール完了')
  } catch (error) {
    throw new Error(
      `cloudflaredのインストールに失敗しました: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

// Quick Tunnelを開始（HLSサーバーを外部公開）
export async function startTunnel(localPort: number = 8888): Promise<TunnelStatus> {
  if (tunnelInstance) {
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
      if (tunnelInstance) {
        try {
          tunnelInstance.stop()
        } catch {
          // ignore
        }
      }
      tunnelInstance = null
      publicUrl = null
      doResolve({
        running: false,
        url: null,
        error: 'Tunnel起動がタイムアウトしました'
      })
    }, 30000)

    try {
      // Quick Tunnelを作成
      tunnelInstance = Tunnel.quick(`http://localhost:${localPort}`)

      // URLを取得
      tunnelInstance.on('url', (url) => {
        clearTimeout(timeout)
        publicUrl = url
        console.log('[Tunnel] Started with URL:', publicUrl)

        doResolve({
          running: true,
          url: publicUrl,
          error: null
        })
      })

      // エラー処理
      tunnelInstance.on('error', (error) => {
        clearTimeout(timeout)
        console.error('[Tunnel] Error:', error)
        tunnelInstance = null
        publicUrl = null

        doResolve({
          running: false,
          url: null,
          error: error.message
        })
      })

      // プロセス終了を監視
      tunnelInstance.on('exit', (code, signal) => {
        clearTimeout(timeout)
        console.log(`[Tunnel] Process exited with code ${code}, signal ${signal}`)
        tunnelInstance = null
        publicUrl = null

        // URLが取得される前に終了した場合
        doResolve({
          running: false,
          url: null,
          error: `Tunnelプロセスが終了しました (code: ${code})`
        })
      })
    } catch (error) {
      clearTimeout(timeout)
      tunnelInstance = null
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
  if (!tunnelInstance) {
    return
  }

  try {
    tunnelInstance.stop()
  } catch (error) {
    console.error('[Tunnel] Error stopping:', error)
    // 強制終了
    try {
      tunnelInstance.process.kill('SIGKILL')
    } catch {
      // ignore
    }
  } finally {
    tunnelInstance = null
    publicUrl = null
  }
}

// Tunnelの状態を取得
export function getTunnelStatus(): TunnelStatus {
  return {
    running: tunnelInstance !== null,
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
