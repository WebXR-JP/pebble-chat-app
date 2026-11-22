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

// 配信開始に必要なWebRTC(WHIP)リスナーが開いたことを示すログかどうか
// MediaMTXはリスナーを順に開き、どれか1つでも失敗するとプロセスごと終了するため、
// 最初の "listener opened" ではなく、レンダラーが接続するWebRTCリスナーを起動完了の目印にする
export function isMediaMTXReadyLog(line: string): boolean {
  return line.includes('[WebRTC] listener opened')
}

// MediaMTX自身のエラーログ（stdoutに出る "ERR" レベル）かどうか
// 例: "2026/11/11 22:31:11 ERR listen tcp :8888: bind: ..."
export function isMediaMTXErrorLog(line: string): boolean {
  return /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} ERR /.test(line.trim())
}

// MediaMTXの起動エラーをユーザー向けのメッセージに変換する
// ポートのbind失敗は原因と対処が分かるように言い換え、それ以外は元のメッセージを返す
export function formatMediaMTXStartupError(line: string): string {
  const trimmed = line.trim()
  const bindMatch = trimmed.match(/listen (?:tcp|udp) [^\s]*:(\d+): bind:/)
  if (!bindMatch) return trimmed

  return `ポート${bindMatch[1]}を使用できませんでした。他のアプリが使用しているか、OSによって予約されている可能性があります。PCを再起動するか、該当ポートを使用しているアプリを終了してから再度お試しください。`
}
