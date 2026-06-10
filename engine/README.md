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

This Hugging Face Space is the public **download engine** for [kbuilt](https://github.com/appleweiping/kbuilt) — a no-install, browser-based video downloader that anyone can open and use directly.

It runs the open-source [imputnet/cobalt](https://github.com/imputnet/cobalt) API, which extracts and proxies media from **20+ services**: YouTube, Bilibili, X/Twitter, TikTok, 抖音/Douyin, Instagram, Reddit, Twitch, Vimeo, SoundCloud, Tumblr, Pinterest, and more.

The actual user interface lives at the kbuilt Vercel site and calls this engine's API directly. Video bytes do **not** pass through Vercel.

## What this Space does

- Listens on port `7860` (HF Spaces requirement).
- Exposes the cobalt JSON API (`POST /` with a `url`).
- Streams/proxies the requested public media so the browser can save it directly. Nothing is cached.
- Supports a public multi-site downloader flow, not only YouTube or Bilibili.

## Required configuration

Set these in the Space **Settings → Variables and secrets**:

| Variable  | Value                                                        | Why |
|-----------|--------------------------------------------------------------|-----|
| `API_URL` | The full public URL of THIS Space, e.g. `https://<user>-kbuilt-engine.hf.space/` | Tunnels (streaming downloads) break without it. Must end with `/`. |

Optional:

| Variable      | Value | Why |
|---------------|-------|-----|
| `COOKIE_PATH` | `/cookies.json` | Enable to feed cookies for sites that need login (YouTube anti-bot, paid/member-only or age-restricted content). |

> **Service note:** datacenter IPs (which HF Spaces uses) are increasingly blocked by YouTube, and every supported platform can change anti-bot behavior. Use TikTok, SoundCloud, X/Twitter, Instagram, Reddit, Vimeo, Douyin, Bilibili, and other public links as cobalt supports them; YouTube may need cookies via `COOKIE_PATH`. This is a limitation shared by *all* free cloud downloaders, not a kbuilt bug.

## Public-service note

This Space is intentionally public so users can paste supported public links into the kbuilt website without accounts or local setup. If abuse protection is added later, keep it at the engine/API boundary and keep the core rule intact: media streams must not be routed through the Vercel front-end.

## Deploy

This directory IS a HF Space. Push it to a Space repo (`sdk: docker`) and HF builds the `Dockerfile` automatically. See `../docs/DEPLOY.md`.
