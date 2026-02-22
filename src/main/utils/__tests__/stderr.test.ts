import { describe, it, expect } from 'vitest'
import { splitChunkIntoLines } from '../stderr'

describe('splitChunkIntoLines', () => {
  describe('基本的な行分割', () => {
    it('改行で終わる単一行を返す', () => {
      const result = splitChunkIntoLines('', 'hello world\n')
      expect(result.lines).toEqual(['hello world'])
      expect(result.remainingBuffer).toBe('')
    })

    it('複数行を分割して返す', () => {
      const result = splitChunkIntoLines('', 'line1\nline2\nline3\n')
      expect(result.lines).toEqual(['line1', 'line2', 'line3'])
      expect(result.remainingBuffer).toBe('')
    })

    it('改行で終わらないチャンクは未完了行をバッファに残す', () => {
      const result = splitChunkIntoLines('', 'complete line\nincomplete')
      expect(result.lines).toEqual(['complete line'])
      expect(result.remainingBuffer).toBe('incomplete')
    })

    it('改行を含まないチャンクは全てバッファに残る', () => {
      const result = splitChunkIntoLines('', 'no newline here')
      expect(result.lines).toEqual([])
      expect(result.remainingBuffer).toBe('no newline here')
    })
  })

  describe('バッファとの結合', () => {
    it('バッファの続きとチャンクを結合して完全な行にする', () => {
      const result = splitChunkIntoLines('Stream #0:0: Video: h264, 60 fps', ', 3 tbr, 90k tbn\n')
      expect(result.lines).toEqual(['Stream #0:0: Video: h264, 60 fps, 3 tbr, 90k tbn'])
      expect(result.remainingBuffer).toBe('')
    })

    it('バッファの続きに複数行が来ても正しく分割する', () => {
      const result = splitChunkIntoLines('partial', ' end\nnext line\n')
      expect(result.lines).toEqual(['partial end', 'next line'])
      expect(result.remainingBuffer).toBe('')
    })

    it('バッファの続きに未完了行が含まれる場合はバッファに残す', () => {
      const result = splitChunkIntoLines('first', ' half\nsecond ha')
      expect(result.lines).toEqual(['first half'])
      expect(result.remainingBuffer).toBe('second ha')
    })
  })

  describe('空行のフィルタリング', () => {
    it('空行は除外される', () => {
      const result = splitChunkIntoLines('', 'line1\n\nline2\n')
      expect(result.lines).toEqual(['line1', 'line2'])
    })

    it('スペースのみの行は除外される', () => {
      const result = splitChunkIntoLines('', 'line1\n   \nline2\n')
      expect(result.lines).toEqual(['line1', 'line2'])
    })

    it('全て空行の場合は空配列を返す', () => {
      const result = splitChunkIntoLines('', '\n\n\n')
      expect(result.lines).toEqual([])
      expect(result.remainingBuffer).toBe('')
    })
  })

  describe('FFmpegのStream行分割シナリオ', () => {
    it('1チャンクで完全な行が来る場合', () => {
      const fullLine = 'Stream #0:0: Video: h264, yuv420p, 854x480, 60 fps, 3 tbr, 90k tbn\n'
      const result = splitChunkIntoLines('', fullLine)
      expect(result.lines).toEqual([
        'Stream #0:0: Video: h264, yuv420p, 854x480, 60 fps, 3 tbr, 90k tbn'
      ])
    })

    it('2チャンクに分割された行が結合される', () => {
      const chunk1 = 'Stream #0:0: Video: h264, yuv420p, 854x480'
      const chunk2 = ', 60 fps, 3 tbr, 90k tbn\n'

      // 1回目: 未完了行がバッファに残る
      const result1 = splitChunkIntoLines('', chunk1)
      expect(result1.lines).toEqual([])
      expect(result1.remainingBuffer).toBe(chunk1)

      // 2回目: バッファと結合されて完全な行になる
      const result2 = splitChunkIntoLines(result1.remainingBuffer, chunk2)
      expect(result2.lines).toEqual([
        'Stream #0:0: Video: h264, yuv420p, 854x480, 60 fps, 3 tbr, 90k tbn'
      ])
      expect(result2.remainingBuffer).toBe('')
    })

    it('3チャンクに分割された行が結合される', () => {
      const chunk1 = 'Stream #0:0: Video'
      const chunk2 = ': h264, yuv420p'
      const chunk3 = ', 854x480, 60 fps\n'

      const result1 = splitChunkIntoLines('', chunk1)
      const result2 = splitChunkIntoLines(result1.remainingBuffer, chunk2)
      expect(result2.lines).toEqual([])

      const result3 = splitChunkIntoLines(result2.remainingBuffer, chunk3)
      expect(result3.lines).toEqual(['Stream #0:0: Video: h264, yuv420p, 854x480, 60 fps'])
    })
  })

  describe('エッジケース', () => {
    it('空のバッファと空のチャンク', () => {
      const result = splitChunkIntoLines('', '')
      expect(result.lines).toEqual([])
      expect(result.remainingBuffer).toBe('')
    })

    it('バッファのみで新規チャンクが空', () => {
      const result = splitChunkIntoLines('buffered data', '')
      expect(result.lines).toEqual([])
      expect(result.remainingBuffer).toBe('buffered data')
    })

    it('改行のみのチャンク', () => {
      const result = splitChunkIntoLines('buffered', '\n')
      expect(result.lines).toEqual(['buffered'])
      expect(result.remainingBuffer).toBe('')
    })
  })
})
