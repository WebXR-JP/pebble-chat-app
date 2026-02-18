[日本語](README.md) | [English](README.en.md) | **한국어**

# PebbleChat

![PebbleChat](GitHub.png)

VRChat / XRift를 위한 간단한 스트리밍 앱. 버튼 하나로 스트리밍 URL을 발급하고, iwaSync이나 XRift Player에 붙여넣기만 하면 됩니다.

## 특징

- **간단**: 소스를 선택하고 버튼만 누르면 끝
- **무료**: 완전 무료로 스트리밍
- **가벼움**: 추가 소프트웨어 불필요, 앱 하나로 완결
- **안전**: 복잡한 네트워크 설정 불필요

## 다운로드

| OS | 다운로드 |
|----|---------|
| macOS (Apple Silicon) | [PebbleChat-mac-arm64.dmg](https://pub-6e0518c74c774e0f9982db12e9536191.r2.dev/releases/PebbleChat-mac-arm64.dmg) |
| macOS (Intel) | [PebbleChat-mac-x64.dmg](https://pub-6e0518c74c774e0f9982db12e9536191.r2.dev/releases/PebbleChat-mac-x64.dmg) |
| Windows | [PebbleChat-win-x64.exe](https://pub-6e0518c74c774e0f9982db12e9536191.r2.dev/releases/PebbleChat-win-x64.exe) |

### Beta

최신 기능을 안정 버전보다 먼저 체험할 수 있는 테스트 빌드입니다.

| OS | 다운로드 |
|----|---------|
| macOS (Apple Silicon) | [PebbleChat-mac-arm64-beta.dmg](https://pub-6e0518c74c774e0f9982db12e9536191.r2.dev/releases/beta/PebbleChat-mac-arm64-beta.dmg) |
| macOS (Intel) | [PebbleChat-mac-x64-beta.dmg](https://pub-6e0518c74c774e0f9982db12e9536191.r2.dev/releases/beta/PebbleChat-mac-x64-beta.dmg) |
| Windows | [PebbleChat-win-x64-beta.exe](https://pub-6e0518c74c774e0f9982db12e9536191.r2.dev/releases/beta/PebbleChat-win-x64-beta.exe) |

## 배경

VRChat 내 라이브 스트리밍 서비스 「TopazChat」은 개인 운영으로 인한 지속 가능성 문제를 안고 있습니다. PebbleChat은 각 사용자가 직접 스트리밍 서버를 구축할 수 있게 하여 TopazChat의 부하를 분산시키는 것을 목표로 합니다.

## 포지셔닝

**「TopazChat의 대체」가 아닌 「부하 분산 옵션」**

- TopazChat은 저지연이 필요한 사용 사례에서 계속 활약
- 지연을 허용할 수 있는 사용 사례는 자체 스트리밍으로 전환
- 전체적으로 TopazChat에 대한 집중을 완화

## 사용법

```
1. 앱 실행
2. 스트림 ID 입력 (선택 사항, 비워두면 자동 생성)
3. 스트리밍 모드 선택 (직접 스트리밍 / OBS 경유)
4. 캡처 소스 선택 (전체 화면 / 특정 윈도우)
5. 「스트리밍 시작」 버튼 클릭
6. 표시된 URL을 iwaSync에 붙여넣기
7. 완료!
```

### 스트림 ID

- **빈칸**: 랜덤 8자리 ID 자동 생성 (예: `a1b2c3d4`)
- **커스텀**: 원하는 ID 설정 가능 (영숫자와 하이픈, 3~20자)

스트리밍 URL은 `https://pebble.xrift.net/{streamId}/index.m3u8` 형식입니다.

## 기술 구성

```
┌─────────────────────────────────────────────────────────┐
│  Electron App (PC)                                      │
├─────────────────────────────────────────────────────────┤
│  desktopCapturer → MediaMTX (H.264 인코딩) → RTMP      │
│                              │                          │
│                         React UI                        │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼ RTMP
                    ┌─────────────────────┐
                    │  릴레이 서버          │
                    │  (Oracle Cloud)     │
                    ├─────────────────────┤
                    │  MediaMTX (HLS 변환) │
                    │  Caddy (HTTP 프록시) │
                    └─────────────────────┘
                              │
                              ▼ HLS
                 iwaSync (VRChat) / XRift Player
```

### 사용 기술

| 구성 요소 | 기술 | 역할 |
|----------|------|------|
| 프레임워크 | Electron | 데스크톱 앱 |
| UI | React + TypeScript | 사용자 인터페이스 |
| 화면 캡처 | Electron desktopCapturer API | 화면/윈도우 캡처 |
| 미디어 서버 | MediaMTX | H.264 인코딩 / HLS 변환 |
| HTTP 프록시 | Caddy | 리버스 프록시 |
| 인프라 | Oracle Cloud Always Free | 릴레이 서버 |

## 릴레이 서버

| 항목 | 값 |
|-----|---|
| 프로바이더 | Oracle Cloud Always Free |
| 셰이프 | VM.Standard.E2.1.Micro |
| 스펙 | 1 OCPU / 1 GB RAM |
| OS | Ubuntu 22.04 Minimal |
| 리전 | Japan East (Tokyo) |
| 도메인 | pebble.xrift.net |
| 월 비용 | **$0** (무료 티어) |
| 대역폭 | 10TB/월 (약 22,000 시청 시간 @ 480p/1Mbps) |
| 트래픽 통계 | [pebble.xrift.net/stats](https://pebble.xrift.net/stats) |

## 스트리밍 사양

| 항목 | 값 |
|-----|---|
| 코덱 | H.264 + AAC |
| 해상도 | 480p |
| 비트레이트 | 1Mbps |
| 지연 | 약 4초 |
| HLS 세그먼트 | 1초 간격 |

## 지연에 대해

| 서비스 / 방식 | 지연 | 적합성 |
|-------------|------|-------|
| TopazChat | 약 1초 | DJ 이벤트 (MC 싱크 중요) |
| PebbleChat (HLS) | 약 4초 | 작업 스트리밍, 영상 재생, 토크 이벤트 |

## 개발

### 요구 사항

- Node.js 20+
- npm 또는 yarn

### 설정

```bash
# 의존성 설치
npm install

# 개발 모드로 실행
npm run dev

# 빌드
npm run build
```

### 서버 관리 (Ansible)

```bash
cd ansible

# 연결 테스트
ansible -i inventory.yml pebble-relay -m ping

# 플레이북 실행
ansible-playbook -i inventory.yml playbook.yml
```

## 관련 링크

- [XRift](https://xrift.jp) - WebXR 기반 메타버스
- [TopazChat](https://booth.pm/ja/items/1752066)
- [MediaMTX](https://github.com/bluenviron/mediamtx)
- [Oracle Cloud Always Free](https://www.oracle.com/cloud/free/)

## 라이선스

MIT

---

**Powered by [XRift](https://xrift.jp)**
