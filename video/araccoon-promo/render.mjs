// Renders index.html frame by frame with headless Chrome (raw DevTools Protocol) and encodes with ffmpeg.
// Usage: node render.mjs [--stills 0,1.6,3,5,6.5,8.6] [--out araccoon-promo.mp4] [--scale 1.5]
// Needs the preview server running: python -m http.server 8765 --directory video/araccoon-promo
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean).map(s => { const [k, ...v] = s.trim().split(' '); return [k, v.join(' ') || true]; }));
const URL_ = args.url || 'http://localhost:8765/index.html';
const SCALE = +(args.scale || 1.5);
const OUT = join(HERE, args.out || 'araccoon-promo.mp4');
const AUDIO = args.audio;   // optional soundtrack to mux in
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const PORT = 9333;

const profile = join(HERE, '.chrome-profile');
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--hide-scrollbars', '--force-color-profile=srgb', '--no-first-run', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));

let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page'); } catch {}
}
if (!target) throw new Error('Chrome did not start');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const pending = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } });
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 800)); return r.result.value; };

try {
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 720, height: 1170, deviceScaleFactor: SCALE, mobile: false });
  await send('Page.navigate', { url: URL_ });
  for (let i = 0; i < 100; i++) { await sleep(200); if (await evaluate('!!window.ready').catch(() => false)) break; }
  const info = await evaluate('window.ready');
  console.log('ready', JSON.stringify(info));
  const shot = async (t, file) => { await evaluate(`window.seek(${t})`); const { data } = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(file, Buffer.from(data, 'base64')); };

  if (args.stills) {
    const dir = join(HERE, 'stills'); mkdirSync(dir, { recursive: true });
    for (const t of String(args.stills).split(',').map(Number)) { await shot(t, join(dir, `t${t.toFixed(2)}.png`)); console.log('still', t); }
  } else {
    const dir = join(HERE, '.frames'); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
    const n = Math.round(info.DURATION * info.FPS);
    for (let f = 0; f < n; f++) { await shot(f / info.FPS, join(dir, `f${String(f).padStart(4, '0')}.png`)); if (f % 25 === 0) console.log(`frame ${f}/${n}`); }
    const ff = ['-y', '-v', 'error', '-framerate', String(info.FPS), '-i', join(dir, 'f%04d.png')];
    if (AUDIO) ff.push('-i', AUDIO, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-shortest');
    ff.push('-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT);
    await new Promise((res, rej) => spawn('ffmpeg', ff, { stdio: 'inherit' }).on('exit', c => c ? rej(new Error('ffmpeg ' + c)) : res()));
    rmSync(dir, { recursive: true, force: true });
    console.log('wrote', OUT);
  }
} finally {
  ws.close(); chrome.kill();
}
