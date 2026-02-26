// FFmpegの情報出力（エラーではない）かどうかを判定
export function isFFmpegInfoMessage(output: string): boolean {
  return (
    // FFmpegバージョン情報
    output.includes('ffmpeg version') ||
    output.includes('configuration:') ||
    output.includes('built with') ||
    // ライブラリバージョン
    output.includes('libavutil') ||
    output.includes('libavcodec') ||
    output.includes('libavformat') ||
    output.includes('libavdevice') ||
    output.includes('libavfilter') ||
    output.includes('libswscale') ||
    output.includes('libswresample') ||
    output.includes('libpostproc') ||
    // ストリーム情報（入力認識時に出力される）
    output.includes('Input #') ||
    output.includes('Output #') ||
    output.includes('Stream #') ||
    output.includes('Metadata:') ||
    output.includes('Duration:') ||
    output.includes('title') ||
    // FFmpegインタラクティブメッセージ
    output.includes('Press [q] to stop') ||
    // コンテキストログ: FFmpegは全モジュールで [名前 @ アドレス] 形式をstderrに出力する
    /\[[^\]]+\s+@\s+(?:0x)?[0-9a-f]+\]/.test(output) ||
    // 一時的な警告（キーフレーム待ち、配信開始時に頻発するが正常）
    output.includes('Keyframe missing') ||
    output.includes('Discarding interframe without a prior keyframe') ||
    output.includes('Error submitting packet to decoder') ||
    // RTPパケットロス警告（ネットワーク起因、対処不可）
    output.includes('RTP: missed') ||
    // FFmpeg終了時の汎用メッセージ（配信停止時に出力される）
    output.includes('Conversion failed!') ||
    // FFmpegエンコード進捗情報
    /^frame=\s*\d+/.test(output.trim()) ||
    // x264エンコーダのバージョン・オプション行
    output.includes('x264 - core') ||
    output.includes('x264 [') ||
    // エンコーダ設定出力（bitrate, buffer size等）
    /bitrate\s*(max\/min\/avg:|=)/.test(output) ||
    output.includes('vbv_delay:') ||
    // FFmpegの重複メッセージ抑制ログ
    /Last message repeated \d+ times/.test(output) ||
    // デコーダのエラーコンシールメント（映像破損の自動修復、正常動作）
    /concealing .+ errors in .+ frame/.test(output) ||
    // コーデックライブラリ情報の断片（行バッファリング前のバージョンで発生）
    /Lavc\d+/.test(output) ||
    // ストリームパラメータの断片（行バッファリング前のバージョンで発生）
    /\d+k?\s+tbn/.test(output) ||
    // x264情報行の行バッファリング断片（`x264 - core` の `x` が前行に分離された残り）
    output.includes('H.264/MPEG-4 AVC codec') ||
    output.includes('options: cabac=') ||
    // ストリーム情報の末尾断片（`, start 0.035000` 等、tbnが前行に含まれた残り）
    /,?\s*start\s+\d+\.\d+/.test(output)
  )
}
