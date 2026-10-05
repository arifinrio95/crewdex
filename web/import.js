"use strict";
/* Import from Codex history: read past Codex sessions, let Codex suggest projects,
   then distill each chosen project into milestones, actions, memory and run history. */

const IMP = { stage: 'idle', log: [], threads: [], proposals: [], skipped: [], error: null, results: [], sel: {} };
const impLog = (text, icon = 'search') => { IMP.log.push({ text, icon, at: Date.now() }); if (UI.view === 'import') renderNow(); };

function shortPath(p) { return relTo(p || ''); }
function isScratchCwd(cwd) { return /\/Documents\/Codex\/\d{4}-\d{2}-\d{2}\//.test(cwd + '/') || cwd === Render.home || /\/\.codex\//.test(cwd); }
async function importedIds() {
  const t = await nat('readText', { path: Store.root + '/.crewdex/imported.json' }).catch(() => null);
  const ids = new Set(); try { (JSON.parse(t || '{}').threadIds || []).forEach(i => ids.add(i)); } catch (e) { }
  for (const r of Runs.map.values()) if (r.threadId) ids.add(r.threadId);
  return ids;
}
async function markImported(ids) {
  const cur = await importedIds();
  ids.forEach(i => cur.add(i));
  await nat('writeText', { path: Store.root + '/.crewdex/imported.json', text: JSON.stringify({ threadIds: [...cur], updatedAt: new Date().toISOString() }, null, 2) });
}

/** Lists Codex sessions worth looking at, newest first. */
async function scanThreads() {
  await Codex.ensure();
  const done = await importedIds();
  let all = [], cursor = null, guard = 0;
  do { const r = await Codex.req('thread/list', { limit: 100, cursor, sortKey: 'updated_at' }); all = all.concat(r.data || []); cursor = r.nextCursor; } while (cursor && ++guard < 30);
  const total = all.length;
  const root = Store.root;
  const keep = all.filter(t => !t.ephemeral && !t.parentThreadId && !t.agentRole && !['bearing', 'crewdex'].includes(t.originator) && !['bearing', 'crewdex'].includes(t.threadSource)
    && !/\/agents\/[0-9A-F-]{36}\/workspace/i.test(t.cwd) && !/^\/(private\/)?(tmp|var\/folders)\//.test(t.cwd) && !(root && t.cwd.startsWith(root)) && !done.has(t.id) && (t.name || t.preview));
  return { total, already: [...all].filter(t => done.has(t.id)).length, threads: keep };
}

const GROUP_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['projects', 'skippedIds'],
  properties: {
    projects: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name', 'kind', 'thesis', 'sessionIds', 'existingProjectId', 'confidence', 'reason'], properties: {
      name: { type: 'string', description: 'Short project name as the user would say it.' },
      kind: { type: 'string', description: 'One word: Product, Research, Content, Client, Platform, Learning, Personal, Event…' },
      thesis: { type: 'string', description: 'One sentence: where this project is going.' },
      sessionIds: { type: 'array', items: { type: 'string' } },
      existingProjectId: { type: ['string', 'null'], description: 'Id of an existing Crewdex project these sessions belong to, or null.' },
      confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
      reason: { type: 'string', description: 'One short sentence on why these sessions belong together.' } } } },
    skippedIds: { type: 'array', items: { type: 'string' }, description: 'Sessions that are one-off questions or tests, not part of a project.' }
  }
};
async function proposeProjects(threads) {
  const lines = threads.map(t => `${t.id} | ${short(t.name || '', 80)} | ${short((t.preview || '').replace(/^#.*\n/, ''), 140)} | ${shortPath(t.cwd)} | ${new Date(t.updatedAt * 1000).toISOString().slice(0, 10)}`).join('\n');
  const existing = allProjects().map(p => `${p.id} | ${p.name} | ${p.thesis || ''}`).join('\n');
  const prompt = `These are my past Codex sessions (id | title | first message | working folder | last active). Group them into the real projects I am working on.\n\nRules:\n- A project is an ongoing initiative with a goal (a product, a paper, a client engagement, a course, an app). Several sessions usually belong to one project.\n- Folders like ~/Documents/Codex/<date>/<slug> are throwaway chat folders; judge those by title and first message, not by folder.\n- Put one-off questions, quick fixes with no larger goal, and tests in skippedIds.\n- If sessions clearly belong to one of my existing Crewdex projects, set existingProjectId.\n- Use the language I use in the titles for project names.\n\nExisting Crewdex projects (id | name | direction):\n${existing || '(none)'}\n\nSessions:\n${lines}`;
  return Quick.ask({ cwd: Store.root, prompt, schema: GROUP_SCHEMA, effort: 'low', onStep: st => impLog(st.text, st.icon) });
}

