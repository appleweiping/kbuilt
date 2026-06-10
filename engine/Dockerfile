# kbuilt download engine — runs imputnet/cobalt on Hugging Face Spaces.
#
# We do NOT reinvent the video-extraction logic (YouTube signature decryption
# changes weekly; bilibili/抖音 need correct headers + cookies). Instead we run
# the battle-tested open-source cobalt engine and put our own front-end on top.
#
# HF Spaces requires the app to listen on port 7860, so we override cobalt's
# default API_PORT (9000) -> 7860 at runtime.

FROM ghcr.io/imputnet/cobalt:11

# HF Spaces routes all public traffic to 7860.
ENV API_PORT=7860
EXPOSE 7860

# API_URL is injected at deploy time (HF Space env var / Secret) because it must
# equal the Space's public URL or tunnel (streaming) downloads break.
# CORS_WILDCARD=1 lets our Vercel front-end call this engine from a different origin.
ENV CORS_WILDCARD=1

# The base image already has the correct entrypoint; we only changed the port.
