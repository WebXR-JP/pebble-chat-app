import { app } from 'electron'
import path from 'path'
import { getMediaMTXBinaryName } from './platform'

// ユーザーデータディレクトリ（バイナリ保存場所）
export function getUserDataPath(): string {
  return app.getPath('userData')
}

// バイナリ保存ディレクトリ
export function getBinariesPath(): string {
  return path.join(getUserDataPath(), 'bin')
}

// MediaMTXバイナリパス
export function getMediaMTXPath(): string {
  return path.join(getBinariesPath(), getMediaMTXBinaryName())
}

// MediaMTX設定ファイルパス
export function getMediaMTXConfigPath(): string {
  return path.join(getBinariesPath(), 'mediamtx.yml')
}

// ログディレクトリ
export function getLogsPath(): string {
  return path.join(getUserDataPath(), 'logs')
}

// 一時ディレクトリ（ダウンロード用）
export function getTempPath(): string {
  return path.join(getUserDataPath(), 'temp')
}
