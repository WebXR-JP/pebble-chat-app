import { BrowserWindow } from 'electron'
import { registerStreamingHandlers, cleanupStreaming } from './streaming'
import { registerUpdateHandlers } from './update'

export function registerAllHandlers(getMainWindow: () => BrowserWindow | null): void {
  registerStreamingHandlers(getMainWindow)
  registerUpdateHandlers(getMainWindow)
}

export { cleanupStreaming }
