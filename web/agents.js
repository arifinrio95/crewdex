"use strict";
/* Agents and the virtual office.
   Every project has a resident agent; Dex is the orchestrator. Each object in the office is drawn
   individually and stands for real project data, so the room reads like a dashboard. */

const AGENT_NAMES = ['Pip', 'Momo', 'Nori', 'Bibi', 'Tako', 'Lulu', 'Kiko', 'Zuzu', 'Dodo', 'Mimi', 'Roro', 'Yuki', 'Coco', 'Fifi', 'Gogo', 'Juju', 'Pau', 'Nana', 'Otto', 'Susu'];
const hashStr = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
function agentName(p) {
  if (p.agentName) return p.agentName;
  const ps = Object.values(S.projects).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)) || a.id.localeCompare(b.id));
  const i = ps.findIndex(x => x.id === p.id);
  return AGENT_NAMES[(i >= 0 ? i : hashStr(p.id)) % AGENT_NAMES.length];
}

/** A full-body mini agent. pose: idle | type | walk | wait | cheer | sleep | think | wave | carry | alert */
function agentSVG({ tone = 'cobalt', pose = 'idle', size = 64, lead = false, attrs = '' } = {}) {
  const pcv = lead ? 'var(--fg)' : `var(--${TONES.includes(tone) ? tone : 'graphite'})`;
  const eyes = {
    cheer: '<path d="M24 26q3-4 6 0M34 26q3-4 6 0" stroke="var(--a-eye)" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
    sleep: '<path d="M24 26h6M34 26h6" stroke="var(--a-eye)" stroke-width="2.2" stroke-linecap="round"/>',
    think: '<circle cx="29" cy="23.5" r="2.6" fill="var(--a-eye)"/><circle cx="39" cy="23.5" r="2.6" fill="var(--a-eye)"/>',
    alert: '<circle cx="27" cy="25" r="3.4" fill="var(--a-eye)"/><circle cx="37" cy="25" r="3.4" fill="var(--a-eye)"/>',
    wait: '<circle cx="27" cy="25" r="3.2" fill="var(--a-eye)"/><circle cx="37" cy="25" r="3.2" fill="var(--a-eye)"/>',
  }[pose] || '<g class="ag-eyes"><rect x="24.4" y="22" width="5.2" height="6.4" rx="2.6" fill="var(--a-eye)"/><rect x="34.4" y="22" width="5.2" height="6.4" rx="2.6" fill="var(--a-eye)"/></g>';
  const mouth = pose === 'cheer' ? '<path d="M29 30.5q3 3 6 0" stroke="var(--a-eye)" stroke-width="1.6" fill="none" stroke-linecap="round"/>' : pose === 'alert' || pose === 'wait' ? '<circle cx="32" cy="31" r="1.5" fill="var(--a-eye)"/>' : '';
  const sitting = pose === 'type' || pose === 'sleep';
  const legs = sitting
    ? `<g class="ag-legs"><rect x="23" y="57" width="8" height="8" rx="4" fill="var(--a-dark)"/><rect x="33" y="57" width="8" height="8" rx="4" fill="var(--a-dark)"/><rect x="20.5" y="62" width="12" height="8" rx="4" fill="var(--a-boot)"/><rect x="31.5" y="62" width="12" height="8" rx="4" fill="var(--a-boot)"/></g>`
    : `<g class="ag-leg ag-leg-l"><rect x="24" y="57" width="6.5" height="13" rx="3.2" fill="var(--a-dark)"/><rect x="21.5" y="68" width="10.5" height="6.5" rx="3.2" fill="var(--a-boot)"/></g><g class="ag-leg ag-leg-r"><rect x="33.5" y="57" width="6.5" height="13" rx="3.2" fill="var(--a-dark)"/><rect x="32" y="68" width="10.5" height="6.5" rx="3.2" fill="var(--a-boot)"/></g>`;
  const prop = pose === 'type' ? `<g class="ag-laptop"><rect x="19" y="50" width="26" height="15" rx="2.5" fill="var(--a-boot)"/><rect x="17" y="64" width="30" height="3.4" rx="1.7" fill="var(--a-dark)"/><circle cx="32" cy="57.5" r="2.4" fill="var(--a-glow)" class="ag-glow"/></g>`
    : pose === 'carry' ? `<g class="ag-doc"><rect x="24" y="44" width="16" height="13" rx="2" fill="var(--raise)" stroke="var(--a-dark)" stroke-width="1"/><path d="M27 48h10M27 51h10M27 54h6" stroke="var(--a-dark)" stroke-width="1" opacity=".5"/></g>` : '';
  const emblem = lead ? `<circle cx="32" cy="49.5" r="5" fill="var(--raise)"/><path d="M32 45.6 33.7 49.5H30.3Z" fill="var(--terracotta)"/><path d="M32 53.4 30.3 49.5h3.4Z" fill="var(--a-dark)" opacity=".4"/>` : `<rect x="26.5" y="45.5" width="11" height="8" rx="3" fill="var(--raise)" opacity=".55"/><circle cx="30" cy="49.5" r="1.2" fill="var(--a-dark)" opacity=".6"/><circle cx="34" cy="49.5" r="1.2" fill="var(--a-dark)" opacity=".6"/>`;
  return `<svg class="ag ag-${pose} ${lead ? 'ag-lead' : ''}" width="${size}" height="${size * 1.25}" viewBox="0 0 64 80" style="--pc:${pcv}" ${attrs} aria-hidden="true">
    <ellipse class="ag-shadow" cx="32" cy="76.5" rx="14" ry="2.8" fill="var(--fg)" opacity=".12"/>
    <g class="ag-all">
      ${lead ? '<path d="M20 40q-7 12-3 24l6-3q-2-10 2-18Z" fill="var(--terracotta)" class="ag-cape"/><path d="M44 40q7 12 3 24l-6-3q2-10-2-18Z" fill="var(--terracotta)" class="ag-cape"/>' : ''}
      ${legs}
      <g class="ag-arm ag-arm-l"><rect x="13.5" y="41" width="6.5" height="15" rx="3.2" fill="var(--a-dark)"/><circle cx="16.8" cy="56.5" r="3.9" fill="var(--a-head)" stroke="var(--a-dark)" stroke-width="1"/></g>
      <g class="ag-arm ag-arm-r"><rect x="44" y="41" width="6.5" height="15" rx="3.2" fill="var(--a-dark)"/><circle cx="47.2" cy="56.5" r="3.9" fill="var(--a-head)" stroke="var(--a-dark)" stroke-width="1"/></g>
      <rect class="ag-body" x="19.5" y="37.5" width="25" height="23" rx="9.5" fill="var(--a-body)"/>
      ${emblem}
      ${prop}
      <g class="ag-head">
        <path d="M32 9V3.6" stroke="var(--a-dark)" stroke-width="2" stroke-linecap="round"/><circle class="ag-ant" cx="32" cy="3.4" r="3.1" fill="var(--sand)"/>
        <circle cx="12.6" cy="25" r="3.8" fill="var(--a-body)"/><circle cx="51.4" cy="25" r="3.8" fill="var(--a-body)"/>
        <rect x="13" y="8.5" width="38" height="31" rx="12.5" fill="var(--a-head)" stroke="var(--a-dark)" stroke-width="1.6"/>
        <rect x="18" y="16" width="28" height="18.5" rx="8.5" fill="var(--a-visor)"/>
        ${eyes}${mouth}
        <ellipse cx="19.5" cy="35.5" rx="2.8" ry="1.6" fill="var(--burgundy)" opacity=".55"/><ellipse cx="44.5" cy="35.5" rx="2.8" ry="1.6" fill="var(--burgundy)" opacity=".55"/>
        ${lead ? '<path d="M17.5 13.5q14.5-10 29 0l1.2-3.2q-15.7-10-31.4 0Z" fill="var(--sand)"/><circle cx="32" cy="8.6" r="2" fill="var(--terracotta)"/>' : ''}
      </g>
    </g></svg>`;
}
/** Dex in various moods (used on welcome, import and sign-in screens). */
function mascot(mood = 'happy', size = 120) {
  const pose = { wave: 'wave', think: 'think', happy: 'idle', party: 'cheer', oops: 'alert', sleepy: 'sleep' }[mood] || 'idle';
  return `<span class="dex-wrap dex-${mood}" style="--s:${size}px">${agentSVG({ lead: true, pose, size: size * .8 })}${mood === 'think' ? '<i class="dex-dots"><b></b><b></b><b></b></i>' : mood === 'party' ? '<i class="dex-spark"></i>' : ''}</span>`;
}

