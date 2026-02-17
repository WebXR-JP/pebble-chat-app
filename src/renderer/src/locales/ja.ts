export const ja = {
  // App
  'app.subtitle': 'VRChat/XRift 向け配信アプリ',

  // Stream ID
  'streamId.label': 'ストリームID（任意）',
  'streamId.placeholder': '空欄でランダム生成',
  'streamId.hint': '英数字とハイフンのみ、3〜20文字',
  'streamId.errorLength': 'ストリームIDは3〜20文字で入力してください',
  'streamId.errorChars': 'ストリームIDは英数字とハイフンのみ使用できます',

  // Stream mode
  'mode.direct': '直接配信',
  'mode.directDesc': 'アプリから直接画面をキャプチャ（推奨）',
  'mode.obs': 'OBS経由',
  'mode.obsDesc': 'OBSで配信設定をカスタマイズ',

  // Buttons
  'button.start': '配信開始',
  'button.stop': '配信停止',
  'button.preparing': '準備中...',
  'button.connecting': '接続中...',
  'button.starting': '開始中...',
  'button.stopping': '停止中...',
  'button.retry': 'リトライ',
  'button.refresh': '更新',
  'button.cancel': 'キャンセル',
  'button.copy': 'コピー',
  'button.copied': 'コピー済み',
  'button.download': 'ダウンロード',
  'button.openSettings': 'システム設定を開く',
  'button.captureStart': 'キャプチャ開始',
  'button.captureStop': 'キャプチャ停止',

  // Window controls
  'window.minimize': '最小化',
  'window.close': '閉じる',

  // Setup
  'setup.title': 'セットアップ',
  'setup.checking': '確認中...',

  // Status
  'status.idle': '待機中',
  'status.starting': '起動中...',
  'status.running': '配信中',
  'status.stopping': '停止中...',
  'status.error': 'エラー',
  'status.unknown': '不明',
  'status.label': 'ステータス:',
  'status.waitingObs': 'OBS接続待ち',
  'status.preparing': '準備中...',

  // Connection
  'connection.connecting': '接続中...',
  'connection.connected': '配信中',
  'connection.disconnected': '切断',
  'connection.failed': '接続失敗',

  // Pipeline
  'pipeline.serverConnection': 'サーバー接続',
  'pipeline.hlsDelivery': 'HLS配信',

  // Source select modal
  'source.selectTitle': 'キャプチャするソースを選択',
  'source.loading': '読み込み中...',
  'source.tabScreen': '画面',
  'source.tabWindow': 'ウィンドウ',
  'source.emptyScreen': '画面が見つかりません',
  'source.emptyWindow': 'ウィンドウが見つかりません',
  'source.captureTitle': 'キャプチャソース',
  'source.emptyCapture': 'キャプチャソースが見つかりません',

  // Audio
  'audio.shareSystem': 'PCの音声を共有する',

  // Permission
  'permission.title': '画面収録の権限が必要です',
  'permission.description': 'このアプリで画面をキャプチャするには、\nシステム設定で権限を許可してください。',
  'permission.note': '設定後、このアプリを再起動してください。',

  // Streaming screen
  'streaming.notice': '無料サーバーで運用中のため、遅延4秒以上・画質480pでの配信となります',

  // OBS
  'obs.settingsTitle': 'OBS設定',
  'obs.description': 'OBSの「設定 > 配信」で以下を入力し、「配信開始」を押してください',
  'obs.server': 'サーバー:',
  'obs.streamKey': 'ストリームキー:',

  // URL
  'url.publicTitle': '公開URL',
  'url.publicLabel': '公開URL (iwaSync用):',
  'url.fetchError': '公開URLを取得できませんでした',

  // Update
  'update.available': 'v{{version}} が利用可能です',

  // Hints
  'hint.setupRequired': 'セットアップを完了してください',

  // Errors (useCapture)
  'error.fetchSources': 'ソース取得に失敗しました',
  'error.openSettings': '設定を開けませんでした',
  'error.webrtcDisconnected': 'WebRTC接続が切断されました',
  'error.captureStart': 'キャプチャ開始に失敗しました',
  'error.captureStop': 'キャプチャ停止に失敗しました'
} as const
