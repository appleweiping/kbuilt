// kbuilt front-end config.
//
// ENGINE_URL  -> your Hugging Face Space (the cobalt engine), MUST end with "/".
// API_BASE    -> same-origin Vercel functions for AI features (subtitles/summary).
//
// On Vercel, this file is overwritten at build time from the env var
// NEXT_PUBLIC_ENGINE_URL (see vercel build step / docs/DEPLOY.md). For local
// testing just edit the placeholder below.
window.KBUILT_CONFIG = {
  ENGINE_URL: "https://REPLACE-WITH-YOUR-HF-SPACE.hf.space/",
  API_BASE: "/api",
};
