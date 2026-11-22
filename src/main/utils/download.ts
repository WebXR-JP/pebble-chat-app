// ダウンロード処理用のユーティリティ

// ダウンロード用の一時ファイル名を生成する
// Windowsではウイルス対策ソフトや削除待ちのハンドルで前回のファイルがロックされていることがあるため、
// 試行ごとに別名にしてEPERMを避ける
export function createDownloadFileName(baseName: string, ext: string, timestamp: number): string {
  return `${baseName}.${timestamp}.${ext}`
}
