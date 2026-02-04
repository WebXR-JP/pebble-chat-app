import { describe, it, expect } from 'vitest'
import { generateStreamId, validateStreamId } from '../streaming'

describe('generateStreamId', () => {
  it('8文字の16進数文字列を返す', () => {
    const id = generateStreamId()

    expect(id).toHaveLength(8)
    expect(/^[0-9a-f]+$/.test(id)).toBe(true)
  })

  it('毎回異なるIDを生成する', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 100; i++) {
      ids.add(generateStreamId())
    }

    // 100回生成して全て異なることを確認
    expect(ids.size).toBe(100)
  })
})

describe('validateStreamId', () => {
  describe('長さのバリデーション', () => {
    it('2文字は無効', () => {
      const result = validateStreamId('ab')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('ストリームIDは3〜20文字で入力してください')
    })

    it('3文字は有効', () => {
      const result = validateStreamId('abc')

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('20文字は有効', () => {
      const result = validateStreamId('a'.repeat(20))

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('21文字は無効', () => {
      const result = validateStreamId('a'.repeat(21))

      expect(result.valid).toBe(false)
      expect(result.error).toBe('ストリームIDは3〜20文字で入力してください')
    })
  })

  describe('文字種のバリデーション', () => {
    it('英小文字のみは有効', () => {
      expect(validateStreamId('abcdef')).toEqual({ valid: true })
    })

    it('英大文字のみは有効', () => {
      expect(validateStreamId('ABCDEF')).toEqual({ valid: true })
    })

    it('数字のみは有効', () => {
      expect(validateStreamId('123456')).toEqual({ valid: true })
    })

    it('英数字混合は有効', () => {
      expect(validateStreamId('abc123XYZ')).toEqual({ valid: true })
    })

    it('ハイフンを含むは有効', () => {
      expect(validateStreamId('abc-123')).toEqual({ valid: true })
      expect(validateStreamId('a-b-c-d')).toEqual({ valid: true })
    })

    it('アンダースコアは無効', () => {
      const result = validateStreamId('abc_123')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('ストリームIDは英数字とハイフンのみ使用できます')
    })

    it('スペースは無効', () => {
      const result = validateStreamId('abc 123')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('ストリームIDは英数字とハイフンのみ使用できます')
    })

    it('日本語は無効', () => {
      const result = validateStreamId('テスト')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('ストリームIDは英数字とハイフンのみ使用できます')
    })

    it('特殊文字は無効', () => {
      const result = validateStreamId('abc@123')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('ストリームIDは英数字とハイフンのみ使用できます')
    })

    it('ドットは無効', () => {
      const result = validateStreamId('abc.123')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('ストリームIDは英数字とハイフンのみ使用できます')
    })
  })
})
