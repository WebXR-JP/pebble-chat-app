// WHIP (WebRTC-HTTP Ingestion Protocol) クライアント

const WHIP_ENDPOINT = 'http://localhost:8889/live/whip'

export interface WHIPClientOptions {
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void
  onError?: (error: Error) => void
}

export class WHIPClient {
  private pc: RTCPeerConnection | null = null
  private resourceUrl: string | null = null
  private options: WHIPClientOptions

  constructor(options: WHIPClientOptions = {}) {
    this.options = options
  }

  async publish(stream: MediaStream): Promise<void> {
    // RTCPeerConnectionを作成
    this.pc = new RTCPeerConnection({
      iceServers: [] // ローカル接続のためICEサーバー不要
    })

    // 接続状態の監視
    this.pc.onconnectionstatechange = () => {
      if (this.pc) {
        this.options.onConnectionStateChange?.(this.pc.connectionState)
      }
    }

    // MediaStreamのトラックを追加
    stream.getTracks().forEach((track) => {
      this.pc!.addTrack(track, stream)
    })

    // ICE候補の収集完了を待つ
    await this.waitForIceGathering()

    // Offer SDPを作成
    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)

    // ICE候補の収集完了を待つ
    const localDescription = await this.waitForLocalDescription()

    if (!localDescription) {
      throw new Error('Failed to gather ICE candidates')
    }

    // WHIPエンドポイントにOfferを送信
    const response = await fetch(WHIP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sdp'
      },
      body: localDescription.sdp
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`WHIP request failed: ${response.status} ${errorText}`)
    }

    // リソースURLを保存（後で削除に使用）
    this.resourceUrl = response.headers.get('Location') || WHIP_ENDPOINT

    // Answer SDPを設定
    const answerSdp = await response.text()
    await this.pc.setRemoteDescription({
      type: 'answer',
      sdp: answerSdp
    })
  }

  private waitForIceGathering(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.pc) {
        resolve()
        return
      }

      if (this.pc.iceGatheringState === 'complete') {
        resolve()
        return
      }

      const checkState = () => {
        if (this.pc?.iceGatheringState === 'complete') {
          this.pc.removeEventListener('icegatheringstatechange', checkState)
          resolve()
        }
      }

      this.pc.addEventListener('icegatheringstatechange', checkState)

      // タイムアウト: 5秒
      setTimeout(() => {
        this.pc?.removeEventListener('icegatheringstatechange', checkState)
        resolve()
      }, 5000)
    })
  }

  private waitForLocalDescription(): Promise<RTCSessionDescription | null> {
    return new Promise((resolve) => {
      if (!this.pc) {
        resolve(null)
        return
      }

      // 即座にローカル記述が利用可能な場合
      if (this.pc.localDescription && this.pc.iceGatheringState === 'complete') {
        resolve(this.pc.localDescription)
        return
      }

      const checkState = () => {
        if (this.pc?.iceGatheringState === 'complete' && this.pc.localDescription) {
          this.pc.removeEventListener('icegatheringstatechange', checkState)
          resolve(this.pc.localDescription)
        }
      }

      this.pc.addEventListener('icegatheringstatechange', checkState)

      // タイムアウト: 5秒
      setTimeout(() => {
        this.pc?.removeEventListener('icegatheringstatechange', checkState)
        resolve(this.pc?.localDescription || null)
      }, 5000)
    })
  }

  async stop(): Promise<void> {
    // WHIPリソースを削除
    if (this.resourceUrl) {
      try {
        await fetch(this.resourceUrl, {
          method: 'DELETE'
        })
      } catch {
        // 削除エラーは無視
      }
      this.resourceUrl = null
    }

    // PeerConnectionを閉じる
    if (this.pc) {
      this.pc.close()
      this.pc = null
    }
  }

  isConnected(): boolean {
    return this.pc?.connectionState === 'connected'
  }
}
