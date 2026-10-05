
"use strict";
/* ================= utilities ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clone = o => JSON.parse(JSON.stringify(o));
const uid = p => p + Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 7);
const nowTs = () => new Date().toISOString();
const VIEW = document.getElementById('view');

/* ---- dates (local calendar days as YYYY-MM-DD) ---- */
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const todayISO = () => iso(new Date());
const addDays = (s, n) => { const d = fromISO(s); d.setDate(d.getDate() + n); return iso(d); };
const diffDays = (a, b) => Math.round((fromISO(a) - fromISO(b)) / 864e5);
const dow = s => fromISO(s).getDay();
const mondayOf = s => addDays(s, -((dow(s) + 6) % 7));
const planWeek = () => { const t = todayISO(); return dow(t) === 0 ? addDays(t, 1) : mondayOf(t); };
const dayOfTs = ts => ts ? iso(new Date(ts)) : null;
const daysIn = (y, m) => new Date(y, m + 1, 0).getDate();
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOWS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOWL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const fmt = s => { const d = fromISO(s); return `${MON[d.getMonth()]} ${d.getDate()}`; };
const fmtDow = s => { const d = fromISO(s); return `${DOWS[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`; };
function relDay(s) {
  const t = todayISO(), n = diffDays(s, t);
  if (n === 0) return 'Today'; if (n === 1) return 'Tomorrow'; if (n === -1) return 'Yesterday';
  if (n > 1 && n < 7) return DOWL[dow(s)];
  return fmt(s);
}
function inDays(s) { const n = diffDays(s, todayISO()); if (n === 0) return 'today'; if (n === 1) return 'tomorrow'; if (n > 0) return `in ${n} days`; if (n === -1) return 'yesterday'; return `${-n} days ago`; }
function isoWeekNo(s) { const d = fromISO(s); d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7)); const w1 = new Date(d.getFullYear(), 0, 4); return 1 + Math.round(((d - w1) / 864e5 - 3 + ((w1.getDay() + 6) % 7)) / 7); }

/* ================= example portfolio (used only when no account storage is available) ================= */
/*SEED-START*/
function exampleSeed(base) {
  const W = dow(base) === 0 ? addDays(base, 1) : mondayOf(base);
  const ts = (off, h = 10, m = 0) => { const d = fromISO(addDays(base, off)); d.setHours(h, m, 0, 0); return d.toISOString(); };
  const P = {}, M = {}, A = {};
  const proj = (id, o) => { P[id] = Object.assign({ id, status: 'Active', createdAt: ts(-60), updatedAt: ts(-1) }, o); };
  proj('nusa', { name: 'Nusa Persona', kind: 'Product', color: 'cobalt', order: 1, thesis: 'From synthetic population to a commercially usable insight engine.', phases: ['Explore', 'Build', 'Validate', 'Pilot', 'Scale'], phase: 2, focus: 'Make validation defensible enough for the next pilot.', updatedAt: ts(-1, 16) });
  proj('lestari', { name: 'LESTARI Paper', kind: 'Research', color: 'terracotta', order: 2, thesis: 'A revised manuscript that survives the second round of review.', phases: ['Revision', 'Experiment', 'Writing', 'Submission'], phase: 0, focus: 'Answer reviewer 2 on methodology without rerunning the whole study.', updatedAt: ts(-15, 21) });
  proj('datasans', { name: 'Datasans', kind: 'Content', color: 'sage', order: 3, thesis: 'A content engine that turns one idea into a week of distribution.', phases: ['Content Engine', 'Ebook', 'Ads', 'Distribution'], phase: 1, focus: 'Ship the RAG ebook before spending anything on ads.', updatedAt: ts(-2, 11) });
  proj('lna', { name: 'LNA Platform', kind: 'Platform', color: 'sand', order: 4, thesis: 'A learning-needs assessment a team can run without a consultant.', phases: ['Framework', 'Prototype', 'Internal Review'], phase: 1, focus: 'Put a clickable prototype in front of two internal reviewers.', updatedAt: ts(-6, 15) });
  const ms = (id, projectId, title, off, done, doneOff) => { M[id] = { id, projectId, title, date: addDays(base, off), done: !!done, doneAt: done ? ts(doneOff ?? off, 17) : null, createdAt: ts(-50), updatedAt: done ? ts(doneOff ?? off, 17) : ts(-30) }; };
  ms('npm1', 'nusa', 'Synthetic population v2', -16, 1); ms('npm2', 'nusa', 'Finalize pilot validation framework', 12); ms('npm3', 'nusa', 'Pilot launch', 24); ms('npm4', 'nusa', 'Commercial offer', 67);
  ms('lem1', 'lestari', 'Reviewer response plan', -22, 1); ms('lem2', 'lestari', 'Methodology revision', 10); ms('lem3', 'lestari', 'Robustness experiment', 19); ms('lem4', 'lestari', 'Submission', 26);
  ms('dsm1', 'datasans', 'Content engine v1', -9, 1); ms('dsm2', 'datasans', 'RAG ebook', 16); ms('dsm3', 'datasans', 'Ads engine', 45); ms('dsm4', 'datasans', 'Content system', 72);
  ms('lnm1', 'lna', 'Competency framework', -4, 1, -6); ms('lnm2', 'lna', 'Clickable prototype', 19); ms('lnm3', 'lna', 'Internal review', 40);
  let n = 0;
  const act = (projectId, milestoneId, title, o = {}) => {
    const id = 'a' + (++n).toString().padStart(3, '0');
    const c = o.c ?? -3;
    A[id] = Object.assign({ id, projectId, milestoneId, title, bucket: 'backlog', state: 'later', week: null, due: null, today: null, done: false, doneAt: null, order: n * 1000, createdAt: ts(c, 9), updatedAt: ts(c, 9) }, o);
    delete A[id].c;
    if (A[id].bucket !== 'backlog') A[id].week = W;
    if (o.dueW != null) { A[id].due = addDays(W, o.dueW); delete A[id].dueW; }
    if (o.doneOff != null) { A[id].done = true; A[id].doneAt = ts(o.doneOff, 15, 20); A[id].updatedAt = A[id].doneAt; delete A[id].doneOff; }
    return id;
  };
  // Nusa Persona
  act('nusa', 'npm2', 'Prepare validation framework outline', { bucket: 'commit', today: base, dueW: 0, c: -2 });
  act('nusa', 'npm2', 'Compare synthetic survey vs SNLIK benchmark', { bucket: 'commit', dueW: 1, c: -4 });
  act('nusa', 'npm2', 'Prepare validation deck', { bucket: 'commit', dueW: 4, c: -2 });
  act('nusa', 'npm3', 'Shortlist 3 pilot partners', { bucket: 'room', dueW: 8, c: -5 });
  act('nusa', 'npm3', 'Set up pilot dashboard template', { dueW: 7, c: -8 });
  act('nusa', 'npm3', 'Draft pilot MoU outline', { dueW: 9, c: -8 });
  act('nusa', 'npm2', 'Ask BPS about the SNLIK 2025 release', { state: 'waiting', c: -6 });
  act('nusa', null, 'Competitor research: synthetic data vendors', { state: 'idea', c: -12 });
  act('nusa', 'npm2', 'Generate 10k synthetic respondents', { bucket: 'commit', doneOff: -1, c: -6 });
  act('nusa', 'npm2', 'Clean SNLIK 2024 microdata extract', { doneOff: -2, c: -9 });
  act('nusa', 'npm2', 'Draft validation metrics list', { doneOff: -3, c: -10 });
  act('nusa', 'npm1', 'Run population v2 QA', { doneOff: -17, c: -25 });
  // LESTARI
  act('lestari', 'lem2', 'Fix methodology section notation', { bucket: 'commit', today: base, c: -15 });
  act('lestari', 'lem2', 'Revise methodology section', { bucket: 'commit', dueW: 3, c: -15 });
  act('lestari', 'lem2', 'Draft response letter to reviewer 2', { c: -16 });
  act('lestari', 'lem3', 'Rerun ablation with the 2023 cohort', { state: 'waiting', c: -16 });
  act('lestari', 'lem4', 'Check journal formatting guide', { state: 'someday', c: -18 });
  act('lestari', 'lem1', 'Summarize reviewer comments', { doneOff: -20, c: -24 });
  act('lestari', 'lem2', 'Outline methodology changes', { doneOff: -15, c: -19 });
  // Datasans
  act('datasans', 'dsm2', 'Finish RAG ebook chapter 3', { bucket: 'commit', dueW: 2, c: -3 });
  act('datasans', 'dsm2', 'Review ebook chapter 2 edits', { bucket: 'commit', today: base, doneOff: 0, c: -2 });
  act('datasans', 'dsm2', 'Design ebook cover', { bucket: 'room', c: -4 });
  act('datasans', 'dsm2', 'Write 5 hooks for the launch thread', { bucket: 'room', c: -2 });
  act('datasans', 'dsm3', 'Test Meta ads audiences', { c: -9 });
  act('datasans', null, 'Newsletter: weekly RAG teardown', { state: 'idea', c: -11 });
  act('datasans', 'dsm4', 'Repurpose ebook into 10 carousel posts', { state: 'someday', c: -11 });
  act('datasans', 'dsm2', 'Outline RAG ebook', { doneOff: -10, c: -14 });
  act('datasans', 'dsm2', 'Draft chapter 2', { doneOff: -5, c: -9 });
  // LNA
  act('lna', 'lnm2', 'Wire up assessment flow screens', { bucket: 'commit', today: base, dueW: 4, c: -7 });
  act('lna', 'lnm2', 'Map framework to question bank', { c: -8 });
  act('lna', 'lnm3', 'Book internal review slot', { state: 'waiting', c: -7 });
  act('lna', 'lnm1', 'Finalize competency levels', { doneOff: -6, c: -12 });
  act('lna', 'lnm2', 'Write prototype brief', { doneOff: -7, c: -11 });
  return { projects: P, milestones: M, actions: A, settings: { name: 'Rio' } };
}
/*SEED-END*/

/* ================= state & storage ================= */
const S = { projects: {}, milestones: {}, actions: {}, settings: { name: 'Rio' } };
const UI = { view: 'now', projectId: null, ready: false, filter: 'all', zoom: 9, expanded: {}, lastProject: null, hzScroll: null, dragging: false, deferred: false, confirmKey: null, comp: { over: {}, confirm: false }, armed: null, colDone: {}, phOpen: {}, cmp: {}, brief: {}, dexBusy: false, drawer: null, runId: null, enh: {}, enhancing: {}, enhSteps: {}, skillSel: {} };
const LS_KEY = 'bearing.v1';
const KINDS = ['projects', 'milestones', 'actions'];
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };

const Store = {
  mode: 'loading', root: null, dirty: new Set(), saveT: 0, settingsT: 0,
  async boot() {
    if (!NATIVE) return this.useLocal();
    this.mode = 'native';
    try {
      const info = await nat('info'); this.root = info.root; Render.home = info.home;
      const st = await nat('readText', { path: this.root + '/.crewdex/settings.json' }).catch(() => null);
      if (st) { try { S.settings = Object.assign({ name: 'Rio' }, JSON.parse(st)); } catch (e) { } }
      applyTheme(S.settings.theme || lsGet('bearing.theme'));
      const list = await nat('listProjects');
      list.forEach(({ dir, text }) => {
        try {
          const d = JSON.parse(text); const p = Object.assign({}, d.project, { dir });
          S.projects[p.id] = p;
          (d.milestones || []).forEach(m => S.milestones[m.id] = m);
          (d.actions || []).forEach(x => S.actions[x.id] = x);
        } catch (e) { console.warn('Could not read', dir, e); }
      });
    } catch (e) { console.error(e); toast('Crewdex could not read its folder.', { sub: e.message }); }
    migrateModel().forEach(id => this.dirty.add(id)); if (this.dirty.size) { clearTimeout(this.saveT); this.saveT = setTimeout(() => this.flush(), 800); }
    UI.ready = true; renderNow({ entering: true });
    Codex.boot();
    projects().forEach(p => Runs.loadProject(p.id));
  },
  useLocal() {
    if (this.mode === 'local') return;
    this.mode = 'local';
    let data = null;
    try { data = JSON.parse(lsGet(LS_KEY) || 'null'); } catch (e) { data = null; }
    if (!data || !data.projects) { data = exampleSeed(todayISO()); data.example = true; }
    S.projects = data.projects || {}; S.milestones = data.milestones || {}; S.actions = data.actions || {};
    S.settings = Object.assign({ name: 'Rio' }, data.settings || {}); S.example = !!data.example;
    migrateModel();
    UI.ready = true; renderNow({ entering: true });
  },
  saveLocal() {
    clearTimeout(this.saveT);
    this.saveT = setTimeout(() => lsSet(LS_KEY, JSON.stringify({ projects: S.projects, milestones: S.milestones, actions: S.actions, settings: S.settings, example: !!S.example })), 200);
  },
  write(kind, id, val, old) {
    if (this.mode === 'local') return this.saveLocal();
    if (this.mode !== 'native') return;
    if (kind === 'settings') { clearTimeout(this.settingsT); this.settingsT = setTimeout(() => nat('writeText', { path: this.root + '/.crewdex/settings.json', text: JSON.stringify(S.settings, null, 2) }), 200); return; }
    const doc = val || old; if (!doc) return;
    const pid = kind === 'projects' ? doc.id : doc.projectId;
    if (pid) this.dirty.add(pid);
    if (old && val && old.projectId && val.projectId && old.projectId !== val.projectId) this.dirty.add(old.projectId);
    clearTimeout(this.saveT); this.saveT = setTimeout(() => this.flush(), 300);
  },
  async flush() {
    const ids = [...this.dirty]; this.dirty.clear();
    for (const pid of ids) {
      const p = S.projects[pid]; if (!p || !p.dir) continue;
      const { dir, ...project } = p;
      const body = { version: 1, project, milestones: msOf(pid), actions: Object.values(S.actions).filter(a => a.projectId === pid).sort(byOrder) };
      try { await nat('writeText', { path: dir + '/.crewdex/project.json', text: JSON.stringify(body, null, 2) }); await nat('mkdir', { path: dir + '/artifacts' }); syncAgents(p); }
      catch (e) { toast(`Could not save ${p.name}.`, { sub: e.message }); }
    }
  }
};
function projectDirFor(name) {
  const used = new Set(Object.values(S.projects).map(p => p.dir));
  const base = `${Store.root}/${slugify(name)}`; let d = base, i = 2;
  while (used.has(d)) d = `${base}-${i++}`;
  return d;
}
function reportDbError(e) {
  const code = e && e.code;
  if (code === 'quota_exceeded') toast('Storage is full, so this change was not saved. Delete a few old actions and try again.');
  else if (code === 'invalid_argument') toast('This change could not be saved. Only the owner of this page can edit it.');
  else if (code === 'revoked') toast('Access to your saved data was removed. Reload the page.');
  else toast('A change could not be saved. Check your connection and try again.');
  console.warn('[db write]', e);
}

/* ---- transactions with undo ---- */
let TX = null;
function tx(label, fn, opts = {}) {
  const t = { prev: new Map() };
  TX = t;
  try { fn(); } finally { TX = null; }
  scheduleRender();
  if (label) toast(label, Object.assign({ undo: () => undoTx(t) }, opts));
  return t;
}
function put(kind, doc) {
  if (kind === 'projects') ensurePhases(doc);
  const key = kind + '/' + doc.id;
  if (TX && !TX.prev.has(key)) TX.prev.set(key, S[kind][doc.id] ? clone(S[kind][doc.id]) : null);
  const old = S[kind][doc.id];
  S[kind][doc.id] = doc;
  Store.write(kind, doc.id, doc, old);
}
function patch(kind, id, fields) { const cur = S[kind][id]; if (!cur) return; put(kind, Object.assign({}, cur, fields, { updatedAt: nowTs() })); }
function del(kind, id) {
  const key = kind + '/' + id;
  if (!S[kind][id]) return;
  const old = S[kind][id];
  if (TX && !TX.prev.has(key)) TX.prev.set(key, clone(old));
  delete S[kind][id];
  Store.write(kind, id, null, old);
}
function undoTx(t) {
  for (const [key, prev] of t.prev) {
    const [kind, id] = key.split('/');
    const cur = S[kind][id]; if (prev) { S[kind][id] = prev; Store.write(kind, id, prev, cur); } else { delete S[kind][id]; Store.write(kind, id, null, cur); }
  }
  scheduleRender(); toast('Undone');
}
function saveSettings(fields) { S.settings = Object.assign({}, S.settings, fields); Store.write('settings', 'profile', S.settings); }

/* ================= derived data ================= */
const TONES = ['cobalt', 'terracotta', 'sage', 'sand', 'burgundy', 'graphite'];
const STATES = { later: 'Later', waiting: 'Waiting', someday: 'Someday', idea: 'Idea' };
const WINDOW = 21;
const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.createdAt).localeCompare(String(b.createdAt));
const byDate = (a, b) => a.date.localeCompare(b.date);
const isHeld = p => p.status === 'On hold';
/* Phases: `p.phases` holds the names, `p.phaseMeta` the matching { id, start, end }. Task groups (stored as
   milestones) point at a phase by id; tasks point at a group, or straight at a phase. */
