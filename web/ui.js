"use strict";
/* Codex-facing UI: task drawer, run view, approvals, skill offers, login, settings, project Codex section. */

const ICONS = {
  you: '<path d="M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm-4.5 5c.4-2.2 2.2-3.5 4.5-3.5s4.1 1.3 4.5 3.5" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/>',
  think: '<path d="M8 2.5v2M8 11.5v2M2.5 8h2M11.5 8h2M4.1 4.1l1.4 1.4M10.5 10.5l1.4 1.4M4.1 11.9l1.4-1.4M10.5 5.5l1.4-1.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
  say: '<path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h7A1.5 1.5 0 0 1 13 4.5v5a1.5 1.5 0 0 1-1.5 1.5H7l-3 2.5V11h.5A1.5 1.5 0 0 1 3 9.5Z" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linejoin="round"/>',
  plan: '<path d="M3 4h1M3 8h1M3 12h1M6 4h7M6 8h7M6 12h5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
  read: '<path d="M4 2.5h5l3 3v8H4Z M9 2.5v3h3" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linejoin="round"/>',
  search: '<circle cx="7" cy="7" r="4" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="m10 10 3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
  list: '<path d="M2.5 4.5h4l1 1.5h6v6.5h-11Z" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linejoin="round"/>',
  run: '<path d="m3.5 5 2.5 2.5L3.5 10M7.5 11h5" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  edit: '<path d="M10.5 3 13 5.5 6 12.5H3.5V10Z" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linejoin="round"/>',
  memory: '<path d="M8 3c-2.5 0-4 1.6-4 3.5 0 1.3.7 2.1 1.5 2.7V12h5V9.2c.8-.6 1.5-1.4 1.5-2.7C12 4.6 10.5 3 8 3ZM6.5 13.5h3" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/>',
  web: '<circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M2.5 8h11M8 2.5c1.6 1.6 2.3 3.4 2.3 5.5S9.6 11.9 8 13.5C6.4 11.9 5.7 10.1 5.7 8S6.4 4.1 8 2.5Z" stroke="currentColor" stroke-width="1.1" fill="none"/>',
  cursor: '<path d="m4 3 8 4-3.3 1.2L7.5 12Z" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linejoin="round"/>',
  tool: '<path d="M9.5 3.2a3 3 0 0 0-3.4 4L3 10.3 5.7 13l3.1-3.1a3 3 0 0 0 4-3.4L11 8.3 9.7 7 11.5 5.2Z" stroke="currentColor" stroke-width="1.1" fill="none" stroke-linejoin="round"/>',
  image: '<rect x="2.5" y="3.5" width="11" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="m3 11 3-3 2.5 2.5L10 9l3 3" stroke="currentColor" stroke-width="1.1" fill="none"/>',
  agent: '<circle cx="5.5" cy="6" r="2" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="11" cy="6" r="2" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M2.5 12.5c.4-1.6 1.6-2.5 3-2.5s2.6.9 3 2.5M8.5 12c.4-1.3 1.3-2 2.5-2 1.4 0 2.4.9 2.7 2.5" stroke="currentColor" stroke-width="1.1" fill="none"/>',
  review: '<path d="M2.5 8s2-4 5.5-4 5.5 4 5.5 4-2 4-5.5 4-5.5-4-5.5-4Z" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="8" cy="8" r="1.6" fill="currentColor"/>',
  compact: '<path d="M4 6h8M5.5 9h5M7 12h2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
  wait: '<circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M8 5v3l2 1.5" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/>',
  stop: '<circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="m5 11 6-6" stroke="currentColor" stroke-width="1.2"/>',
  spark: '<path d="M8 2.5 9.3 6.7 13.5 8 9.3 9.3 8 13.5 6.7 9.3 2.5 8 6.7 6.7Z" fill="currentColor"/>',
  play: '<path d="M5 3.5v9l7.5-4.5Z" fill="currentColor"/>',
};
const ic = (k, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 16 16" aria-hidden="true">${ICONS[k] || ICONS.tool}</svg>`;
const inlineMd = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
const ago = ts => { if (!ts) return ''; const s = (Date.now() - new Date(ts)) / 1000; if (s < 60) return 'just now'; if (s < 3600) return `${Math.round(s / 60)} min ago`; if (s < 86400) return `${Math.round(s / 3600)} h ago`; const d = Math.round(s / 86400); return d === 1 ? 'yesterday' : d < 7 ? `${d} days ago` : new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); };
const STATUS_LABEL = { starting: 'Starting', running: 'Working', waiting: 'Needs you', completed: 'Done', failed: 'Failed', interrupted: 'Stopped' };
const statusPill = st => `<span class="rpill rp-${st}"><i></i>${STATUS_LABEL[st] || st}</span>`;
const isExplore = it => it.type === 'commandExecution' && (it.commandActions || []).length && it.commandActions.every(a => ['read', 'search', 'listFiles'].includes(a.type));

/* ================= status, login ================= */
const CodexUI = {
  status() {
    const act = Runs.active(), waiting = act.filter(r => r.status === 'waiting').length;
    const rb = $('#runs-btn'); if (rb) { rb.hidden = !Runs.map.size; $('#runs-count').textContent = act.length; rb.classList.toggle('live', act.length > 0); rb.classList.toggle('needs', waiting > 0); }
    const dot = $('#acct-dot'), lbl = $('#acct-lbl');
    if (dot) {
      const st = !NATIVE ? 'off' : Codex.error ? 'err' : !Codex.ready ? 'wait' : Codex.account ? 'ok' : Codex.needsAuth ? 'err' : 'ok';
      dot.className = 'acct-dot ' + st;
      lbl.textContent = !NATIVE ? 'Codex' : Codex.error ? 'Codex offline' : !Codex.ready ? 'Starting Codex' : Codex.account ? (Codex.account.email ? Codex.account.email.split('@')[0] : 'Codex') : 'Sign in';
    }
    if (NATIVE) nat('badge', { text: waiting ? String(waiting) : '' }).catch(() => { });
    if (Codex.ready && Codex.needsAuth && !Codex.account && !CodexUI.loginDismissed) CodexUI.showLogin();
    if (UI.view === 'settings' || UI.view === 'office') scheduleRender();
  },
  loginDismissed: false,
  showLogin() { const el = $('#login'); if (!el) return; el.hidden = false; this.renderLogin(); },
  hideLogin() { const el = $('#login'); if (el) el.hidden = true; },
  renderLogin() {
    const el = $('#login'); if (!el || el.hidden) return;
    const L = Codex.login;
    el.innerHTML = `<div class="lg-box">
      ${mascot(Codex.login ? 'think' : 'wave', 110)}
      <h1>Crewdex</h1>
      <p class="lg-tag">Codex, with a crew.</p>
      <p class="lg-sub">Sign in to Codex so Crewdex can enhance tasks and work on them. Crewdex uses the same Codex setup as the Codex app, so your plugins, skills, browser and Computer Use come along.</p>
      ${L && L.authUrl ? `<div class="lg-wait"><span class="thinking"><i></i><i></i><i></i></span> Finish signing in in your browser.<div><button class="tbtn" data-act="login-open">Open the sign-in page again</button><button class="tbtn" data-act="login-cancel">Cancel</button></div></div>`
      : L && L.userCode ? `<div class="lg-wait">Go to <a href="${esc(L.verificationUrl)}" target="_blank">${esc(L.verificationUrl)}</a> and enter<div class="lg-code mono">${esc(L.userCode)}</div><button class="tbtn" data-act="login-cancel">Cancel</button></div>`
      : `<div class="lg-btns"><button class="tbtn primary big" data-act="login-chatgpt">Sign in with ChatGPT</button>
         <button class="tbtn" data-act="login-device">Use a device code</button>
         <details class="lg-key"><summary>Use an API key</summary><div><input id="lg-apikey" type="password" placeholder="sk-…" autocomplete="off"><button class="tbtn" data-act="login-key">Save key</button></div></details></div>`}
      ${Codex.error ? `<p class="lg-err">${esc(Codex.error)}</p>` : ''}
      <button class="lg-skip" data-act="login-skip">Not now, just plan</button>
    </div>`;
  },

  /** Delegated actions. Returns true when handled. */
  act(act, el, e) {
    const id = el.dataset.id;
    switch (act) {
      case 'task': Drawer.open(id); return true;
      case 'dw-close': Drawer.close(); return true;
      case 'enhance': Drawer.open(id); Drawer.enhance(id); return true;
      case 'run-task': Drawer.open(id); Drawer.runTask(id); return true;
      case 'enh-apply': Drawer.applyEnh(id); return true;
      case 'clear-end': { const x = S.actions[id]; if (x) tx('End date cleared', () => patch('actions', id, { due: null }), { duration: 3000 }); setTimeout(() => Drawer.render(true), 0); return true; }
      case 'enh-use': { const e2 = UI.enh[id], t = e2 && e2.tasks[+el.dataset.i], bb = UI.brief[id]; if (t && bb) { bb.text = taskPrompt(t); bb.notes = null; Drawer.render(true); const ta = $('#dw-brief-t'); if (ta) { ta.focus(); ta.scrollIntoView({ block: 'center', behavior: 'smooth' }); } } return true; }
      case 'enh-use-all': { const e2 = UI.enh[id], bb = UI.brief[id], aa = S.actions[id]; if (e2 && bb) { const list = e2.tasks.filter(t => t.on !== false); bb.text = `Task: ${aa.title}\n\nDo it in these steps:\n${list.map((t, i) => `${i + 1}. ${t.title}${t.who === 'you' ? ' (prepare what you can; I will do the rest)' : ''}\n   ${t.description}`).join('\n')}`; bb.notes = null; Drawer.render(true); const ta = $('#dw-brief-t'); if (ta) ta.focus(); } return true; }
      case 'enh-toggle': { const t = UI.enh[id] && UI.enh[id].tasks[+el.dataset.i]; if (t) { t.on = t.on === false; Drawer.render(true); } return true; }
      case 'brief-enhance': Drawer.enhanceBrief(id); return true;
      case 'brief-send': Drawer.sendBrief(id); return true;
      case 'brief-reset': if (UI.brief[id]) { UI.brief[id].text = UI.brief[id].orig; UI.brief[id].notes = null; UI.brief[id].enhanced = false; Drawer.render(true); } return true;
      case 'brief-cancel': delete UI.brief[id]; Drawer.render(true); return true;
      case 'followup-enhance': RunView.enhanceFollowup(); return true;
      case 'dex-dispatch': Office.dispatch(); return true;
      case 'pane-tab': Pane.tab = el.dataset.v; Pane.render(); return true;
      case 'pane-full': if (Pane.path) Viewer.open(Pane.path); return true;
      case 'pane-hide': UI.paneHidden = true; renderNow(); return true;
      case 'pane-show': UI.paneHidden = false; renderNow(); return true;
      case 'new-session': navigate('run', 'new:' + (id || UI.projectId)); return true;
      case 'task-here': if (UI.view !== 'run') { navigate('run', 'new:' + S.actions[id].projectId); setTimeout(() => taskIntoSession(id), 350); } else taskIntoSession(id); return true;
      case 'task-unlink': { const c = cmpState('run:' + UI.runId); c.taskId = null; renderNow(); return true; }
      case 'dex-plan': Office.command('Plan my week: pick up to 6 of the most important open backlog actions across my projects, favoring the nearest milestones and projects that are losing momentum, and move them to this week (commit).'); return true;
      case 'dex-panel': { const i = $('#dex-input'); if (i) i.focus(); return true; }
      case 'set-auto-enh': saveSettings({ autoEnhance: !S.settings.autoEnhance }); renderNow(); return true;
      case 'enh-discard': delete UI.enh[id]; Drawer.render(); return true;
      case 'crit': { const a = S.actions[el.dataset.aid]; if (a) { const c = (a.criteria || []).map((x, i) => i === +el.dataset.i ? Object.assign({}, x, { done: !x.done }) : x); tx(null, () => patch('actions', a.id, { criteria: c })); } return true; }
      case 'crit-del': { const a = S.actions[el.dataset.aid]; if (a) tx(null, () => patch('actions', a.id, { criteria: (a.criteria || []).filter((_, i) => i !== +el.dataset.i) })); return true; }
      case 'skill-toggle': { const s = UI.skillSel[el.dataset.aid] = UI.skillSel[el.dataset.aid] || new Set(); s.has(el.dataset.path) ? s.delete(el.dataset.path) : s.add(el.dataset.path); Drawer.render(); return true; }
      case 'pattern-skill': { const a = S.actions[el.dataset.aid]; const p = S.projects[a.projectId]; Runs.skillFromPattern(p, Drawer.similar(a), el.dataset.scope).then(r => navigate('run', r.id)).catch(err => toast('Could not start Codex.', { sub: err.message })); return true; }
      case 'open-run': navigate('run', id); return true;
      case 'run-stop': { const r = Runs.map.get(id); if (r) Runs.stop(r); return true; }
      case 'run-send': RunView.send(); return true;
      case 'run-folder': { const r = Runs.map.get(id); const d = r && Runs.dirOf(r); if (d) nat('reveal', { path: d + '/steps.md' }); return true; }
      case 'appr': RunView.decide(el); return true;
      case 'ask-submit': RunView.submitQuestions(el); return true;
      case 'elicit': RunView.elicit(el); return true;
      case 'skill-save': { const r = Runs.map.get(id); if (!r) return true; const hint = ($('#skill-hint') || {}).value || ''; Runs.saveAsSkill(r, el.dataset.scope, hint.trim()).catch(err => toast('Could not save the skill.', { sub: err.message })); return true; }
      case 'skill-dismiss': { const r = Runs.map.get(id); if (r) { r.skillOffer = 'dismissed'; Runs.save(r); RunView.refresh(r); } return true; }
      case 'runs': RunsPop.toggle(el); return true;
      case 'settings': navigate('settings'); return true;
      case 'login-chatgpt': Codex.loginStart('chatgpt').then(() => this.renderLogin()).catch(err => toast('Could not start sign-in.', { sub: err.message })); return true;
      case 'login-device': Codex.loginStart('chatgptDeviceCode').then(() => this.renderLogin()).catch(err => toast('Could not start sign-in.', { sub: err.message })); return true;
      case 'login-open': if (Codex.login && Codex.login.authUrl) nat('openURL', { url: Codex.login.authUrl }); return true;
      case 'login-cancel': if (Codex.login) Codex.req('account/login/cancel', { loginId: Codex.login.loginId }).catch(() => { }); Codex.login = null; this.renderLogin(); return true;
      case 'login-key': { const k = ($('#lg-apikey') || {}).value || ''; if (!k.trim()) return true; Codex.loginStart('apiKey', { apiKey: k.trim() }).then(() => Codex.refreshAccount()).then(() => { if (Codex.account) { this.hideLogin(); toast('Codex is ready.'); } }).catch(err => toast('That key did not work.', { sub: err.message })); return true; }
      case 'login-skip': this.loginDismissed = true; this.hideLogin(); return true;
      case 'logout': Codex.logout().then(() => { this.loginDismissed = false; toast('Signed out of Codex.'); }); return true;
      case 'signin': this.loginDismissed = false; this.showLogin(); return true;
      case 'codex-restart': nat('codex.stop').then(() => { Codex.restarts = 0; setTimeout(() => Codex.start(), 600); }); return true;
      case 'pick-root': nat('pickFolder', { message: 'Choose where Crewdex keeps your projects' }).then(p => { if (p) nat('setRoot', { path: p }).then(() => location.reload()); }); return true;
      case 'reveal-root': nat('reveal', { path: Store.root }); return true;
      case 'pick-codex': nat('pickFolder', { files: true, message: 'Choose the codex executable' }).then(p => { if (p) nat('setCodexPath', { path: p }).then(() => { nat('codex.stop'); setTimeout(() => Codex.start(), 600); }); }); return true;
      case 'set-perm': saveSettings({ perm: el.dataset.v }); renderNow(); return true;
      case 'proj-perm': { const p = S.projects[UI.projectId]; if (p) tx(null, () => patch('projects', p.id, { perm: el.dataset.v || null })); return true; }
      case 'link-ws': { const p = S.projects[UI.projectId]; nat('pickFolder', { message: `Link a code folder to ${p.name}` }).then(path => { if (path) tx('Workspace linked', () => patch('projects', p.id, { workspace: path })); }); return true; }
      case 'unlink-ws': { const p = S.projects[UI.projectId]; tx('Workspace unlinked', () => patch('projects', p.id, { workspace: null })); return true; }
      case 'reveal-proj': { const p = S.projects[id || UI.projectId]; if (p && p.dir) nat('reveal', { path: p.dir + '/AGENTS.md' }); return true; }
      case 'open-memory': { const p = S.projects[id || UI.projectId]; if (p && p.dir) Viewer.open(p.dir + '/AGENTS.md'); return true; }
      case 'edit-memory': { const p = S.projects[id || UI.projectId]; if (p && p.dir) nat('open', { path: p.dir + '/AGENTS.md' }); return true; }
      case 'load-example': loadExample(); return true;
      case 'imp-scan': Importer.scan(); return true;
      case 'imp-hold': { const st = IMP.sel[el.dataset.k]; if (st) { st.hold = el.dataset.v === '1'; renderNow(); } return true; }
      case 'proj-hold': { const p = S.projects[id || UI.projectId]; if (p && !isHeld(p)) tx(`${p.name} is on hold`, () => patch('projects', p.id, { status: 'On hold', heldAt: nowTs() })); return true; }
      case 'proj-resume': { const p = S.projects[id || UI.projectId]; if (p && isHeld(p)) tx(`${p.name} is active again`, () => patch('projects', p.id, { status: 'Active', heldAt: null })); return true; }
      case 'cmp-attach': { const key = el.dataset.key; nat('pickFiles', { message: 'Attach files, images or folders' }).then(list => { if (list && list.length) { const c = cmpState(key); c.files = [...new Set([...c.files, ...list])]; cmpRefresh(key); } }); return true; }
      case 'cmp-unattach': { const c = cmpState(el.dataset.key); c.files.splice(+el.dataset.i, 1); cmpRefresh(el.dataset.key); return true; }
      case 'imp-run': Importer.run(); return true;
      case 'imp-reset': IMP.stage = 'idle'; renderNow(); return true;
      case 'imp-all': IMP.proposals.forEach(p => { IMP.sel[p.key].on = el.dataset.v === '1'; }); renderNow(); return true;
      case 'imp-toggle': { const s = IMP.sel[el.dataset.k]; if (s) { s.on = !s.on; renderNow(); } return true; }
      case 'skill-trash': nat('trash', { path: el.dataset.path.replace(/\/SKILL\.md$/, '') }).then(() => Codex.loadSkills()).then(() => { toast('Skill moved to the Trash.'); scheduleRender(); }).catch(err => toast('Could not remove it.', { sub: err.message })); return true;
    }
    return false;
  },
};

