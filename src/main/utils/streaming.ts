import crypto from 'crypto'

// ランダムなストリームIDを生成（8文字の16進数）
export function generateStreamId(): string {
  return crypto.randomBytes(4).toString('hex')
}

// ストリームIDのバリデーション結果
export interface StreamIdValidationResult {
  valid: boolean
  error?: string
}

// ストリームIDのバリデーション
export function validateStreamId(streamId: string): StreamIdValidationResult {
  // 長さチェック（3〜20文字）
  if (streamId.length < 3 || streamId.length > 20) {
    return { valid: false, error: 'ストリームIDは3〜20文字で入力してください' }
  }
  // 英数字とハイフンのみ許可
  if (!/^[a-zA-Z0-9-]+$/.test(streamId)) {
    return { valid: false, error: 'ストリームIDは英数字とハイフンのみ使用できます' }
  }
  return { valid: true }
}