function ensurePhases(p) {
  let ch = false;
  if (!Array.isArray(p.phases) || !p.phases.length) { p.phases = ['Phase 1']; ch = true; }
  if (!Array.isArray(p.phaseMeta) || p.phaseMeta.length !== p.phases.length) { const old = p.phaseMeta || []; p.phaseMeta = p.phases.map((_, i) => old[i] || { id: 'ph' + Math.random().toString(36).slice(2, 9), start: null, end: null }); ch = true; }
  const ph = Math.max(0, Math.min(p.phases.length - 1, p.phase || 0)); if (ph !== p.phase) { p.phase = ph; ch = true; }
  return ch;
}
const phaseList = p => p.phases.map((name, i) => Object.assign({ name, i }, p.phaseMeta[i]));
const phaseIdx = (p, id) => { const i = (p.phaseMeta || []).findIndex(x => x.id === id); return i < 0 ? p.phase : i; };
const phaseOfTask = (p, a) => { const m = a.milestoneId && S.milestones[a.milestoneId]; return m ? phaseIdx(p, m.phaseId) : phaseIdx(p, a.phaseId); };
/** Brings older data up to the phase → task group → task shape. Returns ids of projects that changed. */
function migrateModel() {
  const changed = new Set();
  Object.values(S.projects).forEach(p => { if (ensurePhases(p)) changed.add(p.id); });
  Object.values(S.milestones).forEach(m => { const p = S.projects[m.projectId]; if (!p) return; if (!m.phaseId || !p.phaseMeta.some(x => x.id === m.phaseId)) { m.phaseId = p.phaseMeta[m.done ? Math.max(0, p.phase - 1) : p.phase].id; changed.add(p.id); } });
  return [...changed];
}
const openCount = pid => { let n = 0; for (const a of Object.values(S.actions)) if (a.projectId === pid && !a.done) n++; return n; };
const projects = () => { const list = Object.values(S.projects).filter(p => p.status !== 'Archived' && !isHeld(p)); if (S.settings.manualOrder) return list.sort(byOrder); const c = {}; list.forEach(p => c[p.id] = openCount(p.id)); return list.sort((a, b) => c[b.id] - c[a.id] || byOrder(a, b)); };
/** When a task starts and ends. Start falls back to the day it was written; the end may be open. */
const taskStart = a => a.start || dayOfTs(a.createdAt) || todayISO();
const taskEnd = a => a.done ? (dayOfTs(a.doneAt) || a.due || taskStart(a)) : (a.due || null);
const heldProjects = () => Object.values(S.projects).filter(isHeld).sort(byOrder);
const allProjects = () => Object.values(S.projects).filter(p => p.status !== 'Archived').sort(byOrder);
const msOf = pid => Object.values(S.milestones).filter(m => m.projectId === pid).sort(byDate);
const actsOf = pid => Object.values(S.actions).filter(a => a.projectId === pid);
const nextMs = pid => msOf(pid).find(m => !m.done) || null;
const liveAction = a => { const p = S.projects[a.projectId]; return p && p.status !== 'Archived' && !isHeld(p); };
const pc = p => `--pc:var(--${p && TONES.includes(p.color) ? p.color : 'graphite'})`;
function bucketLabel(a) { return a.bucket === 'backlog' ? `Backlog · ${STATES[a.state] || 'Later'}` : a.bucket === 'room' ? "If there's room" : 'This week'; }
function weekList(bucket) {
  const W = planWeek();
  return Object.values(S.actions).filter(a => liveAction(a) && a.bucket === bucket && (a.done ? a.week === W : (!a.week || a.week <= W))).sort(byOrder);
}
const commitOpen = () => weekList('commit').filter(a => !a.done);
function todayList() {
  const t = todayISO();
  return Object.values(S.actions).filter(a => liveAction(a) && a.today && a.today <= t && (!a.done || dayOfTs(a.doneAt) === t)).sort((a, b) => (a.done - b.done) || byOrder(a, b));
}
function outsideWindow(a, date) {
  return false;
  if (!a.milestoneId || !a.due || a.done) return false;
  const m = S.milestones[a.milestoneId]; if (!m) return false;
  const d = date || m.date;
  return a.due > d || a.due < addDays(d, -WINDOW);
}
function depsOutside(mid, date) { return Object.values(S.actions).filter(a => a.milestoneId === mid && !a.done && a.due && (a.due > date || a.due < addDays(date, -WINDOW))); }
function phaseFrac(p) {
  const m = nextMs(p.id); if (!m) return 0;
  const as = actsOf(p.id).filter(a => a.milestoneId === m.id);
  return as.length ? as.filter(a => a.done).length / as.length : 0;
}
function momentum(p) {
  const t = todayISO(); let last = p.updatedAt || p.createdAt || null;
  const bump = ts => { if (ts && (!last || ts > last)) last = ts; };
  const as = actsOf(p.id);
  as.forEach(a => { bump(a.createdAt); bump(a.updatedAt); bump(a.doneAt); });
  msOf(p.id).forEach(m => { bump(m.createdAt); bump(m.updatedAt); });
  const days = last ? Math.max(0, diffDays(t, dayOfTs(last))) : 99;
  const done14 = as.filter(a => a.done && a.doneAt && diffDays(t, dayOfTs(a.doneAt)) <= 14).length;
  const key = days >= 12 ? 'stalled' : days >= 6 ? 'slowing' : (done14 >= 3 && days <= 3) ? 'strong' : 'steady';
  const label = { strong: 'Strong', steady: 'Steady', slowing: 'Slowing', stalled: 'Stalled' }[key];
  const note = key === 'strong' ? `${done14} moved in 14 days` : key === 'steady' ? (days === 0 ? 'touched today' : `touched ${days === 1 ? 'yesterday' : days + ' days ago'}`) : key === 'slowing' ? `last move ${days} days ago` : `quiet for ${days} days`;
  return { key, label, days, done14, note };
}
const moHtml = (p, withNote = true) => { const m = momentum(p); return `<span class="mo mo-${m.key}" style="${pc(p)}" title="Momentum: ${m.label}, ${m.note}">${moFace(m.key)}${m.label}${withNote ? `<span class="mo-note">${esc(m.note)}</span>` : ''}</span>`; };

