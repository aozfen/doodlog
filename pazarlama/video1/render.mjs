// Renders scene.html frame by frame via Chrome DevTools Protocol, then encodes MP4 with ffmpeg.
// Usage: node render.mjs [fps] [onlyTime]
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const fps = +(process.argv[2] || 30);
const only = process.argv[3];
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;

const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--hide-scrollbars',
  '--allow-file-access-from-files', `--user-data-dir=${dir}/.chrome`, 'about:blank'], { stdio: 'ignore' });

let target;
for (let i = 0; i < 50 && !target; i++) {
  await new Promise(r => setTimeout(r, 200));
  try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find(t => t.type === 'page'); } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async expr => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send('Emulation.setDeviceMetricsOverride', { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false });
await send('Page.enable');
await send('Page.navigate', { url: `file://${dir}/scene.html` });
await new Promise(r => setTimeout(r, 1500));
await evaluate('window.ready');
const end = await evaluate('window.END');

const shot = async (t, file) => {
  await evaluate(`render(${t}); Promise.all([...document.images].map(i => i.decode().catch(() => {})))`);
  const { result } = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(file, Buffer.from(result.data, 'base64'));
};

if (only) {
  await shot(+only, `${dir}/still_${only}.png`);
} else {
  rmSync(`${dir}/frames`, { recursive: true, force: true }); mkdirSync(`${dir}/frames`);
  const n = Math.ceil(end * fps);
  for (let f = 0; f < n; f++) await shot(f / fps, `${dir}/frames/${String(f).padStart(4, '0')}.png`);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(fps), '-i', `${dir}/frames/%04d.png`,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-movflags', '+faststart', `${dir}/doodlog_tiktok_01.mp4`]);
  rmSync(`${dir}/frames`, { recursive: true, force: true });
}
ws.close(); chrome.kill();
