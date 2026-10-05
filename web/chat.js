"use strict";
/* The chatroom: sessions and tasks of the project on the left, the conversation in the middle,
   a file preview / steps pane on the right, and a live strip that shows what the agent is handling right now. */

/* ================= right pane: preview of whatever was clicked, or the step log ================= */
const Pane = {
  tab: 'steps', path: null,
  open(path) { this.path = path; this.tab = 'preview'; UI.paneHidden = false; const c = document.querySelector('.chat'); if (c) c.classList.remove('no-pane'); this.render(); },
  run() { return Runs.map.get(UI.runId) || null; },
  html(run) {
    const prev = this.tab === 'preview';
    const outs = run ? runOutputs(run) : [];
    return `<div class="pane-h"><div class="seg seg-sm"><button class="${prev ? 'on' : ''}" data-act="pane-tab" data-v="preview">Preview</button><button class="${prev ? '' : 'on'}" data-act="pane-tab" data-v="steps">Steps</button></div>
        ${prev && this.path ? `<span class="pane-n" title="${esc(this.path)}">${esc(baseName(this.path))}</span><span class="pane-a"><button class="ibtn" data-act="pane-full" title="Open large">⤢</button><button class="ibtn" data-fopen="ql" data-path="${esc(this.path)}" title="Quick Look">◉</button><button class="ibtn" data-fopen="reveal" data-path="${esc(this.path)}" title="Show in Finder">↗</button></span>` : '<span class="pane-n"></span>'}
        <button class="ibtn" data-act="pane-hide" title="Hide this panel">✕</button></div>
      <div class="pane-b" id="pane-body">${prev ? (this.path ? '<div class="vw-loading">Opening…</div>' : `<div class="pane-empty"><p>Click any file in the conversation to see it here.</p>${outs.length ? `<div class="fact-l">Final outputs of this session</div><div class="pane-outs" data-files="1">${outs.map(f => fileChip(f, 'output')).join('')}</div>` : ''}</div>`)
        : (run ? `${planHTML(run)}<div class="side-h" style="margin-top:6px"><span class="eyebrow">What Codex did</span><button class="linkbtn" data-act="run-folder" data-id="${run.id}">Show log</button></div>${stepsHTML(run)}` : '<div class="pane-empty"><p>Steps appear here once the session starts.</p></div>')}</div>`;
  },
  render() {
    const el = document.getElementById('chat-pane'); if (!el) return;
    el.innerHTML = this.html(this.run());
    if (this.tab === 'preview' && this.path) renderFileInto(document.getElementById('pane-body'), this.path);
    hydrateThumbs(el);
  },
};
window.Pane = Pane;
/** Files the agent presented as its final results (cited as outputs in its last message). */
function runOutputs(run) {
  if (run.outputs && run.outputs.length) return run.outputs;
  if (run.summary && /:codex-file-citation/.test(run.summary)) return citedOutputs(run.summary, run.cwd);
  return [];
}