/* ================= natural language ================= */
const STOP = new Set('the a an and or for to of in on at with by from into this that next new ke untuk dan yang di dari week'.split(' '));
const tokens = s => (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length >= 3 && !STOP.has(w)).map(w => w.slice(0, 5));
const overlap = (a, b) => { const B = new Set(b); return a.filter(x => B.has(x)).length; };
const GENERIC = new Set(['paper', 'platform', 'project', 'the', 'app', 'and']);
function projAliases(p) { const n = p.name.toLowerCase().trim(); const al = [n]; n.split(/\s+/).forEach(w => { if (w.length >= 3 && !GENERIC.has(w)) al.push(w); }); return [...new Set(al)]; }
function findProject(text, includeArchived) {
  let best = null; const low = ' ' + text.toLowerCase() + ' ';
  const pool = includeArchived ? Object.values(S.projects) : projects();
  for (const p of pool) for (const al of projAliases(p)) {
    const re = new RegExp(`(^|[^a-z0-9])${escRe(al)}(?=$|[^a-z0-9])`, 'i');
    if (re.test(low) && (!best || al.length > best.alias.length)) best = { p, alias: al };
  }
  return best;
}
const MON_RE = "(jan(?:uary|uari)?|feb(?:ruary|ruari)?|mar(?:ch|et)?|apr(?:il)?|may|mei|june?|juni|july?|juli|aug(?:ust)?|agu(?:stus)?|sept?(?:ember)?|oct(?:ober)?|okt(?:ober)?|nov(?:ember)?|dec(?:ember)?|des(?:ember)?)";
const MONO_RE = "(jan(?:uary|uari)?|feb(?:ruary|ruari)?|march|maret|apr(?:il)?|mei|june|juni|july|juli|aug(?:ust)?|agustus|sept?(?:ember)?|oct(?:ober)?|okt(?:ober)?|nov(?:ember)?|dec(?:ember)?|des(?:ember)?)";
const DOW_RE = "(monday|mon|tuesday|tues|tue|wednesday|wed|thursday|thurs|thur|thu|friday|fri|saturday|sat|sunday|sun|senin|selasa|rabu|kamis|jum'?at|sabtu|ahad)";
const PRE = "(?:\\b(?:on|by|due|before|until|pada|tgl|tanggal|sebelum|hari)\\s+)?";
function monIdx(s) { s = s.toLowerCase(); const map = [['jan'], ['feb'], ['mar'], ['apr'], ['may', 'mei'], ['jun'], ['jul'], ['aug', 'agu'], ['sep'], ['oct', 'okt'], ['nov'], ['dec', 'des']]; return map.findIndex(arr => arr.some(p => s.startsWith(p))); }
function dowIdx(s) { s = s.toLowerCase(); const t = [[/^(sun|ahad)/, 0], [/^(mon|senin)/, 1], [/^(tue|selasa)/, 2], [/^(wed|rabu)/, 3], [/^(thu|kamis)/, 4], [/^(fri|jum)/, 5], [/^(sat|sabtu)/, 6]]; for (const [re, i] of t) if (re.test(s)) return i; return -1; }
function mkDate(day, mon, notBefore) {
  const t = fromISO(todayISO()); let y = t.getFullYear();
  let d = iso(new Date(y, mon, Math.min(day, daysIn(y, mon))));
  if (d < (notBefore || addDays(todayISO(), -45))) d = iso(new Date(y + 1, mon, Math.min(day, daysIn(y + 1, mon))));
  return d;
}
function extractDate(text) {
  const t = todayISO();
  const tries = [
    [new RegExp(PRE + "\\b(today|tonight|hari ini)\\b", 'i'), () => ({ date: t, today: true })],
    [new RegExp(PRE + "\\b(day after tomorrow|lusa)\\b", 'i'), () => ({ date: addDays(t, 2) })],
    [new RegExp(PRE + "\\b(tomorrow|tmrw|besok)\\b", 'i'), () => ({ date: addDays(t, 1) })],
    [/\b(next week|minggu depan|pekan depan)\b/i, () => ({ date: addDays(planWeek(), 7) })],
    [/\b(?:in|dalam)\s+(\d{1,3})\s+(days?|weeks?|hari|minggu|pekan)\b/i, m => ({ date: addDays(t, +m[1] * (/^(w|minggu|pekan)/i.test(m[2]) ? 7 : 1)) })],
    [new RegExp(PRE + "\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+" + MON_RE + "\\b", 'i'), m => ({ date: mkDate(+m[1], monIdx(m[2])) })],
    [new RegExp(PRE + "\\b" + MON_RE + "\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b", 'i'), m => ({ date: mkDate(+m[2], monIdx(m[1])) })],
    [new RegExp(PRE + "\\b(next\\s+)?" + DOW_RE + "\\b", 'i'), m => { const want = dowIdx(m[2]); let d = t; for (let i = 0; i < 7 && dow(d) !== want; i++) d = addDays(d, 1); if (m[1]) d = addDays(d, 7); return { date: d }; }],
    [new RegExp("(?:\\b(?:in|to|into|ke|bulan|by)\\s+)?\\b" + MONO_RE + "\\b", 'i'), m => ({ month: monIdx(m[1]) })],
  ];
  for (const [re, fn] of tries) {
    const m = re.exec(text);
    if (m) { const r = fn(m); if (r && (r.date || r.month != null)) { r.rest = text.slice(0, m.index) + ' ' + text.slice(m.index + m[0].length); r.match = m[0].trim(); return r; } }
  }
  return null;
}
function resolveDate(text, keepFrom) {
  const r = extractDate(' ' + text + ' ');
  if (!r) return null;
  if (r.date) return r.date;
  const day = keepFrom ? fromISO(keepFrom).getDate() : 1;
  return mkDate(day, r.month, todayISO());
}
function pickMilestone(pid, title, due) {
  const ms = msOf(pid).filter(m => !m.done); if (!ms.length) return null;
  const tk = tokens(title); let best = null, bs = 0;
  ms.forEach(m => { const s = overlap(tk, tokens(m.title)); if (s > bs) { bs = s; best = m; } });
  if (best) return best;
  if (due) { const m = ms.find(m => m.date >= due); if (m) return m; }
  return ms[0];
}
function parseAdd(raw, def = {}) {
  let text = ' ' + raw.trim() + ' ';
  const r = { bucket: def.bucket || null, state: def.state || null, today: !!def.today, due: null, projectId: def.projectId || null, milestoneId: def.milestoneId || null, guessed: false };
  const take = (re, fn) => { const m = re.exec(text); if (m) { fn(m); text = text.slice(0, m.index) + ' ' + text.slice(m.index + m[0].length); return true; } return false; };
  take(/\b(?:to|in|into|on|for|ke)?\s*(?:the\s+)?(?:if there'?s room|if room|kalau sempat)\b/i, () => { r.bucket = 'room'; });
  take(/\b(?:to|in|into|as|ke)?\s*(?:the\s+)?(someday|suatu hari)\b/i, () => { r.bucket = 'backlog'; r.state = 'someday'; });
  take(/\b(?:as|to)\s+(?:an?\s+)?ideas?\b/i, () => { r.bucket = 'backlog'; r.state = 'idea'; });
  take(/\b(?:as|to|in)\s+waiting\b/i, () => { r.bucket = 'backlog'; r.state = 'waiting'; });
  take(/\b(?:to|in|into|ke)?\s*(?:the\s+)?backlog\b/i, () => { r.bucket = 'backlog'; r.state = r.state || 'later'; });
  take(/\b(?:for\s+)?later\b/i, () => { r.bucket = 'backlog'; r.state = r.state || 'later'; });
  take(/\b(?:for\s+|to\s+)?(this week|minggu ini|pekan ini)\b/i, () => { r.bucket = 'commit'; });
  if (/\bwaiting (on|for)\b|\bmenunggu\b/i.test(text)) { if (!r.bucket) r.bucket = 'backlog'; if (r.bucket === 'backlog') r.state = 'waiting'; }
  const fp = findProject(text);
  if (fp) { r.projectId = fp.p.id; r.guessed = false; text = text.replace(new RegExp(`(?:\\b(?:for|to|in|into|on|at|ke|untuk|di)\\s+)?(?:the\\s+)?${escRe(fp.alias)}(?:'s)?(?:\\s+(?:project|proyek))?(?=$|[^a-z0-9])`, 'i'), ' '); }
  const dt = extractDate(text);
  if (dt) { text = dt.rest; r.due = dt.date || mkDate(1, dt.month, todayISO()); if (dt.today) r.today = true; }
  let title = text.replace(/\s+/g, ' ').trim();
  for (let i = 0; i < 3; i++) title = title.replace(/^(?:to|for|and|on|by|in|the|ke|untuk|di)\s+/i, '').replace(/\s+(?:to|for|and|on|by|in|at|the|ke|untuk|di|pada)$/i, '').trim();
  title = title.replace(/[,;:\-–—]+$/, '').trim();
  r.title = title ? title[0].toUpperCase() + title.slice(1) : '';
  if (!r.projectId) { const lp = UI.lastProject && S.projects[UI.lastProject] && S.projects[UI.lastProject].status !== 'Archived' ? UI.lastProject : (projects()[0] || {}).id; r.projectId = lp || null; r.guessed = true; }
  if (!r.bucket) { const E = addDays(planWeek(), 6); r.bucket = (!r.due || r.due <= E) ? 'commit' : 'backlog'; }
  if (r.today && r.bucket === 'backlog') r.bucket = 'commit';
  if (r.bucket === 'backlog' && !r.state) r.state = 'later';
  r.milestoneId = null;
  return r;
}
function findMilestone(text) {
  const fp = findProject(text);
  let pool = Object.values(S.milestones).filter(m => S.projects[m.projectId] && S.projects[m.projectId].status !== 'Archived');
  let rest = text.toLowerCase();
  if (fp) { pool = pool.filter(m => m.projectId === fp.p.id); rest = rest.replace(fp.alias, ' '); }
  const tk = tokens(rest); let best = null, bs = 0;
  pool.forEach(m => { const mt = tokens(m.title); const o = overlap(tk, mt); const s = o ? o / Math.sqrt(mt.length) - (m.done ? .3 : 0) : 0; if (s > bs) { bs = s; best = m; } });
  if (!best && fp && !tokens(rest).length) best = nextMs(fp.p.id);
  return best;
}
function searchActions(q, limit = 8) {
  const tk = tokens(q), low = q.toLowerCase().trim();
  if (!low) return [];
  return Object.values(S.actions).filter(liveAction).map(a => {
    const t = a.title.toLowerCase(); let s = overlap(tk, tokens(a.title)) * 2;
    if (t.includes(low)) s += 3; if (a.done) s -= 1.5;
    return { a, s };
  }).filter(x => x.s > 0.5).sort((x, y) => y.s - x.s).slice(0, limit).map(x => x.a);
}

/* ================= mutations ================= */
function createAction(spec) {
  const id = uid('a');
  const W = planWeek();
  const doc = { id, start: spec.start || todayISO(), projectId: spec.projectId, milestoneId: spec.milestoneId || null, phaseId: spec.phaseId || null, title: spec.title, bucket: spec.bucket || 'commit', state: spec.bucket === 'backlog' ? (spec.state || 'later') : (spec.state || null), week: spec.bucket === 'backlog' ? null : W, due: spec.due || null, today: spec.today ? todayISO() : null, done: false, doneAt: null, order: Date.now() / 1000, createdAt: nowTs(), updatedAt: nowTs() };
  put('actions', doc);
  UI.lastProject = spec.projectId;
  return doc;
}
function addFromSpec(spec, where) {
  if (!spec.title) return null;
  if (!spec.projectId) { toast('Create a project first, then add actions to it.'); return null; }
  let doc;
  const t = tx(null, () => { doc = createAction(spec); });
  const p = S.projects[spec.projectId];
  toast(`Added to ${spec.bucket === 'backlog' ? 'Backlog' : spec.bucket === 'room' ? "If there's room" : 'This week'} · ${p ? p.name : ''}`, { undo: () => undoTx(t) });
  return doc;
}
function setBucket(a, bucket, state) {
  const f = { bucket };
  if (bucket === 'backlog') { f.state = state || a.state || 'later'; f.today = null; }
  else { f.week = planWeek(); }
  patch('actions', a.id, f);
}
function toggleDone(a) {
  if (a.done) patch('actions', a.id, { done: false, doneAt: null });
  else { const f = { done: true, doneAt: nowTs() }; if (a.bucket !== 'backlog') f.week = planWeek(); patch('actions', a.id, f); }
}
function moveMilestone(mid, date) {
  const m = S.milestones[mid]; if (!m || !date || m.date === date) return;
  const old = m.date, delta = diffDays(date, old);
  const out = depsOutside(mid, date);
  const t = tx(null, () => patch('milestones', mid, { date }));
  const msg = `${m.title} moved ${fmt(old)} → ${fmt(date)}`;
  if (out.length) {
    const n = out.length, pl = n > 1;
    toast(msg, {
      sub: `${n} dependent action${pl ? 's are' : ' is'} now outside the expected window.`, duration: 16000, undo: () => undoTx(t),
      actions: [{ label: `Shift ${pl ? 'them' : 'it'} ${delta > 0 ? '+' : ''}${delta}d`, run: () => tx(`Shifted ${n} action${pl ? 's' : ''} by ${Math.abs(delta)} days`, () => out.forEach(a => patch('actions', a.id, { due: addDays(a.due, delta) }))) }, { label: 'Keep dates', run: () => { } }]
    });
  } else toast(msg, { undo: () => undoTx(t) });
}
function createProject(name) {
  const used = new Set(projects().map(p => p.color));
  const color = TONES.find(c => !used.has(c)) || TONES[projects().length % TONES.length];
  const id = uid('p');
  const order = Math.max(0, ...Object.values(S.projects).map(p => p.order || 0)) + 1;
  tx(null, () => put('projects', { id, dir: Store.mode === 'native' ? projectDirFor(name) : undefined, name, kind: 'Project', status: 'Active', color, order, thesis: '', focus: '', phases: ['Explore', 'Build', 'Validate', 'Launch'], phase: 0, createdAt: nowTs(), updatedAt: nowTs() }));
  return id;
}
function createMilestone(pid, title, date, phaseId) {
  const id = uid('m'); const p = S.projects[pid];
  const ph = p.phaseMeta.find(x => x.id === phaseId) || p.phaseMeta[p.phase];
  if (!date) date = ph.end || addDays(todayISO(), 14);
  const t = tx(null, () => put('milestones', { id, projectId: pid, phaseId: ph.id, title, date, done: false, doneAt: null, createdAt: nowTs(), updatedAt: nowTs() }));
  toast(`Task group added · target ${fmt(date)}.`, { undo: () => undoTx(t), duration: 3500 });
  return id;
}

/* ================= rendering ================= */
let rq = 0;
function scheduleRender() { if (rq) return; rq = requestAnimationFrame(() => { rq = 0; renderNow(); }); }
function isEditing() { const el = document.activeElement; return !!(el && el.isContentEditable && VIEW.contains(el)); }
let FLIP_OVERRIDE = null;
function renderNow(opts = {}) {
  if (UI.dragging || HZ.drag) { UI.deferred = true; return; }
  if (!opts.entering && isEditing()) { UI.deferred = true; return; }
  UI.deferred = false;
  const prev = new Map();
  if (!opts.entering && !RM.matches) $$('[data-k]', VIEW).forEach(el => prev.set(el.dataset.k, el.getBoundingClientRect()));
  if (FLIP_OVERRIDE) { for (const [k, r] of FLIP_OVERRIDE) prev.set(k, r); FLIP_OVERRIDE = null; }
  const ae = document.activeElement; let focus = null;
  if (ae && ae.id && VIEW.contains(ae) && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) focus = { id: ae.id, v: ae.value, s: ae.selectionStart, e: ae.selectionEnd };
  document.body.classList.toggle('focus-mode', UI.view === 'focus');
  document.body.classList.toggle('chat-mode', UI.view === 'run');
  let html;
  if (!UI.ready) html = vLoading();
  else if (UI.view === 'project') html = S.projects[UI.projectId] ? vProject(S.projects[UI.projectId]) : vNow();
  else if (UI.view === 'run') html = vRun();
  else if (UI.view === 'settings') html = vSettings();
  else if (UI.view === 'import') html = vImport();
  else if (UI.view === 'office') html = vOffice();
  else html = ({ now: vNow, week: vWeek, horizon: vHorizon, focus: vFocus }[UI.view] || vNow)();
  VIEW.innerHTML = html;
  VIEW.classList.toggle('entering', !!opts.entering);
  if (opts.entering) { clearTimeout(renderNow.t); renderNow.t = setTimeout(() => VIEW.classList.remove('entering'), 2200); }
  if (focus) { const el = document.getElementById(focus.id); if (el) { el.value = focus.v; el.focus({ preventScroll: true }); try { el.setSelectionRange(focus.s, focus.e); } catch (e) { } } }
  if (prev.size) flipPlay(prev);
  if (UI.view === 'horizon' && UI.ready) mountHorizon(!!opts.entering);
  if (UI.view === 'run' && UI.ready) RunView.after();
  if (UI.view === 'office' && UI.ready) Office.after();
  if (UI.view === 'project' && UI.ready && S.projects[UI.projectId]) ProjectCodex.after(S.projects[UI.projectId]);
  if (UI.drawer) Drawer.render();
  updateNav();
}
function flipPlay(prev) {
  $$('[data-k]', VIEW).forEach(el => {
    const r0 = prev.get(el.dataset.k);
    if (!r0) { el.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' }); return; }
    const r1 = el.getBoundingClientRect();
    const dx = r0.left - r1.left, dy = r0.top - r1.top;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 560, easing: 'cubic-bezier(.2,.9,.25,1)' });
  });
}
function updateNav() {
  const key = ['project', 'run', 'import'].includes(UI.view) ? 'now' : UI.view;
  const links = $$('#nav a'); let on = null;
  links.forEach(a => { const isOn = a.dataset.nav === key; a.classList.toggle('on', isOn); if (isOn) on = a; });
  const ind = $('#nav-ind');
  if (on && ind) { ind.style.width = on.offsetWidth + 'px'; ind.style.transform = `translateX(${on.offsetLeft}px)`; ind.style.opacity = 1; } else if (ind) ind.style.opacity = 0;
}

/* ---- shared fragments ---- */
const CHK = '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8.6"/><path d="M6.3 10.3l2.5 2.5 4.9-5.3"/></svg>';
const SUN = '<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.8" stroke="currentColor" stroke-width="1.3"/><path d="M8 1.8v1.4M8 12.8v1.4M1.8 8h1.4M12.8 8h1.4M3.6 3.6l1 1M11.4 11.4l1 1M3.6 12.4l1-1M11.4 4.6l1-1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
const DOTS = '<svg viewBox="0 0 16 16"><circle cx="3.5" cy="8" r="1.3" fill="currentColor"/><circle cx="8" cy="8" r="1.3" fill="currentColor"/><circle cx="12.5" cy="8" r="1.3" fill="currentColor"/></svg>';
const ARROW = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ARROW_L = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13 8H3M7 4 3 8l4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function actRow(a, o = {}) {
  const p = S.projects[a.projectId], m = a.milestoneId && S.milestones[a.milestoneId];
  const meta = [];
  if (o.project !== false && p) meta.push(`<span class="pm"><span class="pdot"></span>${esc(p.name)}</span>`);
  if (o.lite) { if (a.bucket === 'commit') meta.push('<span class="wk-tag">This week</span>'); else if (a.bucket === 'room') meta.push('<span class="wk-tag soft">If there\'s room</span>'); else if (a.state && a.state !== 'later') meta.push(`<span class="st ${a.state === 'waiting' ? 'st-waiting' : ''}">${STATES[a.state]}</span>`); }
  if (o.bucket) meta.push(a.bucket === 'backlog' ? `<span class="st ${a.state === 'waiting' ? 'st-waiting' : ''}">${STATES[a.state] || 'Later'}</span>` : esc(bucketLabel(a)));
  if (o.state && a.bucket === 'backlog' && a.state) meta.push(`<span class="st ${a.state === 'waiting' ? 'st-waiting' : ''}">${STATES[a.state]}</span>`);
  if (a.due && !a.done) meta.push(outsideWindow(a) ? `<span class="warnx" title="Outside the expected window of its milestone">${relDay(a.due)} · outside window</span>` : relDay(a.due));
  if (!a.done && a.bucket !== 'backlog' && a.week && a.week < planWeek()) meta.push('<span class="tag-carried">carried over</span>');
  if (!a.done && a.today && a.today < todayISO() && o.carriedToday) meta.push(`<span class="tag-carried">from ${DOWL[dow(a.today)]}</span>`);
  const lr = (a.runs || [])[0]; const lrun = lr && (Runs.map.get(lr.id) || lr);
  if (lrun && ['starting', 'running', 'waiting'].includes(lrun.status)) meta.unshift(`<span class="cx-live ${lrun.status}">${lrun.status === 'waiting' ? 'Codex needs you' : 'Codex is working'}</span>`);
  else if (lrun && o.project !== false && lrun.status === 'completed') meta.push(`<span class="cx-done">Codex ran ${ago(lrun.endedAt || lrun.at)}</span>`);
  if (!a.done && (a.who === 'codex' || a.who === 'together') && !(lrun && ['starting', 'running', 'waiting'].includes(lrun.status))) meta.push(`<span class="who who-${a.who}" title="${esc(a.whoReason || '')}">${ic('spark')}${a.who === 'codex' ? 'Codex can do this' : 'Codex can draft'}</span>`);
  const onToday = a.today === todayISO();
  return `<div class="act ${a.done ? 'is-done' : ''} ${o.cls || ''}" data-k="a-${a.id}" data-id="${a.id}" style="${pc(p)}${o.i != null ? ';--i:' + o.i : ''}" ${o.drag ? 'data-drag="1"' : ''}>
    <button class="chk" data-act="toggle" data-id="${a.id}" aria-label="${a.done ? 'Mark as not done' : 'Complete'}">${CHK}</button>
    <div class="act-body"><span class="act-title" data-act="task" data-id="${a.id}">${esc(a.title)}</span>${meta.length ? `<div class="act-meta">${meta.join('<i>·</i>')}</div>` : ''}</div>
    ${o.ask && !a.done ? (lrun && ['starting', 'running', 'waiting'].includes(lrun.status) ? `<button class="askbtn live" data-act="open-run" data-id="${lrun.id}" title="Open the session">${ic('run')}Watch</button>` : `<button class="askbtn" data-act="run-task" data-id="${a.id}" title="Ask Codex to do this task">${ic('spark')}Ask Codex</button>`) : ''}
    ${o.tools === false ? '' : `<div class="act-tools">${a.done || o.ask ? '' : `<button class="ibtn cx" data-act="enhance" data-id="${a.id}" title="Break down with Codex" aria-label="Break down with Codex">${ic('spark')}</button>${a.who === 'codex' || a.who === 'together' ? `<button class="ibtn cx" data-act="run-task" data-id="${a.id}" title="Give to the agent" aria-label="Give to the agent">${ic('play')}</button>` : ''}`}<button class="ibtn" data-act="menu" data-id="${a.id}" aria-label="More">${DOTS}</button></div>`}
  </div>`;
}
/** Renders rows grouped under their project, in portfolio order. */
function byProjectGroups(list, row, o = {}) {
  const ids = [...new Set(list.map(a => a.projectId))];
  const ordered = [...projects().filter(p => ids.includes(p.id)), ...ids.map(id => S.projects[id]).filter(p => p && p.status === 'Archived')];
  return ordered.map((p, gi) => { const items = list.filter(a => a.projectId === p.id); return `<div class="pgroup ${o.compact ? 'compact' : ''} ${o.focus ? 'focus rise' : ''}" style="${pc(p)}${o.focus ? ';--i:' + (gi + 2) : ''}"><div class="pg-h">${avatar(p.name, p.color, o.focus ? 30 : 22)}<button class="pg-n" data-act="open" data-id="${p.id}">${esc(p.name)}</button><span class="pg-c mono">${items.length}</span>${o.compact ? '' : moFace(momentum(p).key)}</div><div class="pg-b">${items.map(row).join('')}</div></div>`; }).join('');
}
const inlineAdd = (id, scope, ph) => `<input class="inline-add" id="${id}" data-add="${esc(scope)}" placeholder="${esc(ph)}" autocomplete="off" spellcheck="false"><div class="ia-slot" data-for="${id}"></div>`;
function vLoading() {
  return `<div style="max-width:560px;display:grid;gap:16px;padding-top:20px"><div class="skel" style="width:60%;height:40px;border-radius:12px"></div><div class="skel" style="width:40%"></div><div style="height:40px"></div>${[1, 2, 3].map(() => '<div class="skel" style="width:100%;height:10px"></div>').join('')}</div>`;
}

/* ---- NOW ---- */
function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
function vNow() {
  const ps = projects(), held = heldProjects();
  const name = S.settings.name || 'Rio';
  const hello = `<h1 class="greet rise" style="--i:0">${greeting()}, <em data-edit="settings.profile.name" data-ph="you">${esc(name)}</em></h1>`;
  const heldHtml = held.length ? `<section class="held rise" style="--i:4"><div class="sec-h"><span class="eyebrow">On hold</span><span class="sec-c">Parked. They stay out of Week, Horizon and the Office until you bring them back.</span></div><div class="held-list">${held.map(p => `<div class="held-row">${avatar(p.name, 'graphite', 28)}<button class="held-n" data-act="open" data-id="${p.id}">${esc(p.name)}</button><span class="c-dim">${actsOf(p.id).filter(a => !a.done).length} open task${actsOf(p.id).filter(a => !a.done).length === 1 ? '' : 's'}${p.heldAt ? ' · since ' + fmt(dayOfTs(p.heldAt)) : ''}</span><button class="tbtn" data-act="proj-resume" data-id="${p.id}">Prioritize</button></div>`).join('')}</div></section>` : '';
  const newProj = `<label class="newproj rise" style="--i:3" for="np-input"><span style="font-family:var(--f-display);font-size:22px;color:var(--fg-3)">+</span><input id="np-input" data-newproj="1" placeholder="New project" autocomplete="off"></label>`;
  if (!ps.length && !held.length) {
    return `<section class="hero"><div>${hello}<p class="sum rise" style="--i:1">Nothing on the map yet. Let's fix that.</p></div></section>
    <div class="welcome rise" style="--i:2">
      <div class="wl-card wl-main">${mascot('wave', 112)}<div><h2>Bring in what you're already doing</h2><p>Dex looks through your past Codex sessions and suggests the projects hiding in them, with their history and memory. The tasks stay yours to write.</p><button class="tbtn primary big" data-nav="import">${ic('search')}Look through my Codex sessions</button></div></div>
      <div class="wl-card"><div><h2>Or start fresh</h2><p>Name one thing you're building, then add its tasks.</p><div class="newproj" style="border:0;padding:0"><input id="np-input" data-newproj="1" placeholder="Name your first project…" autocomplete="off"></div></div></div>
    </div>${footer()}`;
  }
  const openAll = ps.reduce((n, p) => n + actsOf(p.id).filter(a => !a.done).length, 0);
  const col = (p, i) => {
    const all = actsOf(p.id);
    const open = all.filter(a => !a.done).sort(byOrder);
    const done = all.filter(a => a.done).sort((a, b) => String(b.doneAt).localeCompare(String(a.doneAt)));
    const showDone = !!UI.colDone[p.id];
    return `<section class="pcol rise" style="--i:${i + 2};${pc(p)}" data-k="col-${p.id}">
      <header class="pcol-h" data-coldrag="${p.id}">${avatar(p.name, p.color, 30)}<button class="pcol-n" data-act="open" data-id="${p.id}" title="Open ${esc(p.name)}">${esc(p.name)}</button><span class="pcol-c mono">${open.length}</span>
        <span class="pcol-tools"><span class="pcol-grip" title="Drag to reorder">⠿</span><button class="pcol-hold" data-act="proj-hold" data-id="${p.id}" title="Park this project for later">Hold</button></span></header>
      <input class="inline-add pcol-add" id="ia-col-${p.id}" data-add="project=${p.id};auto=1" placeholder="+ Add a task" autocomplete="off"><div class="ia-slot" data-for="ia-col-${p.id}"></div>
      <div class="pcol-b pcol-open" data-zone="col:${p.id}">${open.map(a => actRow(a, { project: false, ms: false, lite: true, drag: true, ask: true })).join('') || '<div class="z-empty">No open tasks. Add the next one above.</div>'}</div>
      ${done.length ? `<button class="pcol-done" data-act="col-done" data-id="${p.id}">${showDone ? 'Hide' : 'Show'} ${done.length} done</button>${showDone ? `<div class="pcol-b">${done.slice(0, 12).map(a => actRow(a, { project: false, ms: false })).join('')}</div>` : ''}` : ''}
    </section>`;
  };
  return `
  <section class="hero now-hero"><div>${hello}
      <p class="sum rise" style="--i:1"><b>${ps.length}</b> project${ps.length === 1 ? '' : 's'} in focus${held.length ? ` · ${held.length} on hold` : ''} · <b>${openAll}</b> open task${openAll === 1 ? '' : 's'}</p></div></section>
  ${ps.length ? `<div class="pcols">${ps.map(col).join('')}</div>` : '<div class="z-empty" style="padding:20px 0">Every project is on hold. Prioritize one below to work on it.</div>'}
  ${newProj}
  ${heldHtml}
  ${footer()}`;
}
function footer() {
  const mode = Store.mode === 'native' ? `Every project is a folder in ${esc(relTo(Store.root || ''))}` : S.example ? 'Example portfolio, saved in this browser only.' : 'Saved in this browser only.';
  return `<footer class="foot"><span>${mode}</span>${Store.mode === 'native' ? '<button data-act="reveal-root">Show in Finder</button><button data-nav="import">Import from Codex history</button>' : ''}${Store.mode === 'local' ? `<button data-act="reset-empty" class="${UI.armed === 'reset' ? 'arm' : ''}">${UI.armed === 'reset' ? 'Click again to clear everything' : 'Start empty'}</button>` : ''}<span style="margin-left:auto">⌘K command · N add</span></footer>`;
}

/* ---- PROJECT ---- */
function vProject(p) {
  const acts = actsOf(p.id); const archived = p.status === 'Archived';
  const open = acts.filter(a => !a.done);
  const week = open.filter(a => a.bucket !== 'backlog').sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999') || byOrder(a, b));
  const later = open.filter(a => a.bucket === 'backlog').sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999') || byOrder(a, b));
  const done = acts.filter(a => a.done).sort((a, b) => String(b.doneAt).localeCompare(String(a.doneAt)));
  const showDone = !!UI.colDone[p.id];
  return `<div class="pv" style="${pc(p)}">
    <button class="back rise" data-nav="now">${ARROW_L} All projects</button>
    <header>
      <div class="pv-meta rise" style="--i:1"><span><span data-edit="projects.${p.id}.kind" data-ph="Kind">${esc(p.kind || '')}</span> / ${isHeld(p) ? 'On hold' : esc(p.status || 'Active')}</span>${isHeld(p) ? `<button class="tbtn" data-act="proj-resume" data-id="${p.id}">Prioritize this project</button>` : moHtml(p)}<span class="mono">${done.length}/${acts.length} tasks done</span></div>
      <h1 class="pv-name" data-edit="projects.${p.id}.name" style="view-transition-name:pn-${p.id}">${esc(p.name)}</h1>
      <p class="pv-thesis rise" style="--i:2" data-edit="projects.${p.id}.thesis" data-ph="Write one sentence about where this is going.">${esc(p.thesis || '')}</p>
    </header>
    <section class="pv-sec ptasks">
      <div class="sec-h"><span class="eyebrow">Tasks</span><span class="sec-c">${open.length} open</span></div>
      <input class="inline-add ptask-add" id="ia-proj-${p.id}" data-add="project=${p.id};auto=1" placeholder="+ Add a task. Type a day to schedule it, e.g. “call the vendor friday”" autocomplete="off"><div class="ia-slot" data-for="ia-proj-${p.id}"></div>
      ${week.length ? `<div class="pt-h">This week</div>${week.map(a => actRow(a, { project: false, ms: false, lite: true })).join('')}` : ''}
      ${later.length ? `<div class="pt-h">Later</div>${later.map(a => actRow(a, { project: false, ms: false, lite: true })).join('')}` : ''}
      ${!open.length ? '<div class="z-empty">No open tasks yet.</div>' : ''}
      ${done.length ? `<button class="pcol-done" data-act="col-done" data-id="${p.id}">${showDone ? 'Hide' : 'Show'} ${done.length} done</button>${showDone ? done.slice(0, 40).map(a => actRow(a, { project: false, ms: false })).join('') : ''}` : ''}
    </section>
    ${ProjectCodex.html(p)}
    <section class="pv-sec">
      <div class="sec-h"><span class="eyebrow">Identity</span></div>
      <div class="ident">
        <div><span class="fact-l">Tone</span><div class="swatches">${TONES.map(c => `<button class="sw ${p.color === c ? 'on' : ''}" style="--c:var(--${c})" data-act="color" data-c="${c}" aria-label="${c}"></button>`).join('')}</div></div>
        <div><span class="fact-l">Attention</span><div class="seg seg-sm">${archived ? '' : `<button class="${!isHeld(p) ? 'on' : ''}" data-act="proj-resume" data-id="${p.id}">Prioritized</button><button class="${isHeld(p) ? 'on' : ''}" data-act="proj-hold" data-id="${p.id}">On hold</button>`}</div></div>
        <div><span class="fact-l">Status</span><div>${archived ? `<button class="dangerbtn" data-act="restore">Restore project</button>` : `<button class="dangerbtn ${UI.armed === 'archive' ? 'arm' : ''}" data-act="archive">${UI.armed === 'archive' ? 'Click again to archive' : 'Archive project'}</button>`}</div></div>
      </div>
    </section>
  </div>`;
}

/* ---- WEEK ---- */
function vWeek() {
  const W = planWeek(), E = addDays(W, 6);
  const commit = weekList('commit'), room = weekList('room');
  const cOpen = commit.filter(a => !a.done), cDone = commit.filter(a => a.done);
  const rOpen = room.filter(a => !a.done), rDone = room.filter(a => a.done);
  const crowded = cOpen.length > 7;
  const planningAhead = W > todayISO();
  const ticks = []; for (let i = 0; i < Math.max(7, cOpen.length); i++) ticks.push(`<i class="${i < cOpen.length ? (i >= 7 ? 'x' : 'f') : ''}"></i>`);
  const backlog = Object.values(S.actions).filter(a => liveAction(a) && a.bucket === 'backlog' && !a.done);
  const counts = { all: backlog.length }; Object.keys(STATES).forEach(s => counts[s] = backlog.filter(a => (a.state || 'later') === s).length);
  const f = UI.filter; const shown = backlog.filter(a => f === 'all' || (a.state || 'later') === f);
  const groups = projects().map(p => ({ p, list: shown.filter(a => a.projectId === p.id).sort(byOrder) })).filter(g => g.list.length || f === 'all');
  const sm1 = fromISO(W).getMonth() === fromISO(E).getMonth();
  return `<div class="wk">
    <header class="wk-h">
      <div><div class="eyebrow rise">Week ${isoWeekNo(W)}${planningAhead ? ' · planning ahead' : ''}</div>
      <h1 class="wk-title rise" style="--i:1">${fmt(W)} <i>—</i> ${sm1 ? fromISO(E).getDate() : fmt(E)}</h1>
      <p class="wk-sub rise" style="--i:2">${cOpen.length} committed · ${rOpen.length} if there's room · ${cDone.length + rDone.length} done</p></div>
      <p class="wk-sub rise" style="--i:3;max-width:34ch;color:var(--fg-3)">Drag actions between lists. Commit only what you mean to finish by Sunday.</p>
    </header>
    <div class="bench">
      <section class="zone z-commit ${crowded ? 'crowded' : ''} rise" style="--i:3" data-zone="commit">
        <div class="z-h"><h2>Commit</h2><span class="z-sub">What you want finished this week</span><div class="meter" title="Most weeks hold 5 to 7 commitments">${ticks.join('')}<span>${cOpen.length}/7</span></div></div>
        ${crowded ? `<p class="crowd">Your week is getting crowded. <span>${cOpen.length} commitments. Moving one to If there's room keeps the rest honest.</span></p>` : ''}
        <div class="z-list">${byProjectGroups(cOpen, a => actRow(a, { drag: true, project: false })) || '<div class="z-empty">Drag something here, or add it below.</div>'}</div>
        ${inlineAdd('ia-commit', 'bucket=commit', '+ Add a commitment')}
        ${cDone.length ? `<div class="z-done"><div class="z-done-h">Done · ${cDone.length}</div>${byProjectGroups(cDone, a => actRow(a, { drag: false, project: false }), { compact: true })}</div>` : ''}
      </section>
      <section class="zone z-room rise" style="--i:4" data-zone="room">
        <div class="z-h"><h2>If there's room</h2><span class="z-sub">Good to do, not a promise</span></div>
        <div class="z-list">${byProjectGroups(rOpen, a => actRow(a, { drag: true, project: false })) || '<div class="z-empty">Nothing here. That is fine.</div>'}</div>
        ${inlineAdd('ia-room', 'bucket=room', "+ Add if there's room")}
        ${rDone.length ? `<div class="z-done"><div class="z-done-h">Done · ${rDone.length}</div>${byProjectGroups(rDone, a => actRow(a, { project: false }), { compact: true })}</div>` : ''}
      </section>
    </div>
    <section class="reservoir rise" style="--i:5" data-zone="backlog">
      <div class="z-h"><h2>Backlog</h2><span class="z-sub">A reservoir, grouped by project. Pull from it when the week has space.</span>
        <div class="filters">${['all', ...Object.keys(STATES)].map(s => `<button class="${f === s ? 'on' : ''}" data-act="filter" data-f="${s}">${s === 'all' ? 'All' : STATES[s]}<span>${counts[s]}</span></button>`).join('')}</div></div>
      <div class="resgrid">${groups.map(g => `<div class="resg" style="${pc(g.p)}"><div class="resg-h"><span class="pdot"></span><span>${esc(g.p.name)}</span><span>${g.list.length}</span></div>
        ${g.list.map(a => actRow(a, { project: false, drag: true, state: f === 'all' })).join('')}
        ${inlineAdd('ia-bl-' + g.p.id, `project=${g.p.id};bucket=backlog;state=${f === 'all' ? 'later' : f}`, '+ Add to backlog')}</div>`).join('')}</div>
    </section>
  </div>`;
}

/* ---- HORIZON ---- */
const HZ = { rows: [], raf: 0, drag: null, range: null, ppd: 9, pendingRender: false };
const LINE_Y = 128, ROW_H = 206, PADL = 24;
function hzRange() {
  const t = todayISO();
  const live = Object.values(S.actions).filter(a => liveAction(a) && !a.done);
  const starts = live.map(taskStart).sort(), ends = live.map(a => a.due).filter(Boolean).sort();
  let lo = addDays(t, -21); if (starts.length && starts[0] < lo) lo = starts[0] < addDays(t, -75) ? addDays(t, -75) : addDays(starts[0], -5);
  let hi = addDays(t, 100); if (ends.length && addDays(ends[ends.length - 1], 21) > hi) hi = addDays(ends[ends.length - 1], 21);
  const s0 = lo.slice(0, 8) + '01';
  const hd = fromISO(hi); const e = iso(new Date(hd.getFullYear(), hd.getMonth() + 1, 0));
  return { start: s0, end: e, days: diffDays(e, s0) + 1 };
}
const xOf = d => PADL + diffDays(d, HZ.range.start) * HZ.ppd;
const dateAtX = x => addDays(HZ.range.start, Math.round((x - PADL) / HZ.ppd));
const OPEN_TAIL = 12; // days an open-ended task fades out past today
/** Bars for one project, packed into lanes so nothing overlaps. */
function hzBars(p) {
  const t = todayISO(), R = HZ.range;
  const items = actsOf(p.id).filter(a => !a.done).map(a => {
    let s0 = taskStart(a); const e = taskEnd(a); const open = !a.done && !a.due;
    if (e && s0 > e) s0 = e;
    const s1 = s0 < R.start ? R.start : s0;
    const eVis = open ? addDays(s1 > t ? s1 : t, OPEN_TAIL) : e;
    const x0 = xOf(s1), x1 = Math.max(x0 + 14, xOf(addDays(eVis, 1)));
    const label = a.title.length > 34 ? a.title.slice(0, 33).trimEnd() + '…' : a.title;
    const lw = label.length * 6.9 + 16; const inside = (x1 - x0) >= lw + 12;
    return { a, s0, e, open, x0, x1, label, inside, right: inside ? x1 : x1 + lw + 6, late: !a.done && a.due && a.due < t, cut: s0 < R.start };
  }).sort((u, v) => u.x0 - v.x0 || v.x1 - u.x1);
  const lanes = [];
  items.forEach(it => { let i = lanes.findIndex(r => it.x0 > r + 10); if (i < 0) { i = lanes.length; lanes.push(0); } lanes[i] = it.right; it.lane = i; });
  return { items, lanes: Math.max(1, lanes.length) };
}
function vHorizon() {
  HZ.ppd = UI.zoom; HZ.range = hzRange();
  const R = HZ.range, width = PADL * 2 + R.days * HZ.ppd, t = todayISO();
  const months = []; let d = R.start;
  while (d <= R.end) { const dd = fromISO(d); months.push(`<span style="left:${xOf(d)}px">${MON[dd.getMonth()].toUpperCase()}${dd.getMonth() === 0 || d === R.start ? ' ' + dd.getFullYear() : ''}</span>`); d = iso(new Date(dd.getFullYear(), dd.getMonth() + 1, 1)); }
  let fm = R.start; while (dow(fm) !== 1) fm = addDays(fm, 1);
  const ps = projects(); const LANE = 34, TOP = 58;
  const rows = ps.map(p => {
    const { items, lanes } = hzBars(p); const h = TOP + lanes * LANE + 14;
    const bars = items.map(it => { const a = it.a; const y = TOP + it.lane * LANE; const w = it.x1 - it.x0;
      const tip = `${a.title} · ${fmt(it.s0)} → ${a.done ? 'done ' + fmt(it.e) : it.e ? fmt(it.e) : 'no end date'}`;
      return `<div class="tbar ${it.open ? 'open' : ''} ${a.done ? 'done' : ''} ${it.late ? 'late' : ''} ${it.cut ? 'cut' : ''}" data-aid="${a.id}" style="left:${it.x0}px;top:${y}px;width:${w}px" title="${esc(tip)}"><i class="tb-e tb-s" data-edge="start"></i>${it.inside ? `<span class="tb-t">${esc(it.label)}</span>` : ''}<i class="tb-e tb-n" data-edge="end" title="${it.open ? 'Drag to set an end date' : 'Drag to change the end date'}"></i></div>${it.inside ? '' : `<span class="tb-out ${a.done ? 'done' : ''}" data-aid="${a.id}" style="left:${it.x1 + 7}px;top:${y}px">${esc(it.label)}</span>`}`;
    }).join('');
    return `<div class="hz-row" data-pid="${p.id}" style="${pc(p)};height:${h}px"><div class="hz-label"><div class="hz-name" data-act="open" data-id="${p.id}">${esc(p.name)}</div>${moHtml(p, false)}</div>${bars || `<span class="tb-none" style="left:${xOf(t) + 14}px;top:${TOP}px">No tasks on the timeline. Double-click to add one here.</span>`}</div>`;
  }).join('');
  const zl = { 5: 'Quarter', 9: 'Months', 16: 'Weeks' };
  const last = fromISO(addDays(t, 100));
  return `<div class="hz">
    <header class="hz-h"><div><div class="eyebrow rise">Horizon</div><h1 class="rise" style="--i:1">${MON[fromISO(t).getMonth()]} <span style="color:var(--fg-3);font-weight:300">—</span> ${MON[last.getMonth()]}</h1><p class="rise" style="--i:2">Every task runs from its start to its end. No end date yet? The bar fades out. Drag a bar to move it, drag its right edge to set the end, double-click a row to add a task.</p></div>
      <div class="seg rise" style="--i:3">${[5, 9, 16].map(z => `<button class="${UI.zoom === z ? 'on' : ''}" data-act="zoom" data-z="${z}">${zl[z]}</button>`).join('')}</div></header>
    <div class="hz-scroll rise" style="--i:3" id="hz-scroll"><div class="hz-inner" style="width:${width}px">
      <div class="hz-months">${months.join('')}</div>
      <div class="hz-rows" style="background-image:repeating-linear-gradient(to right,var(--line) 0 1px,transparent 1px ${7 * HZ.ppd}px);background-position:${xOf(fm)}px 0">${rows || '<div class="z-empty" style="padding:30px">No projects in focus.</div>'}</div>
      <div class="hz-today" style="left:${xOf(t)}px;top:34px"><span>Today</span></div>
    </div></div>
    <div class="hz-legend"><span><i class="lg-bar"></i>Start to end</span><span><i class="lg-bar open"></i>No end date yet</span><span><i class="lg-bar late"></i>Past its end date</span></div>
  </div>`;
}
function mountHorizon(entering) {
  const sc = $('#hz-scroll'); if (!sc) return;
  if (entering || UI.hzScroll == null) sc.scrollLeft = Math.max(0, xOf(todayISO()) - sc.clientWidth * 0.32);
  else sc.scrollLeft = UI.hzScroll;
  sc.onscroll = () => { UI.hzScroll = sc.scrollLeft; };
}
/* dragging a bar: body moves the task, edges change its start or end */
let TB = null;
document.addEventListener('pointerdown', e => {
  const bar = e.target.closest && e.target.closest('.tbar'); if (!bar || e.button !== 0) return;
  const a = S.actions[bar.dataset.aid]; if (!a) return;
  e.preventDefault();
  const edge = e.target.dataset.edge || (a.done ? null : 'move');
  TB = { bar, a, edge, sx: e.clientX, left: parseFloat(bar.style.left), width: parseFloat(bar.style.width), moved: false, s0: taskStart(a), due: a.due || null, dd: 0 };
  try { bar.setPointerCapture(e.pointerId); } catch (err) { }
}, true);
document.addEventListener('pointermove', e => {
  if (!TB) return;
  const dx = e.clientX - TB.sx; if (!TB.moved && Math.abs(dx) < 4) return;
  if (!TB.edge) return;
  TB.moved = true; UI.dragging = true; TB.bar.classList.add('grab');
  const dd = Math.round(dx / HZ.ppd); TB.dd = dd; const px = dd * HZ.ppd;
  if (TB.edge === 'move') TB.bar.style.left = (TB.left + px) + 'px';
  else if (TB.edge === 'start') { const w = Math.max(14, TB.width - px); TB.bar.style.left = (TB.left + TB.width - w) + 'px'; TB.bar.style.width = w + 'px'; }
  else { TB.bar.style.width = Math.max(14, TB.width + px) + 'px'; TB.bar.classList.remove('open'); }
  const ns = TB.edge === 'end' ? TB.s0 : addDays(TB.s0, dd);
  const ne = TB.edge === 'start' ? TB.due : TB.edge === 'end' ? dateAtX(TB.left + Math.max(14, TB.width + px) - HZ.ppd) : (TB.due ? addDays(TB.due, dd) : null);
  TB.ns = ns; TB.ne = ne;
  TB.bar.title = `${fmt(ns)} → ${ne ? fmt(ne) : 'no end date'}`;
  let tip = document.getElementById('tb-tip'); if (!tip) { tip = document.createElement('div'); tip.id = 'tb-tip'; tip.className = 'tb-tip'; document.body.appendChild(tip); }
  tip.textContent = `${fmt(ns)} → ${ne ? fmt(ne) : 'open'}`; tip.style.left = e.clientX + 12 + 'px'; tip.style.top = e.clientY - 34 + 'px';
});
function tbEnd(cancel) {
  if (!TB) return; const d = TB; TB = null; UI.dragging = false; d.bar.classList.remove('grab');
  const tip = document.getElementById('tb-tip'); if (tip) tip.remove();
  if (!d.moved) { Drawer.open(d.a.id); return; }
  suppressClick = true; setTimeout(() => { suppressClick = false; }, 50);
  if (cancel || !d.dd && d.edge !== 'end') { renderNow(); return; }
  const a = S.actions[d.a.id]; let ns = d.ns, ne = d.ne;
  if (ne && ns > ne) { if (d.edge === 'start') ns = ne; else ne = ns; }
  const f = { start: ns, due: ne };
  const W = planWeek(), E = addDays(W, 6);
  if (ne && ne >= W && ne <= E && a.bucket === 'backlog') { f.bucket = 'commit'; f.week = W; }
  tx(`${short(a.title, 36)}: ${fmt(ns)} → ${ne ? fmt(ne) : 'no end date'}`, () => patch('actions', a.id, f), { duration: 4500 });
  renderNow();
}
document.addEventListener('pointerup', () => tbEnd(false));
document.addEventListener('pointercancel', () => tbEnd(true));

/* ---- FOCUS ---- */
function vFocus() {
  const list = todayList();
  const done = list.filter(a => a.done).length;
  const d = fromISO(todayISO());
  const sug = list.length < 3 ? commitOpen().filter(a => a.today !== todayISO()).sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999')).slice(0, 4) : [];
  return `<div class="fv"><div class="fv-amb"></div>
    <div class="fv-top"><span class="fv-date rise">${DOWL[d.getDay()]}, ${MONL[d.getMonth()]} ${d.getDate()}</span><button class="tbtn" data-nav="now">Leave focus <kbd>Esc</kbd></button></div>
    <h1 class="fv-title rise" style="--i:1">Today</h1>
    ${list.length && done === list.length ? '<p class="fv-done-msg rise">Everything for today is done. Close the laptop, or pull one more from the week.</p>' : ''}
    <div class="fv-list">${byProjectGroups(list, a => actRow(a, { focus: true, project: false, ms: true, tools: false, carriedToday: true }), { focus: true }) || '<p class="fv-done-msg rise" style="--i:2">Nothing planned for today yet.</p>'}</div>
    ${list.length ? `<div class="fv-prog rise" style="--i:${list.length + 2}"><div class="fv-bar"><i style="width:${done / list.length * 100}%"></i></div><span class="fv-count"><b>${done}</b> / ${list.length} completed</span></div>` : ''}
    ${inlineAdd('ia-today', 'today=1;bucket=commit', '+ Add something for today')}
    ${sug.length ? `<div class="fv-sug rise" style="--i:${list.length + 3}"><div class="eyebrow" style="margin-bottom:8px">From this week</div>${sug.map(a => actRow(a, { ms: false })).join('')}</div>` : ''}
  </div>`;
}

/* ================= interactions ================= */
function navigate(view, pid) {
  const token = view === 'project' ? 'p-' + pid : view === 'run' ? 'run-' + pid : view;
  try { if (location.hash.slice(1) !== token) history.pushState(null, '', '#' + token); } catch (e) { }
  if (view === 'run') { const r = Runs.map.get(pid); if (r) return Runs.hydrate(r).then(() => go({ view, runId: pid, projectId: null })); }
  go({ view, projectId: view === 'project' ? pid : null, runId: view === 'run' ? pid : null });
}
function go(next) {
  closeMenu();
  next.runId = next.runId || null;
  const changed = next.view !== UI.view || next.projectId !== UI.projectId || next.runId !== UI.runId;
  if (!changed) { renderNow(); return; }
  if (next.view === 'project') UI.lastProject = next.projectId;
  if (next.view !== 'horizon') UI.hzScroll = null;
  UI.armed = null;
  const run = () => { Object.assign(UI, next); renderNow({ entering: true }); window.scrollTo(0, 0); };
  if (document.startViewTransition && !RM.matches && UI.ready) { try { document.startViewTransition(run); return; } catch (e) { } }
  run();
}
function route() {
  const h = location.hash.slice(1);
  if (h.startsWith('p-')) go({ view: 'project', projectId: h.slice(2) });
  else if (h.startsWith('run-')) { const r = Runs.map.get(h.slice(4)); if (r) Runs.hydrate(r).then(() => go({ view: 'run', runId: r.id, projectId: null })); else go({ view: 'now', projectId: null }); }
  else if (['now', 'week', 'horizon', 'office', 'settings', 'import'].includes(h)) go({ view: h, projectId: null });
  else go({ view: 'now', projectId: null });
}
window.addEventListener('popstate', route);

function completeWithMotion(a, el) {
  if (a.done || !el) { tx(null, () => toggleDone(a)); return; }
  el.classList.add('completing');
  setTimeout(() => {
    const t = tx(null, () => toggleDone(a));
    const left = UI.view === 'focus' ? todayList().filter(x => !x.done).length : null;
    toast(left === 0 ? 'That was the last one for today.' : `Done · ${a.title}`, { undo: () => undoTx(t), duration: 5000 });
  }, RM.matches ? 0 : 640);
}

let suppressClick = false;
document.addEventListener('click', e => {
  if (suppressClick) { suppressClick = false; e.preventDefault(); e.stopPropagation(); return; }
  const nav = e.target.closest('[data-nav]');
  if (nav) { e.preventDefault(); closePalette(); navigate(nav.dataset.nav); return; }
  const ed = e.target.closest('[data-edit]');
  if (ed && (VIEW.contains(ed) || $('#drawer').contains(ed)) && ed.contentEditable !== 'true') { startEdit(ed); e.preventDefault(); return; }
  const el = e.target.closest('[data-act]');
  if (!el) { if (!e.target.closest('#menu')) closeMenu(); return; }
  const act = el.dataset.act, id = el.dataset.id;
  const a = id && S.actions[id];
  if (CodexUI.act(act, el, e)) { e.preventDefault(); return; }
  if (act !== 'menu' && !e.target.closest('#menu')) closeMenu();
  switch (act) {
    case 'open': navigate('project', id); break;
    case 'toggle': if (a) completeWithMotion(a, el.closest('.act')); break;
    case 'today': if (a) { const on = a.today === todayISO(); tx(on ? 'Removed from today' : 'Planned for today', () => { const f = { today: on ? null : todayISO() }; if (!on && a.bucket === 'backlog') { f.bucket = 'commit'; f.week = planWeek(); } patch('actions', a.id, f); }, { duration: 3500 }); } break;
    case 'menu': openMenu(id, el); break;
    case 'composer': toggleComposer(); break;
    case 'palette': openPalette(); break;
    case 'pal-close': closePalette(); break;
    case 'theme': toggleTheme(); break;
    case 'filter': UI.filter = el.dataset.f; renderNow(); break;
    case 'zoom': { const sc = $('#hz-scroll'); const mid = sc ? dateAtX(sc.scrollLeft + sc.clientWidth / 2) : todayISO(); UI.zoom = +el.dataset.z; renderNow(); HZ.ppd = UI.zoom; const sc2 = $('#hz-scroll'); if (sc2) { sc2.scrollLeft = Math.max(0, xOf(mid) - sc2.clientWidth / 2); UI.hzScroll = sc2.scrollLeft; } break; }
    case 'phase': { const p = S.projects[UI.projectId]; const i = +el.dataset.i; if (p && i !== p.phase) { (UI.phOpen[p.id] = UI.phOpen[p.id] || {})[p.phaseMeta[i].id] = true; } if (p && i !== p.phase) tx(`Current phase: ${p.phases[i]}`, () => patch('projects', p.id, { phase: i })); break; }
    case 'color': { const p = S.projects[UI.projectId]; if (p) tx(null, () => patch('projects', p.id, { color: el.dataset.c })); break; }
    case 'archive': { const p = S.projects[UI.projectId]; if (!p) break; if (UI.armed !== 'archive') { UI.armed = 'archive'; renderNow(); setTimeout(() => { if (UI.armed === 'archive') { UI.armed = null; scheduleRender(); } }, 4000); break; } UI.armed = null; tx(`${p.name} archived`, () => patch('projects', p.id, { status: 'Archived' })); navigate('now'); break; }
    case 'restore': { const p = S.projects[UI.projectId]; if (p) tx(`${p.name} restored`, () => patch('projects', p.id, { status: 'Active' })); break; }
    case 'ms-toggle': { const m = S.milestones[id]; if (m) tx(m.done ? 'Milestone reopened' : `Milestone reached · ${m.title}`, () => patch('milestones', id, { done: !m.done, doneAt: m.done ? null : nowTs() })); break; }
    case 'ms-expand': { const p = UI.projectId; UI.expanded[p] = UI.expanded[p] || {}; UI.expanded[p][id] = !UI.expanded[p][id]; renderNow(); break; }
    case 'col-done': UI.colDone[id] = !UI.colDone[id]; renderNow(); break;
    case 'proj-move': { const ps = projects(); const i = ps.findIndex(x => x.id === id), j = i + (+el.dataset.d); if (i < 0 || j < 0 || j >= ps.length) break; tx(null, () => { ps.forEach((x, k) => { const want = k === i ? j : k === j ? i : k; if (x.order !== want + 1) patch('projects', x.id, { order: want + 1 }); }); }); break; }
    case 'ph-toggle': { const o = UI.phOpen[UI.projectId] = UI.phOpen[UI.projectId] || {}; o[id] = !o[id]; renderNow(); break; }
    case 'ph-jump': { const o = UI.phOpen[UI.projectId] = UI.phOpen[UI.projectId] || {}; o[id] = true; renderNow(); const el2 = document.getElementById('ph-' + id); if (el2) el2.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' }); break; }
    case 'ph-move': { const p = S.projects[UI.projectId]; const i = +el.dataset.i, j = i + (+el.dataset.d); if (!p || j < 0 || j >= p.phases.length) break; const names = p.phases.slice(), meta = p.phaseMeta.slice(); const curId = meta[p.phase].id; [names[i], names[j]] = [names[j], names[i]]; [meta[i], meta[j]] = [meta[j], meta[i]]; tx(null, () => patch('projects', p.id, { phases: names, phaseMeta: meta, phase: meta.findIndex(x => x.id === curId) })); break; }
    case 'ph-del': { const p = S.projects[UI.projectId]; const i = +el.dataset.i; if (!p || p.phases.length < 2) break; const pid2 = p.phaseMeta[i].id; if (UI.armed !== 'ph-' + pid2) { UI.armed = 'ph-' + pid2; renderNow(); setTimeout(() => { if (UI.armed === 'ph-' + pid2) { UI.armed = null; scheduleRender(); } }, 4000); break; } UI.armed = null; const to = p.phaseMeta[i > 0 ? i - 1 : 1].id; const curId = p.phaseMeta[p.phase].id; tx(`Phase “${p.phases[i]}” removed`, () => { msOf(p.id).filter(m => m.phaseId === pid2).forEach(m => patch('milestones', m.id, { phaseId: to })); actsOf(p.id).filter(a => a.phaseId === pid2).forEach(a => patch('actions', a.id, { phaseId: to })); const names = p.phases.filter((_, k) => k !== i), meta = p.phaseMeta.filter((_, k) => k !== i); patch('projects', p.id, { phases: names, phaseMeta: meta, phase: Math.max(0, meta.findIndex(x => x.id === (curId === pid2 ? to : curId))) }); }); break; }
    case 'ms-delete': { if (UI.armed !== 'ms-' + id) { UI.armed = 'ms-' + id; renderNow(); break; } UI.armed = null; const m = S.milestones[id]; tx(`Deleted group · ${m ? m.title : ''}`, () => { Object.values(S.actions).filter(x => x.milestoneId === id).forEach(x => patch('actions', x.id, { milestoneId: null, phaseId: m ? m.phaseId : null })); del('milestones', id); }); break; }
    case 'reset-empty': { if (UI.armed !== 'reset') { UI.armed = 'reset'; renderNow(); break; } UI.armed = null; S.projects = {}; S.milestones = {}; S.actions = {}; S.example = false; Store.saveLocal(); renderNow({ entering: true }); toast('Cleared. Name your first project to begin.'); break; }
  }
});
document.addEventListener('keydown', e => {
  const t = e.target;
  if (t && t.matches && t.matches('[data-edit][contenteditable="true"]')) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); t.blur(); }
    else if (e.key === 'Escape') { t.textContent = t.dataset.orig || ''; t.blur(); }
    return;
  }
  if (t && t.matches && t.matches('[data-add]')) { if (e.key === 'Enter') { e.preventDefault(); submitInline(t, e.shiftKey); } else if (e.key === 'Escape') t.blur(); return; }
  if (t && t.matches && t.matches('[data-newproj]') && e.key === 'Enter') { e.preventDefault(); const v = t.value.trim(); if (v) { t.value = ''; const id = createProject(v); navigate('project', id); } return; }
  if (t && t.matches && t.matches('[data-newms]') && e.key === 'Enter') {
    e.preventDefault(); const pid = t.dataset.newms; const raw = t.value.trim(); if (!raw) return;
    const dt = extractDate(' ' + raw + ' '); let date = dt ? (dt.date || mkDate(1, dt.month, todayISO())) : null;
    let title = dt ? dt.rest.replace(/\s+/g, ' ').trim() : raw; title = title.replace(/\s+(on|by|due|for)$/i, '').trim();
    if (!title) return; t.value = ''; createMilestone(pid, title[0].toUpperCase() + title.slice(1), date, t.dataset.phase); return;
  }
  if (t && t.matches && t.matches('[data-newphase]') && e.key === 'Enter') { e.preventDefault(); const p = S.projects[t.dataset.newphase]; const v = t.value.trim(); if (p && v) { t.value = ''; tx('Phase added', () => patch('projects', p.id, { phases: [...p.phases, v], phaseMeta: [...p.phaseMeta, { id: 'ph' + Math.random().toString(36).slice(2, 9), start: null, end: null }] })); } return; }
  if (t && t.id === 'qa') return;
  if (t && t.id === 'pal-q') return;
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#pal').hidden ? openPalette() : closePalette(); return; }
  if (e.key === 'Escape') { if (!$('#menu').hidden) return closeMenu(); if (UI.drawer) return Drawer.close(); if (!$('#runs-pop').hidden) { $('#runs-pop').hidden = true; return; } if ($('#composer').classList.contains('open')) return toggleComposer(false); if (UI.view === 'focus' || UI.view === 'project') return navigate('now'); }
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === 'n' || k === 'a') { e.preventDefault(); toggleComposer(true); }
  else if (k === '/') { e.preventDefault(); openPalette(); }
  else if (k === ',') navigate('settings');
  else if (k === '5' || k === 'o') navigate('office');
  else if (k === '1') navigate('now'); else if (k === '2') navigate('week'); else if (k === '3') navigate('horizon'); else if (k === '4') navigate('office');
  else if (e.key === 'Enter' && t && t.matches && t.matches('.track')) navigate('project', t.dataset.id);
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.matches('[data-msdate]') && t.value) moveMilestone(t.dataset.msdate, t.value);
  if (t.matches('[data-adate]')) { const [aid, f] = t.dataset.adate.split(':'); const a = S.actions[aid]; if (a) { const fl = { [f]: t.value || null }; if (f === 'start' && !t.value) fl.start = todayISO(); const s2 = f === 'start' ? fl.start : taskStart(a), e2 = f === 'due' ? fl.due : a.due; if (e2 && s2 > e2) { if (f === 'start') fl.due = s2; else fl.start = e2; } const W = planWeek(); if (f === 'due' && fl.due && fl.due >= W && fl.due <= addDays(W, 6) && a.bucket === 'backlog') { fl.bucket = 'commit'; fl.week = W; } tx(null, () => patch('actions', aid, fl)); setTimeout(() => Drawer.render(true), 0); } }
  if (t.matches('[data-grpphase]')) tx('Group moved', () => patch('milestones', t.dataset.grpphase, { phaseId: t.value }), { duration: 3000 });
  if (t.matches('[data-phdate]')) { const [pid, i, f] = t.dataset.phdate.split(':'); const p = S.projects[pid]; if (p) { const meta = p.phaseMeta.map((x, k) => k === +i ? Object.assign({}, x, { [f]: t.value || null }) : x); tx(null, () => patch('projects', pid, { phaseMeta: meta })); } }
});
document.addEventListener('focusout', e => {
  const t = e.target;
  if (t.matches && t.matches('[data-edit][contenteditable="true"]')) commitEdit(t);
});

function startEdit(el) {
  el.dataset.orig = el.textContent;
  el.contentEditable = 'true'; el.spellcheck = false; el.focus();
  const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
  const s = getSelection(); s.removeAllRanges(); s.addRange(r);
}
function commitEdit(el) {
  el.contentEditable = 'false';
  const v = el.textContent.replace(/\s+/g, ' ').trim();
  const [kind, id, field] = el.dataset.edit.split('.');
  if (kind === 'phase') { const p = S.projects[id]; if (p && v && v !== (el.dataset.orig || '').trim()) tx(null, () => patch('projects', id, { phases: p.phases.map((x, k) => k === +field ? v : x) })); scheduleRender(); return; }
  if (v !== (el.dataset.orig || '').trim()) {
    if (kind === 'settings') { if (v) saveSettings({ [field]: v }); }
    else if (field === 'phases') {
      const ph = v.split(/\s*(?:→|->|>|,|\/)\s*/).map(s => s.trim()).filter(Boolean);
      const p = S.projects[id]; if (ph.length && p) tx('Phases updated', () => patch(kind, id, { phases: ph, phase: Math.min(p.phase, ph.length - 1) }));
    }
    else if (v || field === 'thesis' || field === 'focus' || field === 'kind') tx(null, () => patch(kind, id, { [field]: v }));
  }
  if (UI.deferred) scheduleRender(); else scheduleRender();
}
function parseScope(s) { const o = {}; (s || '').split(';').forEach(kv => { const [k, v] = kv.split('='); if (k) o[k] = v; }); return o; }
function submitInline(el, shift) {
  const raw = el.value.trim(); if (!raw) return;
  const sc = parseScope(el.dataset.add);
  const def = { bucket: sc.bucket, state: sc.state, projectId: sc.project || (UI.view === 'project' ? UI.projectId : null), milestoneId: sc.ms || null, today: sc.today === '1' };
  const spec = parseAdd(raw, def);
  if (sc.phase) { spec.phaseId = sc.phase; if (!sc.ms) spec.milestoneId = null; }
  if (sc.auto === '1' && !/\b(this week|minggu ini|backlog|later|someday|if there'?s room)\b/i.test(raw)) { const inWeek = spec.due && spec.due <= addDays(planWeek(), 6); spec.bucket = inWeek || spec.today ? 'commit' : 'backlog'; if (spec.bucket === 'backlog') spec.state = spec.state || 'later'; }
  if (sc.ms && spec.projectId !== sc.project) spec.milestoneId = pickMilestone(spec.projectId, spec.title, spec.due)?.id || null;
  if (shift && spec.bucket === 'commit') spec.bucket = 'room';
  const slot = $(`.ia-slot[data-for="${el.id}"]`);
  const key = el.id + '|' + raw;
  if (sc.auto !== '1' && spec.bucket === 'commit' && commitOpen().length >= 7 && UI.confirmKey !== key && !shift) {
    UI.confirmKey = key;
    if (slot) slot.innerHTML = `<div class="ia-note">That would be commitment #${commitOpen().length + 1}. Press Enter again to commit anyway, or Shift+Enter for If there's room.</div>`;
    return;
  }
  UI.confirmKey = null; if (slot) slot.innerHTML = '';
  el.value = '';
  addFromSpec(spec);
}

