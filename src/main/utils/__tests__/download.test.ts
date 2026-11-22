import { describe, it, expect } from 'vitest'
import { createDownloadFileName } from '../download'

describe('createDownloadFileName', () => {
  it('ベース名・タイムスタンプ・拡張子を連結する', () => {
    expect(createDownloadFileName('mediamtx', 'zip', 1700000000000)).toBe('mediamtx.1700000000000.zip')
  })

  it('複合拡張子もそのまま扱う', () => {
    expect(createDownloadFileName('mediamtx', 'tar.gz', 1)).toBe('mediamtx.1.tar.gz')
  })

  it('FFmpeg展開ディレクトリ判定（ffmpeg- で始まる）と衝突しない', () => {
    expect(createDownloadFileName('ffmpeg', 'zip', 1).startsWith('ffmpeg-')).toBe(false)
  })
})
