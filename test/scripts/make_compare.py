"""Build test/compare.html: each photo with its drawings in a wrapping grid, with 1-5 ratings.

Run after generating: python3 test/scripts/make_compare.py
Ratings and view settings are kept in the browser (localStorage); ratings can be downloaded as CSV.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TEST = ROOT / "test"
PHOTOS, OUT = TEST / "photos", TEST / "outputs"

MODE_ORDER = ["v1", "v1_b", "v2", "v2_b"]
MODE_LABEL = {"v1": "v1 · deneme 1", "v1_b": "v1 · deneme 2", "v2": "v2 · deneme 1", "v2_b": "v2 · deneme 2"}
DEFAULT_ON = MODE_ORDER

# Every model/mode folder that has output becomes a version.
versions = sorted({(m.name, mode.name) for m in OUT.iterdir() if m.is_dir()
                   for mode in m.iterdir() if mode.is_dir()},
                  key=lambda c: (c[0], MODE_ORDER.index(c[1]) if c[1] in MODE_ORDER else 99, c[1]))
VERSIONS = [{"key": f"{m}|{mo}", "label": MODE_LABEL.get(mo, mo), "on": mo in DEFAULT_ON} for m, mo in versions]

ROWS = []
for s in sorted(p for p in PHOTOS.iterdir() if p.is_dir()):
    for photo in sorted(s.glob("*.jpg")):
        cells = {}
        for m, mo in versions:
            f = OUT / m / mo / s.name / (photo.stem + ".png")
            if f.exists():
                cells[f"{m}|{mo}"] = f.relative_to(TEST).as_posix()
        if cells:
            ROWS.append({"set": s.name, "photo": photo.stem, "src": photo.relative_to(TEST).as_posix(), "cells": cells})

SET_LABEL = {"cift": "Çift", "me": "Ben", "kopek_taro": "Köpek (Taro)"}
SETS = [{"key": s, "label": SET_LABEL.get(s, s)} for s in dict.fromkeys(r["set"] for r in ROWS)]

page = """<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Çizim Karşılaştırma</title>
<style>
:root { --bg:#f6f5f1; --fg:#1f1f1d; --muted:#76746e; --line:#e2dfd7; --card:#fff; --accent:#2f6fde; --accent-fg:#fff; --chip:#ecebe6; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#171716; --fg:#ecebe6; --muted:#9b9993; --line:#2f2e2b; --card:#222220; --accent:#7aa7ff; --accent-fg:#111; --chip:#2a2927; } }
:root[data-theme="dark"] { --bg:#171716; --fg:#ecebe6; --muted:#9b9993; --line:#2f2e2b; --card:#222220; --accent:#7aa7ff; --accent-fg:#111; --chip:#2a2927; }
* { box-sizing:border-box; }
body { margin:0; background:var(--bg); color:var(--fg); font:15px/1.45 -apple-system,system-ui,sans-serif; }
header { position:sticky; top:0; z-index:5; background:var(--bg); border-bottom:1px solid var(--line); padding:12px 16px; }
h1 { font-size:18px; margin:0 0 8px; }
.row { display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin-top:6px; }
.row > span { color:var(--muted); font-size:13px; margin-right:4px; min-width:64px; }
.chip { font:inherit; font-size:13px; padding:4px 10px; border-radius:999px; border:1px solid var(--line); background:var(--chip); color:var(--fg); cursor:pointer; }
.chip.on { background:var(--accent); border-color:var(--accent); color:var(--accent-fg); }
.chip.ghost { background:transparent; }
main { padding:16px; max-width:1400px; margin:0 auto; }
details.summary { margin-bottom:16px; background:var(--card); border:1px solid var(--line); border-radius:12px; padding:10px 14px; }
details.summary summary { cursor:pointer; font-weight:600; }
details.summary table { border-collapse:collapse; margin-top:8px; font-size:14px; width:100%; }
details.summary td, details.summary th { text-align:left; padding:4px 8px; border-bottom:1px solid var(--line); }
section.photo { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:14px; margin-bottom:16px; }
section.photo h2 { font-size:15px; margin:0 0 10px; display:flex; gap:8px; align-items:baseline; }
section.photo h2 small { color:var(--muted); font-weight:400; }
.grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(190px, 1fr)); gap:12px; }
figure { margin:0; }
figure img { width:100%; aspect-ratio:1; object-fit:contain; background:#fff; border-radius:10px; border:1px solid var(--line); display:block; cursor:zoom-in; }
figure.orig img { border:2px solid var(--accent); }
figcaption { font-size:12px; color:var(--muted); margin:6px 0 2px; font-weight:600; }
.rate { display:grid; grid-template-columns:auto repeat(5, 1fr); gap:3px; align-items:center; font-size:11px; color:var(--muted); margin-top:3px; }
.rate button { font:inherit; font-size:11px; padding:3px 0; border:1px solid var(--line); background:var(--chip); color:var(--fg); border-radius:6px; cursor:pointer; }
.rate button.on { background:var(--accent); border-color:var(--accent); color:var(--accent-fg); }
.empty { text-align:center; color:var(--muted); padding:40px 0; }
#lb { position:fixed; inset:0; background:rgba(0,0,0,.85); display:none; place-items:center; z-index:10; cursor:zoom-out; }
#lb.on { display:grid; }
#lb img { max-width:94vw; max-height:92vh; background:#fff; border-radius:8px; }
</style></head><body>
<header>
  <h1>Çizim karşılaştırma</h1>
  <div class="row" id="sets"><span>Set</span></div>
  <div class="row" id="vers"><span>Sürümler</span></div>
  <div class="row"><span>Diğer</span>
    <button class="chip ghost" id="onlyFull">Sadece seçili sürümleri olanlar</button>
    <button class="chip ghost" id="csv">Puanları CSV indir</button>
    <button class="chip ghost" id="clear">Puanları sıfırla</button>
  </div>
</header>
<main>
  <details class="summary"><summary>Ortalama puanlar</summary><table id="summary"></table></details>
  <div id="list"></div>
</main>
<div id="lb"><img alt=""></div>
<script>
const ROWS = __ROWS__;
const VERSIONS = __VERSIONS__;
const SETS = __SETS__;
const RKEY = "doods-ratings-v2", VKEY = "doods-view-v3";
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
let R = load(RKEY, {});
let V = load(VKEY, null) || { set: "all", on: VERSIONS.filter(v => v.on).map(v => v.key), onlyFull: false };
V.on = V.on.filter(k => VERSIONS.some(v => v.key === k));
const Q = [["beauty", "Güzel"], ["same", "Aynı"]];

function chip(label, on, click) { const b = document.createElement("button"); b.className = "chip" + (on ? " on" : ""); b.textContent = label; b.onclick = click; return b; }
function renderBar() {
  const sets = document.getElementById("sets"); sets.querySelectorAll("button").forEach(b => b.remove());
  [{ key: "all", label: "Hepsi" }, ...SETS].forEach(s => sets.appendChild(chip(s.label, V.set === s.key, () => { V.set = s.key; save(); })));
  const vers = document.getElementById("vers"); vers.querySelectorAll("button").forEach(b => b.remove());
  VERSIONS.forEach(v => vers.appendChild(chip(v.label, V.on.includes(v.key), () => {
    V.on = V.on.includes(v.key) ? V.on.filter(k => k !== v.key) : VERSIONS.map(x => x.key).filter(k => k === v.key || V.on.includes(k));
    save();
  })));
  document.getElementById("onlyFull").className = "chip" + (V.onlyFull ? " on" : " ghost");
}
function rateBox(id) {
  const box = document.createElement("div");
  for (const [q, label] of Q) {
    const line = document.createElement("div"); line.className = "rate";
    const l = document.createElement("span"); l.textContent = label; line.appendChild(l);
    for (let v = 1; v <= 5; v++) {
      const b = document.createElement("button"); b.textContent = v; const k = id + "|" + q;
      if (R[k] === v) b.className = "on";
      b.onclick = () => { R[k] = R[k] === v ? undefined : v; if (!R[k]) delete R[k]; store(RKEY, R); renderList(); renderSummary(); };
      line.appendChild(b);
    }
    box.appendChild(line);
  }
  return box;
}
function fig(src, caption, cls) {
  const f = document.createElement("figure"); if (cls) f.className = cls;
  const img = document.createElement("img"); img.src = src; img.loading = "lazy"; img.alt = caption;
  img.onclick = () => { const lb = document.getElementById("lb"); lb.querySelector("img").src = src; lb.classList.add("on"); };
  const c = document.createElement("figcaption"); c.textContent = caption;
  f.append(c, img); return f;
}
function renderList() {
  const list = document.getElementById("list"); list.innerHTML = "";
  const rows = ROWS.filter(r => (V.set === "all" || r.set === V.set) && (!V.onlyFull || V.on.every(k => r.cells[k])));
  if (!rows.length) { list.innerHTML = '<div class="empty">Bu filtrede fotoğraf yok.</div>'; return; }
  for (const r of rows) {
    const sec = document.createElement("section"); sec.className = "photo";
    const set = SETS.find(s => s.key === r.set);
    sec.innerHTML = `<h2>${r.photo} <small>${set ? set.label : r.set}</small></h2>`;
    const grid = document.createElement("div"); grid.className = "grid";
    grid.appendChild(fig(r.src, "Orijinal", "orig"));
    for (const v of VERSIONS) {
      if (!V.on.includes(v.key) || !r.cells[v.key]) continue;
      const f = fig(r.cells[v.key], v.label);
      f.appendChild(rateBox(v.key + "|" + r.photo));
      grid.appendChild(f);
    }
    sec.appendChild(grid); list.appendChild(sec);
  }
}
function renderSummary() {
  let h = "<tr><th>Sürüm</th><th>Güzel mi</th><th>Aynı karakter mi</th></tr>";
  for (const v of VERSIONS) {
    const avg = q => { const xs = ROWS.map(r => R[v.key + "|" + r.photo + "|" + q]).filter(Boolean); return xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) + ` <small>(${xs.length})</small>` : "–"; };
    h += `<tr><td>${v.label}</td><td>${avg("beauty")}</td><td>${avg("same")}</td></tr>`;
  }
  document.getElementById("summary").innerHTML = h;
}
function save() { store(VKEY, V); renderBar(); renderList(); }
document.getElementById("onlyFull").onclick = () => { V.onlyFull = !V.onlyFull; save(); };
document.getElementById("lb").onclick = e => e.currentTarget.classList.remove("on");
document.addEventListener("keydown", e => { if (e.key === "Escape") document.getElementById("lb").classList.remove("on"); });
document.getElementById("csv").onclick = () => {
  const lines = ["model,mode,photo,question,score", ...Object.entries(R).map(([k, v]) => k.split("|").join(",") + "," + v)];
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([lines.join("\\n")], { type: "text/csv" }));
  a.download = "puanlar.csv"; a.click();
};
document.getElementById("clear").onclick = () => { if (confirm("Tüm puanlar silinsin mi?")) { R = {}; store(RKEY, R); renderList(); renderSummary(); } };
renderBar(); renderList(); renderSummary();
</script></body></html>"""

page = (page.replace("__ROWS__", json.dumps(ROWS, ensure_ascii=False))
            .replace("__VERSIONS__", json.dumps(VERSIONS, ensure_ascii=False))
            .replace("__SETS__", json.dumps(SETS, ensure_ascii=False)))
(TEST / "compare.html").write_text(page)
print(f"wrote {TEST / 'compare.html'}: {len(ROWS)} photos, {len(VERSIONS)} versions")
