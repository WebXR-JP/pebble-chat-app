import { ipcMain, shell, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import { checkForUpdate } from '../services/updateChecker'

export const AUTO_CHECK_DELAY_MS = 5000

export function registerUpdateHandlers(getMainWindow: () => BrowserWindow | null): void {
  // 手動チェック
  ipcMain.handle(IPC_CHANNELS.UPDATE_CHECK, async () => {
    return await checkForUpdate()
  })

  // 外部URLをブラウザで開く
  ipcMain.handle(IPC_CHANNELS.OPEN_EXTERNAL, async (_event, url: string) => {
    await shell.openExternal(url)
  })

  // アプリ起動後に自動チェック
  setTimeout(async () => {
    const info = await checkForUpdate()
    if (!info.available) return

    const window = getMainWindow()
    if (window && !window.isDestroyed()) {
      window.webContents.send(IPC_CHANNELS.UPDATE_AVAILABLE, info)
    }
  }, AUTO_CHECK_DELAY_MS)
}
