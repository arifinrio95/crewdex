"use strict";
/* Rich rendering: markdown, code, diagrams, math, diffs, terminal output and local files.
   Everything Codex produces passes through here so it reads the way it does in Codex/ChatGPT. */

const NATIVE = !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.native);
const nat = (op, args = {}) => NATIVE ? window.webkit.messageHandlers.native.postMessage(Object.assign({ op }, args)) : Promise.reject(new Error('Open this inside the Crewdex app to use files and Codex.'));
const fileURL = p => window.__demoFile ? window.__demoFile(p) : 'bearing://file' + encodeURI(p).replace(/#/g, '%23').replace(/\?/g, '%3F');
const rEsc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const baseName = p => String(p || '').split('/').filter(Boolean).pop() || p;
const extOf = p => { const b = baseName(p); const i = b.lastIndexOf('.'); return i > 0 ? b.slice(i + 1).toLowerCase() : ''; };
function joinPath(base, rel) {
  if (!rel) return base;
  if (rel.startsWith('/')) return rel;
  if (rel.startsWith('~/') && Render.home) return Render.home + rel.slice(1);
  const parts = (base || '').split('/'); rel.split('/').forEach(seg => { if (seg === '..') parts.pop(); else if (seg && seg !== '.') parts.push(seg); });
  return parts.join('/');
}

const KIND = {
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic', 'bmp', 'tiff', 'avif', 'ico'],
  svg: ['svg'], pdf: ['pdf'], html: ['html', 'htm'], md: ['md', 'markdown', 'mdx'],
  csv: ['csv', 'tsv'], json: ['json', 'jsonl', 'geojson', 'ipynb'],
  video: ['mp4', 'mov', 'webm', 'm4v'], audio: ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'],
  office: ['pptx', 'ppt', 'key', 'docx', 'doc', 'pages', 'xlsx', 'xls', 'numbers', 'rtf', 'odt', 'odp', 'ods', 'epub'],
  code: ['js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', 'py', 'rb', 'go', 'rs', 'java', 'kt', 'swift', 'c', 'h', 'cpp', 'hpp', 'cs', 'php', 'sh', 'zsh', 'bash', 'sql', 'r', 'css', 'scss', 'yaml', 'yml', 'toml', 'xml', 'tex', 'lua', 'dart', 'vue', 'svelte', 'ini', 'env', 'dockerfile', 'makefile', 'txt', 'log']
};
function fileKind(p) { const e = extOf(p); for (const k in KIND) if (KIND[k].includes(e)) return k; return 'other'; }
const OFFICE_LABEL = { pptx: 'PowerPoint', ppt: 'PowerPoint', key: 'Keynote', docx: 'Word', doc: 'Word', pages: 'Pages', xlsx: 'Excel', xls: 'Excel', numbers: 'Numbers', rtf: 'Rich text', odt: 'Document', odp: 'Slides', ods: 'Sheet', epub: 'eBook' };

/* ---------- Codex message directives ----------
   Codex writes small directives into its replies. Each becomes a real element instead of raw text. */
function dirAttrs(str) { const o = {}; String(str || '').replace(/([\w-]+)=(?:"((?:[^"\\]|\\.)*)"|([^\s}]+))/g, (_, k, q, b) => { o[k] = q != null ? q.replace(/\\"/g, '"') : b; return ''; }); return o; }
function fileChip(path, purpose, label) {
  const k = fileKind(path);
  return `<a class="fchip ${purpose === 'output' ? 'out' : ''}" data-file="${rEsc(path)}" title="${rEsc(path)}"><span class="fchip-k">${rEsc((extOf(path) || 'file').toUpperCase())}</span>${rEsc(label || baseName(path))}</a>`;
}
/** Returns { text, followups, outputs } with directives outside code replaced by HTML. */
function codexDirectives(src, base) {
  const followups = [], outputs = [], sources = [];
  const parts = String(src).split(/(```[\s\S]*?(?:```|$)|`[^`\n]*`)/g);
  const text = parts.map((seg, i) => {
    if (i % 2) return seg; // code stays untouched
    seg = seg.replace(/(?:<oai-mem-citation>|\[oai-mem-citation\])[\s\S]*?<\/oai-mem-citation>/g, '');
    seg = seg.replace(/^ {0,3}::codex-realtime-inline\{\}[ \t]*$/gm, '');
    // follow-up suggestions (whole list items)
    seg = seg.replace(/^[ \t]*[-*+][ \t]+:codex-followup\[([^\]]*)\]\{([^}]*)\}[ \t]*$/gm, (_, label, at) => { followups.push({ label, prompt: dirAttrs(at).prompt || label }); return ''; });
    seg = seg.replace(/:codex-followup\[([^\]]*)\]\{([^}]*)\}/g, (_, label, at) => { followups.push({ label, prompt: dirAttrs(at).prompt || label }); return ''; });
    // file citations
    seg = seg.replace(/:codex-file-citation\{([^}]*)\}/g, (_, at) => { const a = dirAttrs(at); const path = joinPath(base, a.path || a.file || ''); if (!path) return ''; (a.purpose === 'source' ? sources : outputs).push(path); return fileChip(path, a.purpose || 'output'); });
    // inline code review comments
    seg = seg.replace(/^ {0,3}::code-comment\{([^}]*)\}[ \t]*$/gm, (_, at) => { const a = dirAttrs(at); const path = joinPath(base, a.file || ''); return `\n<div class="ccomment p${rEsc(a.priority || '2')}"><div class="cc-h"><b>${rEsc(a.title || 'Comment')}</b><a class="flink" data-file="${rEsc(path)}">${rEsc(baseName(path))}${a.start ? ':' + rEsc(a.start) + (a.end && a.end !== a.start ? '-' + rEsc(a.end) : '') : ''}</a></div><p>${rEsc(a.body || '')}</p></div>\n`; });
    // inline visualizations saved as files
    seg = seg.replace(/^ {0,3}::codex-(?:inline|live)-vis\{([^}]*)\}[ \t]*$/gm, (_, at) => { const a = dirAttrs(at); const path = joinPath(base, a.file || a.path || ''); return path ? `\n<div class="inline-vis"><iframe sandbox="allow-scripts" src="${fileURL(path)}" loading="lazy"></iframe><a class="flink" data-file="${rEsc(path)}">${rEsc(baseName(path))}</a></div>\n` : ''; });
    seg = seg.replace(/:codex-annotation\{([^}]*)\}/g, (_, at) => `<span class="anno">${rEsc(dirAttrs(at).index || '•')}</span>`);
    // anything else in directive form: keep its visible label, drop the machinery
    seg = seg.replace(/::?codex-[a-z-]+(?:\[([^\]]*)\])?\{[^}]*\}/g, (_, label) => label ? rEsc(label) : '');
    return seg;
  }).join('');
  return { text: text.replace(/\n{3,}/g, '\n\n'), followups, outputs, sources };
}
/** Files Codex named as outputs in a message. */
function citedOutputs(text, base) { return /:codex-file-citation/.test(text || '') ? [...new Set(codexDirectives(text, base).outputs)] : []; }

const Render = {
  home: null,
  /** Markdown → sanitized HTML. `base` resolves relative file links. */
  md(text, base) {
    if (!text) return '';
    let html, fups = [];
    if (/codex-|code-comment|oai-mem-citation/.test(text)) { const d = codexDirectives(text, base); text = d.text; fups = d.followups; }
    try {
      const renderer = new marked.Renderer();
      renderer.code = (code, lang) => {
        const l = (lang || '').trim().split(/\s+/)[0].toLowerCase();
        if (l === 'mermaid') return `<div class="mermaid-box"><pre class="mermaid">${rEsc(code)}</pre></div>`;
        if (l === 'math' || l === 'latex' && /^\s*\\begin|^\s*[^\n]*\\(frac|sum|int)/.test(code)) return `<div class="math-block">$$${rEsc(code)}$$</div>`;
        return codeBlock(code, l);
      };
      renderer.link = (href, title, txt) => {
        const h = href || '';
        if (/^(https?:|mailto:)/i.test(h)) return `<a href="${rEsc(h)}" target="_blank" rel="noopener">${txt}</a>`;
        if (/^#/.test(h)) return txt;
        const path = joinPath(base, decodeURIComponent(h.replace(/^file:\/\//, '').replace(/^codex-file-mention:\/\//, '').replace(/#L\d+(-L?\d+)?$/, '')));
        return `<a class="flink" data-file="${rEsc(path)}" title="${rEsc(path)}">${txt}</a>`;
      };
      renderer.image = (href, title, alt) => {
        const h = href || '';
        const src = /^(https?:|data:)/.test(h) ? h : fileURL(joinPath(base, decodeURIComponent(h.replace(/^file:\/\//, ''))));
        return `<img class="md-img" src="${rEsc(src)}" alt="${rEsc(alt || '')}" data-zoom="1">`;
      };
      html = marked.parse(String(text), { renderer, gfm: true, breaks: false });
    } catch (e) { html = `<pre>${rEsc(text)}</pre>`; }
    if (fups.length) html += `<div class="fups">${fups.map(f => `<button class="fup" data-followup="${rEsc(f.prompt)}">${rEsc(f.label)}</button>`).join('')}</div>`;
    return DOMPurify.sanitize(html, { ADD_ATTR: ['data-file', 'data-zoom', 'data-code', 'data-followup', 'target', 'sandbox', 'loading'], ADD_TAGS: ['iframe'], FORBID_TAGS: ['style', 'form'], ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|data|bearing):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i });
  },
  /** Upgrade rendered HTML inside `el`: highlighting, mermaid, math, copy buttons. */
  async enhance(el) {
    if (!el) return;
    el.querySelectorAll('pre code[data-lang]:not(.hljs)').forEach(c => { try { const l = c.dataset.lang; if (l && hljs.getLanguage(l)) hljs.highlightElement(c); else c.classList.add('hljs'); } catch (e) { } });
    const ms = [...el.querySelectorAll('pre.mermaid:not([data-done])')];
    if (ms.length && window.mermaid) {
      ms.forEach(m => m.setAttribute('data-done', '1'));
      try { mermaid.initialize({ startOnLoad: false, theme: isDark() ? 'dark' : 'neutral', securityLevel: 'strict', fontFamily: 'Geist, system-ui, sans-serif' }); await mermaid.run({ nodes: ms, suppressErrors: true }); } catch (e) { }
    }
    if (window.renderMathInElement && /\$|\\\(|\\\[/.test(el.textContent)) {
      try { renderMathInElement(el, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }], throwOnError: false, ignoredClasses: ['hljs', 'term'] }); } catch (e) { }
    }
  },
  /** Unified diff → colored lines. */
  diff(diff) {
    const lines = String(diff || '').split('\n'); let add = 0, del = 0;
    const body = lines.map(l => {
      let c = '';
      if (l.startsWith('+++') || l.startsWith('---')) c = 'dh';
      else if (l.startsWith('@@')) c = 'dh2';
      else if (l.startsWith('+')) { c = 'da'; add++; }
      else if (l.startsWith('-')) { c = 'dd'; del++; }
      return `<span class="${c}">${rEsc(l) || ' '}</span>`;
    }).join('\n');
    return { html: `<pre class="diff">${body}</pre>`, add, del };
  },
  diffStat(diff) { let a = 0, d = 0; String(diff || '').split('\n').forEach(l => { if (l.startsWith('+') && !l.startsWith('+++')) a++; else if (l.startsWith('-') && !l.startsWith('---')) d++; }); return { add: a, del: d }; },
  term(text) { return `<pre class="term">${ansi(String(text || ''))}</pre>`; },
};
function isDark() { const t = document.documentElement.getAttribute('data-theme'); return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; }
function codeBlock(code, lang) {
  return `<div class="codeblk"><div class="codeblk-h"><span>${rEsc(lang || 'text')}</span><button class="cbtn" data-copy="1">Copy</button></div><pre><code data-lang="${rEsc(lang)}">${rEsc(code)}</code></pre></div>`;
}
function ansi(s) {
  // Minimal SGR color support for terminal output.
  const map = { 30: 'k', 31: 'r', 32: 'g', 33: 'y', 34: 'b', 35: 'm', 36: 'c', 37: 'w', 90: 'k', 91: 'r', 92: 'g', 93: 'y', 94: 'b', 95: 'm', 96: 'c', 97: 'w' };
  let out = '', open = 0;
  const parts = s.split(/\x1b\[([0-9;]*)m/);
  parts.forEach((p, i) => {
    if (i % 2 === 0) out += rEsc(p);
    else { while (open) { out += '</span>'; open--; } p.split(';').forEach(code => { if (map[code]) { out += `<span class="a-${map[code]}">`; open++; } else if (code === '1') { out += '<span class="a-bold">'; open++; } }); }
  });
  while (open) { out += '</span>'; open--; }
  return out.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '');
}

/* ---------- file cards and the viewer ---------- */
const THUMBS = new Map();
function fileIcon(p) {
  const k = fileKind(p), e = extOf(p);
  const label = k === 'office' ? (OFFICE_LABEL[e] || e.toUpperCase()) : k === 'pdf' ? 'PDF' : k === 'image' || k === 'svg' ? 'Image' : k === 'video' ? 'Video' : k === 'audio' ? 'Audio' : k === 'html' ? 'Web page' : k === 'md' ? 'Markdown' : k === 'csv' ? 'Table' : k === 'json' ? 'JSON' : k === 'code' ? (e || 'Text').toUpperCase() : (e || 'File').toUpperCase();
  return label;
}
/** A file card. Images show inline; other types get a Quick Look thumbnail when one exists. */
function fileCard(path, o = {}) {
  const k = fileKind(path);
  const thumb = (k === 'image' || k === 'svg') ? `<img src="${fileURL(path)}" alt="" loading="lazy">` : `<span class="fc-ph" data-thumb="${rEsc(path)}"><b>${rEsc(extOf(path).toUpperCase() || 'FILE')}</b></span>`;
  return `<button class="fcard ${o.big ? 'big' : ''}" data-file="${rEsc(path)}" title="${rEsc(path)}"><span class="fc-t">${thumb}</span><span class="fc-m"><span class="fc-n">${rEsc(baseName(path))}</span><span class="fc-k">${rEsc(o.sub || fileIcon(path))}</span></span></button>`;
}
function hydrateThumbs(root) {
  if (!NATIVE) return;
  (root || document).querySelectorAll('[data-thumb]:not([data-tried])').forEach(el => {
    el.setAttribute('data-tried', '1');
    const p = el.dataset.thumb;
    const set = url => { if (url) el.innerHTML = `<img src="${url}" alt="">`; };
    if (THUMBS.has(p)) return set(THUMBS.get(p));
    nat('thumbnail', { path: p, size: 360 }).then(u => { THUMBS.set(p, u); set(u); }).catch(() => { });
  });
}

const Viewer = {
  async open(path, list) {
    const v = document.getElementById('viewer');
    this.list = list && list.length ? list : [path]; this.i = Math.max(0, this.list.indexOf(path));
    v.hidden = false; document.body.classList.add('viewer-open');
    await this.show();
  },
  close() { const v = document.getElementById('viewer'); v.hidden = true; v.innerHTML = ''; document.body.classList.remove('viewer-open'); },
  step(d) { if (this.list.length < 2) return; this.i = (this.i + d + this.list.length) % this.list.length; this.show(); },
  async show() {
    const path = this.list[this.i]; const v = document.getElementById('viewer');
    const k = fileKind(path);
    v.innerHTML = `<div class="vw-bg" data-vw="close"></div><div class="vw-box"><header class="vw-h"><div class="vw-t"><span class="vw-n">${rEsc(baseName(path))}</span><span class="vw-p mono">${rEsc(path)}</span></div>
      <div class="vw-a">${this.list.length > 1 ? `<span class="mono vw-c">${this.i + 1} / ${this.list.length}</span><button class="tbtn" data-vw="prev">←</button><button class="tbtn" data-vw="next">→</button>` : ''}<button class="tbtn" data-vw="ql">Quick Look</button><button class="tbtn" data-vw="reveal">Show in Finder</button><button class="tbtn" data-vw="open">Open</button><button class="tbtn" data-vw="close" aria-label="Close">✕</button></div></header>
      <div class="vw-body" id="vw-body"><div class="vw-loading">Opening…</div></div></div>`;
    await renderFileInto(document.getElementById('vw-body'), path);
  }
};
/** Renders any local file into `body`: images, PDF, HTML, video, audio, Office (Quick Look), Markdown, tables, JSON, code. */
async function renderFileInto(body, path) {
  const k = fileKind(path); const src = fileURL(path);
  try {
    if (await nat('exists', { path }).catch(() => 'file') == null) { body.innerHTML = `<div class="vw-office"><p>This file is no longer at <span class="mono">${rEsc(path)}</span>.</p></div>`; return; }
    if (k === 'image' || k === 'svg') body.innerHTML = `<div class="vw-img"><img src="${src}" alt=""></div>`;
    else if (k === 'pdf') body.innerHTML = `<iframe class="vw-frame" src="${src}"></iframe>`;
    else if (k === 'html') body.innerHTML = `<iframe class="vw-frame white" sandbox="allow-scripts allow-popups allow-forms" src="${src}"></iframe>`;
    else if (k === 'video') body.innerHTML = `<div class="vw-img"><video src="${src}" controls></video></div>`;
    else if (k === 'audio') body.innerHTML = `<div class="vw-img"><audio src="${src}" controls></audio></div>`;
    else if (k === 'office') {
      const thumb = await nat('thumbnail', { path, size: 1400 }).catch(() => null);
      body.innerHTML = `<div class="vw-office">${thumb ? `<img src="${thumb}" alt="">` : '<div class="vw-loading">No preview image for this file.</div>'}<p>${rEsc(OFFICE_LABEL[extOf(path)] || 'Document')} file. Quick Look shows every page, sheet and slide.</p><div><button class="tbtn primary" data-fopen="ql" data-path="${rEsc(path)}">Open in Quick Look</button> <button class="tbtn" data-fopen="open" data-path="${rEsc(path)}">Open in ${rEsc(OFFICE_LABEL[extOf(path)] || 'its app')}</button></div></div>`;
    } else {
      const text = await nat('readText', { path });
      if (text == null) { body.innerHTML = `<div class="vw-office"><p>This file can't be shown as text.</p><button class="tbtn primary" data-fopen="ql" data-path="${rEsc(path)}">Open in Quick Look</button></div>`; return; }
      const dir = path.split('/').slice(0, -1).join('/');
      if (k === 'md') { body.innerHTML = `<article class="prose vw-prose">${Render.md(text, dir)}</article>`; Render.enhance(body); }
      else if (k === 'csv') body.innerHTML = csvTable(text, extOf(path) === 'tsv' ? '\t' : ',');
      else if (k === 'json') { let t = text; try { if (extOf(path) !== 'jsonl') t = JSON.stringify(JSON.parse(text), null, 2); } catch (e) { } body.innerHTML = `<div class="vw-code">${codeBlock(t.slice(0, 400000), 'json')}</div>`; Render.enhance(body); }
      else { const e = extOf(path); body.innerHTML = `<div class="vw-code">${codeBlock(text.slice(0, 400000), e === 'txt' || e === 'log' || !e ? 'plaintext' : e)}</div>`; Render.enhance(body); }
    }
  } catch (e) { body.innerHTML = `<div class="vw-office"><p>${rEsc(e.message || 'Could not open this file.')}</p></div>`; }
}
function csvTable(text, sep) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length && rows.length < 2000; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true; else if (c === sep) { row.push(cell); cell = ''; } else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; } else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [h, ...b] = rows;
  return `<div class="vw-table"><table><thead><tr>${(h || []).map(x => `<th>${rEsc(x)}</th>`).join('')}</tr></thead><tbody>${b.map(r => `<tr>${r.map(x => `<td>${rEsc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>${rows.length >= 2000 ? '<p class="mono">Showing the first 2,000 rows.</p>' : ''}</div>`;
}

document.addEventListener('click', e => {
  const cp = e.target.closest('[data-copy]');
  if (cp) { const code = cp.closest('.codeblk')?.querySelector('code')?.innerText ?? cp.dataset.copy; navigator.clipboard.writeText(code).then(() => { cp.textContent = 'Copied'; setTimeout(() => cp.textContent = 'Copy', 1400); }).catch(() => { }); e.stopPropagation(); return; }
  const vw = e.target.closest('[data-vw]');
  if (vw) {
    const a = vw.dataset.vw, p = Viewer.list && Viewer.list[Viewer.i];
    if (a === 'close') Viewer.close(); else if (a === 'prev') Viewer.step(-1); else if (a === 'next') Viewer.step(1);
    else if (a === 'ql') nat('quicklook', { paths: Viewer.list, index: Viewer.i }); else if (a === 'reveal') nat('reveal', { path: p }); else if (a === 'open') nat('open', { path: p });
    e.stopPropagation(); return;
  }
  const fo = e.target.closest('[data-fopen]');
  if (fo) { nat(fo.dataset.fopen === 'ql' ? 'quicklook' : fo.dataset.fopen === 'reveal' ? 'reveal' : 'open', { path: fo.dataset.path }); e.stopPropagation(); return; }
  const f = e.target.closest('[data-file]');
  if (f && !e.target.closest('[data-act]')) {
    e.preventDefault(); e.stopPropagation();
    if (window.Pane && f.closest('.chat') && !f.closest('.chat-pane')) { Pane.open(f.dataset.file); return; }
    const group = f.closest('[data-files]'); const list = group ? [...group.querySelectorAll('[data-file]')].map(x => x.dataset.file) : null;
    Viewer.open(f.dataset.file, list ? [...new Set(list)] : null); return;
  }
  const z = e.target.closest('img[data-zoom]');
  if (z) { const src = z.getAttribute('src') || ''; if (src.startsWith('bearing://file')) Viewer.open(decodeURI(src.slice('bearing://file'.length))); }
}, true);
document.addEventListener('keydown', e => {
  if (document.getElementById('viewer')?.hidden !== false) return;
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); Viewer.close(); }
  else if (e.key === 'ArrowRight') Viewer.step(1); else if (e.key === 'ArrowLeft') Viewer.step(-1);
  else if (e.key === ' ' && !e.target.matches('input,textarea')) { e.preventDefault(); nat('quicklook', { paths: Viewer.list, index: Viewer.i }); }
}, true);
