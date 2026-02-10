[日本語](README.md) | **English** | [한국어](README.ko.md)

# PebbleChat

![PebbleChat](GitHub.png)

A simple streaming app for VRChat / XRift. Issue a streaming URL with one button, then just paste it into iwaSync or XRift Player.

## Features

- **Simple**: Just select a source and press the button
- **Free**: Stream completely free of charge
- **Lightweight**: No extra software needed, all-in-one app
- **Safe**: No complicated network configuration required

## Download

| OS | Download |
|----|----------|
| macOS (Apple Silicon) | [PebbleChat-mac-arm64.dmg](https://pub-6e0518c74c774e0f9982db12e9536191.r2.dev/releases/PebbleChat-mac-arm64.dmg) |
| macOS (Intel) | [PebbleChat-mac-x64.dmg](https://pub-6e0518c74c774e0f9982db12e9536191.r2.dev/releases/PebbleChat-mac-x64.dmg) |
| Windows | [PebbleChat-win-x64.exe](https://pub-6e0518c74c774e0f9982db12e9536191.r2.dev/releases/PebbleChat-win-x64.exe) |

## Background

TopazChat, a live streaming service for VRChat, faces sustainability challenges due to being individually operated. PebbleChat aims to reduce the load on TopazChat by enabling each user to set up their own streaming server.

## Positioning

**Not a "TopazChat replacement" but a "load distribution option"**

- TopazChat continues to excel for low-latency use cases
- Use cases that can tolerate latency migrate to self-hosted streaming
- Overall, reduces the concentration of load on TopazChat

## How to Use

```
1. Launch the app
2. Enter a Stream ID (optional, randomly generated if left blank)
3. Select streaming mode (Direct / via OBS)
4. Select a capture source (entire screen / specific window)
5. Press the "Start Streaming" button
6. Paste the displayed URL into iwaSync
7. Done!
```

### Stream ID

- **Blank**: Automatically generates a random 8-character ID (e.g., `a1b2c3d4`)
- **Custom**: Set any ID you like (alphanumeric and hyphens, 3–20 characters)

The streaming URL will be in the format `https://pebble.xrift.net/{streamId}/index.m3u8`.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Electron App (PC)                                      │
├─────────────────────────────────────────────────────────┤
│  desktopCapturer → MediaMTX (H.264 encoding) → RTMP    │
│                              │                          │
│                         React UI                        │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼ RTMP
                    ┌─────────────────────┐
                    │  Relay Server       │
                    │  (Oracle Cloud)     │
                    ├─────────────────────┤
                    │  MediaMTX (HLS)     │
                    │  Caddy (HTTP proxy) │
                    └─────────────────────┘
                              │
                              ▼ HLS
                 iwaSync (VRChat) / XRift Player
```

### Technologies

| Component | Technology | Role |
|-----------|-----------|------|
| Framework | Electron | Desktop app |
| UI | React + TypeScript | User interface |
| Screen capture | Electron desktopCapturer API | Screen/window capture |
| Media server | MediaMTX | H.264 encoding / HLS conversion |
| HTTP proxy | Caddy | Reverse proxy |
| Infrastructure | Oracle Cloud Always Free | Relay server |

## Relay Server

| Item | Value |
|------|-------|
| Provider | Oracle Cloud Always Free |
| Shape | VM.Standard.E2.1.Micro |
| Specs | 1 OCPU / 1 GB RAM |
| OS | Ubuntu 22.04 Minimal |
| Region | Japan East (Tokyo) |
| Domain | pebble.xrift.net |
| Monthly cost | **$0** (free tier) |
| Bandwidth | 10TB/month (~22,000 viewing hours @ 480p/1Mbps) |

## Streaming Specs

| Item | Value |
|------|-------|
| Codec | H.264 + AAC |
| Resolution | 480p |
| Bitrate | 1Mbps |
| Latency | ~4 seconds |
| HLS segment | 1-second intervals |

## About Latency

| Service / Method | Latency | Suitability |
|-----------------|---------|-------------|
| TopazChat | ~1 second | DJ events (MC sync critical) |
| PebbleChat (HLS) | ~4 seconds | Work streams, video playback, talk events |

## Development

### Requirements

- Node.js 20+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Build
npm run build
```

### Server Management (Ansible)

```bash
cd ansible

# Connection test
ansible -i inventory.yml pebble-relay -m ping

# Run playbook
ansible-playbook -i inventory.yml playbook.yml
```

## Related Links

- [XRift](https://xrift.jp) - WebXR-based metaverse
- [TopazChat](https://booth.pm/ja/items/1752066)
- [MediaMTX](https://github.com/bluenviron/mediamtx)
- [Oracle Cloud Always Free](https://www.oracle.com/cloud/free/)

## License

MIT

---

**Powered by [XRift](https://xrift.jp)**
