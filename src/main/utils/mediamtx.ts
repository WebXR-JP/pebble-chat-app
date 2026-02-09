// MediaMTXの正常終了時のstderrメッセージかどうかを判定
export function isNormalShutdownMessage(output: string): boolean {
  const trimmed = output.trim()
  return trimmed.includes('Exiting normally') || trimmed.includes('Request interrupted')
}