/* ================= office state ================= */
function podState(p) {
  const runs = Runs.list(p.id);
  const active = runs.filter(r => ['starting', 'running', 'waiting'].includes(r.status));
  const waiting = active.filter(r => r.status === 'waiting');
  const fresh = runs.find(r => r.status === 'completed' && r.kind !== 'imported' && r.endedAt && Date.now() - new Date(r.endedAt) < 8 * 60 * 1000);
  const failed = runs.find(r => r.status === 'failed' && r.endedAt && Date.now() - new Date(r.endedAt) < 8 * 60 * 1000);
  const mo = momentum(p);
  const commits = weekList('commit').filter(a => a.projectId === p.id);
  const open = commits.filter(a => !a.done), done = commits.filter(a => a.done);
  const backlog = actsOf(p.id).filter(a => a.bucket === 'backlog' && !a.done).length;
  const nxa = actsOf(p.id).filter(a => !a.done && a.due).sort((a, b) => a.due.localeCompare(b.due))[0]; const nx = nxa ? { id: nxa.id, title: nxa.title, date: nxa.due } : null;
  const next = open.filter(a => a.who === 'codex').filter(a => !(a.runs || []).some(r => ['starting', 'running', 'waiting'].includes((Runs.map.get(r.id) || r).status))).sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999') || byOrder(a, b))[0] || null;
  const pose = waiting.length ? 'wait' : active.length ? 'type' : fresh ? 'cheer' : failed ? 'alert' : mo.key === 'stalled' ? 'sleep' : open.length ? 'idle' : 'think';
  const say = waiting.length ? 'I need you!' : active.length ? short(active[0].title, 26) : fresh ? 'Done!' : failed ? 'That failed…' : mo.key === 'stalled' ? 'z z z' : open.length ? `${open.length} to do` : 'What next?';
  return { p, runs, active, waiting, fresh, failed, mo, open, done, backlog, nx, next, pose, say, name: agentName(p) };
}
function dexInsights() {
  const out = []; const ps = projects(); const st = ps.map(podState);
  st.forEach(s => s.waiting.forEach(r => out.push({ kind: 'approval', pri: 0, station: 'board', pid: s.p.id, text: `${s.name} is waiting for your OK on “${short(r.title, 44)}”.`, act: { label: 'Review', act: 'open-run', id: r.id } })));
  st.filter(s => s.failed).forEach(s => out.push({ kind: 'failed', pri: 1, station: 'server', pid: s.p.id, text: `${s.name}'s last run for ${s.p.name} failed.`, act: { label: 'See why', act: 'open-run', id: s.failed.id } }));
  const soon = st.filter(s => s.nx && diffDays(s.nx.date, todayISO()) <= 7 && diffDays(s.nx.date, todayISO()) >= -30);
  soon.forEach(s => { const n = 0; const d = diffDays(s.nx.date, todayISO()); if (d > 2) return; out.push({ kind: 'milestone', pri: d < 0 ? 1 : 2, station: 'board', pid: s.p.id, text: `${s.p.name}: “${short(s.nx.title, 40)}” ${d < 0 ? `was due ${-d} day${d === -1 ? '' : 's'} ago` : d === 0 ? 'is due today' : `is due in ${d} day${d === 1 ? '' : 's'}`}${n ? ` with ${n} action${n === 1 ? '' : 's'} open` : ''}.`, act: { label: 'Open project', act: 'open', id: s.p.id } }); });
  const idle = st.filter(s => s.next && !s.active.length);
  if (idle.length) out.push({ kind: 'dispatch', pri: 3, station: 'board', text: `${idle.length === 1 ? `${idle[0].name} has` : `${idle.length} agents have`} committed work that Codex can do, and nobody on it.`, act: { label: idle.length === 1 ? `Send ${idle[0].name}` : `Dispatch ${idle.length} agents`, act: 'dex-dispatch' }, list: idle });
  st.filter(s => s.mo.key === 'stalled').forEach(s => out.push({ kind: 'stalled', pri: 4, station: 'lounge', pid: s.p.id, text: `${s.p.name} has been quiet for ${s.mo.days} days. ${s.name} dozed off.`, act: s.backlog ? { label: 'Pick something', act: 'open', id: s.p.id } : { label: 'Open project', act: 'open', id: s.p.id } }));
  const c = commitOpen().length;
  if (c > 7) out.push({ kind: 'crowded', pri: 4, station: 'board', text: `The week holds ${c} commitments. That is more than usually gets finished.`, act: { label: 'Trim the week', nav: 'week' } });
  if (ps.length && c === 0) out.push({ kind: 'plan', pri: 3, station: 'board', text: 'Nothing is committed for this week yet.', act: { label: 'Let Dex plan it', act: 'dex-plan' } });
  if (Codex.rate && Codex.rate.primary && Codex.rate.primary.usedPercent >= 80) out.push({ kind: 'quota', pri: 2, station: 'server', text: `Codex usage is at ${Codex.rate.primary.usedPercent}% for this period.`, act: { label: 'Settings', nav: 'settings' } });
  if (!out.length && ps.length) out.push({ kind: 'calm', pri: 9, station: 'lounge', text: 'All quiet. Every project is on course.', act: null });
  return { list: out.sort((a, b) => a.pri - b.pri), states: st };
}

