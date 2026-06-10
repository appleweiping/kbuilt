# kbuilt Deploy Guide

kbuilt is deployed as a public two-layer service:

1. **Engine**: Hugging Face Spaces Docker app running `ghcr.io/imputnet/cobalt:11`.
2. **Web app**: Vercel static front-end plus tiny optional AI text functions.

The public user flow is:

```
open kbuilt -> paste a public media URL -> choose quality -> download in browser
```

Video bytes must never be proxied through Vercel.

## Target Production URLs

| Surface | Target |
|---|---|
| HF Space repo | `weipingapple/kbuilt-engine` |
| HF Space URL | `https://weipingapple-kbuilt-engine.hf.space/` |
| Vercel project | `kbuilt` |
| Vercel production URL | `https://kbuilt.vercel.app/` |
| Vercel root directory | `web` |

## Automated Engine Deployment

Prerequisite: a Hugging Face write token available as `HF_TOKEN` or
`HUGGING_FACE_HUB_TOKEN`.

Run from the repository root:

```powershell
$env:HF_TOKEN = "<hf-write-token>"
python scripts\deploy_hf_space.py
```

Equivalent inline version:

```powershell
$env:HF_TOKEN = "<hf-write-token>"
@'
from huggingface_hub import HfApi
import os

token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")
if not token:
    raise SystemExit("HF_TOKEN is required")

user = "weipingapple"
repo_id = f"{user}/kbuilt-engine"
space_url = f"https://{user}-kbuilt-engine.hf.space/"

api = HfApi(token=token)
api.create_repo(
    repo_id=repo_id,
    repo_type="space",
    space_sdk="docker",
    private=False,
    exist_ok=True,
)
api.upload_folder(
    folder_path=r"D:\Company\kbuilt\engine",
    repo_id=repo_id,
    repo_type="space",
)
api.add_space_variable(repo_id, "API_URL", space_url)
print(space_url)
'@ | python -
```

Then wait until:

```powershell
Invoke-RestMethod https://weipingapple-kbuilt-engine.hf.space/
```

returns cobalt version JSON.

## Manual Engine Deployment

1. Open https://huggingface.co/new-space.
2. Owner: `weipingapple`.
3. Space name: `kbuilt-engine`.
4. SDK: `Docker`.
5. Visibility: `Public`.
6. Upload everything from `engine/` to the Space repository root.
7. Set a Space variable:
   - `API_URL=https://weipingapple-kbuilt-engine.hf.space/`
8. Wait for the Space to build and verify `GET /` returns JSON.

Optional later variables:

| Variable | Why |
|---|---|
| `COOKIE_PATH=/cookies.json` | Helps sites that require cookies, especially YouTube. |
| `HTTP_PROXY` / `HTTPS_PROXY` | Can mitigate datacenter IP blocks when you have a compliant proxy. |

## Automated Vercel Deployment

Prerequisite: either a connected Vercel app/tool, or a Vercel token available as
`VERCEL_TOKEN`.

Project settings:

| Setting | Value |
|---|---|
| Name | `kbuilt` |
| Root Directory | `web` |
| Framework | `Other` / `null` |
| Build Command | `node build.js` |
| Output Directory | `public` |

Production environment variables:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_ENGINE_URL` | `https://weipingapple-kbuilt-engine.hf.space/` |
| `ANTHROPIC_API_KEY` | Optional. Enables metadata-only summary. Downloads work without it. |

CLI path:

```powershell
cd D:\Company\kbuilt
.\scripts\deploy_vercel.ps1
```

If Vercel env injection is unavailable, `web/public/config.js` already defaults
to the public HF engine URL. This is intentional: the engine URL is public and
keeps the static site usable.

## Manual Vercel Deployment

1. Open https://vercel.com/new.
2. Import `appleweiping/kbuilt`.
3. Set project name to `kbuilt`.
4. Set Root Directory to `web`.
5. Confirm build settings match `web/vercel.json`.
6. Add the production env vars above.
7. Deploy.

## Validation

Engine checks:

```powershell
$engine = "https://weipingapple-kbuilt-engine.hf.space/"
Invoke-RestMethod $engine
Invoke-RestMethod $engine -Method Post -ContentType "application/json" -Headers @{Accept="application/json"} -Body (@{
  url = "https://www.tiktok.com/@scout2015/video/6718335390845095173"
  videoQuality = "720"
  downloadMode = "auto"
  audioFormat = "best"
  filenameStyle = "pretty"
  localProcessing = "disabled"
} | ConvertTo-Json)
```

Expected response statuses are `tunnel`, `redirect`, or `picker`. If cobalt
returns `local-processing`, kbuilt should show a clear zero-local-processing
message instead of opening partial streams.

Web checks:

- The public Vercel URL loads a real UI, not a blank page.
- Engine status shows online after HF cold start.
- Language switch works for Chinese, English, Japanese, Korean.
- Light/dark mode persists.
- A public TikTok/SoundCloud/X/Instagram/Reddit/Vimeo/Douyin/Bilibili-style link can return a downloadable cobalt response when cobalt upstream currently supports that service.
- YouTube is tested only as best effort because free cloud datacenter IPs may be blocked.

## Public-Service Notes

kbuilt is intentionally public: no login, no private API key required in the
browser, and no user-specific setup. If abuse becomes a problem, add bot/rate
protection at the engine layer later without changing the Vercel traffic rule:
video bytes still must not pass through Vercel.
