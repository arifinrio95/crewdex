// Records a page frame by frame with Chrome's virtual time, so every CSS animation, timer and rAF
// advances exactly 1/fps per frame regardless of how long a screenshot takes.
// usage: node capture.mjs <url> <outDir> <seconds> [fps=30] [width=1920] [height=1080] [startSec=0]
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
const [url, out, secs, fpsArg, wArg, hArg, startArg, everyArg] = process.argv.slice(2); const every = +(everyArg || 1);
const fps = +(fpsArg || 30), W = +(wArg || 1920), H = +(hArg || 1080), total = Math.round(+secs * fps), startFrame = Math.round(+(startArg || 0) * fps);
mkdirSync(out, { recursive: true });
const port = 9300 + Math.floor(Math.random() * 500);
const prof = `/tmp/crewdex-film-${port}`;
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, `--window-size=${W},${H}`, '--hide-scrollbars', '--force-device-scale-factor=1', '--no-first-run', '--disable-extensions', '--mute-audio', '--run-all-compositor-stages-before-draw', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let target; for (let i = 0; i < 60 && !target; i++) { await sleep(250); try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); target = l.find(t => t.type === 'page'); } catch (e) { } }
if (!target) { console.error('Chrome did not start'); process.exit(1); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pend = new Map(); const waiters = [];
ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } else if (m.method) { for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].method === m.method) { waiters[i].res(m.params); waiters.splice(i, 1); } if (m.method === 'Runtime.consoleAPICalled') { const t = m.params.args.map(a => a.value ?? a.description ?? '').join(' '); if (/^FILM/.test(t) || m.params.type === 'error') console.log(t.slice(0, 400)); } if (m.method === 'Runtime.exceptionThrown') console.error('PAGE ERROR', m.params.exceptionDetails.exception?.description?.slice(0, 300) || m.params.exceptionDetails.text); } });
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const once = method => new Promise(res => waiters.push({ method, res }));
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
const loaded = once('Page.loadEventFired');
await send('Page.navigate', { url });
await loaded; await sleep(1500);                      // real time: let fonts and assets arrive
await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => 1)', awaitPromise: true });
await send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
await send('Runtime.evaluate', { expression: 'window.__filmStart && window.__filmStart()' });
const t0 = Date.now(); const step = 1000 / fps;
for (let f = 0; f < total; f++) {
  const exp = once('Emulation.virtualTimeBudgetExpired');
  await send('Emulation.setVirtualTimePolicy', { policy: 'advance', budget: step });
  await exp;
  const tk = await send('Runtime.evaluate', { expression: '(window.__tick && window.__tick(), !!window.__filmDone)', returnByValue: true });
  if (tk.result && tk.result.value) { console.log('film done at frame', f); break; }
  if (f >= startFrame && f % every === 0) { const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 93 }); writeFileSync(`${out}/f${String(f).padStart(5, '0')}.jpg`, Buffer.from(data, 'base64')); }
  if (f % 150 === 0) console.log(`frame ${f}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
ws.close(); chrome.kill(); await sleep(300); try { rmSync(prof, { recursive: true, force: true }); } catch (e) { }
console.log('done', total, 'frames');
