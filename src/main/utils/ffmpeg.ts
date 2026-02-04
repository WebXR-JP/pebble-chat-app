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
    // コンテキストログ（rtsp, vp8, vist, libx264等）
    /\[(rtsp|vp8|vist#[0-9:\/]+|libx264|dec:vp8) @ 0x[0-9a-f]+\]/.test(output) ||
    // 一時的な警告（キーフレーム待ち、配信開始時に頻発するが正常）
    output.includes('Keyframe missing') ||
    output.includes('Discarding interframe without a prior keyframe') ||
    output.includes('Error submitting packet to decoder') ||
    // FFmpegエンコード進捗情報
    /^frame=\s*\d+/.test(output.trim())
  )
}
