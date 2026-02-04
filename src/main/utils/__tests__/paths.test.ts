import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'

// モックを設定
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/mock/userData')
  }
}))

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn()
  },
  existsSync: vi.fn()
}))

vi.mock('child_process', () => ({
  execSync: vi.fn()
}))

vi.mock('../platform', () => ({
  getMediaMTXBinaryName: vi.fn(() => 'mediamtx'),
  getFFmpegBinaryName: vi.fn(() => 'ffmpeg'),
  getPlatform: vi.fn(() => 'darwin')
}))

// テスト対象をインポート（モック設定後）
import {
  getUserDataPath,
  getBinariesPath,
  getMediaMTXPath,
  getMediaMTXConfigPath,
  getBundledFFmpegPath,
  getLogsPath,
  getTempPath,
  getFFmpegPath
} from '../paths'
import fs from 'fs'
import { execSync } from 'child_process'
import { getPlatform } from '../platform'

describe('paths', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getUserDataPath', () => {
    it('app.getPath("userData") の結果を返す', () => {
      expect(getUserDataPath()).toBe('/mock/userData')
    })
  })

  describe('getBinariesPath', () => {
    it('userDataPath/bin を返す', () => {
      expect(getBinariesPath()).toBe(path.join('/mock/userData', 'bin'))
    })
  })

  describe('getMediaMTXPath', () => {
    it('binariesPath/mediamtx を返す', () => {
      expect(getMediaMTXPath()).toBe(path.join('/mock/userData', 'bin', 'mediamtx'))
    })
  })

  describe('getMediaMTXConfigPath', () => {
    it('binariesPath/mediamtx.yml を返す', () => {
      expect(getMediaMTXConfigPath()).toBe(path.join('/mock/userData', 'bin', 'mediamtx.yml'))
    })
  })

  describe('getBundledFFmpegPath', () => {
    it('binariesPath/ffmpeg を返す', () => {
      expect(getBundledFFmpegPath()).toBe(path.join('/mock/userData', 'bin', 'ffmpeg'))
    })
  })

  describe('getLogsPath', () => {
    it('userDataPath/logs を返す', () => {
      expect(getLogsPath()).toBe(path.join('/mock/userData', 'logs'))
    })
  })

  describe('getTempPath', () => {
    it('userDataPath/temp を返す', () => {
      expect(getTempPath()).toBe(path.join('/mock/userData', 'temp'))
    })
  })

  describe('getFFmpegPath', () => {
    describe('バンドル版が存在する場合', () => {
      it('バンドル版のパスを返す', () => {
        vi.mocked(fs.existsSync).mockReturnValue(true)

        const result = getFFmpegPath()

        expect(result).toBe(path.join('/mock/userData', 'bin', 'ffmpeg'))
        expect(fs.existsSync).toHaveBeenCalledWith(path.join('/mock/userData', 'bin', 'ffmpeg'))
      })
    })

    describe('バンドル版が存在せず、whichで見つかる場合（macOS）', () => {
      it('whichの結果を返す', () => {
        vi.mocked(getPlatform).mockReturnValue('darwin')
        vi.mocked(fs.existsSync).mockImplementation((p) => {
          if (p === path.join('/mock/userData', 'bin', 'ffmpeg')) return false
          if (p === '/usr/local/bin/ffmpeg') return true
          return false
        })
        vi.mocked(execSync).mockReturnValue('/usr/local/bin/ffmpeg\n')

        const result = getFFmpegPath()

        expect(result).toBe('/usr/local/bin/ffmpeg')
        expect(execSync).toHaveBeenCalledWith('which ffmpeg', expect.any(Object))
      })
    })

    describe('バンドル版が存在せず、whichで見つかる場合（Windows）', () => {
      it('whereの結果を返す', () => {
        vi.mocked(getPlatform).mockReturnValue('win32')
        vi.mocked(fs.existsSync).mockImplementation((p) => {
          if (p === path.join('/mock/userData', 'bin', 'ffmpeg')) return false
          if (p === 'C:\\ffmpeg\\bin\\ffmpeg.exe') return true
          return false
        })
        vi.mocked(execSync).mockReturnValue('C:\\ffmpeg\\bin\\ffmpeg.exe\r\n')

        const result = getFFmpegPath()

        expect(result).toBe('C:\\ffmpeg\\bin\\ffmpeg.exe')
        expect(execSync).toHaveBeenCalledWith('where ffmpeg', expect.any(Object))
      })
    })

    describe('バンドル版もwhichも失敗、一般的なパスで見つかる場合（macOS）', () => {
      it('Homebrew（Apple Silicon）のパスを返す', () => {
        vi.mocked(getPlatform).mockReturnValue('darwin')
        vi.mocked(fs.existsSync).mockImplementation((p) => {
          if (p === '/opt/homebrew/bin/ffmpeg') return true
          return false
        })
        vi.mocked(execSync).mockImplementation(() => {
          throw new Error('not found')
        })

        const result = getFFmpegPath()

        expect(result).toBe('/opt/homebrew/bin/ffmpeg')
      })

      it('Homebrew（Intel）のパスを返す', () => {
        vi.mocked(getPlatform).mockReturnValue('darwin')
        vi.mocked(fs.existsSync).mockImplementation((p) => {
          if (p === '/usr/local/bin/ffmpeg') return true
          return false
        })
        vi.mocked(execSync).mockImplementation(() => {
          throw new Error('not found')
        })

        const result = getFFmpegPath()

        expect(result).toBe('/usr/local/bin/ffmpeg')
      })
    })

    describe('バンドル版もwhichも失敗、一般的なパスで見つかる場合（Windows）', () => {
      it('Program Filesのパスを返す', () => {
        vi.mocked(getPlatform).mockReturnValue('win32')
        vi.mocked(fs.existsSync).mockImplementation((p) => {
          if (p === 'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe') return true
          return false
        })
        vi.mocked(execSync).mockImplementation(() => {
          throw new Error('not found')
        })

        const result = getFFmpegPath()

        expect(result).toBe('C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe')
      })
    })

    describe('どこにも見つからない場合', () => {
      it('null を返す', () => {
        vi.mocked(getPlatform).mockReturnValue('darwin')
        vi.mocked(fs.existsSync).mockReturnValue(false)
        vi.mocked(execSync).mockImplementation(() => {
          throw new Error('not found')
        })

        const result = getFFmpegPath()

        expect(result).toBeNull()
      })
    })

    describe('whichコマンドが空文字を返す場合', () => {
      it('一般的なパスを探索する', () => {
        vi.mocked(getPlatform).mockReturnValue('darwin')
        vi.mocked(fs.existsSync).mockImplementation((p) => {
          if (p === '/opt/homebrew/bin/ffmpeg') return true
          return false
        })
        vi.mocked(execSync).mockReturnValue('')

        const result = getFFmpegPath()

        expect(result).toBe('/opt/homebrew/bin/ffmpeg')
      })
    })

    describe('Linux の場合', () => {
      it('/usr/bin/ffmpeg を優先して探す', () => {
        vi.mocked(getPlatform).mockReturnValue('linux')
        vi.mocked(fs.existsSync).mockImplementation((p) => {
          if (p === '/usr/bin/ffmpeg') return true
          return false
        })
        vi.mocked(execSync).mockImplementation(() => {
          throw new Error('not found')
        })

        const result = getFFmpegPath()

        expect(result).toBe('/usr/bin/ffmpeg')
      })
    })
  })
})
