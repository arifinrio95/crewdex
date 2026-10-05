"use strict";
/* Director: drives the real Crewdex app inside the window, with a camera, a cursor, captions and title cards. */
const $ = s => document.querySelector(s);
const frame = $('#app'); let w, d;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const until = async (fn, to = 20000) => { const t0 = performance.now(); while (performance.now() - t0 < to) { try { const v = fn(); if (v) return v; } catch (e) { } await sleep(50); } console.log('FILM until timeout', String(fn).slice(0, 90)); return null; };
const q = s => d.querySelector(s), qa = s => [...d.querySelectorAll(s)];
const byText = (sel, txt) => qa(sel).find(e => e.textContent.replace(/\s+/g, ' ').includes(txt));
const EASE = 'cubic-bezier(.65,0,.2,1)', OUT = 'cubic-bezier(.16,1,.3,1)', SPRING = 'cubic-bezier(.34,1.56,.64,1)';
const T0 = () => performance.now(); let START = 0;
const sfx = n => console.log('FILM sfx', n, ((performance.now() - START) / 1000).toFixed(3));
const mark = name => console.log('FILM', ((performance.now() - START) / 1000).toFixed(1) + 's', name);

/* ---------------- camera ---------------- */
const WIN = { w: 1560, h: 1000, bar: 40 };
const CAM = { x: 780, y: 500, s: 1.04, r: 0 };
const camT = c => `translate(960px,540px) rotate(${c.r}deg) scale(${c.s}) translate(${-c.x}px,${-c.y}px)`;
let camAnim = null;
function cam(to, dur = 1100, ease = EASE) {
  sfx('cam');
  const from = camT(CAM); Object.assign(CAM, to); const el = $('#cam');
  if (camAnim) { try { camAnim.cancel(); } catch (e) { } }
  el.style.transform = camT(CAM);
  camAnim = el.animate([{ transform: from }, { transform: camT(CAM) }], { duration: dur, easing: ease, fill: 'backwards' });
  return sleep(dur);
}
const full = (dur = 1100, r = 0) => cam({ x: 780, y: 500, s: 1.04, r }, dur);
const rectOf = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: WIN.bar + r.top + r.height / 2, w: r.width, h: r.height, l: r.left, t: WIN.bar + r.top }; };
function focus(el, s = 1.6, dur = 1100, dx = 0, dy = 0, r = 0) { const c = rectOf(el); return cam({ x: c.x + dx, y: c.y + dy, s, r }, dur); }
/** Frames an element so it fills `fill` of the screen. */
function frameEl(el, fill = .7, dur = 1100, r = 0, dx = 0, dy = 0) { const c = rectOf(el); const s = Math.min(2.6, Math.min(1920 * fill / c.w, 1080 * fill / c.h)); return cam({ x: c.x + dx, y: c.y + dy, s, r }, dur); }