/* ---- drag between week lists ---- */
let D = null;
document.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  const cap = e.target.closest('.cap');
  if (cap) return hzDown(e, cap);
  const row = e.target.closest('.act[data-drag]');
  if (!row || e.target.closest('button,input,[contenteditable="true"]')) return;
  D = { row, id: row.dataset.id, sx: e.clientX, sy: e.clientY, started: false, touch: e.pointerType === 'touch', t0: Date.now() };
  if (D.touch) D.timer = setTimeout(() => { if (D && !D.started) startDrag(e.clientX, e.clientY); }, 360);
});
function startDrag(x, y) {
  const r = D.row.getBoundingClientRect();
  D.started = true; D.ox = x - r.left; D.oy = y - r.top;
  const g = D.row.cloneNode(true); g.classList.add('ghost'); g.style.width = r.width + 'px'; g.style.left = r.left + 'px'; g.style.top = r.top + 'px';
  document.body.appendChild(g); D.ghost = g; D.r0 = r;
  g.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.02) rotate(-.6deg)' }], { duration: 200, fill: 'forwards', easing: 'cubic-bezier(.34,1.32,.52,1)' });
  D.row.classList.add('drag-src'); document.body.classList.add('dragging'); UI.dragging = true;
  closeMenu(); getSelection().removeAllRanges();
}
document.addEventListener('pointermove', e => {
  if (HZ.drag) return hzMove(e);
  if (!D) return;
  const dx = e.clientX - D.sx, dy = e.clientY - D.sy;
  if (!D.started) {
    if (D.touch) { if (Math.hypot(dx, dy) > 8) { clearTimeout(D.timer); D = null; } return; }
    if (Math.hypot(dx, dy) < 6) return;
    startDrag(D.sx, D.sy);
  }
  D.ghost.style.transform = `translate(${e.clientX - D.sx}px,${e.clientY - D.sy}px)`;
  D.ghost.getAnimations().forEach(a => a.cancel());
  D.ghost.style.transform += ' scale(1.02) rotate(-.6deg)';
  const under = document.elementFromPoint(e.clientX, e.clientY);
  const zone = under && under.closest('[data-zone]');
  $$('[data-zone]').forEach(z => z.classList.toggle('over', z === zone));
  D.zone = zone; D.before = null;
  const old = $('.ins'); if (old) old.remove();
  if (zone && zone.dataset.zone !== 'backlog') {
    const list = $('.z-list', zone) || zone; const rows = $$('.act', list).filter(r => r !== D.row);
    let before = null; for (const r of rows) { const b = r.getBoundingClientRect(); if (e.clientY < b.top + b.height / 2) { before = r; break; } }
    D.before = before;
    const lr = list.getBoundingClientRect();
    const ins = document.createElement('div'); ins.className = 'ins';
    const yy = before ? before.getBoundingClientRect().top - lr.top - 1 : (rows.length ? rows[rows.length - 1].getBoundingClientRect().bottom - lr.top + 1 : 8);
    ins.style.top = yy + 'px'; list.appendChild(ins);
  }
});
document.addEventListener('touchmove', e => { if ((D && D.started) || HZ.drag) e.preventDefault(); }, { passive: false });
function endDrag(e, cancel) {
  if (HZ.drag) return hzUp(e, cancel);
  if (!D) return;
  clearTimeout(D.timer);
  const d = D; D = null;
  if (!d.started) return;
  suppressClick = true; setTimeout(() => { suppressClick = false; }, 50);
  $$('[data-zone]').forEach(z => z.classList.remove('over')); const ins = $('.ins'); if (ins) ins.remove();
  document.body.classList.remove('dragging'); UI.dragging = false;
  const gr = d.ghost.getBoundingClientRect(); d.ghost.remove();
  const a = S.actions[d.id];
  if (cancel || !d.zone || !a) { d.row.classList.remove('drag-src'); renderNow(); return; }
  const zone = d.zone.dataset.zone;
  const f = {};
  if (zone.startsWith('col:')) {
    const pid = zone.slice(4);
    const list = actsOf(pid).filter(x => !x.done && x.id !== a.id).sort(byOrder);
    const bi = d.before ? list.findIndex(x => x.id === d.before.dataset.id) : -1;
    const prevO = bi > 0 ? list[bi - 1].order : (bi === 0 ? null : (list.length ? list[list.length - 1].order : null));
    const nextO = bi >= 0 ? list[bi].order : null;
    f.order = prevO == null && nextO == null ? Date.now() / 1000 : prevO == null ? nextO - 1 : nextO == null ? prevO + 1 : (prevO + nextO) / 2;
    const moved = a.projectId !== pid; if (moved) f.projectId = pid;
    FLIP_OVERRIDE = new Map([['a-' + a.id, gr]]);
    tx(moved ? `Moved to ${S.projects[pid].name}` : null, () => patch('actions', a.id, f), { duration: 4000 });
    renderNow(); return;
  }
  if (zone === 'backlog') { if (a.bucket !== 'backlog') { f.bucket = 'backlog'; f.today = null; } f.state = UI.filter !== 'all' ? UI.filter : (a.state || 'later'); }
  else {
    if (a.bucket !== zone) { f.bucket = zone; f.week = planWeek(); }
    const list = weekList(zone).filter(x => !x.done && x.id !== a.id);
    const bi = d.before ? list.findIndex(x => x.id === d.before.dataset.id) : -1;
    const prevO = bi > 0 ? list[bi - 1].order : (bi === 0 ? null : (list.length ? list[list.length - 1].order : null));
    const nextO = bi >= 0 ? list[bi].order : null;
    f.order = prevO == null && nextO == null ? Date.now() / 1000 : prevO == null ? nextO - 1 : nextO == null ? prevO + 1 : (prevO + nextO) / 2;
  }
  FLIP_OVERRIDE = new Map([['a-' + a.id, gr]]);
  const label = f.bucket ? (zone === 'commit' ? 'Committed for this week' : zone === 'room' ? "Moved to If there's room" : `Back to the backlog · ${STATES[f.state]}`) : (f.state && f.state !== a.state ? `Marked ${STATES[f.state]}` : null);
  tx(label, () => patch('actions', a.id, f), { duration: 4000 });
  if (zone === 'commit' && f.bucket && commitOpen().length > 7) setTimeout(() => toast('Your week is getting crowded.', { sub: `${commitOpen().length} commitments now. Weeks you finish usually hold 5 to 7.` }), 300);
  renderNow();
}
document.addEventListener('pointerup', e => endDrag(e, false));
document.addEventListener('pointercancel', e => endDrag(e, true));

