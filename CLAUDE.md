# CLAUDE.md

このファイルはClaude Code向けのプロジェクト固有の指示です。

## プロジェクト概要

XRift Stream は VRChat / XRift 向けの配信アプリです。Electronベースのデスクトップアプリで、画面キャプチャ → MediaMTX (HLS変換) → Cloudflare Quick Tunnel という経路で、簡単に配信環境を構築できます。

## 技術スタック

- **Electron**: デスクトップアプリフレームワーク
- **React + TypeScript**: UI
- **desktopCapturer API**: 画面/ウィンドウキャプチャ
- **MediaMTX**: メディアサーバー（HLS変換）
- **cloudflared**: Cloudflare Quick Tunnel（外部公開）

## アーキテクチャ

```
desktopCapturer → WebRTC (WHIP) → MediaMTX → HLS → Cloudflare Tunnel → iwaSync/XRift
```

推奨はWebRTC (WHIP) 経由の配信（FFmpeg不要、軽量）。

## 主要ライブラリ

```json
{
  "cloudflared": "^1.0.0",
  "electron": "^28.0.0",
  "react": "^18.0.0"
}
```

## コーディング規約

- 言語: TypeScript
- UIコンポーネント: React Functional Components + Hooks
- Electronプロセス間通信: contextBridge + ipcRenderer/ipcMain
- 日本語コメント可

## 開発時の注意点

1. **メインプロセスとレンダラープロセスの分離**
   - `src/main/` - Electronメインプロセス（Node.js API使用可）
   - `src/renderer/` - レンダラープロセス（React UI）
   - `src/preload/` - preloadスクリプト（contextBridge）

2. **MediaMTX/cloudflaredの管理**
   - バイナリは初回起動時に自動インストール
   - アプリ終了時は必ずプロセスを終了させる

3. **セキュリティ**
   - `nodeIntegration: false` を維持
   - `contextIsolation: true` を維持
   - preloadスクリプト経由でのみNode.js APIを公開

## コマンド

```bash
npm install    # 依存関係インストール
npm run dev    # 開発モード起動
npm run build  # 本番ビルド
npm run lint   # Lint実行
npm run test   # テスト実行
```

## ディレクトリ構成（予定）

```
src/
├── main/           # Electronメインプロセス
│   ├── index.ts
│   ├── capture.ts  # 画面キャプチャ管理
│   ├── mediamtx.ts # MediaMTXプロセス管理
│   └── tunnel.ts   # cloudflared管理
├── preload/        # preloadスクリプト
│   └── index.ts
├── renderer/       # React UI
│   ├── App.tsx
│   ├── components/
│   └── hooks/
└── shared/         # 共通型定義など
    └── types.ts
```

## 参考リンク

- [Electron公式ドキュメント](https://www.electronjs.org/docs)
- [desktopCapturer API](https://www.electronjs.org/docs/latest/api/desktop-capturer)
- [MediaMTX](https://github.com/bluenviron/mediamtx)
- [cloudflared npm](https://www.npmjs.com/package/cloudflared)
