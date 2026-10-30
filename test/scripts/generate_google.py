"""Turn test photos into crayon-style memory stickers with Google's Gemini image models.

Usage:
  python3 test/scripts/generate_google.py --mode v1 --sets cift me
  python3 test/scripts/generate_google.py --mode v2 --suffix _b   # second sample

Modes (character cards from make_cards.py are sent with every photo):
  v1    strict sticker + soft fade, then Apple Vision background cutout (keeps *_raw.png)
  v1.2  v1 + no halo lines around figures (the app's prompt), same cutout
  v2  v1 fade and face focus, keeps a few meaningful close objects, no cutout
Old prompts are kept in test/PROMPTS.md.

Outputs land in test/outputs/<model>/<mode>/<set>/ and every call is logged to test/outputs/log.csv.
"""
import argparse, base64, csv, json, os, subprocess, sys, time, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PHOTOS = ROOT / "test" / "photos"
OUT = ROOT / "test" / "outputs"
LOG = OUT / "log.csv"

# Rough USD per image, used only for the budget check before a call.
PRICE = {
    "gemini-3.1-flash-lite-image": 0.034,
    "gemini-nano-banana-2.1": 0.05,
    "gemini-3.1-flash-image": 0.067,
    "gemini-3-pro-image": 0.134,
}

# USD per 1M tokens, from Google's pricing page (Oct 2026). The real cost of each call is
# computed from the usageMetadata token counts with these rates.
RATES = {
    "gemini-nano-banana-2.1": {"input": 1.50, "image": 30.00, "text": 7.50},
}

LOG_FIELDS = ["time", "model", "mode", "set", "photo", "seconds", "in_tokens", "img_tokens",
              "text_tokens", "cost_usd", "ok", "note"]




CARDS = ROOT / "test" / "cards"
CUTOUT = ROOT / "test" / "scripts" / ".bin" / "cutout"  # compiled from cutout.swift

# v1 (was card3): strict sticker, head rule, soft fade; always followed by the Apple Vision cutout.
V1_STYLE = (
    "The first {n} image(s) are character reference cards for the people and pets of this memory collection. "
    "The LAST image is a new photo. Redraw ONLY the last photo as a memory sticker.\n"
    "Characters: draw only the people/pets visible in the last photo. If one matches a card, keep that card's look "
    "(face, hair, beard, fur colors and markings, proportions). Never add anyone who is not visible in the last photo. "
    "If no person or pet is visible, ignore all cards.\n"
    "From the photo only: pose, hands, clothing, objects. For heads only: copy the photo's head turn and tilt, "
    "eyes open or closed and expression, not the card's front-facing face.\n"
    "Do not invent: draw only body parts that are visible in the photo. If the photo cuts a person off (no feet, no legs), "
    "end the figure there with a soft crayon fade instead of completing it.\n"
    "Style: naive children's drawing made with wax crayons and oil pastels, visible crayon texture, slightly wobbly outlines, "
    "simple shapes, warm and playful. At most one or two key objects that tell the moment.\n"
    "MOST IMPORTANT, sticker format: a single isolated sticker on a plain pure white background. "
    "No room, furniture, plants, walls, floor or scenery unless it is a key object. No shadows, no frame, no text. "
    "The whole drawing must fit inside the image with wide white margin on every side; nothing touches or crosses the edges."
)



# v1.2: v1 + no halo lines around figures. Same as worker/src/prompts.ts.
V1_2_STYLE = V1_STYLE + (
    " Draw no outline, halo, glow, aura, sketch lines or motion lines around the figures; "
    "right outside every figure the background is pure white."
)

# v2 (was card5): v1 soft fade + face focus, keeps a few meaningful close objects; no cutout.
V2_STYLE = (
    "The first {n} image(s) are character reference cards for the people and pets of this memory collection. "
    "The LAST image is a new photo. Redraw the last photo as a small hand-drawn memory illustration.\n"
    "Characters: draw every person and pet visible in the last photo. If one matches a card, keep that card's look "
    "(face, hair, beard, fur colors and markings, proportions). Never add anyone who is not visible in the last photo. "
    "If no person or pet is visible, ignore all cards.\n"
    "From the photo only: pose, hands, clothing, objects, head turn and tilt, eyes open or closed, expression.\n"
    "Focus: put the most care and detail into the faces and people; they must look like the real people, solid and well proportioned.\n"
    "Context: keep only a few close things that belong to the moment: what people sit on, what they hold, a nearby pet, "
    "a plant or plate on the table they use. Leave out clutter, crowded tables, half-cut chairs, walls, floor, rooms and distant scenery.\n"
    "Edges: where the photo cuts a person or object off, do not complete it and do not end it with a hard edge; "
    "let the crayon strokes fade out softly. A partly visible arm or body of another person also fades out softly.\n"
    "Style: naive children's drawing made with wax crayons and oil pastels, visible crayon texture, slightly wobbly outlines, "
    "simple shapes, warm and playful.\n"
    "Plain pure white background, no shadows, no frame, no text, white margin on every side, nothing crosses the edges."
)


def load_env():
    env = ROOT / ".env"
    for line in env.read_text().splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def img_part(path):
    mime = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
    return {"inline_data": {"mime_type": mime, "data": base64.b64encode(path.read_bytes()).decode()}}


