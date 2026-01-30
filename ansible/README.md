# PebbleChat Relay Server Ansible

Oracle Cloud Always Free インスタンスに MediaMTX + Caddy をデプロイする Ansible 構成です。

## 前提条件

- Ansible がインストールされていること
- SSH 鍵が `~/.ssh/id_ed25519` に存在すること
- Oracle Cloud のセキュリティリストで以下のポートが開放されていること：
  - TCP 22 (SSH)
  - TCP 80 (HTTP)
  - TCP 1935 (RTMP)

## セットアップ

```bash
# Ansible インストール（macOS）
brew install ansible

# Ansible インストール（Ubuntu）
sudo apt install ansible
```

## 使い方

```bash
cd ansible

# 接続テスト
ansible -i inventory.yml pebble-relay -m ping

# プレイブック実行
ansible-playbook -i inventory.yml playbook.yml
```

## 構成

```
ansible/
├── inventory.yml              # サーバー情報
├── playbook.yml               # メインプレイブック
├── group_vars/
│   └── all.yml                # 共通変数
└── roles/
    ├── common/                # 基本セットアップ（UFW等）
    ├── mediamtx/              # MediaMTX（RTMP→HLS変換）
    └── caddy/                 # Caddy（HTTPプロキシ）
```

## アーキテクチャ

```
PC (H.264/360p) ─── RTMP ───→ Oracle Cloud ───→ Internet
       │                            │
       └─ MediaMTX (エンコード)       ├─ MediaMTX (HLSパッケージのみ)
                                    └─ Caddy (HTTPプロキシ)
```

- **PC側**: キャプチャ + H.264エンコード（MediaMTX）→ RTMP送出
- **サーバー側**: RTMP受信 + HLSパッケージング（再エンコードなし、低負荷）

## 確認方法

```bash
# SSH接続
ssh ubuntu@161.33.189.110

# サービス状態確認
systemctl status mediamtx
systemctl status caddy

# ヘルスチェック
curl http://161.33.189.110/health
```

## HLS URL

配信開始後、以下のURLで視聴可能：

```
http://161.33.189.110/live/index.m3u8
```
