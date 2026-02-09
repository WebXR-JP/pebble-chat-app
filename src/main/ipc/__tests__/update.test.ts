import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { UpdateInfo } from '../../../shared/types'
import { IPC_CHANNELS } from '../../../shared/types'

// Electron モック
const mockHandle = vi.fn()
const mockOpenExternal = vi.fn()
const mockSend = vi.fn()

vi.mock('electron', () => ({
  ipcMain: { handle: (...args: unknown[]) => mockHandle(...args) },
  shell: { openExternal: (...args: unknown[]) => mockOpenExternal(...args) }
}))

// checkForUpdate モック
const mockCheckForUpdate = vi.fn()
vi.mock('../../services/updateChecker', () => ({
  checkForUpdate: (...args: unknown[]) => mockCheckForUpdate(...args)
}))

// registerUpdateHandlers を動的にインポート（モック適用後）
const { registerUpdateHandlers, AUTO_CHECK_DELAY_MS } = await import('../update')

function createMockWindow(destroyed = false) {
  return {
    isDestroyed: () => destroyed,
    webContents: { send: mockSend }
  } as unknown as import('electron').BrowserWindow
}

const updateAvailable: UpdateInfo = {
  available: true,
  currentVersion: '0.2.6',
  latestVersion: '0.3.0',
  downloadUrl: 'https://example.com/download.dmg',
  releaseDate: '2026-02-09'
}

const noUpdate: UpdateInfo = {
  available: false,
  currentVersion: '0.2.6',
  latestVersion: '0.2.6',
  downloadUrl: null,
  releaseDate: null
}

describe('registerUpdateHandlers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('UPDATE_CHECKとOPEN_EXTERNALのハンドラを登録する', () => {
    mockCheckForUpdate.mockResolvedValue(noUpdate)
    registerUpdateHandlers(() => null)

    const channels = mockHandle.mock.calls.map((call: unknown[]) => call[0])
    expect(channels).toContain(IPC_CHANNELS.UPDATE_CHECK)
    expect(channels).toContain(IPC_CHANNELS.OPEN_EXTERNAL)
  })

  it('UPDATE_CHECKハンドラがcheckForUpdateの結果を返す', async () => {
    mockCheckForUpdate.mockResolvedValue(updateAvailable)
    registerUpdateHandlers(() => null)

    const checkHandler = mockHandle.mock.calls.find(
      (call: unknown[]) => call[0] === IPC_CHANNELS.UPDATE_CHECK
    )?.[1] as () => Promise<UpdateInfo>

    const result = await checkHandler()
    expect(result).toEqual(updateAvailable)
  })

  it('OPEN_EXTERNALハンドラがshell.openExternalを呼ぶ', async () => {
    mockCheckForUpdate.mockResolvedValue(noUpdate)
    registerUpdateHandlers(() => null)

    const openHandler = mockHandle.mock.calls.find(
      (call: unknown[]) => call[0] === IPC_CHANNELS.OPEN_EXTERNAL
    )?.[1] as (_event: unknown, url: string) => Promise<void>

    await openHandler(null, 'https://example.com')
    expect(mockOpenExternal).toHaveBeenCalledWith('https://example.com')
  })

  it('自動チェックで更新がある場合、ウィンドウに通知を送る', async () => {
    mockCheckForUpdate.mockResolvedValue(updateAvailable)
    const window = createMockWindow()
    registerUpdateHandlers(() => window)

    await vi.advanceTimersByTimeAsync(AUTO_CHECK_DELAY_MS)

    expect(mockSend).toHaveBeenCalledWith(IPC_CHANNELS.UPDATE_AVAILABLE, updateAvailable)
  })

  it('自動チェックで更新がない場合、通知を送らない', async () => {
    mockCheckForUpdate.mockResolvedValue(noUpdate)
    const window = createMockWindow()
    registerUpdateHandlers(() => window)

    await vi.advanceTimersByTimeAsync(AUTO_CHECK_DELAY_MS)

    expect(mockSend).not.toHaveBeenCalled()
  })

  it('ウィンドウがnullの場合、通知を送らない', async () => {
    mockCheckForUpdate.mockResolvedValue(updateAvailable)
    registerUpdateHandlers(() => null)

    await vi.advanceTimersByTimeAsync(AUTO_CHECK_DELAY_MS)

    expect(mockSend).not.toHaveBeenCalled()
  })

  it('ウィンドウが破棄済みの場合、通知を送らない', async () => {
    mockCheckForUpdate.mockResolvedValue(updateAvailable)
    const window = createMockWindow(true)
    registerUpdateHandlers(() => window)

    await vi.advanceTimersByTimeAsync(AUTO_CHECK_DELAY_MS)

    expect(mockSend).not.toHaveBeenCalled()
  })
})
