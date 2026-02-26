import { describe, it, expect } from 'vitest'
import { isIgnorableStderrMessage } from '../mediamtx'

describe('isIgnorableStderrMessage', () => {
  describe('空行・空白のみ', () => {
    it('空文字列は無視対象', () => {
      expect(isIgnorableStderrMessage('')).toBe(true)
    })

    it('空白のみは無視対象', () => {
      expect(isIgnorableStderrMessage('   ')).toBe(true)
    })

    it('改行のみは無視対象', () => {
      expect(isIgnorableStderrMessage('\n')).toBe(true)
    })

    it('改行と空白の組み合わせは無視対象', () => {
      expect(isIgnorableStderrMessage('  \n  ')).toBe(true)
    })
  })

  describe('正常終了メッセージ', () => {
    it('Exiting normally を含む出力は無視対象', () => {
      expect(isIgnorableStderrMessage('Exiting normally, received signal 2.')).toBe(true)
    })

    it('Exiting normally のみの出力は無視対象', () => {
      expect(isIgnorableStderrMessage('Exiting normally')).toBe(true)
    })

    it('Request interrupted を含む出力は無視対象', () => {
      expect(isIgnorableStderrMessage('Request interrupted by user')).toBe(true)
    })

    it('前後に空白がある場合でも無視対象', () => {
      expect(isIgnorableStderrMessage('  Exiting normally, received signal 2.  ')).toBe(true)
    })

    it('改行を含む場合でも無視対象', () => {
      expect(isIgnorableStderrMessage('Exiting normally\n')).toBe(true)
    })
  })

  describe('Goスタックトレース行', () => {
    it('.go:行番号 を含む行は無視対象', () => {
      expect(isIgnorableStderrMessage('stream.go:251 +0x130')).toBe(true)
    })

    it('Goファイルパスを含む行は無視対象', () => {
      expect(
        isIgnorableStderrMessage(
          'github.com/bluenviron/mediamtx/internal/core/path.go:456 +0x2a4'
        )
      ).toBe(true)
    })

    it('goroutineヘッダ行は無視対象', () => {
      expect(isIgnorableStderrMessage('goroutine 1 [running]:')).toBe(true)
    })

    it('goroutine 複数桁IDは無視対象', () => {
      expect(isIgnorableStderrMessage('goroutine 123 [chan receive]:')).toBe(true)
    })

    it('Goメモリアドレスを含む行は無視対象', () => {
      expect(isIgnorableStderrMessage('main.(*Server).run(0xc0000b47e0)')).toBe(true)
    })

    it('panic: 行はフィルタされない（実エラー）', () => {
      expect(isIgnorableStderrMessage('panic: runtime error: invalid memory address')).toBe(false)
    })
  })

  describe('エラーメッセージ', () => {
    it('一般的なエラーメッセージは無視対象ではない', () => {
      expect(isIgnorableStderrMessage('Connection refused')).toBe(false)
    })

    it('アドレス使用中エラーは無視対象ではない', () => {
      expect(isIgnorableStderrMessage('address already in use')).toBe(false)
    })

    it('バインドエラーは無視対象ではない', () => {
      expect(isIgnorableStderrMessage('bind: permission denied')).toBe(false)
    })
  })
})
