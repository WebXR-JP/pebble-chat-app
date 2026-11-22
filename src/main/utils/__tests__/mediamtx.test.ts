import { describe, it, expect } from 'vitest'
import {
  isIgnorableStderrMessage,
  isMediaMTXReadyLog,
  isMediaMTXErrorLog,
  formatMediaMTXStartupError
} from '../mediamtx'

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

describe('isMediaMTXReadyLog', () => {
  it('WebRTCリスナーのオープンは起動完了', () => {
    expect(isMediaMTXReadyLog('2026/11/11 22:31:11 INF [WebRTC] listener opened on :8889 (HTTP), :8189 (ICE/UDP)')).toBe(true)
  })

  it('RTSPリスナーのオープンだけでは起動完了ではない', () => {
    expect(
      isMediaMTXReadyLog('2026/11/11 22:31:11 INF [RTSP] listener opened on :8554 (TCP), :8000 (UDP/RTP), :8001 (UDP/RTCP)')
    ).toBe(false)
  })

  it('RTMPリスナーのオープンだけでは起動完了ではない', () => {
    expect(isMediaMTXReadyLog('2026/11/11 22:31:11 INF [RTMP] listener opened on :1935')).toBe(false)
  })
})

describe('isMediaMTXErrorLog', () => {
  it('ERRレベルのログはエラー', () => {
    expect(
      isMediaMTXErrorLog(
        '2026/11/11 22:31:11 ERR listen tcp :8888: bind: An attempt was made to access a socket in a way forbidden by its access permissions.'
      )
    ).toBe(true)
  })

  it('INFレベルのログはエラーではない', () => {
    expect(isMediaMTXErrorLog('2026/11/11 22:31:11 INF MediaMTX v1.9.3')).toBe(false)
  })

  it('WARレベルのログはエラーではない', () => {
    expect(isMediaMTXErrorLog('2026/11/11 22:31:11 WAR something')).toBe(false)
  })

  it('メッセージ本文に ERR を含むだけの行はエラーではない', () => {
    expect(isMediaMTXErrorLog('2026/11/11 22:31:11 INF [path live] ERR in name')).toBe(false)
  })

  it('前後の空白は無視する', () => {
    expect(isMediaMTXErrorLog('  2026/11/11 22:31:11 ERR boom\n')).toBe(true)
  })
})

describe('formatMediaMTXStartupError', () => {
  it('Windowsのポート予約によるbind失敗はポート番号付きのメッセージにする', () => {
    const message = formatMediaMTXStartupError(
      '2026/11/11 22:31:11 ERR listen tcp :8889: bind: An attempt was made to access a socket in a way forbidden by its access permissions.'
    )
    expect(message).toContain('ポート8889を使用できませんでした')
  })

  it('アドレス使用中によるbind失敗もポート番号付きのメッセージにする', () => {
    const message = formatMediaMTXStartupError('2026/11/11 22:31:11 ERR listen tcp :1935: bind: address already in use')
    expect(message).toContain('ポート1935を使用できませんでした')
  })

  it('UDPのbind失敗も対象', () => {
    const message = formatMediaMTXStartupError('2026/11/11 22:31:11 ERR listen udp :8000: bind: address already in use')
    expect(message).toContain('ポート8000を使用できませんでした')
  })

  it('bind失敗以外は元のメッセージをtrimして返す', () => {
    expect(formatMediaMTXStartupError('  2026/11/11 22:31:11 ERR something else\n')).toBe(
      '2026/11/11 22:31:11 ERR something else'
    )
  })
})
