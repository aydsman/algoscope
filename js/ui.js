/* ==========================================================================
   AlgoScope — shared UI helpers
   Exposes window.DSA.ui with DOM builders, input parsing, toasts, the common
   module layout and a reusable SVG tree renderer.
   ========================================================================== */
(function () {
  'use strict';

  const DSA = (window.DSA = window.DSA || { modules: [] });
  const ui = (DSA.ui = {});

  /* ---------- DOM builders ---------- */
  function appendChildren(node, children) {
    for (const c of children.flat(Infinity)) {
      if (c == null || c === false) continue;
      node.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
  }

  /** el('div', {class: 'x', onclick: fn}, child1, child2...) */
  ui.el = function (tag, props, ...children) {
    const node = document.createElement(tag);
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') node.className = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else if (k === 'value') node.value = v;
        else node.setAttribute(k, v === true ? '' : v);
      }
    }
    appendChildren(node, children);
    return node;
  };
  const el = ui.el;

  const SVGNS = 'http://www.w3.org/2000/svg';
  ui.svg = function (tag, attrs, text) {
    const n = document.createElementNS(SVGNS, tag);
    if (attrs) for (const k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  };

  ui.icon = function (paths) {
    return el('span', {
      class: 'icon',
      html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`,
    });
  };

  /* ---------- Controls ---------- */
  ui.button = (label, onclick, opts = {}) =>
    el('button', { type: 'button', class: 'btn ' + (opts.variant || ''), title: opts.title, onclick }, label);

  ui.field = (label, control, extra) =>
    el('div', { class: 'field' }, el('span', { class: 'field-label' }, label, extra || null), control);

  ui.group = (...children) => el('div', { class: 'control-group' }, children);
  ui.divider = () => el('div', { class: 'divider' });

  ui.slider = function ({ label, min, max, step = 1, value, onInput, onChange, format = (v) => v }) {
    const out = el('b', null, format(value));
    const input = el('input', { type: 'range', min, max, step });
    input.value = value;
    input.addEventListener('input', () => {
      out.textContent = format(+input.value);
      if (onInput) onInput(+input.value);
    });
    if (onChange) input.addEventListener('change', () => onChange(+input.value));
    return {
      root: ui.field(label, input, out),
      input,
      get value() { return +input.value; },
      set(v) { input.value = v; out.textContent = format(+input.value); },
    };
  };

  ui.select = function ({ label, options, value, onChange }) {
    const input = el('select', null, options.map((o) => el('option', { value: o.value }, o.label)));
    if (value != null) input.value = value;
    input.addEventListener('change', () => onChange && onChange(input.value));
    return {
      root: label ? ui.field(label, input) : input,
      input,
      get value() { return input.value; },
      set(v) { input.value = v; },
    };
  };

  ui.text = function ({ label, placeholder, value = '', width, onEnter, type = 'text' }) {
    const input = el('input', { type, placeholder, style: width ? { width } : null });
    input.value = value;
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); if (onEnter) onEnter(input.value); }
    });
    return {
      root: label ? ui.field(label, input) : input,
      input,
      get value() { return String(input.value != null ? input.value : '').trim(); },
      set(v) { input.value = v; },
    };
  };

  ui.segmented = function ({ label, options, value, onChange }) {
    let cur = value;
    const wrap = el('div', { class: 'segmented' });
    const btns = options.map((o) =>
      el('button', {
        type: 'button',
        class: o.value === value ? 'active' : '',
        onclick: () => {
          if (cur === o.value) return;
          api.set(o.value);
          if (onChange) onChange(o.value);
        },
      }, o.label)
    );
    wrap.append(...btns);
    const api = {
      root: label ? ui.field(label, wrap) : wrap,
      get value() { return cur; },
      set(v) { cur = v; btns.forEach((b, i) => b.classList.toggle('active', options[i].value === v)); },
    };
    return api;
  };

  /* ---------- Input parsing & random helpers ---------- */
  ui.parseValues = function (str, { min = -999, max = 999, maxCount = 100, minCount = 1 } = {}) {
    const parts = String(str).split(/[\s,;]+/).filter(Boolean);
    if (parts.length < minCount) return { error: `Enter at least ${minCount} value${minCount > 1 ? 's' : ''}.` };
    if (parts.length > maxCount) return { error: `Too many values — the maximum is ${maxCount}.` };
    const values = [];
    for (const p of parts) {
      const n = Number(p);
      if (!Number.isInteger(n)) return { error: `"${p}" is not a whole number.` };
      if (n < min || n > max) return { error: `Values must be between ${min} and ${max}.` };
      values.push(n);
    }
    return { values };
  };

  ui.parseOne = function (str, { min = -999, max = 999, name = 'Value' } = {}) {
    const s = String(str).trim();
    if (s === '') return { error: `${name} is required.` };
    const n = Number(s);
    if (!Number.isInteger(n)) return { error: `${name} must be a whole number.` };
    if (n < min || n > max) return { error: `${name} must be between ${min} and ${max}.` };
    return { value: n };
  };

  ui.randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  ui.shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  /** n distinct random integers in [lo, hi] */
  ui.uniqueRandom = (n, lo, hi) => {
    const pool = [];
    for (let v = lo; v <= hi; v++) pool.push(v);
    return ui.shuffle(pool).slice(0, Math.min(n, pool.length));
  };

  /* ---------- Toasts ---------- */
  let toastWrap = null;
  ui.toast = function (msg, type = 'info') {
    if (!toastWrap) { toastWrap = el('div', { class: 'toasts' }); document.body.append(toastWrap); }
    const t = el('div', { class: 'toast ' + type }, msg);
    toastWrap.append(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 2800);
  };

  /* ---------- Standard module layout ---------- */
  ui.createLayout = function ({ title, description }) {
    const controls = el('div', { class: 'panel controls' });
    const stage = el('div', { class: 'stage' });
    const legend = el('div', { class: 'legend' });
    const playerBar = el('div', { class: 'panel player' });
    const codeTitle = el('span', { class: 'code-title' });
    const codeList = el('ol', { class: 'code' });
    const message = el('div', { class: 'message' }, 'Ready.');
    const stats = el('div', { class: 'stats' });
    const complexity = el('div', { class: 'complexity' });

    const root = el('section', { class: 'module' },
      el('header', { class: 'module-head' }, el('h1', null, title), el('p', null, description)),
      controls,
      el('div', { class: 'panel stage-panel' }, stage, legend),
      playerBar,
      el('div', { class: 'info-grid' },
        el('div', { class: 'panel' }, el('div', { class: 'panel-title' }, 'Pseudocode  ', codeTitle), codeList),
        el('div', { class: 'panel' }, el('div', { class: 'panel-title' }, 'Status'), message, stats),
        el('div', { class: 'panel' }, el('div', { class: 'panel-title' }, 'Complexity'), complexity)
      )
    );

    const L = { root, controls, stage, legend, playerBar, message, stats, complexity, codeList };

    L.setCode = (name, lines) => {
      codeTitle.textContent = name ? '— ' + name : '';
      codeList.replaceChildren(...lines.map((l) => el('li', null, l)));
    };
    L.setLine = (line) => {
      const set = new Set([].concat(line == null ? [] : line));
      const items = codeList.children;
      for (let i = 0; i < items.length; i++) items[i].classList.toggle('active', set.has(i));
    };
    L.setMessage = (msg, type) => {
      message.className = 'message ' + (type || '');
      message.textContent = msg || '';
    };
    L.setStats = (obj) => {
      stats.replaceChildren(...Object.entries(obj).map(([k, v]) =>
        el('div', { class: 'stat' }, el('span', null, k), el('b', { title: String(v) }, String(v)))));
    };
    L.setComplexity = (rows) => {
      complexity.replaceChildren(el('table', null,
        el('tbody', null, rows.map(([k, v]) => el('tr', null, el('td', null, k), el('td', null, v))))));
    };
    L.setLegend = (items) => {
      legend.replaceChildren(...items.map(([color, label]) => {
        const sw = el('i');
        sw.style.setProperty('--sw', color);
        return el('span', null, sw, label);
      }));
    };
    /** Standard frame decoration: pseudocode line + status message. */
    L.applyFrame = (f) => { L.setLine(f.line); L.setMessage(f.msg, f.type); };
    return L;
  };

  /** Common legend colours. */
  ui.C = {
    default: 'var(--c-default)', compare: 'var(--c-compare)', swap: 'var(--c-swap)', sorted: 'var(--c-sorted)',
    pivot: 'var(--c-pivot)', active: 'var(--c-active)', found: 'var(--c-found)', visited: 'var(--c-visited)',
    insert: 'var(--c-insert)', remove: 'var(--c-remove)',
  };

  /* ---------- SVG tree renderer ----------
     nodes: [{id, x, y, label, cls, tag, sub}]   edges: [{x1, y1, x2, y2, cls}] */
  ui.drawTree = function (svg, { nodes, edges, width, height, r = 19 }) {
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.maxWidth = width + 'px';
    const gE = ui.svg('g');
    const gN = ui.svg('g');
    for (const e of edges) {
      gE.append(ui.svg('line', { x1: e.x1, y1: e.y1, x2: e.x2, y2: e.y2, class: 'tedge ' + (e.cls || '') }));
    }
    for (const n of nodes) {
      const g = ui.svg('g', { class: 'tnode' + (n.cls ? ' s-' + n.cls : ''), transform: `translate(${n.x},${n.y})` });
      g.append(ui.svg('circle', { r }));
      g.append(ui.svg('text', { 'text-anchor': 'middle', dy: '0.36em' }, n.label));
      if (n.tag) g.append(ui.svg('text', { class: 'ttag', 'text-anchor': 'middle', y: -r - 8 }, n.tag));
      if (n.sub != null) g.append(ui.svg('text', { class: 'tsub', 'text-anchor': 'middle', y: r + 14 }, n.sub));
      gN.append(g);
    }
    svg.replaceChildren(gE, gN);
  };
})();
