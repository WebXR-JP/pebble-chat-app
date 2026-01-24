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
    try {
      // Quick Tunnelを作成
      tunnelInstance = Tunnel.quick(`http://localhost:${localPort}`)

      // URLを取得
      tunnelInstance.on('url', (url) => {
        publicUrl = url
        console.log('[Tunnel] Started with URL:', publicUrl)

        resolve({
          running: true,
          url: publicUrl,
          error: null
        })
      })

      // エラー処理
      tunnelInstance.on('error', (error) => {
        console.error('[Tunnel] Error:', error)
        tunnelInstance = null
        publicUrl = null

        resolve({
          running: false,
          url: null,
          error: error.message
        })
      })

      // プロセス終了を監視
      tunnelInstance.on('exit', (code, signal) => {
        console.log(`[Tunnel] Process exited with code ${code}, signal ${signal}`)
        tunnelInstance = null
        publicUrl = null
      })
    } catch (error) {
      tunnelInstance = null
      publicUrl = null

      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('[Tunnel] Failed to start:', errorMessage)

      resolve({
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
