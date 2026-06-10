<div align="center">

<img src="./assets/banner.png" alt="kbuilt — public browser video downloader" width="100%" />

# kbuilt

**English** · [中文](./README.zh.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md)

**A public, zero-install browser video downloader powered by a self-hosted cobalt engine.**

[![engine](https://img.shields.io/badge/engine-Hugging%20Face%20Spaces-6b8cff)](https://weipingapple-kbuilt-engine.hf.space/)
[![frontend](https://img.shields.io/badge/frontend-Vercel-111111)](https://kbuilt.vercel.app/)
[![license](https://img.shields.io/badge/license-MIT-2fae6a)](./LICENSE)

</div>

---

## What Is This

kbuilt is meant to be a website anyone can open and use directly:

1. Open the public kbuilt site.
2. Paste a public video URL from YouTube, Bilibili, Douyin, TikTok, X/Twitter, Instagram, Reddit, Vimeo, SoundCloud, and other cobalt-supported sites.
3. Pick quality and mode.
4. Click download and save the file in the browser.

There is no desktop app, no browser extension, no local `yt-dlp`, and no user login.
The public web app talks directly to a public Hugging Face Spaces engine that runs
[imputnet/cobalt](https://github.com/imputnet/cobalt).

## Public URLs

| Surface | URL |
|---|---|
| Web app | https://kbuilt.vercel.app/ |
| Engine health | https://weipingapple-kbuilt-engine.hf.space/ |
| Source | https://github.com/appleweiping/kbuilt |

The production web app is live on Vercel and uses the public HF Spaces engine below.

## Architecture

```
Browser user
  |
  | opens kbuilt and posts a media URL
  v
Vercel static front-end
  |
  | direct API call, no video bytes through Vercel
  v
HF Spaces Docker engine running cobalt
  |
  | tunnel / redirect / picker result
  v
Browser saves the media file
```

Important boundaries:

- Vercel only serves the static UI and tiny optional AI text endpoints.
- The download stream is produced by the HF Spaces cobalt engine and goes directly to the browser.
- kbuilt does not cache media, store user links, or proxy video through Vercel.
- The front-end asks cobalt for `localProcessing: "disabled"` so the public site stays zero-install and avoids local remux/transcode flows.

## What Works

- Public-link downloads through cobalt-supported services: YouTube, Bilibili, Douyin, TikTok, X/Twitter, Instagram, Reddit, Twitch, Vimeo, SoundCloud, Pinterest, Tumblr, and more.
- Quality selection: max / 2160p / 1080p / 720p / 480p.
- Modes: video+audio, audio only, mute.
- Four UI languages: Chinese, English, Japanese, Korean.
- Light/dark terminal-style UI.
- Optional AI summary based on page metadata only. Subtitle translation is not advertised as automatic unless caption text is provided later.

## Honest YouTube Note

YouTube often blocks datacenter IPs. HF Spaces runs from datacenter infrastructure, so YouTube may fail intermittently or require cookies/proxy support on the engine. This is a platform limitation shared by free cloud downloaders, not a kbuilt-specific extraction bug.

For production validation, prefer non-YouTube public links such as TikTok, SoundCloud, X/Twitter, Instagram, Reddit, Twitch, Vimeo, Douyin, and Bilibili when cobalt upstream currently supports that service. Service reliability follows cobalt and each platform's anti-bot rules.

## Deployment

Full deployment instructions are in [docs/DEPLOY.md](./docs/DEPLOY.md).

Production shape:

- Engine: public Hugging Face Docker Space `weipingapple/kbuilt-engine`
- Front-end: public Vercel project `kbuilt`, root directory `web`
- Engine URL: `https://weipingapple-kbuilt-engine.hf.space/`

## License And Credits

- This repository's front-end, API glue, docs, and assets are released under the [MIT License](./LICENSE).
- The download engine is [imputnet/cobalt](https://github.com/imputnet/cobalt), licensed AGPL-3.0. kbuilt uses the official container image and does not modify cobalt source code.

No warranty. Use kbuilt only for content you are allowed to download.
