# PebbleChat

![PebbleChat](GitHub.png)

VRChat / XRift 向けの簡単配信アプリ。ボタンひとつで配信URLを発行、あとは iwaSync や XRift Player に貼るだけ。

## 特徴

- **簡単**: 配信ソースを選んでボタンを押すだけ
- **無料**: 完全無料で配信
- **軽量**: 追加ソフト不要、アプリ1つで完結
- **安全**: 難しいネットワーク設定は不要

## 背景

VRChat内でのライブ配信サービス「TopazChat」は、個人運営による持続可能性の問題を抱えています。PebbleChatは、各ユーザーが自分で配信サーバーを立てられるようにすることで、TopazChatへの負荷を分散させることを目指しています。

## ポジショニング

**「TopazChatの代替」ではなく「負荷分散の選択肢」**

- TopazChatは引き続き低遅延が必要なユースケースで活躍
- 遅延が許容できるユースケースは自前配信へ移行
- 全体としてTopazChatへの集中を緩和

## 使い方

```
1. アプリ起動
2. 配信ソース選択（画面全体 / 特定ウィンドウ）
3. 「配信開始」ボタンを押す
4. 表示されたURLをiwaSyncに貼る
5. 完了
```

## 技術構成

```
┌─────────────────────────────────────────────────────────┐
│  Electron App (PC)                                      │
├─────────────────────────────────────────────────────────┤
│  desktopCapturer → MediaMTX (H.264エンコード) → RTMP   │
│                              │                          │
│                         React UI                        │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼ RTMP
                    ┌─────────────────────┐
                    │  リレーサーバー       │
                    │  (Oracle Cloud)     │
                    ├─────────────────────┤
                    │  MediaMTX (HLS変換)  │
                    │  Caddy (HTTPプロキシ)│
                    └─────────────────────┘
                              │
                              ▼ HLS
                 iwaSync (VRChat) / XRift Player
```

### 使用技術

| コンポーネント | 技術 | 役割 |
|--------------|------|------|
| フレームワーク | Electron | デスクトップアプリ |
| UI | React + TypeScript | ユーザーインターフェース |
| 画面キャプチャ | Electron desktopCapturer API | 画面/ウィンドウ取得 |
| メディアサーバー | MediaMTX | H.264エンコード / HLS変換 |
| HTTPプロキシ | Caddy | リバースプロキシ |
| インフラ | Oracle Cloud Always Free | リレーサーバー |

## リレーサーバー

| 項目 | 値 |
|-----|---|
| プロバイダ | Oracle Cloud Always Free |
| シェイプ | VM.Standard.E2.1.Micro |
| スペック | 1 OCPU / 1 GB RAM |
| OS | Ubuntu 22.04 Minimal |
| リージョン | Japan East (Tokyo) |
| ドメイン | pebble.xrift.net |
| 月額コスト | **$0**（無料枠） |
| 帯域 | 10TB/月（約33,000視聴時間 @ 360p） |

## 遅延について

| サービス/方式 | 遅延 | 用途適性 |
|-------------|------|---------|
| TopazChat | 約1秒 | DJイベント（MC同期重要） |
| PebbleChat (HLS) | 約4秒 | 作業配信・映像流し・トーク系イベント |

## 開発

### 必要環境

- Node.js 20+
- npm または yarn

### セットアップ

```bash
# 依存関係のインストール
npm install

# 開発モードで起動
npm run dev

# ビルド
npm run build
```

### サーバー管理（Ansible）

```bash
cd ansible

# 接続テスト
ansible -i inventory.yml pebble-relay -m ping

# プレイブック実行
ansible-playbook -i inventory.yml playbook.yml
```

## 関連リンク

- [XRift](https://xrift.jp) - WebXRベースのメタバース
- [TopazChat](https://booth.pm/ja/items/1752066)
- [MediaMTX](https://github.com/bluenviron/mediamtx)
- [Oracle Cloud Always Free](https://www.oracle.com/cloud/free/)

## ライセンス

MIT

---

**Powered by [XRift](https://xrift.jp)**
