/* ==========================================================================
   AlgoScope — Sorting algorithms
   ========================================================================== */
(function () {
  'use strict';

  const { ui, Player } = DSA;
  const { el, C } = ui;

  /** Highlight helper: H('compare', 2, 3) → {2: 'compare', 3: 'compare'} */
  const H = (cls, ...idx) => { const o = {}; for (const i of idx) o[i] = cls; return o; };
  const M = (...objs) => Object.assign({}, ...objs);

  function recorder(a) {
    const R = { a, frames: [], sorted: new Array(a.length).fill(false), cmp: 0, swp: 0 };
    R.snap = (line, msg, hl = {}, extra = {}) =>
      R.frames.push({ arr: a.slice(), sorted: R.sorted.slice(), hl, line, msg, cmp: R.cmp, swp: R.swp, ...extra });
    R.swap = (i, j) => { const t = a[i]; a[i] = a[j]; a[j] = t; R.swp++; };
    return R;
  }

  /* ---------------- Algorithms ---------------- */

  function bubble(R) {
    const a = R.a, n = a.length;
    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      R.snap([0, 1], `Pass ${i + 1}: bubble the largest unsorted value up to index ${n - i - 1}.`);
      for (let j = 0; j < n - i - 1; j++) {
        R.cmp++;
        R.snap(3, `Compare a[${j}] = ${a[j]} and a[${j + 1}] = ${a[j + 1]}.`, H('compare', j, j + 1));
        if (a[j] > a[j + 1]) {
          R.swap(j, j + 1);
          swapped = true;
          R.snap(4, `${a[j + 1]} > ${a[j]} → swap them.`, H('swap', j, j + 1));
        }
      }
      R.sorted[n - i - 1] = true;
      R.snap(5, `a[${n - i - 1}] = ${a[n - i - 1]} is now in its final position.`);
      if (!swapped) {
        R.sorted.fill(true);
        R.snap(6, 'No swaps happened in this pass — the array is already sorted. Early exit!');
        return;
      }
    }
  }

  function selection(R) {
    const a = R.a, n = a.length;
    for (let i = 0; i < n - 1; i++) {
      let m = i;
      R.snap(1, `Assume a[${i}] = ${a[i]} is the minimum of the unsorted part.`, H('pivot', i));
      for (let j = i + 1; j < n; j++) {
        R.cmp++;
        R.snap(3, `Compare a[${j}] = ${a[j]} with current minimum ${a[m]}.`, M(H('pivot', m), H('compare', j)));
        if (a[j] < a[m]) {
          m = j;
          R.snap(4, `New minimum found: ${a[m]} at index ${m}.`, H('pivot', m));
        }
      }
      if (m !== i) {
        R.swap(i, m);
        R.snap(5, `Swap the minimum into position ${i}.`, H('swap', i, m));
      } else {
        R.snap(5, `Minimum is already at index ${i} — no swap needed.`, H('pivot', i));
      }
      R.sorted[i] = true;
      R.snap(6, `a[${i}] = ${a[i]} is in its final position.`);
    }
  }

  function insertion(R) {
    const a = R.a, n = a.length;
    if (n) R.sorted[0] = true;
    for (let i = 1; i < n; i++) {
      const key = a[i];
      let j = i - 1;
      R.snap(1, `Take key = ${key} (index ${i}) and insert it into the sorted prefix.`, H('pivot', i));
      while (j >= 0) {
        R.cmp++;
        R.snap(2, `Is a[${j}] = ${a[j]} greater than key ${key}?`, M(H('compare', j), H('pivot', j + 1)));
        if (a[j] > key) {
          R.swap(j, j + 1);
          R.snap([3, 4], `Yes → shift ${a[j + 1]} one place to the right.`, M(H('swap', j + 1), H('pivot', j)));
          j--;
        } else break;
      }
      for (let k = 0; k <= i; k++) R.sorted[k] = true;
      R.snap(5, `Key ${key} placed at index ${j + 1}. Prefix [0..${i}] is sorted.`, H('pivot', j + 1));
    }
  }

  function mergeSort(R) {
    const a = R.a;
    function sort(lo, hi) {
      if (lo >= hi) return;
      const mid = (lo + hi) >> 1;
      R.snap(2, `Split [${lo}..${hi}] into [${lo}..${mid}] and [${mid + 1}..${hi}].`, {}, { range: [lo, hi] });
      sort(lo, mid);
      sort(mid + 1, hi);
      merge(lo, mid, hi);
    }
    function merge(lo, mid, hi) {
      let i = lo, j = mid + 1, m = mid;
      const range = [lo, hi];
      R.snap(5, `Merge sorted halves [${lo}..${mid}] and [${mid + 1}..${hi}].`, {}, { range });
      while (i <= m && j <= hi) {
        R.cmp++;
        R.snap(6, `Compare left head ${a[i]} with right head ${a[j]}.`, H('compare', i, j), { range });
        if (a[i] <= a[j]) {
          R.snap(7, `${a[i]} ≤ ${a[j]} → left head stays; advance left.`, H('pivot', i), { range });
          i++;
        } else {
          const v = a[j];
          for (let k = j; k > i; k--) a[k] = a[k - 1];
          a[i] = v;
          R.swp++;
          R.snap(7, `${v} is smaller → move it into position ${i}.`, H('swap', i), { range });
          i++; m++; j++;
        }
      }
      if (lo === 0 && hi === a.length - 1) R.sorted.fill(true);
      const done = {};
      for (let k = lo; k <= hi; k++) done[k] = 'active';
      R.snap(8, `Segment [${lo}..${hi}] is sorted.`, done, { range });
    }
    sort(0, a.length - 1);
  }

  function quick(R) {
    const a = R.a;
    function qs(lo, hi) {
      if (lo > hi) return;
      const range = [lo, hi];
      if (lo === hi) {
        R.sorted[lo] = true;
        R.snap(1, `Single element a[${lo}] = ${a[lo]} is already in place.`, {}, { range });
        return;
      }
      const p = a[hi];
      let i = lo;
      R.snap(2, `Partition [${lo}..${hi}] with pivot a[${hi}] = ${p}.`, H('pivot', hi), { range });
      for (let j = lo; j < hi; j++) {
        R.cmp++;
        R.snap(4, `Is a[${j}] = ${a[j]} < pivot ${p}? (i = ${i})`, M(H('active', i), H('compare', j), H('pivot', hi)), { range });
        if (a[j] < p) {
          if (i !== j) {
            R.swap(i, j);
            R.snap(5, `Yes → swap a[${i}] and a[${j}], then i++.`, M(H('swap', i, j), H('pivot', hi)), { range });
          } else {
            R.snap(5, `Yes → a[${j}] is already on the "less than" side; i++.`, M(H('active', i), H('pivot', hi)), { range });
          }
          i++;
        }
      }
      if (i !== hi) R.swap(i, hi);
      R.sorted[i] = true;
      R.snap(6, `Place pivot ${p} at index ${i} — its final position.`, H('swap', i, hi), { range });
      qs(lo, i - 1);
      qs(i + 1, hi);
    }
    qs(0, a.length - 1);
  }

  function heapSort(R) {
    const a = R.a, n = a.length;
    function sift(i, size) {
      while (true) {
        const l = 2 * i + 1, r = 2 * i + 2;
        if (l >= size) return;
        let lg = i;
        R.cmp++;
        if (a[l] > a[lg]) lg = l;
        if (r < size) { R.cmp++; if (a[r] > a[lg]) lg = r; }
        const kids = r < size ? [i, l, r] : [i, l];
        R.snap(5, `Compare ${a[i]} with its children → largest is ${a[lg]}.`, H('compare', ...kids));
        if (lg === i) return;
        R.swap(i, lg);
        R.snap(6, `Move ${a[i]} up and sift ${a[lg]} down.`, H('swap', i, lg));
        i = lg;
      }
    }
    R.snap(0, 'Phase 1: build a max-heap (sift down every internal node).');
    for (let i = (n >> 1) - 1; i >= 0; i--) sift(i, n);
    R.snap(0, `Max-heap built. The largest value ${a[0]} is at the root (index 0).`, H('pivot', 0));
    for (let end = n - 1; end > 0; end--) {
      R.swap(0, end);
      R.sorted[end] = true;
      R.snap(2, `Swap root (max) into index ${end}.`, H('swap', 0, end));
      sift(0, end);
    }
  }

  const ALGOS = {
    bubble: {
      name: 'Bubble Sort', run: bubble, moves: 'Swaps',
      code: [
        'for i = 0 to n - 2:',
        '  swapped = false',
        '  for j = 0 to n - i - 2:',
        '    if a[j] > a[j + 1]:',
        '      swap(a[j], a[j + 1]); swapped = true',
        '  // a[n - i - 1] is now in place',
        '  if not swapped: break',
      ],
      complexity: [['Best', 'O(n)'], ['Average', 'O(n²)'], ['Worst', 'O(n²)'], ['Space', 'O(1)'], ['Stable', 'Yes']],
    },
    selection: {
      name: 'Selection Sort', run: selection, moves: 'Swaps',
      code: [
        'for i = 0 to n - 2:',
        '  min = i',
        '  for j = i + 1 to n - 1:',
        '    if a[j] < a[min]:',
        '      min = j',
        '  swap(a[i], a[min])',
        '  // a[i] is now in place',
      ],
      complexity: [['Best', 'O(n²)'], ['Average', 'O(n²)'], ['Worst', 'O(n²)'], ['Space', 'O(1)'], ['Stable', 'No']],
    },
    insertion: {
      name: 'Insertion Sort', run: insertion, moves: 'Shifts',
      code: [
        'for i = 1 to n - 1:',
        '  key = a[i]; j = i - 1',
        '  while j >= 0 and a[j] > key:',
        '    a[j + 1] = a[j]      // shift right',
        '    j = j - 1',
        '  a[j + 1] = key',
      ],
      complexity: [['Best', 'O(n)'], ['Average', 'O(n²)'], ['Worst', 'O(n²)'], ['Space', 'O(1)'], ['Stable', 'Yes']],
    },
    merge: {
      name: 'Merge Sort', run: mergeSort, moves: 'Moves',
      code: [
        'mergeSort(lo, hi):',
        '  if lo >= hi: return',
        '  mid = ⌊(lo + hi) / 2⌋',
        '  mergeSort(lo, mid)',
        '  mergeSort(mid + 1, hi)',
        '  merge(lo, mid, hi):',
        '    compare left head with right head',
        '    take the smaller one next',
        '    // segment [lo..hi] is sorted',
      ],
      complexity: [['Best', 'O(n log n)'], ['Average', 'O(n log n)'], ['Worst', 'O(n log n)'], ['Space', 'O(n)'], ['Stable', 'Yes']],
    },
    quick: {
      name: 'Quick Sort', run: quick, moves: 'Swaps',
      code: [
        'quickSort(lo, hi):',
        '  if lo >= hi: return',
        '  pivot = a[hi]; i = lo',
        '  for j = lo to hi - 1:',
        '    if a[j] < pivot:',
        '      swap(a[i], a[j]); i = i + 1',
        '  swap(a[i], a[hi])     // pivot is final',
        '  quickSort(lo, i - 1); quickSort(i + 1, hi)',
      ],
      complexity: [['Best', 'O(n log n)'], ['Average', 'O(n log n)'], ['Worst', 'O(n²)'], ['Space', 'O(log n)'], ['Stable', 'No']],
    },
    heap: {
      name: 'Heap Sort', run: heapSort, moves: 'Swaps',
      code: [
        'buildMaxHeap(a)',
        'for end = n - 1 down to 1:',
        '  swap(a[0], a[end])    // max goes to the end',
        '  siftDown(a, 0, end)',
        'siftDown(a, i, size):',
        '  largest = max(a[i], a[2i + 1], a[2i + 2])',
        '  if largest ≠ i: swap, continue from largest',
      ],
      complexity: [['Best', 'O(n log n)'], ['Average', 'O(n log n)'], ['Worst', 'O(n log n)'], ['Space', 'O(1)'], ['Stable', 'No']],
    },
  };

  /* ---------------- Module ---------------- */

  function create() {
    const L = ui.createLayout({
      title: 'Sorting Algorithms',
      description: 'Watch classic comparison sorts rearrange an array step by step. Pick an algorithm, choose the array size or type your own values, then press Sort.',
    });

    let algo = 'bubble';
    let size = 30;
    let preset = 'random';
    let base = [];

    const algoSel = ui.select({
      label: 'Algorithm',
      options: Object.entries(ALGOS).map(([value, a]) => ({ value, label: a.name })),
      value: algo,
      onChange: (v) => { algo = v; applyAlgo(); showIdle(); },
    });
    const sizeSl = ui.slider({ label: 'Array size', min: 5, max: 120, value: size, onInput: (v) => { size = v; generate(); } });
    const presetSel = ui.select({
      label: 'Initial order',
      options: [
        { value: 'random', label: 'Random' },
        { value: 'nearly', label: 'Nearly sorted' },
        { value: 'reversed', label: 'Reversed' },
        { value: 'few', label: 'Few unique' },
      ],
      value: preset,
      onChange: (v) => { preset = v; generate(); },
    });
    const custom = ui.text({ label: 'Custom values (0–999, comma/space separated)', placeholder: 'e.g. 42, 7, 19, 3, 88', width: '290px', onEnter: applyCustom });

    L.controls.append(
      algoSel.root, sizeSl.root, presetSel.root,
      ui.group(ui.button('New array', generate)),
      ui.divider(),
      ui.group(custom.root, ui.button('Use values', applyCustom)),
      ui.divider(),
      ui.group(ui.button('Sort ▶', run, { variant: 'primary' }))
    );

    const barsEl = el('div', { class: 'bars' });
    L.stage.append(barsEl);
    let barEls = [];

    L.setLegend([
      [C.compare, 'Comparing'], [C.swap, 'Swapping / moving'], [C.pivot, 'Pivot / key / minimum'],
      [C.active, 'Boundary / merged run'], [C.sorted, 'Sorted'],
    ]);

    const player = new Player(L.playerBar, { onRender: render, speed: 55 });

    function render(f) {
      const a = f.arr, n = a.length;
      if (barEls.length !== n) {
        barEls = a.map(() => {
          const lbl = el('span', { class: 'lbl' });
          const bar = el('div', { class: 'bar' }, lbl);
          return { bar, lbl };
        });
        barsEl.replaceChildren(...barEls.map((x) => x.bar));
        barsEl.style.setProperty('--gap', n > 80 ? '1px' : n > 40 ? '2px' : '4px');
        barsEl.classList.toggle('show-labels', n <= 40);
      }
      let max = 1;
      for (const v of a) if (v > max) max = v;
      let sortedCount = 0;
      for (let i = 0; i < n; i++) {
        const { bar: b, lbl } = barEls[i];
        b.style.height = Math.max(1.2, (a[i] / max) * 100) + '%';
        let cls = 'bar';
        const h = f.hl[i];
        if (h) cls += ' s-' + h;
        else if (f.sorted[i]) cls += ' s-sorted';
        if (f.sorted[i]) sortedCount++;
        if (f.range && (i < f.range[0] || i > f.range[1])) cls += ' dim';
        if (b.className !== cls) b.className = cls;
        lbl.textContent = a[i];
      }
      L.applyFrame(f);
      L.setStats({ Comparisons: f.cmp, [ALGOS[algo].moves]: f.swp, 'Array size': n, 'In final place': sortedCount });
    }

    function applyAlgo() {
      const A = ALGOS[algo];
      L.setCode(A.name, A.code);
      L.setComplexity(A.complexity);
    }

    function showIdle() {
      player.load([{
        arr: base.slice(), sorted: base.map(() => false), hl: {}, line: null, cmp: 0, swp: 0,
        msg: `Array of ${base.length} values ready. Press "Sort ▶" to visualize ${ALGOS[algo].name}.`,
      }], { autoplay: false });
    }

    function generate() {
      const n = size;
      let a;
      if (preset === 'nearly') {
        a = Array.from({ length: n }, (_, i) => Math.round(5 + (95 * (i + 1)) / n));
        for (let k = 0; k < Math.max(1, Math.round(n / 10)); k++) {
          const i = ui.randInt(0, n - 1), j = Math.min(n - 1, i + ui.randInt(1, 3));
          [a[i], a[j]] = [a[j], a[i]];
        }
      } else if (preset === 'reversed') {
        a = Array.from({ length: n }, (_, i) => Math.round(5 + (95 * (n - i)) / n));
      } else if (preset === 'few') {
        const vals = [20, 45, 70, 95];
        a = Array.from({ length: n }, () => vals[ui.randInt(0, vals.length - 1)]);
      } else {
        a = Array.from({ length: n }, () => ui.randInt(5, 100));
      }
      base = a;
      showIdle();
    }

    function applyCustom() {
      const { values, error } = ui.parseValues(custom.value, { min: 0, max: 999, maxCount: 120 });
      if (error) { ui.toast(error, 'error'); L.setMessage(error, 'error'); return; }
      base = values;
      size = values.length;
      sizeSl.set(values.length);
      showIdle();
      ui.toast(`Loaded ${values.length} custom value${values.length > 1 ? 's' : ''}.`, 'success');
    }

    function run() {
      const R = recorder(base.slice());
      ALGOS[algo].run(R);
      R.sorted.fill(true);
      R.snap(null, `Sorted! ${R.cmp} comparisons and ${R.swp} ${ALGOS[algo].moves.toLowerCase()}.`, {}, { type: 'success' });
      player.load(R.frames);
    }

    applyAlgo();
    generate();

    return { root: L.root, player, _test: { run, get frames() { return player.frames; }, setAlgo: (v) => { algo = v; algoSel.set(v); applyAlgo(); }, setBase: (b) => { base = b; showIdle(); } } };
  }

  DSA.modules.push({
    id: 'sorting',
    title: 'Sorting',
    group: 'Arrays',
    blurb: 'Bubble, Selection, Insertion, Merge, Quick and Heap sort with live comparison and swap counters.',
    icon: '<path d="M5 20v-7M10 20V6M15 20v-10M20 20V3"/>',
    create,
  });
})();
