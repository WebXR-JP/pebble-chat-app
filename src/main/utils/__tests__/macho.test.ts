import { describe, it, expect } from 'vitest'
import { getMachOArchitecture, isMachOArchitectureCompatible } from '../macho'

// 実際の ffmpeg バイナリ先頭8バイト（magic + cputype、リトルエンディアン）
const ARM64_HEADER = Uint8Array.from([0xcf, 0xfa, 0xed, 0xfe, 0x0c, 0x00, 0x00, 0x01])
const X86_64_HEADER = Uint8Array.from([0xcf, 0xfa, 0xed, 0xfe, 0x07, 0x00, 0x00, 0x01])
// ユニバーサルバイナリ（ビッグエンディアン、アーキテクチャ数2）
const UNIVERSAL_HEADER = Uint8Array.from([0xca, 0xfe, 0xba, 0xbe, 0x00, 0x00, 0x00, 0x02])

describe('getMachOArchitecture', () => {
  it('arm64 の Mach-O を判定する', () => {
    expect(getMachOArchitecture(ARM64_HEADER)).toBe('arm64')
  })

  it('x86_64 の Mach-O を x64 と判定する', () => {
    expect(getMachOArchitecture(X86_64_HEADER)).toBe('x64')
  })

  it('ユニバーサルバイナリを判定する', () => {
    expect(getMachOArchitecture(UNIVERSAL_HEADER)).toBe('universal')
  })

  it('Mach-O でないファイルは unknown', () => {
    // Windows の実行ファイル（MZ ヘッダー）
    expect(getMachOArchitecture(Uint8Array.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]))).toBe('unknown')
  })

  it('未知の CPU タイプは unknown', () => {
    expect(getMachOArchitecture(Uint8Array.from([0xcf, 0xfa, 0xed, 0xfe, 0x12, 0x00, 0x00, 0x00]))).toBe('unknown')
  })

  it('8バイトに満たない場合は unknown', () => {
    expect(getMachOArchitecture(ARM64_HEADER.subarray(0, 4))).toBe('unknown')
    expect(getMachOArchitecture(new Uint8Array())).toBe('unknown')
  })

  it('大きなバッファの途中を指す subarray でも先頭から判定する', () => {
    const buffer = new Uint8Array(16)
    buffer.set(X86_64_HEADER, 8)
    expect(getMachOArchitecture(buffer.subarray(8))).toBe('x64')
  })
})

describe('isMachOArchitectureCompatible', () => {
  it('Apple Silicon で x86_64 版は互換なし（Rosetta がないと起動できない）', () => {
    expect(isMachOArchitectureCompatible('x64', 'arm64')).toBe(false)
  })

  it('同じアーキテクチャなら互換あり', () => {
    expect(isMachOArchitectureCompatible('arm64', 'arm64')).toBe(true)
    expect(isMachOArchitectureCompatible('x64', 'x64')).toBe(true)
  })

  it('ユニバーサルバイナリは互換あり', () => {
    expect(isMachOArchitectureCompatible('universal', 'arm64')).toBe(true)
  })

  it('判定できないものは互換ありとして扱う', () => {
    expect(isMachOArchitectureCompatible('unknown', 'arm64')).toBe(true)
  })
})
