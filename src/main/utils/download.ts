// ダウンロード処理用のユーティリティ

// ダウンロード用の一時ファイル名を生成する
// Windowsではウイルス対策ソフトや削除待ちのハンドルで前回のファイルがロックされていることがあるため、
// 試行ごとに別名にしてEPERMを避ける
export function createDownloadFileName(baseName: string, ext: string, timestamp: number): string {
  return `${baseName}.${timestamp}.${ext}`
}

// ダウンロードしたファイルのSHA256が期待値と一致するか（16進表記の大文字小文字は区別しない）
export function isSha256Match(actual: string, expected: string): boolean {
  return actual.toLowerCase() === expected.toLowerCase()
}