/* ================= runs popover ================= */
const RunsPop = {
  toggle(anchor) {
    const pop = $('#runs-pop'); if (!pop.hidden) { pop.hidden = true; return; }
    const runs = [...Runs.map.values()].sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || '')).slice(0, 8);
    pop.innerHTML = `<div class="mh">Codex runs</div>${runs.map(r => { const p = S.projects[r.projectId]; return `<button data-act="open-run" data-id="${r.id}" class="rp-row" style="${pc(p)}"><span class="rp-t"><span>${esc(short(r.title, 44))}</span><span class="rp-s">${esc(p ? p.name : '')} · ${ago(r.startedAt)}</span></span>${statusPill(r.status)}</button>`; }).join('') || '<div class="pal-note">No runs yet.</div>'}`;
    pop.hidden = false;
    const rr = anchor.getBoundingClientRect(); pop.style.top = rr.bottom + 8 + 'px'; pop.style.left = Math.max(12, rr.right - pop.offsetWidth) + 'px';
    setTimeout(() => document.addEventListener('click', function off(ev) { if (!pop.contains(ev.target) && !ev.target.closest('#runs-btn')) { pop.hidden = true; document.removeEventListener('click', off, true); } }, true), 0);
  }
};

/* ================= task drawer ================= */
const WHO = { codex: ['Codex can do this', 'spark'], together: ['Codex drafts, you finish', 'edit'], you: ['Yours to do', 'you'] };

