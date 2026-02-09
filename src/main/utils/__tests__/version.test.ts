import { describe, it, expect } from 'vitest'
import { parseVersion, isNewerVersion, isValidVersionManifest, getDownloadKey } from '../version'

describe('parseVersion', () => {
  it('有効なバージョン文字列をパースする', () => {
    expect(parseVersion('1.2.3')).toEqual([1, 2, 3])
    expect(parseVersion('0.2.6')).toEqual([0, 2, 6])
    expect(parseVersion('10.20.30')).toEqual([10, 20, 30])
  })

  it('無効なバージョン文字列はnullを返す', () => {
    expect(parseVersion('')).toBeNull()
    expect(parseVersion('1.2')).toBeNull()
    expect(parseVersion('1.2.3.4')).toBeNull()
    expect(parseVersion('v1.2.3')).toBeNull()
    expect(parseVersion('abc')).toBeNull()
  })
})

describe('isNewerVersion', () => {
  it('メジャーバージョンが大きい場合trueを返す', () => {
    expect(isNewerVersion('0.2.6', '1.0.0')).toBe(true)
  })

  it('マイナーバージョンが大きい場合trueを返す', () => {
    expect(isNewerVersion('0.2.6', '0.3.0')).toBe(true)
  })

  it('パッチバージョンが大きい場合trueを返す', () => {
    expect(isNewerVersion('0.2.6', '0.2.7')).toBe(true)
  })

  it('同じバージョンの場合falseを返す', () => {
    expect(isNewerVersion('0.2.6', '0.2.6')).toBe(false)
  })

  it('リモートが古い場合falseを返す', () => {
    expect(isNewerVersion('0.2.6', '0.2.5')).toBe(false)
    expect(isNewerVersion('1.0.0', '0.9.9')).toBe(false)
  })

  it('無効なバージョン文字列の場合falseを返す', () => {
    expect(isNewerVersion('invalid', '0.2.7')).toBe(false)
    expect(isNewerVersion('0.2.6', 'invalid')).toBe(false)
  })
})

describe('isValidVersionManifest', () => {
  const validManifest = {
    version: '0.2.7',
    releaseDate: '2026-02-09',
    downloads: {
      'mac-arm64': 'https://example.com/PebbleChat-mac-arm64.dmg',
      'mac-x64': 'https://example.com/PebbleChat-mac-x64.dmg',
      'win-x64': 'https://example.com/PebbleChat-win-x64.exe'
    }
  }

  it('有効なマニフェストを受け入れる', () => {
    expect(isValidVersionManifest(validManifest)).toBe(true)
  })

  it('nullを拒否する', () => {
    expect(isValidVersionManifest(null)).toBe(false)
  })

  it('文字列を拒否する', () => {
    expect(isValidVersionManifest('not an object')).toBe(false)
  })

  it('versionが欠けている場合拒否する', () => {
    const { version: _, ...rest } = validManifest
    expect(isValidVersionManifest(rest)).toBe(false)
  })

  it('releaseDateが欠けている場合拒否する', () => {
    const { releaseDate: _, ...rest } = validManifest
    expect(isValidVersionManifest(rest)).toBe(false)
  })

  it('downloadsが欠けている場合拒否する', () => {
    const { downloads: _, ...rest } = validManifest
    expect(isValidVersionManifest(rest)).toBe(false)
  })

  it('無効なバージョン文字列を拒否する', () => {
    expect(isValidVersionManifest({ ...validManifest, version: 'invalid' })).toBe(false)
  })
})

describe('getDownloadKey', () => {
  it('macOS arm64の場合mac-arm64を返す', () => {
    expect(getDownloadKey('darwin', 'arm64')).toBe('mac-arm64')
  })

  it('macOS x64の場合mac-x64を返す', () => {
    expect(getDownloadKey('darwin', 'x64')).toBe('mac-x64')
  })

  it('Windows x64の場合win-x64を返す', () => {
    expect(getDownloadKey('win32', 'x64')).toBe('win-x64')
  })

  it('Windows arm64の場合win-x64を返す（x64版を使用）', () => {
    expect(getDownloadKey('win32', 'arm64')).toBe('win-x64')
  })
})