/* ---- timeline drag ---- */
function hzDown(e, el) {
  const row = HZ.rows.find(r => r.row.contains(el)); if (!row) return;
  const cap = row.caps.find(c => c.el === el); if (!cap) return;
  e.preventDefault();
  try { el.setPointerCapture(e.pointerId); } catch (err) { }
  HZ.drag = { row, cap, sx: e.clientX, x0: cap.target, date: cap.date, date0: cap.date, moved: false };
  el.classList.add('grab'); hzKick();
}
function hzMove(e) {
  const d = HZ.drag; const dx = e.clientX - d.sx;
  if (!d.moved && Math.abs(dx) < 3) return;
  d.moved = true;
  const date = dateAtX(d.x0 + dx);
  if (date !== d.date) {
    d.date = date; d.cap.target = xOf(date);
    const delta = diffDays(date, d.date0);
    const cd = $('.cd', d.cap.el);
    if (cd) cd.innerHTML = `${fmt(date)} <b>${delta > 0 ? '+' : ''}${delta ? delta + 'd' : ''}</b>`;
  }
  hzKick();
}
function hzUp(e, cancel) {
  const d = HZ.drag; HZ.drag = null;
  d.cap.el.classList.remove('grab');
  if (!d.moved) { if (S.actions[d.cap.mid]) Drawer.open(d.cap.mid); return; }
  if (cancel || d.date === d.date0) { d.cap.target = xOf(d.date0); d.cap.date = d.date0; const cd = $('.cd', d.cap.el); if (cd) cd.textContent = fmt(d.date0); hzKick(); return; }
  d.cap.date = d.date;
  HZ.pendingRender = true;
  { const a = S.actions[d.cap.mid]; const old = a.due; tx(`${short(a.title, 40)} moved ${fmt(old)} → ${fmt(d.date)}`, () => { const f = { due: d.date }; if (a.bucket === 'backlog' && d.date <= addDays(planWeek(), 6) && d.date >= planWeek()) { f.bucket = 'commit'; f.week = planWeek(); } patch('actions', a.id, f); }); }
  hzKick();
}
document.addEventListener('dblclick', e => {
  const row = e.target.closest('.hz-row'); if (!row || e.target.closest('.tbar,.tb-out,.hz-name,.hz-new')) return;
  const inner = $('.hz-inner'); const x = e.clientX - inner.getBoundingClientRect().left;
  const date = dateAtX(x); const pid = row.dataset.pid;
  $$('.hz-new').forEach(n => n.remove());
  const inp = document.createElement('input'); inp.className = 'hz-new'; inp.placeholder = `Task starting ${fmt(date)}`;
  inp.style.left = Math.max(8, x - 10) + 'px'; inp.style.top = (row.offsetTop + 34 + e.clientY - row.getBoundingClientRect().top - 16) + 'px';
  inner.appendChild(inp); inp.focus();
  inp.addEventListener('keydown', ev => { if (ev.key === 'Enter' && inp.value.trim()) { const spec = parseAdd(inp.value.trim(), { projectId: pid, bucket: 'backlog' }); spec.projectId = pid; spec.start = date; if (spec.due && spec.due < date) spec.due = null; const W = planWeek(); if (spec.due && spec.due <= addDays(W, 6)) spec.bucket = 'commit'; inp.remove(); addFromSpec(spec); } else if (ev.key === 'Escape') inp.remove(); ev.stopPropagation(); });
  inp.addEventListener('blur', () => setTimeout(() => inp.remove(), 120));
});

