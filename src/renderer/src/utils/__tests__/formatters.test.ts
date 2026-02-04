import { describe, it, expect } from 'vitest'
import {
  validateStreamId,
  getSetupStatusIcon,
  getSetupStatusColor,
  getStreamStatusText,
  getStreamStatusColor,
  getConnectionStateText,
  getStreamButtonText
} from '../formatters'

describe('validateStreamId', () => {
  it('空文字列は有効（ランダム生成される）', () => {
    expect(validateStreamId('')).toEqual({ valid: true })
  })

  it('空白のみは有効', () => {
    expect(validateStreamId('   ')).toEqual({ valid: true })
  })

  it('3文字未満は無効', () => {
    const result = validateStreamId('ab')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('ストリームIDは3〜20文字で入力してください')
  })

  it('3文字は有効', () => {
    expect(validateStreamId('abc')).toEqual({ valid: true })
  })

  it('20文字は有効', () => {
    expect(validateStreamId('a'.repeat(20))).toEqual({ valid: true })
  })

  it('21文字以上は無効', () => {
    const result = validateStreamId('a'.repeat(21))
    expect(result.valid).toBe(false)
    expect(result.error).toBe('ストリームIDは3〜20文字で入力してください')
  })

  it('英数字とハイフンは有効', () => {
    expect(validateStreamId('abc-123')).toEqual({ valid: true })
    expect(validateStreamId('ABC-xyz-789')).toEqual({ valid: true })
  })

  it('アンダースコアは無効', () => {
    const result = validateStreamId('abc_123')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('ストリームIDは英数字とハイフンのみ使用できます')
  })

  it('日本語は無効', () => {
    const result = validateStreamId('テスト')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('ストリームIDは英数字とハイフンのみ使用できます')
  })

  it('スペースを含む場合は無効', () => {
    const result = validateStreamId('abc 123')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('ストリームIDは英数字とハイフンのみ使用できます')
  })
})

describe('getSetupStatusIcon', () => {
  it('ready は ✓ を返す', () => {
    expect(getSetupStatusIcon('ready')).toBe('✓')
  })

  it('downloading は ↓ を返す', () => {
    expect(getSetupStatusIcon('downloading')).toBe('↓')
  })

  it('error は ✗ を返す', () => {
    expect(getSetupStatusIcon('error')).toBe('✗')
  })

  it('pending は ○ を返す', () => {
    expect(getSetupStatusIcon('pending')).toBe('○')
  })
})

describe('getSetupStatusColor', () => {
  it('ready は緑色を返す', () => {
    expect(getSetupStatusColor('ready')).toBe('#5D8A66')
  })

  it('downloading はアクセント色を返す', () => {
    expect(getSetupStatusColor('downloading')).toBe('#8B7355')
  })

  it('error は赤色を返す', () => {
    expect(getSetupStatusColor('error')).toBe('#C45C4A')
  })

  it('pending はグレーを返す', () => {
    expect(getSetupStatusColor('pending')).toBe('#9CA3AF')
  })
})

describe('getStreamStatusText', () => {
  it('idle は 待機中 を返す', () => {
    expect(getStreamStatusText('idle')).toBe('待機中')
  })

  it('starting は 起動中... を返す', () => {
    expect(getStreamStatusText('starting')).toBe('起動中...')
  })

  it('running は 配信中 を返す', () => {
    expect(getStreamStatusText('running')).toBe('配信中')
  })

  it('stopping は 停止中... を返す', () => {
    expect(getStreamStatusText('stopping')).toBe('停止中...')
  })

  it('error は エラー を返す', () => {
    expect(getStreamStatusText('error')).toBe('エラー')
  })
})

describe('getStreamStatusColor', () => {
  it('running は緑色を返す', () => {
    expect(getStreamStatusColor('running')).toBe('#4caf50')
  })

  it('error は赤色を返す', () => {
    expect(getStreamStatusColor('error')).toBe('#f44336')
  })

  it('starting はオレンジ色を返す', () => {
    expect(getStreamStatusColor('starting')).toBe('#ff9800')
  })

  it('stopping はオレンジ色を返す', () => {
    expect(getStreamStatusColor('stopping')).toBe('#ff9800')
  })

  it('idle はグレーを返す', () => {
    expect(getStreamStatusColor('idle')).toBe('#9e9e9e')
  })
})

describe('getConnectionStateText', () => {
  it('null は null を返す', () => {
    expect(getConnectionStateText(null)).toBeNull()
  })

  it('connecting は 接続中... を返す', () => {
    expect(getConnectionStateText('connecting')).toBe('接続中...')
  })

  it('connected は 配信中 を返す', () => {
    expect(getConnectionStateText('connected')).toBe('配信中')
  })

  it('disconnected は 切断 を返す', () => {
    expect(getConnectionStateText('disconnected')).toBe('切断')
  })

  it('failed は 接続失敗 を返す', () => {
    expect(getConnectionStateText('failed')).toBe('接続失敗')
  })

  it('その他の状態はそのまま返す', () => {
    expect(getConnectionStateText('new')).toBe('new')
    expect(getConnectionStateText('closed')).toBe('closed')
  })
})

describe('getStreamButtonText', () => {
  it('isLoading=true, isStreaming=true は 停止中... を返す', () => {
    expect(getStreamButtonText(true, true)).toBe('停止中...')
  })

  it('isLoading=true, isStreaming=false は 開始中... を返す', () => {
    expect(getStreamButtonText(true, false)).toBe('開始中...')
  })

  it('isLoading=false, isStreaming=true は 配信停止 を返す', () => {
    expect(getStreamButtonText(false, true)).toBe('配信停止')
  })

  it('isLoading=false, isStreaming=false は 配信開始 を返す', () => {
    expect(getStreamButtonText(false, false)).toBe('配信開始')
  })
})