const Drawer = {
  open(id) { if (!S.actions[id]) return; UI.drawer = id; const d = $('#drawer'); d.hidden = false; requestAnimationFrame(() => d.classList.add('open')); this.render(true); },
  close() { const d = $('#drawer'); d.classList.remove('open'); UI.drawer = null; setTimeout(() => { if (!UI.drawer) { d.hidden = true; d.innerHTML = ''; } }, 380); },
  similar(a) { const tk = tokens(a.title); if (tk.length < 2) return []; return Object.values(S.actions).filter(b => b.id !== a.id && (b.runs || []).some(r => r.status === 'completed') && overlap(tk, tokens(b.title)) >= Math.min(2, tk.length)).slice(0, 6); },
  skillMatches(a) {
    const p = S.projects[a.projectId]; const tk = tokens(a.title + ' ' + (a.description || ''));
    return Codex.skillsFor(p).filter(s => s.scope !== 'system' || s.name === 'imagegen').map(s => ({ s, score: overlap(tk, tokens(s.name.replace(/[:_-]/g, ' ') + ' ' + (s.description || ''))) + (a.skillHint && s.name === a.skillHint ? 3 : 0) + (s.scope === 'repo' ? .5 : 0) })).filter(x => x.score >= 2).sort((x, y) => y.score - x.score).slice(0, 4);
  },
  render(force) {
    const d = $('#drawer'); const a = UI.drawer && S.actions[UI.drawer];
    if (!a) { if (UI.drawer) this.close(); return; }
    if (!force && d.contains(document.activeElement) && (document.activeElement.isContentEditable || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT')) return;
    const p = S.projects[a.projectId], m = a.milestoneId && S.milestones[a.milestoneId];
    const enh = UI.enh[a.id];
    if (!UI.brief[a.id]) { const t0 = buildPrompt(a); const pref = p.sessionPref && Runs.map.get(p.sessionPref) ? p.sessionPref : 'new'; UI.brief[a.id] = { text: t0, orig: t0, notes: null, busy: false, sending: false, session: pref }; }
    const b = UI.brief[a.id];
    const runs = (a.runs || []).map(r => Runs.map.get(r.id) || r);
    const matches = this.skillMatches(a);
    if (!UI.skillSel[a.id]) UI.skillSel[a.id] = new Set(matches.filter(x => x.s.scope === 'repo' || x.s.name === a.skillHint).map(x => x.s.path));
    const sel = UI.skillSel[a.id];
    const sim = this.similar(a);
    const crit = a.criteria || [];
    const live = runs.find(r => ['starting', 'running', 'waiting'].includes(r.status));
    d.innerHTML = `<div class="dw" style="${pc(p)}">
      <header class="dw-h"><div class="dw-ctx"><span class="pdot"></span><button class="linkbtn" data-act="open" data-id="${p.id}">${esc(p.name)}</button></div><button class="ibtn" data-act="dw-close" aria-label="Close">✕</button></header>
      <div class="dw-body">
        <h2 class="dw-title" data-edit="actions.${a.id}.title">${esc(a.title)}</h2>
        <div class="dw-dates"><label><span>Start</span><input type="date" class="ms-date" id="dws-${a.id}" data-adate="${a.id}:start" value="${taskStart(a)}"></label><span class="dw-arrow">→</span><label><span>End</span><input type="date" class="ms-date ${a.due ? '' : 'empty'}" id="dwe-${a.id}" data-adate="${a.id}:due" value="${a.due || ''}"></label>${a.due ? `<button class="linkbtn" data-act="clear-end" data-id="${a.id}">No end date</button>` : '<span class="c-dim">open, no deadline yet</span>'}</div>
        ${live ? `<div class="dw-cta"><button class="tbtn primary big" data-act="open-run" data-id="${live.id}">${ic('run')}Watch ${esc(agentName(p))} work</button></div>` : `
        <div class="brief" id="dw-brief">
          <div class="brief-h">${agentSVG({ tone: p.color, pose: b.busy || UI.enhancing[a.id] ? 'think' : b.sending ? 'cheer' : 'wave', size: 40 })}<div><b>Ask ${esc(agentName(p))} to do it</b><br><span>Write what Codex should do, or let it draft the prompt for you.</span></div></div>
          <textarea id="dw-brief-t" data-brief="${a.id}" placeholder="Tell Codex how to do this task…" ${b.busy || b.sending ? 'disabled' : ''}>${esc(b.text)}</textarea>
          <div class="brief-b"><button class="tbtn" data-act="enhance" data-id="${a.id}" ${UI.enhancing[a.id] || b.busy ? 'disabled' : ''}>${ic('list')}${UI.enhancing[a.id] ? 'Breaking it down…' : 'Break down task'}</button><button class="tbtn" data-act="brief-enhance" data-id="${a.id}" ${b.busy || b.sending ? 'disabled' : ''}>${ic('spark')}${b.busy ? 'Writing…' : b.enhanced ? 'Enhance again' : 'Create enhanced prompt'}</button>${b.text !== b.orig ? `<button class="linkbtn" data-act="brief-reset" data-id="${a.id}">Reset</button>` : ''}</div>
          ${b.busy || UI.enhancing[a.id] ? `<ol class="mini-steps">${((b.busy ? b.steps : UI.enhSteps[a.id]) || []).slice(-4).map(st => `<li>${ic(st.icon)}<span>${inlineMd(st.text)}</span></li>`).join('')}<li>${ic('spark', 'spin')}<span>${b.busy ? 'Sharpening the prompt…' : 'Reading the project and splitting the task…'}</span></li></ol>` : ''}
          ${b.notes && b.notes.length ? `<ul class="brief-notes">${b.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
          ${enh ? `<div class="enh-box"><div class="fact-l">Suggested breakdown · pick one to use as the prompt, or keep them as tasks</div>
            <div class="enh-list">${enh.tasks.map((t, i) => `<div class="enh-t ${t.on === false ? 'off' : ''}">
              <button class="imp-tick" data-act="enh-toggle" data-id="${a.id}" data-i="${i}" aria-label="Include when adding as tasks">${t.on === false ? '' : '✓'}</button>
              <div class="enh-m"><input class="enh-title" data-enh="${a.id}" data-i="${i}" value="${esc(t.title)}">
                <div class="enh-meta"><span class="who who-${t.who}" title="${esc(t.reason)}">${ic(WHO[t.who][1])}${WHO[t.who][0]}</span>${t.due ? `<span class="mono">${fmtDow(t.due)}</span>` : ''}<button class="linkbtn" data-act="enh-use" data-id="${a.id}" data-i="${i}">Use as prompt ${ARROW}</button></div>
                <p>${esc(t.description)}</p></div></div>`).join('')}</div>
            <div class="dw-enh-b"><button class="tbtn" data-act="enh-apply" data-id="${a.id}">${enh.tasks.filter(t => t.on !== false).length > 1 ? `Add these ${enh.tasks.filter(t => t.on !== false).length} as my tasks` : 'Replace this task with it'}</button><button class="tbtn" data-act="enh-use-all" data-id="${a.id}">Use all as one prompt</button><button class="linkbtn" data-act="enh-discard" data-id="${a.id}">Discard</button></div></div>` : ''}
          <label class="brief-sess"><span>Work on it in</span><select data-briefsess="${a.id}"><option value="new" ${b.session === 'new' ? 'selected' : ''}>a new session</option>${Runs.list(p.id).slice(0, 20).map(r => `<option value="${r.id}" ${b.session === r.id ? 'selected' : ''}>${esc(short(r.title, 44))} · ${ago(r.endedAt || r.startedAt)}</option>`).join('')}</select></label>
          ${cmpBar('brief:' + a.id, { perm: p.perm || Runs.settings().perm })}
          <div class="brief-b"><span class="sp"></span><button class="tbtn primary big" data-act="brief-send" data-id="${a.id}" ${b.busy || b.sending || !b.text.trim() ? 'disabled' : ''}>${ic('play')}${b.sending ? 'Sending…' : `Send to ${esc(agentName(p))}`}</button></div>
        </div>`}
        ${runs.length ? `<section class="dw-sec"><div class="fact-l">Sessions for this task</div>${runs.map(r => `<button class="dw-run" data-act="open-run" data-id="${r.id}">${statusPill(r.status)}<span class="dw-run-t">${esc(r.summary ? short(firstSentence(parseUserText(r.summary).text.replace(/:codex-[a-z-]+(\[[^\]]*\])?\{[^}]*\}/g, '')), 110) : STATUS_LABEL[r.status] || '')}</span><span class="mono">${ago(r.startedAt || r.at)}</span></button>`).join('')}</section>` : ''}
      </div></div>`;
    Render.enhance(d);
  },
  async enhance(id) {
    const a = S.actions[id]; if (!a || UI.enhancing[id]) return;
    UI.enhancing[id] = true; UI.enhSteps[id] = []; this.render(true);
    try {
      const r = await enhanceTask(a, st => { UI.enhSteps[id].push(st); if (UI.drawer === id) this.render(true); });
      UI.enh[id] = r;
    } catch (e) { toast('Codex could not enhance this task.', { sub: e.message }); }
    UI.enhancing[id] = false; if (UI.drawer === id) this.render(true);
  },
  /** Turns the suggestion into real actions: the first one takes over this action, the rest are added next to it. */
  applyEnh(id) {
    const a = S.actions[id], e = UI.enh[id]; if (!a || !e) return;
    const picked = e.tasks.filter(t => t.on !== false && t.title.trim()); if (!picked.length) return;
    const E = addDays(planWeek(), 6); const isDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d || '');
    const many = picked.length > 1;
    const fields = (t, i) => {
      const due = isDate(t.due) ? t.due : (i === 0 ? a.due : null);
      const later = a.bucket !== 'backlog' && due && due > E;
      return { title: t.title.trim(), description: t.description, criteria: (t.acceptance || []).map(x => ({ text: x, done: false })), size: t.size, who: t.who, whoReason: t.reason, due, from: many ? a.title : (a.from || null),
        bucket: later ? 'backlog' : a.bucket, state: later ? 'later' : a.state, week: later ? null : a.week };
    };
    const n = { codex: 0, together: 0, you: 0 }; picked.forEach(t => n[t.who]++);
    tx(`${many ? `Split into ${picked.length} tasks` : 'Task refined'}: ${[n.codex ? `${n.codex} Codex can do` : '', n.together ? `${n.together} to draft together` : '', n.you ? `${n.you} for you` : ''].filter(Boolean).join(', ')}`, () => {
      patch('actions', id, fields(picked[0], 0));
      picked.slice(1).forEach((t, i) => put('actions', Object.assign({ id: uid('a'), projectId: a.projectId, milestoneId: a.milestoneId, today: null, done: false, doneAt: null, order: (a.order || 0) + (i + 1) * 0.001, createdAt: nowTs(), updatedAt: nowTs(), runs: [] }, fields(t, i + 1))));
    }, { duration: 9000 });
    delete UI.enh[id]; delete UI.skillSel[id]; delete UI.brief[id]; this.render(true);
  },
  /** Opens the brief: the exact prompt the agent will get, editable and enhanceable before sending. */
  runTask(id) {
    const a = S.actions[id]; if (!a) return;
    const live = (a.runs || []).map(r => Runs.map.get(r.id)).find(r => r && ['starting', 'running', 'waiting'].includes(r.status));
    if (live) return navigate('run', live.id);
    this.open(id);
    setTimeout(() => { const el = $('#dw-brief-t'); if (el) el.focus(); }, 120);
  },
  async enhanceBrief(id) {
    const a = S.actions[id], b = UI.brief[id]; if (!a || !b || b.busy) return;
    b.busy = true; b.steps = []; this.render(true);
    try { const r = await enhancePrompt(a, b.text, st => { b.steps.push(st); if (UI.drawer === id) this.render(true); }); b.text = r.prompt; b.notes = r.notes; b.enhanced = true; }
    catch (e) { toast('The prompt could not be enhanced.', { sub: e.message }); }
    b.busy = false; if (UI.drawer === id) this.render(true);
  },
  async sendBrief(id) {
    const a = S.actions[id], b = UI.brief[id]; if (!a || !b || b.sending) return;
    b.sending = true; this.render(true);
    const c = cmpState('brief:' + id); cmpRemember(c);
    try { const run = await startTaskRun(a, { prompt: b.text, model: c.model, effort: c.effort, perm: c.perm, files: c.files, sessionId: b.session !== 'new' ? b.session : null }); tx(null, () => patch('projects', a.projectId, { sessionPref: b.session === 'new' ? 'new' : run.id })); delete UI.brief[id]; Drawer.close(); navigate('run', run.id); }
    catch (e) { b.sending = false; this.render(true); if (!/Sign in/.test(e.message)) toast('Codex could not start.', { sub: e.message }); }
  },
};
document.addEventListener('focusout', e => {
  const t = e.target;
  if (t.id === 'dw-desc') { const a = S.actions[t.dataset.aid]; if (a && t.value !== (a.description || '')) tx(null, () => patch('actions', a.id, { description: t.value })); setTimeout(() => Drawer.render(), 0); }
});
document.addEventListener('keydown', e => {
  const t = e.target;
  if (t.matches && t.matches('[data-crit]') && e.key === 'Enter') { e.preventDefault(); const a = S.actions[t.dataset.crit]; const v = t.value.trim(); if (a && v) { t.value = ''; tx(null, () => patch('actions', a.id, { criteria: [...(a.criteria || []), { text: v, done: false }] })); setTimeout(() => { Drawer.render(true); $('#dw-crit') && $('#dw-crit').focus(); }, 0); } }
  if (t.id === 'run-input' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); RunView.send(); }
  if (t.id === 'ask-project' && e.key === 'Enter') { e.preventDefault(); const v = t.value.trim(); if (!v) return; t.value = ''; const p = S.projects[UI.projectId]; (c => { const files = c.files.slice(); c.files = []; cmpRemember(c); return Runs.start({ projectId: p.id, kind: 'chat', title: short(v, 60), prompt: v, model: c.model, effort: c.effort, perm: c.perm, files }); })(cmpState('ask:' + p.id)).then(r => navigate('run', r.id)).catch(err => { if (!/Sign in/.test(err.message)) toast('Codex could not start.', { sub: err.message }); }); }
}, true);

/* ================= run view ================= */
function cellHTML(run, it, live) {
  const base = run.cwd;
  switch (it.type) {
    case 'userMessage': { const pt = parseUserText((it.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n')); const fl = it.files && it.files.length ? it.files : pt.files; return `<div class="c-user"><div class="c-user-in">${fl.length ? `<div class="u-files" data-files="1">${fl.map(f => `<button class="cmp-file" data-file="${esc(f)}" title="${esc(f)}">${ic(fileKind(f) === 'image' ? 'image' : 'read')}${esc(short(baseName(f), 30))}</button>`).join('')}</div>` : ''}<div class="bubble prose">${Render.md(pt.text, base)}</div></div></div>`; }
    case 'agentMessage': return `<div class="c-agent prose ${live ? 'streaming' : ''}">${Render.md(it.text || '', base)}</div>`;
    case 'reasoning': { const s = (it.summary || []).join('\n\n'); if (!s.trim() && !live) return ''; const head = s.split('\n')[0].replace(/[*#]/g, '').trim(); return `<details class="c-think" ${live ? 'open' : ''}><summary>${ic('think', live ? 'spin' : '')}<span>${live ? 'Thinking' : 'Thought'}</span><span class="c-dim">${esc(short(head, 80))}</span></summary><div class="prose">${Render.md(s, base)}</div></details>`; }
    case 'plan': return `<div class="c-plan"><div class="fact-l">Plan</div><div class="prose">${Render.md(it.text || '', base)}</div></div>`;
    case 'commandExecution': {
      const st = humanStep(it, base) || { text: it.command };
      if (isExplore(it)) return `<div class="c-row">${ic(st.icon)}<span>${inlineMd(st.text)}</span></div>`;
      const ok = it.status === 'completed' && (it.exitCode == null || it.exitCode === 0);
      const badge = it.status === 'inProgress' ? '<span class="cbadge run">running</span>' : it.status === 'declined' ? '<span class="cbadge bad">not allowed</span>' : ok ? `<span class="cbadge ok">exit 0</span>` : `<span class="cbadge bad">exit ${it.exitCode ?? '?'}</span>`;
      return `<details class="c-cmd"><summary>${ic('run', it.status === 'inProgress' ? 'spin' : '')}<code>${esc(short(cleanCmd(it.command), 140))}</code>${badge}${it.durationMs != null ? `<span class="c-dim mono">${(it.durationMs / 1000).toFixed(1)}s</span>` : ''}</summary>${it.aggregatedOutput ? Render.term(String(it.aggregatedOutput).slice(-20000)) : '<pre class="term c-dim">No output</pre>'}</details>`;
    }
    case 'fileChange': {
      const ch = it.changes || []; let A = 0, D = 0;
      const rows = ch.map(c => { const d = Render.diff(c.diff); A += d.add; D += d.del; const path = c.path.startsWith('/') ? c.path : `${base}/${c.path}`; const k = (c.kind || {}).type; return `<details class="c-file"><summary><span class="fk fk-${k}">${k === 'add' ? 'New' : k === 'delete' ? 'Deleted' : 'Edited'}</span><a class="flink" data-file="${esc(path)}">${esc(relTo(path, base))}</a><span class="mono c-dim"><span class="da">+${d.add}</span> <span class="dd">−${d.del}</span></span></summary>${d.html}</details>`; }).join('');
      return `<div class="c-files"><div class="c-files-h">${ic('edit')}<span>${ch.length === 1 ? '1 file changed' : `${ch.length} files changed`}</span><span class="mono"><span class="da">+${A}</span> <span class="dd">−${D}</span></span>${it.status === 'declined' ? '<span class="cbadge bad">not applied</span>' : ''}</div>${rows}</div>`;
    }
    case 'webSearch': {
      const st = humanStep(it, base); const res = (it.results || []).slice(0, 6);
      return `<div class="c-row web">${ic('web')}<span>${inlineMd(st.text)}</span></div>${res.length ? `<div class="c-links">${res.map(r => { const url = r.url || r.link || ''; const t = r.title || url; return url ? `<a href="${esc(url)}" target="_blank">${esc(short(t, 80))}</a>` : ''; }).join('')}</div>` : ''}`;
    }
    case 'mcpToolCall': {
      const st = humanStep(it, base);
      const content = (it.result && it.result.content) || [];
      const imgs = content.filter(c => c.type === 'image' && c.data);
      const body = content.map(c => c.type === 'text' ? `<div class="prose">${Render.md(short(c.text, 6000), base)}</div>` : c.type === 'image' && c.data ? `<img class="md-img" src="data:${esc(c.mimeType || 'image/png')};base64,${c.data}" alt="">` : c.type === 'resource_link' || c.type === 'resource' ? `<div class="mono c-dim">${esc((c.resource && c.resource.uri) || c.uri || '')}</div>` : '').join('');
      const app = it.mcpAppUi && it.mcpAppUi.resourceUri ? `<div class="mcp-app" data-app="${esc(it.id)}"><div class="c-dim">Loading ${esc(it.server)} view…</div></div>` : '';
      return `${app}<details class="c-tool" ${imgs.length || live ? 'open' : ''}><summary>${ic(st.icon, it.status === 'inProgress' ? 'spin' : '')}<span>${inlineMd(st.text)}</span>${it.status === 'failed' ? '<span class="cbadge bad">failed</span>' : ''}</summary>
        ${it.arguments && Object.keys(it.arguments).length ? codeBlock(JSON.stringify(it.arguments, null, 2).slice(0, 4000), 'json') : ''}${body}${it.error ? `<p class="wnote">${esc(it.error.message)}</p>` : ''}</details>`;
    }
    case 'imageGeneration': {
      const src = it.projectPath || it.savedPath ? fileURL(it.projectPath || it.savedPath) : (it.result && it.result.length > 200 ? `data:image/png;base64,${it.result}` : '');
      if (!src) return `<div class="c-row">${ic('image', live ? 'spin' : '')}<span>${live ? 'Generating an image…' : 'Image generation failed.'}</span></div>`;
      const path = it.projectPath || it.savedPath;
      return `<figure class="c-img">${path ? `<button data-file="${esc(path)}"><img src="${src}" alt=""></button>` : `<img src="${src}" alt="">`}${it.revisedPrompt ? `<figcaption>${esc(it.revisedPrompt)}</figcaption>` : ''}</figure>`;
    }
    case 'imageView': return `<figure class="c-img small"><button data-file="${esc(it.path)}"><img src="${fileURL(it.path)}" alt=""></button><figcaption>${esc(relTo(it.path, base))}</figcaption></figure>`;
    case 'collabAgentToolCall': case 'dynamicToolCall': case 'sleep': { const st = humanStep(it, base); return st ? `<div class="c-row">${ic(st.icon)}<span>${inlineMd(st.text)}</span></div>` : ''; }
    case 'contextCompaction': return `<div class="c-div"><span>Context compacted</span></div>`;
    case 'enteredReviewMode': return `<div class="c-div"><span>Review started</span></div>`;
    case 'exitedReviewMode': return `<div class="c-div"><span>Review finished</span></div>${it.review ? `<div class="c-agent prose">${Render.md(it.review, base)}</div>` : ''}`;
    default: return '';
  }
}
function streamHTML(run) {
  const items = [...(run.items || []), ...[...(run.live || new Map()).values()].filter(l => !(run.items || []).some(i => i.id === l.id))];
  let out = '', grp = null;
  const flush = () => { if (grp) { out += `<details class="c-grp" data-grp="1"><summary>${ic('search')}<span>Explored</span><span class="c-dim grp-n">${grp.length} ${grp.length === 1 ? 'step' : 'steps'}</span></summary><div class="grp-b">${grp.join('')}</div></details>`; grp = null; } };
  items.forEach(it => {
    const live = run.live && run.live.has(it.id);
    const html = `<div class="cell" id="cell-${esc(it.id)}">${cellHTML(run, it, live)}</div>`;
    if (isExplore(it)) { (grp = grp || []).push(html); return; }
    flush(); out += html;
  });
  flush();
  return out;
}
function pendingHTML(run) {
  return (run.pending || []).map(pr => {
    const P = pr.params || {}, rid = esc(String(pr.id));
    const btns = list => `<div class="ap-b">${list.map(([lab, val, cls]) => `<button class="tbtn ${cls || ''}" data-act="appr" data-run="${run.id}" data-req="${rid}" data-val='${esc(JSON.stringify(val))}' data-label="${esc(lab)}">${esc(lab)}</button>`).join('')}</div>`;
    switch (pr.method) {
      case 'item/commandExecution/requestApproval':
        return `<div class="appr">${ic('run')}<div class="ap-m"><b>Codex wants to run a command</b>${P.reason ? `<p>${esc(P.reason)}</p>` : ''}${codeBlock(cleanCmd(P.command) || '(command)', 'bash')}<div class="mono c-dim">in ${esc(relTo(P.cwd, run.cwd) || P.cwd || '')}</div>${btns([['Run it', { decision: 'accept' }, 'primary'], ['Always allow in this run', { decision: 'acceptForSession' }], ["Don't run", { decision: 'decline' }]])}</div></div>`;
      case 'item/fileChange/requestApproval': {
        const live = run.live && run.live.get(P.itemId); const ch = (live && live.changes) || [];
        return `<div class="appr">${ic('edit')}<div class="ap-m"><b>Codex wants to change ${ch.length ? plural(ch.length, 'file') : 'files'}</b>${P.reason ? `<p>${esc(P.reason)}</p>` : ''}${P.grantRoot ? `<p class="mono c-dim">Write access to ${esc(P.grantRoot)}</p>` : ''}${ch.map(c => `<details class="c-file" open><summary>${esc(relTo(c.path, run.cwd))}</summary>${Render.diff(c.diff).html}</details>`).join('')}${btns([['Apply', { decision: 'accept' }, 'primary'], ['Always allow in this run', { decision: 'acceptForSession' }], ["Don't apply", { decision: 'decline' }]])}</div></div>`;
      }
      case 'item/permissions/requestApproval': {
        const perm = {}; if (P.permissions && P.permissions.network) perm.network = P.permissions.network; if (P.permissions && P.permissions.fileSystem) perm.fileSystem = P.permissions.fileSystem;
        return `<div class="appr">${ic('stop')}<div class="ap-m"><b>Codex is asking for more access</b>${P.reason ? `<p>${esc(P.reason)}</p>` : ''}${codeBlock(JSON.stringify(perm, null, 2), 'json')}${btns([['Allow for this step', { permissions: perm, scope: 'turn' }, 'primary'], ['Allow for this run', { permissions: perm, scope: 'session' }], ["Don't allow", { permissions: {}, scope: 'turn' }]])}</div></div>`;
      }
      case 'item/tool/requestUserInput':
        return `<div class="appr ask" data-run="${run.id}" data-req="${rid}">${ic('say')}<div class="ap-m"><b>Codex has a question</b>${(P.questions || []).map(q => `<div class="q" data-q="${esc(q.id)}"><div class="q-h">${esc(q.header || '')}</div><p>${esc(q.question)}</p>${(q.options || []).map((o, i) => `<label class="q-o"><input type="radio" name="q-${rid}-${esc(q.id)}" value="${esc(o.label)}" ${i === 0 ? 'checked' : ''}><span><b>${esc(o.label)}</b>${o.description ? ` — ${esc(o.description)}` : ''}</span></label>`).join('')}${!q.options || q.isOther ? `<input class="q-t" type="${q.isSecret ? 'password' : 'text'}" placeholder="${q.options ? 'Or type your own answer' : 'Your answer'}">` : ''}</div>`).join('')}<div class="ap-b"><button class="tbtn primary" data-act="ask-submit">Send answer</button></div></div></div>`;
      case 'mcpServer/elicitation/request': {
        if (P.mode === 'url') return `<div class="appr">${ic('web')}<div class="ap-m"><b>${esc(P.serverName)} needs you to finish something in the browser</b><p>${esc(P.message || '')}</p><div class="ap-b"><a class="tbtn primary" href="${esc(P.url)}" target="_blank">Open page</a><button class="tbtn" data-act="elicit" data-run="${run.id}" data-req="${rid}" data-v="accept">I'm done</button><button class="tbtn" data-act="elicit" data-run="${run.id}" data-req="${rid}" data-v="decline">Decline</button></div></div></div>`;
        const props = (P.requestedSchema && P.requestedSchema.properties) || {};
        return `<div class="appr elic" data-run="${run.id}" data-req="${rid}">${ic('tool')}<div class="ap-m"><b>${esc(P.serverName)} needs some details</b><p>${esc(P.message || '')}</p>${Object.entries(props).map(([k, s]) => `<label class="el-f"><span>${esc(s.title || k)}</span>${s.enum ? `<select data-k="${esc(k)}">${s.enum.map(v => `<option>${esc(v)}</option>`).join('')}</select>` : s.type === 'boolean' ? `<input type="checkbox" data-k="${esc(k)}" data-t="boolean">` : `<input data-k="${esc(k)}" data-t="${esc(s.type || 'string')}" placeholder="${esc(s.description || '')}">`}</label>`).join('')}<div class="ap-b"><button class="tbtn primary" data-act="elicit" data-run="${run.id}" data-req="${rid}" data-v="accept">Send</button><button class="tbtn" data-act="elicit" data-run="${run.id}" data-req="${rid}" data-v="decline">Decline</button></div></div></div>`;
      }
      default:
        return `<div class="appr">${ic('stop')}<div class="ap-m"><b>Codex is waiting for approval</b>${codeBlock(JSON.stringify(P, null, 2).slice(0, 2000), 'json')}${btns([['Approve', { decision: 'approved' }, 'primary'], ['Deny', { decision: 'denied' }]])}</div></div>`;
    }
  }).join('');
}
function skillOfferHTML(run) {
  if (run.kind !== 'task' || !run.skillOffer || run.skillOffer === 'dismissed') return '';
  const p = S.projects[run.projectId];
  if (run.skillOffer === 'saving') return `<div class="skill-offer">${ic('spark', 'spin')}<div><b>Saving this as a skill…</b><p>Codex is writing down what made this result work, so future outputs match it.</p></div></div>`;
  if (run.skillOffer === 'saved') return `<div class="skill-offer done">${ic('spark')}<div><b>Saved as a skill.</b><p>Codex will reach for it when a task looks like this one. Manage skills on the ${esc(p.name)} page.</p></div></div>`;
  if (run.status !== 'completed') return '';
  return `<div class="skill-offer">${ic('spark')}<div><b>Like how this turned out?</b><p>Save the way Codex made it as a skill. Next time a task looks like this, the output starts at this quality and style.</p>
    <div class="so-f"><input id="skill-hint" placeholder="Name it (optional), e.g. pitch-deck-style" autocomplete="off"></div>
    <div class="ap-b"><button class="tbtn primary" data-act="skill-save" data-id="${run.id}" data-scope="project">Save for ${esc(short(p.name, 24))} only</button><button class="tbtn" data-act="skill-save" data-id="${run.id}" data-scope="global">Save for all projects</button><button class="tbtn" data-act="skill-dismiss" data-id="${run.id}">Not now</button></div></div></div>`;
}
function planHTML(run) {
  const pl = run.plan; if (!pl || !(pl.steps || []).length) return '';
  const done = pl.steps.filter(s => s.status === 'completed').length;
  return `<div class="side-card"><div class="side-h"><span class="eyebrow">Plan</span><span class="mono c-dim">${done}/${pl.steps.length}</span></div>${pl.explanation ? `<p class="c-dim">${esc(pl.explanation)}</p>` : ''}<ul class="plan">${pl.steps.map(s => `<li class="ps-${s.status}"><i></i><span>${esc(s.step)}</span></li>`).join('')}</ul></div>`;
}
function stepsHTML(run) {
  const st = run.steps || [];
  return `<ol class="hsteps" id="hsteps">${st.map((s, i) => `<li class="${s.ok === false ? 'bad' : ''}">${ic(s.icon)}<div><span>${inlineMd(s.text)}</span><time class="mono">${new Date(s.at).toTimeString().slice(0, 5)}</time></div></li>`).join('')}</ol>`;
}
const RunView = {
  visible(run) { return UI.view === 'run' && UI.runId === run.id && UI.ready; },
  raf: new Map(),
  item(run, it, delta) {
    if (!this.visible(run)) return;
    Live.update(run);
    const paint = () => {
      this.raf.delete(it.id);
      const stream = $('#stream'); if (!stream) return;
      const live = run.live && run.live.has(it.id);
      let cell = document.getElementById('cell-' + it.id);
      const html = cellHTML(run, it, live);
      if (!cell) {
        const nearBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 160;
        cell = document.createElement('div'); cell.className = 'cell'; cell.id = 'cell-' + it.id; cell.innerHTML = html;
        if (stream.firstElementChild && stream.firstElementChild.classList.contains('c-dim')) stream.innerHTML = '';
        const last = stream.lastElementChild;
        if (isExplore(it)) {
          if (last && last.matches('[data-grp]')) { $('.grp-b', last).appendChild(cell); const n = $$('.cell', last).length; $('.grp-n', last).textContent = `${n} steps`; }
          else { const g = document.createElement('details'); g.className = 'c-grp'; g.setAttribute('data-grp', '1'); g.innerHTML = `<summary>${ic('search')}<span>Explored</span><span class="c-dim grp-n">1 step</span></summary><div class="grp-b"></div>`; $('.grp-b', g).appendChild(cell); stream.appendChild(g); }
        } else stream.appendChild(cell);
        cell.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.16,1,.3,1)' });
        if (nearBottom) window.scrollTo({ top: document.documentElement.scrollHeight, behavior: RM.matches ? 'auto' : 'smooth' });
      } else {
        const open = $('details', cell); const wasOpen = open ? open.open : null;
        cell.innerHTML = html;
        const nd = $('details', cell); if (nd && wasOpen != null) nd.open = wasOpen;
        if (delta) { const nb = innerHeight + scrollY >= document.documentElement.scrollHeight - 220; if (nb) window.scrollTo(0, document.documentElement.scrollHeight); }
      }
      if (!delta || !live) Render.enhance(cell);
      if (!live && it.type === 'mcpToolCall' && it.mcpAppUi) McpApp.mount(run, it, cell);
    };
    if (delta) { if (!this.raf.has(it.id)) this.raf.set(it.id, requestAnimationFrame(paint)); } else { if (this.raf.has(it.id)) cancelAnimationFrame(this.raf.get(it.id)); paint(); }
  },
  step(run, st) { if (!this.visible(run)) return; Live.update(run); const ol = $('#hsteps'); if (!ol) return; const li = document.createElement('li'); if (st.ok === false) li.className = 'bad'; li.innerHTML = `${ic(st.icon)}<div><span>${inlineMd(st.text)}</span><time class="mono">${new Date(st.at).toTimeString().slice(0, 5)}</time></div>`; ol.appendChild(li); li.animate([{ opacity: 0, transform: 'translateX(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.16,1,.3,1)' }); },
  plan(run) { if (!this.visible(run)) return; Live.update(run); const el = $('#plan-card'); if (el) el.innerHTML = planHTML(run); },
  meta(run) { if (!this.visible(run)) return; const el = $('#cs-usage'); if (el) el.innerHTML = usageHTML(run); },
  refresh(run) { if (this.visible(run)) renderNow(); },
  after() {
    const ta0 = $('#run-input'); if (ta0) { const fit0 = () => { ta0.style.height = 'auto'; ta0.style.height = Math.min(220, ta0.scrollHeight) + 'px'; }; ta0.oninput = fit0; fit0(); }
    if (Pane.tab === 'preview' && Pane.path) renderFileInto(document.getElementById('pane-body'), Pane.path);
    const run = Runs.map.get(UI.runId); if (!run) return;
    Render.enhance($('#stream')); hydrateThumbs(VIEW);
    (run.items || []).filter(it => it.type === 'mcpToolCall' && it.mcpAppUi).forEach(it => { const c = document.getElementById('cell-' + it.id); if (c) McpApp.mount(run, it, c); });
    const ta = $('#run-input'); if (ta) { const fit = () => { ta.style.height = 'auto'; ta.style.height = Math.min(220, ta.scrollHeight) + 'px'; }; ta.oninput = fit; fit(); }
  },
  send() {
    const ta = $('#run-input'); if (!ta) return;
    const v = ta.value.trim(); if (!v) return;
    const key = 'run:' + UI.runId; const c = cmpState(key); const files = c.files.slice(); const task = c.taskId && S.actions[c.taskId];
    const opts = { model: c.model, effort: c.effort, perm: c.perm, files };
    cmpRemember(c);
    const fail = e => { if (!/Sign in/.test(e.message)) toast('Codex could not continue.', { sub: e.message }); };
    if (String(UI.runId).startsWith('new:')) {
      const pid = UI.runId.slice(4); ta.value = ''; delete UI.cmp[key];
      const start = task ? startTaskRun(task, Object.assign({ prompt: v }, opts)) : Runs.start(Object.assign({ projectId: pid, kind: 'chat', title: short(v, 60), prompt: v }, opts));
      start.then(r => { if (S.projects[pid]) tx(null, () => patch('projects', pid, { sessionPref: r.id })); navigate('run', r.id); }).catch(fail);
      return;
    }
    const run = Runs.map.get(UI.runId); if (!run) return;
    ta.value = ''; c.files = []; c.taskId = null;
    let text = v;
    if (task) { Runs.attachTask(run, task); text += `\n\nSave the deliverables for this task in artifacts/${slugify(task.title)}/.`; }
    Runs.send(run, text, opts).then(() => renderNow()).catch(fail);
  },
  async enhanceFollowup() {
    const run = Runs.map.get(UI.runId) || { cwd: (S.projects[String(UI.runId).slice(4)] || {}).dir, title: 'New session', summary: '' }; const ta = $('#run-input'); if (!ta || !ta.value.trim() || ta.disabled) return;
    const orig = ta.value; ta.disabled = true; ta.value = 'Sharpening your message…';
    try {
      const r = await Quick.ask({ cwd: run.cwd, effort: 'low', schema: PROMPT_SCHEMA, prompt: `Rewrite this follow-up message to a coding and knowledge-work agent so it is unambiguous and complete, in the same language. Keep the intent and keep it short. Add missing specifics only when they are clear from the context.\n\nTask: ${run.title}\nLast result: ${short(run.summary || '', 600)}\n\nMessage: ${orig}` });
      ta.value = r.prompt;
    } catch (e) { ta.value = orig; toast('Could not enhance the message.', { sub: e.message }); }
    ta.disabled = false; ta.focus(); ta.dispatchEvent(new Event('input'));
  },
  decide(el) {
    const run = Runs.map.get(el.dataset.run); if (!run) return;
    const reqId = isNaN(+el.dataset.req) ? el.dataset.req : +el.dataset.req;
    let val; try { val = JSON.parse(el.dataset.val); } catch (e) { return; }
    Runs.answer(run, reqId, val, `You chose: ${el.dataset.label}`);
  },
  submitQuestions(el) {
    const box = el.closest('.appr'); const run = Runs.map.get(box.dataset.run); if (!run) return;
    const reqId = isNaN(+box.dataset.req) ? box.dataset.req : +box.dataset.req;
    const answers = {};
    $$('.q', box).forEach(q => { const t = $('.q-t', q); const r = $('input[type=radio]:checked', q); const v = t && t.value.trim() ? t.value.trim() : r ? r.value : ''; answers[q.dataset.q] = { answers: v ? [v] : [] }; });
    Runs.answer(run, reqId, { answers }, `You answered: ${Object.values(answers).map(a => a.answers[0]).filter(Boolean).join('; ')}`);
  },
  elicit(el) {
    const run = Runs.map.get(el.dataset.run); if (!run) return;
    const reqId = isNaN(+el.dataset.req) ? el.dataset.req : +el.dataset.req;
    if (el.dataset.v !== 'accept') return Runs.answer(run, reqId, { action: 'decline', content: null, _meta: null }, 'You declined');
    const box = el.closest('.appr'); const content = {};
    $$('[data-k]', box).forEach(f => { const k = f.dataset.k; content[k] = f.type === 'checkbox' ? f.checked : f.dataset.t === 'number' || f.dataset.t === 'integer' ? Number(f.value) : f.value; });
    Runs.answer(run, reqId, { action: 'accept', content: Object.keys(content).length ? content : null, _meta: null }, 'You sent the requested details');
  },
};

