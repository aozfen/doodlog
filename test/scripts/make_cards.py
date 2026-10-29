"""Create one character card per person/pet of a test set (test/cards/<set>/<name>.png).

In the product these cards would be made silently in the background; here the source
photo and a short description of each character are fixed by hand.
"""
import sys, time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import generate_google as g

MODEL = "gemini-nano-banana-2.1"

# set -> list of (card name, source photo, which subject to draw)
CHARACTERS = {
    "cift": [
        ("adam", "cift_02.jpg", "the man with curly grey hair and beard"),
        ("kadin", "cift_02.jpg", "the woman with long brown wavy hair"),
        ("kopek", "cift_04.jpg", "the small dog the man is holding"),
    ],
    "me": [
        ("ben", "me_02.jpg", "the man with short dark hair and a full dark beard"),
    ],
    "kopek_taro": [
        ("taro", "taro_01.jpg", "the dog"),
    ],
}

CARD_PROMPT = (
    "From this photo, draw ONLY {who} as a character reference card. "
    "Full body, standing and facing forward, neutral relaxed pose, nothing in the hands or mouth, no other people or animals, no objects. "
    "Keep the exact look: face, hair or fur colors and markings, body proportions, and the clothing or collar visible in the photo. "
    "Style: naive children's drawing made with wax crayons and oil pastels, visible crayon texture, slightly wobbly outlines, simple shapes. "
    "Plain pure white background, no shadows, no frame, no text."
)


def main():
    g.load_env()
    for s, chars in CHARACTERS.items():
        out = g.CARDS / s
        out.mkdir(parents=True, exist_ok=True)
        for name, photo, who in chars:
            target = out / f"{name}.png"
            if target.exists():
                print(f"skip  {target.relative_to(g.ROOT)}")
                continue
            t0 = time.time()
            parts = [{"text": CARD_PROMPT.format(who=who)}, g.img_part(g.PHOTOS / s / photo)]
            row = {"time": time.strftime("%Y-%m-%d %H:%M:%S"), "model": MODEL, "mode": "make_card", "set": s,
                   "photo": photo, "cost_usd": 0, "ok": 0, "note": name}
            try:
                target.write_bytes(g.extract_image(g.call(MODEL, parts)))
                row.update(ok=1, cost_usd=g.PRICE[MODEL])
                print(f"ok    {target.relative_to(g.ROOT)}  {time.time() - t0:.1f}s")
            except Exception as e:
                row["note"] = f"{name}: {str(e)[:250]}"
                print(f"FAIL  {name}: {e}")
            row["seconds"] = round(time.time() - t0, 1)
            g.log(row)


if __name__ == "__main__":
    main()