/* ================= office pieces (each drawn on its own) ================= */
function skyFor(h) { return h < 5 || h >= 19 ? ['#27305A', '#4B4F86', true] : h < 8 ? ['#FFD9B8', '#FFF1DC', false] : h < 16 ? ['#BFE3FF', '#EAF6FF', false] : ['#FFC79A', '#FFE7C7', false]; }
function oWindow(x, y, w = 86, h = 70, id = 'w') {
  const hr = new Date().getHours(); const [c1, c2, night] = skyFor(hr);
  const sunX = x + 12 + ((hr % 24) / 24) * (w - 24);
  return `<g class="o-window"><defs><linearGradient id="sky-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient><clipPath id="wc-${id}"><rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" rx="5"/></clipPath></defs>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="var(--o-wood)"/>
    <rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" rx="5" fill="url(#sky-${id})"/>
    <g clip-path="url(#wc-${id})">${night ? `<circle cx="${x + w - 22}" cy="${y + 20}" r="8" fill="#FFF3C4"/><circle cx="${x + w - 19}" cy="${y + 18}" r="7" fill="${c1}"/><circle cx="${x + 18}" cy="${y + 16}" r="1.2" fill="#fff"/><circle cx="${x + 34}" cy="${y + 28}" r="1" fill="#fff"/><circle cx="${x + 26}" cy="${y + 40}" r="1.1" fill="#fff"/>` : `<circle cx="${sunX}" cy="${y + 20}" r="9" fill="#FFD25E"/><circle cx="${sunX}" cy="${y + 20}" r="13" fill="#FFD25E" opacity=".25"/>`}
      <g class="o-cloud" opacity="${night ? .25 : .95}"><ellipse cx="${x + 24}" cy="${y + 36}" rx="12" ry="5" fill="#fff"/><ellipse cx="${x + 32}" cy="${y + 32}" rx="9" ry="6" fill="#fff"/></g>
      <g class="o-cloud o-cloud-2" opacity="${night ? .2 : .8}"><ellipse cx="${x + 60}" cy="${y + 48}" rx="10" ry="4" fill="#fff"/></g>
      <path d="M${x} ${y + h - 14}l14-12 10 8 14-16 16 14 12-8 ${w - 66} 14v20H${x}Z" fill="${night ? '#1C2244' : '#9CCB9B'}" opacity=".9"/></g>
    <path d="M${x + w / 2} ${y + 4}v${h - 8}M${x + 4} ${y + h / 2}h${w - 8}" stroke="var(--o-wood)" stroke-width="3"/>
    <rect x="${x - 4}" y="${y + h - 2}" width="${w + 8}" height="6" rx="3" fill="var(--o-wood-d)"/>
    <path d="M${x - 2} ${y - 4}h${w + 4}" stroke="var(--o-wood-d)" stroke-width="4" stroke-linecap="round"/>
    <path d="M${x} ${y - 2}q8 26-2 ${h - 8}h10q6-30 4-${h - 8}Z" fill="var(--pc)" opacity=".5"/><path d="M${x + w} ${y - 2}q-8 26 2 ${h - 8}h-10q-6-30-4-${h - 8}Z" fill="var(--pc)" opacity=".5"/></g>`;
}
function oPoster(x, y, p) {
  const all = actsOf(p.id); const done = all.filter(a => a.done).length, open = all.length - done; const f = all.length ? done / all.length : 0;
  const c = 2 * Math.PI * 15;
  return `<g class="o-hit" data-tip="${done} of ${all.length} tasks done"><rect x="${x}" y="${y}" width="70" height="54" rx="5" fill="var(--raise)" stroke="var(--o-line)" stroke-width="1.2"/><circle cx="${x + 35}" cy="${y - 1}" r="2.4" fill="var(--terracotta)"/>
    <circle cx="${x + 23}" cy="${y + 28}" r="15" fill="none" stroke="var(--pc)" stroke-width="7" opacity=".18"/><circle cx="${x + 23}" cy="${y + 28}" r="15" fill="none" stroke="var(--pc)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${x + 23} ${y + 28})"/>
    <text x="${x + 46}" y="${y + 26}" class="o-t o-t-b">${done}</text><text x="${x + 46}" y="${y + 37}" class="o-t o-t-s">of ${all.length}</text></g>`;
}
function oCalendar(x, y, m) {
  const d = m ? fromISO(m.date) : null; const left = m ? diffDays(m.date, todayISO()) : null;
  return `<g class="o-hit" data-nav-office="horizon" data-tip="${m ? esc(`Next due: ${m.title} · ${fmt(m.date)} (${inDays(m.date)})`) : 'No task has a due date'}"><rect x="${x}" y="${y}" width="46" height="54" rx="6" fill="var(--raise)" stroke="var(--o-line)" stroke-width="1.2"/><path d="M${x} ${y + 15}v-9a6 6 0 0 1 6-6h34a6 6 0 0 1 6 6v9Z" fill="${left != null && left < 0 ? 'var(--warn)' : 'var(--pc)'}"/>
    <circle cx="${x + 12}" cy="${y + 2}" r="2.2" fill="var(--o-wood-d)"/><circle cx="${x + 34}" cy="${y + 2}" r="2.2" fill="var(--o-wood-d)"/>
    <text x="${x + 23}" y="${y + 11.5}" text-anchor="middle" class="o-t o-t-w">${d ? MON[d.getMonth()].toUpperCase() : '—'}</text>
    <text x="${x + 23}" y="${y + 37}" text-anchor="middle" class="o-t o-t-num">${d ? d.getDate() : '?'}</text>
    <text x="${x + 23}" y="${y + 49}" text-anchor="middle" class="o-t o-t-s">${left == null ? 'no date' : left === 0 ? 'today' : left > 0 ? `in ${left}d` : `${-left}d late`}</text></g>`;
}
function oNotes(x, y, n) {
  const cols = ['var(--sand)', 'var(--burgundy)', 'var(--sage)', 'var(--cobalt)', 'var(--terracotta)', 'var(--graphite)'];
  let s = ''; for (let i = 0; i < Math.min(3, n); i++) { const cx = x + i * 24, cy = y; s += `<g transform="rotate(${(i * 37 % 13) - 6} ${cx + 9} ${cy + 9})"><rect x="${cx}" y="${cy}" width="19" height="19" rx="2.5" fill="${cols[i]}" opacity=".85"/><path d="M${cx + 4} ${cy + 7}h11M${cx + 4} ${cy + 11}h8" stroke="#fff" stroke-width="1.4" opacity=".8" stroke-linecap="round"/></g>`; }
  return `<g class="o-hit" data-nav-office="week" data-tip="${n} in the backlog">${s}${n > 3 ? `<text x="${x + 74}" y="${y + 13}" class="o-t o-t-s">+${n - 3}</text>` : ''}${n === 0 ? `<rect x="${x}" y="${y}" width="66" height="19" rx="4" fill="none" stroke="var(--o-line)" stroke-dasharray="3 4"/>` : ''}</g>`;
}
function oTrophies(x, y, n) {
  let s = `<rect x="${x}" y="${y + 20}" width="76" height="5" rx="2.5" fill="var(--o-wood-d)"/><path d="M${x + 8} ${y + 25}v6M${x + 68} ${y + 25}v6" stroke="var(--o-wood-d)" stroke-width="3"/>`;
  for (let i = 0; i < Math.min(4, n); i++) { const cx = x + 10 + i * 18; s += `<g class="o-trophy" style="--d:${i * .15}s"><path d="M${cx - 5} ${y + 5}h10v4a5 5 0 0 1-10 0Z" fill="var(--sand)"/><path d="M${cx - 5} ${y + 6}q-4 0-3 4 1 2 4 2M${cx + 5} ${y + 6}q4 0 3 4-1 2-4 2" stroke="var(--sand)" stroke-width="1.6" fill="none"/><rect x="${cx - 1.2}" y="${y + 13}" width="2.4" height="4" fill="var(--sand)"/><rect x="${cx - 4}" y="${y + 17}" width="8" height="3" rx="1" fill="var(--o-wood-d)"/></g>`; }
  return `<g class="o-hit" data-tip="One trophy for every 5 tasks done">${s}${n > 4 ? `<text x="${x + 78}" y="${y + 17}" text-anchor="end" class="o-t o-t-s">+${n - 4}</text>` : ''}</g>`;
}
function oPlant(x, y, key) {
  const pot = `<path d="M${x - 11} ${y}h22l-3 20h-16Z" fill="var(--terracotta)"/><rect x="${x - 13}" y="${y - 4}" width="26" height="6" rx="3" fill="var(--terracotta)"/><rect x="${x - 13}" y="${y - 4}" width="26" height="6" rx="3" fill="#000" opacity=".12"/>`;
  const leaf = (ang, len, col, droop = 0) => `<path d="M${x} ${y - 4}q${Math.sin(ang) * len * .6 + droop * 2} ${-Math.cos(ang) * len * .9} ${Math.sin(ang) * len} ${-Math.cos(ang) * len + droop * len * .7}q${-Math.sin(ang) * len * .2 - 6 * Math.cos(ang)} ${Math.cos(ang) * len * .5} ${-Math.sin(ang) * len} ${Math.cos(ang) * len - droop * len * .7}Z" fill="${col}"/>`;
  const g = 'var(--sage)';
  const body = key === 'strong' ? `${leaf(-.7, 30, g)}${leaf(.7, 30, g)}${leaf(-.25, 40, g)}${leaf(.3, 38, g)}<path d="M${x} ${y - 4}v-44" stroke="${g}" stroke-width="2.4"/><g class="o-flower"><circle cx="${x}" cy="${y - 52}" r="6" fill="var(--burgundy)"/><circle cx="${x - 6}" cy="${y - 49}" r="4.5" fill="var(--burgundy)" opacity=".8"/><circle cx="${x + 6}" cy="${y - 49}" r="4.5" fill="var(--burgundy)" opacity=".8"/><circle cx="${x}" cy="${y - 50}" r="2.6" fill="var(--sand)"/></g>`
    : key === 'steady' ? `${leaf(-.8, 26, g)}${leaf(.8, 26, g)}${leaf(-.2, 34, g)}${leaf(.3, 32, g)}`
    : key === 'slowing' ? `${leaf(-1.1, 24, g, .35)}${leaf(1.1, 24, g, .35)}${leaf(-.2, 26, g, .1)}`
    : `${leaf(-1.3, 20, '#B9A27A', .7)}${leaf(1.3, 20, '#B9A27A', .7)}<path d="M${x + 16} ${y + 18}q5-3 9 1-5 3-9-1Z" fill="#B9A27A"/>`;
  return `<g class="o-plant o-plant-${key} o-hit" data-tip="Momentum: ${key}">${body}${pot}</g>`;
}
function oTrays(x, y, open, done) {
  const stack = (sx, n, col, label, tip, nav) => { let s = `<path d="M${sx - 2} ${y}h36l-3 7h-30Z" fill="var(--o-wood-d)"/>`; for (let i = 0; i < Math.min(8, n); i++) s += `<rect x="${sx + 2 + (i % 2)}" y="${y - 4 - i * 3.2}" width="28" height="3" rx="1.2" fill="${i % 2 ? 'var(--raise)' : col}" stroke="var(--o-line)" stroke-width=".6"/>`; return `<g class="o-hit" data-nav-office="${nav}" data-tip="${tip}">${s}<text x="${sx + 16}" y="${y + 19}" text-anchor="middle" class="o-t o-t-b" opacity=".55">${label}</text><text x="${sx + 16}" y="${y - 8 - Math.min(8, n) * 3.2}" text-anchor="middle" class="o-t o-t-b">${n}</text></g>`; };
  return stack(x, open, 'color-mix(in oklab,var(--pc) 30%,var(--raise))', 'to do', `${open} committed this week`, 'week') + stack(x + 44, done, 'color-mix(in oklab,var(--sage) 35%,var(--raise))', 'done', `${done} done this week`, 'week');
}
function oDesk(x, y, s) {
  const st = s.waiting.length ? 'wait' : s.active.length ? 'run' : s.fresh ? 'done' : s.failed ? 'fail' : 'idle';
  const screen = st === 'run' ? `<g class="o-code"><path d="M${x + 50} ${y - 38}h22M${x + 50} ${y - 32}h30M${x + 54} ${y - 26}h18M${x + 54} ${y - 20}h26M${x + 50} ${y - 14}h14" stroke="#8CF0C8" stroke-width="2" stroke-linecap="round"/></g>`
    : st === 'wait' ? `<text x="${x + 68}" y="${y - 18}" text-anchor="middle" class="o-t o-t-num" fill="#FFC95C" style="fill:#FFC95C">!</text>`
    : st === 'done' ? `<path d="M${x + 58} ${y - 26}l7 7 13-14" stroke="#8CF0C8" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    : st === 'fail' ? `<path d="M${x + 60} ${y - 34}l16 16M${x + 76} ${y - 34}l-16 16" stroke="#FF8E6E" stroke-width="4" stroke-linecap="round"/>`
    : `<path d="M${x + 58} ${y - 28}h6M${x + 72} ${y - 28}h6" stroke="#6E6A66" stroke-width="2.4" stroke-linecap="round"/><path d="M${x + 62} ${y - 20}q6 3 12 0" stroke="#6E6A66" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  return `<g class="o-desk o-desk-${st}">
    <rect x="${x + 8}" y="${y + 8}" width="8" height="42" rx="3" fill="var(--o-wood-d)"/><rect x="${x + 124}" y="${y + 8}" width="8" height="42" rx="3" fill="var(--o-wood-d)"/>
    <rect x="${x + 82}" y="${y + 8}" width="46" height="34" rx="4" fill="var(--o-wood)"/><rect x="${x + 86}" y="${y + 13}" width="38" height="11" rx="3" fill="var(--o-wood-d)" opacity=".5"/><rect x="${x + 86}" y="${y + 27}" width="38" height="11" rx="3" fill="var(--o-wood-d)" opacity=".5"/><circle cx="${x + 105}" cy="${y + 18.5}" r="1.6" fill="var(--o-wood-d)"/><circle cx="${x + 105}" cy="${y + 32.5}" r="1.6" fill="var(--o-wood-d)"/>
    <rect x="${x}" y="${y}" width="140" height="9" rx="4.5" fill="var(--o-wood)"/><rect x="${x}" y="${y + 6}" width="140" height="3" rx="1.5" fill="var(--o-wood-d)" opacity=".5"/>
    <g class="o-hit" data-tip="${st === 'run' ? esc('Working: ' + s.active[0].title) : st === 'wait' ? 'Waiting for your approval' : st === 'done' ? 'Just finished a run' : st === 'fail' ? 'The last run failed' : 'No run right now'}" ${s.active[0] || s.fresh || s.failed ? `data-act="open-run" data-id="${(s.active[0] || s.fresh || s.failed).id}"` : ''}>
      <rect x="${x + 62}" y="${y - 8}" width="12" height="8" fill="var(--o-metal)"/><rect x="${x + 52}" y="${y - 3}" width="32" height="4" rx="2" fill="var(--o-metal)"/>
      <rect x="${x + 40}" y="${y - 50}" width="56" height="42" rx="6" fill="#2B2522"/><rect x="${x + 44}" y="${y - 46}" width="48" height="34" rx="3.5" fill="${st === 'idle' ? '#3A3531' : '#1E2A2A'}"/>${screen}
    </g>
    <g class="o-lamp ${st === 'run' || st === 'wait' ? 'on' : ''}"><path d="M${x + 118} ${y}v-22l-10-12" stroke="var(--o-metal)" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M${x + 100} ${y - 40}l14-2 2 10-12 4Z" fill="var(--sand)"/><path class="o-light" d="M${x + 102} ${y - 30}l-18 30h36l-8-32Z" fill="#FFE9A8"/><ellipse cx="${x + 118}" cy="${y}" rx="8" ry="2.4" fill="var(--o-metal)"/></g>
    <g class="o-mug"><rect x="${x + 12}" y="${y - 12}" width="11" height="12" rx="2.5" fill="var(--raise)" stroke="var(--o-line)" stroke-width="1"/><path d="M${x + 23} ${y - 9}q5 0 5 3.5t-5 3.5" stroke="var(--o-line)" stroke-width="1.6" fill="none"/><path class="o-steam" d="M${x + 15} ${y - 15}q-2-3 0-6M${x + 20} ${y - 15}q2-3 0-6" stroke="var(--fg-3)" stroke-width="1.2" fill="none" stroke-linecap="round"/></g>
    <rect x="${x + 18}" y="${y + 13}" width="58" height="16" rx="4" fill="var(--raise)" stroke="var(--o-line)" stroke-width="1"/><text x="${x + 47}" y="${y + 24.5}" text-anchor="middle" class="o-t o-t-b">${esc(short(s.name, 10))}</text>
  </g>`;
}
function oSeat(x, y, pose) {
  if (pose === 'sleep') return `<g><ellipse cx="${x}" cy="${y + 4}" rx="34" ry="13" fill="var(--pc)" opacity=".55"/><ellipse cx="${x}" cy="${y}" rx="30" ry="11" fill="var(--pc)" opacity=".85"/><ellipse cx="${x - 8}" cy="${y - 3}" rx="12" ry="4" fill="#fff" opacity=".25"/></g>`;
  if (pose === 'type') return `<g><rect x="${x - 3}" y="${y - 2}" width="6" height="16" fill="var(--o-metal)"/><path d="M${x - 16} ${y + 16}h32" stroke="var(--o-metal)" stroke-width="4" stroke-linecap="round"/><circle cx="${x - 16}" cy="${y + 18}" r="2.6" fill="var(--o-wood-d)"/><circle cx="${x + 16}" cy="${y + 18}" r="2.6" fill="var(--o-wood-d)"/><rect x="${x - 20}" y="${y - 10}" width="40" height="10" rx="5" fill="var(--pc)"/><rect x="${x - 23}" y="${y - 44}" width="46" height="30" rx="10" fill="var(--pc)" opacity=".8"/></g>`;
  return '';
}

