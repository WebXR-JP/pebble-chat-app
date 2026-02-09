import { describe, it, expect } from 'vitest'
import { shouldShowUpdateNotification, isDismissedVersion } from '../update'
import type { UpdateInfo } from '../../../../shared/types'

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

describe('shouldShowUpdateNotification', () => {
  it('更新があり未dismissの場合trueを返す', () => {
    expect(shouldShowUpdateNotification(updateAvailable, false)).toBe(true)
  })

  it('更新があるがdismiss済みの場合falseを返す', () => {
    expect(shouldShowUpdateNotification(updateAvailable, true)).toBe(false)
  })

  it('更新がない場合falseを返す', () => {
    expect(shouldShowUpdateNotification(noUpdate, false)).toBe(false)
  })

  it('更新がなくdismiss済みの場合もfalseを返す', () => {
    expect(shouldShowUpdateNotification(noUpdate, true)).toBe(false)
  })
})

describe('isDismissedVersion', () => {
  it('dismissedVersionが一致する場合trueを返す', () => {
    expect(isDismissedVersion('0.3.0', '0.3.0')).toBe(true)
  })

  it('dismissedVersionが異なる場合falseを返す', () => {
    expect(isDismissedVersion('0.3.0', '0.2.0')).toBe(false)
  })

  it('dismissedVersionがnullの場合falseを返す', () => {
    expect(isDismissedVersion('0.3.0', null)).toBe(false)
  })

  it('dismissedVersionが空文字の場合falseを返す', () => {
    expect(isDismissedVersion('0.3.0', '')).toBe(false)
  })
})
