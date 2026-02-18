export const en = {
  // App
  'app.subtitle': 'Streaming app for VRChat/XRift',

  // Stream ID
  'streamId.label': 'Stream ID (optional)',
  'streamId.placeholder': 'Leave blank for random',
  'streamId.hint': 'Alphanumeric and hyphens only, 3–20 chars',
  'streamId.errorLength': 'Stream ID must be 3–20 characters',
  'streamId.errorChars': 'Stream ID can only contain alphanumeric characters and hyphens',

  // Stream mode
  'mode.direct': 'Direct',
  'mode.directDesc': 'Capture screen directly from the app (recommended)',
  'mode.obs': 'Via OBS',
  'mode.obsDesc': 'Customize stream settings with OBS',

  // Buttons
  'button.start': 'Start Streaming',
  'button.stop': 'Stop Streaming',
  'button.preparing': 'Preparing...',
  'button.connecting': 'Connecting...',
  'button.starting': 'Starting...',
  'button.stopping': 'Stopping...',
  'button.retry': 'Retry',
  'button.refresh': 'Refresh',
  'button.cancel': 'Cancel',
  'button.copy': 'Copy',
  'button.copied': 'Copied',
  'button.download': 'Download',
  'button.openSettings': 'Open System Settings',
  'button.captureStart': 'Start Capture',
  'button.captureStop': 'Stop Capture',

  // Window controls
  'window.minimize': 'Minimize',
  'window.close': 'Close',

  // Setup
  'setup.title': 'Setup',
  'setup.checking': 'Checking...',

  // Status
  'status.idle': 'Idle',
  'status.starting': 'Starting...',
  'status.running': 'Streaming',
  'status.stopping': 'Stopping...',
  'status.error': 'Error',
  'status.unknown': 'Unknown',
  'status.label': 'Status:',
  'status.waitingObs': 'Waiting for OBS',
  'status.preparing': 'Preparing...',

  // Connection
  'connection.connecting': 'Connecting...',
  'connection.connected': 'Streaming',
  'connection.disconnected': 'Disconnected',
  'connection.failed': 'Connection Failed',

  // Pipeline
  'pipeline.serverConnection': 'Server',
  'pipeline.hlsDelivery': 'HLS',

  // Source select modal
  'source.selectTitle': 'Select a capture source',
  'source.loading': 'Loading...',
  'source.tabScreen': 'Screen',
  'source.tabWindow': 'Window',
  'source.emptyScreen': 'No screens found',
  'source.emptyWindow': 'No windows found',
  'source.captureTitle': 'Capture Source',
  'source.emptyCapture': 'No capture sources found',

  // Audio
  'audio.shareSystem': 'Share system audio',

  // Permission
  'permission.title': 'Screen recording permission required',
  'permission.description': 'To capture the screen with this app,\nplease grant permission in System Settings.',
  'permission.note': 'Please restart the app after granting permission.',

  // Streaming screen
  'streaming.notice': 'Running on a free server: expect 4+ seconds latency and 480p quality',

  // OBS
  'obs.settingsTitle': 'OBS Settings',
  'obs.description': 'Enter the following in OBS under "Settings > Stream" and click "Start Streaming"',
  'obs.server': 'Server:',
  'obs.streamKey': 'Stream Key:',

  // URL
  'url.publicTitle': 'Public URL',
  'url.publicLabel': 'Public URL (for iwaSync):',
  'url.fetchError': 'Failed to retrieve the public URL',

  // Update
  'update.available': 'v{{version}} is available',

  // Hints
  'hint.setupRequired': 'Please complete the setup first',

  // Errors (useCapture)
  'error.fetchSources': 'Failed to fetch sources',
  'error.openSettings': 'Failed to open settings',
  'error.webrtcDisconnected': 'WebRTC connection was lost',
  'error.captureStart': 'Failed to start capture',
  'error.captureStop': 'Failed to stop capture'
} as const
