#!/usr/bin/env python3
"""Generate the kbuilt README banner with GPT Image 2 (gpt-image-2).
Pencil-sketch little-girl style, matching the portfolio banner aesthetic.
PNG output only (user requirement: no SVG). Wide README format ~1536x640.
"""
import base64
import os
import sys

from openai import OpenAI

OUT = r"D:/Company/kbuilt/assets/banner.png"

PROMPT = (
    "A hand-drawn pencil sketch banner illustration, soft graphite shading on warm "
    "off-white paper, gentle cross-hatching, sketchbook feel. A cute little girl with "
    "short hair sits cross-legged wearing big headphones, happily watching a glowing "
    "old-style computer / TV screen and catching little video clips and a downward "
    "download arrow falling from the screen into a small basket beside her. Around her, "
    "lightly sketched floating icons of video play buttons and a downward download arrow. "
    "Hand-lettered title 'kbuilt' in the lower right in a friendly sketched font, with a "
    "tiny subtitle 'video downloader'. Warm terracotta (#d97757) as the single accent "
    "color used sparingly on the arrow and title; everything else graphite pencil "
    "monochrome. Cozy, charming, minimalist, lots of negative space, wide horizontal "
    "banner composition. No photorealism, no 3D, purely a pencil drawing."
)


def main():
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        print("OPENAI_API_KEY not set", file=sys.stderr)
        sys.exit(1)
    client = OpenAI(api_key=key)

    model = os.environ.get("KBUILT_IMAGE_MODEL", "gpt-image-2")
    print(f"[kbuilt] generating banner with {model} ...", flush=True)
    try:
        resp = client.images.generate(
            model=model,
            prompt=PROMPT,
            size="1536x1024",
            quality="high",
            n=1,
        )
    except Exception as e:
        print(f"[kbuilt] {model} failed: {e}", file=sys.stderr, flush=True)
        # fall back to gpt-image-1 if 2 is unavailable on this account
        print("[kbuilt] retrying with gpt-image-1 ...", flush=True)
        resp = client.images.generate(
            model="gpt-image-1", prompt=PROMPT, size="1536x1024", quality="high", n=1,
        )

    b64 = resp.data[0].b64_json
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "wb") as f:
        f.write(base64.b64decode(b64))
    print(f"[kbuilt] saved -> {OUT}", flush=True)


if __name__ == "__main__":
    main()
