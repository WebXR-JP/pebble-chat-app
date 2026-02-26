// MediaMTXのstderr出力のうち、エラーではないメッセージかどうかを判定
// 空行、正常終了メッセージなどが該当
export function isIgnorableStderrMessage(output: string): boolean {
  const trimmed = output.trim()
  if (!trimmed) return true
  return (
    trimmed.includes('Exiting normally') ||
    trimmed.includes('Request interrupted') ||
    // Go runtime スタックトレース行（panic: 行はフィルタしない＝実エラーとしてSentryに送る）
    /\.go:\d+/.test(trimmed) ||
    /^goroutine\s+\d+/.test(trimmed) ||
    /0x[0-9a-f]{6,}/.test(trimmed)
  )
}