function hzKick() { }
/* ---- drag project columns to reorder ---- */
let CD = null;
document.addEventListener('pointerdown', e => {
  const h = e.target.closest && e.target.closest('[data-coldrag]'); if (!h || e.button !== 0 || e.target.closest('input,.pcol-hold')) return;
  CD = { id: h.dataset.coldrag, col: h.closest('.pcol'), sx: e.clientX, sy: e.clientY, started: false };
});
document.addEventListener('pointermove', e => {
  if (!CD) return;
  if (!CD.started) {
    if (Math.hypot(e.clientX - CD.sx, e.clientY - CD.sy) < 7) return;
    const r = CD.col.getBoundingClientRect(); CD.started = true; UI.dragging = true;
    const g = CD.col.cloneNode(true); g.classList.add('col-ghost'); g.style.width = r.width + 'px'; g.style.height = Math.min(r.height, 420) + 'px'; g.style.left = r.left + 'px'; g.style.top = r.top + 'px';
    document.body.appendChild(g); CD.ghost = g; CD.col.classList.add('col-src'); document.body.classList.add('dragging');
    const ins = document.createElement('div'); ins.className = 'col-ins'; $('.pcols').appendChild(ins); CD.ins = ins;
  }
  CD.ghost.style.transform = `translate(${e.clientX - CD.sx}px,${e.clientY - CD.sy}px) rotate(1.5deg)`;
  const wrap = $('.pcols'); const wr = wrap.getBoundingClientRect();
  if (e.clientX > wr.right - 70) wrap.scrollLeft += 16; else if (e.clientX < wr.left + 70) wrap.scrollLeft -= 16;
  const cols = $$('.pcol', wrap).filter(c => c !== CD.col);
  let before = null; for (const c of cols) { const b = c.getBoundingClientRect(); if (e.clientX < b.left + b.width / 2) { before = c; break; } }
  CD.before = before ? before.dataset.k.slice(4) : null;
  const ref = before || cols[cols.length - 1];
  if (ref) { const b = ref.getBoundingClientRect(); CD.ins.style.left = ((before ? b.left - 8 : b.right + 6) - wr.left + wrap.scrollLeft) + 'px'; CD.ins.style.height = Math.min(b.height, 360) + 'px'; }
});
function colEnd(cancel) {
  if (!CD) return; const d = CD; CD = null; if (!d.started) return;
  suppressClick = true; setTimeout(() => { suppressClick = false; }, 60);
  const gr = d.ghost.getBoundingClientRect(); d.ghost.remove(); if (d.ins) d.ins.remove();
  d.col.classList.remove('col-src'); document.body.classList.remove('dragging'); UI.dragging = false;
  if (cancel) { renderNow(); return; }
  const ids = projects().map(p => p.id).filter(id => id !== d.id);
  const at = d.before ? ids.indexOf(d.before) : ids.length; ids.splice(at < 0 ? ids.length : at, 0, d.id);
  FLIP_OVERRIDE = new Map([['col-' + d.id, gr]]);
  tx(null, () => ids.forEach((id, k) => { if (S.projects[id].order !== k + 1) patch('projects', id, { order: k + 1 }); }));
  if (!S.settings.manualOrder) saveSettings({ manualOrder: true });
  renderNow();
}
document.addEventListener('pointerup', () => colEnd(false));
document.addEventListener('pointercancel', () => colEnd(true));

