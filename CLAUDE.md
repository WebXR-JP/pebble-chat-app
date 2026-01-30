# CLAUDE.md

このファイルはClaude Code向けのプロジェクト固有の指示です。

## プロジェクト概要

PebbleChat は VRChat 向けの配信アプリです。Electronベースのデスクトップアプリで、画面キャプチャ → MediaMTX (H.264エンコード) → リレーサーバー (HLS配信) という経路で、簡単に配信環境を構築できます。

## 技術スタック

- **Electron**: デスクトップアプリフレームワーク
- **React + TypeScript**: UI
- **desktopCapturer API**: 画面/ウィンドウキャプチャ
- **MediaMTX**: メディアサーバー（ローカル: H.264エンコード、サーバー: HLSパッケージング）
- **Caddy**: リバースプロキシ（サーバー側）

## アーキテクチャ

```
PC (H.264/360p) ─── RTMP ───→ Oracle Cloud ───→ Internet
       │                            │
       └─ MediaMTX (エンコード)       ├─ MediaMTX (HLSパッケージのみ)
                                    └─ Caddy (HTTPプロキシ)
```

- **PC側**: キャプチャ + H.264エンコード（MediaMTX）→ RTMP送出
- **サーバー側**: RTMP受信 + HLSパッケージング（再エンコードなし、低負荷）

## リレーサーバー情報

| 項目 | 値 |
|-----|---|
| プロバイダ | Oracle Cloud Always Free |
| インスタンス名 | pebble-relay |
| シェイプ | VM.Standard.E2.1.Micro |
| スペック | 1 OCPU / 1 GB RAM |
| OS | Ubuntu 22.04 Minimal |
| パブリックIP | 161.33.189.110 |
| ドメイン | pebble.xrift.net |
| リージョン | Japan East (Tokyo) |
| 月額コスト | $0（無料枠） |
| 帯域制限 | 10TB/月（無料枠） |

### SSH接続

```bash
ssh pebble-relay
# または
ssh ubuntu@161.33.189.110
```

### 開放ポート

| ポート | プロトコル | 用途 |
|-------|----------|------|
| 22 | TCP | SSH |
| 80 | TCP | HTTP (リダイレクト) |
| 443 | TCP | HTTPS (HLS配信) |
| 1935 | TCP | RTMP (配信受信) |

### HLS URL

```
https://pebble.xrift.net/live/index.m3u8
```

## 主要ライブラリ

```json
{
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

2. **MediaMTXの管理**
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

## サーバー管理（Ansible）

```bash
cd ansible

# 接続テスト
ansible -i inventory.yml pebble-relay -m ping

# プレイブック実行
ansible-playbook -i inventory.yml playbook.yml
```

## ディレクトリ構成

```
src/
├── main/           # Electronメインプロセス
│   ├── index.ts
│   ├── ipc/        # IPCハンドラ
│   ├── services/   # MediaMTX, キャプチャ等
│   └── utils/      # ユーティリティ
├── preload/        # preloadスクリプト
│   └── index.ts
├── renderer/       # React UI
│   ├── App.tsx
│   ├── components/
│   └── hooks/
└── shared/         # 共通型定義など
    └── types.ts

ansible/            # サーバー構成管理
├── inventory.yml
├── playbook.yml
├── group_vars/
└── roles/
    ├── common/
    ├── mediamtx/
    └── caddy/
```

## 参考リンク

- [Electron公式ドキュメント](https://www.electronjs.org/docs)
- [desktopCapturer API](https://www.electronjs.org/docs/latest/api/desktop-capturer)
- [MediaMTX](https://github.com/bluenviron/mediamtx)
- [Oracle Cloud Always Free](https://www.oracle.com/cloud/free/)