function podSVG(s, attention) {
  const p = s.p; const doneN = actsOf(p.id).filter(a => a.done).length; const doneMs = Math.floor(doneN / 5);
  const ax = 118, ay = 150;
  const extras = Math.min(2, Math.max(0, s.active.length - 1));
  return `<svg class="pod ${attention ? 'attn' : ''} pod-${s.pose}" viewBox="0 0 360 272" style="${pc(p)}" data-pid="${p.id}">
    <rect class="o-wallp" x="0" y="0" width="360" height="206" rx="22"/><path d="M0 150h360v56H0Z" class="o-wains"/><path d="M0 150h360" stroke="var(--o-line)" stroke-width="1.2"/>
    <rect x="0" y="200" width="360" height="7" fill="var(--o-wood-d)" opacity=".8"/>
    <path d="M0 207h360v43a22 22 0 0 1-22 22H22a22 22 0 0 1-22-22Z" class="o-floor"/><path d="M0 228h360M0 250h360M60 207v21M150 228v22M240 207v21M300 228v22M110 250v22" stroke="var(--o-wood-d)" stroke-width="1" opacity=".25"/>
    ${oWindow(20, 50, 86, 70, p.id)}
    ${oPoster(124, 54, p)}
    ${oCalendar(210, 54, s.nx)}
    ${oNotes(272, 50, s.backlog)}
    ${oTrophies(262, 74, doneMs)}
    <ellipse cx="150" cy="246" rx="112" ry="14" fill="var(--pc)" opacity=".16"/>
    <g><rect x="18" y="158" width="92" height="48" rx="6" fill="var(--o-wood)"/><rect x="24" y="164" width="38" height="36" rx="3" fill="var(--o-wood-d)" opacity=".45"/><rect x="66" y="164" width="38" height="36" rx="3" fill="var(--o-wood-d)" opacity=".45"/><circle cx="58" cy="182" r="1.8" fill="var(--o-wood-d)"/><circle cx="70" cy="182" r="1.8" fill="var(--o-wood-d)"/></g>
    ${oTrays(22, 150, s.open.length, s.done.length)}
    ${oDesk(204, 158, s)}
    ${oPlant(184, 186, s.mo.key)}
    ${oSeat(ax + 36, ay + 78, s.pose)}
    <g class="o-agent o-hit" data-agent="${p.id}" data-tip="${esc(`${s.name} · ${s.mo.label.toLowerCase()} momentum${s.next ? ' · next: ' + s.next.title : ''}`)}">
      <svg x="${ax}" y="${ay - (s.pose === 'type' ? 8 : s.pose === 'sleep' ? 2 : -10)}" width="72" height="90" viewBox="0 0 64 80" overflow="visible">${agentSVG({ tone: p.color, pose: s.pose, size: 64 }).replace(/^<svg[^>]*>/, '<g class="ag ag-' + s.pose + '">').replace(/<\/svg>$/, '</g>')}</svg>
      ${[...Array(extras)].map((_, i) => `<svg x="${ax - 46 - i * 34}" y="${ay + 30}" width="44" height="55" viewBox="0 0 64 80" overflow="visible">${agentSVG({ tone: p.color, pose: 'walk', size: 40 }).replace(/^<svg[^>]*>/, '<g class="ag ag-walk">').replace(/<\/svg>$/, '</g>')}</svg>`).join('')}
    </g>
    <g class="o-bubble"><rect x="${ax - 14}" y="${ay - 34}" width="${Math.max(54, s.say.length * 6.4 + 20)}" height="24" rx="12" fill="var(--raise)" stroke="${s.pose === 'wait' ? 'var(--warn)' : 'var(--o-line)'}" stroke-width="1.4"/><path d="M${ax + 26} ${ay - 11}l6 8 5-8Z" fill="var(--raise)" stroke="${s.pose === 'wait' ? 'var(--warn)' : 'var(--o-line)'}" stroke-width="1.4"/><rect x="${ax + 24}" y="${ay - 14}" width="14" height="4" fill="var(--raise)"/><text x="${ax - 4}" y="${ay - 18}" class="o-t ${s.pose === 'wait' ? 'o-t-warn' : ''}">${esc(s.say)}</text></g>
    <g class="o-plate o-hit" data-act="open" data-id="${p.id}" data-tip="Open ${esc(p.name)}"><rect x="14" y="10" width="${Math.min(240, p.name.length * 8.6 + 44)}" height="26" rx="13" fill="var(--raise)" stroke="var(--o-line)" stroke-width="1.2"/><circle cx="28" cy="23" r="6" fill="var(--pc)"/><text x="40" y="27.5" class="o-t o-t-name">${esc(short(p.name, 24))}</text></g>
  </svg>`;
}

