// MediaMTXのstderr出力のうち、エラーではないメッセージかどうかを判定
// 空行、正常終了メッセージなどが該当
export function isIgnorableStderrMessage(output: string): boolean {
  const trimmed = output.trim()
  if (!trimmed) return true
  return trimmed.includes('Exiting normally') || trimmed.includes('Request interrupted')
}
