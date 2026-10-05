/* ==========================================================================
   AlgoScope — Singly linked list
   ========================================================================== */
(function () {
  'use strict';

  const { ui, Player } = DSA;
  const { el, C } = ui;

  const MAX_NODES = 16;

  const CODE = {
    insertHead: ['node = new Node(x)', 'node.next = head', 'head = node'],
    insertTail: [
      'node = new Node(x)',
      'if head == null: head = node; return',
      'curr = head',
      'while curr.next != null: curr = curr.next',
      'curr.next = node',
    ],
    insertAt: [
      'if i == 0: insertHead(x); return',
      'curr = head',
      'repeat i - 1 times: curr = curr.next',
      'node = new Node(x)',
      'node.next = curr.next',
      'curr.next = node',
    ],
    deleteValue: [
      'if head == null: return',
      'if head.val == x: head = head.next; return',
      'prev = head; curr = head.next',
      'while curr != null and curr.val != x:',
      '  prev = curr; curr = curr.next',
      'if curr != null: prev.next = curr.next',
    ],
    search: ['curr = head; i = 0', 'while curr != null:', '  if curr.val == x: return i', '  curr = curr.next; i = i + 1', 'return -1'],
    reverse: [
      'prev = null; curr = head',
      'while curr != null:',
      '  next = curr.next',
      '  curr.next = prev      // flip the pointer',
      '  prev = curr; curr = next',
      'head = prev',
    ],
  };

  function create() {
    const L = ui.createLayout({
      title: 'Singly Linked List',
      description: 'Nodes connected by next pointers. Insert at the head, tail or any index, delete or search by value, and watch the classic three-pointer in-place reversal.',
    });

    let nodes = [];
    let nid = 1;
    let size = 5;
    const mk = (val) => ({ id: nid++, val });

    const sizeSl = ui.slider({ label: 'Initial length', min: 0, max: 12, value: size, onInput: (v) => { size = v; randomList(); } });
    const custom = ui.text({ label: 'Custom values', placeholder: 'e.g. 4 8 15 16 23', width: '190px', onEnter: applyCustom });
    const valueIn = ui.text({ label: 'Value', type: 'number', value: ui.randInt(1, 99) });
    const indexIn = ui.text({ label: 'Index', type: 'number', value: 0 });
    indexIn.input.style.width = '70px';

    L.controls.append(
      sizeSl.root,
      ui.group(ui.button('Random list', randomList)),
      ui.group(custom.root, ui.button('Build', applyCustom)),
      ui.divider(),
      ui.group(valueIn.root,
        ui.button('Insert head', () => op('insertHead'), { variant: 'primary' }),
        ui.button('Insert tail', () => op('insertTail'))),
      ui.group(indexIn.root, ui.button('Insert at index', () => op('insertAt'))),
      ui.divider(),
      ui.group(
        ui.button('Delete value', () => op('deleteValue'), { variant: 'danger' }),
        ui.button('Search', () => op('search')),
        ui.button('Reverse', () => op('reverse'), { variant: 'success' }))
    );

    L.setComplexity([['Access by index', 'O(n)'], ['Search', 'O(n)'], ['Insert at head', 'O(1)'], ['Insert at tail*', 'O(n)'], ['Delete by value', 'O(n)'], ['Reverse', 'O(n)'], ['* O(1) with a tail pointer', '']]);
    L.setLegend([[C.active, 'Current pointer'], [C.compare, 'Comparing'], [C.visited, 'Visited'], [C.insert, 'New node'], [C.remove, 'Removed / found'], [C.swap, 'Pointer flipped']]);

    const stageInner = el('div', { class: 'll' });
    L.stage.append(stageInner);
    const player = new Player(L.playerBar, { onRender: render, speed: 30 });

    /* ----- frames ----- */
    function recorder() {
      const frames = [];
      /** extra: {next: int[], head: int, type} */
      const snap = (line, msg, hl = {}, labels = {}, extra = {}) =>
        frames.push({ nodes: nodes.slice(), line, msg, hl, labels, next: extra.next, head: extra.head, type: extra.type });
      return { frames, snap };
    }
    const defaultNext = (n) => Array.from({ length: n }, (_, i) => (i < n - 1 ? i + 1 : -1));

    function readValue() {
      const { value, error } = ui.parseOne(valueIn.value, { name: 'Value' });
      if (error) { fail(error); return null; }
      return value;
    }
    function fail(msg) { ui.toast(msg, 'error'); L.setMessage(msg, 'error'); }

    function op(name) {
      L.setCode(name + '(' + (name === 'insertAt' ? 'i, x' : name === 'reverse' ? '' : 'x') + ')', CODE[name]);
      let frames;
      if (name === 'insertHead' || name === 'insertTail' || name === 'insertAt') {
        if (nodes.length >= MAX_NODES) return fail(`The visualizer holds at most ${MAX_NODES} nodes.`);
        const x = readValue();
        if (x == null) return;
        if (name === 'insertHead') frames = insertHead(x);
        else if (name === 'insertTail') frames = insertTail(x);
        else {
          const { value: i, error } = ui.parseOne(indexIn.value, { min: 0, max: nodes.length, name: 'Index' });
          if (error) return fail(error + ` (list length is ${nodes.length})`);
          frames = insertAt(i, x);
        }
        valueIn.set(ui.randInt(1, 99));
      } else if (name === 'deleteValue' || name === 'search') {
        const x = readValue();
        if (x == null) return;
        frames = name === 'search' ? search(x) : deleteValue(x);
      } else frames = reverse();
      player.load(frames);
    }

    function insertHead(x, lineOffset = 0) {
      const { frames, snap } = recorder();
      const node = mk(x);
      const hadHead = nodes.length > 0;
      nodes.unshift(node);
      snap([0, 1].map((l) => l + lineOffset), `Create node ${x} and point its next to the current head${hadHead ? ` (${nodes[1].val})` : ' (null)'}.`,
        { [node.id]: 'insert' }, { [node.id]: ['node'] }, { head: hadHead ? 1 : -1 });
      snap(2 + lineOffset, `head = node. ${x} is the new head.`, { [node.id]: 'insert' }, {}, { head: 0, type: 'success' });
      return frames;
    }

    function insertTail(x) {
      const { frames, snap } = recorder();
      const node = mk(x);
      snap(0, `Create node ${x}.`);
      if (!nodes.length) {
        nodes.push(node);
        snap(1, `List was empty → head = node ${x}.`, { [node.id]: 'insert' }, {}, { type: 'success' });
        return frames;
      }
      const seen = {};
      for (let i = 0; i < nodes.length; i++) {
        const cur = nodes[i];
        const hasNext = i < nodes.length - 1;
        snap(i === 0 ? 2 : 3, i === 0 ? `curr = head (${cur.val}).` : `curr = curr.next (${cur.val}).${hasNext ? '' : ' Its next is null — stop.'}`,
          { ...seen, [cur.id]: 'active' }, { [cur.id]: ['curr'] });
        seen[cur.id] = 'visited';
      }
      const last = nodes[nodes.length - 1];
      nodes.push(node);
      snap(4, `curr.next = node → ${x} is appended after ${last.val}.`, { [last.id]: 'active', [node.id]: 'insert' }, { [last.id]: ['curr'], [node.id]: ['node'] }, { type: 'success' });
      return frames;
    }

    function insertAt(i, x) {
      if (i === 0) {
        const { frames, snap } = recorder();
        snap(0, 'i == 0 → this is just an insert at the head.');
        return frames.concat(insertHead(x).map((f) => ({ ...f, line: 0 })));
      }
      const { frames, snap } = recorder();
      const seen = {};
      for (let k = 0; k < i; k++) {
        const cur = nodes[k];
        snap(k === 0 ? 1 : 2, k === 0 ? `curr = head (${cur.val}).` : `Step ${k}: curr = curr.next (${cur.val}).`, { ...seen, [cur.id]: 'active' }, { [cur.id]: ['curr'] });
        seen[cur.id] = 'visited';
      }
      const curr = nodes[i - 1];
      const node = mk(x);
      nodes.splice(i, 0, node);
      const next = defaultNext(nodes.length);
      next[i - 1] = i < nodes.length - 1 ? i + 1 : -1; // curr still points past the new node
      snap([3, 4], `Create node ${x}; node.next = curr.next (${i + 1 < nodes.length ? nodes[i + 1].val : 'null'}).`,
        { [curr.id]: 'active', [node.id]: 'insert' }, { [curr.id]: ['curr'], [node.id]: ['node'] }, { next });
      snap(5, `curr.next = node. ${x} now sits at index ${i}.`, { [curr.id]: 'active', [node.id]: 'insert' }, { [curr.id]: ['curr'], [node.id]: ['node'] }, { type: 'success' });
      return frames;
    }

    function deleteValue(x) {
      const { frames, snap } = recorder();
      if (!nodes.length) { snap(0, 'The list is empty — nothing to delete.', {}, {}, { type: 'error' }); return frames; }
      const h = nodes[0];
      snap(1, `Does head (${h.val}) hold ${x}?`, { [h.id]: 'compare' });
      if (h.val === x) {
        snap(1, `Yes → head = head.next.`, { [h.id]: 'remove' }, {}, { head: nodes.length > 1 ? 1 : -1 });
        nodes.shift();
        snap(1, `Deleted ${x} from the head.`, {}, {}, { type: 'success' });
        return frames;
      }
      const seen = { [h.id]: 'visited' };
      let p = 0, c = 1;
      if (c < nodes.length) snap(2, `prev = head (${h.val}); curr = head.next (${nodes[c].val}).`, { ...seen }, { [h.id]: ['prev'], [nodes[c].id]: ['curr'] });
      while (c < nodes.length) {
        const cur = nodes[c], prv = nodes[p];
        snap(3, `Does curr (${cur.val}) hold ${x}?`, { ...seen, [cur.id]: 'compare' }, { [prv.id]: ['prev'], [cur.id]: ['curr'] });
        if (cur.val === x) {
          const next = defaultNext(nodes.length);
          next[p] = c + 1 < nodes.length ? c + 1 : -1;
          snap(5, `Found ${x}! prev.next = curr.next — bypass the node.`, { ...seen, [cur.id]: 'remove' }, { [prv.id]: ['prev'], [cur.id]: ['curr'] }, { next });
          nodes.splice(c, 1);
          snap(5, `Deleted ${x}.`, {}, {}, { type: 'success' });
          return frames;
        }
        seen[cur.id] = 'visited';
        p = c; c++;
        if (c < nodes.length) snap(4, `prev = curr (${nodes[p].val}); curr = curr.next (${nodes[c].val}).`, { ...seen }, { [nodes[p].id]: ['prev'], [nodes[c].id]: ['curr'] });
      }
      snap(5, `curr is null — ${x} was not found. Nothing deleted.`, seen, {}, { type: 'error' });
      return frames;
    }

    function search(x) {
      const { frames, snap } = recorder();
      if (!nodes.length) { snap(4, 'The list is empty — return -1.', {}, {}, { type: 'error' }); return frames; }
      snap(0, `curr = head; i = 0.`, { [nodes[0].id]: 'active' }, { [nodes[0].id]: ['curr'] });
      const seen = {};
      for (let i = 0; i < nodes.length; i++) {
        const cur = nodes[i];
        if (cur.val === x) {
          snap(2, `curr.val == ${x} → found at index ${i}!`, { ...seen, [cur.id]: 'found' }, { [cur.id]: ['curr', 'i=' + i] }, { type: 'success' });
          return frames;
        }
        snap(2, `curr.val (${cur.val}) ≠ ${x}.`, { ...seen, [cur.id]: 'compare' }, { [cur.id]: ['curr', 'i=' + i] });
        seen[cur.id] = 'visited';
        if (i + 1 < nodes.length) snap(3, `curr = curr.next; i = ${i + 1}.`, { ...seen, [nodes[i + 1].id]: 'active' }, { [nodes[i + 1].id]: ['curr', 'i=' + (i + 1)] });
      }
      snap(4, `curr is null — ${x} is not in the list. Return -1.`, seen, {}, { type: 'error' });
      return frames;
    }

    function reverse() {
      const { frames, snap } = recorder();
      const n = nodes.length;
      if (n < 2) { snap(null, n ? 'A single node is already its own reverse.' : 'The list is empty.', {}, {}, { type: 'success' }); return frames; }
      const next = defaultNext(n);
      const id = (i) => nodes[i].id;
      const lab = (prev, curr, nx) => {
        const o = {};
        const add = (i, name) => { if (i >= 0) (o[id(i)] = o[id(i)] || []).push(name); };
        add(prev, 'prev'); add(curr, 'curr'); add(nx, 'next');
        return o;
      };
      let prev = -1, curr = 0;
      snap(0, 'prev = null; curr = head.', { [id(0)]: 'active' }, lab(prev, curr, -1), { next: next.slice(), head: 0 });
      while (curr !== -1) {
        const nx = next[curr];
        snap(2, `next = curr.next (${nx >= 0 ? nodes[nx].val : 'null'}) — remember the rest of the list.`, { [id(curr)]: 'active' }, lab(prev, curr, nx), { next: next.slice(), head: 0 });
        next[curr] = prev;
        snap(3, `curr.next = prev (${prev >= 0 ? nodes[prev].val : 'null'}) — flip ${nodes[curr].val}'s pointer.`, { [id(curr)]: 'swap' }, lab(prev, curr, nx), { next: next.slice(), head: 0 });
        prev = curr;
        curr = nx;
        snap(4, `Advance: prev = ${nodes[prev].val}, curr = ${curr >= 0 ? nodes[curr].val : 'null'}.`, curr >= 0 ? { [id(curr)]: 'active' } : {}, lab(prev, curr, -1), { next: next.slice(), head: 0 });
      }
      snap(5, `curr is null. head = prev (${nodes[prev].val}).`, { [id(prev)]: 'insert' }, {}, { next: next.slice(), head: prev });
      nodes.reverse();
      snap(null, 'List reversed!', {}, {}, { type: 'success' });
      return frames;
    }

    /* ----- data setup ----- */
    function showIdle(msg) {
      const { frames, snap } = recorder();
      snap(null, msg || 'Pick an operation. Values are read from the Value box, positions from the Index box.');
      player.load(frames, { autoplay: false });
    }
    function randomList() {
      nodes = Array.from({ length: size }, () => mk(ui.randInt(1, 99)));
      showIdle(`Built a random list of ${size} node${size === 1 ? '' : 's'}.`);
    }
    function applyCustom() {
      const { values, error } = ui.parseValues(custom.value, { maxCount: MAX_NODES });
      if (error) return fail(error);
      nodes = values.map(mk);
      sizeSl.set(Math.min(12, values.length));
      showIdle(`Built a list from ${values.length} custom value${values.length === 1 ? '' : 's'}.`);
    }

    /* ----- rendering ----- */
    const arrow = (dir) => el('div', { class: 'll-arrow ' + dir });
    const nullBox = () => el('div', { class: 'll-null' }, 'null');

    function render(f) {
      const n = f.nodes.length;
      const next = f.next || defaultNext(n);
      const head = f.head ?? (n ? 0 : -1);
      const items = [];
      if (n === 0 || head === -1) items.push(el('div', { class: 'll-item' }, el('span', { class: 'll-headptr' }, 'head'), arrow('r'), nullBox()));
      if (n === 0) {
        stageInner.replaceChildren(...items);
        return finish(f);
      }
      if (n > 1 && next[0] === -1) items.push(el('div', { class: 'll-item' }, nullBox(), arrow('l')));
      for (let i = 0; i < n; i++) {
        const nd = f.nodes[i];
        const tags = [];
        if (i === head) tags.push(el('span', { class: 'head' }, 'head'));
        for (const t of f.labels[nd.id] || []) tags.push(el('span', null, t));
        const h = f.hl[nd.id];
        const box = el('div', { class: 'll-node' + (h ? ' s-' + h : '') },
          tags.length ? el('div', { class: 'll-tags' }, tags) : null,
          el('div', { class: 'val' }, nd.val),
          el('div', { class: 'nxt' }));
        const item = el('div', { class: 'll-item' }, box);
        if (i < n - 1) item.append(arrow(next[i] === i + 1 ? 'r' : next[i + 1] === i ? 'l' : 'x'));
        else if (next[i] === -1) item.append(arrow('r'), nullBox());
        items.push(item);
      }
      stageInner.replaceChildren(...items);
      finish(f);
    }
    function finish(f) {
      const n = f.nodes.length;
      L.applyFrame(f);
      L.setStats({ Length: n, Head: n ? f.nodes[0].val : 'null', Tail: n ? f.nodes[n - 1].val : 'null', 'Max nodes': MAX_NODES });
    }

    L.setCode('insertHead(x)', CODE.insertHead);
    randomList();

    return { root: L.root, player, _test: { op, get nodes() { return nodes; }, setValue: (v) => valueIn.set(v), setIndex: (v) => indexIn.set(v) } };
  }

  DSA.modules.push({
    id: 'linked-list',
    title: 'Linked List',
    group: 'Linear Structures',
    blurb: 'Insert, delete, search and reverse a singly linked list with labelled head / prev / curr pointers.',
    icon: '<rect x="2" y="9" width="6" height="6" rx="1.5"/><rect x="16" y="9" width="6" height="6" rx="1.5"/><path d="M8 12h7"/><path d="M13 9.5l2.5 2.5-2.5 2.5"/>',
    create,
  });
})();
