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
PC (H.264/480p/1Mbps) ─── RTMP ───→ Oracle Cloud ───→ Internet
       │                                  │
       └─ MediaMTX (エンコード)             ├─ MediaMTX (HLSパッケージのみ)
                                          └─ Caddy (HTTPプロキシ)
```

- **PC側**: キャプチャ + H.264エンコード（MediaMTX）→ RTMP送出
- **サーバー側**: RTMP受信 + HLSパッケージング（再エンコードなし、低負荷）

## 配信仕様

| 項目 | 値 |
|-----|---|
| コーデック | H.264 + AAC |
| 解像度 | 480p |
| ビットレート | 1Mbps |
| 遅延 | 約4秒（HLS） |
| HLSセグメント | 1秒間隔、3セグメント保持 |

## ストリームID

- 配信URLは `https://pebble.xrift.net/{streamId}/index.m3u8` の形式
- **ランダム生成**: 空欄の場合、8文字の16進数を自動生成
- **カスタムID**: ユーザーが任意に設定可能（英数字とハイフン、3〜20文字）

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
| トラフィック統計 | https://pebble.xrift.net/stats |

### SSH接続

```bash
ssh pebble-relay
# または
ssh ubuntu@161.33.189.110
```

### 配信中ユーザーの確認

```bash
ssh pebble-relay "ss -tn sport = :1935 | grep -c ESTAB"
```

RTMP接続数（＝配信中のユーザー数）が返る。デプロイ前に0であることを確認する。

### 開放ポート

| ポート | プロトコル | 用途 |
|-------|----------|------|
| 22 | TCP | SSH |
| 80 | TCP | HTTP (リダイレクト) |
| 443 | TCP | HTTPS (HLS配信) |
| 1935 | TCP | RTMP (配信受信) |

### HLS URL

```
https://pebble.xrift.net/{streamId}/index.m3u8
```

例: `https://pebble.xrift.net/a1b2c3d4/index.m3u8`

## 主要ライブラリ

```json
{
  "electron": "^31.0.0",
  "react": "^18.3.1"
}
```

## 開発ルール

### 計画・設計フロー
- **大きな機能追加やリファクタリングを行う前は、必ず計画メモを作成する**
- 計画メモは `memo/YYYY-MM-DD/` ディレクトリに配置（例: `memo/2025-09-04/REFACTOR_PLAN.md`）
- `memo/` ディレクトリは `.gitignore` で除外されており、Git管理外
- 計画フローの流れ:
  1. **計画策定**: 課題・目標・アーキテクチャ設計をMarkdownで整理
  2. **設計検討**: 制約事項・影響範囲・実装手順を明確化
  3. **実装開始**: 計画を基に段階的に実装
  4. **進捗管理**: 必要に応じてTodoWrite toolで進捗追跡

### コード品質
- ファイルを修正・作成した後は必ず `npm run lint` を実行してコード品質をチェックする
- ESLintエラーがある場合は修正してからコミットする
- TypeScriptの型チェックは `npm run typecheck` で実行できる

### 開発サーバー
- **開発サーバーの起動はユーザーが手動で行う**
- Claudeは自動的にサーバーを起動しない
- ユーザーが `npm run dev` を実行してから動作確認を行う

### テスト
- **utils.ts ファイルで切り出された純粋関数は必ずテストを作成する**
- React に依存しない関数は単体テストしやすく、バグの早期発見に重要
- テストファイルは同階層の `__tests__` ディレクトリに `[filename].test.ts` として配置

## コーディング規約

### 基本方針
- 言語: TypeScript
- UIコンポーネント: React Functional Components + Hooks
- Electronプロセス間通信: contextBridge + ipcRenderer/ipcMain
- 日本語コメント可

### switch文の処理分離
- **case文内の複雑な処理は useCallback で切り出す**
- 各caseの処理を独立した関数として定義することで、可読性とテスタビリティが向上
- 特に非同期処理や複雑なロジックを含む場合は必ず分離する

```typescript
// ❌ 悪い例: case文内に複雑な処理を直接記述
const handleMessage = useCallback((message) => {
  switch (message.type) {
    case 'start-stream': {
      // 複雑な処理がcase文内に直接記述されている
      await api.startStream(message.config)
      setStatus('streaming')
      break
    }
  }
}, [/* 依存配列が複雑になる */])

// ✅ 良い例: 各処理をuseCallbackで切り出し
const handleStartStream = useCallback(async (config: StreamConfig) => {
  await api.startStream(config)
  setStatus('streaming')
}, [])

const handleMessage = useCallback((message) => {
  switch (message.type) {
    case 'start-stream':
      await handleStartStream(message.config)
      break
  }
}, [handleStartStream])
```

