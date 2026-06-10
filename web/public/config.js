// kbuilt front-end config.
//
// ENGINE_URL  -> your Hugging Face Space (the cobalt engine), MUST end with "/".
// API_BASE    -> same-origin Vercel functions for AI features (subtitles/summary).
//
// On Vercel, this file can be overwritten at build time from the env var
// NEXT_PUBLIC_ENGINE_URL (see vercel build step / docs/DEPLOY.md). The default
// below points to the public kbuilt engine so the static site remains usable
// even when platform env injection is unavailable.
window.KBUILT_CONFIG = {
  ENGINE_URL: "https://weipingapple-kbuilt-engine.hf.space/",
  API_BASE: "/api",
};
