import { describe, it, expect } from 'vitest'
import { isFFmpegInfoMessage } from '../ffmpeg'

describe('isFFmpegInfoMessage', () => {
  describe('FFmpegバージョン情報', () => {
    it('ffmpeg version を含む出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('ffmpeg version 6.0 Copyright (c) 2000-2023')).toBe(true)
    })

    it('configuration: を含む出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('configuration: --enable-gpl --enable-nonfree')).toBe(true)
    })

    it('built with を含む出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('built with gcc 12.2.0')).toBe(true)
    })
  })

  describe('ライブラリバージョン', () => {
    it('libavutil を含む出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('libavutil      58.  2.100')).toBe(true)
    })

    it('libavcodec を含む出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('libavcodec     60.  3.100')).toBe(true)
    })

    it('libavformat を含む出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('libavformat    60.  3.100')).toBe(true)
    })

    it('libavdevice を含む出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('libavdevice    60.  1.100')).toBe(true)
    })

    it('libavfilter を含む出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('libavfilter     9.  3.100')).toBe(true)
    })

    it('libswscale を含む出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('libswscale      7.  1.100')).toBe(true)
    })

    it('libswresample を含む出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('libswresample   4. 10.100')).toBe(true)
    })

    it('libpostproc を含む出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('libpostproc    57.  1.100')).toBe(true)
    })
  })

  describe('ストリーム情報', () => {
    it('Input # を含む出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('Input #0, rtsp, from "rtsp://localhost:8554/live"')).toBe(true)
    })

    it('Stream # を含む出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('Stream #0:0: Video: vp8, 1920x1080, 30 fps')).toBe(true)
    })

    it('Metadata: を含む出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('Metadata:')).toBe(true)
    })

    it('Duration: を含む出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('Duration: N/A, start: 0.000000, bitrate: N/A')).toBe(true)
    })

    it('title を含む出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('title           : Video Stream')).toBe(true)
    })
  })

  describe('FFmpegインタラクティブメッセージ', () => {
    it('Press [q] to stop を含む出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('Press [q] to stop, [?] for help')).toBe(true)
    })
  })

  describe('コンテキストログ', () => {
    it('rtsp コンテキストログは情報メッセージ', () => {
      expect(isFFmpegInfoMessage('[rtsp @ 0x7f8b1c000000] some message')).toBe(true)
    })

    it('vp8 コンテキストログは情報メッセージ', () => {
      expect(isFFmpegInfoMessage('[vp8 @ 0x7f8b1c000000] some message')).toBe(true)
    })

    it('libx264 コンテキストログは情報メッセージ', () => {
      expect(isFFmpegInfoMessage('[libx264 @ 0x7f8b1c000000] using cpu capabilities')).toBe(true)
    })

    it('dec:vp8 コンテキストログは情報メッセージ', () => {
      expect(isFFmpegInfoMessage('[dec:vp8 @ 0x7f8b1c000000] some message')).toBe(true)
    })

    it('vist# コンテキストログは情報メッセージ', () => {
      expect(isFFmpegInfoMessage('[vist#0:0/0 @ 0x7f8b1c000000] some message')).toBe(true)
    })

    it('flv コンテキストログは情報メッセージ', () => {
      expect(isFFmpegInfoMessage('[flv @ 0xb03050500] Failed to update header with correct duration.')).toBe(true)
    })

    it('flv filesize コンテキストログは情報メッセージ', () => {
      expect(isFFmpegInfoMessage('[flv @ 0xb03050500] Failed to update header with correct filesize.')).toBe(true)
    })

    it('vf# コンテキストログは情報メッセージ', () => {
      expect(isFFmpegInfoMessage('[vf#0:0 @ 0000022f7f8dee40] Reconfiguring filter graph because video parameters changed to yuv420p(unknown, unknown), 1004x1080')).toBe(true)
    })

    it('Windowsアドレス形式の rtsp コンテキストログは情報メッセージ', () => {
      expect(isFFmpegInfoMessage('[rtsp @ 0000028b3b023f80] max delay reached. need to consume packet')).toBe(true)
    })

    it('Windowsアドレス形式の libx264 コンテキストログは情報メッセージ', () => {
      expect(isFFmpegInfoMessage('[libx264 @ 0000028b3bc75040] using cpu capabilities: MMX2 SSE2Fast SSSE3 SSE4.2 AVX FMA3 BMI2 AVX2')).toBe(true)
    })
  })

  describe('一時的な警告', () => {
    it('Keyframe missing を含む出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('Keyframe missing (requests recovery)')).toBe(true)
    })

    it('Discarding interframe を含む出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('Discarding interframe without a prior keyframe')).toBe(true)
    })

    it('Error submitting packet to decoder を含む出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('Error submitting packet to decoder: Invalid data')).toBe(true)
    })
  })

  describe('RTPパケットロス警告', () => {
    it('RTP: missed を含む出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('RTP: missed 22 packets')).toBe(true)
    })

    it('RTP: missed 1 packets を含む出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('RTP: missed 1 packets')).toBe(true)
    })
  })

  describe('FFmpeg終了時の汎用メッセージ', () => {
    it('Conversion failed! は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('Conversion failed!')).toBe(true)
    })
  })

  describe('エンコード進捗情報', () => {
    it('frame= で始まる出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('frame=  123 fps=30 q=28.0 size=    1234kB time=00:00:04.10')).toBe(true)
    })

    it('frame= で始まる出力（先頭スペースあり）は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('   frame=  123 fps=30')).toBe(true)
    })
  })

  describe('出力ストリーム情報', () => {
    it('Output # を含む出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('Output #0, flv, to \'rtmp://pebble.xrift.net:1935/live/abc\':')).toBe(true)
    })
  })

  describe('x264エンコーダ情報', () => {
    it('x264バージョン行は情報メッセージ', () => {
      expect(
        isFFmpegInfoMessage(
          'x264 - core 165 r3223 0480cb0 - H.264/MPEG-4 AVC codec - Copyleft 2003-2025 - http://www.videolan.org/x264.html - options: cabac=0 ref=1'
        )
      ).toBe(true)
    })

    it('x264 infoブラケットログは情報メッセージ', () => {
      expect(isFFmpegInfoMessage('x264 [info]: using cpu capabilities: MMX2 SSE2Fast')).toBe(true)
    })

    it('x264 profileログは情報メッセージ', () => {
      expect(isFFmpegInfoMessage('x264 [info]: profile Constrained Baseline, level 3.0')).toBe(true)
    })
  })

  describe('エンコーダ設定出力', () => {
    it('bitrate max/min/avg 行は情報メッセージ', () => {
      expect(
        isFFmpegInfoMessage('bitrate max/min/avg: 0/0/1000000 buffer size: 0 vbv_delay: N/A')
      ).toBe(true)
    })

    it('vbv_delay を含む出力は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('buffer size: 0 vbv_delay: N/A')).toBe(true)
    })

    it('bitrate= を含むエンコーダオプションは情報メッセージ', () => {
      expect(isFFmpegInfoMessage('rc=abr mbtree=0 bitrate=1000 ratetol=1.0')).toBe(true)
    })
  })

  describe('FFmpegの重複メッセージ抑制', () => {
    it('Last message repeated N times は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('Last message repeated 1 times')).toBe(true)
    })

    it('Last message repeated 複数回は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('Last message repeated 42 times')).toBe(true)
    })
  })

  describe('デコーダのエラーコンシールメント', () => {
    it('concealing errors in I frame は情報メッセージ', () => {
      expect(
        isFFmpegInfoMessage('concealing 3044 DC, 3044 AC, 3044 MV errors in I frame')
      ).toBe(true)
    })

    it('concealing errors in P frame は情報メッセージ', () => {
      expect(
        isFFmpegInfoMessage('concealing 128 DC, 128 AC, 128 MV errors in P frame')
      ).toBe(true)
    })
  })

  describe('ストリームパラメータの断片（行バッファリング前）', () => {
    it('Lavc + バージョン番号は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('Lavc62.11.100 libx264')).toBe(true)
    })

    it('tbn を含むストリームパラメータ断片は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('90k tbn, start 0.480000')).toBe(true)
    })

    it('fps/tbr/tbn を含むストリームパラメータ断片は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('60 fps, 29.08 tbr, 90k tbn, start 0.031000')).toBe(true)
    })
  })

  describe('x264行バッファリング断片', () => {
    it('H.264/MPEG-4 AVC codec を含む断片は情報メッセージ', () => {
      expect(
        isFFmpegInfoMessage(
          '264 - core 165 r3223 0480cb0 - H.264/MPEG-4 AVC codec - Copyleft 2003-2025'
        )
      ).toBe(true)
    })

    it('options: cabac= を含む断片は情報メッセージ', () => {
      expect(
        isFFmpegInfoMessage(
          'options: cabac=0 ref=1 deblock=0:0:0 analyse=0:0 me=dia subme=0'
        )
      ).toBe(true)
    })
  })

  describe('ストリーム情報末尾断片', () => {
    it(', start で始まる断片は情報メッセージ', () => {
      expect(isFFmpegInfoMessage(', start 1.004000')).toBe(true)
    })

    it('start のみの断片は情報メッセージ', () => {
      expect(isFFmpegInfoMessage('start 0.035000')).toBe(true)
    })
  })

  describe('実際のエラーメッセージ', () => {
    it('一般的なエラーメッセージはエラーとして判定', () => {
      expect(isFFmpegInfoMessage('Connection refused')).toBe(false)
    })

    it('Unknown エラーはエラーとして判定', () => {
      expect(isFFmpegInfoMessage('Unknown error occurred')).toBe(false)
    })

    it('Failed to open はエラーとして判定', () => {
      expect(isFFmpegInfoMessage('Failed to open input stream')).toBe(false)
    })

    it('空文字列はエラーとして判定', () => {
      expect(isFFmpegInfoMessage('')).toBe(false)
    })
  })
})
