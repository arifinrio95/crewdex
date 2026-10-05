"use strict";
/* Demo backend for the product film: a fake native bridge and a scripted fake `codex app-server`.
   The real Crewdex UI runs against it, so every screen in the film is the actual app. */
(function () {
  const HOME = '/Users/rio', ROOT = HOME + '/Crewdex';
  const FS = new Map();                                    // virtual file system: path -> text
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const now = () => new Date();
  const dISO = off => { const d = new Date(); d.setDate(d.getDate() + off); return d.toISOString(); };
  FS.set(ROOT + '/.crewdex/settings.json', JSON.stringify({ name: 'Rio', perm: 'ask', lastModel: '', lastEffort: '' }));

  // files that exist "on disk" for previews; mapped to assets under /film/files/
  const ASSET = {
    'validation-deck.pptx': 'deck-thumb.svg', 'validation-deck.pdf': 'deck-pdf.html', 'validation-chart.html': 'chart.html',
    'benchmark-comparison.csv': 'benchmark-comparison.csv', 'cover.png': 'cover.svg', 'validation-notes.md': 'validation-notes.md',
    'snlik-2024.csv': 'benchmark-comparison.csv', 'SKILL.md': 'SKILL.md',
  };
  const baseName = p => String(p).split('/').pop();
  window.__demoFile = p => '/film/files/' + (ASSET[baseName(p)] || baseName(p));
  const demoText = async p => { const a = ASSET[baseName(p)]; if (!a) return null; try { const r = await fetch('/film/files/' + a); return r.ok ? await r.text() : null; } catch (e) { return null; } };

  /* ---------------- native bridge ---------------- */
  async function native(m) {
    const p = m.path || '';
    switch (m.op) {
      case 'info': return { home: HOME, root: ROOT, codexPath: '/usr/local/bin/codex', version: '1.0' };
      case 'listProjects': { const out = []; for (const [k, v] of FS) { const mm = k.match(/^(.*)\/\.crewdex\/project\.json$/); if (mm) out.push({ dir: mm[1], text: v }); } return out; }
      case 'readText': return FS.has(p) ? FS.get(p) : await demoText(p);
      case 'writeText': FS.set(p, m.text); return true;
      case 'appendText': FS.set(p, (FS.get(p) || '') + m.text); return true;
      case 'exists': return FS.has(p) || ASSET[baseName(p)] ? 'file' : ([...FS.keys()].some(k => k.startsWith(p + '/')) ? 'dir' : null);
      case 'list': { const out = []; const seen = new Set(); for (const k of FS.keys()) if (k.startsWith(p + '/')) { const rest = k.slice(p.length + 1); const name = m.recursive ? rest : rest.split('/')[0]; if (m.recursive && rest.split('/').some(s => s.startsWith('.'))) continue; if (seen.has(name)) continue; seen.add(name); out.push({ name, path: p + '/' + name, dir: !m.recursive && rest.includes('/'), size: 1000, mtime: Date.now() }); } return out; }
      case 'thumbnail': return '/film/files/' + ({ pptx: 'deck-thumb.svg', pdf: 'pdf-thumb.svg', md: 'md-thumb.svg', csv: 'csv-thumb.svg', html: 'chart-thumb.svg' }[p.split('.').pop()] || 'md-thumb.svg');
      case 'pickFiles': return [HOME + '/Desktop/snlik-2024.csv'];
      case 'pickFolder': return null;
      case 'codex.start': return '/usr/local/bin/codex';
      case 'codex.send': Server.receive(m.line); return true;
      default: return true;                                 // mkdir, copy, badge, notify, windowColor, reveal, open, quicklook…
    }
  }
  window.webkit = { messageHandlers: { native: { postMessage: m => native(m) } } };

  /* ---------------- fake app-server ---------------- */
  const out = m => setTimeout(() => window.__codexIn && window.__codexIn(JSON.stringify(m)), 0);
  const notify = (method, params) => out({ method, params });
  let seq = 0; const nid = p => p + (++seq);
  const MODELS = [
    { id: 'gpt-6.1-sol', model: 'gpt-6.1-sol', displayName: 'GPT-6.1-Sol', isDefault: true, hidden: false, defaultReasoningEffort: 'medium', supportedReasoningEfforts: ['low', 'medium', 'high', 'xhigh'].map(e => ({ reasoningEffort: e, description: '' })) },
    { id: 'gpt-6-astra', model: 'gpt-6-astra', displayName: 'GPT-6-Astra', isDefault: false, hidden: false, defaultReasoningEffort: 'high', supportedReasoningEfforts: ['medium', 'high', 'xhigh', 'max'].map(e => ({ reasoningEffort: e, description: '' })) },
    { id: 'gpt-6-luna', model: 'gpt-6-luna', displayName: 'GPT-6-Luna', isDefault: false, hidden: false, defaultReasoningEffort: 'low', supportedReasoningEfforts: ['low', 'medium', 'high'].map(e => ({ reasoningEffort: e, description: '' })) },
  ];
  const sysSkill = (name, description) => ({ name, description, path: `${HOME}/.codex/skills/.system/${name}/SKILL.md`, scope: 'system', enabled: true, pluginId: null });
  const SESSIONS = [
    ['Nusa Persona', ['Bangun engine footfall Tangsel', 'Buat slide prestasi Nusa Persona', 'Audit runtime lokal dan environment', 'Susun spesifikasi Managed Service Report', 'Uji persona dan swarm Balikpapan', 'Petakan sumber data publik', 'Revamp slide grounding dan swarm', 'Bangun web deck dan ekspor PDF', 'Tetapkan MAE prediksi lima kota']],
    ['Datasans', ['Outline RAG ebook', 'Draft chapter 2 RAG ebook', 'Carousel data science harian', 'Ebook Matematika LLM bab 3', 'Rancang content engine v1', 'Hook thread peluncuran ebook']],
    ['LESTARI Paper', ['Ringkas komentar reviewer 2', 'Revisi bagian metodologi', 'Rerun ablation kohort 2023', 'Cek panduan format jurnal']],
    ['LNA Platform', ['Finalize competency levels', 'Write prototype brief', 'Map framework to question bank']],
  ];
  const THREADS = []; SESSIONS.forEach(([proj, names], pi) => names.forEach((n, i) => THREADS.push({ id: `th-${pi}-${i}`, sessionId: `th-${pi}-${i}`, name: n, preview: n, cwd: `${HOME}/Work/${proj.replace(/ /g, '-').toLowerCase()}`, createdAt: Math.floor(Date.now() / 1000) - (60 - pi * 9 - i * 3) * 86400, updatedAt: Math.floor(Date.now() / 1000) - (40 - pi * 7 - i * 3) * 86400, ephemeral: false, parentThreadId: null, agentRole: null, originator: 'Codex Desktop', threadSource: null, proj })));
  ['what is the capital of australia', 'fix typo in readme', 'convert this png to jpg', 'explain regex lookahead', 'test', 'cek cuaca besok'].forEach((n, i) => THREADS.push({ id: 'th-x-' + i, sessionId: 'th-x-' + i, name: n, preview: n, cwd: `${HOME}/Documents/Codex/2026-09-0${i + 1}/a`, createdAt: 1, updatedAt: Math.floor(Date.now() / 1000) - i * 86400 * 4, ephemeral: false, parentThreadId: null, agentRole: null, originator: 'Codex Desktop' }));

  const Server = {
    threads: new Map(), waiting: new Map(), skillsExtra: [],
    receive(line) { let m; try { m = JSON.parse(line); } catch (e) { return; } if (m.id != null && !m.method) { const w = this.waiting.get(m.id); if (w) { this.waiting.delete(m.id); w(m.result); } return; } if (m.method && m.id != null) this.handle(m).then(r => out({ id: m.id, result: r })).catch(e => out({ id: m.id, error: { code: -32000, message: String(e.message || e) } })); },
    ask(method, params) { const id = nid('srv'); return new Promise(res => { this.waiting.set(id, res); out({ id, method, params }); }); },
    async handle(m) {
      const P = m.params || {};
      switch (m.method) {
        case 'initialize': return { userAgent: 'crewdex-demo', codexHome: HOME + '/.codex', platformFamily: 'unix', platformOs: 'macos' };
        case 'account/read': return { account: { type: 'chatgpt', email: 'rio@crewdex.app', planType: 'pro' }, requiresOpenaiAuth: true };
        case 'account/rateLimits/read': return { rateLimits: { primary: { usedPercent: 22, windowDurationMins: 10080, resetsAt: Math.floor(Date.now() / 1000) + 3 * 86400 } } };
        case 'model/list': return { data: MODELS, nextCursor: null };
        case 'skills/list': return { data: (P.cwds || [ROOT]).map(cwd => ({ cwd, skills: [sysSkill('skill-creator', 'Create or update a reusable skill.'), sysSkill('imagegen', 'Generate and edit images.'), { name: 'presentations:Presentations', description: 'Create and edit slide decks.', path: HOME + '/.codex/plugins/presentations/SKILL.md', scope: 'user', enabled: true, pluginId: 'presentations' }, { name: 'pdf:pdf', description: 'Create and read PDF files.', path: HOME + '/.codex/plugins/pdf/SKILL.md', scope: 'user', enabled: true, pluginId: 'pdf' }, ...this.skillsExtra.filter(s => s.path.startsWith(cwd + '/'))] })) };
        case 'thread/list': return { data: THREADS, nextCursor: null };
        case 'thread/turns/list': return { data: [{ id: 't1', items: [{ type: 'userMessage', id: 'u', content: [{ type: 'text', text: 'lanjutkan' }] }, { type: 'agentMessage', id: 'a', text: 'Selesai.' }] }], nextCursor: null };
        case 'plugin/installed': return { marketplaces: [{ plugins: ['Documents', 'PDF', 'Presentations', 'Spreadsheets', 'Visualize', 'Browser', 'Computer Use'].map(n => ({ installed: true, enabled: true, name: n, interface: { displayName: n } })) }] };
        case 'mcpServerStatus/list': return { data: ['cua_repl', 'node_repl', 'codex_apps', 'browser'].map(name => ({ name, tools: { a: {}, b: {}, c: {} } })) };
        case 'thread/start': { const id = nid('demo-thread-'); this.threads.set(id, { id, cwd: P.cwd, ephemeral: !!P.ephemeral }); return { thread: { id }, model: P.model || 'gpt-6.1-sol', modelProvider: 'openai' }; }
        case 'thread/resume': return { thread: { id: P.threadId }, model: 'gpt-6.1-sol' };
        case 'turn/start': { const turnId = nid('turn-'); setTimeout(() => this.runTurn(P, turnId), 30); return { turn: { id: turnId, items: [], status: 'inProgress' } }; }
        case 'turn/steer': case 'turn/interrupt': return {};
        default: return {};
      }
    },
    /* ---- helpers for scripted turns ---- */
    ctx(threadId, turnId) {
      const base = { threadId, turnId };
      const S2 = {
        threadId, turnId,
        started: item => notify('item/started', Object.assign({ item }, base)),
        done: item => notify('item/completed', Object.assign({ item }, base)),
        async think(text, ms = 1100) { const id = nid('rs'); S2.started({ type: 'reasoning', id, summary: [''], content: [] }); const words = text.split(' '); for (const w of words) { notify('item/reasoning/summaryTextDelta', Object.assign({ itemId: id, delta: w + ' ', summaryIndex: 0 }, base)); await sleep(ms / words.length); } S2.done({ type: 'reasoning', id, summary: [text], content: [] }); },
        async say(text, ms = 1600, phase = 'final_answer') { const id = nid('msg'); S2.started({ type: 'agentMessage', id, text: '', phase }); const chunks = text.match(/[\s\S]{1,14}/g) || []; for (const c of chunks) { notify('item/agentMessage/delta', Object.assign({ itemId: id, delta: c }, base)); await sleep(ms / chunks.length); } S2.done({ type: 'agentMessage', id, text, phase }); },
        async read(cwd, names, ms = 650) { const id = nid('cmd'); const item = { type: 'commandExecution', id, command: `/bin/zsh -lc 'cat ${names.join(' ')}'`, cwd, source: 'agent', status: 'inProgress', commandActions: names.map(n => ({ type: 'read', command: 'cat ' + n, name: n, path: cwd + '/' + n })), aggregatedOutput: null, exitCode: null, durationMs: null, pluginId: null }; S2.started(item); await sleep(ms); S2.done(Object.assign({}, item, { status: 'completed', exitCode: 0, durationMs: 40, aggregatedOutput: '' })); },
        async run(cwd, command, lines, ms = 1700, exitCode = 0) { const id = nid('cmd'); const item = { type: 'commandExecution', id, command: `/bin/zsh -lc '${command}'`, cwd, source: 'agent', status: 'inProgress', commandActions: [{ type: 'unknown', command }], aggregatedOutput: '', exitCode: null, durationMs: null, pluginId: null }; S2.started(item); let agg = ''; for (const l of lines) { await sleep(ms / lines.length); agg += l + '\n'; notify('item/commandExecution/outputDelta', Object.assign({ itemId: id, delta: l + '\n' }, base)); } S2.done(Object.assign({}, item, { status: 'completed', exitCode, durationMs: ms, aggregatedOutput: agg })); return id; },
        async web(query, results, ms = 1300) { const id = nid('web'); S2.started({ type: 'webSearch', id, query, action: { type: 'search', query }, results: null }); await sleep(ms); S2.done({ type: 'webSearch', id, query, action: { type: 'search', query }, results }); },
        async write(changes, ms = 1200) { const id = nid('fc'); S2.started({ type: 'fileChange', id, changes, status: 'inProgress' }); await sleep(ms); S2.done({ type: 'fileChange', id, changes, status: 'completed' }); },
        async image(prompt, savedPath, ms = 1900) { const id = nid('img'); S2.started({ type: 'imageGeneration', id, status: 'in_progress', revisedPrompt: prompt, result: '' }); await sleep(ms); S2.done({ type: 'imageGeneration', id, status: 'completed', revisedPrompt: prompt, result: '', savedPath, failure: null }); },
        async tool(server, tool, args, resultContent, ms = 1500) { const id = nid('mcp'); const item = { type: 'mcpToolCall', id, server, tool, status: 'inProgress', arguments: args, result: null, error: null, mcpAppUi: null, pluginId: null, durationMs: null }; S2.started(item); await sleep(ms); S2.done(Object.assign({}, item, { status: 'completed', result: { content: resultContent, structuredContent: null, _meta: null }, durationMs: ms })); },
        plan(steps, at) { notify('turn/plan/updated', Object.assign({ explanation: null, plan: steps.map((s, i) => ({ step: s, status: i < at ? 'completed' : i === at ? 'inProgress' : 'pending' })) }, base)); },
        tokens(n) { notify('thread/tokenUsage/updated', { threadId, turnId, tokenUsage: { total: { totalTokens: n, inputTokens: n, cachedInputTokens: 0, cacheWriteInputTokens: 0, outputTokens: 0, reasoningOutputTokens: 0 }, last: { totalTokens: Math.round(n * .62) }, modelContextWindow: 400000 } }); },
        finish(items) { notify('thread/status/changed', { threadId, status: { type: 'idle' } }); notify('turn/completed', { threadId, turn: { id: turnId, items: items || [], status: 'completed', error: null } }); },
      };
      return S2;
    },
    async runTurn(P, turnId) {
      const threadId = P.threadId; const th = this.threads.get(threadId) || { cwd: ROOT };
      const text = (P.input || []).filter(i => i.type === 'text').map(i => i.text).join('\n');
      const c = this.ctx(threadId, turnId);
      notify('turn/started', { threadId, turn: { id: turnId, items: [], status: 'inProgress' } });
      if (P.outputSchema) return this.quick(P, text, c, th);
      if (/reusable skill/i.test(text)) return this.skillTurn(text, c, th);
      if (/^\s*(Make a shorter|Add a caveat)/i.test(text)) return this.followTurn(text, c, th);
      if (window.__demoShort) return this.shortTurn(text, c, th);
      return this.showcaseTurn(text, c, th);
    },
    async shortTurn(text, c, th) {
      const k = (this._short = (this._short || 0) + 1); const cwd = th.cwd;
      await sleep(300 + k * 350); c.tokens(18000);
      await c.think('Reading the project memory, then doing the task.', 900);
      await c.read(cwd, ['AGENTS.md'], 700);
      await c.run(cwd, 'python work.py', ['working…', 'checks passed'], 1500 + k * 500); c.tokens(52000);
      await c.write([{ path: cwd + '/artifacts/result-' + k + '.md', kind: { type: 'add' }, diff: '--- /dev/null\n+++ b/result.md\n@@ -0,0 +1,2 @@\n+# Result\n+Done and checked.' }], 1200);
      await c.say('Done. The result is saved in the project folder and the memory is updated.', 900);
      c.finish();
    },
    /* ---- structured answers (import, breakdown, enhance prompt, Dex) ---- */
    async quick(P, text, c, th) {
      const keys = Object.keys((P.outputSchema || {}).properties || {});
      let ans = {};
      if (keys.includes('projects')) {            // import: group sessions into projects
        await sleep(900);
        const byProj = {}; THREADS.forEach(t => { if (t.proj) (byProj[t.proj] = byProj[t.proj] || []).push(t.id); });
        const info = { 'Nusa Persona': ['Product', 'From synthetic population to a commercially usable insight engine.', 'high'], 'Datasans': ['Content', 'A content engine that turns one idea into a week of distribution.', 'high'], 'LESTARI Paper': ['Research', 'A revised manuscript that survives the second round of review.', 'high'], 'LNA Platform': ['Platform', 'A learning-needs assessment a team can run without a consultant.', 'medium'] };
        ans = { projects: Object.entries(byProj).map(([name, ids]) => ({ name, kind: info[name][0], thesis: info[name][1], sessionIds: ids, existingProjectId: null, confidence: info[name][2], reason: `${ids.length} sessions share this goal and folder.` })), skippedIds: THREADS.filter(t => !t.proj).map(t => t.id) };
      } else if (keys.includes('sessions')) {      // import: distill one project
        await sleep(500);
        const name = (text.match(/Crewdex project "([^"]+)"/) || [])[1]; const ths = THREADS.filter(t => t.proj === name);
        ans = { thesis: (text.match(/Direction so far: (.*)/) || [])[1] || '', kind: 'Project', memory: ['Deliverables are reviewed on Fridays.', 'Use the 2024 benchmark as the reference year.', 'Decks follow the pearl-and-cobalt house style.'], sessions: ths.map(t => ({ id: t.id, title: t.name, summary: `Worked on “${t.name}” and left notes for the next step.`, outcome: 'done' })), workspace: null };
      } else if (keys.includes('tasks')) {         // break down a task
        await c.read(th.cwd, ['AGENTS.md'], 500); await sleep(500);
        const d = n => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
        ans = { summary: 'Compare, visualise, build the deck, then you present it.', tasks: [
          { title: 'Compare synthetic survey vs SNLIK benchmark', description: 'Run the comparison per province and flag gaps above 5 points.', acceptance: ['Gap table saved as CSV'], who: 'codex', reason: 'Data analysis on local files.', due: d(1), size: 'M' },
          { title: 'Build the validation chart', description: 'One interactive chart: synthetic vs benchmark by indicator.', acceptance: ['Chart opens in a browser'], who: 'codex', reason: 'Codex can write and run the chart code.', due: d(2), size: 'S' },
          { title: 'Assemble the validation deck', description: 'Eight slides in house style with the chart and the gap table.', acceptance: ['PPTX and PDF exported'], who: 'together', reason: 'Codex drafts, you approve the claims.', due: d(3), size: 'M' },
          { title: 'Present the deck to the pilot partner', description: 'Walk the partner through the evidence and collect their concerns.', acceptance: ['Meeting held'], who: 'you', reason: 'It is a conversation with people.', due: d(5), size: 'S' }], questions: [] };
      } else if (keys.includes('prompt')) {        // enhance a prompt
        await c.read(th.cwd, ['AGENTS.md', '.crewdex/HISTORY.md'], 600); await sleep(600);
        ans = { prompt: 'Prepare the Nusa Persona validation deck for Friday\'s pilot review.\n\nGoal: show what evidence supports pilot readiness and what is still unproven.\n\nContext: the project memory says the 2024 SNLIK benchmark is the reference year and decks follow the pearl-and-cobalt house style. Use the attached snlik-2024.csv.\n\nDo this:\n1. Compare the synthetic survey against the benchmark per province.\n2. Build one chart of the gaps.\n3. Assemble an 8-slide deck with a generated cover image.\n\nDeliverables in artifacts/prepare-validation-deck/: validation-deck.pptx, validation-deck.pdf, validation-chart.html.\n\nDone when every number on a slide traces to the comparison table.', notes: ['Added the benchmark year from project memory', 'Named the three deliverables and their folder', 'Stated how to verify the result'] };
      } else if (keys.includes('ops')) {           // Dex: plan the week
        await sleep(900);
        const acts = (text.match(/"openActions":(\[.*?\])\}/) || [])[1]; let ids = []; try { ids = JSON.parse(acts).filter(a => a.list === 'backlog').slice(0, 4).map(a => a.id); } catch (e) { }
        ans = { summary: `Moved ${ids.length} tasks into this week, nearest deadlines first.`, ops: ids.map(id => ({ op: 'set_list', milestoneId: null, date: null, projectId: null, title: null, list: 'commit', state: null, due: null, actionId: id, actionIds: null })) };
      }
      c.done({ type: 'agentMessage', id: nid('msg'), text: JSON.stringify(ans), phase: 'final_answer' });
      c.finish();
    },
    /* ---- the long run that shows everything Codex can do ---- */
    async showcaseTurn(text, c, th) {
      const cwd = th.cwd; const dir = cwd + '/artifacts/prepare-validation-deck';
      const steps = ['Read the project memory', 'Compare survey vs benchmark', 'Research the benchmark', 'Build chart and cover', 'Assemble and check the deck'];
      window.__demoBeat && window.__demoBeat('think');
      await sleep(500); c.tokens(21000);
      await c.think('Planning the deck: read the project memory, compare the synthetic survey with the benchmark, chart the gaps, then assemble the slides.', 1700);
      c.plan(steps, 0);
      window.__demoBeat && window.__demoBeat('read');
      await c.read(cwd, ['AGENTS.md'], 800); await c.read(cwd, ['.crewdex/HISTORY.md', 'snlik-2024.csv'], 900); c.tokens(48000);
      c.plan(steps, 1);
      window.__demoBeat && window.__demoBeat('run');
      await c.run(cwd, 'python compare_snlik.py --year 2024', ['loading 10,000 synthetic respondents…', 'matching 38 provinces against SNLIK 2024', 'mean absolute gap: 3.1 points', 'wrote benchmark-comparison.csv'], 2600); c.tokens(73000);
      c.plan(steps, 2);
      window.__demoBeat && window.__demoBeat('web');
      await c.web('SNLIK 2024 financial literacy index by province', [{ title: 'OJK — Survei Nasional Literasi dan Inklusi Keuangan 2024', url: 'https://ojk.go.id/snlik-2024' }, { title: 'BPS — Indeks literasi keuangan menurut provinsi', url: 'https://bps.go.id/literasi-keuangan' }], 1900); c.tokens(96000);
      c.plan(steps, 3);
      window.__demoBeat && window.__demoBeat('approve');
      const apId = nid('cmd'); const apItem = { type: 'commandExecution', id: apId, command: "/bin/zsh -lc 'pip install python-pptx'", cwd, source: 'agent', status: 'inProgress', commandActions: [{ type: 'unknown', command: 'pip' }], aggregatedOutput: '', exitCode: null, durationMs: null, pluginId: null };
      c.started(apItem);
      await this.ask('item/commandExecution/requestApproval', { threadId: c.threadId, turnId: c.turnId, itemId: apId, kind: 'command', startedAtMs: Date.now(), command: 'pip install python-pptx', cwd, reason: 'Needs network access to install the slide library.' });
      window.__demoBeat && window.__demoBeat('approved');
      await sleep(700); c.done(Object.assign({}, apItem, { status: 'completed', exitCode: 0, durationMs: 900, aggregatedOutput: 'Successfully installed python-pptx-1.0.2\n' }));
      window.__demoBeat && window.__demoBeat('write');
      await c.write([{ path: dir + '/validation-chart.html', kind: { type: 'add' }, diff: '--- /dev/null\n+++ b/validation-chart.html\n@@ -0,0 +1,4 @@\n+<canvas id="gaps"></canvas>\n+const provinces = data.map(d => d.province)\n+drawBars(provinces, synthetic, benchmark)\n+highlight(gap => gap > 5)' }], 1900); c.tokens(118000);
      window.__demoBeat && window.__demoBeat('image');
      await c.image('A calm editorial cover: pearl paper, a cobalt compass line crossing a map of Indonesia', HOME + '/.codex/generated_images/cover.png', 2300);
      window.__demoBeat && window.__demoBeat('computer');
      await c.tool('cua_repl', 'open_and_check_slides', { app: 'Keynote', file: 'validation-deck.pptx' }, [{ type: 'text', text: 'Opened the deck in Keynote and paged through all 8 slides. Layout holds.' }, { type: 'image', mimeType: 'image/png', data: window.__demoShot || '' }], 2300); c.tokens(142000);
      c.plan(steps, 4);
      window.__demoBeat && window.__demoBeat('memory');
      await c.write([{ path: cwd + '/AGENTS.md', kind: { type: 'update', move_path: null }, diff: '@@ -18,3 +18,4 @@\n ## Memory\n - Decks follow the pearl-and-cobalt house style.\n+- Validation gap is 3.1 points on average; Papua and Maluku exceed 5 and need a caveat slide.' }], 1300);
      FS.set(cwd + '/AGENTS.md', (FS.get(cwd + '/AGENTS.md') || '') + '- Validation gap is 3.1 points on average; Papua and Maluku exceed 5 and need a caveat slide.\n');
      c.plan(steps, 5);
      window.__demoBeat && window.__demoBeat('answer');
      await c.say(`The validation deck is ready: 8 slides, every number traced to the comparison table.\n\n| Indicator | Synthetic | SNLIK 2024 | Gap |\n|---|---|---|---|\n| Financial literacy | 64.9 | 65.4 | 0.5 |\n| Inclusion | 74.2 | 75.0 | 0.8 |\n| Digital payments | 58.1 | 61.3 | 3.2 |\n\n\`\`\`mermaid\ngraph LR\n  A[Synthetic survey] --> C{Compare}\n  B[SNLIK 2024] --> C\n  C --> D[Gap table]\n  D --> E[Deck]\n\`\`\`\n\nDeck: :codex-file-citation{path="${dir}/validation-deck.pptx" purpose="output"} and :codex-file-citation{path="${dir}/validation-deck.pdf" purpose="output"}. Chart: :codex-file-citation{path="${dir}/validation-chart.html" purpose="output"}. Data: :codex-file-citation{path="${dir}/benchmark-comparison.csv" purpose="output"}.\n\n- :codex-followup[Make it shorter]{prompt="Make a shorter 5-slide version for a 10 minute slot."}\n- :codex-followup[Add a caveat slide]{prompt="Add a caveat slide for Papua and Maluku."}`, 3000);
      c.tokens(151000);
      c.finish();
      window.__demoBeat && window.__demoBeat('done');
    },
    async followTurn(text, c, th) {
      await c.think('Trimming to the five strongest slides.', 700);
      await c.run(th.cwd, 'python build_deck.py --slides 5', ['kept: cover, gap table, chart, caveats, ask', 'exported validation-deck-short.pdf'], 1200);
      await c.say('Done. The 5-slide version keeps the cover, gap table, chart, caveats and the ask.', 900);
      c.finish();
      window.__demoBeat && window.__demoBeat('follow-done');
    },
    async skillTurn(text, c, th) {
      const dir = (text.match(/Write it to (\S+)\/<skill-name>/) || [])[1] || th.cwd + '/.agents/skills';
      const path = dir + '/validation-deck-style/SKILL.md';
      window.__demoBeat && window.__demoBeat('skill-start');
      await c.think('Writing down what made this deck work: structure, palette, type, and the checks.', 1000);
      await c.write([{ path, kind: { type: 'add' }, diff: '--- /dev/null\n+++ b/SKILL.md\n@@ -0,0 +1,5 @@\n+---\n+name: validation-deck-style\n+description: Use for validation or evidence decks in the pearl-and-cobalt house style.\n+---\n+Structure: cover, question, method, gap table, chart, caveats, decision, ask.' }], 1300);
      FS.set(path, '---\nname: validation-deck-style\ndescription: Use for validation or evidence decks in the pearl-and-cobalt house style.\n---\n\nStructure: cover, question, method, gap table, chart, caveats, decision, ask.\n');
      this.skillsExtra.push({ name: 'validation-deck-style', description: 'Use for validation or evidence decks in the pearl-and-cobalt house style.', path, scope: 'repo', enabled: true, pluginId: null });
      await c.say('Saved the skill `validation-deck-style`. It captures the 8-slide structure, the palette and the number-tracing check.', 900);
      c.finish();
      window.__demoBeat && window.__demoBeat('skill-done');
    },
  };
  window.DEMO = { FS, Server, HOME, ROOT, THREADS };
  // deterministic and capture-friendly behaviour inside the app
  document.startViewTransition = undefined;
  Element.prototype.scrollIntoView = function () { };
  const _scrollTo = window.scrollTo.bind(window);
  window.scrollTo = function (a, b) { if (a && typeof a === 'object') _scrollTo(a.left || 0, a.top || 0); else _scrollTo(a, b); };
})();
