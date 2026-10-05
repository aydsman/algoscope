/* ==========================================================================
   AlgoScope — Binary Search Tree (BST)
   ========================================================================== */
(function () {
  'use strict';

  const { ui, Player } = DSA;
  const { el, C } = ui;

  const CODE = {
    insert: [
      'insert(root, val):',
      '  if root is null: return new Node(val)',
      '  if val < root.val:',
      '    root.left = insert(root.left, val)',
      '  else if val > root.val:',
      '    root.right = insert(root.right, val)',
      '  return root',
    ],
    search: [
      'search(root, val):',
      '  if root is null or root.val == val:',
      '    return root',
      '  if val < root.val:',
      '    return search(root.left, val)',
      '  else:',
      '    return search(root.right, val)',
    ],
    delete: [
      'delete(root, val):',
      '  if root is null: return null',
      '  if val < root.val: root.left = delete(root.left, val)',
      '  else if val > root.val: root.right = delete(root.right, val)',
      '  else:',
      '    if no left: return root.right',
      '    if no right: return root.left',
      '    succ = findMin(root.right); root.val = succ.val',
      '    root.right = delete(root.right, succ.val)',
      '  return root',
    ],
    inorder: [
      'inorder(root):',
      '  if root is null: return',
      '  inorder(root.left)',
      '  visit(root.val)      // gives sorted order',
      '  inorder(root.right)',
    ],
    preorder: [
      'preorder(root):',
      '  if root is null: return',
      '  visit(root.val)      // root first',
      '  preorder(root.left)',
      '  preorder(root.right)',
    ],
    postorder: [
      'postorder(root):',
      '  if root is null: return',
      '  postorder(root.left)',
      '  postorder(root.right)',
      '  visit(root.val)      // leaves first',
    ],
    levelorder: [
      'levelorder(root):',
      '  queue = [root]',
      '  while queue is not empty:',
      '    curr = queue.dequeue()',
      '    visit(curr.val)',
      '    if curr.left: queue.enqueue(curr.left)',
      '    if curr.right: queue.enqueue(curr.right)',
    ],
  };

  const COMPLEXITY = {
    insert: [['Average', 'O(log n)'], ['Worst', 'O(n)'], ['Space', 'O(h) stack']],
    search: [['Average', 'O(log n)'], ['Worst', 'O(n)'], ['Space', 'O(h) stack']],
    delete: [['Average', 'O(log n)'], ['Worst', 'O(n)'], ['Space', 'O(h) stack']],
    inorder: [['Time', 'O(n)'], ['Space', 'O(h)'], ['Order', 'Sorted (L-N-R)']],
    preorder: [['Time', 'O(n)'], ['Space', 'O(h)'], ['Order', 'Root first (N-L-R)']],
    postorder: [['Time', 'O(n)'], ['Space', 'O(h)'], ['Order', 'Bottom up (L-R-N)']],
    levelorder: [['Time', 'O(n)'], ['Space', 'O(w) queue'], ['Order', 'Breadth-first']],
  };

  /* ----- Node model ----- */
  let nextId = 1;
  function Node(val) {
    return { id: nextId++, val, left: null, right: null };
  }

  function cloneTree(n) {
    if (!n) return null;
    return { id: n.id, val: n.val, left: cloneTree(n.left), right: cloneTree(n.right) };
  }

  function treeSize(n) {
    if (!n) return 0;
    return 1 + treeSize(n.left) + treeSize(n.right);
  }

  function treeHeight(n) {
    if (!n) return 0;
    return 1 + Math.max(treeHeight(n.left), treeHeight(n.right));
  }

  /* ----- Layout calculation for SVG ----- */
  function layoutTree(root) {
    if (!root) return { nodes: [], edges: [], width: 400, height: 260 };
    const nodes = [];
    const edges = [];
    let curX = 0;
    const colStep = 46;
    const rowStep = 62;

    // In-order traversal assigns x coordinates naturally to avoid edge crossings
    function assignPositions(node, depth) {
      if (!node) return;
      assignPositions(node.left, depth + 1);
      node._x = (curX += colStep);
      node._y = depth * rowStep + 36;
      assignPositions(node.right, depth + 1);
    }
    assignPositions(root, 0);

    const minX = 30;
    const shift = minX - (root ? root._x - (curX / 2) : 0);

    function collect(node) {
      if (!node) return;
      nodes.push({ id: node.id, val: node.val, x: node._x, y: node._y });
      if (node.left) {
        edges.push({ x1: node._x, y1: node._y, x2: node.left._x, y2: node.left._y, from: node.id, to: node.left.id });
        collect(node.left);
      }
      if (node.right) {
        edges.push({ x1: node._x, y1: node._y, x2: node.right._x, y2: node.right._y, from: node.id, to: node.right.id });
        collect(node.right);
      }
    }
    collect(root);

    // Normalize coordinates so min x is at 40
    let minObservedX = Infinity, maxObservedX = -Infinity, maxObservedY = 0;
    for (const n of nodes) {
      if (n.x < minObservedX) minObservedX = n.x;
      if (n.x > maxObservedX) maxObservedX = n.x;
      if (n.y > maxObservedY) maxObservedY = n.y;
    }
    const offset = 46 - minObservedX;
    for (const n of nodes) n.x += offset;
    for (const e of edges) { e.x1 += offset; e.x2 += offset; }

    const width = Math.max(520, maxObservedX + offset + 46);
    const height = Math.max(280, maxObservedY + 50);

    return { nodes, edges, width, height };
  }

  function create() {
    const L = ui.createLayout({
      title: 'Binary Search Tree (BST)',
      description: 'Explore hierarchical binary search trees with recursive operations. Insert custom values, search for targets, delete with in-order successor replacement, and step through all four traversal orders.',
    });

    let root = null;
    let size = 9;

    const sizeSl = ui.slider({
      label: 'Node count',
      min: 3,
      max: 20,
      value: size,
      onInput: (v) => { size = v; generateRandom(); },
    });

    const custom = ui.text({
      label: 'Custom tree values',
      placeholder: 'e.g. 50, 25, 75, 12, 37, 60, 90',
      width: '260px',
      onEnter: applyCustom,
    });

    const valueIn = ui.text({
      label: 'Value',
      type: 'number',
      value: ui.randInt(10, 99),
      onEnter: () => doInsert(),
    });

    const travSel = ui.select({
      label: 'Traversal',
      options: [
        { value: 'inorder', label: 'In-order (Sorted)' },
        { value: 'preorder', label: 'Pre-order' },
        { value: 'postorder', label: 'Post-order' },
        { value: 'levelorder', label: 'Level-order (BFS)' },
      ],
      value: 'inorder',
    });

    L.controls.append(
      sizeSl.root,
      ui.group(ui.button('Random BST', generateRandom)),
      ui.group(custom.root, ui.button('Build tree', applyCustom)),
      ui.divider(),
      ui.group(
        valueIn.root,
        ui.button('Insert', doInsert, { variant: 'primary' }),
        ui.button('Search', doSearch),
        ui.button('Delete', doDelete, { variant: 'danger' })
      ),
      ui.divider(),
      ui.group(
        travSel.root,
        ui.button('Run Traversal', doTraverse, { variant: 'primary' }),
        ui.button('Clear', clearTree)
      )
    );

    const svg = ui.svg('svg', { class: 'tree-svg' });
    const outputStrip = el('div', { class: 'out-strip' });
    const stageContainer = el('div', { style: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' } }, svg, outputStrip);
    L.stage.append(stageContainer);

    L.setLegend([
      [C.compare, 'Comparing'],
      [C.found, 'Found / Target'],
      [C.insert, 'Inserted'],
      [C.remove, 'Removed / Successor'],
      [C.active, 'Traversing / Visited'],
    ]);

    const player = new Player(L.playerBar, { onRender: render, speed: 35 });

    /* ----- Recorder ----- */
    function recordFrames() {
      const frames = [];
      const snap = (treeSnapshot, line, msg, hl = {}, tags = {}, extra = {}) => {
        frames.push({
          tree: cloneTree(treeSnapshot),
          line,
          msg,
          hl,
          tags,
          visited: (extra.visited || []).slice(),
          queue: (extra.queue || []).slice(),
          type: extra.type,
        });
      };
      return { frames, snap };
    }

    /* ----- BST Logic with animations ----- */
    function doInsert() {
      const { value: val, error } = ui.parseOne(valueIn.value, { name: 'Value' });
      if (error) { ui.toast(error, 'error'); return; }

      if (treeSize(root) >= 25) {
        ui.toast('Tree size limit of 25 nodes reached for visual clarity.', 'error');
        return;
      }

      L.setCode('insert(root, val)', CODE.insert);
      L.setComplexity(COMPLEXITY.insert);

      const { frames, snap } = recordFrames();

      if (!root) {
        root = Node(val);
        snap(root, 1, `Tree was empty. Created new root with value ${val}.`, { [root.id]: 'insert' }, { [root.id]: 'root' }, { type: 'success' });
        player.load(frames);
        valueIn.set(ui.randInt(10, 99));
        return;
      }

      let curr = root;
      snap(root, 0, `Start insertion of ${val} at root (${curr.val}).`, { [curr.id]: 'compare' });

      while (curr) {
        if (val === curr.val) {
          snap(root, 0, `Value ${val} already exists in the BST! Duplicates ignored.`, { [curr.id]: 'found' }, {}, { type: 'error' });
          player.load(frames);
          return;
        }

        if (val < curr.val) {
          snap(root, 2, `${val} < ${curr.val} → move to left subtree.`, { [curr.id]: 'compare' });
          if (!curr.left) {
            curr.left = Node(val);
            snap(root, 3, `Left child is null. Placed new node ${val} here.`, { [curr.left.id]: 'insert' }, {}, { type: 'success' });
            break;
          }
          curr = curr.left;
          snap(root, 3, `Moved to left child (${curr.val}).`, { [curr.id]: 'compare' });
        } else {
          snap(root, 4, `${val} > ${curr.val} → move to right subtree.`, { [curr.id]: 'compare' });
          if (!curr.right) {
            curr.right = Node(val);
            snap(root, 5, `Right child is null. Placed new node ${val} here.`, { [curr.right.id]: 'insert' }, {}, { type: 'success' });
            break;
          }
          curr = curr.right;
          snap(root, 5, `Moved to right child (${curr.val}).`, { [curr.id]: 'compare' });
        }
      }

      valueIn.set(ui.randInt(10, 99));
      player.load(frames);
    }

    function doSearch() {
      const { value: val, error } = ui.parseOne(valueIn.value, { name: 'Value' });
      if (error) { ui.toast(error, 'error'); return; }

      L.setCode('search(root, val)', CODE.search);
      L.setComplexity(COMPLEXITY.search);

      const { frames, snap } = recordFrames();
      if (!root) {
        snap(null, 1, 'Tree is empty — target not found.', {}, {}, { type: 'error' });
        player.load(frames);
        return;
      }

      let curr = root;
      snap(root, 0, `Begin searching for ${val} starting from root (${curr.val}).`, { [curr.id]: 'compare' });

      let found = false;
      while (curr) {
        if (curr.val === val) {
          snap(root, 1, `Found ${val} at node ${curr.val}!`, { [curr.id]: 'found' }, { [curr.id]: 'target' }, { type: 'success' });
          found = true;
          break;
        }
        if (val < curr.val) {
          snap(root, 3, `${val} < ${curr.val} → search left.`, { [curr.id]: 'compare' });
          curr = curr.left;
          if (curr) snap(root, 4, `At left child (${curr.val}).`, { [curr.id]: 'compare' });
        } else {
          snap(root, 5, `${val} > ${curr.val} → search right.`, { [curr.id]: 'compare' });
          curr = curr.right;
          if (curr) snap(root, 6, `At right child (${curr.val}).`, { [curr.id]: 'compare' });
        }
      }

      if (!found) {
        snap(root, 1, `Reached null — ${val} is not present in the tree.`, {}, {}, { type: 'error' });
      }

      player.load(frames);
    }

    function doDelete() {
      const { value: val, error } = ui.parseOne(valueIn.value, { name: 'Value' });
      if (error) { ui.toast(error, 'error'); return; }

      L.setCode('delete(root, val)', CODE.delete);
      L.setComplexity(COMPLEXITY.delete);

      const { frames, snap } = recordFrames();
      if (!root) {
        snap(null, 1, 'Tree is empty — nothing to delete.', {}, {}, { type: 'error' });
        player.load(frames);
        return;
      }

      function deleteNode(node, v) {
        if (!node) {
          snap(root, 1, `Target ${v} not found in this branch.`, {}, {}, { type: 'error' });
          return null;
        }

        snap(root, 0, `Inspect node ${node.val} for deletion of ${v}.`, { [node.id]: 'compare' });

        if (v < node.val) {
          snap(root, 2, `${v} < ${node.val} → delete from left child.`, { [node.id]: 'compare' });
          node.left = deleteNode(node.left, v);
          return node;
        } else if (v > node.val) {
          snap(root, 3, `${v} > ${node.val} → delete from right child.`, { [node.id]: 'compare' });
          node.right = deleteNode(node.right, v);
          return node;
        } else {
          // Node found!
          snap(root, 4, `Found node ${node.val} to delete!`, { [node.id]: 'remove' });

          // Case 1: Leaf node
          if (!node.left && !node.right) {
            snap(root, 4, `Node ${node.val} is a leaf node. Removing it directly.`, { [node.id]: 'remove' }, {}, { type: 'success' });
            return null;
          }
          // Case 2: One child (only right)
          if (!node.left) {
            snap(root, 5, `Node ${node.val} has only right child (${node.right.val}). Replace with child.`, { [node.id]: 'remove', [node.right.id]: 'insert' }, {}, { type: 'success' });
            return node.right;
          }
          // Case 2: One child (only left)
          if (!node.right) {
            snap(root, 6, `Node ${node.val} has only left child (${node.left.val}). Replace with child.`, { [node.id]: 'remove', [node.left.id]: 'insert' }, {}, { type: 'success' });
            return node.left;
          }
          // Case 3: Two children -> find in-order successor (min in right subtree)
          snap(root, 7, `Node ${node.val} has 2 children. Find in-order successor in right subtree.`, { [node.id]: 'remove', [node.right.id]: 'active' });

          let succParent = node;
          let succ = node.right;
          while (succ.left) {
            succParent = succ;
            succ = succ.left;
          }

          snap(root, 7, `In-order successor is ${succ.val}. Replace ${node.val} with ${succ.val}.`, { [node.id]: 'remove', [succ.id]: 'found' }, { [succ.id]: 'successor' });

          node.val = succ.val;
          snap(root, 7, `Copied successor value ${succ.val} to target position. Now delete duplicate successor.`, { [node.id]: 'found' });

          node.right = deleteNode(node.right, succ.val);
          return node;
        }
      }

      root = deleteNode(root, val);
      snap(root, null, `Deletion completed.`, {}, {}, { type: 'success' });
      player.load(frames);
    }

    function doTraverse() {
      const mode = travSel.value;
      L.setCode(mode + '(root)', CODE[mode]);
      L.setComplexity(COMPLEXITY[mode]);

      const { frames, snap } = recordFrames();
      if (!root) {
        snap(null, 1, 'Tree is empty — nothing to traverse.', {}, {}, { type: 'error' });
        player.load(frames);
        return;
      }

      const visited = [];

      if (mode === 'inorder') {
        function traverse(n) {
          if (!n) return;
          snap(root, 2, `Recurse left child of ${n.val}.`, { [n.id]: 'compare' }, {}, { visited });
          traverse(n.left);
          visited.push(n.val);
          snap(root, 3, `Visit node ${n.val} (in-order position #${visited.length}).`, { [n.id]: 'found' }, {}, { visited });
          snap(root, 4, `Recurse right child of ${n.val}.`, { [n.id]: 'compare' }, {}, { visited });
          traverse(n.right);
        }
        snap(root, 0, `Start In-Order traversal (Left → Node → Right). Produces sorted sequence.`, {}, {}, { visited });
        traverse(root);
      } else if (mode === 'preorder') {
        function traverse(n) {
          if (!n) return;
          visited.push(n.val);
          snap(root, 2, `Visit node ${n.val} first.`, { [n.id]: 'found' }, {}, { visited });
          snap(root, 3, `Recurse left child of ${n.val}.`, { [n.id]: 'compare' }, {}, { visited });
          traverse(n.left);
          snap(root, 4, `Recurse right child of ${n.val}.`, { [n.id]: 'compare' }, {}, { visited });
          traverse(n.right);
        }
        snap(root, 0, `Start Pre-Order traversal (Node → Left → Right). Useful for copying trees.`, {}, {}, { visited });
        traverse(root);
      } else if (mode === 'postorder') {
        function traverse(n) {
          if (!n) return;
          snap(root, 2, `Recurse left child of ${n.val}.`, { [n.id]: 'compare' }, {}, { visited });
          traverse(n.left);
          snap(root, 3, `Recurse right child of ${n.val}.`, { [n.id]: 'compare' }, {}, { visited });
          traverse(n.right);
          visited.push(n.val);
          snap(root, 4, `Visit node ${n.val} after children.`, { [n.id]: 'found' }, {}, { visited });
        }
        snap(root, 0, `Start Post-Order traversal (Left → Right → Node). Bottom-up evaluation.`, {}, {}, { visited });
        traverse(root);
      } else if (mode === 'levelorder') {
        const queue = [root];
        snap(root, 1, `Initialize queue with root [${root.val}].`, { [root.id]: 'compare' }, {}, { visited, queue: queue.map(x => x.val) });
        while (queue.length > 0) {
          const curr = queue.shift();
          visited.push(curr.val);
          snap(root, 3, `Dequeued and visit ${curr.val}.`, { [curr.id]: 'found' }, {}, { visited, queue: queue.map(x => x.val) });
          if (curr.left) {
            queue.push(curr.left);
            snap(root, 5, `Enqueue left child ${curr.left.val}.`, { [curr.id]: 'found', [curr.left.id]: 'active' }, {}, { visited, queue: queue.map(x => x.val) });
          }
          if (curr.right) {
            queue.push(curr.right);
            snap(root, 6, `Enqueue right child ${curr.right.val}.`, { [curr.id]: 'found', [curr.right.id]: 'active' }, {}, { visited, queue: queue.map(x => x.val) });
          }
        }
      }

      snap(root, null, `Traversal complete! Visited ${visited.length} nodes.`, {}, {}, { visited, type: 'success' });
      player.load(frames);
    }

    function clearTree() {
      root = null;
      showIdle('Tree cleared. Insert new values or generate a random tree.');
    }

    function generateRandom() {
      root = null;
      const count = size;
      const values = ui.uniqueRandom(count, 10, 99);
      for (const v of values) {
        insertRaw(v);
      }
      showIdle(`Generated random BST with ${count} nodes.`);
    }

    function insertRaw(val) {
      if (!root) { root = Node(val); return; }
      let c = root;
      while (c) {
        if (val === c.val) return;
        if (val < c.val) {
          if (!c.left) { c.left = Node(val); return; }
          c = c.left;
        } else {
          if (!c.right) { c.right = Node(val); return; }
          c = c.right;
        }
      }
    }

    function applyCustom() {
      const { values, error } = ui.parseValues(custom.value, { min: 1, max: 999, maxCount: 25 });
      if (error) { ui.toast(error, 'error'); return; }
      root = null;
      for (const v of values) insertRaw(v);
      sizeSl.set(Math.min(20, Math.max(3, values.length)));
      showIdle(`Built BST from ${values.length} custom value${values.length > 1 ? 's' : ''}.`);
    }

    function showIdle(msg) {
      const { frames, snap } = recordFrames();
      snap(root, null, msg || 'Binary Search Tree ready. Use controls above to interact.');
      player.load(frames, { autoplay: false });
    }

    /* ----- Render frame ----- */
    function render(f) {
      const tree = f.tree;
      if (!tree) {
        svg.replaceChildren();
        outputStrip.replaceChildren(el('span', { class: 'tree-empty' }, 'Tree is empty'));
      } else {
        const { nodes, edges, width, height } = layoutTree(tree);
        const mappedNodes = nodes.map(n => ({
          id: n.id,
          x: n.x,
          y: n.y,
          label: String(n.val),
          cls: f.hl[n.id] || null,
          tag: f.tags[n.id] || null,
        }));
        const mappedEdges = edges.map(e => ({
          x1: e.x1,
          y1: e.y1,
          x2: e.x2,
          y2: e.y2,
          cls: (f.hl[e.from] && f.hl[e.to]) ? 'hot' : '',
        }));
        ui.drawTree(svg, { nodes: mappedNodes, edges: mappedEdges, width, height, r: 19 });

        if (f.visited && f.visited.length) {
          const chips = [el('span', { class: 'lab' }, 'Traversal order:')];
          f.visited.forEach((v, idx) => chips.push(el('span', { class: 'chip' }, `${idx + 1}. ${v}`)));
          if (f.queue && f.queue.length) {
            chips.push(el('span', { class: 'lab', style: { marginLeft: '12px' } }, 'Queue:'));
            f.queue.forEach(q => chips.push(el('span', { class: 'chip q' }, q)));
          }
          outputStrip.replaceChildren(...chips);
        } else {
          outputStrip.replaceChildren();
        }
      }

      L.applyFrame(f);
      L.setStats({
        'Node count': treeSize(tree),
        'Tree height': treeHeight(tree),
        'Root': tree ? tree.val : 'none',
      });
    }

    L.setCode('insert(root, val)', CODE.insert);
    L.setComplexity(COMPLEXITY.insert);
    generateRandom();

    return { root: L.root, player };
  }

  DSA.modules.push({
    id: 'bst',
    title: 'Binary Search Tree',
    group: 'Trees & Heaps',
    blurb: 'Dynamic BST with in-order successor deletion, search paths, and interactive animated tree traversals.',
    icon: '<circle cx="12" cy="5" r="3"/><circle cx="6" cy="19" r="3"/><circle cx="18" cy="19" r="3"/><path d="M10.5 7.5L7.5 16.5M13.5 7.5L16.5 16.5"/>',
    create,
  });
})();
