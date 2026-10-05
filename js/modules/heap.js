/* ==========================================================================
   AlgoScope — Binary Heap & Priority Queue
   Dual View: Array representation and Binary Tree side-by-side
   ========================================================================== */
(function () {
  'use strict';

  const { ui, Player } = DSA;
  const { el, C } = ui;

  const CODE = {
    insert: [
      'insert(x):',
      '  heap.append(x)',
      '  siftUp(heap.length - 1)',
      'siftUp(i):',
      '  parent = ⌊(i - 1) / 2⌋',
      '  while i > 0 and heap[i] breaks heap-property with heap[parent]:',
      '    swap(heap[i], heap[parent])',
      '    i = parent; parent = ⌊(i - 1) / 2⌋',
    ],
    extract: [
      'extractTop():',
      '  top = heap[0]',
      '  heap[0] = heap.pop()   // move last element to root',
      '  siftDown(0)',
      '  return top',
      'siftDown(i):',
      '  target = best(i, leftChild(i), rightChild(i))',
      '  if target != i: swap(heap[i], heap[target]); siftDown(target)',
    ],
    heapify: [
      'buildHeap(arr):',
      '  for i = ⌊n/2⌋ - 1 down to 0:',
      '    siftDown(i)',
      '  // Achieves valid heap property in O(n) linear time',
    ],
  };

  const COMPLEXITY = [
    ['Insert', 'O(log n)'],
    ['Extract Top', 'O(log n)'],
    ['Peek Top', 'O(1)'],
    ['Build Heap', 'O(n)'],
    ['Space', 'O(n)'],
  ];

  function create() {
    const L = ui.createLayout({
      title: 'Binary Heap / Priority Queue',
      description: 'A complete binary tree packed efficiently into an array. Watch parent-child relationships i ↔ (2i+1, 2i+2) in both tree and array form during sift-up and sift-down.',
    });

    let isMin = false;
    let heap = [];
    let size = 11;

    const typeSeg = ui.segmented({
      label: 'Heap property',
      options: [
        { value: 'max', label: 'Max-Heap (Priority Queue)' },
        { value: 'min', label: 'Min-Heap' },
      ],
      value: 'max',
      onChange: (v) => {
        isMin = (v === 'min');
        rebuildHeap();
      },
    });

    const sizeSl = ui.slider({
      label: 'Size',
      min: 3,
      max: 25,
      value: size,
      onInput: (v) => {
        size = v;
        generateRandom();
      },
    });

    const custom = ui.text({
      label: 'Custom array',
      placeholder: 'e.g. 50, 30, 20, 15, 10, 8, 16',
      width: '240px',
      onEnter: applyCustom,
    });

    const valueIn = ui.text({
      label: 'Value',
      type: 'number',
      value: ui.randInt(10, 99),
      onEnter: () => doInsert(),
    });

    L.controls.append(
      typeSeg.root,
      sizeSl.root,
      ui.group(ui.button('Random heap', generateRandom)),
      ui.group(custom.root, ui.button('Heapify array', applyCustom)),
      ui.divider(),
      ui.group(
        valueIn.root,
        ui.button('Insert', doInsert, { variant: 'primary' }),
        ui.button('Extract root', doExtract, { variant: 'danger' }),
        ui.button('Peek', doPeek)
      ),
      ui.divider(),
      ui.group(ui.button('Clear', clearHeap))
    );

    // Stage contains tree visualization and array boxes
    const stageWrap = el('div', { style: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' } });
    const svg = ui.svg('svg', { class: 'tree-svg' });
    const arrayWrap = el('div', { class: 'cells', style: { width: '100%', justifyContent: 'center' } });
    stageWrap.append(svg, arrayWrap);
    L.stage.append(stageWrap);

    L.setLegend([
      [C.compare, 'Comparing parent / child'],
      [C.swap, 'Swapping'],
      [C.insert, 'Newly inserted'],
      [C.remove, 'Extracted / Replaced'],
      [C.found, 'Root / Peak'],
    ]);

    const player = new Player(L.playerBar, { onRender: render, speed: 40 });

    /* ----- Layout Heap as Tree ----- */
    function layoutHeapTree(arr) {
      const n = arr.length;
      if (!n) return { nodes: [], edges: [], width: 400, height: 200 };

      const depth = Math.floor(Math.log2(n));
      const width = Math.max(560, Math.pow(2, depth) * 50);
      const height = (depth + 1) * 65 + 40;

      const nodes = [];
      const edges = [];

      for (let i = 0; i < n; i++) {
        const d = Math.floor(Math.log2(i + 1));
        const numInRow = Math.pow(2, d);
        const posInRow = (i + 1) - numInRow;
        const colWidth = width / numInRow;
        const x = colWidth * posInRow + colWidth / 2;
        const y = d * 62 + 36;

        nodes.push({ id: i, val: arr[i], x, y });

        const p = Math.floor((i - 1) / 2);
        if (i > 0) {
          const pD = Math.floor(Math.log2(p + 1));
          const pNum = Math.pow(2, pD);
          const pPos = (p + 1) - pNum;
          const pCol = width / pNum;
          const pX = pCol * pPos + pCol / 2;
          const pY = pD * 62 + 36;
          edges.push({ x1: pX, y1: pY, x2: x, y2: y, from: p, to: i });
        }
      }

      return { nodes, edges, width, height };
    }

    /* ----- Recorder ----- */
    function recordFrames() {
      const frames = [];
      const snap = (currArr, line, msg, hl = {}, sub = {}, extra = {}) => {
        frames.push({
          arr: currArr.slice(),
          line,
          msg,
          hl,
          sub,
          type: extra.type,
        });
      };
      return { frames, snap };
    }

    function compareBreaking(parentVal, childVal) {
      return isMin ? (childVal < parentVal) : (childVal > parentVal);
    }

    /* ----- Heap operations ----- */
    function doInsert() {
      const { value: val, error } = ui.parseOne(valueIn.value, { name: 'Value' });
      if (error) { ui.toast(error, 'error'); return; }

      if (heap.length >= 25) {
        ui.toast('Maximum heap capacity of 25 elements reached.', 'error');
        return;
      }

      L.setCode('insert(x)', CODE.insert);
      L.setComplexity(COMPLEXITY);

      const { frames, snap } = recordFrames();
      const a = heap.slice();
      a.push(val);
      let curr = a.length - 1;

      snap(a, 1, `Append ${val} at the end of the heap (index ${curr}).`, { [curr]: 'insert' });

      // Sift up
      while (curr > 0) {
        const p = Math.floor((curr - 1) / 2);
        const cond = compareBreaking(a[p], a[curr]);
        snap(a, 4, `Compare child a[${curr}]=${a[curr]} with parent a[${p}]=${a[p]}.`, { [curr]: 'compare', [p]: 'compare' });

        if (cond) {
          snap(a, 6, `${isMin ? `${a[curr]} < ${a[p]}` : `${a[curr]} > ${a[p]}`} violates heap property! Swap them.`, { [curr]: 'swap', [p]: 'swap' });
          const tmp = a[p];
          a[p] = a[curr];
          a[curr] = tmp;
          curr = p;
          snap(a, 7, `Swapped. Now at index ${curr}.`, { [curr]: 'insert' });
        } else {
          snap(a, 5, `Heap property satisfied between parent and child. Stop.`, { [curr]: 'found', [p]: 'found' }, {}, { type: 'success' });
          break;
        }
      }

      snap(a, null, `Inserted ${val} into ${isMin ? 'Min-Heap' : 'Max-Heap'}.`, {}, {}, { type: 'success' });
      heap = a;
      valueIn.set(ui.randInt(10, 99));
      player.load(frames);
    }

    function doExtract() {
      if (!heap.length) {
        ui.toast('Heap is empty — nothing to extract.', 'error');
        return;
      }

      L.setCode('extractTop()', CODE.extract);
      L.setComplexity(COMPLEXITY);

      const { frames, snap } = recordFrames();
      const a = heap.slice();
      const topVal = a[0];

      if (a.length === 1) {
        snap(a, 1, `Extracted sole root element ${topVal}.`, { 0: 'remove' }, {}, { type: 'success' });
        heap = [];
        player.load(frames);
        return;
      }

      snap(a, 1, `Extracting root element ${topVal}.`, { 0: 'remove' });
      const lastVal = a.pop();
      a[0] = lastVal;
      snap(a, 2, `Moved last element ${lastVal} to root position. Now sift down.`, { 0: 'swap' });

      // Sift down
      let i = 0;
      const n = a.length;
      while (true) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let best = i;

        if (left < n && compareBreaking(a[best], a[left])) best = left;
        if (right < n && compareBreaking(a[best], a[right])) best = right;

        if (best !== i) {
          const compIndices = right < n ? [i, left, right] : [i, left];
          const hlComp = {};
          compIndices.forEach(idx => hlComp[idx] = 'compare');
          snap(a, 6, `Compare node ${a[i]} with children (${a[left]}${right < n ? `, ${a[right]}` : ''}) → ${isMin ? 'minimum' : 'maximum'} is ${a[best]}.`, hlComp);

          const tmp = a[i];
          a[i] = a[best];
          a[best] = tmp;

          snap(a, 7, `Swap node with ${isMin ? 'smaller' : 'larger'} child.`, { [i]: 'swap', [best]: 'swap' });
          i = best;
        } else {
          snap(a, 7, `Node ${a[i]} satisfies heap property with its children. Sift-down complete.`, { [i]: 'found' }, {}, { type: 'success' });
          break;
        }
      }

      snap(a, null, `Extracted ${topVal} from the heap.`, {}, {}, { type: 'success' });
      heap = a;
      player.load(frames);
    }

    function doPeek() {
      if (!heap.length) {
        ui.toast('Heap is empty.', 'error');
        return;
      }
      const { frames, snap } = recordFrames();
      snap(heap, 0, `Top of heap (root at index 0) is ${heap[0]}.`, { 0: 'found' }, {}, { type: 'success' });
      player.load(frames, { autoplay: false });
    }

    function heapifyRaw(arr) {
      const a = arr.slice();
      const n = a.length;
      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        let curr = i;
        while (true) {
          const l = 2 * curr + 1, r = 2 * curr + 2;
          let best = curr;
          if (l < n && compareBreaking(a[best], a[l])) best = l;
          if (r < n && compareBreaking(a[best], a[r])) best = r;
          if (best !== curr) {
            const tmp = a[curr];
            a[curr] = a[best];
            a[best] = tmp;
            curr = best;
          } else break;
        }
      }
      return a;
    }

    function rebuildHeap() {
      if (!heap.length) return;
      const { frames, snap } = recordFrames();
      snap(heap, 0, `Switching heap property. Re-building heap via bottom-up heapify.`);
      heap = heapifyRaw(heap);
      snap(heap, 2, `Converted into valid ${isMin ? 'Min-Heap' : 'Max-Heap'}.`, {}, {}, { type: 'success' });
      player.load(frames);
    }

    function generateRandom() {
      const values = ui.uniqueRandom(size, 10, 99);
      heap = heapifyRaw(values);
      showIdle(`Initialized ${isMin ? 'Min-Heap' : 'Max-Heap'} with ${size} elements.`);
    }

    function applyCustom() {
      const { values, error } = ui.parseValues(custom.value, { min: 1, max: 999, maxCount: 25 });
      if (error) { ui.toast(error, 'error'); return; }

      L.setCode('buildHeap(arr)', CODE.heapify);
      L.setComplexity(COMPLEXITY);

      const { frames, snap } = recordFrames();
      const a = values.slice();
      const n = a.length;
      snap(a, 0, `Starting array to heapify with ${n} elements.`);

      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        snap(a, 1, `Sift down from internal node at index ${i} (${a[i]}).`, { [i]: 'compare' });
        let curr = i;
        while (true) {
          const l = 2 * curr + 1, r = 2 * curr + 2;
          let best = curr;
          if (l < n && compareBreaking(a[best], a[l])) best = l;
          if (r < n && compareBreaking(a[best], a[r])) best = r;
          if (best !== curr) {
            snap(a, 2, `Swap parent ${a[curr]} at index ${curr} with ${a[best]} at index ${best}.`, { [curr]: 'swap', [best]: 'swap' });
            const tmp = a[curr];
            a[curr] = a[best];
            a[best] = tmp;
            curr = best;
          } else break;
        }
      }

      snap(a, 3, `Heapify complete in linear O(n) time! Valid heap produced.`, {}, {}, { type: 'success' });
      heap = a;
      sizeSl.set(Math.min(25, Math.max(3, values.length)));
      player.load(frames);
    }

    function clearHeap() {
      heap = [];
      showIdle('Heap cleared.');
    }

    function showIdle(msg) {
      const { frames, snap } = recordFrames();
      snap(heap, null, msg || `${isMin ? 'Min-Heap' : 'Max-Heap'} ready.`);
      player.load(frames, { autoplay: false });
    }

    /* ----- Render frame ----- */
    function render(f) {
      const arr = f.arr;
      if (!arr || !arr.length) {
        svg.replaceChildren();
        arrayWrap.replaceChildren(el('div', { class: 'tree-empty' }, 'Heap is empty'));
      } else {
        // Draw tree view
        const { nodes, edges, width, height } = layoutHeapTree(arr);
        const mappedNodes = nodes.map(n => ({
          id: n.id,
          x: n.x,
          y: n.y,
          label: String(n.val),
          cls: f.hl[n.id] || null,
          sub: `[${n.id}]`,
        }));
        const mappedEdges = edges.map(e => ({
          x1: e.x1,
          y1: e.y1,
          x2: e.x2,
          y2: e.y2,
          cls: (f.hl[e.from] && f.hl[e.to]) ? 'hot' : '',
        }));
        ui.drawTree(svg, { nodes: mappedNodes, edges: mappedEdges, width, height, r: 18 });

        // Draw array representation
        const cellNodes = arr.map((val, idx) => {
          const h = f.hl[idx];
          return el('div', { class: 'cell' },
            el('div', { class: 'ptr' }, idx === 0 ? 'root' : `p=${Math.floor((idx-1)/2)}`),
            el('div', { class: 'box' + (h ? ' s-' + h : '') }, val),
            el('div', { class: 'idx' }, `[${idx}]`)
          );
        });
        arrayWrap.classList.toggle('small', arr.length > 15);
        arrayWrap.replaceChildren(...cellNodes);
      }

      L.applyFrame(f);
      L.setStats({
        'Size': arr.length,
        'Type': isMin ? 'Min-Heap' : 'Max-Heap',
        'Top / Root': arr.length ? arr[0] : '—',
        'Tree Height': arr.length ? Math.floor(Math.log2(arr.length)) + 1 : 0,
      });
    }

    L.setCode('insert(x)', CODE.insert);
    L.setComplexity(COMPLEXITY);
    generateRandom();

    return { root: L.root, player };
  }

  DSA.modules.push({
    id: 'heap',
    title: 'Binary Heap',
    group: 'Trees & Heaps',
    blurb: 'Max & Min priority queues with dual synchronized Tree and Array views, sift-up, and O(n) heapify.',
    icon: '<polygon points="12,2 22,19 2,19"/><circle cx="12" cy="13" r="2.5"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    create,
  });
})();