/* ================= the live strip: the agent with the real thing it is handling ================= */
function liveState(run) {
  if (!run) return { pose: 'wave', kind: 'new', html: `<div class="lp"><b>Ready when you are.</b><span>Write what you need below. A new Codex session starts in this project's folder, with its memory loaded.</span></div>` };
  const base = run.cwd; const pend = (run.pending || [])[0];
  if (pend) {
    const P = pend.params || {};
    const what = pend.method.includes('commandExecution') ? `wants to run <code>${esc(short(cleanCmd(P.command), 90))}</code>` : pend.method.includes('fileChange') ? 'wants to change files' : pend.method.includes('permissions') ? 'is asking for more access' : pend.method.includes('requestUserInput') ? `asks: ${esc(short(((P.questions || [])[0] || {}).question || 'a question', 110))}` : 'needs your input';
    return { pose: 'wait', kind: 'ask', html: `<div class="lp lp-ask"><span class="lp-k">Waiting for you</span><span>${what}</span></div>` };
  }
  if (run.status === 'completed') {
    const outs = runOutputs(run); const dur = run.endedAt && run.turns && run.turns.length ? Math.max(1, Math.round((new Date(run.endedAt) - new Date(run.turns[run.turns.length - 1].startedAt || run.startedAt)) / 60000)) : null;
    return { pose: run.imported ? 'idle' : 'cheer', kind: 'done', html: `<div class="lp lp-done"><span class="lp-k">${run.imported ? 'On file' : `Done${dur ? ` in ${dur} min` : ''}`}</span>${outs.length ? `<span class="lp-outs" data-files="1">${outs.slice(0, 4).map(f => fileChip(f, 'output')).join('')}${outs.length > 4 ? `<i>+${outs.length - 4}</i>` : ''}</span>` : `<span>${esc(short(firstSentence(run.summary || ''), 150))}</span>`}</div>` };
  }
  if (run.status === 'failed') return { pose: 'alert', kind: 'fail', html: `<div class="lp lp-ask"><span class="lp-k">Stopped by an error</span><span>${esc(short(run.error || 'Something went wrong.', 160))}</span></div>` };
  if (run.status === 'interrupted') return { pose: 'idle', kind: 'idle', html: `<div class="lp"><span class="lp-k">Paused</span><span>Send a message to pick it up again.</span></div>` };
  const live = [...(run.live || new Map()).values()]; const cur = live[live.length - 1];
  if (!cur) return { pose: 'think', kind: 'think', html: `<div class="lp lp-think"><span class="lp-k">${run.status === 'starting' ? 'Getting set up' : 'Deciding the next step'}</span><span class="thinking"><i></i><i></i><i></i></span></div>` };
  switch (cur.type) {
    case 'reasoning': { const t = (cur.summary || []).join(' ').replace(/[*#`]/g, '').trim(); return { pose: 'think', kind: 'think', html: `<div class="lp lp-think"><span class="lp-k">Thinking</span><span>${esc(t ? '…' + t.slice(-170) : 'working it out')}</span></div>` }; }
    case 'agentMessage': { const t = parseUserText(cur.text || '').text.replace(/:codex-[a-z-]+(\[[^\]]*\])?\{[^}]*\}?/g, '').replace(/[*#`]/g, '').trim(); return { pose: 'wave', kind: 'say', html: `<div class="lp lp-say"><span class="lp-k">Writing to you</span><span>${esc(t ? '…' + t.slice(-170) : '')}</span></div>` }; }
    case 'commandExecution': {
      if (isExplore(cur)) { const acts = cur.commandActions || []; const names = [...new Set(acts.map(a => a.type === 'read' ? relTo(a.path || a.name, base) : a.type === 'search' ? `“${a.query || '…'}”` : relTo(a.path || '.', base) || '.'))]; const verb = acts.every(a => a.type === 'read') ? 'Reading' : acts.every(a => a.type === 'search') ? 'Searching for' : 'Looking through'; return { pose: 'carry', kind: 'read', html: `<div class="lp lp-read"><span class="lp-k">${verb}</span><span class="lp-papers">${names.slice(0, 3).map(n => `<b>${esc(short(n, 44))}</b>`).join('')}${names.length > 3 ? `<i>+${names.length - 3}</i>` : ''}</span></div>` }; }
      const out = String(cur.aggregatedOutput || '').replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '').split('\n').filter(l => l.trim()).slice(-2);
      return { pose: 'type', kind: 'run', html: `<div class="lp lp-term"><code>$ ${esc(short(cleanCmd(cur.command), 120))}</code>${out.map(l => `<span>${esc(short(l, 130))}</span>`).join('')}</div>` };
    }
    case 'fileChange': { const ch = cur.changes || []; const c0 = ch[ch.length - 1]; if (!c0) return { pose: 'type', kind: 'edit', html: `<div class="lp"><span class="lp-k">Writing files</span></div>` }; const st = Render.diffStat(c0.diff); const added = String(c0.diff || '').split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++')).slice(0, 3); return { pose: 'type', kind: 'edit', html: `<div class="lp lp-edit"><span class="lp-k">${(c0.kind || {}).type === 'add' ? 'Creating' : 'Editing'} <b>${esc(relTo(c0.path, base))}</b> <i class="da">+${st.add}</i> <i class="dd">−${st.del}</i>${ch.length > 1 ? ` · ${ch.length} files` : ''}</span>${added.map(l => `<code>${esc(short(l, 120))}</code>`).join('')}</div>` }; }
    case 'webSearch': { const a = cur.action || {}; const q = a.type === 'open_page' ? a.url : cur.query || a.query || (a.queries || [])[0] || ''; const res = (cur.results || []).slice(0, 2).map(r => r.title || r.url).filter(Boolean); return { pose: 'idle', kind: 'web', html: `<div class="lp lp-web"><span class="lp-bar">${a.type === 'open_page' ? '↗' : '⌕'} ${esc(short(q || 'the web', 110))}</span>${res.map(t => `<span>${esc(short(t, 110))}</span>`).join('')}</div>` }; }
    case 'imageGeneration': { const src = cur.savedPath ? fileURL(cur.savedPath) : ''; return { pose: 'idle', kind: 'image', html: `<div class="lp lp-img">${src ? `<img src="${src}" alt="">` : '<i class="lp-canvas"></i>'}<span><span class="lp-k">Painting an image</span>${esc(short(cur.revisedPrompt || '', 130))}</span></div>` }; }
    case 'mcpToolCall': { const img = ((cur.result && cur.result.content) || []).filter(c => c.type === 'image' && c.data).pop(); const cu = /computer|cua/i.test(cur.server); const args = cur.arguments && typeof cur.arguments === 'object' ? cur.arguments : {}; return { pose: cu ? 'type' : 'idle', kind: 'tool', html: `<div class="lp lp-img">${img ? `<img src="data:${esc(img.mimeType || 'image/png')};base64,${img.data}" alt="">` : ''}<span><span class="lp-k">${cu ? 'Using the computer' : `Using ${esc(SERVER_NAMES[cur.server] || cur.server)}`}</span>${esc(humanTool(cur.tool, args))}</span></div>` }; }
    case 'collabAgentToolCall': return { pose: 'wave', kind: 'tool', html: `<div class="lp"><span class="lp-k">Asking a helper agent</span><span>${esc(short(cur.prompt || '', 150))}</span></div>` };
    default: return { pose: 'think', kind: 'think', html: `<div class="lp lp-think"><span class="lp-k">Working</span><span class="thinking"><i></i><i></i><i></i></span></div>` };
  }
}
function liveHTML(run) {
  const p = S.projects[run ? run.projectId : (UI.runId || '').slice(4)]; const st = liveState(run);
  return `<div class="live k-${st.kind}" id="live" data-pose="${st.pose}" style="${pc(p)}"><div class="live-ag" id="live-ag">${agentSVG({ tone: p.color, pose: st.pose, size: 44 })}</div><div class="live-n"><b>${esc(agentName(p))}</b></div><div class="live-prop" id="live-prop">${st.html}</div></div>`;
}
const Live = {
  raf: 0,
  update(run) { if (this.raf) return; this.raf = requestAnimationFrame(() => { this.raf = 0; this.paint(run); }); },
  paint(run) {
    const el = document.getElementById('live'); if (!el || UI.view !== 'run' || UI.runId !== run.id) return;
    const p = S.projects[run.projectId]; const st = liveState(run);
    if (el.dataset.pose !== st.pose) { document.getElementById('live-ag').innerHTML = agentSVG({ tone: p.color, pose: st.pose, size: 44 }); el.dataset.pose = st.pose; }
    el.className = 'live k-' + st.kind;
    document.getElementById('live-prop').innerHTML = st.html;
  },
};
const Stage = Live; // older call sites

/* ================= usage (small, always there) ================= */
function usageHTML(run) {
  const t = run && run.tokens; const cx = run && run.ctx; const rate = Codex.rate && Codex.rate.primary;
  const pct = cx && cx.window ? Math.min(100, Math.round(cx.used / cx.window * 100)) : null;
  return `${t ? `<div class="us-row" title="Tokens used by this session so far"><span>This session</span><span class="mono">${t.totalTokens >= 1000 ? Math.round(t.totalTokens / 1000) + 'k' : t.totalTokens} tokens${pct != null ? ` · context ${pct}%` : ''}</span></div>` : ''}
    ${rate ? `<div class="us-row" title="Your Codex plan usage for the current period"><span>Codex usage</span><span class="mono">${rate.usedPercent}%${rate.resetsAt ? ` · resets ${new Date(rate.resetsAt * 1000).toLocaleDateString(undefined, { weekday: 'short' })}` : ''}</span></div><div class="us-bar"><i style="width:${Math.min(100, rate.usedPercent)}%"></i></div>` : ''}`;
}

/* ================= chat view ================= */
function vRun() {
  const isNew = String(UI.runId || '').startsWith('new:');
  const run = isNew ? null : Runs.map.get(UI.runId);
  const pid = isNew ? UI.runId.slice(4) : run && run.projectId; const p = S.projects[pid];
  if (!p) return `<div class="empty"><h2>Session not found.</h2><p>It may belong to a project folder that is no longer in Crewdex.</p><button class="tbtn" data-nav="now">Back to projects</button></div>`;
  const liveSt = run && ['starting', 'running', 'waiting'].includes(run.status);
  const key = 'run:' + UI.runId; const c = cmpState(key, run ? { model: run.modelSel || '', effort: run.effort || '', perm: run.perm } : { perm: p.perm || Runs.settings().perm });
  const task = c.taskId && S.actions[c.taskId];
  const runs = Runs.list(pid);
  const tasks = actsOf(pid).filter(a => !a.done).sort((a, b) => (a.bucket === 'backlog') - (b.bucket === 'backlog') || (a.due || '9999').localeCompare(b.due || '9999') || byOrder(a, b)).slice(0, 14);
  return `<div class="chat ${UI.paneHidden ? 'no-pane' : ''}" style="${pc(p)}">
    <aside class="chat-side">
      <button class="cs-proj" data-act="open" data-id="${p.id}" title="Back to the project">${avatar(p.name, p.color, 26)}<span>${esc(p.name)}</span></button>
      <button class="tbtn cs-new ${isNew ? 'on' : ''}" data-act="new-session" data-id="${p.id}">${ic('spark')}New session</button>
      <div class="cs-h">Sessions<span class="mono">${runs.length}</span></div>
      <div class="cs-list">${runs.map(r => `<button class="cs-run ${run && r.id === run.id ? 'on' : ''}" data-act="open-run" data-id="${r.id}" title="${esc(r.title)}"><i class="cs-dot s-${r.status}"></i><span class="cs-t">${esc(r.title)}</span><span class="cs-w">${ago(r.endedAt || r.startedAt)}</span></button>`).join('') || '<p class="cs-empty">No sessions yet.</p>'}</div>
      <div class="cs-h">Tasks<span class="mono">${tasks.length}</span></div>
      <div class="cs-list">${tasks.map(a => `<div class="cs-task ${c.taskId === a.id ? 'on' : ''}"><button class="cs-t" data-act="task" data-id="${a.id}" title="${esc(a.title)}">${esc(a.title)}</button>${a.who === 'codex' || a.who === 'together' ? `<i class="cs-who" title="${a.who === 'codex' ? 'Codex can do this' : 'Codex can draft this'}">✦</i>` : ''}<button class="ibtn" data-act="task-here" data-id="${a.id}" title="Work on this task in ${isNew ? 'the new' : 'this'} session">${ic('play')}</button></div>`).join('') || '<p class="cs-empty">No open tasks.</p>'}</div>
      <div class="cs-usage" id="cs-usage">${usageHTML(run)}</div>
    </aside>
    <section class="chat-main">
      <header class="chat-h"><h1>${esc(run ? run.title : 'New session')}</h1>${run ? statusPill(run.status) : ''}<span class="chat-meta mono">${run ? `${run.kind === 'imported' ? 'imported · ' : ''}${esc(run.model || '')}${run.effort ? ' · ' + esc(run.effort) : ''}` : esc(p.name)}</span>${UI.paneHidden ? `<button class="tbtn" data-act="pane-show">Preview & steps</button>` : ''}</header>
      ${run && run.error ? `<p class="run-err">${esc(run.error)}</p>` : ''}
      <div class="stream" id="stream">${run ? (streamHTML(run) || '<div class="c-dim">Codex is starting…</div>') : `<div class="chat-hello">${agentSVG({ tone: p.color, pose: 'wave', size: 84 })}<h2>What should ${esc(agentName(p))} work on?</h2><p>Type a request, or press ${ic('play')} next to a task on the left to bring it into this session.</p></div>`}</div>
      <div id="pending">${run ? pendingHTML(run) : ''}</div>
      <div id="skill-offer">${run ? skillOfferHTML(run) : ''}</div>
      <div class="chat-foot">
        ${liveHTML(run)}
        <div class="composer-run">
          ${task ? `<div class="cmp-task"><span>${ic('list')}Task: <b>${esc(short(task.title, 60))}</b></span><button class="cmp-x" data-act="task-unlink" aria-label="Remove">✕</button></div>` : ''}
          <textarea id="run-input" rows="1" placeholder="${liveSt ? 'Steer Codex while it works…' : run ? 'Ask a follow-up, or ask for changes…' : 'Ask Codex anything about this project, or give it a job…'}"></textarea>
          ${cmpBar(key)}
          <div class="cr-b"><button class="tbtn cr-enh" data-act="followup-enhance" title="Enhance this message before sending">${ic('spark')}</button>${liveSt ? `<button class="tbtn" data-act="run-stop" data-id="${run.id}">Stop</button>` : ''}<button class="tbtn primary" data-act="run-send">${liveSt ? 'Steer' : 'Send'}</button></div>
        </div>
      </div>
    </section>
    <aside class="chat-pane" id="chat-pane">${Pane.html(run)}</aside>
  </div>`;
}
/** Puts a task into the composer of the open session, so it can be edited or enhanced before sending. */
function taskIntoSession(aid) {
  const a = S.actions[aid]; if (!a) return;
  const c = cmpState('run:' + UI.runId); c.taskId = aid;
  renderNow();
  const ta = document.getElementById('run-input'); if (ta) { ta.value = buildPrompt(a); ta.dispatchEvent(new Event('input')); ta.focus(); }
}
document.addEventListener('click', e => {
  const f = e.target.closest && e.target.closest('[data-followup]'); if (!f) return;
  e.preventDefault();
  const ta = document.getElementById('run-input');
  if (UI.view === 'run' && ta) { ta.value = f.dataset.followup; ta.dispatchEvent(new Event('input')); ta.focus(); RunView.send(); }
});
