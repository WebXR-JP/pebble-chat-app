import { describe, it, expect, vi, beforeEach } from 'vitest'

// osモジュールをモック
vi.mock('os', () => ({
  default: {
    platform: vi.fn(),
    arch: vi.fn()
  },
  platform: vi.fn(),
  arch: vi.fn()
}))

// テスト対象をインポート（モック設定後）
import {
  getPlatform,
  getArchitecture,
  getMediaMTXDownloadUrl,
  getMediaMTXBinaryName,
  getFFmpegDownloadUrl,
  getFFmpegBinaryName
} from '../platform'
import os from 'os'

describe('platform', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPlatform', () => {
    it('darwin を返す', () => {
      vi.mocked(os.platform).mockReturnValue('darwin')
      expect(getPlatform()).toBe('darwin')
    })

    it('win32 を返す', () => {
      vi.mocked(os.platform).mockReturnValue('win32')
      expect(getPlatform()).toBe('win32')
    })

    it('linux を返す', () => {
      vi.mocked(os.platform).mockReturnValue('linux')
      expect(getPlatform()).toBe('linux')
    })

    it('サポートされていないプラットフォームでエラーを投げる', () => {
      vi.mocked(os.platform).mockReturnValue('freebsd')
      expect(() => getPlatform()).toThrow('Unsupported platform: freebsd')
    })
  })

  describe('getArchitecture', () => {
    it('x64 を返す', () => {
      vi.mocked(os.arch).mockReturnValue('x64')
      expect(getArchitecture()).toBe('x64')
    })

    it('arm64 を返す', () => {
      vi.mocked(os.arch).mockReturnValue('arm64')
      expect(getArchitecture()).toBe('arm64')
    })

    it('サポートされていないアーキテクチャでエラーを投げる', () => {
      vi.mocked(os.arch).mockReturnValue('ia32')
      expect(() => getArchitecture()).toThrow('Unsupported architecture: ia32')
    })
  })

  describe('getMediaMTXDownloadUrl', () => {
    const version = '1.5.0'

    it('macOS x64 の URL を返す', () => {
      vi.mocked(os.platform).mockReturnValue('darwin')
      vi.mocked(os.arch).mockReturnValue('x64')

      const url = getMediaMTXDownloadUrl(version)

      expect(url).toBe(
        `https://github.com/bluenviron/mediamtx/releases/download/v${version}/mediamtx_v${version}_darwin_amd64.tar.gz`
      )
    })

    it('macOS arm64 の URL を返す', () => {
      vi.mocked(os.platform).mockReturnValue('darwin')
      vi.mocked(os.arch).mockReturnValue('arm64')

      const url = getMediaMTXDownloadUrl(version)

      expect(url).toBe(
        `https://github.com/bluenviron/mediamtx/releases/download/v${version}/mediamtx_v${version}_darwin_arm64.tar.gz`
      )
    })

    it('Windows x64 の URL を返す', () => {
      vi.mocked(os.platform).mockReturnValue('win32')
      vi.mocked(os.arch).mockReturnValue('x64')

      const url = getMediaMTXDownloadUrl(version)

      expect(url).toBe(
        `https://github.com/bluenviron/mediamtx/releases/download/v${version}/mediamtx_v${version}_windows_amd64.zip`
      )
    })

    it('Windows arm64 の URL を返す', () => {
      vi.mocked(os.platform).mockReturnValue('win32')
      vi.mocked(os.arch).mockReturnValue('arm64')

      const url = getMediaMTXDownloadUrl(version)

      expect(url).toBe(
        `https://github.com/bluenviron/mediamtx/releases/download/v${version}/mediamtx_v${version}_windows_arm64.zip`
      )
    })

    it('Linux x64 の URL を返す', () => {
      vi.mocked(os.platform).mockReturnValue('linux')
      vi.mocked(os.arch).mockReturnValue('x64')

      const url = getMediaMTXDownloadUrl(version)

      expect(url).toBe(
        `https://github.com/bluenviron/mediamtx/releases/download/v${version}/mediamtx_v${version}_linux_amd64.tar.gz`
      )
    })

    it('Linux arm64 の URL を返す', () => {
      vi.mocked(os.platform).mockReturnValue('linux')
      vi.mocked(os.arch).mockReturnValue('arm64')

      const url = getMediaMTXDownloadUrl(version)

      expect(url).toBe(
        `https://github.com/bluenviron/mediamtx/releases/download/v${version}/mediamtx_v${version}_linux_arm64.tar.gz`
      )
    })
  })

  describe('getMediaMTXBinaryName', () => {
    it('Windows では mediamtx.exe を返す', () => {
      vi.mocked(os.platform).mockReturnValue('win32')
      expect(getMediaMTXBinaryName()).toBe('mediamtx.exe')
    })

    it('macOS では mediamtx を返す', () => {
      vi.mocked(os.platform).mockReturnValue('darwin')
      expect(getMediaMTXBinaryName()).toBe('mediamtx')
    })

    it('Linux では mediamtx を返す', () => {
      vi.mocked(os.platform).mockReturnValue('linux')
      expect(getMediaMTXBinaryName()).toBe('mediamtx')
    })
  })

  describe('getFFmpegDownloadUrl', () => {
    it('Windows では gyan.dev の URL を返す', () => {
      vi.mocked(os.platform).mockReturnValue('win32')
      vi.mocked(os.arch).mockReturnValue('x64')

      const url = getFFmpegDownloadUrl()

      expect(url).toBe('https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip')
    })

    it('macOS x64 では evermeet.cx の URL を返す', () => {
      vi.mocked(os.platform).mockReturnValue('darwin')
      vi.mocked(os.arch).mockReturnValue('x64')

      const url = getFFmpegDownloadUrl()

      expect(url).toBe('https://evermeet.cx/ffmpeg/ffmpeg-7.1.zip')
    })

    it('macOS arm64 では evermeet.cx の URL を返す', () => {
      vi.mocked(os.platform).mockReturnValue('darwin')
      vi.mocked(os.arch).mockReturnValue('arm64')

      const url = getFFmpegDownloadUrl()

      expect(url).toBe('https://evermeet.cx/ffmpeg/ffmpeg-7.1.zip')
    })

    it('Linux では空文字を返す', () => {
      vi.mocked(os.platform).mockReturnValue('linux')
      vi.mocked(os.arch).mockReturnValue('x64')

      const url = getFFmpegDownloadUrl()

      expect(url).toBe('')
    })
  })

  describe('getFFmpegBinaryName', () => {
    it('Windows では ffmpeg.exe を返す', () => {
      vi.mocked(os.platform).mockReturnValue('win32')
      expect(getFFmpegBinaryName()).toBe('ffmpeg.exe')
    })

    it('macOS では ffmpeg を返す', () => {
      vi.mocked(os.platform).mockReturnValue('darwin')
      expect(getFFmpegBinaryName()).toBe('ffmpeg')
    })

    it('Linux では ffmpeg を返す', () => {
      vi.mocked(os.platform).mockReturnValue('linux')
      expect(getFFmpegBinaryName()).toBe('ffmpeg')
    })
  })
})
