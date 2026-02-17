export const ko = {
  // App
  'app.subtitle': 'VRChat/XRift 스트리밍 앱',

  // Stream ID
  'streamId.label': '스트림 ID (선택 사항)',
  'streamId.placeholder': '비워두면 자동 생성',
  'streamId.hint': '영문, 숫자, 하이픈만 사용 가능, 3~20자',
  'streamId.errorLength': '스트림 ID는 3~20자로 입력해 주세요',
  'streamId.errorChars': '스트림 ID는 영문, 숫자, 하이픈만 사용할 수 있습니다',

  // Stream mode
  'mode.direct': '직접 배신',
  'mode.directDesc': '앱에서 직접 화면 캡처 (권장)',
  'mode.obs': 'OBS 경유',
  'mode.obsDesc': 'OBS에서 배신 설정을 커스터마이즈',

  // Buttons
  'button.start': '스트리밍 시작',
  'button.stop': '스트리밍 중지',
  'button.preparing': '준비 중...',
  'button.connecting': '연결 중...',
  'button.starting': '시작 중...',
  'button.stopping': '중지 중...',
  'button.retry': '재시도',
  'button.refresh': '새로고침',
  'button.cancel': '취소',
  'button.copy': '복사',
  'button.copied': '복사됨',
  'button.download': '다운로드',
  'button.openSettings': '시스템 설정 열기',
  'button.captureStart': '캡처 시작',
  'button.captureStop': '캡처 중지',

  // Window controls
  'window.minimize': '최소화',
  'window.close': '닫기',

  // Setup
  'setup.title': '설정',
  'setup.checking': '확인 중...',

  // Status
  'status.idle': '대기 중',
  'status.starting': '시작 중...',
  'status.running': '스트리밍 중',
  'status.stopping': '중지 중...',
  'status.error': '오류',
  'status.unknown': '알 수 없음',
  'status.label': '상태:',
  'status.waitingObs': 'OBS 연결 대기 중',
  'status.preparing': '준비 중...',

  // Connection
  'connection.connecting': '연결 중...',
  'connection.connected': '스트리밍 중',
  'connection.disconnected': '연결 끊김',
  'connection.failed': '연결 실패',

  // Pipeline
  'pipeline.serverConnection': '서버 연결',
  'pipeline.hlsDelivery': 'HLS 배신',

  // Source select modal
  'source.selectTitle': '캡처할 소스 선택',
  'source.loading': '로딩 중...',
  'source.tabScreen': '화면',
  'source.tabWindow': '창',
  'source.emptyScreen': '화면을 찾을 수 없습니다',
  'source.emptyWindow': '창을 찾을 수 없습니다',
  'source.captureTitle': '캡처 소스',
  'source.emptyCapture': '캡처 소스를 찾을 수 없습니다',

  // Audio
  'audio.shareSystem': '시스템 오디오를 공유',

  // Permission
  'permission.title': '화면 녹화 권한이 필요합니다',
  'permission.description': '이 앱에서 화면을 캡처하려면\n시스템 설정에서 권한을 허용해 주세요.',
  'permission.note': '설정 후 앱을 다시 시작해 주세요.',

  // Streaming screen
  'streaming.notice': '무료 서버로 운영 중이므로 4초 이상의 지연과 480p 화질로 스트리밍됩니다',

  // OBS
  'obs.settingsTitle': 'OBS 설정',
  'obs.description': 'OBS의 "설정 > 방송"에서 아래를 입력하고 "방송 시작"을 눌러주세요',
  'obs.server': '서버:',
  'obs.streamKey': '스트림 키:',

  // URL
  'url.publicTitle': '공개 URL',
  'url.publicLabel': '공개 URL (iwaSync용):',
  'url.fetchError': '공개 URL을 가져올 수 없습니다',

  // Update
  'update.available': 'v{{version}} 사용 가능',

  // Hints
  'hint.setupRequired': '먼저 설정을 완료해 주세요',

  // Errors (useCapture)
  'error.fetchSources': '소스를 가져오지 못했습니다',
  'error.openSettings': '설정을 열 수 없습니다',
  'error.webrtcDisconnected': 'WebRTC 연결이 끊어졌습니다',
  'error.captureStart': '캡처를 시작하지 못했습니다',
  'error.captureStop': '캡처를 중지하지 못했습니다'
} as const
