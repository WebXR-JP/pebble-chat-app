import { describe, it, expect } from 'vitest'
import { createDownloadFileName, isSha256Match } from '../download'

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

describe('isSha256Match', () => {
  const hash = '1f66e9a690a7f1c9e60b012379f8869c11818d1797f45b21dbb2f2564ba61ae1'

  it('一致すれば true', () => {
    expect(isSha256Match(hash, hash)).toBe(true)
  })

  it('大文字小文字の違いは無視する', () => {
    expect(isSha256Match(hash.toUpperCase(), hash)).toBe(true)
  })

  it('異なれば false', () => {
    expect(isSha256Match(hash, '35b3d82cccc2c1d644d49d15f5e57eb913a08ef68f798042c90eecec62c51f1e')).toBe(false)
  })
})
