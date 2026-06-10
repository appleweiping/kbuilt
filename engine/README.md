---
title: kbuilt engine
emoji: ⬇️
colorFrom: gray
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# kbuilt engine

This Hugging Face Space is the **download engine** for [kbuilt](https://github.com/appleweiping/kbuilt) — a no-install, browser-based video downloader with a Claude-Code terminal aesthetic.

It runs the open-source [imputnet/cobalt](https://github.com/imputnet/cobalt) API, which extracts and proxies media from **20+ services**: YouTube, Bilibili, X/Twitter, TikTok, 抖音/Douyin, Instagram, Reddit, Twitch, Vimeo, SoundCloud, Tumblr, Pinterest, and more.

The actual user interface lives at the kbuilt Vercel site and calls this engine's API.

## What this Space does

- Listens on port `7860` (HF Spaces requirement).
- Exposes the cobalt JSON API (`POST /` with a `url`).
- Streams/proxies the requested media so the browser can save it directly. Nothing is cached.

## Required configuration

Set these in the Space **Settings → Variables and secrets**:

| Variable  | Value                                                        | Why |
|-----------|--------------------------------------------------------------|-----|
| `API_URL` | The full public URL of THIS Space, e.g. `https://<user>-kbuilt-engine.hf.space/` | Tunnels (streaming downloads) break without it. Must end with `/`. |

Optional:

| Variable      | Value | Why |
|---------------|-------|-----|
| `COOKIE_PATH` | `/cookies.json` | Enable to feed cookies for sites that need login (YouTube anti-bot, Bilibili 大会员, age-restricted). |

> **YouTube note:** datacenter IPs (which HF Spaces uses) are increasingly blocked by YouTube. Bilibili / X / TikTok / 抖音 etc. work reliably. For YouTube you may need to supply cookies via `COOKIE_PATH`. This is a limitation shared by *all* free cloud downloaders, not a kbuilt bug.

## Deploy

This directory IS a HF Space. Push it to a Space repo (`sdk: docker`) and HF builds the `Dockerfile` automatically. See `../docs/DEPLOY.md`.