### 早期return（Early Return）の活用
- **if文のネストは積極的に早期returnで浅くする**
- 条件分岐では否定条件を先に判定し、該当しない場合は早期returnする
- メインロジックを浅い階層に配置することで可読性向上
- **早期returnの場合はブロック `{}` を省略して1行で書く**: `if (!data) return`

```typescript
// ❌ 悪い例: ネストが深い
const processData = (data) => {
  if (data) {
    if (data.isValid) {
      if (data.hasPermission) {
        // メインの処理
        return processMainLogic(data)
      }
    }
  }
}

// ✅ 良い例: 早期returnでネストを浅く
const processData = (data) => {
  if (!data) return
  if (!data.isValid) return
  if (!data.hasPermission) return

  // メインの処理
  return processMainLogic(data)
}
```

### useState のデフォルト値における参照同一性
- **配列・オブジェクトリテラルを直接useStateに渡すことを禁止**
- 毎回新しい参照が作成されて不要な再レンダリングやメモリリークの原因となる

```typescript
// ❌ 悪い例: 毎回新しい配列/オブジェクトが作成される
const [sources, setSources] = useState<SourceInfo[]>([])
const [config, setConfig] = useState({ enabled: true })

// ✅ 良い例: 定数として切り出す
const DEFAULT_SOURCES: SourceInfo[] = []
const DEFAULT_CONFIG = { enabled: true }
const [sources, setSources] = useState(DEFAULT_SOURCES)
const [config, setConfig] = useState(DEFAULT_CONFIG)

// ✅ または初期化関数を使用
const [sources, setSources] = useState(() => [])
const [config, setConfig] = useState(() => ({ enabled: true }))
```

### export default の禁止
- **`export default` を基本的に禁止し、名前付きエクスポートを使用する**
- モジュールの明示的な依存関係を保ち、インポート時の名前変更による混乱を防ぐ

```typescript
// ❌ 悪い例: export default
export default function StreamControls() {
  return <div>Controls</div>
}

// ✅ 良い例: 名前付きエクスポート
export function StreamControls() {
  return <div>Controls</div>
}
```

**例外**: 以下のファイルでのみ `export default` を許可
- `src/renderer/src/main.tsx`: エントリーポイント
- `src/renderer/src/App.tsx`: アプリケーションルートコンポーネント
- 各種設定ファイル

### propsに直接関数を渡すことの禁止
- **onChange等のpropsに直接アロー関数を渡すことを禁止**
- 毎レンダリング時に新しい関数オブジェクトが作成され、不要な再レンダリングが発生する

```typescript
// ❌ 悪い例: propsに直接関数を渡す
<Input onChange={(e) => setValue(e.target.value)} />
<Button onClick={() => handleClick(id)} />

// ✅ 良い例: useCallbackでメモ化した関数を渡す
const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value)
}, [])

const handleButtonClick = useCallback(() => {
  handleClick(id)
}, [id])

<Input onChange={handleChange} />
<Button onClick={handleButtonClick} />
```

### 純粋関数優先の原則
- **ロジックは可能な限り純粋関数として切り出し、hooks化しすぎない**
- useCallback/useMemo でラップしただけの関数は、内部ロジックを純粋関数として `utils.ts` に切り出す
- 純粋関数はテスタブルであり、Reactに依存しないためユニットテストが容易
- hooks は「React の状態管理やライフサイクルが必要な場合」のみ使用する

```typescript
// ❌ 悪い例: ロジックをhooksでラップしただけ
export function useValidateStreamId(streamId: string) {
  return useCallback(() => {
    if (streamId.length < 3 || streamId.length > 20) return false
    return /^[a-zA-Z0-9-]+$/.test(streamId)
  }, [streamId])
}

// ✅ 良い例: 純粋関数として切り出し
// utils.ts
export function validateStreamId(streamId: string): boolean {
  if (streamId.length < 3 || streamId.length > 20) return false
  return /^[a-zA-Z0-9-]+$/.test(streamId)
}

// コンポーネント内で必要に応じてuseCallbackでラップ
const validate = useCallback(() => validateStreamId(streamId), [streamId])
```

**判断基準**:
- 引数から結果を計算するだけ → 純粋関数（utils.ts）
- React の状態（useState）を管理 → hooks
- ライフサイクル（useEffect）が必要 → hooks
- useRef でミュータブルな参照を管理 → hooks

### Props型の命名規則
- **コンポーネントのProps型は「Props」で統一する**
- コンポーネント名を接頭辞として付けない（ファイル内で自明なため）

```typescript
// ❌ 悪い例: コンポーネント名を接頭辞とする
interface StreamControlsProps {
  onStart: () => void
}

// ✅ 良い例: シンプルに「Props」で統一
interface Props {
  onStart: () => void
}
```

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