/* ---- action menu ---- */
function openMenu(id, anchor) {
  const a = S.actions[id]; if (!a) return;
  const menu = $('#menu');
  if (!menu.hidden && menu.dataset.id === id) return closeMenu();
  const onToday = a.today === todayISO();
  const ms = msOf(a.projectId).filter(m => !m.done || m.id === a.milestoneId).slice(0, 12);
  const it = (k, label, on, cls = '') => `<button data-m="${k}" class="${on ? 'on' : ''} ${cls}">${esc(label)}</button>`;
  menu.innerHTML = [
    '<div class="mh">Week</div>', it('b:commit', 'Commit this week', a.bucket === 'commit'), it('b:room', "If there's room", a.bucket === 'room'),
    '<div class="mh">Backlog</div>', ...Object.keys(STATES).map(s => it('s:' + s, STATES[s], a.bucket === 'backlog' && (a.state || 'later') === s)),
    '<hr>', it('del', 'Delete action', false, 'danger')
  ].join('');
  menu.dataset.id = id; menu.hidden = false;
  const r = anchor.getBoundingClientRect(), mw = menu.offsetWidth, mh = menu.offsetHeight;
  let left = Math.min(window.innerWidth - mw - 12, Math.max(12, r.right - mw)); let top = r.bottom + 6;
  if (top + mh > window.innerHeight - 12) top = Math.max(12, r.top - mh - 6);
  menu.style.left = left + 'px'; menu.style.top = top + 'px';
}
function closeMenu() { const m = $('#menu'); if (m && !m.hidden) { m.hidden = true; m.dataset.id = ''; } }
$('#menu').addEventListener('click', e => {
  const b = e.target.closest('[data-m]'); if (!b) return;
  e.stopPropagation();
  const a = S.actions[$('#menu').dataset.id]; closeMenu(); if (!a) return;
  const k = b.dataset.m;
  if (k === 'today') { const on = a.today === todayISO(); tx(on ? 'Removed from today' : 'Planned for today', () => { const f = { today: on ? null : todayISO() }; if (!on && a.bucket === 'backlog') { f.bucket = 'commit'; f.week = planWeek(); } patch('actions', a.id, f); }, { duration: 3500 }); }
  else if (k.startsWith('b:')) { const z = k.slice(2); tx(z === 'commit' ? 'Committed for this week' : "Moved to If there's room", () => setBucket(a, z), { duration: 3500 }); if (z === 'commit' && commitOpen().length > 7) toast('Your week is getting crowded.', { sub: `${commitOpen().length} commitments now. Weeks you finish usually hold 5 to 7.` }); }
  else if (k.startsWith('s:')) { const s = k.slice(2); tx(`Backlog · ${STATES[s]}`, () => setBucket(a, 'backlog', s), { duration: 3500 }); }
  else if (k.startsWith('m:')) { const mid = k.slice(2) || null; tx(null, () => patch('actions', a.id, { milestoneId: mid })); }
  else if (k === 'del') tx(`Deleted · ${a.title}`, () => del('actions', a.id));
});
window.addEventListener('resize', () => { closeMenu(); updateNav(); });
window.addEventListener('scroll', () => { $('#top').classList.toggle('scrolled', window.scrollY > 8); closeMenu(); }, { passive: true });

/* ---- composer (quick add) ---- */
function toggleComposer(force) {
  const c = $('#composer'); const open = force ?? !c.classList.contains('open');
  c.classList.toggle('open', open);
  if (open) { setTimeout(() => $('#qa').focus(), 60); renderChips(); }
  else { $('#qa').blur(); }
}
function compSpec() {
  const raw = $('#qa').value;
  const def = UI.view === 'project' ? { projectId: UI.projectId } : UI.view === 'focus' ? { today: true } : {};
  const spec = parseAdd(raw, def);
  const o = UI.comp.over;
  if (o.projectId) { spec.projectId = o.projectId; spec.guessed = false; spec.milestoneId = pickMilestone(o.projectId, spec.title, spec.due)?.id || null; }
  if (o.milestoneId !== undefined) spec.milestoneId = o.milestoneId;
  if (o.bucket) { spec.bucket = o.bucket.b; spec.state = o.bucket.s; }
  return spec;
}
const BUCKET_CYCLE = [{ b: 'commit', s: null }, { b: 'room', s: null }, { b: 'backlog', s: 'later' }, { b: 'backlog', s: 'waiting' }, { b: 'backlog', s: 'someday' }, { b: 'backlog', s: 'idea' }];
function renderChips() {
  const box = $('#qa-chips'); const raw = $('#qa').value.trim();
  if (!raw) { box.innerHTML = `<span class="comp-hint">Try “add competitor research to nusa persona backlog” or “fix methodology section lestari today”.</span>`; UI.comp.confirm = false; return; }
  const s = compSpec(); const p = S.projects[s.projectId]; const m = s.milestoneId && S.milestones[s.milestoneId];
  const bl = s.bucket === 'backlog' ? `Backlog · ${STATES[s.state || 'later']}` : s.bucket === 'room' ? "If there's room" : 'This week';
  const crowded = s.bucket === 'commit' && commitOpen().length >= 7;
  box.innerHTML = `
    <span class="chip"><b>Action</b>${esc(s.title || '…')}</span>
    ${p ? `<button class="chip ${s.guessed ? 'guess' : ''}" data-chip="project" style="${pc(p)}" title="Change project"><b>Project</b><span class="pdot"></span>${esc(p.name)}</button>` : '<span class="chip guess"><b>Project</b>none yet</span>'}

    <button class="chip" data-chip="bucket" title="Change list"><b>When</b>${bl}</button>
    ${s.due ? `<span class="chip"><b>Due</b>${fmtDow(s.due)}</span>` : ''}
    ${s.today ? `<span class="chip"><b>Plan</b>Today</span>` : ''}
    ${crowded ? `<span class="friction">Your week is getting crowded · this would be #${commitOpen().length + 1}.${UI.comp.confirm ? ' Press Enter again to commit it anyway.' : ''}</span>` : ''}`;
}
$('#qa').addEventListener('input', () => { if (!$('#qa').value.trim()) UI.comp.over = {}; UI.comp.confirm = false; renderChips(); });
$('#qa').addEventListener('keydown', e => {
  if (e.key === 'Escape') { e.preventDefault(); toggleComposer(false); return; }
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const s = compSpec(); if (!s.title) return;
  if (e.shiftKey && s.bucket === 'commit') s.bucket = 'room';
  if (s.bucket === 'commit' && commitOpen().length >= 7 && !UI.comp.confirm) { UI.comp.confirm = true; renderChips(); return; }
  addFromSpec(s);
  $('#qa').value = ''; UI.comp.over = {}; UI.comp.confirm = false; renderChips();
});
$('#qa-chips').addEventListener('click', e => {
  const c = e.target.closest('[data-chip]'); if (!c) return;
  const s = compSpec(); const ps = projects();
  if (c.dataset.chip === 'project' && ps.length) { const i = ps.findIndex(p => p.id === s.projectId); UI.comp.over = { ...UI.comp.over, projectId: ps[(i + 1) % ps.length].id }; delete UI.comp.over.milestoneId; }
  if (c.dataset.chip === 'ms') { const ms = [...msOf(s.projectId).filter(m => !m.done).map(m => m.id), null]; const i = ms.indexOf(s.milestoneId || null); UI.comp.over = { ...UI.comp.over, milestoneId: ms[(i + 1) % ms.length] }; }
  if (c.dataset.chip === 'bucket') { const i = BUCKET_CYCLE.findIndex(x => x.b === s.bucket && (x.b !== 'backlog' || x.s === (s.state || 'later'))); UI.comp.over = { ...UI.comp.over, bucket: BUCKET_CYCLE[(i + 1) % BUCKET_CYCLE.length] }; }
  renderChips(); $('#qa').focus();
});

