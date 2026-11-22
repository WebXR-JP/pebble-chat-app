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
  execSync: vi.fn(),
  execFileSync: vi.fn()
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
import { execSync, execFileSync } from 'child_process'
import { getPlatform } from '../platform'

// libx264を含む `ffmpeg -encoders` の出力
const ENCODERS_WITH_LIBX264 = ' V....D libx264              libx264 H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10 (codec h264)\n'

describe('paths', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 既定ではシステムのFFmpegは正常に動く
    vi.mocked(execFileSync).mockReturnValue(ENCODERS_WITH_LIBX264)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
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

    describe('システムのFFmpegが使えるか確認する', () => {
      it('バンドル版がある場合は実行確認しない', () => {
        vi.mocked(fs.existsSync).mockReturnValue(true)

        getFFmpegPath()

        expect(execFileSync).not.toHaveBeenCalled()
      })

      it('-encoders を実行して確認する', () => {
        vi.mocked(getPlatform).mockReturnValue('darwin')
        vi.mocked(fs.existsSync).mockImplementation((p) => p === '/opt/homebrew/bin/ffmpeg')
        vi.mocked(execSync).mockImplementation(() => {
          throw new Error('not found')
        })

        getFFmpegPath()

        expect(execFileSync).toHaveBeenCalledWith(
          '/opt/homebrew/bin/ffmpeg',
          ['-hide_banner', '-encoders'],
          expect.objectContaining({ timeout: expect.any(Number) })
        )
      })

      it('起動できないFFmpegはスキップして次の候補を使う', () => {
        vi.mocked(getPlatform).mockReturnValue('darwin')
        vi.mocked(fs.existsSync).mockImplementation(
          (p) => p === '/opt/homebrew/bin/ffmpeg' || p === '/usr/local/bin/ffmpeg'
        )
        vi.mocked(execSync).mockReturnValue('/opt/homebrew/bin/ffmpeg\n')
        vi.mocked(execFileSync).mockImplementation((file) => {
          if (file === '/opt/homebrew/bin/ffmpeg') {
            throw new Error('Command failed: dyld: Library not loaded: libx265.215.dylib')
          }
          return ENCODERS_WITH_LIBX264
        })

        const result = getFFmpegPath()

        expect(result).toBe('/usr/local/bin/ffmpeg')
      })

      it('libx264を含まないFFmpegはスキップする', () => {
        vi.mocked(getPlatform).mockReturnValue('win32')
        vi.mocked(fs.existsSync).mockImplementation((p) => p === 'C:\\ffmpeg\\bin\\ffmpeg.exe')
        vi.mocked(execSync).mockReturnValue('C:\\ffmpeg\\bin\\ffmpeg.exe\r\n')
        vi.mocked(execFileSync).mockReturnValue(' V....D libopenh264          OpenH264 H.264 / AVC\n')

        const result = getFFmpegPath()

        expect(result).toBeNull()
      })

      it('使えるFFmpegが1つもなければ null を返す（バンドル版をダウンロードさせる）', () => {
        vi.mocked(getPlatform).mockReturnValue('darwin')
        vi.mocked(fs.existsSync).mockImplementation((p) => p === '/opt/homebrew/bin/ffmpeg')
        vi.mocked(execSync).mockReturnValue('/opt/homebrew/bin/ffmpeg\n')
        vi.mocked(execFileSync).mockImplementation(() => {
          throw new Error('Command failed')
        })

        const result = getFFmpegPath()

        expect(result).toBeNull()
      })

      it('whichと一般的なパスで同じFFmpegが見つかっても実行確認は1回だけ', () => {
        vi.mocked(getPlatform).mockReturnValue('darwin')
        vi.mocked(fs.existsSync).mockImplementation((p) => p === '/opt/homebrew/bin/ffmpeg')
        vi.mocked(execSync).mockReturnValue('/opt/homebrew/bin/ffmpeg\n')
        vi.mocked(execFileSync).mockImplementation(() => {
          throw new Error('Command failed')
        })

        getFFmpegPath()

        expect(execFileSync).toHaveBeenCalledTimes(1)
      })
    })
  })
})
