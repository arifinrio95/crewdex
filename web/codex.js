"use strict";
/* Codex engine: a JSON-RPC client for `codex app-server`, run bookkeeping on disk,
   and a translator that turns every Codex item into a plain-language step. */

/* ================= client ================= */
const Codex = {
  ready: false, error: null, id: 0, pend: new Map(), handlers: {}, account: null, needsAuth: false,
  models: [], skills: [], rate: null, bin: null, home: null, loaded: new Set(), restarts: 0, starting: null, login: null,
  boot() {
    window.__codexIn = line => this.onLine(line);
    window.__codexExit = (code, tail) => this.onExit(code, tail);
    return this.start();
  },
  start() {
    if (this.starting) return this.starting;
    this.starting = (async () => {
      try {
        this.bin = await nat('codex.start');
        const r = await this.req('initialize', { clientInfo: { name: 'crewdex', title: 'Crewdex', version: '0.1.0' }, capabilities: { experimentalApi: true, requestAttestation: false } });
        this.home = r.codexHome; this.notify('initialized', {});
        this.ready = true; this.error = null; this.loaded.clear();
        await this.refreshAccount();
        this.loadModels(); this.loadSkills();
        this.req('account/rateLimits/read', {}).then(r => { this.rate = r.rateLimits || r; CodexUI.status(); }).catch(() => { });
      } catch (e) { this.ready = false; this.error = e.message || String(e); }
      this.starting = null; CodexUI.status();
      return this.ready;
    })();
    return this.starting;
  },
  async ensure() { if (this.ready) return true; await this.start(); if (!this.ready) throw new Error(this.error || 'Codex is not running.'); return true; },
  onLine(line) {
    let m; try { m = JSON.parse(line); } catch (e) { return; }
    if (m.id != null && !m.method) {
      const p = this.pend.get(m.id); if (!p) return; this.pend.delete(m.id);
      if (m.error) p.rej(Object.assign(new Error(m.error.message || 'Codex error'), { code: m.error.code, data: m.error.data })); else p.res(m.result);
      return;
    }
    if (m.id != null && m.method) return Runs.onServerRequest(m);
    const fns = this.handlers[m.method]; if (fns) fns.forEach(fn => { try { fn(m.params || {}); } catch (e) { console.error(m.method, e); } });
    Runs.onNotification(m.method, m.params || {});
  },
  onExit(code, tail) {
    this.ready = false;
    for (const [, p] of this.pend) p.rej(new Error('Codex stopped.'));
    this.pend.clear(); this.loaded.clear();
    Runs.onDisconnect();
    CodexUI.status();
    if (this.restarts < 3) { this.restarts++; setTimeout(() => this.start(), 1200 * this.restarts); }
    else toast('Codex stopped and could not restart.', { sub: (tail || '').split('\n').filter(Boolean).slice(-1)[0] || 'Open Settings to check the Codex path.' });
  },
  req(method, params) {
    return new Promise((res, rej) => {
      const id = ++this.id; this.pend.set(id, { res, rej });
      nat('codex.send', { line: JSON.stringify({ id, method, params }) }).catch(e => { this.pend.delete(id); rej(e); });
    });
  },
  notify(method, params) { nat('codex.send', { line: JSON.stringify({ method, params }) }); },
  respond(id, result) { nat('codex.send', { line: JSON.stringify({ id, result }) }); },
  respondError(id, message) { nat('codex.send', { line: JSON.stringify({ id, error: { code: -32000, message } }) }); },
  on(method, fn) { (this.handlers[method] = this.handlers[method] || []).push(fn); },

  async refreshAccount() {
    try { const r = await this.req('account/read', {}); this.account = r.account || null; this.needsAuth = !r.account && r.requiresOpenaiAuth !== false; }
    catch (e) { this.account = null; }
    CodexUI.status();
  },
  async loadModels() { try { const r = await this.req('model/list', {}); this.models = (r.data || []).filter(m => !m.hidden); CodexUI.status(); } catch (e) { } },
  async loadSkills(cwds) {
    try {
      const dirs = cwds || projects().map(p => p.dir).filter(Boolean);
      const r = await this.req('skills/list', { cwds: dirs.length ? dirs : [Store.root || '~'], forceReload: true });
      const seen = new Map();
      (r.data || []).forEach(e => (e.skills || []).forEach(s => { const k = s.path; if (!seen.has(k)) seen.set(k, Object.assign({}, s, { cwd: e.cwd })); }));
      this.skills = [...seen.values()];
    } catch (e) { }
    return this.skills;
  },
  skillsFor(p) {
    return this.skills.filter(s => s.enabled !== false && (s.scope !== 'repo' || (p && p.dir && s.path.startsWith(p.dir + '/'))));
  },
  async loginStart(type, extra = {}) {
    await this.ensure();
    const r = await this.req('account/login/start', Object.assign({ type }, extra));
    this.login = r;
    if (r.authUrl) nat('openURL', { url: r.authUrl });
    return r;
  },
  async logout() { await this.req('account/logout', {}); await this.refreshAccount(); },
};
Codex.on('account/login/completed', p => { Codex.login = null; if (p.success) { Codex.refreshAccount().then(() => { CodexUI.hideLogin(); toast('Signed in to Codex.'); }); } else toast('Sign-in did not finish.', { sub: p.error || 'Try again.' }); CodexUI.renderLogin(); });
Codex.on('account/updated', () => Codex.refreshAccount());
Codex.on('account/rateLimits/updated', p => { Codex.rate = p.rateLimits; CodexUI.status(); });
Codex.on('skills/changed', () => Codex.loadSkills());

