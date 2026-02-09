import { describe, it, expect, vi, beforeEach } from 'vitest'

// Electron モック
vi.mock('electron', () => ({
  app: { getVersion: () => '0.2.6' }
}))

// os モック（darwin arm64 を返す）
vi.mock('os', () => ({
  default: { arch: () => 'arm64' },
  arch: () => 'arm64'
}))

// fetch モック
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// process.platform モック
const originalPlatform = process.platform
Object.defineProperty(process, 'platform', { value: 'darwin', writable: true })

const { checkForUpdate } = await import('../updateChecker')

const validManifest = {
  version: '0.3.0',
  releaseDate: '2026-02-09',
  downloads: {
    'mac-arm64': 'https://example.com/PebbleChat-mac-arm64.dmg',
    'mac-x64': 'https://example.com/PebbleChat-mac-x64.dmg',
    'win-x64': 'https://example.com/PebbleChat-win-x64.exe'
  }
}

function mockFetchResponse(body: unknown, ok = true, status = 200) {
  mockFetch.mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body)
  })
}

describe('checkForUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('新バージョンがある場合、available: trueを返す', async () => {
    mockFetchResponse(validManifest)

    const result = await checkForUpdate()

    expect(result.available).toBe(true)
    expect(result.currentVersion).toBe('0.2.6')
    expect(result.latestVersion).toBe('0.3.0')
    expect(result.downloadUrl).toBe('https://example.com/PebbleChat-mac-arm64.dmg')
    expect(result.releaseDate).toBe('2026-02-09')
  })

  it('同じバージョンの場合、available: falseを返す', async () => {
    mockFetchResponse({ ...validManifest, version: '0.2.6' })

    const result = await checkForUpdate()

    expect(result.available).toBe(false)
    expect(result.latestVersion).toBe('0.2.6')
  })

  it('古いバージョンの場合、available: falseを返す', async () => {
    mockFetchResponse({ ...validManifest, version: '0.1.0' })

    const result = await checkForUpdate()

    expect(result.available).toBe(false)
  })

  it('fetchがHTTPエラーを返した場合、available: falseを返す', async () => {
    mockFetchResponse(null, false, 404)

    const result = await checkForUpdate()

    expect(result.available).toBe(false)
    expect(result.currentVersion).toBe('0.2.6')
  })

  it('fetchがネットワークエラーで失敗した場合、available: falseを返す', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const result = await checkForUpdate()

    expect(result.available).toBe(false)
    expect(result.currentVersion).toBe('0.2.6')
  })

  it('不正なマニフェストの場合、available: falseを返す', async () => {
    mockFetchResponse({ invalid: 'data' })

    const result = await checkForUpdate()

    expect(result.available).toBe(false)
  })

  it('ダウンロードURLが存在しないプラットフォームの場合、downloadUrlがnullになる', async () => {
    mockFetchResponse({
      ...validManifest,
      downloads: { 'win-x64': 'https://example.com/win.exe' }
    })

    const result = await checkForUpdate()

    expect(result.available).toBe(true)
    expect(result.downloadUrl).toBeNull()
  })

  it('Cache-Control: no-cache ヘッダーを付けてfetchする', async () => {
    mockFetchResponse(validManifest)

    await checkForUpdate()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { 'Cache-Control': 'no-cache' }
      })
    )
  })

  it('AbortSignalを付けてfetchする', async () => {
    mockFetchResponse(validManifest)

    await checkForUpdate()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signal: expect.any(AbortSignal)
      })
    )
  })
})

// platform を元に戻す
Object.defineProperty(process, 'platform', { value: originalPlatform })
