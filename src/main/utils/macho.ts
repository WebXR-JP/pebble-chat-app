import type { Architecture } from '../../shared/types'

// Mach-O（macOSの実行ファイル）のヘッダーからCPUアーキテクチャを判定するユーティリティ

const MH_MAGIC_64 = 0xfeedfacf
const FAT_MAGIC = 0xcafebabe
const FAT_MAGIC_64 = 0xcafebabf
const CPU_TYPE_X86_64 = 0x01000007
const CPU_TYPE_ARM64 = 0x0100000c

// 判定に必要なヘッダーのバイト数（magic + cputype）
export const MACHO_HEADER_LENGTH = 8

export type MachOArchitecture = Architecture | 'universal' | 'unknown'

// ファイル先頭のバイト列からアーキテクチャを判定する
export function getMachOArchitecture(header: Uint8Array): MachOArchitecture {
  if (header.length < MACHO_HEADER_LENGTH) return 'unknown'

  const view = new DataView(header.buffer, header.byteOffset, header.byteLength)
  // ユニバーサルバイナリのヘッダーはビッグエンディアン
  const fatMagic = view.getUint32(0, false)
  if (fatMagic === FAT_MAGIC || fatMagic === FAT_MAGIC_64) return 'universal'

  // 64bit Mach-O のヘッダーはリトルエンディアン（x86_64 / arm64 とも）
  if (view.getUint32(0, true) !== MH_MAGIC_64) return 'unknown'

  const cpuType = view.getUint32(4, true)
  if (cpuType === CPU_TYPE_ARM64) return 'arm64'
  if (cpuType === CPU_TYPE_X86_64) return 'x64'
  return 'unknown'
}

// 実行中のプロセスと同じアーキテクチャで動くバイナリか
// ユニバーサルや判定できないものは動くものとして扱う（不要な再ダウンロードを避ける）
export function isMachOArchitectureCompatible(
  machOArch: MachOArchitecture,
  processArch: Architecture
): boolean {
  if (machOArch === 'universal' || machOArch === 'unknown') return true
  return machOArch === processArch
}
