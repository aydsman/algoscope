/* ==========================================================================
   AlgoScope — Searching algorithms
   ========================================================================== */
(function () {
  'use strict';

  const { ui, Player } = DSA;
  const { el, C } = ui;

  const H = (cls, ...idx) => { const o = {}; for (const i of idx) o[i] = cls; return o; };
  const M = (...objs) => Object.assign({}, ...objs);

  function recorder(a) {
    const R = { a, frames: [], cmp: 0 };
    /** extra: {ptr: {name: index}, active: [lo, hi], type, result} */
    R.snap = (line, msg, hl = {}, extra = {}) => {
      const ptr = {};
      for (const [name, idx] of Object.entries(extra.ptr || {})) {
        if (idx >= 0 && idx < a.length) (ptr[idx] = ptr[idx] || []).push(name);
      }
      R.frames.push({ arr: a, hl, line, msg, cmp: R.cmp, ptr, active: extra.active, type: extra.type, result: extra.result });
    };
    return R;
  }

  function linear(R, t) {
    const a = R.a;
    const seen = {};
    R.snap(0, `Scan from left to right looking for ${t}.`);
    for (let i = 0; i < a.length; i++) {
      R.cmp++;
      if (a[i] === t) {
        R.snap(1, `a[${i}] = ${a[i]} equals ${t} → found at index ${i}!`, M(seen, H('found', i)), { ptr: { i }, type: 'success', result: i });
        return;
      }
      R.snap(1, `a[${i}] = ${a[i]} ≠ ${t} → keep going.`, M(seen, H('compare', i)), { ptr: { i } });
      seen[i] = 'visited';
    }
    R.snap(2, `Reached the end — ${t} is not in the array. Return -1.`, seen, { type: 'error', result: -1 });
  }

  function binary(R, t) {
    const a = R.a;
    let lo = 0, hi = a.length - 1;
    R.snap(0, `Search range is the whole array [${lo}..${hi}].`, {}, { ptr: { lo, hi }, active: [lo, hi] });
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      R.snap(2, `mid = ⌊(${lo} + ${hi}) / 2⌋ = ${mid}.`, H('compare', mid), { ptr: { lo, mid, hi }, active: [lo, hi] });
      R.cmp++;
      if (a[mid] === t) {
        R.snap(3, `a[${mid}] = ${t} → found at index ${mid}!`, H('found', mid), { ptr: { mid }, active: [lo, hi], type: 'success', result: mid });
        return;
      }
      if (a[mid] < t) {
        lo = mid + 1;
        R.snap(4, `a[${mid}] = ${a[mid]} < ${t} → discard the left half. lo = ${lo}.`, {}, { ptr: { lo, hi }, active: [lo, hi] });
      } else {
        hi = mid - 1;
        R.snap(5, `a[${mid}] = ${a[mid]} > ${t} → discard the right half. hi = ${hi}.`, {}, { ptr: { lo, hi }, active: [lo, hi] });
      }
    }
    R.snap(6, `lo (${lo}) > hi (${hi}) — range is empty. ${t} not found, return -1.`, {}, { active: [1, 0], type: 'error', result: -1 });
  }

  function jump(R, t) {
    const a = R.a, n = a.length;
    const s = Math.max(1, Math.floor(Math.sqrt(n)));
    let prev = 0, step = s;
    R.snap(0, `Block size = ⌊√${n}⌋ = ${s}. Jump ahead block by block.`, {}, { ptr: { prev } });
    while (true) {
      const end = Math.min(step, n) - 1;
      R.cmp++;
      R.snap(1, `Check the last element of block [${prev}..${end}]: is a[${end}] = ${a[end]} < ${t}?`, H('compare', end), { ptr: { prev, end }, active: [prev, end] });
      if (a[end] >= t) break;
      prev = step;
      step += s;
      if (prev >= n) {
        R.snap(3, `Jumped past the end of the array — ${t} is not present. Return -1.`, {}, { active: [1, 0], type: 'error', result: -1 });
        return;
      }
      R.snap(2, `Yes → ${t} must be further right. Jump: prev = ${prev}.`, {}, { ptr: { prev }, active: [prev, Math.min(step, n) - 1] });
    }
    const end = Math.min(step, n) - 1;
    R.snap(4, `${t} can only be inside block [${prev}..${end}] — scan it linearly.`, {}, { ptr: { prev, end }, active: [prev, end] });
    const seen = {};
    for (let i = prev; i <= end; i++) {
      R.cmp++;
      if (a[i] === t) {
        R.snap(5, `a[${i}] = ${t} → found at index ${i}!`, M(seen, H('found', i)), { ptr: { i }, active: [prev, end], type: 'success', result: i });
        return;
      }
      R.snap(5, `a[${i}] = ${a[i]} ≠ ${t}.`, M(seen, H('compare', i)), { ptr: { i }, active: [prev, end] });
      seen[i] = 'visited';
    }
    R.snap(6, `${t} is not in the block — not found. Return -1.`, seen, { active: [prev, end], type: 'error', result: -1 });
  }

  const ALGOS = {
    linear: {
      name: 'Linear Search', run: linear, sorted: false,
      code: ['for i = 0 to n - 1:', '  if a[i] == target: return i', 'return -1'],
      complexity: [['Best', 'O(1)'], ['Average', 'O(n)'], ['Worst', 'O(n)'], ['Space', 'O(1)'], ['Needs sorted input', 'No']],
    },
    binary: {
      name: 'Binary Search', run: binary, sorted: true,
      code: [
        'lo = 0; hi = n - 1',
        'while lo <= hi:',
        '  mid = ⌊(lo + hi) / 2⌋',
        '  if a[mid] == target: return mid',
        '  else if a[mid] < target: lo = mid + 1',
        '  else: hi = mid - 1',
        'return -1',
      ],
      complexity: [['Best', 'O(1)'], ['Average', 'O(log n)'], ['Worst', 'O(log n)'], ['Space', 'O(1)'], ['Needs sorted input', 'Yes']],
    },
    jump: {
      name: 'Jump Search', run: jump, sorted: true,
      code: [
        'step = ⌊√n⌋; prev = 0',
        'while a[min(step, n) - 1] < target:',
        '  prev = step; step = step + ⌊√n⌋',
        '  if prev >= n: return -1',
        'for i = prev to min(step, n) - 1:',
        '  if a[i] == target: return i',
        'return -1',
      ],
      complexity: [['Best', 'O(1)'], ['Average', 'O(√n)'], ['Worst', 'O(√n)'], ['Space', 'O(1)'], ['Needs sorted input', 'Yes']],
    },
  };

  const isSorted = (a) => a.every((v, i) => i === 0 || a[i - 1] <= v);

  function create() {
    const L = ui.createLayout({
      title: 'Searching Algorithms',
      description: 'Find a target value in an array. Compare how many checks linear, binary and jump search need. Binary and jump search require sorted input.',
    });

    let algo = 'binary';
    let size = 15;
    let base = [];

    const algoSel = ui.select({
      label: 'Algorithm',
      options: Object.entries(ALGOS).map(([value, a]) => ({ value, label: a.name })),
      value: algo,
      onChange: (v) => { algo = v; applyAlgo(); ensureSorted(); showIdle(); },
    });
    const sizeSl = ui.slider({ label: 'Array size', min: 5, max: 40, value: size, onInput: (v) => { size = v; generate(); } });
    const custom = ui.text({ label: 'Custom values (−999 to 999)', placeholder: 'e.g. 3 9 14 21 30', width: '220px', onEnter: applyCustom });
    const target = ui.text({ label: 'Target', type: 'number', onEnter: run });

    L.controls.append(
      algoSel.root, sizeSl.root,
      ui.group(ui.button('New array', generate)),
      ui.divider(),
      ui.group(custom.root, ui.button('Use values', applyCustom)),
      ui.divider(),
      ui.group(target.root, ui.button('Random target', randomTarget), ui.button('Search ▶', run, { variant: 'primary' }))
    );

    const cellsWrap = el('div', { class: 'cells' });
    L.stage.append(cellsWrap);
    L.setLegend([[C.compare, 'Checking'], [C.found, 'Found'], [C.visited, 'Already checked'], ['#2a3060', 'Outside search range (faded)']]);

    const player = new Player(L.playerBar, { onRender: render, speed: 30 });

    function render(f) {
      const a = f.arr;
      const cells = a.map((v, i) => {
        const h = f.hl[i];
        const dim = f.active && (i < f.active[0] || i > f.active[1]);
        return el('div', { class: 'cell' + (dim ? ' dim' : '') },
          el('div', { class: 'ptr' }, (f.ptr[i] || []).join(' ')),
          el('div', { class: 'box' + (h ? ' s-' + h : '') }, v),
          el('div', { class: 'idx' }, i));
      });
      cellsWrap.classList.toggle('small', a.length > 24);
      cellsWrap.replaceChildren(...cells);
      L.applyFrame(f);
      L.setStats({
        Comparisons: f.cmp,
        'Array size': a.length,
        Target: f.target ?? (target.value || '—'),
        Result: f.result == null ? '—' : f.result === -1 ? 'not found' : `index ${f.result}`,
      });
    }

    function applyAlgo() {
      const A = ALGOS[algo];
      L.setCode(A.name, A.code);
      L.setComplexity(A.complexity);
    }

    function ensureSorted() {
      if (ALGOS[algo].sorted && !isSorted(base)) {
        base = base.slice().sort((x, y) => x - y);
        ui.toast(`${ALGOS[algo].name} needs sorted input — the array was sorted for you.`);
      }
    }

    function showIdle(msg) {
      player.load([{
        arr: base, hl: {}, ptr: {}, line: null, cmp: 0,
        msg: msg || `Array of ${base.length} values ready. Enter a target and press "Search ▶".`,
      }], { autoplay: false });
    }

    function generate() {
      base = ui.uniqueRandom(size, 1, 99);
      if (ALGOS[algo].sorted) base.sort((x, y) => x - y);
      randomTarget(true);
      showIdle();
    }

    function randomTarget(silent) {
      // ~80% of the time pick a value that exists, otherwise one that doesn't.
      let t;
      if (Math.random() < 0.8 && base.length) t = base[ui.randInt(0, base.length - 1)];
      else do { t = ui.randInt(1, 99); } while (base.includes(t) && base.length < 99);
      target.set(t);
      if (silent !== true) showIdle(`Target set to ${t}. Press "Search ▶".`);
    }

    function applyCustom() {
      const { values, error } = ui.parseValues(custom.value, { maxCount: 40 });
      if (error) { ui.toast(error, 'error'); L.setMessage(error, 'error'); return; }
      base = values;
      size = values.length;
      sizeSl.set(Math.max(5, values.length));
      ensureSorted();
      showIdle();
      ui.toast(`Loaded ${values.length} custom value${values.length > 1 ? 's' : ''}.`, 'success');
    }

    function run() {
      const { value: t, error } = ui.parseOne(target.value, { name: 'Target' });
      if (error) { ui.toast(error, 'error'); L.setMessage(error, 'error'); return; }
      ensureSorted();
      const R = recorder(base);
      ALGOS[algo].run(R, t);
      R.frames.forEach((f) => { f.target = t; });
      player.load(R.frames);
    }

    applyAlgo();
    generate();

    return { root: L.root, player, _test: { run, get frames() { return player.frames; }, setTarget: (v) => target.set(v) } };
  }

  DSA.modules.push({
    id: 'searching',
    title: 'Searching',
    group: 'Arrays',
    blurb: 'Linear, Binary and Jump search with lo / mid / hi pointers and a shrinking search window.',
    icon: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    create,
  });
})();