/* ================= MCP Apps (interactive widgets from plugins such as Visualize) ================= */
const McpApp = {
  frames: new Map(),
  async mount(run, it, cell) {
    const holder = $('.mcp-app', cell); if (!holder || holder.dataset.mounted) return;
    holder.dataset.mounted = '1';
    try {
      await Runs.ensureThread(run);
      const r = await Codex.req('mcpServer/resource/read', { threadId: run.threadId, server: it.server, uri: it.mcpAppUi.resourceUri, originCallId: it.id });
      const c = (r.contents || [])[0]; if (!c) throw new Error('empty');
      const html = c.text != null ? c.text : atob(c.blob || '');
      const f = document.createElement('iframe');
      f.className = 'mcp-frame'; f.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups'); f.srcdoc = html;
      holder.innerHTML = ''; holder.appendChild(f);
      this.frames.set(f, { run, it });
    } catch (e) { holder.innerHTML = `<div class="c-dim">This ${esc(it.server)} view could not be shown here.</div>`; }
  },
};
window.addEventListener('message', async ev => {
  const entry = [...McpApp.frames.entries()].find(([f]) => f.contentWindow === ev.source); if (!entry) return;
  const [frame, { run, it }] = entry; const msg = ev.data; if (!msg || typeof msg !== 'object') return;
  const reply = (id, result, error) => frame.contentWindow.postMessage(error ? { jsonrpc: '2.0', id, error: { code: -32000, message: error } } : { jsonrpc: '2.0', id, result }, '*');
  const notify = (method, params) => frame.contentWindow.postMessage({ jsonrpc: '2.0', method, params }, '*');
  try {
    if (msg.method === 'ui/initialize') {
      reply(msg.id, { protocolVersion: (msg.params && msg.params.protocolVersion) || '2025-06-18', hostInfo: { name: 'Crewdex', version: '0.1.0' }, hostCapabilities: { openLinks: {}, serverTools: {}, logging: {} }, hostContext: { theme: isDark() ? 'dark' : 'light', displayMode: 'inline', availableDisplayModes: ['inline'], platform: 'desktop' } });
    } else if (msg.method === 'ui/notifications/initialized') {
      notify('ui/notifications/tool-input', { arguments: it.arguments || {} });
      if (it.result) notify('ui/notifications/tool-result', it.result);
    } else if (msg.method === 'ui/notifications/size-changed') {
      if (msg.params && msg.params.height) frame.style.height = Math.min(1600, Math.max(120, msg.params.height)) + 'px';
    } else if (msg.method === 'tools/call') {
      const r = await Codex.req('mcpServer/tool/call', { threadId: run.threadId, server: it.server, tool: msg.params.name, arguments: msg.params.arguments || {} });
      reply(msg.id, r);
    } else if (msg.method === 'ui/open-link') {
      nat('openURL', { url: msg.params.url }); reply(msg.id, {});
    } else if (msg.method === 'ui/message') {
      const t = ((msg.params && msg.params.content) || []).map(c => c.text).filter(Boolean).join('\n'); if (t) Runs.send(run, t); reply(msg.id, {});
    } else if (msg.id != null && msg.method) reply(msg.id, {});
  } catch (e) { if (msg.id != null) reply(msg.id, null, e.message); }
});

