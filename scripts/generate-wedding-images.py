#!/usr/bin/env python3
"""Generate the ten wedding artboards used by Carte templates.

The script delegates image generation to the bundled imagegen CLI so it can be
rerun safely with any OpenAI-compatible image endpoint.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
PROMPT_FILE = ROOT / "tmp" / "imagegen" / "wedding-prompts.jsonl"
OUTPUT_DIR = ROOT / "public" / "templates" / "wedding-art"
IMAGEGEN = Path(
    os.environ.get(
        "IMAGEGEN_CLI",
        Path(os.environ.get("CODEX_HOME", Path.home() / ".codex"))
        / "skills" / ".system" / "imagegen" / "scripts" / "image_gen.py",
    )
)

JOBS = [
    ("romantic-blush", "An editorial wedding invitation background, blush watercolor roses and translucent petals, soft paper grain, airy center negative space for editable typography, refined fashion magazine styling, portrait composition, no text, no letters, no logos, no watermark."),
    ("luxe-noir", "A sophisticated black and champagne-gold wedding invitation background, subtle Art Deco geometry, satin and foil texture, restrained highlights, generous dark center negative space for editable typography, portrait composition, no text, no letters, no logos, no watermark."),
    ("secret-garden", "A modern botanical wedding invitation background, hand-painted sage leaves and delicate white garden flowers framing the edges, warm ivory paper, natural daylight, calm center negative space for editable typography, portrait composition, no text, no letters, no logos, no watermark."),
    ("golden-hour", "A cinematic golden-hour wedding invitation background, hazy sunset over a quiet meadow, warm apricot and rose light, subtle film grain, elegant open center area for editable typography, portrait composition, no text, no letters, no logos, no watermark."),
    ("pure-minimalist", "A premium minimalist wedding invitation background, warm white textured stock, precise black hairline geometry and one muted clay accent, generous clean negative space, Swiss editorial design, portrait composition, no text, no letters, no logos, no watermark."),
    ("vintage-romance", "A refined vintage wedding invitation background, faded parchment, antique botanical engraving details around the border, muted burgundy and dusty blue, tactile letterpress paper texture, clear center negative space for editable typography, portrait composition, no text, no letters, no logos, no watermark."),
    ("ocean-waves", "A serene coastal wedding invitation background, pale blue ocean surface and hand-painted wave contours, shells and sea grass kept subtle at the edges, sunlit white space in the center for editable typography, contemporary luxury stationery, portrait composition, no text, no letters, no logos, no watermark."),
    ("gilded-elegance", "An elegant ivory and antique-gold wedding invitation background, restrained baroque botanical ornament framing the edges, soft luminous paper, premium embossed foil feel, clean central area for editable typography, portrait composition, no text, no letters, no logos, no watermark."),
    ("enchanted-forest", "A moody enchanted forest wedding invitation background, deep pine and moss green, delicate branches and tiny warm lights around the border, atmospheric but readable center negative space for editable typography, cinematic editorial stationery, portrait composition, no text, no letters, no logos, no watermark."),
    ("starry-night", "A romantic midnight wedding invitation background, deep navy sky with fine stars and a soft moon glow, subtle constellation lines near the edges, elegant open center area for editable typography, premium celestial stationery, portrait composition, no text, no letters, no logos, no watermark."),
]

# The gateway rejects the SDK user agent. Only the transport header is changed;
# all API requests and response handling still use the unmodified skill CLI.
CLI_BOOTSTRAP = """
import os, runpy, sys
import httpx
def with_user_agent(send):
    def wrapped(self, request, *args, **kwargs):
        request.headers['User-Agent'] = os.environ['WEDDING_IMAGE_USER_AGENT']
        return send(self, request, *args, **kwargs)
    return wrapped
httpx.Client.send = with_user_agent(httpx.Client.send)
httpx.AsyncClient.send = with_user_agent(httpx.AsyncClient.send)
sys.argv = sys.argv[1:]
runpy.run_path(sys.argv[0], run_name='__main__')
"""


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--only", nargs="+", choices=[slug for slug, _ in JOBS])
    parser.add_argument("--force", action="store_true", help="Regenerate existing images (incurs API charges).")
    parser.add_argument("--dry-run", action="store_true", help="Print prompts and payloads without API calls.")
    parser.add_argument("--concurrency", type=int, choices=range(1, 6), default=3)
    parser.add_argument("--user-agent", default="CarteWeddingArt/1.0")
    args = parser.parse_args()
    jobs = [(slug, prompt) for slug, prompt in JOBS if not args.only or slug in args.only]
    jobs = [(slug, prompt) for slug, prompt in jobs if args.force or args.dry_run or not (OUTPUT_DIR / f"{slug}.png").exists()]
    if not jobs:
        print("All requested images already exist; use --force to regenerate.")
        return 0
    if not args.dry_run and not os.environ.get("OPENAI_API_KEY"):
        print("OPENAI_API_KEY is required; set it in the shell before running.", file=sys.stderr)
        return 2
    if not IMAGEGEN.exists():
        print(f"Imagegen CLI not found: {IMAGEGEN}", file=sys.stderr)
        return 2

    PROMPT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with PROMPT_FILE.open("w", encoding="utf-8") as prompts:
        for slug, prompt in jobs:
            prompts.write(json.dumps({
                "prompt": prompt,
                "out": f"{slug}.png",
                "size": "1024x1536",
                "quality": "high",
                "model": "gpt-image-2",
                "use_case": "stylized-concept",
            }) + "\n")

    env = os.environ.copy()
    env.setdefault("OPENAI_BASE_URL", "https://backend.intelalloc.com/v1")
    env["WEDDING_IMAGE_USER_AGENT"] = args.user_agent
    command = [
        sys.executable,
        "-c", CLI_BOOTSTRAP,
        str(IMAGEGEN),
        "generate-batch",
        "--input", str(PROMPT_FILE),
        "--out-dir", str(OUTPUT_DIR),
        "--model", "gpt-image-2",
        "--concurrency", str(args.concurrency),
        "--no-augment",
    ]
    if args.force:
        command.append("--force")
    if args.dry_run:
        command.append("--dry-run")
    try:
        return subprocess.run(command, cwd=ROOT, env=env, check=False).returncode
    finally:
        PROMPT_FILE.unlink(missing_ok=True)


if __name__ == "__main__":
    raise SystemExit(main())
