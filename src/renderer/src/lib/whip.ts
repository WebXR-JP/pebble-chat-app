// WHIP (WebRTC-HTTP Ingestion Protocol) クライアント

const WHIP_ENDPOINT = 'http://localhost:8889/live/whip'
const MAX_RETRIES = 5
const RETRY_DELAY_MS = 1000

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

    // MediaStreamのトラックを追加（H.264を優先）
    stream.getTracks().forEach((track) => {
      if (track.kind === 'video') {
        const transceiver = this.pc!.addTransceiver(track, {
          direction: 'sendonly',
          streams: [stream]
        })
        // H.264を優先するようにコーデックを設定
        this.preferH264Codec(transceiver)
      } else {
        this.pc!.addTrack(track, stream)
      }
    })

    // Offer SDPを作成
    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)

    // ICE候補の収集完了を待つ
    const localDescription = await this.waitForLocalDescription()

    if (!localDescription) {
      throw new Error('Failed to gather ICE candidates')
    }

    // WHIPエンドポイントにOfferを送信（リトライ付き）
    const response = await this.sendOfferWithRetry(localDescription.sdp!)

    // リソースURLを保存（後で削除に使用）
    // Location ヘッダーは相対パス（例: /live/whip/xxx）で返るため、
    // WHIP_ENDPOINT を基準に絶対URLへ解決する
    const location = response.headers.get('Location')
    this.resourceUrl = location ? new URL(location, WHIP_ENDPOINT).href : WHIP_ENDPOINT

    // Answer SDPを設定
    const answerSdp = await response.text()
    await this.pc.setRemoteDescription({
      type: 'answer',
      sdp: answerSdp
    })
  }

  private async sendOfferWithRetry(sdp: string): Promise<Response> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(WHIP_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/sdp'
          },
          body: sdp
        })

        if (response.ok) {
          return response
        }

        const errorText = await response.text()
        lastError = new Error(`WHIP request failed: ${response.status} ${errorText}`)
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
      }

      // 最後の試行でなければリトライ前に待機
      if (attempt < MAX_RETRIES) {
        await this.delay(RETRY_DELAY_MS)
      }
    }

    throw lastError || new Error('WHIP connection failed after retries')
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // H.264コーデックを優先するように設定
  private preferH264Codec(transceiver: RTCRtpTransceiver): void {
    try {
      const codecs = RTCRtpSender.getCapabilities?.('video')?.codecs
      if (!codecs) return

      // H.264コーデックを優先順位の最初に配置
      const h264Codecs = codecs.filter(
        (codec) => codec.mimeType.toLowerCase() === 'video/h264'
      )
      const otherCodecs = codecs.filter(
        (codec) => codec.mimeType.toLowerCase() !== 'video/h264'
      )

      if (h264Codecs.length > 0) {
        transceiver.setCodecPreferences([...h264Codecs, ...otherCodecs])
      }
    } catch {
      // H.264が利用できない場合はデフォルトのコーデックを使用
    }
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