function hqSVG(ins, st) {
  const ps = st.map(s => s.p); const now = new Date();
  const all = weekList('commit'); const done = all.filter(a => a.done).length;
  const active = Runs.active(); const top = ins[0];
  const station = { board: 560, server: 1130, lounge: 1300, library: 250 }[top ? top.station : 'board'] || 560;
  const repo = Codex.skills.filter(s => s.scope === 'repo').length, shared = Codex.skills.filter(s => s.scope !== 'repo').length;
  const runsTotal = [...Runs.map.values()].length;
  const hh = now.getHours() % 12, mm = now.getMinutes();
  const rate = Codex.rate && Codex.rate.primary ? Codex.rate.primary.usedPercent : null;
  const books = []; const cols = ['var(--cobalt)', 'var(--terracotta)', 'var(--sage)', 'var(--sand)', 'var(--burgundy)', 'var(--graphite)'];
  for (let r = 0; r < 3; r++) { let bx = 96; const n = r === 0 ? Math.min(12, repo) : Math.min(13, Math.ceil(shared / 2)); for (let i = 0; i < n && bx < 250; i++) { const w = 7 + ((i * 7 + r * 3) % 6), h = 26 + ((i * 5 + r) % 9); books.push(`<rect x="${bx}" y="${96 + r * 44 - h}" width="${w}" height="${h}" rx="1.6" fill="${cols[(i + r) % 6]}" opacity="${r === 0 ? 1 : .7}"/>`); bx += w + 2; } }
  const bars = ps.slice(0, 7).map((p, i) => { const c = all.filter(a => a.projectId === p.id); const d = c.filter(a => a.done).length; const w = 150; return `<g class="o-hit" data-act="open" data-id="${p.id}" data-tip="${esc(p.name)}: ${d}/${c.length} done this week"><text x="452" y="${96 + i * 17}" class="o-t o-t-scr">${esc(short(p.name, 16))}</text><rect x="570" y="${89 + i * 17}" width="${w}" height="7" rx="3.5" fill="#33423F"/><rect x="570" y="${89 + i * 17}" width="${c.length ? Math.max(4, w * d / c.length) : 0}" height="7" rx="3.5" fill="var(--${p.color})"/><text x="728" y="${96 + i * 17}" class="o-t o-t-scr">${d}/${c.length}</text></g>`; }).join('');
  return `<svg class="hq" viewBox="0 0 1440 320" preserveAspectRatio="xMidYMid meet">
    <rect class="o-wallp hqw" x="0" y="0" width="1440" height="246" rx="26"/><path d="M0 186h1440v60H0Z" class="o-wains"/><path d="M0 186h1440" stroke="var(--o-line)" stroke-width="1.2"/>
    <rect x="0" y="240" width="1440" height="8" fill="var(--o-wood-d)" opacity=".8"/>
    <path d="M0 248h1440v46a26 26 0 0 1-26 26H26a26 26 0 0 1-26-26Z" class="o-floor"/><path d="M0 272h1440M0 296h1440M120 248v24M300 272v24M480 248v24M700 272v24M900 248v24M1100 272v24M1280 248v24" stroke="var(--o-wood-d)" stroke-width="1" opacity=".25"/>
    ${[200, 620, 1040].map(x => `<g class="o-ceil"><path d="M${x} 0v22" stroke="var(--o-metal)" stroke-width="2"/><path d="M${x - 18} 34q18-22 36 0Z" fill="var(--sand)"/><ellipse cx="${x}" cy="36" rx="8" ry="3" fill="#FFF3C4"/></g>`).join('')}
    <!-- skill library -->
    <g class="o-hit" data-nav-office="settings" data-tip="Skill library: ${repo} for projects, ${shared} shared"><rect x="84" y="50" width="180" height="150" rx="8" fill="var(--o-wood)"/><rect x="92" y="58" width="164" height="40" rx="3" fill="var(--o-wood-d)" opacity=".45"/><rect x="92" y="102" width="164" height="40" rx="3" fill="var(--o-wood-d)" opacity=".45"/><rect x="92" y="146" width="164" height="40" rx="3" fill="var(--o-wood-d)" opacity=".45"/>${books.join('')}
      <rect x="126" y="28" width="96" height="20" rx="10" fill="var(--raise)" stroke="var(--o-line)"/><text x="174" y="42" text-anchor="middle" class="o-t o-t-b">Skills · ${repo + shared}</text></g>
    <!-- archive -->
    <g class="o-hit" data-tip="Archive: ${runsTotal} run${runsTotal === 1 ? '' : 's'} on record, every step kept in each project folder"><rect x="284" y="110" width="92" height="136" rx="6" fill="var(--o-metal)"/>${[0, 1, 2].map(i => `<rect x="291" y="${118 + i * 42}" width="78" height="36" rx="4" fill="var(--raise)" opacity=".5"/><rect x="316" y="${130 + i * 42}" width="28" height="6" rx="3" fill="var(--o-wood-d)"/>`).join('')}<rect x="290" y="84" width="34" height="26" rx="3" fill="var(--sand)" opacity=".85"/><rect x="330" y="90" width="38" height="20" rx="3" fill="var(--burgundy)" opacity=".7"/><text x="330" y="104" class="o-t o-t-s" style="fill:#fff"> ${runsTotal}</text></g>
    <!-- command board -->
    <g><rect x="424" y="38" width="340" height="166" rx="12" fill="#2B2522"/><rect x="432" y="46" width="324" height="150" rx="7" fill="#1E2A2A"/>
      <text x="446" y="68" class="o-t o-t-scrh">This week</text><text x="742" y="68" text-anchor="end" class="o-t o-t-scrh">${done}/${all.length}</text>
      <rect x="446" y="74" width="296" height="5" rx="2.5" fill="#33423F"/><rect x="446" y="74" width="${all.length ? Math.max(5, 296 * done / all.length) : 0}" height="5" rx="2.5" fill="#8CF0C8" class="o-scan"/>
      ${bars || '<text x="446" y="110" class="o-t o-t-scr">No projects yet</text>'}
      <rect x="580" y="204" width="28" height="42" fill="var(--o-metal)"/><rect x="540" y="240" width="108" height="8" rx="4" fill="var(--o-metal)"/></g>
    <!-- window + clock -->
    ${oWindow(800, 40, 190, 120, 'hq')}
    <g class="o-hit" data-tip="${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}"><circle cx="1050" cy="74" r="26" fill="var(--raise)" stroke="var(--o-wood-d)" stroke-width="4"/>${[0, 1, 2, 3].map(i => `<path d="M1050 52v4" stroke="var(--fg-3)" stroke-width="2" transform="rotate(${i * 90} 1050 74)"/>`).join('')}<path d="M1050 74V60" stroke="var(--fg)" stroke-width="3" stroke-linecap="round" transform="rotate(${hh * 30 + mm / 2} 1050 74)"/><path d="M1050 74V54" stroke="var(--terracotta)" stroke-width="2" stroke-linecap="round" transform="rotate(${mm * 6} 1050 74)"/><circle cx="1050" cy="74" r="2.4" fill="var(--fg)"/></g>
    <!-- server rack = Codex engine -->
    <g class="o-hit" data-nav-office="settings" data-tip="Codex engine: ${Codex.ready ? 'running' : 'offline'}${Codex.account ? ' · ' + esc(Codex.account.planType || '') : ''}${rate != null ? ' · ' + rate + '% used' : ''} · ${active.length} active run${active.length === 1 ? '' : 's'}"><rect x="1096" y="92" width="84" height="156" rx="8" fill="#2B2522"/>${[0, 1, 2, 3].map(i => `<rect x="1104" y="${102 + i * 34}" width="68" height="26" rx="4" fill="#3A3531"/><circle class="o-led ${Codex.ready ? 'on' : ''}" style="--d:${i * .3}s" cx="1114" cy="${115 + i * 34}" r="3"/><circle class="o-led ${active.length > i ? 'busy' : ''}" style="--d:${i * .2 + .1}s" cx="1124" cy="${115 + i * 34}" r="3"/><path d="M1136 ${111 + i * 34}h28M1136 ${119 + i * 34}h20" stroke="#57504A" stroke-width="2.4" stroke-linecap="round"/>`).join('')}
      <rect x="1100" y="70" width="76" height="20" rx="10" fill="var(--raise)" stroke="var(--o-line)"/><text x="1138" y="84" text-anchor="middle" class="o-t o-t-b">${rate != null ? `Codex · ${rate}%` : 'Codex'}</text></g>
    <!-- coffee + lounge -->
    <g class="o-hit" data-tip="${active.length ? `${active.length} agent${active.length === 1 ? ' is' : 's are'} working` : 'Nobody is running right now'}"><rect x="1210" y="186" width="90" height="62" rx="6" fill="var(--o-wood)"/><rect x="1226" y="140" width="36" height="46" rx="6" fill="var(--o-metal)"/><rect x="1232" y="148" width="24" height="12" rx="3" fill="#2B2522"/><circle cx="1238" cy="154" r="2" fill="${active.length ? '#8CF0C8' : '#6E6A66'}"/><rect x="1238" y="172" width="12" height="12" rx="2.5" fill="var(--raise)" stroke="var(--o-line)"/><path class="o-steam" d="M1241 170q-2-4 0-8M1247 170q2-4 0-8" stroke="var(--fg-3)" stroke-width="1.4" fill="none" stroke-linecap="round"/>${[0, 1, 2].map(i => `<rect x="${1270 + i * 9}" y="${176 - (i % 2) * 2}" width="7" height="10" rx="2" fill="var(--raise)" stroke="var(--o-line)" stroke-width=".8"/>`).join('')}</g>
    <g><ellipse cx="1356" cy="280" rx="60" ry="14" fill="var(--burgundy)" opacity=".2"/><g class="o-cat o-hit" data-tip="Office cat. Sleeps best when nothing is on fire."><ellipse cx="1356" cy="270" rx="26" ry="12" fill="#F2B880"/><circle cx="1336" cy="264" r="10" fill="#F2B880"/><path d="M1329 257l2-8 6 5M1341 256l4-7 3 8" fill="#F2B880"/><path d="M1331 265h4M1339 265h3" stroke="#2B2522" stroke-width="1.4" stroke-linecap="round"/><path class="o-tail" d="M1380 272q14 2 12-12" stroke="#F2B880" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M1350 262q6-4 12 0M1362 264q6-4 12 0" stroke="#D99A5E" stroke-width="2" fill="none"/></g></g>
    ${oPlant(1420, 228, st.some(s => s.mo.key === 'stalled') ? 'slowing' : 'strong')}
    ${oPlant(48, 228, 'steady')}
    <!-- Dex -->
    <g class="dex-stage" style="transform:translateX(${station}px)"><svg x="-50" y="134" width="100" height="125" viewBox="0 0 64 80" overflow="visible" class="o-hit" data-act="dex-panel" data-tip="Dex, your orchestrator">${agentSVG({ lead: true, pose: top && top.pri <= 1 ? 'wait' : top && top.kind === 'calm' ? 'idle' : 'think', size: 64 }).replace(/^<svg[^>]*>/, `<g class="ag ag-lead ag-${top && top.pri <= 1 ? 'wait' : top && top.kind === 'calm' ? 'idle' : 'think'}">`).replace(/<\/svg>$/, '</g>')}</svg></g>
  </svg>`;
}

