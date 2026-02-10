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
    /^frame=\s*\d+/.test(output.trim())
  )
}
