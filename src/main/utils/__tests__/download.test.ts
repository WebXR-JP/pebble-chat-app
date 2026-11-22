import { describe, it, expect } from 'vitest'
import { resolveRedirectUrl, createDownloadFileName, isSha256Match } from '../download'

describe('resolveRedirectUrl', () => {
  const currentUrl = 'https://github.com/bluenviron/mediamtx/releases/download/v1.9.3/mediamtx.zip'

  it.each([301, 302, 303, 307, 308])('%i は Location の絶対URLを返す', (status) => {
    expect(resolveRedirectUrl(status, 'https://objects.githubusercontent.com/file', currentUrl)).toBe(
      'https://objects.githubusercontent.com/file'
    )
  })

  it('相対URLの Location は現在のURLを基準に解決する', () => {
    expect(resolveRedirectUrl(302, '/other/path.zip', currentUrl)).toBe('https://github.com/other/path.zip')
  })

  it('200 はリダイレクトではないので null', () => {
    expect(resolveRedirectUrl(200, 'https://example.com', currentUrl)).toBeNull()
  })

  it('404 はリダイレクトではないので null', () => {
    expect(resolveRedirectUrl(404, undefined, currentUrl)).toBeNull()
  })

  it('ステータスコードが undefined なら null', () => {
    expect(resolveRedirectUrl(undefined, 'https://example.com', currentUrl)).toBeNull()
  })

  it('リダイレクトでも Location が無ければ null', () => {
    expect(resolveRedirectUrl(302, undefined, currentUrl)).toBeNull()
  })
})

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