/* ---- command palette ---- */
const PAL = { items: [], sel: 0, thinking: false, results: null };
function openPalette(q = '') { closeMenu(); const p = $('#pal'); p.hidden = false; const i = $('#pal-q'); i.value = q; PAL.results = null; buildPalette(); setTimeout(() => i.focus(), 20); }
function closePalette() { const p = $('#pal'); if (p) p.hidden = true; PAL.thinking = false; }
function interpret(q) {
  const t = q.trim(); let m;
  if (!t) return { kind: 'empty' };
  if ((m = t.match(/^(?:move|shift|push|reschedule|pindah(?:kan)?|geser|mundurkan|majukan)\s+(.+?)\s+(?:to|ke|into)\s+(.+)$/i))) {
    const target = findMilestone(m[1]); return { kind: 'move', target, date: target ? resolveDate(m[2], target.date) : null, text: m[1] };
  }
  if ((m = t.match(/^(?:move|shift|push|pindah(?:kan)?|geser)\s+(.+)$/i))) return { kind: 'move', target: findMilestone(m[1]), date: null, text: m[1] };
  if ((m = t.match(/^(?:show|list|find|tampilkan|lihat|cari)\s+(.+)$/i))) return { kind: 'show', q: m[1] };
  if ((m = t.match(/^(?:add|new|create|tambah(?:kan)?|buat)\s+(?:a\s+)?(?:new\s+)?project\s+(.+)$/i))) return { kind: 'newproj', name: m[1].trim() };
  if ((m = t.match(/^(?:add|new|create|tambah(?:kan)?|buat)\s+(?:a\s+)?milestone\s+(.+)$/i))) return { kind: 'newms', text: m[1] };
  if ((m = t.match(/^(?:add|new|create|tambah(?:kan)?|buat|todo)\s+(.+)$/i))) return { kind: 'add', spec: parseAdd(m[1]) };
  if ((m = t.match(/^(?:run|kerjakan|do|codex)\s+(.+)$/i))) return { kind: 'runtask', list: searchActions(m[1]).filter(a => !a.done) };
  if ((m = t.match(/^(?:enhance|improve|perjelas)\s+(.+)$/i))) return { kind: 'enhance', list: searchActions(m[1]).filter(a => !a.done) };
  if ((m = t.match(/^(?:done|complete|finish|check|tick|selesai(?:kan)?)\s+(.+)$/i))) return { kind: 'complete', list: searchActions(m[1]).filter(a => !a.done) };
  if ((m = t.match(/^(?:open|go to|goto|buka)\s+(.+)$/i))) return { kind: 'open', q: m[1] };
  return { kind: 'free', q: t };
}
function showQuery(q) {
  const low = q.toLowerCase(), W = planWeek(), E = addDays(W, 6), t = todayISO();
  const live = Object.values(S.actions).filter(a => liveAction(a) && !a.done);
  const thisWeek = /this week|minggu ini/.test(low);
  if (/block|waiting|stuck|terhambat|tertahan/.test(low)) {
    let list = live.filter(a => (a.bucket === 'backlog' && a.state === 'waiting') || outsideWindow(a));
    if (thisWeek) list = list.filter(a => a.bucket !== 'backlog' || a.state === 'waiting' || (a.due && a.due <= E));
    return { title: 'Blocked, waiting, or outside their window', list };
  }
  if (/overdue|late|terlambat/.test(low)) return { title: 'Past their due date', list: live.filter(a => a.due && a.due < t) };
  if (/stall|slow|quiet|stagn/.test(low)) return { title: 'Projects losing momentum', projects: projects().filter(p => ['slowing', 'stalled'].includes(momentum(p).key)) };
  if (/today|hari ini/.test(low)) return { title: 'Today', list: todayList() };
  if (/done|completed|selesai/.test(low)) return { title: 'Done this week', list: Object.values(S.actions).filter(a => liveAction(a) && a.done && a.doneAt && dayOfTs(a.doneAt) >= addDays(W, -1)) };
  if (/room/.test(low)) return { title: "If there's room", list: weekList('room').filter(a => !a.done) };
  if (/backlog|later|someday|idea/.test(low)) { const st = Object.keys(STATES).find(s => low.includes(s)); return { title: st ? `Backlog · ${STATES[st]}` : 'Backlog', list: live.filter(a => a.bucket === 'backlog' && (!st || (a.state || 'later') === st)) }; }
  if (thisWeek || /commit/.test(low)) return { title: 'Committed this week', list: commitOpen() };
  const fp = findProject(low, true);
  if (fp) return { title: fp.p.name, list: live.filter(a => a.projectId === fp.p.id), project: fp.p };
  return { title: 'Matching actions', list: searchActions(q, 12) };
}
const NAVS = [['now', 'Now', 'Portfolio overview'], ['week', 'Week', 'Commit, room, backlog'], ['horizon', 'Horizon', 'Milestones over time'], ['office', 'Office', 'Your agents at work, and Dex'], ['settings', 'Settings', 'Codex account, permissions, folders'], ['import', 'Import from Codex history', 'Turn past Codex sessions into projects']];
function buildPalette() {
  const q = $('#pal-q').value; const it = interpret(q); const items = [];
  const push = (g, o) => items.push(Object.assign({ g }, o));
  const actItem = (g, a, extra) => { const p = S.projects[a.projectId]; push(g, { icon: a.done ? '✓' : '○', title: a.title, sub: `${p.name} · ${bucketLabel(a)}${a.due ? ' · ' + relDay(a.due) : ''}${outsideWindow(a) ? ' · <span class="warnx">outside window</span>' : ''}`, pc: p, run: () => { closePalette(); navigate('project', p.id); }, ...extra }); };
  if (PAL.results) { PAL.results.forEach(r => items.push(r)); }
  else if (it.kind === 'empty') {
    ['move lestari submission to november', 'show everything blocked this week', 'add competitor research to nusa persona backlog'].forEach(c => push('Try', { icon: '›', title: c, sub: 'Fill in this command', run: () => { $('#pal-q').value = c; buildPalette(); } }));
    NAVS.forEach(([v, t, s], i) => push('Go to', { icon: String(i + 1), title: t, sub: s, run: () => { closePalette(); navigate(v); } }));
    projects().forEach(p => push('Projects', { icon: '●', pc: p, title: p.name, sub: `${momentum(p).label} · ${p.phases[p.phase] || ''}`, run: () => { closePalette(); navigate('project', p.id); } }));
  }
  else if (it.kind === 'move') {
    if (it.target && it.date) {
      const m = it.target, p = S.projects[m.projectId], n = depsOutside(m.id, it.date).length, d = diffDays(it.date, m.date);
      push('Command', { intent: true, icon: '→', title: `Move ${m.title} to ${fmtDow(it.date)}`, sub: `${p.name} · ${fmt(m.date)} → ${fmt(it.date)} (${d >= 0 ? '+' : ''}${d}d)${n ? ` · <span class="warnx">${n} dependent action${n > 1 ? 's' : ''} would fall outside the window</span>` : ''}`, pc: p, run: () => { closePalette(); moveMilestone(m.id, it.date); } });
    } else if (it.target) push('Command', { icon: '?', title: `Move ${it.target.title} to…`, sub: 'Add a date: “to nov 12”, “to friday”, “to december”', run: () => { } });
    else push('Command', { icon: '?', title: 'Which milestone?', sub: 'Name the project and milestone, e.g. “move nusa pilot to nov 12”', run: () => { } });
  }
  else if (it.kind === 'add' && it.spec.title) {
    const s = it.spec, p = S.projects[s.projectId], m = s.milestoneId && S.milestones[s.milestoneId];
    const where = s.bucket === 'backlog' ? `Backlog · ${STATES[s.state || 'later']}` : s.bucket === 'room' ? "If there's room" : 'This week';
    push('Command', { intent: true, icon: '+', title: `Add “${s.title}”`, sub: `${p ? p.name : 'No project'}${s.guessed ? ' (guessed)' : ''} · ${where}${m ? ' · ' + m.title : ''}${s.due ? ' · due ' + fmtDow(s.due) : ''}`, pc: p, run: () => { closePalette(); addFromSpec(s); } });
  }
  else if (it.kind === 'newproj' && it.name) push('Command', { intent: true, icon: '+', title: `Create project “${it.name}”`, sub: 'Opens its canvas so you can set direction and phases', run: () => { closePalette(); const id = createProject(it.name[0].toUpperCase() + it.name.slice(1)); navigate('project', id); } });
  else if (it.kind === 'newms') {
    const fp = findProject(it.text); const pid = fp ? fp.p.id : (UI.view === 'project' ? UI.projectId : null);
    let text = ' ' + it.text + ' '; if (fp) text = text.replace(new RegExp(`(?:\\b(?:for|to|in|on)\\s+)?${escRe(fp.alias)}`, 'i'), ' ');
    const dt = extractDate(text); const date = dt ? (dt.date || mkDate(1, dt.month, todayISO())) : null;
    const title = (dt ? dt.rest : text).replace(/\s+/g, ' ').trim().replace(/\s+(on|by|for|to)$/i, '');
    if (pid && title && date) push('Command', { intent: true, icon: '◆', title: `Add milestone “${title}”`, sub: `${S.projects[pid].name} · ${fmtDow(date)}`, pc: S.projects[pid], run: () => { closePalette(); createMilestone(pid, title[0].toUpperCase() + title.slice(1), date); } });
    else push('Command', { icon: '?', title: 'Add milestone', sub: 'Include project and date, e.g. “add milestone beta release to datasans nov 20”', run: () => { } });
  }
  else if (it.kind === 'runtask' || it.kind === 'enhance') { it.list.slice(0, 6).forEach((a, i) => actItem(it.kind === 'runtask' ? 'Run with Codex' : 'Enhance with Codex', a, { intent: i === 0, icon: it.kind === 'runtask' ? '▶' : '✦', title: `${it.kind === 'runtask' ? 'Run' : 'Enhance'} “${a.title}”`, run: () => { closePalette(); Drawer.open(a.id); it.kind === 'runtask' ? Drawer.runTask(a.id) : Drawer.enhance(a.id); } })); if (!it.list.length) push('Codex', { icon: '?', title: 'No open action matches', sub: 'Try a few words from its title', run: () => { } }); }
  else if (it.kind === 'complete') { it.list.slice(0, 6).forEach((a, i) => actItem('Complete', a, { intent: i === 0, icon: '✓', title: `Complete “${a.title}”`, run: () => { closePalette(); tx(`Done · ${a.title}`, () => toggleDone(a)); } })); if (!it.list.length) push('Complete', { icon: '?', title: 'No open action matches', sub: 'Try a few words from its title', run: () => { } }); }
  else if (it.kind === 'show') {
    const r = showQuery(it.q);
    if (r.projects) { r.projects.forEach(p => { const mo = momentum(p); push(r.title, { icon: '●', pc: p, title: p.name, sub: `${mo.label} · ${mo.note}`, run: () => { closePalette(); navigate('project', p.id); } }); }); if (!r.projects.length) push(r.title, { icon: '✓', title: 'Every project is moving', sub: 'Nothing slowing or stalled', run: () => { } }); }
    else { if (r.project) push(r.title, { icon: '●', pc: r.project, title: `Open ${r.project.name}`, sub: 'Project canvas', run: () => { closePalette(); navigate('project', r.project.id); } }); r.list.slice(0, 14).forEach(a => actItem(`${r.title} · ${r.list.length}`, a)); if (!r.list.length) push(r.title, { icon: '✓', title: 'Nothing here', sub: 'Clear on this front', run: () => { } }); }
  }
  else {
    const qq = (it.q || '').toLowerCase();
    NAVS.filter(([v, t]) => t.toLowerCase().startsWith(qq) || v.startsWith(qq)).forEach(([v, t, s]) => push('Go to', { icon: '›', title: t, sub: s, run: () => { closePalette(); navigate(v); } }));
    const fp = findProject(qq, true); Object.values(S.projects).filter(p => p.name.toLowerCase().includes(qq) || (fp && fp.p === p)).forEach(p => push('Projects', { icon: '●', pc: p, title: p.name + (p.status === 'Archived' ? ' (archived)' : ''), sub: `${p.kind || 'Project'} · ${p.phases[p.phase] || ''}`, run: () => { closePalette(); navigate('project', p.id); } }));
    Object.values(S.milestones).filter(m => S.projects[m.projectId] && overlap(tokens(qq), tokens(m.title))).slice(0, 4).forEach(m => { const p = S.projects[m.projectId]; push('Milestones', { icon: '◆', pc: p, title: m.title, sub: `${p.name} · ${fmt(m.date)}`, run: () => { closePalette(); navigate('project', p.id); } }); });
    searchActions(qq, 6).forEach(a => actItem('Actions', a));
    if (qq.split(/\s+/).length >= 2) { const s = parseAdd(it.q); if (s.title) { const p = S.projects[s.projectId]; push('Add', { icon: '+', title: `Add “${s.title}”`, sub: `${p ? p.name : ''}${s.guessed ? ' (guessed)' : ''} · ${s.bucket === 'backlog' ? 'Backlog' : s.bucket === 'room' ? "If there's room" : 'This week'}${s.due ? ' · due ' + fmtDow(s.due) : ''}`, pc: p, run: () => { closePalette(); addFromSpec(s); } }); } }
  }
  if (!PAL.results && q.trim().split(/\s+/).length >= 3 && Codex.ready && Codex.account) push('Codex', { icon: '✦', title: 'Ask Codex to interpret this', sub: 'Turns the sentence into changes you can undo', run: () => askClaude(q) });
  PAL.items = items; PAL.sel = Math.max(0, items.findIndex(i => i.intent)); if (PAL.sel < 0) PAL.sel = 0;
  drawPalette();
}
function drawPalette() {
  const box = $('#pal-list'); let g = null, html = '';
  if (PAL.thinking) html += `<div class="pal-note">Codex is reading your command<span class="thinking"><i></i><i></i><i></i></span></div>`;
  PAL.items.forEach((it, i) => {
    if (it.g !== g) { g = it.g; html += `<div class="pal-g">${esc(g)}</div>`; }
    html += `<button class="pal-it ${it.intent ? 'intent' : ''} ${i === PAL.sel ? 'sel' : ''}" data-i="${i}" style="${it.pc ? pc(it.pc) : ''}"><span class="pi" style="${it.pc && !it.intent ? 'color:var(--pc)' : ''}">${esc(it.icon || '›')}</span><span class="pt"><div>${esc(it.title)}</div>${it.sub ? `<div>${it.sub.replace(/<(?!\/?span)/g, '&lt;')}</div>` : ''}</span>${i === PAL.sel ? '<span class="pk">↵</span>' : ''}</button>`;
  });
  if (!PAL.items.length && !PAL.thinking) html = '<div class="pal-note">No match. Try “move …”, “add …”, “show …”, or a project name.</div>';
  box.innerHTML = html;
  const sel = $('.pal-it.sel', box); if (sel) sel.scrollIntoView({ block: 'nearest' });
}
$('#pal-q').addEventListener('input', () => { PAL.results = null; buildPalette(); });
$('#pal-q').addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') { e.preventDefault(); PAL.sel = Math.min(PAL.items.length - 1, PAL.sel + 1); drawPalette(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); PAL.sel = Math.max(0, PAL.sel - 1); drawPalette(); }
  else if (e.key === 'Enter') { e.preventDefault(); const it = PAL.items[PAL.sel]; if (it) it.run(); }
  else if (e.key === 'Escape') { e.preventDefault(); closePalette(); }
  else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); closePalette(); }
});
$('#pal-list').addEventListener('click', e => { const b = e.target.closest('.pal-it'); if (!b) return; const it = PAL.items[+b.dataset.i]; if (it) it.run(); });
$('#pal-list').addEventListener('mousemove', e => { const b = e.target.closest('.pal-it'); if (b && +b.dataset.i !== PAL.sel) { PAL.sel = +b.dataset.i; $$('.pal-it').forEach((x, i) => x.classList.toggle('sel', i === PAL.sel)); } });

const OPS_SCHEMA = { type: 'object', additionalProperties: false, required: ['summary', 'ops'], properties: { summary: { type: 'string' }, ops: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['op', 'milestoneId', 'date', 'projectId', 'title', 'list', 'state', 'due', 'actionId', 'actionIds'], properties: { op: { type: 'string', enum: ['move_milestone', 'add_action', 'complete_action', 'set_list', 'show_actions', 'open_project'] }, milestoneId: { type: ['string', 'null'] }, date: { type: ['string', 'null'] }, projectId: { type: ['string', 'null'] }, title: { type: ['string', 'null'] }, list: { type: ['string', 'null'] }, state: { type: ['string', 'null'] }, due: { type: ['string', 'null'] }, actionId: { type: ['string', 'null'] }, actionIds: { type: ['array', 'null'], items: { type: 'string' } } } } } } };
async function askClaude(q) {
  if (PAL.thinking) return;
  PAL.thinking = true; PAL.items = []; drawPalette();
  const data = {
    today: todayISO(), weekStarts: planWeek(),
    projects: projects().map(p => ({ id: p.id, name: p.name, milestones: msOf(p.id).map(m => ({ id: m.id, title: m.title, date: m.date, done: m.done })) })),
    openActions: Object.values(S.actions).filter(a => liveAction(a) && !a.done).slice(0, 120).map(a => ({ id: a.id, title: a.title, projectId: a.projectId, milestoneId: a.milestoneId, list: a.bucket, state: a.state, due: a.due }))
  };
  const prompt = `You turn one short command into operations for a personal project tracker.\nData (JSON): ${JSON.stringify(data)}\nCommand: "${q}"\nReply with JSON only, shaped {"summary": "<one short sentence of what will change>", "ops": [ ... ]}. Each op is one of:\n{"op":"move_milestone","milestoneId":"...","date":"YYYY-MM-DD"}\n{"op":"add_action","projectId":"...","title":"...","list":"commit|room|backlog","state":"later|waiting|someday|idea|null","due":"YYYY-MM-DD|null","milestoneId":"...|null"}\n{"op":"complete_action","actionId":"..."}\n{"op":"set_list","actionId":"...","list":"commit|room|backlog","state":"later|waiting|someday|idea|null"}\n{"op":"show_actions","actionIds":["..."]}\n{"op":"open_project","projectId":"..."}\nUse only ids that exist in the data. "commit" means this week. If nothing fits, return {"summary":"<why>","ops":[]}.`;
  try {
    const res = await Quick.ask({ cwd: Store.root, prompt, schema: OPS_SCHEMA, effort: 'low' });
    PAL.thinking = false;
    const ops = Array.isArray(res && res.ops) ? res.ops : [];
    const shows = [], changes = []; let open = null;
    ops.forEach(o => {
      if (o.op === 'move_milestone' && S.milestones[o.milestoneId] && /^\d{4}-\d{2}-\d{2}$/.test(o.date || '')) changes.push(o);
      else if (o.op === 'add_action' && S.projects[o.projectId] && o.title) changes.push(o);
      else if ((o.op === 'complete_action' || o.op === 'set_list') && S.actions[o.actionId]) changes.push(o);
      else if (o.op === 'show_actions' && Array.isArray(o.actionIds)) o.actionIds.forEach(id => S.actions[id] && shows.push(S.actions[id]));
      else if (o.op === 'open_project' && S.projects[o.projectId]) open = o.projectId;
    });
    const moves = changes.filter(o => o.op === 'move_milestone');
    const others = changes.filter(o => o.op !== 'move_milestone');
    if (others.length) {
      tx(res.summary || 'Done', () => others.forEach(o => {
        if (o.op === 'add_action') createAction({ projectId: o.projectId, title: o.title, bucket: ['commit', 'room', 'backlog'].includes(o.list) ? o.list : 'commit', state: o.state, due: /^\d{4}-\d{2}-\d{2}$/.test(o.due || '') ? o.due : null, milestoneId: S.milestones[o.milestoneId] ? o.milestoneId : null });
        else if (o.op === 'complete_action') { const a = S.actions[o.actionId]; if (!a.done) toggleDone(a); }
        else if (o.op === 'set_list') setBucket(S.actions[o.actionId], ['commit', 'room', 'backlog'].includes(o.list) ? o.list : 'backlog', o.state);
      }));
    }
    moves.forEach(o => moveMilestone(o.milestoneId, o.date));
    if (shows.length) {
      PAL.results = [{ g: res.summary || 'Codex found', icon: '✦', title: res.summary || `${shows.length} actions`, sub: '', run: () => { } }].concat(shows.map(a => { const p = S.projects[a.projectId]; return { g: 'Actions', icon: a.done ? '✓' : '○', pc: p, title: a.title, sub: `${p.name} · ${bucketLabel(a)}`, run: () => { closePalette(); navigate('project', p.id); } }; }));
      PAL.items = PAL.results; PAL.sel = 0; drawPalette(); return;
    }
    if (open) { closePalette(); navigate('project', open); return; }
    if (!changes.length) { PAL.items = [{ g: 'Codex', icon: '✦', title: 'Nothing to change', sub: esc(res && res.summary || 'Codex could not map that to your projects.'), run: () => { } }]; PAL.sel = 0; drawPalette(); return; }
    closePalette();
  } catch (err) {
    PAL.thinking = false;
    const code = err && err.code;
    const msg = (err && err.message) || 'Codex could not interpret that. Try rephrasing.';
    PAL.items = [{ g: 'Codex', icon: '!', title: msg, sub: '', run: () => { } }]; PAL.sel = 0; drawPalette();
  }
}

/* ---- toasts ---- */
function toast(msg, o = {}) {
  const box = $('#toasts'); const el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status');
  const acts = [...(o.actions || [])]; if (o.undo) acts.push({ label: 'Undo', run: o.undo });
  el.innerHTML = `<div class="tm">${esc(msg)}${o.sub ? `<span class="ts">${esc(o.sub)}</span>` : ''}</div>${acts.length ? `<div class="ta">${acts.map((a, i) => `<button data-i="${i}">${esc(a.label)}</button>`).join('')}</div>` : ''}`;
  const close = () => { if (!el.isConnected) return; el.classList.add('out'); setTimeout(() => el.remove(), 300); };
  el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const a = acts[+b.dataset.i]; close(); if (a) a.run(); });
  box.appendChild(el);
  while (box.children.length > 3) box.firstElementChild.remove();
  let t = setTimeout(close, o.duration || (acts.length ? 7000 : 3200));
  el.addEventListener('mouseenter', () => clearTimeout(t)); el.addEventListener('mouseleave', () => { t = setTimeout(close, 2500); });
}

/* ---- theme ---- */
function applyTheme(t) {
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme');
  const dark = isDark();
  const l = document.getElementById('hl-light'), d = document.getElementById('hl-dark'); if (l && d) { l.disabled = dark; d.disabled = !dark; }
  if (NATIVE) setTimeout(() => nat('windowColor', { hex: getComputedStyle(document.body).backgroundColor.match(/\d+/g).slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join(''), dark }).catch(() => { }), 30);
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(document.documentElement.getAttribute('data-theme')));
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = cur === 'dark' ? 'light' : 'dark';
  const run = () => { applyTheme(next); lsSet('bearing.theme', next); if (Store.mode === 'native') saveSettings({ theme: next }); };
  if (document.startViewTransition && !RM.matches) document.startViewTransition(run); else run();
}
applyTheme(lsGet('bearing.theme'));

/* ---- boot ---- */
(function boot() {
  const h = location.hash.slice(1);
  if (h.startsWith('p-')) { UI.view = 'project'; UI.projectId = h.slice(2); }
  else if (['now', 'week', 'horizon', 'focus', 'office', 'settings', 'import'].includes(h)) UI.view = h;
  renderNow();
  Store.boot();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateNav);
  setInterval(() => { if (UI.ready && !isEditing() && !UI.dragging && !HZ.drag && document.visibilityState === 'visible') scheduleRender(); }, 5 * 60 * 1000);
})();