/* ================= human-language steps ================= */
/** Splits Codex Desktop's "# Files mentioned by the user" header from the message itself. */
function parseUserText(t) {
  t = String(t || '');
  const m = t.match(/^# Files (?:mentioned|pasted) by the user:\s*\n([\s\S]*?)\n## My request for Codex:\s*\n?([\s\S]*)$/);
  if (!m) return { text: t, files: [] };
  const files = [...m[1].matchAll(/^## .*?: (\/.*)$/gm)].map(x => x[1].trim());
  return { text: m[2].trim(), files };
}
function withFiles(text, files) {
  const others = (files || []).filter(Boolean);
  if (!others.length) return text;
  return `# Files mentioned by the user:\n\n${others.map(f => `## ${baseName(f)}: ${f}`).join('\n\n')}\n\n## My request for Codex:\n${text}`;
}
const short = (s, n = 90) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const relTo = (p, base) => { if (!p) return ''; if (base && p.startsWith(base + '/')) return p.slice(base.length + 1); if (Render.home && p.startsWith(Render.home + '/')) return '~/' + p.slice(Render.home.length + 1); return p; };
const firstSentence = t => { const s = String(t || '').replace(/[#*_`>]/g, '').replace(/\s+/g, ' ').trim(); const m = s.match(/^(.{20,220}?[.!?])(\s|$)/); return m ? m[1] : short(s, 200); };
const SERVER_NAMES = { cua_repl: 'Computer Use', 'computer-use': 'Computer Use', node_repl: 'a JavaScript session', codex_apps: 'a connected app', browser: 'the browser', chatcut: 'ChatCut' };
/** `/bin/zsh -lc 'npm test'` → `npm test` */
function cleanCmd(c) {
  const m = String(c || '').match(/^\/bin\/(?:ba|z)?sh\s+-l?c\s+(['"])([\s\S]*)\1\s*$/);
  return m ? m[2].replace(/'"'"'/g, "'").replace(/\\"/g, '"') : String(c || '');
}
function plural(n, w) { return `${n} ${w}${n === 1 ? '' : 's'}`; }
/** Returns { icon, text, detail, ok } for a completed Codex item, or null to skip it. */
function humanStep(item, base) {
  switch (item.type) {
    case 'userMessage': { const pt = parseUserText((item.content || []).filter(c => c.type === 'text').map(c => c.text).join(' ')); const nf = (item.files || pt.files).length; return { icon: 'you', text: `You asked: “${short(pt.text, 140)}”${nf ? ` (with ${nf} file${nf === 1 ? '' : 's'})` : ''}` }; }
    case 'reasoning': { const s = (item.summary || []).join(' ').replace(/\*\*/g, ''); return s.trim() ? { icon: 'think', text: `Thought it through: ${short(s.replace(/^#+\s*/, ''), 160)}` } : null; }
    case 'agentMessage': return item.text ? { icon: 'say', text: item.phase === 'final_answer' ? `Reported back: ${firstSentence(item.text)}` : `Said: ${firstSentence(item.text)}` } : null;
    case 'plan': return { icon: 'plan', text: `Made a plan: ${short(item.text, 160)}` };
    case 'commandExecution': {
      const acts = item.commandActions || []; const ok = item.status === 'completed' && (item.exitCode == null || item.exitCode === 0);
      const dur = item.durationMs != null ? ` in ${(item.durationMs / 1000).toFixed(item.durationMs < 10000 ? 1 : 0)}s` : '';
      const cmd = cleanCmd(item.command);
      if (item.status === 'declined') return { icon: 'stop', text: `Was not allowed to run \`${short(cmd, 70)}\``, ok: false };
      if (acts.length && acts.every(a => a.type === 'read')) { const names = [...new Set(acts.map(a => relTo(a.path || a.name, base)))]; return { icon: 'read', text: `Read ${names.slice(0, 4).map(n => '`' + n + '`').join(', ')}${names.length > 4 ? ` and ${names.length - 4} more` : ''}`, ok }; }
      if (acts.length && acts.every(a => a.type === 'search')) return { icon: 'search', text: `Searched the files for ${acts.map(a => a.query ? `“${short(a.query, 40)}”` : 'matches').join(', ')}${acts[0].path ? ` in \`${relTo(acts[0].path, base)}\`` : ''}`, ok };
      if (acts.length && acts.every(a => a.type === 'listFiles')) return { icon: 'list', text: `Looked through the files in \`${relTo(acts[0].path || '.', base) || '.'}\``, ok };
      if (item.pluginId) return { icon: 'run', text: `Ran a ${item.pluginId.split('@')[0]} tool${dur}${ok ? '' : ' — it failed'}`, ok };
      return { icon: 'run', text: `Ran \`${short(cmd, 80)}\`${ok ? ` — finished${dur}` : item.exitCode != null ? ` — failed with exit code ${item.exitCode}${dur}` : ''}`, detail: !ok && item.aggregatedOutput ? short(item.aggregatedOutput.split('\n').filter(Boolean).slice(-1)[0], 140) : '', ok };
    }
    case 'fileChange': {
      const ch = item.changes || []; if (!ch.length) return null;
      const verbs = { add: 'Created', delete: 'Deleted', update: 'Edited' };
      const isMem = c => /(^|\/)AGENTS\.md$/i.test(c.path);
      const mem = ch.some(isMem); const rest = ch.filter(c => !isMem(c));
      const groups = {}; rest.forEach(c => { const k = (c.kind && c.kind.type) || 'update'; const st = Render.diffStat(c.diff); (groups[k] = groups[k] || []).push(`\`${relTo(c.path, base)}\`${k === 'update' ? ` (+${st.add} −${st.del})` : ''}`); });
      const text = Object.entries(groups).map(([k, v]) => `${verbs[k] || 'Changed'} ${v.slice(0, 4).join(', ')}${v.length > 4 ? ` and ${v.length - 4} more` : ''}`).join('; ');
      return { icon: mem ? 'memory' : 'edit', text: mem ? `Updated the project memory (AGENTS.md)${text ? '; ' + text.charAt(0).toLowerCase() + text.slice(1) : ''}` : text, ok: item.status !== 'failed' && item.status !== 'declined' };
    }
    case 'webSearch': {
      const a = item.action || {};
      if (a.type === 'open_page') return { icon: 'web', text: `Opened ${a.url || 'a web page'}` };
      if (a.type === 'find_in_page') return { icon: 'web', text: `Looked for “${short(a.pattern, 50)}” on ${a.url || 'the page'}` };
      const q = item.query || (a.queries || []).join(', ') || a.query; return { icon: 'web', text: `Searched the web for “${short(q, 90)}”` };
    }
    case 'mcpToolCall': {
      const who = SERVER_NAMES[item.server] || item.server; const ok = item.status !== 'failed';
      const args = item.arguments && typeof item.arguments === 'object' ? item.arguments : {};
      if (/computer|cua/i.test(item.server)) return { icon: 'cursor', text: `Used the computer: ${humanTool(item.tool, args)}`, ok };
      if (/browser/i.test(item.server) || /browser|navigate|page/i.test(item.tool)) return { icon: 'web', text: `Used the browser: ${humanTool(item.tool, args)}`, ok };
      return { icon: 'tool', text: `Used ${who}: ${humanTool(item.tool, args)}${ok ? '' : ' — it failed'}`, detail: item.error ? item.error.message : '', ok };
    }
    case 'dynamicToolCall': return { icon: 'tool', text: `Used the ${item.tool} tool`, ok: item.success !== false };
    case 'imageGeneration': return { icon: 'image', text: `Generated an image${item.revisedPrompt ? `: “${short(item.revisedPrompt, 120)}”` : ''}`, ok: !item.failure };
    case 'imageView': return { icon: 'image', text: `Looked at the image \`${relTo(item.path, base)}\`` };
    case 'collabAgentToolCall': return { icon: 'agent', text: item.tool === 'spawnAgent' || /spawn/i.test(item.tool) ? `Asked a helper agent to ${short(item.prompt || 'take part of the work', 120)}` : `Coordinated with helper agents (${item.tool})` };
    case 'subAgentActivity': return null;
    case 'enteredReviewMode': return { icon: 'review', text: 'Started reviewing the changes' };
    case 'exitedReviewMode': return { icon: 'review', text: `Finished the review${item.review ? `: ${firstSentence(item.review)}` : ''}` };
    case 'contextCompaction': return { icon: 'compact', text: 'Summarized the conversation so far to make room for more work' };
    case 'sleep': return { icon: 'wait', text: 'Waited for a background process' };
    default: return null;
  }
}
function humanTool(tool, args) {
  const t = String(tool || '').replace(/[_-]+/g, ' ');
  const pick = args.url || args.query || args.text || args.app || args.app_name || args.path || args.code && short(args.code, 50) || args.action || '';
  return pick ? `${t} — ${short(typeof pick === 'string' ? pick : JSON.stringify(pick), 80)}` : t;
}

/* ================= runs ================= */
const ART_EXT = /\.(png|jpe?g|gif|webp|svg|pdf|pptx?|key|docx?|xlsx?|csv|html?|mp4|mov|mp3|wav|md|ipynb|psd|fig|sketch)$/i;
const SKILL_WORTHY = /\.(png|jpe?g|gif|webp|svg|pdf|pptx?|key|docx?|xlsx?|html?|css|mp4|mov)$/i;
const slugify = s => { let t = String(s || 'task').toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-'); if (t.length > 40) t = t.slice(0, 40).replace(/-[^-]*$/, ''); return t || 'task'; };
const PERMS = {
  ask: { label: 'Ask before risky actions', approval: 'on-request' },
  auto: { label: 'Work freely in the project folder', approval: 'never' },
  full: { label: 'Full access to this Mac', approval: 'never' },
};

const Runs = {
  map: new Map(), byThread: new Map(), loadedProjects: new Set(), ephemeral: new Map(),

  dirOf(run) { const p = S.projects[run.projectId]; return p && p.dir ? `${p.dir}/.crewdex/runs/${run.id}` : null; },
  list(pid) { return [...this.map.values()].filter(r => r.projectId === pid).sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || '')); },
  active() { return [...this.map.values()].filter(r => ['starting', 'running', 'waiting'].includes(r.status)); },

  /** Load run metadata for a project from disk (once). */
  async loadProject(pid) {
    const p = S.projects[pid]; if (!p || !p.dir || this.loadedProjects.has(pid) || !NATIVE) return;
    this.loadedProjects.add(pid);
    const entries = await nat('list', { path: p.dir + '/.crewdex/runs' }).catch(() => []);
    await Promise.all(entries.filter(e => e.dir).map(async e => {
      if (this.map.has(e.name)) return;
      const t = await nat('readText', { path: e.path + '/run.json' }).catch(() => null);
      if (!t) return;
      try { const r = JSON.parse(t); r.items = null; r.pending = []; r.live = new Map(); if (['starting', 'running', 'waiting'].includes(r.status)) r.status = 'interrupted'; this.map.set(r.id, r); if (r.threadId) this.byThread.set(r.threadId, r); } catch (err) { }
    }));
    scheduleRender();
  },
  /** Load full items for a run from its events.jsonl. */
  async hydrate(run) {
    if (run.items) return run;
    run.items = []; run.steps = run.steps || [];
    const dir = this.dirOf(run); if (!dir) return run;
    const text = await nat('readText', { path: dir + '/events.jsonl' }).catch(() => null);
    if (!text && run.imported) return hydrateImported(run);
    (text || '').split('\n').forEach(l => {
      if (!l.trim()) return;
      try { const ev = JSON.parse(l); if (ev.type === 'item') run.items.push(ev.item); else if (ev.type === 'plan') run.plan = ev.plan; else if (ev.type === 'diff') run.diff = ev.diff; } catch (e) { }
    });
    return run;
  },
  meta(run) {
    const keep = ['outputs', 'ctx', 'taskIds', 'modelSel', 'effort', 'imported', 'outcome', 'id', 'projectId', 'taskId', 'kind', 'title', 'threadId', 'status', 'startedAt', 'endedAt', 'turns', 'summary', 'artifacts', 'tokens', 'model', 'perm', 'cwd', 'error', 'steps', 'plan', 'skillOffer', 'skillsUsed', 'artifactDir'];
    const o = {}; keep.forEach(k => { if (run[k] !== undefined) o[k] = run[k]; }); return o;
  },
  save(run) { const d = this.dirOf(run); if (!d) return; clearTimeout(run._saveT); run._saveT = setTimeout(() => nat('writeText', { path: d + '/run.json', text: JSON.stringify(this.meta(run), null, 2) }).catch(() => { }), 250); },
  event(run, ev) { const d = this.dirOf(run); if (!d) return; nat('appendText', { path: d + '/events.jsonl', text: JSON.stringify(Object.assign({ t: new Date().toISOString() }, ev)) + '\n' }).catch(() => { }); },
  addStep(run, item) {
    const p = S.projects[run.projectId];
    const st = humanStep(item, p && p.dir); if (!st) return;
    const step = Object.assign({ at: new Date().toISOString(), kind: item.type, itemId: item.id }, st);
    run.steps = run.steps || []; run.steps.push(step);
    const d = this.dirOf(run);
    if (d) {
      const n = run.steps.length; const time = new Date(step.at).toTimeString().slice(0, 5);
      const header = n === 1 ? `# ${run.title}\n\n_${run.kind === 'chat' ? 'Conversation' : run.kind === 'skill' ? 'Skill creation' : 'Task run'} in ${p ? p.name : ''}, started ${new Date(run.startedAt).toLocaleString()}_\n\n` : '';
      nat('appendText', { path: d + '/steps.md', text: `${header}${n}. ${time} — ${step.text}${step.ok === false ? ' ⚠︎' : ''}${step.detail ? `\n   ${step.detail}` : ''}\n` }).catch(() => { });
    }
    RunView.step(run, step);
  },

  /** Build the developer instructions that tie a Codex thread to its Crewdex project. */
  instructions(p, a, run) {
    const ms = a && a.milestoneId && S.milestones[a.milestoneId];
    return [
      `You are working inside the Crewdex project "${p.name}". Crewdex is the user's project manager; this folder is the project's permanent home.`,
      `Project folder: ${p.dir}`,
      p.workspace ? `Linked code workspace: ${p.workspace} (you may work there too).` : '',
      `Project memory lives in AGENTS.md (already loaded) and .crewdex/HISTORY.md, a log of every earlier Codex run with summaries and output paths. Read HISTORY.md when earlier work matters. Each run's exact steps are in .crewdex/runs/<run-id>/steps.md.`,
      a ? `Current task: ${a.title}.` : '',
      run.artifactDir ? `Save every deliverable you create (documents, decks, images, data, prototypes) inside ${run.artifactDir}/ unless the task names another place. Use clear file names.` : '',
      `Project skills are in .agents/skills/. Use one when it matches the task.`,
      `Do not edit files inside .crewdex/ except to read them.`,
      `When you finish, add 1-5 durable learnings (decisions, conventions, facts or preferences worth remembering for this project) to the "## Memory" section of AGENTS.md. Edit existing bullets instead of duplicating them. Skip this if nothing new was learned.`,
      `End your final message with a short plain-language summary: what you did, what is left, and the paths of the outputs.`
    ].filter(Boolean).join('\n');
  },
  sandbox(perm, p, extraRoots = []) {
    if (perm === 'full') return { type: 'dangerFullAccess' };
    const roots = [p.dir, p.workspace, ...extraRoots].filter(Boolean);
    return { type: 'workspaceWrite', writableRoots: [...new Set(roots)], networkAccess: true, excludeTmpdirEnvVar: false, excludeSlashTmp: false };
  },
  settings() { const s = S.settings || {}; return { perm: s.perm || 'ask' }; },

  async ensureThread(run) {
    if (Codex.loaded.has(run.threadId)) return;
    const p = S.projects[run.projectId];
    const a = run.taskId && S.actions[run.taskId];
    await Codex.req('thread/resume', { threadId: run.threadId, cwd: run.cwd || p.dir, excludeTurns: true, developerInstructions: this.instructions(p, a, run) });
    Codex.loaded.add(run.threadId);
  },

  /** Start a Codex run for a task (kind 'task'), a project conversation ('chat') or a skill capture ('skill'). */
  async start({ projectId, taskId = null, kind = 'task', prompt, title, skills = [], perm, extraRoots = [], model, effort, files = [] }) {
    await Codex.ensure();
    if (!Codex.account && Codex.needsAuth) { CodexUI.showLogin(); throw new Error('Sign in to Codex first.'); }
    const p = S.projects[projectId]; if (!p || !p.dir) throw new Error('This project has no folder yet.');
    const a = taskId && S.actions[taskId];
    const cfg = this.settings(); perm = perm || p.perm || cfg.perm;
    const id = 'r' + new Date().toISOString().replace(/\D/g, '').slice(0, 12) + Math.random().toString(36).slice(2, 6);
    const run = { id, projectId, taskId, kind, title: title || (a ? a.title : 'Conversation'), status: 'starting', startedAt: new Date().toISOString(), turns: [], steps: [], items: [], pending: [], live: new Map(), perm, cwd: p.dir, artifacts: [], skillsUsed: skills.map(s => s.name), modelSel: model || '', effort: effort || '' };
    if (kind === 'task' && a) run.artifactDir = `${p.dir}/artifacts/${slugify(a.title)}`;
    this.map.set(id, run);
    if (a) tx(null, () => patch('actions', a.id, { runs: [{ id, status: 'running', at: run.startedAt }, ...(a.runs || [])].slice(0, 20) }));
    CodexUI.status();
    try {
      if (run.artifactDir) await nat('mkdir', { path: run.artifactDir });
      const t = await Codex.req('thread/start', Object.assign({
        cwd: p.dir, approvalPolicy: PERMS[perm].approval, sandbox: perm === 'full' ? 'danger-full-access' : 'workspace-write',
        developerInstructions: this.instructions(p, a, run), config: { web_search: 'live' }, serviceName: 'crewdex', threadSource: 'crewdex'
      }, model ? { model } : {}));
      run.threadId = t.thread.id; run.model = t.model; Codex.loaded.add(run.threadId); this.byThread.set(run.threadId, run);
      this.save(run);
      await this.turn(run, prompt, { skills, extraRoots, model, effort, files });
      return run;
    } catch (e) {
      run.status = 'failed'; run.error = e.message; this.save(run); this.syncTask(run); CodexUI.status(); RunView.refresh(run);
      throw e;
    }
  },
  async turn(run, text, { skills = [], extraRoots = [], model, effort, files = [], perm } = {}) {
    const p = S.projects[run.projectId];
    await this.ensureThread(run);
    const cfg = this.settings();
    if (perm && PERMS[perm]) run.perm = perm;
    if (model !== undefined) run.modelSel = model || ''; if (effort !== undefined) run.effort = effort || '';
    const images = files.filter(f => fileKind(f) === 'image');
    const input = [{ type: 'text', text: (skills.length ? skills.map(s => '$' + s.name).join(' ') + ' ' : '') + withFiles(text, files), text_elements: [] }, ...images.map(path => ({ type: 'localImage', path })), ...skills.map(s => ({ type: 'skill', name: s.name, path: s.path }))];
    const userItem = { type: 'userMessage', id: 'u' + Date.now(), content: [{ type: 'text', text }], files: files.slice(), local: true };
    run.status = 'running'; run.endedAt = null; run.error = null;
    run.items = run.items || []; run.items.push(userItem); this.event(run, { type: 'item', item: userItem }); this.addStep(run, userItem);
    const params = Object.assign({ threadId: run.threadId, input, approvalPolicy: PERMS[run.perm].approval, sandboxPolicy: this.sandbox(run.perm, p, [...extraRoots, run.cwd !== p.dir ? run.cwd : null].filter(Boolean)), summary: 'auto' }, run.modelSel ? { model: run.modelSel } : {}, run.effort ? { effort: run.effort } : {});
    if (run.modelSel) run.model = run.modelSel;
    const r = await Codex.req('turn/start', params);
    run.turnId = r.turn.id; run.turns.push({ id: r.turn.id, prompt: text, startedAt: new Date().toISOString(), status: 'inProgress' });
    this.save(run); this.syncTask(run); CodexUI.status(); RunView.refresh(run);
  },
  async send(run, text, opts = {}) {
    await Codex.ensure();
    const files = opts.files || [];
    if (run.status === 'running' && run.turnId) {
      const item = { type: 'userMessage', id: 'u' + Date.now(), content: [{ type: 'text', text }], files: files.slice(), local: true };
      run.items.push(item); this.event(run, { type: 'item', item }); this.addStep(run, item); RunView.refresh(run);
      return Codex.req('turn/steer', { threadId: run.threadId, input: [{ type: 'text', text: withFiles(text, files), text_elements: [] }, ...files.filter(f => fileKind(f) === 'image').map(path => ({ type: 'localImage', path }))], expectedTurnId: run.turnId });
    }
    await this.hydrate(run);
    return this.turn(run, text, opts);
  },
  async stop(run) { if (run.threadId && run.turnId && run.status !== 'completed') { try { await Codex.req('turn/interrupt', { threadId: run.threadId, turnId: run.turnId }); } catch (e) { toast('Could not stop the run.', { sub: e.message }); } } },
  /** Points an existing session at a task, so one session can carry several tasks. */
  attachTask(run, a) {
    const p = S.projects[run.projectId];
    run.taskId = a.id; run.taskIds = [...new Set([...(run.taskIds || []), a.id])];
    run.artifactDir = `${p.dir}/artifacts/${slugify(a.title)}`; nat('mkdir', { path: run.artifactDir }).catch(() => { });
    tx(null, () => patch('actions', a.id, { runs: [{ id: run.id, status: 'running', at: new Date().toISOString() }, ...(a.runs || []).filter(r => r.id !== run.id)].slice(0, 20) }));
    this.save(run);
  },
  syncTask(run) {
    const a = run.taskId && S.actions[run.taskId]; if (!a) return;
    const runs = (a.runs || []).map(r => r.id === run.id ? Object.assign({}, r, { status: run.status, summary: run.summary ? firstSentence(run.summary) : r.summary, endedAt: run.endedAt || null }) : r);
    if (!runs.find(r => r.id === run.id)) runs.unshift({ id: run.id, status: run.status, at: run.startedAt });
    tx(null, () => patch('actions', a.id, { runs }));
  },

  /* ---- notifications from app-server ---- */
  onNotification(method, params) {
    if (params.threadId && this.ephemeral.has(params.threadId)) return Quick.onNotification(method, params);
    const run = params.threadId && this.byThread.get(params.threadId);
    if (!run) return;
    run.live = run.live || new Map(); run.items = run.items || [];
    switch (method) {
      case 'item/started': run.live.set(params.item.id, params.item); RunView.item(run, params.item); break;
      case 'item/agentMessage/delta': { const it = run.live.get(params.itemId); if (it) { it.text = (it.text || '') + params.delta; RunView.item(run, it, true); } break; }
      case 'item/reasoning/summaryTextDelta': { const it = run.live.get(params.itemId); if (it) { it.summary = it.summary || []; it.summary[params.summaryIndex || 0] = (it.summary[params.summaryIndex || 0] || '') + params.delta; RunView.item(run, it, true); } break; }
      case 'item/reasoning/summaryPartAdded': break;
      case 'item/commandExecution/outputDelta': { const it = run.live.get(params.itemId); if (it) { it.aggregatedOutput = (it.aggregatedOutput || '') + params.delta; RunView.item(run, it, true); } break; }
      case 'item/plan/delta': { const it = run.live.get(params.itemId); if (it) { it.text = (it.text || '') + params.delta; RunView.item(run, it, true); } break; }
      case 'item/completed': {
        const it = params.item; run.live.delete(it.id);
        if (it.type === 'userMessage' && run.items.some(x => x.local && x.type === 'userMessage' && !x.matched)) { const loc = run.items.find(x => x.local && x.type === 'userMessage' && !x.matched); loc.matched = true; break; }
        const i = run.items.findIndex(x => x.id === it.id); if (i >= 0) run.items[i] = it; else run.items.push(it);
        this.event(run, { type: 'item', item: it }); this.addStep(run, it);
        if (it.type === 'imageGeneration') this.keepImage(run, it);
        RunView.item(run, it); break;
      }
      case 'turn/started': run.turnId = params.turn.id; run.status = 'running'; this.save(run); CodexUI.status(); break;
      case 'turn/plan/updated': {
        const sig = (params.plan || []).map(s => s.step + s.status).join('|');
        if (sig !== run._planSig) { run._planSig = sig; run.plan = { explanation: params.explanation, steps: params.plan }; this.event(run, { type: 'plan', plan: run.plan }); RunView.plan(run); this.save(run); }
        break;
      }
      case 'turn/diff/updated': run.diff = params.diff; break;
      case 'thread/tokenUsage/updated': { const u = params.tokenUsage || {}; run.tokens = u.total; run.ctx = { used: (u.last || {}).totalTokens || 0, window: u.modelContextWindow || null }; RunView.meta(run); break; }
      case 'error': if (!params.willRetry) { run.error = params.error && params.error.message; RunView.refresh(run); } break;
      case 'serverRequest/resolved': run.pending = (run.pending || []).filter(p => p.id !== params.requestId); RunView.refresh(run); this.updateWaiting(run); break;
      case 'turn/completed': this.finish(run, params.turn); break;
    }
  },
  async keepImage(run, it) {
    const p = S.projects[run.projectId];
    if (!it.savedPath || !p) return;
    const dest = `${run.artifactDir || p.dir + '/artifacts/images'}/${baseName(it.savedPath)}`;
    if (it.savedPath.startsWith(p.dir + '/')) return;
    try { await nat('copy', { path: it.savedPath, to: dest }); it.projectPath = dest; run.artifacts = [...new Set([...(run.artifacts || []), dest])]; this.save(run); } catch (e) { }
  },
  async finish(run, turn) {
    run.status = turn.status === 'completed' ? 'completed' : turn.status === 'interrupted' ? 'interrupted' : 'failed';
    if (turn.error) run.error = turn.error.message;
    run.endedAt = new Date().toISOString();
    const last = run.turns[run.turns.length - 1]; if (last) { last.status = turn.status; last.endedAt = run.endedAt; }
    const final = [...run.items].reverse().find(i => i.type === 'agentMessage' && i.text);
    if (final) { run.summary = final.text; const cited = citedOutputs(final.text, run.cwd); run.outputs = [...new Set([...(run.outputs || []), ...cited])]; }
    run.pending = [];
    await this.collectArtifacts(run);
    if (run.pendingSkill) { run.skillOffer = run.status === 'completed' ? 'saved' : 'offered'; run.pendingSkill = null; Codex.loadSkills().then(() => scheduleRender()); }
    if (run.kind === 'task' && run.status === 'completed' && !run.skillOffer && [...(run.outputs || []), ...(run.artifacts || [])].some(a => SKILL_WORTHY.test(a))) run.skillOffer = 'offered';
    if (run.kind === 'skill' && run.status === 'completed') { Codex.loadSkills().then(() => scheduleRender()); }
    this.save(run); this.syncTask(run); this.history(run);
    CodexUI.status(); RunView.refresh(run); scheduleRender();
    const p = S.projects[run.projectId];
    if (!document.hasFocus()) { nat('notify', { title: `${run.status === 'completed' ? 'Done' : run.status === 'interrupted' ? 'Stopped' : 'Failed'} · ${run.title}`, body: run.summary ? firstSentence(run.summary) : (run.error || p.name) }); nat('attention'); }
    if (run.skillOffer === 'offered' && !(UI.view === 'run' && UI.runId === run.id)) toast(`Codex finished “${short(run.title, 40)}”.`, { sub: 'Like how it came out? Save it as a skill so future work matches it.', actions: [{ label: 'Review', run: () => navigate('run', run.id) }], duration: 12000 });
  },
  async collectArtifacts(run) {
    const p = S.projects[run.projectId]; const found = new Set(run.artifacts || []);
    (run.items || []).forEach(it => {
      if (it.type === 'fileChange') (it.changes || []).forEach(c => { if ((c.kind || {}).type !== 'delete') { const path = c.path.startsWith('/') ? c.path : `${run.cwd}/${c.path}`; if (!/\/(\.crewdex|\.git)\//.test(path) && !/AGENTS\.md$/.test(path)) found.add(path); } });
      if (it.type === 'imageGeneration' && (it.projectPath || it.savedPath)) found.add(it.projectPath || it.savedPath);
    });
    if (run.artifactDir) { const files = await nat('list', { path: run.artifactDir, recursive: true }).catch(() => []); files.filter(f => !f.dir).forEach(f => found.add(f.path)); }
    run.artifacts = [...found];
  },
  history(run) {
    const p = S.projects[run.projectId]; if (!p || !p.dir) return;
    const when = new Date(run.startedAt);
    const dur = run.endedAt ? Math.max(1, Math.round((new Date(run.endedAt) - when) / 60000)) : null;
    const rel = x => relTo(x, p.dir);
    const lines = [
      `\n## ${when.toISOString().slice(0, 10)} ${when.toTimeString().slice(0, 5)} · ${run.kind === 'chat' ? 'Conversation' : run.kind === 'skill' ? 'Skill' : 'Task'}: ${run.title}`,
      `- Result: ${run.status}${dur ? ` after ${dur} min` : ''}${run.turns.length > 1 ? `, ${run.turns.length} turns` : ''}`,
      run.summary ? `- Summary: ${firstSentence(run.summary)}` : '',
      (run.artifacts || []).length ? `- Outputs: ${run.artifacts.slice(0, 12).map(x => '`' + rel(x) + '`').join(', ')}` : '',
      `- Steps: \`.crewdex/runs/${run.id}/steps.md\` · Codex thread \`${run.threadId}\``,
    ].filter(Boolean).join('\n');
    nat('appendText', { path: p.dir + '/.crewdex/HISTORY.md', text: lines + '\n' }).catch(() => { });
  },
  onDisconnect() {
    for (const r of this.active()) { r.status = 'interrupted'; r.error = 'Codex stopped while this run was in progress. Send a message to continue it.'; r.pending = []; this.save(r); this.syncTask(r); RunView.refresh(r); }
    Quick.failAll('Codex stopped.');
  },

  /* ---- approvals and questions from Codex ---- */
  onServerRequest(m) {
    const params = m.params || {};
    if (params.threadId && this.ephemeral.has(params.threadId)) { return Codex.respond(m.id, autoDecline(m.method)); }
    const run = params.threadId && this.byThread.get(params.threadId);
    if (['account/chatgptAuthTokens/refresh', 'attestation/generate', 'item/tool/call'].includes(m.method) || !run) {
      if (m.method === 'item/tool/call') return Codex.respond(m.id, { contentItems: [{ type: 'inputText', text: 'This tool is not available in Crewdex.' }], success: false });
      return Codex.respondError(m.id, 'Not supported by Crewdex.');
    }
    run.pending = run.pending || []; run.pending.push({ id: m.id, method: m.method, params, at: Date.now() });
    run.status = 'waiting'; this.save(run); this.updateWaiting(run);
    RunView.refresh(run); CodexUI.status();
    const what = m.method.includes('commandExecution') ? `run \`${short(params.command, 60)}\`` : m.method.includes('fileChange') ? 'change files' : m.method.includes('permissions') ? 'get more access' : m.method.includes('requestUserInput') ? 'ask you a question' : m.method.includes('elicitation') ? `get input for ${params.serverName}` : 'continue';
    if (!(UI.view === 'run' && UI.runId === run.id)) toast(`Codex wants to ${what}.`, { sub: run.title, actions: [{ label: 'Review', run: () => navigate('run', run.id) }], duration: 15000 });
    if (!document.hasFocus()) nat('notify', { title: 'Codex needs you', body: `${run.title}: wants to ${what.replace(/`/g, '')}` });
  },
  answer(run, reqId, result, label) {
    const pr = (run.pending || []).find(p => p.id === reqId); if (!pr) return;
    Codex.respond(reqId, result);
    this.event(run, { type: 'approval', method: pr.method, params: pr.params, result });
    run.pending = run.pending.filter(p => p.id !== reqId);
    if (label) { const st = { at: new Date().toISOString(), icon: 'you', text: label, kind: 'approval' }; run.steps.push(st); const d = this.dirOf(run); if (d) nat('appendText', { path: d + '/steps.md', text: `${run.steps.length}. ${st.at.slice(11, 16)} — ${label}\n` }); RunView.step(run, st); }
    this.updateWaiting(run); RunView.refresh(run); CodexUI.status();
  },
  updateWaiting(run) { if (run.status === 'waiting' && !(run.pending || []).length) { run.status = 'running'; this.save(run); } },

  /* ---- skills ---- */
  skillCreator() { return Codex.skills.find(s => s.name === 'skill-creator') || null; },
  async saveAsSkill(run, scope, hint) {
    const p = S.projects[run.projectId];
    const dir = scope === 'global' ? `${Render.home}/.agents/skills` : `${p.dir}/.agents/skills`;
    await nat('mkdir', { path: dir });
    const sc = this.skillCreator();
    const prompt = [
      `Turn what you produced in this thread into a reusable skill so future work of this kind matches its quality and style.`,
      `Scope: ${scope === 'global' ? 'all of my projects' : `only the project "${p.name}"`}. Write it to ${dir}/<skill-name>/SKILL.md and create that folder.`,
      `Pick a short kebab-case name${hint ? ` (suggestion: ${hint})` : ''}. The description must say exactly when to use the skill and when not to.`,
      `Capture what made the result good: structure, visual and design decisions (colors, type, layout, spacing), tone of writing, file formats, the tools and steps that produced it, and the checks you ran. If it helps reproduce the result, copy the best output or a trimmed excerpt into the skill's assets/ or references/ folder.`,
      `Don't ask me questions; make sensible choices. Reply with the skill name, its path, and one line on what it captures.`
    ].join('\n');
    run.kind = run.kind === 'task' ? run.kind : run.kind;
    run.skillOffer = 'saving'; this.save(run); RunView.refresh(run);
    await this.hydrate(run);
    run.pendingSkill = { scope, dir };
    await this.turn(run, prompt, { skills: sc ? [sc] : [], extraRoots: scope === 'global' ? [dir] : [] });
  },
  /** Start a fresh run whose only job is to capture a skill from earlier runs of similar tasks. */
  async skillFromPattern(p, tasks, scope) {
    const sc = this.skillCreator();
    const dir = scope === 'global' ? `${Render.home}/.agents/skills` : `${p.dir}/.agents/skills`;
    await nat('mkdir', { path: dir });
    const refs = tasks.map(a => { const r = (a.runs || [])[0]; return `- “${a.title}”${r ? ` → steps in ${S.projects[a.projectId].dir}/.crewdex/runs/${r.id}/steps.md` : ''}`; }).join('\n');
    const prompt = `These tasks are the same kind of work done repeatedly:\n${refs}\n\nRead their steps and outputs, then write one reusable skill that does this kind of task well and consistently. Write it to ${dir}/<skill-name>/SKILL.md. The description must say exactly when to use it. Don't ask questions; reply with the skill name and path.`;
    return this.start({ projectId: p.id, kind: 'skill', title: `Skill from ${tasks.length} similar tasks`, prompt, skills: sc ? [sc] : [], extraRoots: scope === 'global' ? [dir, ...tasks.map(a => S.projects[a.projectId].dir)] : tasks.map(a => S.projects[a.projectId].dir) });
  },
};
function autoDecline(method) {
  if (method.includes('commandExecution') || method.includes('fileChange')) return { decision: 'decline' };
  if (method.includes('permissions')) return { permissions: {}, scope: 'turn' };
  if (method.includes('elicitation')) return { action: 'decline', content: null, _meta: null };
  if (method.includes('requestUserInput')) return { answers: {} };
  return { decision: 'denied' };
}

/* ================= quick structured calls (enhance, command interpretation) ================= */
const Quick = {
  waits: new Map(),
  /** Runs one read-only, ephemeral Codex turn and resolves with the parsed JSON answer. */
  async ask({ cwd, prompt, schema, onStep, effort }) {
    await Codex.ensure();
    if (!Codex.account && Codex.needsAuth) { CodexUI.showLogin(); throw new Error('Sign in to Codex first.'); }
    const t = await Codex.req('thread/start', { cwd: cwd || Store.root, approvalPolicy: 'never', sandbox: 'read-only', ephemeral: true, serviceName: 'crewdex', developerInstructions: 'You help a person manage projects in the Crewdex app. Read files if useful, never modify anything, and answer only in the requested JSON shape.' });
    const tid = t.thread.id;
    Runs.ephemeral.set(tid, true);
    const done = new Promise((res, rej) => this.waits.set(tid, { res, rej, onStep, cwd, text: '' }));
    await Codex.req('turn/start', Object.assign({ threadId: tid, input: [{ type: 'text', text: prompt, text_elements: [] }], outputSchema: schema }, effort ? { effort } : {}));
    return done;
  },
  onNotification(method, params) {
    const w = this.waits.get(params.threadId); if (!w) return;
    if (method === 'item/completed') {
      const it = params.item;
      if (it.type === 'agentMessage' && it.text) w.text = it.text;
      const st = humanStep(it, w.cwd); if (st && w.onStep && it.type !== 'userMessage' && it.type !== 'agentMessage') w.onStep(st);
    } else if (method === 'turn/completed') {
      this.waits.delete(params.threadId); Runs.ephemeral.delete(params.threadId);
      if (params.turn.status !== 'completed') return w.rej(new Error((params.turn.error && params.turn.error.message) || 'Codex did not finish.'));
      try { const m = w.text.match(/\{[\s\S]*\}$/); w.res(JSON.parse(m ? m[0] : w.text)); } catch (e) { w.rej(new Error('Codex replied in an unexpected format.')); }
    }
  },
  failAll(msg) { for (const [, w] of this.waits) w.rej(new Error(msg)); this.waits.clear(); },
};

const ENHANCE_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['summary', 'tasks', 'questions'],
  properties: {
    summary: { type: 'string', description: 'One sentence on how the work was split.' },
    tasks: { type: 'array', description: '1-7 tasks in the order they should be done.', items: { type: 'object', additionalProperties: false, required: ['title', 'description', 'acceptance', 'who', 'reason', 'due', 'size'], properties: {
      title: { type: 'string', description: 'Concrete action starting with a verb, under 70 characters.' },
      description: { type: 'string', description: '1-3 sentences: what to do and the context needed.' },
      acceptance: { type: 'array', items: { type: 'string' }, description: '1-3 checkable criteria for done.' },
      who: { type: 'string', enum: ['codex', 'you', 'together'], description: 'codex: an AI agent on this Mac can finish it alone. you: it needs the person. together: the agent can prepare a draft, the person must finish.' },
      reason: { type: 'string', description: 'One short sentence explaining who.' },
      due: { type: ['string', 'null'], description: 'YYYY-MM-DD, or null.' },
      size: { type: 'string', enum: ['S', 'M', 'L'] } } } },
    questions: { type: 'array', items: { type: 'string' }, description: 'Up to 2 questions only the user can answer. Empty if none.' }
  }
};
/** Asks Codex to break one action into the real tasks behind it, and to judge which of them an agent could do. */
async function enhanceTask(a, onStep) {
  const p = S.projects[a.projectId]; const ms = a.milestoneId && S.milestones[a.milestoneId];
  const W = planWeek();
  const prompt = `I am planning my work in a project tracker. Break this action down into the concrete tasks it really consists of, so I can schedule and do them. This is planning only: do not do the work.

Project: ${p.name} — ${p.thesis || ''}
Action: ${a.title}
Notes: ${a.description || '(none)'}
${a.due ? `Due: ${a.due}\n` : ''}Today: ${todayISO()} (this week runs ${W} to ${addDays(W, 6)})

Use AGENTS.md and .crewdex/HISTORY.md in this folder for context on what exists and what was decided.

Rules:
- Return 1 to 7 tasks, in working order. If the action is already one concrete task, return just that one, improved.
- Each task must be something that can be finished in one sitting and checked off.
- For each task decide who does it:
  - "codex": an AI agent working on this Mac (files, code, documents, slides, data analysis, web research, browser) can complete it end to end without me.
  - "you": it needs me. Anything involving other people (messages, meetings, interviews, approvals, negotiation), decisions and judgment calls that are mine, physical actions, or accounts and payments.
  - "together": the agent can prepare a solid draft or the groundwork, and I have to review, decide or send.
- Give each a due date that fits ${a.due ? 'before ' + a.due : 'a realistic pace'} and respects the order; use null if no date makes sense.
- Keep my intent. Do not add scope. Write in the language of the action.`;
  return Quick.ask({ cwd: p.dir, prompt, schema: ENHANCE_SCHEMA, onStep, effort: 'medium' });
}

/* ================= AGENTS.md (project memory) ================= */
function agentsBlock(p) {
  const acts = actsOf(p.id); const open = acts.filter(a => !a.done);
  const week = open.filter(a => a.bucket !== 'backlog'), later = open.filter(a => a.bucket === 'backlog');
  const line = a => `- ${a.title}${a.due ? ` (due ${a.due})` : ''}${a.who === 'you' ? ' — the user does this' : ''}`;
  const lines = [
    `This folder is the Crewdex project **${p.name}** (${p.kind || 'Project'}, ${isHeld(p) ? 'on hold' : 'active'}). Crewdex keeps this block up to date; edit the Memory section below instead.`,
    '',
    p.thesis ? `**Direction:** ${p.thesis}` : '',
    '',
    `**Tasks** (written by the user; ${acts.length - open.length} done, ${open.length} open)`,
    week.length ? 'This week:' : '', ...week.slice(0, 15).map(line),
    later.length ? 'Later:' : '', ...later.slice(0, 15).map(line),
    '',
    '**Working agreements for Codex here**',
    '- The task list belongs to the user. Do not invent tasks; suggest them in your reply instead.',
    '- Deliverables go in `artifacts/<task>/` unless a task says otherwise.',
    '- `.crewdex/HISTORY.md` lists every earlier run: what was done and where the outputs are. Each run\'s exact steps are in `.crewdex/runs/<id>/steps.md`.',
    '- Project skills live in `.agents/skills/`.',
    '- `.crewdex/` belongs to the Crewdex app. Read it, never edit it.',
    '- After a task, add durable learnings to **Memory** below (edit, don\'t duplicate).',
  ];
  return lines.filter((l, i, arr) => l !== '' || (arr[i - 1] !== '' && i > 0)).join('\n');
}
const AG_START = '<!-- crewdex:managed:start -->', AG_END = '<!-- crewdex:managed:end -->';
async function syncAgents(p) {
  if (!NATIVE || !p.dir) return;
  const path = p.dir + '/AGENTS.md';
  const cur = await nat('readText', { path }).catch(() => null);
  const block = `${AG_START}\n${agentsBlock(p)}\n${AG_END}`;
  let next;
  if (!cur) next = `# ${p.name}\n\n${block}\n\n## Memory\n\n_Codex keeps durable learnings about this project here: decisions, conventions, facts and preferences. Keep entries short and current._\n`;
  else if (cur.includes(AG_START) && cur.includes(AG_END)) next = cur.slice(0, cur.indexOf(AG_START)) + block + cur.slice(cur.indexOf(AG_END) + AG_END.length);
  else next = block + '\n\n' + cur;
  if (next !== cur) await nat('writeText', { path, text: next });
}
