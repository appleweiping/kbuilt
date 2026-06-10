#!/usr/bin/env python3
"""Deploy kbuilt's cobalt engine to Hugging Face Spaces.

Requires HF_TOKEN or HUGGING_FACE_HUB_TOKEN with write access.
"""

import os
import time
import urllib.request

from huggingface_hub import HfApi


USER = "weipingapple"
SPACE_NAME = "kbuilt-engine"
REPO_ID = f"{USER}/{SPACE_NAME}"
SPACE_URL = f"https://{USER}-{SPACE_NAME}.hf.space/"
ENGINE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "engine"))


def require_token():
    token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")
    if not token:
        raise SystemExit("HF_TOKEN or HUGGING_FACE_HUB_TOKEN is required")
    return token


def wait_for_engine(timeout_seconds=900):
    deadline = time.time() + timeout_seconds
    last_error = ""
    while time.time() < deadline:
        try:
            req = urllib.request.Request(SPACE_URL, headers={"Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=20) as response:
                body = response.read().decode("utf-8", errors="replace")
                if "cobalt" in body.lower():
                    print(body)
                    return
                last_error = body[:300]
        except Exception as exc:  # noqa: BLE001 - deployment poller should keep retrying.
            last_error = str(exc)
        print(f"[kbuilt] waiting for engine: {last_error[:160]}")
        time.sleep(20)
    raise SystemExit(f"engine did not become ready within {timeout_seconds}s: {last_error}")


def main():
    api = HfApi(token=require_token())
    api.create_repo(
        repo_id=REPO_ID,
        repo_type="space",
        space_sdk="docker",
        private=False,
        exist_ok=True,
    )
    api.upload_folder(folder_path=ENGINE_DIR, repo_id=REPO_ID, repo_type="space")
    api.add_space_variable(REPO_ID, "API_URL", SPACE_URL)
    print(f"[kbuilt] deployed engine files to {REPO_ID}")
    print(f"[kbuilt] API_URL={SPACE_URL}")
    wait_for_engine()


if __name__ == "__main__":
    main()