const DISTILL_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['thesis', 'kind', 'memory', 'sessions', 'workspace'],
  properties: {
    thesis: { type: 'string', description: 'One sentence: where this project is going.' }, kind: { type: 'string' },
    memory: { type: 'array', items: { type: 'string' }, description: 'Durable facts, decisions, conventions and preferences worth remembering for future work.' },
    sessions: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'title', 'summary', 'outcome'], properties: { id: { type: 'string' }, title: { type: 'string' }, summary: { type: 'string', description: '1-2 sentences of what was done.' }, outcome: { type: 'string', enum: ['done', 'partial', 'abandoned', 'ongoing'] } } } },
    workspace: { type: ['string', 'null'], description: 'Absolute path of the main code or files folder for this project, if one is clear from the sessions; otherwise null.' }
  }
};
async function sessionDigest(t, budget) {
  let turns = [];
  try { const r = await Codex.req('thread/turns/list', { threadId: t.id, limit: 40, itemsView: 'summary', sortDirection: 'asc' }); turns = r.data || []; } catch (e) { }
  if (turns.length > 14) turns = [...turns.slice(0, 4), ...turns.slice(-10)];
  const parts = [];
  turns.forEach(tu => (tu.items || []).forEach(it => {
    if (it.type === 'userMessage') { const tx = (it.content || []).filter(c => c.type === 'text').map(c => c.text).join(' ').replace(/# Files (mentioned|pasted)[\s\S]*?\n\n/g, ''); parts.push(`User: ${short(tx, 420)}`); }
    else if (it.type === 'agentMessage' && it.text) parts.push(`Codex: ${short(it.text, 620)}`);
  }));
  const head = `### Session ${t.id}\nTitle: ${t.name || '(untitled)'}\nFolder: ${t.cwd}\nActive: ${new Date(t.createdAt * 1000).toISOString().slice(0, 10)} to ${new Date(t.updatedAt * 1000).toISOString().slice(0, 10)}\n`;
  let body = parts.join('\n'); if (body.length > budget) body = body.slice(0, budget) + '\n…';
  return head + body;
}
async function distillProject(prop, threads) {
  const per = Math.max(1500, Math.floor(70000 / Math.max(1, threads.length)));
  const digests = [];
  for (const t of threads) { digests.push(await sessionDigest(t, per)); }
  const prompt = `Turn these past Codex sessions into a clear project record for the Crewdex project "${prop.name}" (${prop.kind}). Today is ${todayISO()}.\n\nDirection so far: ${prop.thesis}\n\nSummarize each session (what was done and how it ended) and write memory bullets that would help a future Codex session continue this project well. Do not create tasks or plans; the user writes those. Don't invent work that the sessions don't show.\n\n${digests.join('\n\n')}`;
  return Quick.ask({ cwd: Store.root, prompt, schema: DISTILL_SCHEMA, effort: 'low', onStep: st => impLog(st.text, st.icon) });
}

async function appendMemory(p, bullets) {
  if (!bullets.length) return;
  await syncAgents(p);
  const path = p.dir + '/AGENTS.md';
  const cur = (await nat('readText', { path })) || '';
  const add = bullets.map(b => `- ${b.replace(/^[-*]\s*/, '')}`).join('\n');
  const next = /^## Memory\s*$/m.test(cur) ? cur.replace(/\s*$/, '') + '\n' + add + '\n' : cur + `\n\n## Memory\n\n${add}\n`;
  await nat('writeText', { path, text: next });
}

/** Writes one imported project: project record, milestones, actions, memory, history and one run per session. */
async function writeImport(prop, threads, d) {
  const t0 = Date.now();
  let p = prop.existingProjectId && S.projects[prop.existingProjectId];
  if (!p) {
    const id = createProject(prop.name);
    p = S.projects[id];
    tx(null, () => patch('projects', id, { kind: d.kind || prop.kind, thesis: d.thesis || prop.thesis, workspace: d.workspace && !isScratchCwd(d.workspace) ? d.workspace : null, importedAt: nowTs(), ...(prop.hold ? { status: 'On hold', heldAt: nowTs() } : {}) }));
    p = S.projects[id];
  }
  const tByid = Object.fromEntries(threads.map(t => [t.id, t]));
  let mi = 0, ai = 0;
  // one run per session, so each can be opened and continued
  const runFor = {};
  for (const sd of (d.sessions || [])) {
    const t = tByid[sd.id]; if (!t) continue;
    const rid = 'i' + t.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
    const run = { id: rid, projectId: p.id, taskId: null, kind: 'imported', imported: true, title: (sd.title && (!t.name || /…$/.test(t.name))) ? sd.title : (t.name || sd.title), threadId: t.id, status: 'completed', outcome: sd.outcome, startedAt: new Date(t.createdAt * 1000).toISOString(), endedAt: new Date(t.updatedAt * 1000).toISOString(), turns: [], summary: sd.summary, artifacts: [], perm: 'ask', cwd: t.cwd, steps: [{ at: new Date(t.updatedAt * 1000).toISOString(), icon: 'memory', text: `Imported from Codex history: ${sd.summary}` }] };
    runFor[t.id] = run;
    Runs.map.set(rid, Object.assign({}, run, { items: null, pending: [], live: new Map() })); Runs.byThread.set(t.id, Runs.map.get(rid));
    await nat('writeText', { path: `${p.dir}/.crewdex/runs/${rid}/run.json`, text: JSON.stringify(run, null, 2) });
    await nat('writeText', { path: `${p.dir}/.crewdex/runs/${rid}/steps.md`, text: `# ${run.title}\n\n_Imported from Codex history. Original folder: ${t.cwd}_\n\n${sd.summary}\n\nOutcome: ${sd.outcome}. Open this run in Crewdex to see the full conversation and continue it.\n` });
  }
  await Store.flush();
  await appendMemory(p, d.memory || []);
  const hist = (d.sessions || []).map(sd => { const t = tByid[sd.id]; if (!t) return ''; return `\n## ${new Date(t.updatedAt * 1000).toISOString().slice(0, 10)} · Imported Codex session: ${t.name || sd.title}\n- Outcome: ${sd.outcome}\n- Summary: ${sd.summary}\n- Codex thread \`${t.id}\`, worked in \`${t.cwd}\``; }).join('\n');
  if (hist) await nat('appendText', { path: p.dir + '/.crewdex/HISTORY.md', text: hist + '\n' });
  await markImported(threads.map(t => t.id));
  Runs.loadedProjects.add(p.id);
  return { projectId: p.id, name: p.name, milestones: mi, actions: ai, sessions: Object.keys(runFor).length, ms: Date.now() - t0 };
}

/* ---- flow ---- */
const Importer = {
  async scan() {
    IMP.stage = 'scanning'; IMP.log = []; IMP.error = null; IMP.proposals = []; IMP.results = []; renderNow();
    try {
      impLog('Reading your Codex sessions', 'read');
      const s = await scanThreads();
      IMP.threads = s.threads;
      impLog(`Found ${s.total} sessions${s.already ? `, ${s.already} already in Crewdex` : ''}. ${s.threads.length} are worth a look.`, 'list');
      if (!s.threads.length) { IMP.stage = 'empty'; return renderNow(); }
      impLog('Asking Codex which ones belong together', 'spark');
      const r = await proposeProjects(s.threads);
      const known = new Set(s.threads.map(t => t.id));
      IMP.proposals = (r.projects || []).map((p, i) => Object.assign(p, { key: 'p' + i, sessionIds: p.sessionIds.filter(id => known.has(id)), existingProjectId: p.existingProjectId && S.projects[p.existingProjectId] ? p.existingProjectId : null })).filter(p => p.sessionIds.length).sort((a, b) => b.sessionIds.length - a.sessionIds.length);
      IMP.skipped = (r.skippedIds || []).filter(id => known.has(id));
      IMP.sel = {}; IMP.proposals.forEach(p => { IMP.sel[p.key] = { on: p.confidence !== 'low' && (p.sessionIds.length >= 2 || !!p.existingProjectId), name: p.name, hold: false, ids: new Set(p.sessionIds) }; });
      IMP.stage = 'review';
    } catch (e) { IMP.stage = 'error'; IMP.error = e.message; }
    renderNow();
  },
  async run() {
    const chosen = IMP.proposals.filter(p => IMP.sel[p.key] && IMP.sel[p.key].on && IMP.sel[p.key].ids.size);
    if (!chosen.length) return;
    IMP.stage = 'importing'; IMP.log = []; IMP.results = []; renderNow();
    for (const prop of chosen) {
      const sel = IMP.sel[prop.key]; prop.name = sel.name.trim() || prop.name; prop.hold = !!sel.hold;
      const threads = IMP.threads.filter(t => sel.ids.has(t.id));
      try {
        impLog(`Reading ${plural(threads.length, 'session')} for ${prop.name}`, 'read');
        const d = await distillProject(prop, threads);
        const res = await writeImport(prop, threads, d);
        IMP.results.push(res);
        impLog(`${prop.name}: ${plural(res.sessions, 'session')} and its memory saved`, 'memory');
      } catch (e) { IMP.results.push({ name: prop.name, error: e.message }); impLog(`${prop.name} could not be imported: ${e.message}`, 'stop'); }
    }
    IMP.stage = 'done'; Codex.loadSkills(); renderNow();
  },
};

/* ---- view ---- */
function vImport() {
  const st = IMP.stage;
  const log = `<ol class="mini-steps imp-log">${IMP.log.map(l => `<li>${ic(l.icon)}<span>${inlineMd(l.text)}</span></li>`).join('')}</ol>`;
  let body = '';
  if (st === 'idle') body = `
    <div class="imp-hero">${mascot('wave', 132)}<div><h1 class="imp-h">Let's find what you've been working on.</h1>
      <p class="imp-p">Dex reads your past Codex sessions and groups them into projects, each with its history and memory. You pick what to keep, and the task lists stay yours to write.</p>
      <div class="imp-b"><button class="tbtn primary big" data-act="imp-scan">${ic('search')}Look through my Codex sessions</button><button class="tbtn big" data-nav="now">Not now</button></div>
      <p class="imp-note">Codex reads titles and messages to group them, which uses a little of your Codex usage. You can run this again anytime to pick up new projects.</p></div></div>`;
  else if (st === 'scanning' || st === 'importing') body = `<div class="imp-hero">${mascot('think', 120)}<div><h1 class="imp-h">${st === 'scanning' ? 'Reading your sessions…' : 'Building your projects…'}</h1><p class="imp-p">${st === 'scanning' ? 'This takes about a minute.' : 'Codex is summarizing each conversation and writing the memory of each project.'}</p>${log}<div class="working"><span class="thinking"><i></i><i></i><i></i></span> working</div></div></div>`;
  else if (st === 'empty') body = `<div class="imp-hero">${mascot('happy', 120)}<div><h1 class="imp-h">You're all caught up.</h1><p class="imp-p">Every Codex session that looks like project work is already in Crewdex.</p>${log}<div class="imp-b"><button class="tbtn primary big" data-nav="now">Back to projects</button></div></div></div>`;
  else if (st === 'error') body = `<div class="imp-hero">${mascot('oops', 120)}<div><h1 class="imp-h">That didn't work.</h1><p class="imp-p">${esc(IMP.error || '')}</p>${log}<div class="imp-b"><button class="tbtn primary big" data-act="imp-scan">Try again</button></div></div></div>`;
  else if (st === 'review') {
    const tById = Object.fromEntries(IMP.threads.map(t => [t.id, t]));
    const chosen = IMP.proposals.filter(p => IMP.sel[p.key].on);
    const nSess = chosen.reduce((n, p) => n + IMP.sel[p.key].ids.size, 0);
    body = `<header class="imp-top"><div>${mascot('happy', 84)}</div><div><h1 class="imp-h">Codex found ${plural(IMP.proposals.length, 'project')}.</h1><p class="imp-p">Projects with several sessions are ticked. Untick what you don't want, rename anything, and drop sessions that don't belong. ${IMP.skipped.length ? `${plural(IMP.skipped.length, 'session')} looked like one-off questions and were left out.` : ''}</p></div></header>
      <div class="imp-grid">${IMP.proposals.map((p, i) => { const sel = IMP.sel[p.key]; const ex = p.existingProjectId && S.projects[p.existingProjectId]; const tone = ex ? ex.color : TONES[i % TONES.length]; return `<section class="imp-card ${sel.on ? 'on' : ''}" style="--pc:var(--${tone})">
        <div class="imp-ch"><button class="imp-tick" data-act="imp-toggle" data-k="${p.key}" aria-label="Include">${sel.on ? '✓' : ''}</button>${avatar(sel.name || p.name, tone)}<div class="imp-cn"><input class="imp-name" data-impname="${p.key}" value="${esc(sel.name)}" ${ex ? 'disabled' : ''}><div class="imp-kind">${ex ? `Adds to ${esc(ex.name)}` : esc(p.kind)} · <span class="conf conf-${p.confidence}">${p.confidence === 'high' ? 'sure' : p.confidence === 'medium' ? 'likely' : 'a guess'}</span></div></div></div>
        ${ex ? '' : `<div class="seg seg-sm imp-hold"><button class="${sel.hold ? '' : 'on'}" data-act="imp-hold" data-k="${p.key}" data-v="0">Active now</button><button class="${sel.hold ? 'on' : ''}" data-act="imp-hold" data-k="${p.key}" data-v="1">Keep on hold</button></div>`}
        <p class="imp-thesis">${esc(p.thesis)}</p><p class="imp-why">${esc(p.reason)}</p>
        <div class="imp-sess">${p.sessionIds.map(id => { const t = tById[id]; if (!t) return ''; const on = sel.ids.has(id); return `<label class="imp-s ${on ? 'on' : ''}"><input type="checkbox" data-impsess="${p.key}" data-id="${id}" ${on ? 'checked' : ''}><span class="imp-st">${esc(short(t.name || t.preview, 70))}</span><span class="imp-sd mono">${new Date(t.updatedAt * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></label>`; }).join('')}</div>
      </section>`; }).join('')}</div>
      <div class="imp-bar"><span>${plural(chosen.length, 'project')} · ${plural(nSess, 'session')}</span><button class="tbtn" data-act="imp-all" data-v="1">Select all</button><button class="tbtn" data-act="imp-all" data-v="0">None</button><button class="tbtn" data-act="imp-scan">Scan again</button><button class="tbtn primary big" data-act="imp-run" ${chosen.length ? '' : 'disabled'}>${ic('spark')}Import ${plural(chosen.length, 'project')}</button></div>`;
  }
  else if (st === 'done') {
    const ok = IMP.results.filter(r => !r.error);
    body = `<div class="imp-hero">${mascot('party', 128)}<div><h1 class="imp-h">${ok.length ? `${plural(ok.length, 'project')} moved in.` : 'Nothing was imported.'}</h1><p class="imp-p">Each one has its own folder with memory, history and the sessions it came from. Add your own tasks, and open any session to continue it where you left off.</p>
      <div class="imp-res">${IMP.results.map(r => r.error ? `<div class="imp-r bad">${esc(r.name)} — ${esc(r.error)}</div>` : `<button class="imp-r" data-act="open" data-id="${r.projectId}" style="${pc(S.projects[r.projectId])}">${avatar(r.name, S.projects[r.projectId].color)}<span><b>${esc(r.name)}</b><span class="c-dim">${plural(r.sessions, 'session')} with history and memory</span></span>${ARROW}</button>`).join('')}</div>
      <div class="imp-b"><button class="tbtn primary big" data-nav="now">See my projects</button><button class="tbtn big" data-act="imp-reset">Look for more</button></div></div></div>`;
  }
  return `<div class="imp">${body}</div>`;
}
document.addEventListener('input', e => { const t = e.target; if (t.dataset && t.dataset.impname && IMP.sel[t.dataset.impname]) IMP.sel[t.dataset.impname].name = t.value; });
document.addEventListener('change', e => {
  const t = e.target; if (!t.dataset || !t.dataset.impsess) return;
  const s = IMP.sel[t.dataset.impsess]; if (!s) return;
  t.checked ? s.ids.add(t.dataset.id) : s.ids.delete(t.dataset.id);
  t.closest('.imp-s').classList.toggle('on', t.checked);
  const bar = document.querySelector('.imp-bar span'); if (bar) { const chosen = IMP.proposals.filter(p => IMP.sel[p.key].on); bar.textContent = `${plural(chosen.length, 'project')} · ${plural(chosen.reduce((n, p) => n + IMP.sel[p.key].ids.size, 0), 'session')}`; }
});

/* ---- imported runs: load the original conversation from Codex on first open ---- */
async function hydrateImported(run) {
  run.items = []; run.steps = run.steps || [];
  try {
    await Codex.ensure();
    let cursor = null, items = [], guard = 0;
    do { const r = await Codex.req('thread/turns/list', { threadId: run.threadId, limit: 50, cursor, itemsView: 'full', sortDirection: 'asc' }); (r.data || []).forEach(t => (t.items || []).forEach(it => items.push(it))); cursor = r.nextCursor; } while (cursor && ++guard < 20);
    run.items = items;
    const p = S.projects[run.projectId]; const dir = Runs.dirOf(run);
    const steps = items.map(it => { const s = humanStep(it, run.cwd); return s ? Object.assign({ at: run.endedAt, kind: it.type }, s) : null; }).filter(Boolean);
    run.steps = [run.steps[0], ...steps].filter(Boolean);
    if (dir) {
      await nat('writeText', { path: dir + '/events.jsonl', text: items.map(item => JSON.stringify({ t: run.endedAt, type: 'item', item })).join('\n') + '\n' });
      await nat('appendText', { path: dir + '/steps.md', text: '\n## Steps\n\n' + steps.map((s, i) => `${i + 1}. ${s.text}`).join('\n') + '\n' });
      Runs.save(run);
    }
    if (p) { const c = ProjectCodex.cache[p.id]; if (c) c.at = 0; }
  } catch (e) { run.error = `Could not load this conversation from Codex: ${e.message}`; }
  return run;
}