def call(model, parts):
    body = {
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "1:1"}},
    }
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "x-goog-api-key": os.environ["GOOGLE_API_KEY"]},
    )
    for attempt in range(4):
        try:
            return json.load(urllib.request.urlopen(req, timeout=180))
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="ignore")[:400]
            if e.code in (429, 500, 503) and attempt < 3:
                time.sleep(15 * (attempt + 1))
                continue
            raise RuntimeError(f"HTTP {e.code}: {msg}")


def extract_image(resp):
    for cand in resp.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            data = part.get("inlineData") or part.get("inline_data")
            if data:
                return base64.b64decode(data["data"])
    reason = [c.get("finishReason") for c in resp.get("candidates", [])] or resp.get("promptFeedback")
    raise RuntimeError(f"no image in response: {reason}")


def usage_cost(model, resp):
    """Token counts and real USD cost from the response's usageMetadata."""
    u = resp.get("usageMetadata", {})
    inp = u.get("promptTokenCount", 0)
    img = sum(d.get("tokenCount", 0) for d in u.get("candidatesTokensDetails", []) if d.get("modality") == "IMAGE")
    text = u.get("candidatesTokenCount", 0) - img + u.get("thoughtsTokenCount", 0)
    r = RATES.get(model)
    cost = (inp * r["input"] + img * r["image"] + text * r["text"]) / 1e6 if r else PRICE.get(model, 0.15)
    return {"in_tokens": inp, "img_tokens": img, "text_tokens": text, "cost_usd": round(cost, 6)}


def spent_so_far():
    if not LOG.exists():
        return 0.0
    with LOG.open() as f:
        return sum(float(r["cost_usd"] or 0) for r in csv.DictReader(f))


def log(row):
    if LOG.exists():  # older logs lack the token columns: rewrite them with the new header
        with LOG.open() as f:
            rd = csv.DictReader(f)
            if rd.fieldnames != LOG_FIELDS:
                old = list(rd)
                with LOG.open("w", newline="") as g:
                    w = csv.DictWriter(g, fieldnames=LOG_FIELDS, restval="")
                    w.writeheader()
                    w.writerows(old)
    new = not LOG.exists()
    with LOG.open("a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=LOG_FIELDS, restval="")
        if new:
            w.writeheader()
        w.writerow(row)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="gemini-nano-banana-2.1")
    ap.add_argument("--mode", choices=["v1", "v1.2", "v2"], default="v1")
    ap.add_argument("--suffix", default="", help="extra folder suffix, e.g. _b for a second sample")
    ap.add_argument("--only", nargs="*", help="photo names without extension, e.g. cift_01 me_02")
    ap.add_argument("--sets", nargs="*", help="photo set folders, default: all")
    ap.add_argument("--limit", type=int, default=0, help="max photos per set, 0 = all")
    ap.add_argument("--budget", type=float, default=10.0, help="stop when total logged spend reaches this (USD)")
    ap.add_argument("--force", action="store_true", help="redo images that already exist")
    a = ap.parse_args()

    load_env()
    price = PRICE.get(a.model, 0.15)
    OUT.mkdir(parents=True, exist_ok=True)
    sets = a.sets or sorted(p.name for p in PHOTOS.iterdir() if p.is_dir())

    for s in sets:
        photos = sorted((PHOTOS / s).glob("*.jpg"))
        if a.limit:
            photos = photos[: a.limit]
        if a.only:
            photos = [p for p in photos if p.stem in a.only]
            if not photos:
                continue
        outdir = OUT / a.model / (a.mode + a.suffix) / s
        outdir.mkdir(parents=True, exist_ok=True)
        cards = sorted((CARDS / s).glob("*.png"))
        if not cards:
            sys.exit(f"no cards in {CARDS / s}, run make_cards.py first")
        prompt = {"v1": V1_STYLE, "v1.2": V1_2_STYLE, "v2": V2_STYLE}[a.mode].format(n=len(cards))
        for photo in photos:
            target = outdir / (photo.stem + ".png")
            if target.exists() and not a.force:
                print(f"skip  {target.relative_to(ROOT)}")
                continue
            spent = spent_so_far()
            if spent + price > a.budget:
                sys.exit(f"budget stop: spent ${spent:.2f}, limit ${a.budget:.2f}")
            parts = [{"text": prompt}] + [img_part(c) for c in cards] + [img_part(photo)]

            t0 = time.time()
            row = {"time": time.strftime("%Y-%m-%d %H:%M:%S"), "model": a.model, "mode": a.mode, "set": s,
                   "photo": photo.name, "cost_usd": 0, "ok": 0, "note": ""}
            try:
                resp = call(a.model, parts)
                row.update(usage_cost(a.model, resp))  # billed even when no image comes back
                target.write_bytes(extract_image(resp))
                row["ok"] = 1
                if a.mode in ("v1", "v1.2"):  # cutout keeps *_raw.png
                    raw = target.with_name(target.stem + "_raw.png")
                    target.replace(raw)
                    res = subprocess.run([str(CUTOUT), str(raw), str(target)], capture_output=True, text=True)
                    if res.returncode != 0:  # no subject found: keep the raw drawing
                        target.write_bytes(raw.read_bytes())
                        row["note"] = "cutout: " + (res.stdout + res.stderr).strip()[:200]
                print(f"ok    {target.relative_to(ROOT)}  {time.time() - t0:.1f}s")
            except Exception as e:  # keep going with the other photos
                row["note"] = str(e)[:300]
                print(f"FAIL  {photo.name}: {row['note']}")
            row["seconds"] = round(time.time() - t0, 1)
            log(row)

    print(f"total logged spend: ${spent_so_far():.4f}")


if __name__ == "__main__":
    main()