/* ================= project Codex section ================= */
const ProjectCodex = {
  cache: {},
  html(p) {
    const runs = Runs.list(p.id).slice(0, 8);
    const c = this.cache[p.id] || {};
    const pskills = Codex.skills.filter(s => s.scope === 'repo' && p.dir && s.path.startsWith(p.dir + '/'));
    const gskills = Codex.skills.filter(s => s.scope === 'user' && !s.pluginId);
    const permV = p.perm || '';
    return `<section class="pv-sec codex-sec">
      <div class="sec-h"><span class="eyebrow">Codex</span><span class="sec-c">${Codex.account ? 'Works inside this project\'s folder and remembers it' : Codex.ready ? 'Sign in to let Codex work here' : 'Starting…'}</span><button class="linkbtn" data-act="reveal-proj" data-id="${p.id}">Show folder ${ARROW}</button></div>
      <label class="ask-proj"><span>${ic('spark')}</span><input id="ask-project" placeholder="Ask Codex anything about ${esc(p.name)}, or give it a job…" autocomplete="off"></label>
      <div class="ask-bar">${cmpBar('ask:' + p.id, { perm: p.perm || Runs.settings().perm })}</div>
      <div class="cx-grid">
        <div>
          <div class="cx-h"><span class="fact-l">Memory</span><span><button class="linkbtn" data-act="open-memory" data-id="${p.id}">Read</button> · <button class="linkbtn" data-act="edit-memory" data-id="${p.id}">Edit AGENTS.md</button></span></div>
          <div class="prose mem">${c.memory != null ? (c.memory.trim() ? Render.md(c.memory, p.dir) : '<p class="c-dim">Nothing remembered yet. After each task, Codex adds what it learned here.</p>') : '<div class="skel" style="width:70%"></div>'}</div>
        </div>
        <div>
          <div class="cx-h"><span class="fact-l">Runs</span><span class="mono c-dim">${Runs.list(p.id).length}</span></div>
          ${runs.length ? runs.map(r => `<button class="dw-run" data-act="open-run" data-id="${r.id}">${statusPill(r.status)}<span class="dw-run-t">${esc(short(r.title, 60))}<span class="c-dim">${r.summary ? ' — ' + esc(short(firstSentence(r.summary), 90)) : ''}</span></span><span class="mono">${ago(r.startedAt)}</span></button>`).join('') : '<div class="z-empty">No runs yet. Open a task and press Run with Codex.</div>'}
        </div>
      </div>
      ${(outs => `<div class="cx-h" style="margin-top:28px"><span class="fact-l">Final outputs</span><span class="mono c-dim">${outs.length || ''}</span></div>
      ${outs.length ? `<div class="fgrid wide" data-files="1">${outs.slice(0, 12).map(o => fileCard(o.path, { sub: ago(o.at) })).join('')}</div>` : '<div class="z-empty">The files Codex hands over as finished results show up here. Working files stay in the project folder.</div>'}`)(this.outputs(p))}
      <div class="cx-grid" style="margin-top:28px">
        <div><div class="cx-h"><span class="fact-l">Skills for this project</span></div>${pskills.length ? pskills.map(s => `<div class="skill-row"><button class="linkbtn" data-file="${esc(s.path)}">${esc(s.name)}</button><span class="c-dim">${esc(short(s.description, 90))}</span><button class="ibtn" data-act="skill-trash" data-path="${esc(s.path)}" title="Move to Trash">✕</button></div>`).join('') : '<div class="z-empty">None yet. When a result is good, save it as a skill from its run.</div>'}
          ${gskills.length ? `<div class="c-dim" style="margin-top:8px;font-size:12.5px">${plural(gskills.length, 'global skill')} also available: ${gskills.slice(0, 6).map(s => esc(s.name)).join(', ')}</div>` : ''}</div>
        <div><div class="cx-h"><span class="fact-l">How Codex works here</span></div>
          <div class="seg seg-sm">${[['', 'Default'], ['ask', 'Ask first'], ['auto', 'Project folder'], ['full', 'Full access']].map(([v, l]) => `<button class="${permV === v ? 'on' : ''}" data-act="proj-perm" data-v="${v}">${l}</button>`).join('')}</div>
          <p class="c-dim" style="font-size:12.5px;margin:10px 0 0">${p.workspace ? `Code folder: <span class="mono">${esc(relTo(p.workspace))}</span> · <button class="linkbtn" data-act="unlink-ws">Unlink</button>` : `<button class="linkbtn" data-act="link-ws">Link a code folder</button> if this project has a repository somewhere else.`}</p></div>
      </div>
    </section>`;
  },
  /** Only what sessions presented as their results, newest first. */
  outputs(p) {
    const seen = new Set(), out = [];
    Runs.list(p.id).forEach(r => runOutputs(r).forEach(path => { if (!seen.has(path)) { seen.add(path); out.push({ path, at: r.endedAt || r.startedAt }); } }));
    return out;
  },
  async load(p, force) {
    if (!NATIVE || !p.dir) return;
    const c = this.cache[p.id] = this.cache[p.id] || {};
    if (c.loading || (c.at && !force && Date.now() - c.at < 15000)) return;
    c.loading = true;
    Runs.loadProject(p.id);
    const [mem, files] = await Promise.all([nat('readText', { path: p.dir + '/AGENTS.md' }).catch(() => null), nat('list', { path: p.dir + '/artifacts', recursive: true }).catch(() => [])]);
    const m = (mem || '').split(/^## Memory\s*$/m)[1];
    c.memory = m != null ? m.replace(/^_Codex keeps[^\n]*_\s*/m, '') : '';
    c.artifacts = files.filter(f => !f.dir).sort((a, b) => b.mtime - a.mtime);
    c.at = Date.now(); c.loading = false;
    if (UI.view === 'project' && UI.projectId === p.id) renderNow();
  },
  after(p) { this.load(p); hydrateThumbs(VIEW); Render.enhance($('.codex-sec')); },
};

/* ================= settings ================= */
const SettingsData = { plugins: null, mcp: null, at: 0 };
async function loadSettingsData() {
  if (!Codex.ready || Date.now() - SettingsData.at < 20000) return;
  SettingsData.at = Date.now();
  const [pl, mcp] = await Promise.all([Codex.req('plugin/installed', {}).catch(() => null), Codex.req('mcpServerStatus/list', {}).catch(() => null)]);
  SettingsData.plugins = pl ? (pl.marketplaces || []).flatMap(m => m.plugins || []).filter(x => x.installed) : [];
  SettingsData.mcp = mcp ? mcp.data || [] : [];
  Codex.loadSkills();
  if (UI.view === 'settings') renderNow();
}
function vSettings() {
  loadSettingsData();
  const acc = Codex.account; const rate = Codex.rate && Codex.rate.primary;
  const s = S.settings || {}; const perm = s.perm || 'ask';
  const model = Codex.models.find(m => m.id === s.model) || Codex.models.find(m => m.isDefault);
  const efforts = model ? model.supportedReasoningEfforts.map(e => e.reasoningEffort) : [];
  const pl = SettingsData.plugins, mcp = SettingsData.mcp;
  const bySc = sc => Codex.skills.filter(x => x.scope === sc).length;
  return `<div class="set">
    <header class="wk-h"><div><div class="eyebrow rise">Settings</div><h1 class="wk-title rise" style="--i:1">Crewdex</h1><p class="wk-sub rise" style="--i:2">Codex, with a crew.</p></div></header>
    <section class="set-sec"><h2>Codex account</h2>
      ${acc ? `<div class="set-row"><div><b>${esc(acc.email || (acc.type === 'apiKey' ? 'API key' : 'Signed in'))}</b><div class="c-dim">${esc(acc.planType ? acc.planType + ' plan' : acc.type)}</div></div><button class="tbtn" data-act="logout">Sign out</button></div>` : `<div class="set-row"><div><b>Not signed in</b><div class="c-dim">Crewdex needs Codex to enhance and run tasks.</div></div><button class="tbtn primary" data-act="signin">Sign in</button></div>`}
      ${rate ? `<div class="set-row"><div style="flex:1"><div class="c-dim">Usage this ${rate.windowDurationMins >= 10080 ? 'week' : rate.windowDurationMins >= 1440 ? 'day' : 'window'}</div><div class="meter-l"><i style="width:${Math.min(100, rate.usedPercent)}%"></i></div></div><span class="mono">${rate.usedPercent}% used${rate.resetsAt ? ` · resets ${new Date(rate.resetsAt * 1000).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}` : ''}</span></div>` : ''}
    </section>
    <section class="set-sec"><h2>How Codex works</h2>
      <div class="set-opts">${Object.entries(PERMS).map(([k, v]) => `<button class="set-opt ${perm === k ? 'on' : ''}" data-act="set-perm" data-v="${k}"><b>${v.label}</b><span>${k === 'ask' ? 'Codex edits inside the project folder and asks before commands or changes outside it.' : k === 'auto' ? 'Codex works without asking, but can only write inside the project folder.' : 'No sandbox and no questions. Use only when you trust the task.'}</span></button>`).join('')}</div>
      <div class="set-row"><div><b>Enhance prompts automatically</b><div class="c-dim">When Dex dispatches agents without you reviewing the brief, sharpen each prompt first. Uses a little more Codex.</div></div><button class="tbtn ${S.settings.autoEnhance ? 'primary' : ''}" data-act="set-auto-enh">${S.settings.autoEnhance ? 'On' : 'Off'}</button></div>
      <p class="c-dim">Model and reasoning level are chosen per chat, right in each composer, the same way as in the Codex app. A new chat starts from your last choice.</p>
    </section>
    <section class="set-sec"><h2>What Codex can use</h2>
      <p class="c-dim">Crewdex runs the same Codex engine and settings as the Codex app (<span class="mono">${esc(Codex.home || '~/.codex')}</span>), so everything you enable there works here: plugins, skills, MCP servers, web search, the browser, Computer Use, and image generation.</p>
      <div class="cap-grid">
        <div><div class="fact-l">Plugins</div>${pl ? pl.map(x => `<div class="capr"><span class="acct-dot ${x.enabled ? 'ok' : ''}"></span>${esc(x.interface && x.interface.displayName || x.name)}</div>`).join('') || '<div class="c-dim">None installed</div>' : '<div class="skel" style="width:60%"></div>'}</div>
        <div><div class="fact-l">Tool servers</div>${mcp ? mcp.map(x => `<div class="capr"><span class="acct-dot ok"></span>${esc(SERVER_NAMES[x.name] && x.name !== 'browser' ? SERVER_NAMES[x.name].replace(/^a /, '') : x.name)}<span class="c-dim mono">${Object.keys(x.tools || {}).length} tools</span></div>`).join('') : '<div class="skel" style="width:60%"></div>'}</div>
        <div><div class="fact-l">Skills</div><div class="capr">${bySc('repo')} in projects</div><div class="capr">${bySc('user')} global and from plugins</div><div class="capr">${bySc('system')} built into Codex</div><p class="c-dim" style="font-size:12px">Global skills you save live in <span class="mono">~/.agents/skills</span>. Project skills live in each project's <span class="mono">.agents/skills</span>.</p></div>
      </div>
    </section>
    <section class="set-sec"><h2>Bring in work from Codex</h2>
      <div class="set-row"><div><b>Import from Codex history</b><div class="c-dim">Dex looks for projects in sessions that aren't in Crewdex yet. Run it whenever you've started something new.</div></div><button class="tbtn primary" data-nav="import">Look through sessions</button></div>
    </section>
    <section class="set-sec"><h2>Where your projects live</h2>
      <div class="set-row"><div><span class="mono">${esc(Store.root || '')}</span><div class="c-dim">Each project is a folder with its tasks, AGENTS.md memory, run history, outputs and skills.</div></div><span><button class="tbtn" data-act="reveal-root">Show in Finder</button> <button class="tbtn" data-act="pick-root">Change…</button></span></div>
      <div class="set-row"><div><span class="mono">${esc(Codex.bin || 'Codex not found')}</span><div class="c-dim">${Codex.ready ? 'Codex is running.' : esc(Codex.error || 'Codex is starting.')}</div></div><span><button class="tbtn" data-act="codex-restart">Restart Codex</button> <button class="tbtn" data-act="pick-codex">Choose…</button></span></div>
    </section>
  </div>`;
}
document.addEventListener('change', e => {
  if (e.target.id === 'set-model') { saveSettings({ model: e.target.value || null, effort: null }); renderNow(); }
  if (e.target.id === 'set-effort') { saveSettings({ effort: e.target.value || null }); }
});
window.openSettings = () => navigate('settings');

/* ================= example portfolio ================= */
function loadExample() {
  const d = exampleSeed(todayISO());
  tx(null, () => {
    Object.values(d.projects).forEach(p => put('projects', Object.assign({}, p, { dir: projectDirFor(p.name) })));
    Object.values(d.milestones).forEach(m => put('milestones', m));
    Object.values(d.actions).forEach(a => put('actions', a));
  });
  renderNow({ entering: true });
  toast('Example portfolio added. Each project now has its own folder.', { actions: [{ label: 'Show folders', run: () => nat('reveal', { path: Store.root }) }] });
}

/* ================= self-test hooks (used by `BEARING_SELFTEST`, harmless otherwise) ================= */
window.__route = r => {
  if (r.startsWith('run:')) { const k = r.slice(4); const run = k === 'last' ? [...Runs.map.values()].sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''))[0] : Runs.map.get(k); if (run) navigate('run', run.id); return; }
  if (r.startsWith('task:')) { const a = Object.values(S.actions).find(x => x.title === r.slice(5)) || S.actions[r.slice(5)]; if (a) { navigate('project', a.projectId); setTimeout(() => Drawer.open(a.id), 300); } return; }
  if (r === 'stage:demo') { const run = [...Runs.map.values()].sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''))[0]; if (run) Runs.hydrate(run).then(() => { run.status = 'running'; run.plan = { steps: [{ step: 'Read the project memory', status: 'completed' }, { step: 'Run the comparison script', status: 'inProgress' }, { step: 'Write the summary', status: 'pending' }] }; run.live = new Map([['x1', { type: 'commandExecution', id: 'x1', command: "/bin/zsh -lc 'python compare_snlik.py --year 2024'", commandActions: [{ type: 'unknown', command: 'python' }], status: 'inProgress', aggregatedOutput: 'loading…' }]]); navigate('run', run.id); setTimeout(() => renderNow(), 300); }); return; }
  if (r.startsWith('pname:')) { const pj = Object.values(S.projects).find(x => x.name.toLowerCase().includes(r.slice(6).toLowerCase())); if (pj) navigate('project', pj.id); return; }
  if (r.startsWith('runof:')) { const pj = Object.values(S.projects).find(x => x.name.toLowerCase().includes(r.slice(6).toLowerCase())); if (pj) Runs.loadProject(pj.id).then(() => { const rr = Runs.list(pj.id).find(x => /codex-file-citation/.test(x.summary || '')) || Runs.list(pj.id)[0]; if (rr) navigate('run', rr.id); }); return; }
  if (r.startsWith('preview:')) { const rr = Runs.map.get(UI.runId); const o = rr && runOutputs(rr)[+r.slice(8) || 0]; if (o) Pane.open(o); return; }
  if (r.startsWith('newof:')) { const pj = Object.values(S.projects).find(x => x.name.toLowerCase().includes(r.slice(6).toLowerCase())); if (pj) navigate('run', 'new:' + pj.id); return; }
  if (r === 'office:pods') { navigate('office'); setTimeout(() => window.scrollTo(0, 760), 600); return; }
  if (r.startsWith('brief:')) { const a = Object.values(S.actions).find(x => x.title === r.slice(6)); if (a) { navigate('project', a.projectId); setTimeout(() => Drawer.runTask(a.id), 300); } return; }
  if (r.startsWith('p-')) return navigate('project', r.slice(2));
  Drawer.close && UI.drawer && Drawer.close();
  navigate(r);
};
window.__selftest = async () => {
  const rep = { errors: [] };
  window.addEventListener('error', e => rep.errors.push(String(e.message)));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  for (let i = 0; i < 40 && !(Codex.ready || Codex.error); i++) await wait(500);
  rep.store = { mode: Store.mode, root: Store.root, projects: projects().length };
  rep.model = Object.values(S.projects).map(p => `${p.name}: ${p.phases.length} phases, meta ${(p.phaseMeta || []).length}, groups ${msOf(p.id).length} (unassigned ${msOf(p.id).filter(m => !p.phaseMeta.some(x => x.id === m.phaseId)).length}), tasks ${actsOf(p.id).length}`);
  rep.codex = { ready: Codex.ready, error: Codex.error, bin: Codex.bin, signedIn: !!Codex.account, plan: Codex.account && Codex.account.planType, models: Codex.models.length, skills: Codex.skills.length, skillCreator: !!Runs.skillCreator() };
  if (!projects().length && await nat('readText', { path: Store.root + '/.selftest-example' }).catch(() => null)) { loadExample(); await wait(1500); rep.store.projectsAfterExample = projects().length; }
  const p = projects()[0];
  if (p) { await Store.flush(); await wait(800); rep.files = { projectJson: !!(await nat('readText', { path: p.dir + '/.crewdex/project.json' })), agents: ((await nat('readText', { path: p.dir + '/AGENTS.md' })) || '').slice(0, 400) }; }
  if (await nat('readText', { path: Store.root + '/.selftest-import' }).catch(() => null)) {
    await Importer.scan();
    rep.importScan = { stage: IMP.stage, error: IMP.error, threads: IMP.threads.length, skipped: IMP.skipped.length, proposals: IMP.proposals.map(p => ({ name: p.name, kind: p.kind, n: p.sessionIds.length, conf: p.confidence, existing: p.existingProjectId })) };
    if (IMP.stage === 'review' && IMP.proposals.length) {
      const first = IMP.proposals.slice().sort((a, b) => b.sessionIds.length - a.sessionIds.length)[0];
      IMP.proposals.forEach(p => IMP.sel[p.key].on = p === first);
      await Importer.run();
      const r = IMP.results[0] || {};
      const p = r.projectId && S.projects[r.projectId];
      rep.importRun = { results: IMP.results, log: IMP.log.map(l => l.text).slice(-8) };
      if (p) {
        rep.imported = { project: p.name, thesis: p.thesis, phases: p.phases, phase: p.phase, focus: p.focus, workspace: p.workspace, milestones: msOf(p.id).map(m => `${m.done ? '[x]' : '[ ]'} ${m.date} ${m.title}`), actions: actsOf(p.id).map(a => `${a.done ? '[x]' : '[ ]'} ${a.title}`).slice(0, 25),
          memory: (((await nat('readText', { path: p.dir + '/AGENTS.md' })) || '').split('## Memory')[1] || '').slice(0, 1200), history: ((await nat('readText', { path: p.dir + '/.crewdex/HISTORY.md' })) || '').slice(0, 1200) };
        const run = Runs.list(p.id)[0];
        if (run) { await Runs.hydrate(run); rep.imported.firstRun = { title: run.title, items: (run.items || []).length, steps: (run.steps || []).slice(0, 8).map(s => s.text) }; }
      }
    }
  }
  if (await nat('readText', { path: Store.root + '/.selftest-enhance' }).catch(() => null)) {
    try { const a = Object.values(S.actions).find(x => x.title === 'Prepare validation deck'); const r = await enhancePrompt(a, buildPrompt(a)); rep.enhance = { prompt: r.prompt, notes: r.notes }; } catch (e) { rep.enhance = { error: e.message }; }
  }
  if (await nat('readText', { path: Store.root + '/.selftest-hold' }).catch(() => null)) {
    const le = Object.values(S.projects).find(p => /LESTARI/.test(p.name)); const nu = Object.values(S.projects).find(p => /Nusa/.test(p.name));
    if (le && !isHeld(le)) tx(null, () => patch('projects', le.id, { status: 'On hold', heldAt: nowTs() }));
    if (nu && msOf(nu.id).length < 6) tx(null, () => { ['Menuntaskan footfall dan integrasi Locus untuk kota baru', 'Persona hingga swarm Balikpapan teruji end to end', 'Laporan lokal Crispy Coco tersedia untuk klien'].forEach((t, i) => put('milestones', { id: uid('m'), projectId: nu.id, title: t, date: addDays(todayISO(), 13 + i * 2), done: false, doneAt: null, createdAt: nowTs(), updatedAt: nowTs() })); });
    await wait(600); rep.hold = { active: projects().map(p => p.name), held: heldProjects().map(p => p.name) };
  }
  if (await nat('readText', { path: Store.root + '/.selftest-breakdown' }).catch(() => null)) {
    try {
      const a = Object.values(S.actions).find(x => x.title === 'Shortlist 3 pilot partners');
      const r = await enhanceTask(a); UI.enh[a.id] = r;
      rep.breakdown = { summary: r.summary, tasks: r.tasks.map(t => `[${t.who}] ${t.title} (due ${t.due}, ${t.size}) — ${t.reason}`), questions: r.questions };
      Drawer.applyEnh(a.id); await wait(600);
      rep.afterApply = actsOf(a.projectId).filter(x => x.from === 'Shortlist 3 pilot partners' || x.id === a.id).map(x => `${x.who} | ${x.bucket}${x.due ? ' | ' + x.due : ''} | ${x.title}`);
      rep.dexDispatchable = dexInsights().list.filter(i => i.kind === 'dispatch').map(i => i.text);
    } catch (e) { rep.breakdown = { error: e.message }; }
  }
  if (await nat('readText', { path: Store.root + '/.selftest-dates' }).catch(() => null)) {
    const t = todayISO(); const ps = projects(); rep.order = ps.map(p => `${p.name}:${openCount(p.id)}`);
    const set = (p, i, f) => { const a = actsOf(p.id).filter(x => !x.done)[i]; if (a) patch('actions', a.id, f); };
    tx(null, () => { const p = ps[0]; set(p, 0, { start: addDays(t, -5), due: addDays(t, 6) }); set(p, 1, { start: t, due: null }); set(p, 2, { start: addDays(t, -12), due: addDays(t, -2) }); set(p, 3, { start: addDays(t, 8), due: addDays(t, 24) }); set(p, 4, { start: addDays(t, -30), due: null }); if (ps[1]) { set(ps[1], 0, { start: addDays(t, 2), due: addDays(t, 4) }); } });
    await wait(500);
  }
  const want = (await nat('readText', { path: Store.root + '/.selftest-run' }).catch(() => null)) || '';
  if (want.trim() && Codex.account) {
    try {
      const proj = projects()[0];
      const a = createAction({ projectId: proj.id, title: want.trim(), bucket: 'commit' });
      const run = await Runs.start({ projectId: proj.id, taskId: a.id, kind: 'task', prompt: `Task: ${a.title}`, perm: 'auto', model: 'gpt-6-luna', effort: 'low', files: [proj.dir + '/AGENTS.md'] });
      navigate('run', run.id);
      for (let i = 0; i < 360 && ['starting', 'running', 'waiting'].includes(run.status); i++) { await wait(500); if (run.status === 'waiting') (run.pending || []).forEach(pr => Runs.answer(run, pr.id, autoDecline(pr.method))); }
      await wait(1500);
      const dir = Runs.dirOf(run);
      rep.run = { status: run.status, error: run.error, steps: (run.steps || []).map(s => s.text), artifacts: run.artifacts, summary: run.summary && run.summary.slice(0, 400), skillOffer: run.skillOffer,
        stepsMd: ((await nat('readText', { path: dir + '/steps.md' })) || '').slice(0, 1500), history: ((await nat('readText', { path: S.projects[run.projectId].dir + '/.crewdex/HISTORY.md' })) || '').slice(-800),
        events: ((await nat('readText', { path: dir + '/events.jsonl' })) || '').split('\n').filter(Boolean).length, memory: (((await nat('readText', { path: S.projects[run.projectId].dir + '/AGENTS.md' })) || '').split('## Memory')[1] || '').slice(0, 600) };
    } catch (e) { rep.run = { error: e.message }; }
  }
  return JSON.stringify(rep, null, 2);
};


