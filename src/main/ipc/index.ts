import { BrowserWindow } from 'electron'
import { registerStreamingHandlers, cleanupStreaming } from './streaming'

export function registerAllHandlers(getMainWindow: () => BrowserWindow | null): void {
  registerStreamingHandlers(getMainWindow)
}

export { cleanupStreaming }