/* ================= office view ================= */
function vOffice() {
  const ps = projects();
  if (!ps.length) return `<div class="office"><div class="imp-hero">${mascot('wave', 132)}<div><h1 class="imp-h">The office is empty.</h1><p class="imp-p">Bring in a project and its agent moves in: a desk, a plant that shows momentum, trays for this week's work.</p><div class="imp-b"><button class="tbtn primary big" data-nav="import">${ic('search')}Look through my Codex sessions</button><button class="tbtn big" data-nav="now">Start a project</button></div></div></div></div>`;
  const { list, states } = dexInsights();
  const attn = new Set(list.filter(i => i.pid && i.pri <= 2).map(i => i.pid));
  const active = Runs.active();
  const top = list[0];
  return `<div class="office">
    <header class="of-h"><div><div class="eyebrow rise">Office</div><h1 class="wk-title rise" style="--i:1">${active.length ? `${active.length} at work` : 'All hands'}</h1><p class="wk-sub rise" style="--i:2">${ps.length} agent${ps.length === 1 ? '' : 's'}, one per project, and Dex keeping them pointed the right way. Everything in the room is live data. Hover to read it, click to go there.</p></div>
      <div class="of-legend rise" style="--i:3"><span>${ic('list')}trays = this week</span><span>${ic('memory')}plant = momentum</span><span>${ic('plan')}poster = tasks done</span><span>${ic('wait')}calendar = next due task</span></div></header>
    <section class="dex-bar rise" style="--i:2">
      <div class="dex-say"><div class="dex-face">${agentSVG({ lead: true, pose: top && top.pri <= 1 ? 'alert' : 'idle', size: 46 })}</div>
        <div class="dex-msgs">${list.slice(0, 4).map((i, n) => `<div class="dex-msg ${n === 0 ? 'top' : ''} k-${i.kind}"><span>${esc(i.text)}</span>${i.act ? `<button class="tbtn ${n === 0 ? 'primary' : ''}" ${i.act.nav ? `data-nav="${i.act.nav}"` : `data-act="${i.act.act}" data-id="${i.act.id || ''}"`}>${esc(UI.armed === 'dispatch' && i.act.act === 'dex-dispatch' ? 'Tap again to send them' : i.act.label)}</button>` : ''}</div>`).join('')}</div></div>
      <label class="dex-ask"><span>${ic('spark')}</span><input id="dex-input" placeholder="Tell Dex what to do: “run everything for Nusa Persona this week”, “plan my week”…" autocomplete="off"><span class="dex-busy" ${UI.dexBusy ? '' : 'hidden'}><span class="thinking"><i></i><i></i><i></i></span></span></label>
    </section>
    <div class="hq-wrap rise" style="--i:3">${hqSVG(list, states)}</div>
    <div class="pods">${states.map((s, i) => `<div class="pod-wrap rise" style="--i:${i + 4}">${podSVG(s, attn.has(s.p.id))}</div>`).join('')}</div>
    <div class="o-tip" id="o-tip" hidden></div>
  </div>`;
}
const Office = {
  timer: 0,
  after() {
    clearInterval(this.timer);
    this.timer = setInterval(() => { if (UI.view === 'office' && !isEditing() && document.activeElement?.id !== 'dex-input' && document.visibilityState === 'visible') scheduleRender(); }, 20000);
  },
  agentClick(pid) {
    const s = podState(S.projects[pid]);
    if (s.active.length) return navigate('run', (s.waiting[0] || s.active[0]).id);
    if (s.fresh) return navigate('run', s.fresh.id);
    if (s.next) return Drawer.open(s.next.id);
    navigate('project', pid);
  },
  async dispatch() {
    const { list } = dexInsights(); const d = list.find(i => i.kind === 'dispatch'); if (!d) return;
    if (UI.armed !== 'dispatch') { UI.armed = 'dispatch'; renderNow(); setTimeout(() => { if (UI.armed === 'dispatch') { UI.armed = null; scheduleRender(); } }, 5000); return; }
    UI.armed = null;
    let n = 0;
    for (const s of d.list) { try { await startTaskRun(s.next, { quiet: true }); n++; } catch (e) { toast(`${s.name} could not start.`, { sub: e.message }); break; } }
    if (n) toast(`Dex sent ${n} agent${n === 1 ? '' : 's'} to work.`, { sub: 'Watch them in the office, or open a desk to follow along.' });
    renderNow();
  },
  async command(text) {
    if (!text.trim() || UI.dexBusy) return;
    UI.dexBusy = true; renderNow();
    try { const r = await codexOps(text, { allowRun: true }); toast(r.summary || 'Done.', r.undo ? { undo: r.undo } : {}); }
    catch (e) { toast('Dex could not do that.', { sub: e.message }); }
    UI.dexBusy = false; renderNow();
  },
};
document.addEventListener('keydown', e => { if (e.target.id === 'dex-input' && e.key === 'Enter') { e.preventDefault(); const v = e.target.value; e.target.value = ''; Office.command(v); } }, true);
document.addEventListener('mousemove', e => {
  const tip = document.getElementById('o-tip'); if (!tip) return;
  const h = e.target.closest && e.target.closest('[data-tip]');
  if (!h || !h.closest('.office')) { tip.hidden = true; return; }
  tip.textContent = h.dataset.tip; tip.hidden = false;
  const r = tip.parentElement.getBoundingClientRect();
  tip.style.left = Math.min(r.width - tip.offsetWidth - 8, Math.max(8, e.clientX - r.left + 14)) + 'px'; tip.style.top = (e.clientY - r.top + 18) + 'px';
});
document.addEventListener('click', e => {
  const o = e.target.closest && e.target.closest('.office'); if (!o) return;
  const ag = e.target.closest('[data-agent]'); if (ag) { e.stopPropagation(); return Office.agentClick(ag.dataset.agent); }
  const nv = e.target.closest('[data-nav-office]'); if (nv) { e.stopPropagation(); return navigate(nv.dataset.navOffice); }
  const pod = e.target.closest('svg.pod'); if (pod && !e.target.closest('[data-act]')) navigate('project', pod.dataset.pid);
}, true);