/* ================= Dex, avatars, momentum faces ================= */
function avatar(name, tone, size = 34) {
  const t = TONES.includes(tone) ? tone : 'graphite';
  const ch = (String(name || '?').trim().match(/[A-Za-z0-9]/) || ['?'])[0].toUpperCase();
  return `<span class="avatar" style="--pc:var(--${t});--s:${size}px" aria-hidden="true">${esc(ch)}</span>`;
}
function moFace(key) {
  const ink = 'var(--pc,var(--fg))';
  const f = {
    strong: `<path d="M5.2 7.4q1.2-1.6 2.4 0M8.4 7.4q1.2-1.6 2.4 0" stroke="${ink}" stroke-width="1.1" fill="none" stroke-linecap="round"/><path d="M5.6 9.6q2.4 2.4 4.8 0" stroke="${ink}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`,
    steady: `<circle cx="6.2" cy="7.2" r=".9" fill="${ink}"/><circle cx="9.8" cy="7.2" r=".9" fill="${ink}"/><path d="M6.2 10q1.8 1.2 3.6 0" stroke="${ink}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`,
    slowing: `<path d="M5.3 7.4h1.8M8.9 7.4h1.8" stroke="${ink}" stroke-width="1.1" stroke-linecap="round"/><path d="M6.4 10.2h3.2" stroke="${ink}" stroke-width="1.1" stroke-linecap="round"/>`,
    stalled: `<path d="M5.3 7.6q.9.8 1.8 0M8.9 7.6q.9.8 1.8 0" stroke="${ink}" stroke-width="1.1" fill="none" stroke-linecap="round"/><circle cx="8" cy="10.3" r=".9" fill="none" stroke="${ink}" stroke-width="1"/><text x="12.2" y="4.6" font-size="4.6" font-family="var(--f-ui)" font-weight="800" fill="${ink}">z</text>`,
  }[key] || '';
  return `<svg class="face face-${key}" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.6" fill="color-mix(in oklab, var(--pc,var(--fg)) 16%, var(--raise))" stroke="${ink}" stroke-width="1.1"/>${f}</svg>`;
}


