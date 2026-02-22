// stderrの行バッファリング用ユーティリティ
// Node.jsのdataイベントは行境界を保証しないため、チャンクを行単位に分割する

export interface SplitLinesResult {
  lines: string[]
  remainingBuffer: string
}

// バッファとチャンクを結合し、完全な行と未完了のバッファに分割する
export function splitChunkIntoLines(buffer: string, chunk: string): SplitLinesResult {
  const combined = buffer + chunk
  const parts = combined.split('\n')
  const remainingBuffer = parts.pop() ?? ''

  const lines = parts.filter((line) => line.trim() !== '')

  return { lines, remainingBuffer }
}
