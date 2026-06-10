<div align="center">

<img src="./assets/banner.png" alt="kbuilt — public browser video downloader" width="100%" />

# kbuilt

[English](./README.md) · [中文](./README.zh.md) · [日本語](./README.ja.md) · **한국어**

**공개 사이트로 바로 사용할 수 있는 무설치 브라우저 동영상 다운로더. 자체 호스팅 cobalt 엔진으로 동작합니다.**

[![engine](https://img.shields.io/badge/engine-Hugging%20Face%20Spaces-6b8cff)](https://weipingapple-kbuilt-engine.hf.space/)
[![frontend](https://img.shields.io/badge/frontend-Vercel-111111)](https://kbuilt.vercel.app/)
[![license](https://img.shields.io/badge/license-MIT-2fae6a)](./LICENSE)

</div>

---

## 이것은 무엇인가

kbuilt는 처음 방문한 사용자도 바로 쓸 수 있는 공개 웹사이트를 목표로 합니다.

1. 공개 kbuilt 사이트를 엽니다.
2. YouTube, Bilibili, Douyin, TikTok, X/Twitter, Instagram, Reddit, Vimeo, SoundCloud 등 cobalt가 지원하는 공개 동영상 URL을 붙여넣습니다.
3. 화질과 모드를 선택합니다.
4. 다운로드를 클릭하고 브라우저에서 파일을 저장합니다.

데스크톱 앱, 브라우저 확장, 로컬 `yt-dlp`, 사용자 로그인은 필요 없습니다.
웹 앱은 Hugging Face Spaces의 공개 엔진을 직접 호출하며, 그 엔진은
[imputnet/cobalt](https://github.com/imputnet/cobalt)를 실행합니다.

## 공개 URL

| Surface | URL |
|---|---|
| Web app | https://kbuilt.vercel.app/ |
| Engine health | https://weipingapple-kbuilt-engine.hf.space/ |
| Source | https://github.com/appleweiping/kbuilt |

## 아키텍처

```
브라우저 사용자
  |
  | kbuilt를 열고 동영상 URL 제출
  v
Vercel 정적 프런트엔드
  |
  | 엔진을 직접 호출. 동영상 바이트는 Vercel을 통과하지 않음
  v
HF Spaces Docker engine running cobalt
  |
  | tunnel / redirect / picker
  v
브라우저가 미디어 파일 저장
```

중요한 경계:

- Vercel은 정적 UI와 선택적 경량 AI 텍스트 API만 담당합니다.
- 다운로드 스트림은 HF Spaces의 cobalt 엔진에서 브라우저로 직접 전달됩니다.
- kbuilt는 미디어를 캐시하지 않고, 사용자 링크를 저장하지 않으며, Vercel로 동영상을 프록시하지 않습니다.
- 프런트엔드는 `localProcessing: "disabled"`를 지정해 공개 사이트를 무설치 / 로컬 변환 없음 상태로 유지합니다.

## 기능

- cobalt가 지원하는 공개 링크: YouTube, Bilibili, Douyin, TikTok, X/Twitter, Instagram, Reddit, Twitch, Vimeo, SoundCloud, Pinterest, Tumblr 등.
- 화질 선택: max / 2160p / 1080p / 720p / 480p.
- 모드: 영상+오디오, 오디오만, 음소거.
- 4개 언어 UI: 중국어, 영어, 일본어, 한국어.
- 라이트/다크 터미널 스타일 UI.
- 선택적 AI 요약은 페이지 메타데이터 기반입니다. 자막 번역은 실제 자막 텍스트가 제공되기 전까지 자동 기능으로 홍보하지 않습니다.

## YouTube에 대한 정직한 안내

YouTube는 데이터센터 IP를 차단하는 경우가 많습니다. HF Spaces는 데이터센터 인프라라서 YouTube는 간헐적으로 실패하거나 엔진에 cookies / proxy가 필요할 수 있습니다. 이는 무료 클라우드 다운로더 공통의 제약이며, kbuilt만의 추출 로직 문제가 아닙니다.

프로덕션 검증에는 TikTok, SoundCloud, X/Twitter, Instagram, Reddit, Twitch, Vimeo, Douyin, 그리고 cobalt upstream이 현재 지원할 때의 Bilibili처럼 YouTube가 아닌 공개 링크를 우선 사용하세요. 서비스별 안정성은 cobalt upstream과 각 플랫폼의 봇 방어 정책을 따릅니다.

## 배포

자세한 단계는 [docs/DEPLOY.md](./docs/DEPLOY.md)를 참고하세요.

프로덕션 구성:

- Engine: public Hugging Face Docker Space `weipingapple/kbuilt-engine`
- Front-end: public Vercel project `kbuilt`, root directory `web`
- Engine URL: `https://weipingapple-kbuilt-engine.hf.space/`

## 라이선스와 크레딧

- 이 저장소의 프런트엔드, API glue, 문서, 에셋은 [MIT License](./LICENSE)로 배포됩니다.
- 다운로드 엔진은 AGPL-3.0 라이선스의 [imputnet/cobalt](https://github.com/imputnet/cobalt)입니다. kbuilt는 공식 컨테이너 이미지를 사용하며 cobalt 소스 코드는 수정하지 않습니다.

보증은 없습니다. 다운로드할 권리가 있는 콘텐츠에만 사용하세요.
