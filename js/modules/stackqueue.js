/* ==========================================================================
   AlgoScope — Stack & Queue (fixed-capacity, array-backed)
   ========================================================================== */
(function () {
  'use strict';

  const { ui, Player } = DSA;
  const { el, C } = ui;

  const CODE = {
    stack: [
      'push(x):',
      '  if top == capacity - 1: error "overflow"',
      '  top = top + 1; a[top] = x',
      'pop():',
      '  if top == -1: error "underflow"',
      '  x = a[top]',
      '  top = top - 1; return x',
      'peek():',
      '  return a[top]',
    ],
    queue: [
      'enqueue(x):',
      '  if size == capacity: error "overflow"',
      '  rear = (rear + 1) % capacity',
      '  a[rear] = x; size = size + 1',
      'dequeue():',
      '  if size == 0: error "underflow"',
      '  x = a[front]',
      '  front = (front + 1) % capacity; size--',
      'peek():',
      '  return a[front]',
    ],
  };

  const COMPLEXITY = {
    stack: [['push', 'O(1)'], ['pop', 'O(1)'], ['peek', 'O(1)'], ['Space', 'O(capacity)'], ['Order', 'LIFO']],
    queue: [['enqueue', 'O(1)'], ['dequeue', 'O(1)'], ['peek', 'O(1)'], ['Space', 'O(capacity)'], ['Order', 'FIFO']],
  };

  function create() {
    const L = ui.createLayout({
      title: 'Stack & Queue',
      description: 'Array-backed stack (LIFO) and circular queue (FIFO) with a fixed capacity you choose. Push past the capacity to see an overflow, pop an empty structure to see an underflow.',
    });

    let mode = 'stack';
    let cap = 8;
    let stack = [];
    let q = { buf: new Array(cap).fill(null), front: 0, rear: cap - 1, size: 0 };

    const modeSeg = ui.segmented({
      label: 'Structure',
      options: [{ value: 'stack', label: 'Stack' }, { value: 'queue', label: 'Circular Queue' }],
      value: mode,
      onChange: (v) => { mode = v; applyMode(); showIdle(); },
    });
    const capSl = ui.slider({ label: 'Capacity', min: 3, max: 12, value: cap, onInput: (v) => resize(v) });
    const valueIn = ui.text({ label: 'Value', type: 'number', value: ui.randInt(1, 99), onEnter: () => doAdd() });
    const btnAdd = ui.button('Push', () => doAdd(), { variant: 'primary' });
    const btnRemove = ui.button('Pop', () => doRemove());
    const btnPeek = ui.button('Peek', () => doPeek());

    L.controls.append(
      modeSeg.root, capSl.root,
      ui.divider(),
      ui.group(valueIn.root, btnAdd, btnRemove, btnPeek),
      ui.divider(),
      ui.group(ui.button('Fill randomly', fillRandom), ui.button('Clear', clearAll, { variant: 'danger' }))
    );

    const player = new Player(L.playerBar, { onRender: render, speed: 30 });
    L.setLegend([[C.insert, 'Inserted'], [C.remove, 'Removed'], [C.found, 'Peeked'], [C.active, 'Pointer moved']]);

    /* ----- frame recording ----- */
    function recorder() {
      const frames = [];
      const snap = (line, msg, hl = {}, type) => frames.push({
        mode, cap, line, msg, hl, type,
        stack: stack.slice(),
        buf: q.buf.slice(), front: q.front, rear: q.rear, size: q.size,
      });
      return { frames, snap };
    }

    /* ----- operations ----- */
    function readValue() {
      const { value, error } = ui.parseOne(valueIn.value, { name: 'Value' });
      if (error) { ui.toast(error, 'error'); L.setMessage(error, 'error'); return null; }
      return value;
    }

    function doAdd() {
      const x = readValue();
      if (x == null) return;
      const { frames, snap } = recorder();
      if (mode === 'stack') {
        snap(1, `Overflow check: top (${stack.length - 1}) == capacity − 1 (${cap - 1})?`);
        if (stack.length >= cap) snap(1, `Stack overflow! All ${cap} slots are full — cannot push ${x}.`, {}, 'error');
        else {
          stack.push(x);
          snap(2, `top = ${stack.length - 1}; a[${stack.length - 1}] = ${x}. Pushed ${x}.`, { [stack.length - 1]: 'insert' }, 'success');
        }
      } else {
        snap(1, `Overflow check: size (${q.size}) == capacity (${cap})?`);
        if (q.size >= cap) snap(1, `Queue overflow! All ${cap} slots are full — cannot enqueue ${x}.`, {}, 'error');
        else {
          const old = q.rear;
          q.rear = (q.rear + 1) % cap;
          snap(2, `rear = (${old} + 1) % ${cap} = ${q.rear}${q.rear < old ? ' — wrapped around!' : ''}.`, { [q.rear]: 'active' });
          q.buf[q.rear] = x;
          q.size++;
          snap(3, `a[${q.rear}] = ${x}; size = ${q.size}. Enqueued ${x}.`, { [q.rear]: 'insert' }, 'success');
        }
      }
      valueIn.set(ui.randInt(1, 99));
      player.load(frames);
    }

    function doRemove() {
      const { frames, snap } = recorder();
      if (mode === 'stack') {
        snap(4, `Underflow check: top (${stack.length - 1}) == −1?`);
        if (!stack.length) snap(4, 'Stack underflow! The stack is empty — nothing to pop.', {}, 'error');
        else {
          const t = stack.length - 1, v = stack[t];
          snap(5, `x = a[top] = ${v}.`, { [t]: 'remove' });
          stack.pop();
          snap(6, `top = ${t - 1}. Popped ${v}.`, {}, 'success');
        }
      } else {
        snap(5, `Underflow check: size (${q.size}) == 0?`);
        if (!q.size) snap(5, 'Queue underflow! The queue is empty — nothing to dequeue.', {}, 'error');
        else {
          const f = q.front, v = q.buf[f];
          snap(6, `x = a[front] = a[${f}] = ${v}.`, { [f]: 'remove' });
          q.buf[f] = null;
          q.front = (f + 1) % cap;
          q.size--;
          snap(7, `front = (${f} + 1) % ${cap} = ${q.front}${q.front < f ? ' — wrapped around!' : ''}; size = ${q.size}. Dequeued ${v}.`, {}, 'success');
        }
      }
      player.load(frames);
    }

    function doPeek() {
      const { frames, snap } = recorder();
      if (mode === 'stack') {
        if (!stack.length) snap(8, 'The stack is empty — nothing to peek at.', {}, 'error');
        else snap(8, `Top element is ${stack[stack.length - 1]} (index ${stack.length - 1}).`, { [stack.length - 1]: 'found' }, 'success');
      } else {
        if (!q.size) snap(9, 'The queue is empty — nothing to peek at.', {}, 'error');
        else snap(9, `Front element is a[${q.front}] = ${q.buf[q.front]}.`, { [q.front]: 'found' }, 'success');
      }
      player.load(frames, { autoplay: false });
    }

    function queueItems() {
      const out = [];
      for (let k = 0; k < q.size; k++) out.push(q.buf[(q.front + k) % cap]);
      return out;
    }

    function resize(newCap) {
      const items = mode === 'queue' || q.size ? queueItems() : [];
      const lostS = Math.max(0, stack.length - newCap);
      const lostQ = Math.max(0, items.length - newCap);
      cap = newCap;
      stack = stack.slice(0, cap);
      const kept = items.slice(0, cap);
      q = { buf: new Array(cap).fill(null), front: 0, rear: (kept.length - 1 + cap) % cap, size: kept.length };
      kept.forEach((v, i) => { q.buf[i] = v; });
      if ((mode === 'stack' && lostS) || (mode === 'queue' && lostQ)) ui.toast(`Capacity reduced — ${mode === 'stack' ? lostS : lostQ} element(s) dropped.`);
      showIdle(`Capacity set to ${cap}.`);
    }

    function fillRandom() {
      if (mode === 'stack') stack = Array.from({ length: cap }, () => ui.randInt(1, 99));
      else {
        const n = cap;
        q = { buf: Array.from({ length: cap }, () => ui.randInt(1, 99)), front: 0, rear: n - 1, size: n };
      }
      showIdle(`Filled the ${mode} with ${cap} random values.`);
    }

    function clearAll() {
      if (mode === 'stack') stack = [];
      else q = { buf: new Array(cap).fill(null), front: 0, rear: cap - 1, size: 0 };
      showIdle(`The ${mode} is now empty.`);
    }

    function showIdle(msg) {
      const { frames, snap } = recorder();
      snap(null, msg || (mode === 'stack' ? 'Push values onto the stack or pop them off the top.' : 'Enqueue at the rear, dequeue from the front. Watch the indices wrap around.'));
      player.load(frames, { autoplay: false });
    }

    function applyMode() {
      const s = mode === 'stack';
      btnAdd.textContent = s ? 'Push' : 'Enqueue';
      btnRemove.textContent = s ? 'Pop' : 'Dequeue';
      btnPeek.textContent = s ? 'Peek' : 'Peek front';
      L.setCode(s ? 'Stack' : 'Circular Queue', CODE[mode]);
      L.setComplexity(COMPLEXITY[mode]);
    }

    /* ----- rendering ----- */
    function render(f) {
      if (f.mode === 'stack') renderStack(f);
      else renderQueue(f);
      L.applyFrame(f);
    }

    function renderStack(f) {
      const top = f.stack.length - 1;
      const col = el('div', { class: 'stack' });
      for (let i = 0; i < f.cap; i++) {
        const filled = i < f.stack.length;
        const h = f.hl[i];
        col.append(el('div', { class: 'slot-row' },
          el('span', { class: 'slot-idx' }, i),
          el('div', { class: 'slot' + (filled ? ' filled' : '') + (h ? ' s-' + h : '') }, filled ? f.stack[i] : ''),
          el('span', { class: 'slot-ptr' }, i === top ? '← top' : '')));
      }
      L.stage.replaceChildren(el('div', { class: 'sq-wrap' }, col,
        el('div', { class: 'sq-caption' }, 'top = ', el('b', null, top), `   ·   ${f.stack.length} / ${f.cap} used`)));
      L.setStats({ Size: f.stack.length, Capacity: f.cap, 'top index': top, 'Top value': top >= 0 ? f.stack[top] : '—' });
    }

    function renderQueue(f) {
      const row = el('div', { class: 'queue' });
      for (let i = 0; i < f.cap; i++) {
        const v = f.buf[i];
        const h = f.hl[i];
        const ptrs = [];
        if (i === f.front) ptrs.push(el('div', { class: 'f' }, 'front'));
        if (i === f.rear) ptrs.push(el('div', { class: 'r' }, 'rear'));
        row.append(el('div', { class: 'q-col' },
          el('div', { class: 'slot' + (v != null ? ' filled' : '') + (h ? ' s-' + h : '') }, v != null ? v : ''),
          el('span', { class: 'slot-idx', style: { width: 'auto' } }, i),
          el('div', { class: 'ptrs' }, ptrs)));
      }
      const order = [];
      for (let k = 0; k < f.size; k++) order.push(f.buf[(f.front + k) % f.cap]);
      L.stage.replaceChildren(el('div', { class: 'sq-wrap' }, row,
        el('div', { class: 'sq-caption' }, 'Logical order (front → rear): ', el('b', null, order.length ? order.join(' → ') : 'empty'))));
      L.setStats({ Size: f.size, Capacity: f.cap, 'front index': f.front, 'rear index': f.rear });
    }

    applyMode();
    showIdle();

    return { root: L.root, player };
  }

  DSA.modules.push({
    id: 'stack-queue',
    title: 'Stack & Queue',
    group: 'Linear Structures',
    blurb: 'Fixed-capacity stack and circular queue. Watch top / front / rear pointers move and wrap around.',
    icon: '<rect x="5" y="3.5" width="14" height="4.5" rx="1.2"/><rect x="5" y="10" width="14" height="4.5" rx="1.2"/><rect x="5" y="16.5" width="14" height="4.5" rx="1.2"/>',
    create,
  });
})();