/* ---------------- cursor ---------------- */
const CUR = { x: 900, y: 600 }; let curAnim = null;
function curSet(x, y) { CUR.x = x; CUR.y = y; $('#cursor').style.transform = `translate(${x - 4}px,${y - 2}px)`; }
function moveTo(x, y, dur = 620) {
  const el = $('#cursor'); const from = `translate(${CUR.x - 4}px,${CUR.y - 2}px)`; CUR.x = x; CUR.y = y; const to = `translate(${x - 4}px,${y - 2}px)`;
  if (curAnim) { try { curAnim.cancel(); } catch (e) { } }
  el.style.transform = to; curAnim = el.animate([{ transform: from }, { transform: to }], { duration: dur, easing: EASE, fill: 'backwards' });
  return sleep(dur);
}
function ripple() { sfx('click'); const r = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); r.setAttribute('cx', 4); r.setAttribute('cy', 2); r.setAttribute('r', 6); r.setAttribute('fill', 'none'); r.setAttribute('stroke', '#EC7556'); r.setAttribute('stroke-width', 3); $('#cursor').appendChild(r); r.animate([{ r: 4, opacity: 1 }, { r: 26, opacity: 0 }], { duration: 480, easing: OUT, fill: 'forwards' }); setTimeout(() => r.remove(), 520); }
async function clickEl(el, o = {}) {
  if (!el) { console.log('FILM missing element for click'); return; }
  const c = rectOf(el); await moveTo(c.x + (o.dx || 0), c.y + (o.dy || 0), o.dur || 620); await sleep(o.pause ?? 140); ripple(); await sleep(90);
  if (!o.noClick) el.click(); await sleep(o.after ?? 220);
}
async function typeInto(el, text, per = 34) {
  el.focus();
  for (const ch of text) { sfx('key'); el.value += ch; el.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(ch === ' ' ? per * 1.6 : per); }
}
const enter = el => sfx('enter') || el.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
const fire = (target, type, x, y) => target.dispatchEvent(new w.PointerEvent(type, { clientX: x, clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1, bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', isPrimary: true }));
/** Real pointer drag inside the app, with the cursor following. Coordinates are app-viewport pixels. */
async function drag(el, to, dur = 1000, grab) {
  const r = el.getBoundingClientRect(); const sx = r.left + (grab ? grab.x : r.width / 2), sy = r.top + (grab ? grab.y : r.height / 2);
  await moveTo(sx, sy + WIN.bar, 560); await sleep(120); sfx('grab'); fire(el, 'pointerdown', sx, sy); await sleep(140);
  const N = Math.round(dur / 33); const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  for (let i = 1; i <= N; i++) { const t = ease(i / N); const x = sx + (to.x - sx) * t, y = sy + (to.y - sy) * t; fire(d, 'pointermove', x, y); curSet(x, y + WIN.bar); await sleep(33); }
  await sleep(160); sfx('drop'); fire(d, 'pointerup', to.x, to.y); await sleep(260);
}
async function scrollApp(y, dur = 800, el) { const t = el || d.scrollingElement; const from = t.scrollTop, N = Math.max(1, Math.round(dur / 33)); for (let i = 1; i <= N; i++) { const k = i / N, e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; t.scrollTop = from + (y - from) * e; await sleep(33); } }

/* ---------------- captions, notes, cards ---------------- */
const words = html => html.split(/(<[^>]+>|\s+)/).filter(Boolean).map(tok => /^</.test(tok) || /^\s+$/.test(tok) ? tok : `<span class="w">${tok}</span>`).join('');
let capOn = false;
async function say(k, html, o = {}) {
  const cap = $('#cap'); sfx('say');
  if (capOn) { cap.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-26px)' }], { duration: 220, easing: 'ease-in', fill: 'forwards' }); await sleep(230); }
  cap.querySelector('.k').innerHTML = k; cap.querySelector('.h').innerHTML = words(html);
  cap.style.left = (o.left ?? 84) + 'px'; cap.style.bottom = (o.bottom ?? 74) + 'px'; cap.querySelector('.h').style.fontSize = (o.size || 92) + 'px';
  cap.getAnimations().forEach(a => a.cancel()); cap.style.opacity = 1;
  cap.querySelector('.k').animate([{ opacity: 0, transform: 'rotate(-14deg) scale(.6)' }, { opacity: 1, transform: 'rotate(-2.5deg) scale(1)' }], { duration: 520, easing: SPRING, fill: 'backwards' });
  [...cap.querySelectorAll('.w')].forEach((s, i) => s.animate([{ opacity: 0, transform: 'translateY(70px) rotate(7deg)' }, { opacity: 1, transform: 'none' }], { duration: 640, delay: 90 + i * 55, easing: OUT, fill: 'backwards' }));
  $('#capbg').animate([{ opacity: capOn ? 1 : 0 }, { opacity: 1 }], { duration: 400, fill: 'forwards' });
  capOn = true;
}
async function hush() { if (!capOn) return; capOn = false; $('#cap').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }); $('#capbg').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' }); await sleep(300); }
function note(html, ms = 2200, pos) {
  sfx('pop'); const n = $('#note'); n.innerHTML = html; n.style.right = (pos && pos.right != null ? pos.right : 76) + 'px'; n.style.top = (pos && pos.top != null ? pos.top : 70) + 'px';
  n.getAnimations().forEach(a => a.cancel());
  n.animate([{ opacity: 0, transform: 'rotate(12deg) scale(.5) translateY(-30px)' }, { opacity: 1, transform: 'rotate(3deg) scale(1)', offset: .14 }, { opacity: 1, transform: 'rotate(2deg) scale(1)', offset: .88 }, { opacity: 0, transform: 'rotate(-4deg) scale(.9) translateY(-20px)' }], { duration: ms, easing: 'ease-out', fill: 'forwards' });
}
function chapter(n) { const c = $('#chap'); c.textContent = n; c.animate([{ opacity: 0, transform: 'translateY(80px) rotate(8deg)' }, { opacity: 1, transform: 'rotate(-4deg)' }], { duration: 800, easing: OUT, fill: 'forwards' }); }
async function ring(el, ms = 1300, pad = 8) { sfx('ting'); const r = el.getBoundingClientRect(); const g = $('#ring'); Object.assign(g.style, { left: r.left - pad + 'px', top: WIN.bar + r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px' }); g.animate([{ opacity: 0, transform: 'scale(1.12)' }, { opacity: 1, transform: 'scale(1)', offset: .2 }, { opacity: 1, offset: .8 }, { opacity: 0 }], { duration: ms, easing: OUT, fill: 'forwards' }); }
async function card(html, o = {}) {
  sfx('card'); const c = $('#card'); c.style.background = o.bg || '#FBF7EF'; c.style.color = o.fg || '#2B2522'; c.querySelector('.in').innerHTML = html;
  c.getAnimations().forEach(a => a.cancel()); c.style.opacity = 1;
  [...c.querySelectorAll('.w')].forEach((s, i) => s.animate([{ opacity: 0, transform: 'translateY(120px) rotate(9deg) scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: (o.delay || 0) + i * 80, easing: OUT, fill: 'backwards' }));
  [...c.querySelectorAll('.pop')].forEach((s, i) => s.animate([{ opacity: 0, transform: 'translateY(160px) scale(.4) rotate(-12deg)' }, { opacity: 1, transform: 'none' }], { duration: 720, delay: (o.popDelay || 300) + i * 95, easing: SPRING, fill: 'backwards' }));
}
async function cardOut(ms = 380) { const c = $('#card'); c.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(1.06)' }], { duration: ms, easing: 'ease-in', fill: 'forwards' }); await sleep(ms); c.style.opacity = 0; }
async function wipe(mid) { sfx('whoosh'); const x = $('#wipe'); x.animate([{ transform: 'translateY(101%)' }, { transform: 'translateY(0)' }], { duration: 420, easing: EASE, fill: 'forwards' }); await sleep(430); if (mid) await mid(); x.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-101%)' }], { duration: 460, easing: EASE, fill: 'forwards' }); await sleep(120); }
const big = (html, sub) => `<h1 class="big">${words(html)}</h1>${sub ? `<p class="sub pop">${sub}</p>` : ''}`;
const agent = (tone, pose, size, lead) => `<span class="pop">${w.agentSVG({ tone, pose, size, lead })}</span>`;
const proj = name => Object.values(w.S.projects).find(p => p.name === name);
const task = title => Object.values(w.S.actions).find(a => a.title === title);
const rowOf = title => qa('.act').find(e => (e.querySelector('.act-title') || {}).textContent === title);

/* =========================================================== the film */
async function film() {
  w = frame.contentWindow; d = frame.contentDocument; START = T0();
  for (const n of ['S', 'UI', 'todayISO', 'addDays']) w[n] = w.eval(n);
  const st = d.createElement('style'); st.textContent = '.pcol-tools{opacity:1!important}.act-tools{opacity:0!important}.toasts{bottom:26px!important}'; d.head.appendChild(st);
  $('#cam').style.transform = camT(Object.assign(CAM, { x: 780, y: 1500, s: .86, r: -6 }));
  $('#cursor').style.opacity = 0;

  /* ---- 0. cold open ---- */
  mark('open');
  await card(big('You already have <em>Codex.</em>'), {}); await sleep(1500);
  await card(big('It is brilliant.'), { delay: 0 }); await sleep(950);
  await card(big('And it works <em>alone.</em>')); await sleep(1500);
  await card(`<h1 class="big" style="font-size:250px">${words('Give it a <em>crew.</em>')}</h1><div class="crew">${agent('cobalt', 'walk', 150)}${agent('sage', 'cheer', 170)}${agent(null, 'wave', 230, true)}${agent('terracotta', 'type', 170)}${agent('sand', 'think', 150)}${agent('burgundy', 'idle', 140)}</div>`, { bg: '#2B2522', fg: '#FBF7EF', popDelay: 500 });
  await sleep(2600);
  await card(`<div class="crew" style="height:230px;margin:0 0 10px">${agent(null, 'cheer', 250, true)}</div><h1 class="big" style="font-size:270px">${words('Crewdex')}</h1><p class="sub pop" style="font-size:54px;color:#2B2522">Codex, with a crew.</p><p class="sub pop" style="font-size:30px;margin-top:18px">Project management first. Codex on any task, when you want it.</p>`, { popDelay: 200 });
  await sleep(3000);

  /* ---- 1. import ---- */
  mark('import');
  await wipe(async () => { $('#card').style.opacity = 0; });
  chapter('01'); $('#cursor').style.opacity = 1;
  cam({ x: 780, y: 520, s: 1.0, r: 0 }, 1500, OUT);
  await say('<b>01</b> Start', 'Bring in what you are <em>already</em> doing', { size: 84 });
  await sleep(1500);
  await clickEl(q('.wl-main [data-nav="import"]'));
  await until(() => q('[data-act="imp-scan"]')); await sleep(500);
  await hush();
  await clickEl(q('[data-act="imp-scan"]'));
  note('Reads your <b>past Codex sessions</b>', 2400);
  await until(() => q('.imp-card'), 30000); await sleep(350);
  cam({ x: 780, y: 470, s: 1.12 }, 1000);
  await say('<b>01</b> Import', 'Sessions become <mark>projects</mark>', { size: 84 });
  await sleep(1500);
  const lna = qa('.imp-card').find(c => c.querySelector('.imp-name').value === 'LNA Platform');
  if (lna) { await clickEl(lna.querySelector('[data-act="imp-hold"][data-v="1"]')); note('Not now? Keep it <b>on hold</b>', 2000); await sleep(700); }
  await hush();
  await clickEl(q('[data-act="imp-run"]'));
  note('History and <b>memory</b> come along', 2600);
  await until(() => q('.imp-res'), 40000); await sleep(1300);
  await clickEl(q('.imp-b [data-nav="now"]'));
  await sleep(600);

  /* ---- 2. now: columns ---- */
  mark('now');
  await wipe(async () => {
    const P = n => proj(n).id; const t = w.todayISO(); let ord = 1000;
    const add = (pn, title, o = {}) => { const a = w.createAction(Object.assign({ projectId: P(pn), title, bucket: 'backlog', state: 'later' }, o)); w.patch('actions', a.id, Object.assign({ start: o.start || t, order: ord++ }, o.who ? { who: o.who, whoReason: 'Codex can do this on your Mac.' } : {})); };
    w.tx(null, () => {
      add('Nusa Persona', 'Shortlist 3 pilot partners', { due: w.addDays(t, 9), start: w.addDays(t, 2) });
      add('Nusa Persona', 'Compare synthetic survey vs benchmark', { bucket: 'commit', due: w.addDays(t, 2), start: w.addDays(t, -3), who: 'codex' });
      add('Nusa Persona', 'Draft pilot MoU outline', { start: w.addDays(t, 6) });
      add('Datasans', 'Finish RAG ebook chapter 3', { bucket: 'commit', due: w.addDays(t, 3), start: w.addDays(t, -6), who: 'codex' });
      add('Datasans', 'Design the ebook cover', { bucket: 'commit', start: w.addDays(t, -1), who: 'codex' });
      add('Datasans', 'Write 5 hooks for the launch thread', { start: w.addDays(t, 4), due: w.addDays(t, 12) });
      add('Datasans', 'Call the printing vendor', { start: t });
      add('LESTARI Paper', 'Revise the methodology section', { bucket: 'commit', due: w.addDays(t, 4), start: w.addDays(t, -9), who: 'codex' });
      add('LESTARI Paper', 'Draft response letter to reviewer 2', { start: w.addDays(t, 3), due: w.addDays(t, 16) });
      add('LNA Platform', 'Map framework to question bank', {});
    });
    w.navigate('now'); w.scrollTo(0, 0);
    Object.assign(CAM, { x: 780, y: 500, s: 1.04, r: 0 }); $('#cam').style.transform = camT(CAM);
  });
  chapter('02');
  await say('<b>02</b> Now', 'Projects are columns. <em>Tasks are yours.</em>', { size: 84 });
  await sleep(2200);
  const npCol = () => qa('.pcol').find(c => c.querySelector('.pcol-n').textContent === 'Nusa Persona');
  await hush();
  await focus(npCol(), 1.5, 1000, 60, -40);
  const inp = npCol().querySelector('.pcol-add'); await clickEl(inp, { noClick: true });
  await typeInto(inp, 'Prepare validation deck friday', 40);
  note('Type it the way you <b>say it</b>', 2200, { right: 120, top: 150 });
  await sleep(350); enter(inp);
  await until(() => rowOf('Prepare validation deck')); await sleep(900);
  ring(rowOf('Prepare validation deck'), 1300, 6); await sleep(1100);
  // drag the new task to the top
  const firstRow = npCol().querySelector('.pcol-open .act').getBoundingClientRect();
  await drag(rowOf('Prepare validation deck'), { x: firstRow.left + 120, y: firstRow.top + 4 }, 900, { x: 120, y: 18 });
  note('Drag to <b>reorder</b>', 1700, { right: 120, top: 150 });
  await sleep(900);
  await full(900);
  // drag a whole column
  const dsHead = qa('.pcol').find(c => c.querySelector('.pcol-n').textContent === 'Datasans').querySelector('.pcol-h');
  const first = qa('.pcol')[0].getBoundingClientRect();
  await drag(dsHead, { x: first.left + 40, y: first.top + 60 }, 1100, { x: 150, y: 20 });
  await say('<b>02</b> Now', 'Prioritize. <mark>Park the rest.</mark>', { size: 84 });
  await sleep(900);
  const leCol = qa('.pcol').find(c => c.querySelector('.pcol-n').textContent === 'LESTARI Paper');
  await clickEl(leCol.querySelector('.pcol-hold'));
  await sleep(700);
  const held = await until(() => q('.held'));
  await frameEl(held, .62, 900, 0, 0, -60);
  ring(q('.held-list'), 1600, 10); note('On hold: <b>grey, out of the way</b>', 2000, { right: 120, top: 150 }); await sleep(1900);
  await clickEl(byText('.held-row', 'LESTARI Paper').querySelector('[data-act="proj-resume"]'));
  await sleep(700); await full(800); await hush();

  /* ---- 3. task drawer ---- */
  mark('drawer');
  chapter('03');
  const askBtn = rowOf('Prepare validation deck').querySelector('.askbtn');
  await focus(askBtn, 1.9, 900, -120, 30); await clickEl(askBtn);
  const drawer = await until(() => q('#drawer.open #dw-brief-t')); await sleep(500);
  await cam({ x: 1262, y: 400, s: 1.42, r: 0 }, 1100);
  await say('<b>03</b> Ask Codex', 'Any task can go to <em>Codex</em>', { size: 84, left: 84 });
  await sleep(1700);
  await hush();
  await clickEl(q('#drawer [data-act="enhance"]'));
  note('Break it down: <b>who does what</b>', 2600, { right: 1240, top: 110 });
  await until(() => q('#drawer .enh-list'), 20000); await sleep(300);
  const dr = q('#drawer');
  await scrollApp(q('#drawer .enh-box').offsetTop - 120, 900, dr);
  await cam({ x: 1262, y: 520, s: 1.5 }, 900);
  for (const k of ['who-codex', 'who-together', 'who-you']) { const el = q('#drawer .enh-list .' + k); if (el) { ring(el, 800, 5); await sleep(620); } }
  await sleep(500);
  await clickEl(q('#drawer [data-act="enh-discard"]')); await sleep(300);
  await scrollApp(0, 600, dr); await cam({ x: 1262, y: 420, s: 1.42 }, 700);
  await clickEl(q('#drawer [data-act="brief-enhance"]'));
  note('Or let it write a <b>better prompt</b>', 2600, { right: 1240, top: 110 });
  await until(() => q('#drawer .brief-notes'), 20000); await sleep(1500);
  await say('<b>03</b> Ask Codex', 'Model, thinking level, files. <mark>Per chat.</mark>', { size: 74 });
  await scrollApp(q('#drawer .brief-sess').offsetTop - 260, 800, dr);
  const setSel = async (sel, value) => { const el = q(sel); await clickEl(el, { noClick: true }); el.value = value; el.dispatchEvent(new w.Event('change', { bubbles: true })); await sleep(200); const e2 = q(sel); if (e2) ring(e2.closest('.cmp-pill'), 900, 4); await sleep(650); };
  await setSel('#dw-brief [data-cmpf="model"]', 'gpt-6-astra');
  await setSel('#dw-brief [data-cmpf="effort"]', 'xhigh');
  await clickEl(q('#dw-brief [data-act="cmp-attach"]')); await until(() => q('#dw-brief .cmp-file')); ring(q('#dw-brief .cmp-file'), 900, 4); await sleep(1000);
  await hush();
  w.__demoBeat = b => { beats.push(b); beatNow = b; };
  await clickEl(q('#drawer [data-act="brief-send"]'));

  /* ---- 4. chatroom: everything Codex can do ---- */
  mark('chat');
  await until(() => q('.chat #live'), 15000);
  chapter('04');
  await full(1000);
  await say('<b>04</b> Chatroom', 'Watch it <em>work.</em>', { size: 92 });
  await sleep(1500); await hush();
  const liveCam = () => { const l = q('#live'); if (l) frameEl(l, .6, 800, 0, 0, 40); };
  const beatCap = { think: ['Thinks', 'It <em>thinks out loud</em>'], read: ['Reads', 'Reads the project <mark>memory</mark>'], run: ['Runs', 'Runs <em>real commands</em>'], web: ['Searches', 'Searches <mark>the web</mark>'], write: ['Writes', 'Writes <em>files</em>'], image: ['Paints', 'Generates <mark>images</mark>'], computer: ['Clicks', 'Uses <em>your computer</em>'], memory: ['Remembers', 'Remembers what it <mark>learned</mark>'] };
  let seen = 0;
  const handle = async b => {
    sfx(b === 'done' ? 'done' : b === 'approve' ? 'alert' : 'beat');
    if (beatCap[b]) { liveCam(); await say(`<b>04</b> ${beatCap[b][0]}`, beatCap[b][1], { size: 84 }); }
    if (b === 'approve') {
      if (!await until(() => q('.appr [data-act="appr"]'), 8000)) return;
      await scrollApp(d.scrollingElement.scrollHeight, 350);
      frameEl(q('.appr'), .6, 800, 0, 0, 90); await say('<b>04</b> Asks first', 'Risky step? It <em>asks first.</em>', { size: 84 });
      await sleep(1500); await clickEl(q('.appr [data-act="appr"]'));
    }
    if (b === 'answer') {
      await sleep(1300); await hush(); await until(() => beatNow === 'done', 15000); await sleep(500);
      const tb = await until(() => q('#stream table'), 4000);
      if (tb) { await scrollApp(Math.max(0, tb.getBoundingClientRect().top + d.scrollingElement.scrollTop - 150), 700); const c = rectOf(tb); await cam({ x: c.x, y: c.y + 150, s: 1.5, r: 0 }, 900); }
      await say('<b>04</b> Answer', 'Tables, diagrams, files. <mark>Rendered.</mark>', { size: 84 }); await sleep(2600); await hush();
    }
  };
  while (beatNow !== 'done') { if (seen < beats.length) { await handle(beats[seen++]); } else await sleep(60); }
  while (seen < beats.length) await handle(beats[seen++]);
  mark('outputs');
  await full(900);
  { const side = q('.chat-side'); if (side) { ring(side, 1700, 4); note('Every session of this project, <b>one click away</b>', 2200, { right: 1180, top: 150 }); await sleep(2000); } }
  await say('<b>04</b> Results', 'Final outputs, <mark>one click</mark> away', { size: 84 });
  await sleep(600);
  const chip = n => qa('#live .fchip')[n] || qa('.fchip.out')[n];
  await clickEl(chip(1)); await sleep(700);
  await cam({ x: 1240, y: 500, s: 1.36 }, 1000); await sleep(1700);
  await hush();
  await clickEl(qa('#live .fchip')[2]); note('Charts, decks, PDFs, tables, images: <b>previewed in place</b>', 3000, { right: 1080, top: 120 }); await sleep(2300);
  await clickEl(qa('#live .fchip')[0]); await sleep(1500);
  await clickEl(q('[data-act="pane-tab"][data-v="steps"]')); await sleep(300);
  await say('<b>04</b> History', 'Every step, in <em>plain language</em>', { size: 84 });
  await scrollApp(260, 1400, q('#pane-body')); await sleep(900);
  await cam({ x: 150, y: 880, s: 2.1 }, 1000); note('Usage, <b>always in sight</b>', 2000, { right: 1100, top: 300 }); await sleep(1900);
  await hush();

  { const fu = q('[data-followup]'); if (fu) {
    await full(800); await scrollApp(d.scrollingElement.scrollHeight, 500);
    await frameEl(fu.parentElement.parentElement, .5, 800, 0, 0, 80);
    await say('<b>04</b> Follow up', 'Same session. <em>Same memory.</em>', { size: 84 });
    beatNow = ''; w.__demoBeat = b => { beatNow = b; };
    await clickEl(fu); await sleep(600); const l = q('#live'); if (l) frameEl(l, .6, 800, 0, 0, 40);
    await until(() => beatNow === 'follow-done', 12000); sfx('done'); await sleep(1400); await hush();
  } }

  /* ---- 5. skills ---- */
  mark('skill');
  chapter('05'); await full(800);
  const offer = await until(() => q('.skill-offer [data-act="skill-save"]'));
  await scrollApp(d.scrollingElement.scrollHeight, 700);
  await frameEl(q('.skill-offer'), .62, 900, 0, 0, 60);
  await say('<b>05</b> Skills', 'Good work becomes a <em>skill</em>', { size: 84 });
  await sleep(1300);
  beatNow = '';
  await clickEl(q('.skill-offer [data-act="skill-save"][data-scope="project"]'));
  await until(() => beatNow === 'skill-done', 20000); sfx('done'); await sleep(600);
  await scrollApp(d.scrollingElement.scrollHeight, 500);
  const saved = q('.skill-offer'); if (saved) frameEl(saved, .6, 700, 0, 0, 60);
  note('Next time, the result <b>starts at this quality</b>', 2600, { right: 100, top: 110 });
  await sleep(2400); await hush();

  /* ---- 6. the project remembers ---- */
  mark('project');
  chapter('06');
  await wipe(async () => { w.navigate('project', proj('Nusa Persona').id); await sleep(500); w.scrollTo(0, 0); Object.assign(CAM, { x: 780, y: 500, s: 1.04, r: 0 }); $('#cam').style.transform = camT(CAM); });
  await say('<b>06</b> Memory', 'Every project <mark>remembers</mark>', { size: 84 });
  const cx = await until(() => q('.codex-sec .mem')); await sleep(900);
  await scrollApp(q('.codex-sec').offsetTop - 30, 1100);
  await sleep(500); await focus(q('.codex-sec .mem'), 1.5, 900, 120, 40); await sleep(1700);
  await hush();
  const fg = q('.codex-sec .fgrid'); if (fg) { await scrollApp(d.scrollingElement.scrollTop + fg.getBoundingClientRect().top - 330, 800); await frameEl(fg, .72, 900); note('Sessions, final outputs and skills <b>live in the project folder</b>', 3000, { right: 90, top: 90 }); await sleep(2700); }

  /* ---- 7. week and horizon ---- */
  mark('week');
  chapter('07');
  await wipe(async () => { w.navigate('week'); await sleep(300); w.scrollTo(0, 0); Object.assign(CAM, { x: 780, y: 500, s: 1.04, r: 0 }); $('#cam').style.transform = camT(CAM); });
  await say('<b>07</b> Week', 'Commit only what you will <em>finish</em>', { size: 84 });
  await sleep(2300);
  await clickEl(q('#nav a[data-nav="horizon"]'), { noClick: true }); w.navigate('horizon'); await sleep(900);
  await say('<b>07</b> Horizon', 'Start, end, or <mark>open-ended</mark>', { size: 84 });
  await sleep(1300);
  const open = await until(() => q('.tbar.open'));
  if (open) { await hush(); await focus(open, 1.7, 900, 120, 0); const r = open.getBoundingClientRect(); await drag(open.querySelector('.tb-n'), { x: r.right + 150, y: r.top + 12 }, 1100, { x: 4, y: 12 }); note('Drag the edge to <b>set a deadline</b>', 2200, { right: 100, top: 110 }); await sleep(1500); }
  await full(800);

  /* ---- 8. the office and Dex ---- */
  mark('office');
  chapter('08');
  await wipe(async () => { w.__demoShort = true; w.navigate('office'); await sleep(400); w.scrollTo(0, 0); Object.assign(CAM, { x: 780, y: 500, s: 1.04, r: 0 }); $('#cam').style.transform = camT(CAM); });
  await say('<b>08</b> Office', 'Meet the <em>crew</em>', { size: 92 });
  await sleep(1700);
  await scrollApp(560, 1300); await sleep(1500);
  note('Every object is <b>live data</b>: trays, plants, calendars', 3000, { right: 90, top: 90 });
  const pod = q('svg.pod'); if (pod) { await focus(pod, 1.75, 1000); await sleep(1900); }
  await full(800); await scrollApp(0, 900);
  await say('<b>08</b> Dex', 'Dex runs the <mark>whole crew</mark>', { size: 84 });
  const dexIn = q('#dex-input'); await focus(q('.dex-bar'), 1.35, 900, 0, 120);
  await clickEl(dexIn, { noClick: true }); await typeInto(dexIn, 'plan my week', 55); await sleep(300); enter(dexIn);
  await sleep(2600);
  const disp = await until(() => q('[data-act="dex-dispatch"]'), 6000);
  if (disp) { await clickEl(disp); await sleep(500); await clickEl(q('[data-act="dex-dispatch"]')); }
  await hush(); await full(800);
  await scrollApp(560, 1200);
  note('Agents work <b>in parallel</b>, one per project', 3000, { right: 90, top: 90 });
  await sleep(3600);
  await until(() => qa('.pod-cheer').length >= 1, 16000); sfx('done'); await sleep(1800);

  { await full(700); w.navigate('now'); await sleep(500); w.scrollTo(0, 0);
    const th = q('[data-act="theme"]'); if (th) { await clickEl(th); note('And yes: <b>dark mode</b>', 2400, { right: 120, top: 150 }); await sleep(2600); } }

  /* ---- 9. outro ---- */
  mark('outro');
  await wipe(async () => { });
  const feats = [['Import from Codex history', '#6A80E6'], ['Projects as columns', '#EC7556'], ['Prioritize and hold', '#3FAE87'], ['Break down tasks', '#EDB43C'], ['Enhanced prompts', '#E57CAB'], ['Model per chat', '#9A84D6'], ['Attachments', '#6A80E6'], ['Live agent view', '#EC7556'], ['Approvals', '#3FAE87'], ['Web, code, images, computer use', '#EDB43C'], ['File previews', '#E57CAB'], ['Plain-language history', '#9A84D6'], ['Project memory', '#6A80E6'], ['Skills', '#EC7556'], ['Week and Horizon', '#3FAE87'], ['The office and Dex', '#EDB43C']];
  await card(`<div style="max-width:1640px">${feats.map(([t, c]) => `<span class="tile pop"><i style="background:${c}"></i>${t}</span>`).join('')}</div>`, { popDelay: 100 });
  await sleep(4200);
  await card(`<div class="crew" style="height:250px;margin:0">${agent('cobalt', 'cheer', 150)}${agent('sage', 'cheer', 160)}${agent(null, 'cheer', 250, true)}${agent('terracotta', 'cheer', 160)}${agent('sand', 'cheer', 150)}</div><h1 class="big" style="font-size:280px">${words('Crewdex')}</h1><p class="sub pop" style="font-size:60px;color:#FBF7EF">Codex, with a <span style="color:#EDB43C">crew.</span></p>`, { bg: '#2B2522', fg: '#FBF7EF', popDelay: 150 });
  await sleep(4200);
  mark('end');
  window.__filmDone = true;
}
const beats = []; let beatNow = '';
window.__filmStart = () => { film().catch(e => { console.log('FILM ERROR', e && e.stack || e); window.__filmDone = true; }); };