/* ================= prompts: build, enhance, send ================= */
function taskPrompt(t) { return `Task: ${t.title}\n\n${t.description || ''}${(t.acceptance || []).length ? `\n\nDone when:\n${t.acceptance.map(x => '- ' + x).join('\n')}` : ''}`.trim(); }
function buildPrompt(a) {
  const crit = (a.criteria || []).filter(c => !c.done).map(c => `- ${c.text}`).join('\n');
  return `Task: ${a.title}\n${a.description ? `\n${a.description}\n` : ''}${crit ? `\nDone when:\n${crit}\n` : ''}${a.due ? `\nDue: ${a.due}\n` : ''}`.trim();
}
const PROMPT_SCHEMA = { type: 'object', additionalProperties: false, required: ['prompt', 'notes'], properties: { prompt: { type: 'string', description: 'The improved prompt, ready to send.' }, notes: { type: 'array', items: { type: 'string' }, description: 'Up to 3 short notes on what was added or clarified.' } } };
async function enhancePrompt(a, text, onStep) {
  const p = S.projects[a.projectId]; const ms = a.milestoneId && S.milestones[a.milestoneId];
  const prompt = `You are preparing a brief for another Codex agent that will carry out a task in this project folder. Rewrite the draft below into an excellent prompt, in the same language as the draft.\n\nA great brief states: the goal and why it matters, the relevant context from this project (read AGENTS.md and .crewdex/HISTORY.md here; cite concrete facts, files and earlier outputs), scope and constraints, the deliverables with file names and where to save them, how to verify the result, and what "done" means. Keep it tight: no filler, no invented facts, no steps the agent would do anyway. If something essential is unknown, tell the agent to make a sensible choice and state it.\n\nProject: ${p.name} — ${p.thesis || ''}\nDeliverables folder: artifacts/${slugify(a.title)}/\n\nDraft:\n${text}`;
  return Quick.ask({ cwd: p.dir, prompt, schema: PROMPT_SCHEMA, onStep, effort: 'medium' });
}
/** Starts a task run. With no prompt given it builds one, and sharpens it first when auto-enhance is on. */
async function startTaskRun(a, { prompt, quiet, model, effort, perm, files, sessionId } = {}) {
  if (model === undefined) { model = S.settings.lastModel || ''; effort = S.settings.lastEffort || ''; }
  let text = prompt || buildPrompt(a);
  if (!prompt && S.settings.autoEnhance) { try { text = (await enhancePrompt(a, text)).prompt; } catch (e) { } }
  const p = S.projects[a.projectId];
  const sel = UI.skillSel[a.id] || new Set(Drawer.skillMatches(a).filter(x => x.s.scope === 'repo' || x.s.name === a.skillHint).map(x => x.s.path));
  const skills = Codex.skills.filter(s => sel.has(s.path));
  const old = sessionId && Runs.map.get(sessionId);
  if (old) { await Runs.hydrate(old); Runs.attachTask(old, a); await Runs.send(old, text + `\n\nSave the deliverables for this task in artifacts/${slugify(a.title)}/.`, { skills, model, effort, perm, files: files || [] }); return old; }
  return Runs.start({ projectId: a.projectId, taskId: a.id, kind: 'task', prompt: text, skills, model, effort, perm, files: files || [] });
}

