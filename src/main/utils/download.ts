// ダウンロード処理用のユーティリティ

const REDIRECT_STATUS_CODES = [301, 302, 303, 307, 308]

// リダイレクト先のURLを解決する（リダイレクトでなければnull）
// Locationヘッダーは相対URLの場合もあるため、現在のURLを基準に解決する
export function resolveRedirectUrl(
  statusCode: number | undefined,
  location: string | undefined,
  currentUrl: string
): string | null {
  if (!REDIRECT_STATUS_CODES.includes(statusCode ?? 0)) return null
  if (!location) return null
  return new URL(location, currentUrl).toString()
}

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
