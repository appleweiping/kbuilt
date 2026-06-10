#!/usr/bin/env python3
"""Generate the kbuilt README banner with GPT Image 2 (gpt-image-2).
Pencil-sketch little-girl style, matching the owner's GitHub project banner
family (anime student engineer, graph paper, graphite pencil, sparse blue
technical accents). PNG output only (user requirement: no SVG).
"""
import base64
import os
import sys

from openai import OpenAI

from PIL import Image


OUT = r"D:/Company/kbuilt/assets/banner.png"

PROMPT = """
Create a wide README banner illustration for an open-source project named kbuilt.

Use case: project README banner.
Composition: very wide horizontal banner, similar aspect ratio to 1983x793.
Style reference: match the owner's existing GitHub banner family: anime-inspired
little-girl pencil sketches, light graphite linework, soft gray shading, clean
white or very pale graph-paper background, technical desk/workbench setting,
small floating information-diagram elements, sparse blue accent marks. Do not
use a warm yellow storybook paper look, photorealism, 3D, glossy UI, or saturated
colors.
Subject: a cute anime-style little girl / student engineer, drawn in pencil,
sitting at a tidy desk with a laptop and browser window. She is calmly operating
a public video downloader.
Diagram elements: Vercel static front-end, Hugging Face Spaces engine, cobalt
API, a download folder, play buttons, and small media-source cards for YouTube,
Bilibili, TikTok, X, Instagram, Reddit, Vimeo, SoundCloud. Keep labels tiny and
diagram-like; avoid dense readable paragraphs.
Mood: open-source, trustworthy, public web service, technical but charming.
Accent color: mostly grayscale pencil; use only small blue accents and one very
subtle warm accent on the download arrow.
Text: include only a hand-sketched project title "kbuilt" if it can be clean and
legible; no other large text, no fake captions, no watermark.
Output: polished bitmap banner, pencil drawing, high-resolution, no border.
""".strip()


def save_wide_banner(b64):
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    tmp = OUT + ".raw.png"
    with open(tmp, "wb") as f:
        f.write(base64.b64decode(b64))

    im = Image.open(tmp).convert("RGB")
    target_ratio = 1983 / 793
    w, h = im.size
    ratio = w / h
    if ratio > target_ratio:
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        im = im.crop((left, 0, left + new_w, h))
    else:
        new_h = int(w / target_ratio)
        top = max(0, (h - new_h) // 2)
        im = im.crop((0, top, w, top + new_h))
    im = im.resize((1983, 793), Image.Resampling.LANCZOS)
    im.save(OUT, optimize=True)
    os.remove(tmp)


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

    save_wide_banner(resp.data[0].b64_json)
    print(f"[kbuilt] saved -> {OUT}", flush=True)


if __name__ == "__main__":
    main()
