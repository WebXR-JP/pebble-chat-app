import { describe, it, expect } from 'vitest'
import { isNormalShutdownMessage } from '../mediamtx'

describe('isNormalShutdownMessage', () => {
  describe('正常終了メッセージ', () => {
    it('Exiting normally を含む出力は正常終了メッセージ', () => {
      expect(isNormalShutdownMessage('Exiting normally, received signal 2.')).toBe(true)
    })

    it('Exiting normally のみの出力は正常終了メッセージ', () => {
      expect(isNormalShutdownMessage('Exiting normally')).toBe(true)
    })

    it('Request interrupted を含む出力は正常終了メッセージ', () => {
      expect(isNormalShutdownMessage('Request interrupted by user')).toBe(true)
    })

    it('前後に空白がある場合でも正常終了メッセージ', () => {
      expect(isNormalShutdownMessage('  Exiting normally, received signal 2.  ')).toBe(true)
    })

    it('改行を含む場合でも正常終了メッセージ', () => {
      expect(isNormalShutdownMessage('Exiting normally\n')).toBe(true)
    })
  })

  describe('エラーメッセージ', () => {
    it('一般的なエラーメッセージは正常終了ではない', () => {
      expect(isNormalShutdownMessage('Connection refused')).toBe(false)
    })

    it('アドレス使用中エラーは正常終了ではない', () => {
      expect(isNormalShutdownMessage('address already in use')).toBe(false)
    })

    it('空文字列は正常終了ではない', () => {
      expect(isNormalShutdownMessage('')).toBe(false)
    })

    it('バインドエラーは正常終了ではない', () => {
      expect(isNormalShutdownMessage('bind: permission denied')).toBe(false)
    })
  })
})