/* ================= Dex: natural-language orchestration ================= */
async function codexOps(q, { allowRun = false } = {}) {
  const data = {
    today: todayISO(), weekStarts: planWeek(),
    projects: projects().map(p => ({ id: p.id, name: p.name, agent: agentName(p), momentum: momentum(p).key, milestones: msOf(p.id).map(m => ({ id: m.id, title: m.title, date: m.date, done: m.done })) })),
    openActions: Object.values(S.actions).filter(a => liveAction(a) && !a.done).slice(0, 160).map(a => ({ id: a.id, title: a.title, projectId: a.projectId, milestoneId: a.milestoneId, list: a.bucket, state: a.state, due: a.due }))
  };
  const schema = clone(OPS_SCHEMA); schema.properties.ops.items.properties.op.enum = [...schema.properties.ops.items.properties.op.enum, ...(allowRun ? ['run_task'] : [])];
  const prompt = `You are Dex, the orchestrator of a personal project tracker with one Codex agent per project. Turn the instruction into operations.\nData (JSON): ${JSON.stringify(data)}\nInstruction: "${q}"\nReply with JSON: {"summary": one short sentence of what you did, "ops": [...]}. Each op has every field; use null for fields that don't apply. Ops:\n- move_milestone (milestoneId, date YYYY-MM-DD)\n- add_action (projectId, title, list commit|room|backlog, state later|waiting|someday|idea|null, due, milestoneId)\n- complete_action (actionId)\n- set_list (actionId, list, state)\n- open_project (projectId)\n- show_actions (actionIds)${allowRun ? '\n- run_task (actionId): hand this action to the project\'s agent to carry out now. Use it only when the instruction asks for work to be done. At most 4.' : ''}\n"commit" means this week. Use only ids from the data.`;
  const res = await Quick.ask({ cwd: Store.root, prompt, schema, effort: 'low' });
  const ops = Array.isArray(res.ops) ? res.ops : []; const isDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d || '');
  const edits = ops.filter(o => (o.op === 'add_action' && S.projects[o.projectId] && o.title) || ((o.op === 'complete_action' || o.op === 'set_list') && S.actions[o.actionId]));
  let t = null;
  if (edits.length) t = tx(null, () => edits.forEach(o => {
    if (o.op === 'add_action') createAction({ projectId: o.projectId, title: o.title, bucket: ['commit', 'room', 'backlog'].includes(o.list) ? o.list : 'commit', state: o.state, due: isDate(o.due) ? o.due : null, milestoneId: S.milestones[o.milestoneId] ? o.milestoneId : null });
    else if (o.op === 'complete_action') { const a = S.actions[o.actionId]; if (!a.done) toggleDone(a); }
    else setBucket(S.actions[o.actionId], ['commit', 'room', 'backlog'].includes(o.list) ? o.list : 'backlog', o.state);
  }));
  ops.filter(o => o.op === 'move_milestone' && S.milestones[o.milestoneId] && isDate(o.date)).forEach(o => moveMilestone(o.milestoneId, o.date));
  let started = 0;
  if (allowRun) for (const o of ops.filter(o => o.op === 'run_task' && S.actions[o.actionId]).slice(0, 4)) { try { await startTaskRun(S.actions[o.actionId], { quiet: true }); started++; } catch (e) { toast('An agent could not start.', { sub: e.message }); break; } }
  const open = ops.find(o => o.op === 'open_project' && S.projects[o.projectId]); if (open) navigate('project', open.projectId);
  return { summary: (res.summary || 'Done.') + (started ? ` ${started} agent${started === 1 ? '' : 's'} started.` : ''), undo: t ? () => undoTx(t) : null, shows: ops.filter(o => o.op === 'show_actions').flatMap(o => o.actionIds || []).map(id => S.actions[id]).filter(Boolean) };
}
document.addEventListener('input', e => { const t = e.target; if (t.dataset && t.dataset.brief && UI.brief[t.dataset.brief]) UI.brief[t.dataset.brief].text = t.value; });


/* ================= composer controls: model, reasoning, access and attachments, per chat ================= */
function cmpState(key, d = {}) {
  if (!UI.cmp[key]) UI.cmp[key] = { model: d.model !== undefined ? d.model : (S.settings.lastModel || ''), effort: d.effort !== undefined ? d.effort : (S.settings.lastEffort || ''), perm: d.perm || 'ask', files: [] };
  return UI.cmp[key];
}
function cmpRemember(c) { if (S.settings.lastModel !== c.model || S.settings.lastEffort !== c.effort) saveSettings({ lastModel: c.model, lastEffort: c.effort }); }
function cmpBar(key, d) {
  const c = cmpState(key, d);
  const def = Codex.models.find(m => m.isDefault);
  const model = Codex.models.find(m => m.id === c.model) || def;
  const efforts = model ? model.supportedReasoningEfforts.map(e => e.reasoningEffort) : [];
  if (c.effort && !efforts.includes(c.effort)) c.effort = '';
  const cap = e => e.charAt(0).toUpperCase() + e.slice(1);
  return `<div class="cmp" data-cmp="${esc(key)}">
    ${c.files.length ? `<div class="cmp-files" data-files="1">${c.files.map((f, i) => `<span class="cmp-file" title="${esc(f)}">${fileKind(f) === 'image' ? `<img src="${fileURL(f)}" alt="">` : ic('read')}<button class="cmp-fn" data-file="${esc(f)}">${esc(short(baseName(f), 28))}</button><button class="cmp-x" data-act="cmp-unattach" data-key="${esc(key)}" data-i="${i}" aria-label="Remove">✕</button></span>`).join('')}</div>` : ''}
    <div class="cmp-row">
      <button class="cmp-btn" data-act="cmp-attach" data-key="${esc(key)}" title="Attach files, images or folders" aria-label="Attach"><svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
      <label class="cmp-pill" title="Model for this chat"><select data-cmpf="model" data-key="${esc(key)}"><option value="">${def ? esc(def.displayName) : 'Default model'}</option>${Codex.models.filter(m => !m.isDefault).map(m => `<option value="${esc(m.id)}" ${c.model === m.id ? 'selected' : ''}>${esc(m.displayName)}</option>`).join('')}</select></label>
      <label class="cmp-pill" title="Reasoning level for this chat"><select data-cmpf="effort" data-key="${esc(key)}"><option value="">${model ? cap(model.defaultReasoningEffort || 'default') : 'Default'}</option>${efforts.filter(e => !model || e !== model.defaultReasoningEffort).map(e => `<option value="${esc(e)}" ${c.effort === e ? 'selected' : ''}>${cap(e)}</option>`).join('')}</select></label>
      <label class="cmp-pill" title="What the agent may do"><select data-cmpf="perm" data-key="${esc(key)}">${[['ask', 'Ask first'], ['auto', 'Project folder'], ['full', 'Full access']].map(([v, l]) => `<option value="${v}" ${c.perm === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    </div></div>`;
}
function cmpRefresh(key) { if (key.startsWith('brief:')) Drawer.render(true); else { const el = document.querySelector(`.cmp[data-cmp="${CSS.escape(key)}"]`); if (el) el.outerHTML = cmpBar(key); } }
document.addEventListener('change', e => { const t = e.target; if (t.dataset && t.dataset.briefsess && UI.brief[t.dataset.briefsess]) UI.brief[t.dataset.briefsess].session = t.value; });
document.addEventListener('change', e => {
  const t = e.target; if (!t.dataset || !t.dataset.cmpf) return;
  const c = cmpState(t.dataset.key); c[t.dataset.cmpf] = t.value;
  if (t.dataset.cmpf === 'model') { c.effort = ''; cmpRefresh(t.dataset.key); }
});

document.addEventListener('input', e => { const t = e.target; if (t.dataset && t.dataset.enh && UI.enh[t.dataset.enh]) { const x = UI.enh[t.dataset.enh].tasks[+t.dataset.i]; if (x) x.title = t.value; } });
