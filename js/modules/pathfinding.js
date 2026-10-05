/* ==========================================================================
   AlgoScope — Pathfinding & Graph Search
   BFS, DFS, Dijkstra, A* on interactive grid with walls, weights, and mazes
   ========================================================================== */
(function () {
  'use strict';

  const { ui, Player } = DSA;
  const { el, C } = ui;

  const CODE = {
    bfs: [
      'bfs(start, target):',
      '  queue = [start]; visited = {start}',
      '  while queue is not empty:',
      '    curr = queue.dequeue()',
      '    if curr == target: return reconstructPath(curr)',
      '    for each neighbor in getNeighbors(curr):',
      '      if neighbor not in visited and not isWall(neighbor):',
      '        visited.add(neighbor); parent[neighbor] = curr',
      '        queue.enqueue(neighbor)',
    ],
    dfs: [
      'dfs(start, target):',
      '  stack = [start]; visited = {start}',
      '  while stack is not empty:',
      '    curr = stack.pop()',
      '    if curr == target: return reconstructPath(curr)',
      '    for each neighbor in getNeighbors(curr):',
      '      if neighbor not in visited and not isWall(neighbor):',
      '        visited.add(neighbor); parent[neighbor] = curr',
      '        stack.push(neighbor)',
    ],
    dijkstra: [
      'dijkstra(start, target):',
      '  dist[start] = 0; pq.insert(start, 0)',
      '  while pq is not empty:',
      '    curr = pq.extractMin()',
      '    if curr == target: return reconstructPath(curr)',
      '    for each neighbor in getNeighbors(curr):',
      '      cost = dist[curr] + weight(neighbor)',
      '      if cost < dist[neighbor]:',
      '        dist[neighbor] = cost; parent[neighbor] = curr',
      '        pq.insertOrUpdate(neighbor, cost)',
    ],
    astar: [
      'astar(start, target):',
      '  g[start] = 0; f[start] = h(start, target)',
      '  openSet.insert(start, f[start])',
      '  while openSet is not empty:',
      '    curr = openSet.extractMin()',
      '    if curr == target: return reconstructPath(curr)',
      '    for each neighbor in getNeighbors(curr):',
      '      tentative_g = g[curr] + weight(neighbor)',
      '      if tentative_g < g[neighbor]:',
      '        parent[neighbor] = curr; g[neighbor] = tentative_g',
      '        f[neighbor] = g[neighbor] + h(neighbor, target)',
      '        openSet.insertOrUpdate(neighbor, f[neighbor])',
    ],
  };

  const COMPLEXITY = {
    bfs: [['Time', 'O(V + E)'], ['Space', 'O(V)'], ['Shortest Path', 'Yes (unweighted)'], ['Data Structure', 'Queue (FIFO)']],
    dfs: [['Time', 'O(V + E)'], ['Space', 'O(V)'], ['Shortest Path', 'No'], ['Data Structure', 'Stack (LIFO)']],
    dijkstra: [['Time', 'O((V + E) log V)'], ['Space', 'O(V)'], ['Shortest Path', 'Yes (weighted)'], ['Data Structure', 'Priority Queue']],
    astar: [['Time', 'O(E) best, O(V log V)'], ['Space', 'O(V)'], ['Shortest Path', 'Yes (admissible h)'], ['Heuristic', 'Manhattan distance']],
  };

  function create() {
    const L = ui.createLayout({
      title: 'Pathfinding & Graph Search',
      description: 'Find paths through a 2D grid graph. Drag Start (green) and End (red) nodes, draw walls or weighted terrain, generate recursive division mazes, and compare how BFS, DFS, Dijkstra, and A* explore the space.',
    });

    let algo = 'astar';
    let rows = 14;
    let cols = 26;
    let tool = 'wall'; // 'wall' | 'weight' | 'erase'

    // Node locations
    let startPos = { r: 6, c: 4 };
    let endPos = { r: 6, c: 21 };

    // Grid states: sets of "r,c"
    let walls = new Set();
    let weights = new Set();

    // Mouse drag state
    let isDrawing = false;
    let draggingTarget = null; // 'start' | 'end' | null

    const algoSel = ui.select({
      label: 'Algorithm',
      options: [
        { value: 'astar', label: 'A* Search (Heuristic)' },
        { value: 'dijkstra', label: "Dijkstra's Algorithm (Weighted)" },
        { value: 'bfs', label: 'Breadth-First Search (BFS)' },
        { value: 'dfs', label: 'Depth-First Search (DFS)' },
      ],
      value: algo,
      onChange: (v) => { algo = v; applyAlgo(); showIdle(); },
    });

    const sizeSel = ui.select({
      label: 'Grid size',
      options: [
        { value: 'small', label: 'Compact (10 × 18)' },
        { value: 'medium', label: 'Medium (14 × 26)' },
        { value: 'large', label: 'Wide (18 × 36)' },
      ],
      value: 'medium',
      onChange: (v) => {
        if (v === 'small') { rows = 10; cols = 18; }
        else if (v === 'medium') { rows = 14; cols = 26; }
        else { rows = 18; cols = 36; }
        startPos = { r: Math.floor(rows / 2), c: 3 };
        endPos = { r: Math.floor(rows / 2), c: cols - 4 };
        walls.clear();
        weights.clear();
        buildGridDOM();
        showIdle();
      },
    });

    const toolSeg = ui.segmented({
      label: 'Draw brush',
      options: [
        { value: 'wall', label: 'Wall' },
        { value: 'weight', label: 'Weight (+5)' },
        { value: 'erase', label: 'Eraser' },
      ],
      value: tool,
      onChange: (v) => { tool = v; },
    });

    const mazeSel = ui.select({
      label: 'Preset pattern',
      options: [
        { value: 'none', label: '— Select pattern —' },
        { value: 'recursive', label: 'Recursive Division Maze' },
        { value: 'random', label: 'Random Obstacles (30%)' },
        { value: 'weights', label: 'Swamp (Weighted Terrain)' },
      ],
      value: 'none',
      onChange: (v) => {
        if (v === 'recursive') makeRecursiveMaze();
        else if (v === 'random') makeRandomWalls();
        else if (v === 'weights') makeWeightedTerrain();
        mazeSel.set('none');
      },
    });

    L.controls.append(
      algoSel.root,
      sizeSel.root,
      toolSeg.root,
      mazeSel.root,
      ui.divider(),
      ui.group(
        ui.button('Find Path', runSearch, { variant: 'primary' }),
        ui.button('Clear path', () => showIdle()),
        ui.button('Clear walls', () => { walls.clear(); weights.clear(); updateGridCellClasses(); showIdle('Obstacles cleared.'); })
      )
    );

    const gridEl = el('div', { class: 'grid' });
    L.stage.append(gridEl);

    L.setLegend([
      [C.sorted, 'Start node (draggable)'],
      [C.swap, 'Target node (draggable)'],
      ['#5a6299', 'Wall (impassable)'],
      ['#b45309', 'Weight terrain (+5 cost)'],
      ['#155e75', 'Frontier (open set)'],
      ['#2e3a80', 'Visited (closed set)'],
      [C.compare, 'Final shortest path'],
    ]);

    const player = new Player(L.playerBar, { onRender: render, speed: 65 });

    let cellMap = new Map();

    function k(r, c) { return `${r},${c}`; }

    function buildGridDOM() {
      cellMap.clear();
      gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      gridEl.style.setProperty('--cell', cols > 30 ? '22px' : cols > 22 ? '26px' : '30px');

      const cells = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = el('div', { class: 'gcell', 'data-r': r, 'data-c': c });
          cellMap.set(k(r, c), cell);
          cells.push(cell);
        }
      }
      gridEl.replaceChildren(...cells);
      updateGridCellClasses();
    }

    function updateGridCellClasses() {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = cellMap.get(k(r, c));
          if (!cell) continue;
          let cls = 'gcell';
          if (r === startPos.r && c === startPos.c) cls += ' start';
          else if (r === endPos.r && c === endPos.c) cls += ' end';
          else if (walls.has(k(r, c))) cls += ' wall';
          else if (weights.has(k(r, c))) cls += ' weight';
          cell.className = cls;
        }
      }
    }

    /* ----- Interactive Mouse Drawing & Dragging ----- */
    gridEl.addEventListener('pointerdown', (e) => {
      const cell = e.target.closest('.gcell');
      if (!cell) return;
      const r = +cell.dataset.r;
      const c = +cell.dataset.c;

      if (r === startPos.r && c === startPos.c) {
        draggingTarget = 'start';
      } else if (r === endPos.r && c === endPos.c) {
        draggingTarget = 'end';
      } else {
        isDrawing = true;
        applyBrush(r, c);
      }
      e.preventDefault();
    });

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('pointermove', (e) => {
        if (!isDrawing && !draggingTarget) return;
        const elem = document.elementFromPoint ? document.elementFromPoint(e.clientX, e.clientY) : null;
        const cell = elem ? elem.closest('.gcell') : null;
        if (!cell) return;
        const r = +cell.dataset.r;
        const c = +cell.dataset.c;

        if (draggingTarget === 'start') {
          if ((r !== endPos.r || c !== endPos.c) && !walls.has(k(r, c))) {
            startPos = { r, c };
            updateGridCellClasses();
          }
        } else if (draggingTarget === 'end') {
          if ((r !== startPos.r || c !== startPos.c) && !walls.has(k(r, c))) {
            endPos = { r, c };
            updateGridCellClasses();
          }
        } else if (isDrawing) {
          applyBrush(r, c);
        }
      });

      window.addEventListener('pointerup', () => {
        isDrawing = false;
        draggingTarget = null;
      });
    }

    function applyBrush(r, c) {
      if ((r === startPos.r && c === startPos.c) || (r === endPos.r && c === endPos.c)) return;
      const key = k(r, c);
      if (tool === 'wall') {
        weights.delete(key);
        walls.add(key);
      } else if (tool === 'weight') {
        walls.delete(key);
        weights.add(key);
      } else if (tool === 'erase') {
        walls.delete(key);
        weights.delete(key);
      }
      updateGridCellClasses();
    }

    /* ----- Preset Mazes ----- */
    function makeRandomWalls() {
      walls.clear();
      weights.clear();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if ((r === startPos.r && c === startPos.c) || (r === endPos.r && c === endPos.c)) continue;
          if (Math.random() < 0.28) walls.add(k(r, c));
        }
      }
      updateGridCellClasses();
      showIdle('Random obstacles generated.');
    }

    function makeWeightedTerrain() {
      walls.clear();
      weights.clear();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if ((r === startPos.r && c === startPos.c) || (r === endPos.r && c === endPos.c)) continue;
          const distToMid = Math.abs(c - Math.floor(cols / 2));
          if (distToMid <= 3) weights.add(k(r, c));
          else if (Math.random() < 0.12) walls.add(k(r, c));
        }
      }
      updateGridCellClasses();
      showIdle('Swamp terrain placed: central region has weight +5. Watch Dijkstra and A* route around it if faster!');
    }

    function makeRecursiveMaze() {
      walls.clear();
      weights.clear();
      // Outer border
      for (let r = 0; r < rows; r++) { walls.add(k(r, 0)); walls.add(k(r, cols - 1)); }
      for (let c = 0; c < cols; c++) { walls.add(k(0, c)); walls.add(k(rows - 1, c)); }

      function divide(r1, r2, c1, c2) {
        if (r2 - r1 < 2 || c2 - c1 < 2) return;
        const horiz = (r2 - r1) > (c2 - c1);

        if (horiz) {
          const wallR = r1 + 1 + Math.floor(Math.random() * (r2 - r1 - 1));
          const passageC = c1 + Math.floor(Math.random() * (c2 - c1 + 1));
          for (let c = c1; c <= c2; c++) {
            if (c !== passageC) walls.add(k(wallR, c));
          }
          divide(r1, wallR - 1, c1, c2);
          divide(wallR + 1, r2, c1, c2);
        } else {
          const wallC = c1 + 1 + Math.floor(Math.random() * (c2 - c1 - 1));
          const passageR = r1 + Math.floor(Math.random() * (r2 - r1 + 1));
          for (let r = r1; r <= r2; r++) {
            if (r !== passageR) walls.add(k(r, wallC));
          }
          divide(r1, r2, c1, wallC - 1);
          divide(r1, r2, wallC + 1, c2);
        }
      }

      divide(1, rows - 2, 1, cols - 2);
      walls.delete(k(startPos.r, startPos.c));
      walls.delete(k(endPos.r, endPos.c));
      updateGridCellClasses();
      showIdle('Recursive division maze generated.');
    }

    /* ----- Algorithms Execution & Recording ----- */
    function getNeighbors(r, c) {
      const dirs = [[-1, 0], [0, 1], [1, 0], [0, -1]]; // Up, Right, Down, Left
      const res = [];
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !walls.has(k(nr, nc))) {
          res.push({ r: nr, c: nc, key: k(nr, nc) });
        }
      }
      return res;
    }

    function runSearch() {
      applyAlgo();
      const frames = [];
      const snap = (line, msg, current, visitedSet, frontierSet, pathList, type) => {
        frames.push({
          line,
          msg,
          current: current ? { ...current } : null,
          visited: new Set(visitedSet),
          frontier: new Set(frontierSet),
          path: pathList ? pathList.slice() : [],
          type,
        });
      };

      const startKey = k(startPos.r, startPos.c);
      const endKey = k(endPos.r, endPos.c);

      function reconstruct(parentMap) {
        const path = [];
        let curr = endKey;
        while (curr && curr !== startKey) {
          path.unshift(curr);
          curr = parentMap.get(curr);
        }
        return path;
      }

      if (algo === 'bfs') {
        const queue = [{ r: startPos.r, c: startPos.c, key: startKey }];
        const visited = new Set([startKey]);
        const frontier = new Set([startKey]);
        const parent = new Map();

        snap(1, `Initialize BFS with start node [${startPos.r}, ${startPos.c}].`, startPos, visited, frontier);

        let found = false;
        while (queue.length > 0) {
          const curr = queue.shift();
          frontier.delete(curr.key);

          if (curr.key === endKey) {
            found = true;
            snap(4, `Reached target node [${curr.r}, ${curr.c}]! Reconstructing shortest path.`, curr, visited, frontier, [], 'success');
            break;
          }

          snap(3, `Expand node [${curr.r}, ${curr.c}].`, curr, visited, frontier);

          for (const nb of getNeighbors(curr.r, curr.c)) {
            if (!visited.has(nb.key)) {
              visited.add(nb.key);
              frontier.add(nb.key);
              parent.set(nb.key, curr.key);
              queue.push(nb);
            }
          }
        }

        if (found) {
          const path = reconstruct(parent);
          // Animate path revelation
          for (let i = 1; i <= path.length; i++) {
            snap(null, `Path length: ${path.length} steps.`, null, visited, frontier, path.slice(0, i), 'success');
          }
        } else {
          snap(null, 'Target unreachable — no path exists.', null, visited, frontier, [], 'error');
        }
      } else if (algo === 'dfs') {
        const stack = [{ r: startPos.r, c: startPos.c, key: startKey }];
        const visited = new Set([startKey]);
        const frontier = new Set([startKey]);
        const parent = new Map();

        snap(1, `Initialize DFS with start node on stack.`, startPos, visited, frontier);

        let found = false;
        while (stack.length > 0) {
          const curr = stack.pop();
          frontier.delete(curr.key);

          if (curr.key === endKey) {
            found = true;
            snap(4, `Target reached! Reconstructing path.`, curr, visited, frontier, [], 'success');
            break;
          }

          snap(3, `Popped node [${curr.r}, ${curr.c}] from stack.`, curr, visited, frontier);

          for (const nb of getNeighbors(curr.r, curr.c)) {
            if (!visited.has(nb.key)) {
              visited.add(nb.key);
              frontier.add(nb.key);
              parent.set(nb.key, curr.key);
              stack.push(nb);
            }
          }
        }

        if (found) {
          const path = reconstruct(parent);
          for (let i = 1; i <= path.length; i++) {
            snap(null, `DFS found a path with ${path.length} steps.`, null, visited, frontier, path.slice(0, i), 'success');
          }
        } else {
          snap(null, 'Target unreachable — no path exists.', null, visited, frontier, [], 'error');
        }
      } else if (algo === 'dijkstra') {
        // Priority Queue implementation
        const dist = new Map([[startKey, 0]]);
        const parent = new Map();
        const pq = [{ r: startPos.r, c: startPos.c, key: startKey, cost: 0 }];
        const visited = new Set();
        const frontier = new Set([startKey]);

        snap(1, `Start Dijkstra with dist[start]=0.`, startPos, visited, frontier);

        let found = false;
        while (pq.length > 0) {
          pq.sort((a, b) => a.cost - b.cost);
          const curr = pq.shift();
          frontier.delete(curr.key);

          if (visited.has(curr.key)) continue;
          visited.add(curr.key);

          if (curr.key === endKey) {
            found = true;
            snap(4, `Found optimal target route with total cost ${dist.get(endKey)}!`, curr, visited, frontier, [], 'success');
            break;
          }

          snap(3, `Exploring node [${curr.r}, ${curr.c}] with lowest accumulated cost (${curr.cost}).`, curr, visited, frontier);

          for (const nb of getNeighbors(curr.r, curr.c)) {
            if (visited.has(nb.key)) continue;
            const stepWeight = weights.has(nb.key) ? 6 : 1;
            const newCost = dist.get(curr.key) + stepWeight;

            if (!dist.has(nb.key) || newCost < dist.get(nb.key)) {
              dist.set(nb.key, newCost);
              parent.set(nb.key, curr.key);
              pq.push({ ...nb, cost: newCost });
              frontier.add(nb.key);
            }
          }
        }

        if (found) {
          const path = reconstruct(parent);
          for (let i = 1; i <= path.length; i++) {
            snap(null, `Optimal weighted path: ${path.length} cells, cost ${dist.get(endKey)}.`, null, visited, frontier, path.slice(0, i), 'success');
          }
        } else {
          snap(null, 'Target unreachable.', null, visited, frontier, [], 'error');
        }
      } else if (algo === 'astar') {
        // A* with Manhattan distance heuristic
        const h = (r, c) => Math.abs(r - endPos.r) + Math.abs(c - endPos.c);
        const g = new Map([[startKey, 0]]);
        const f = new Map([[startKey, h(startPos.r, startPos.c)]]);
        const parent = new Map();
        const openSet = [{ r: startPos.r, c: startPos.c, key: startKey, f: f.get(startKey) }];
        const visited = new Set();
        const frontier = new Set([startKey]);

        snap(1, `A* initialized with start node (f = g + h = 0 + ${h(startPos.r, startPos.c)}).`, startPos, visited, frontier);

        let found = false;
        while (openSet.length > 0) {
          openSet.sort((a, b) => a.f - b.f);
          const curr = openSet.shift();
          frontier.delete(curr.key);

          if (curr.key === endKey) {
            found = true;
            snap(4, `A* reached goal! Heuristic guided search completed.`, curr, visited, frontier, [], 'success');
            break;
          }

          visited.add(curr.key);
          snap(3, `Expand [${curr.r}, ${curr.c}] (f=${curr.f}, g=${g.get(curr.key)}).`, curr, visited, frontier);

          for (const nb of getNeighbors(curr.r, curr.c)) {
            if (visited.has(nb.key)) continue;
            const stepWeight = weights.has(nb.key) ? 6 : 1;
            const tentativeG = g.get(curr.key) + stepWeight;

            if (!g.has(nb.key) || tentativeG < g.get(nb.key)) {
              parent.set(nb.key, curr.key);
              g.set(nb.key, tentativeG);
              const nodeF = tentativeG + h(nb.r, nb.c);
              f.set(nb.key, nodeF);
              openSet.push({ ...nb, f: nodeF });
              frontier.add(nb.key);
            }
          }
        }

        if (found) {
          const path = reconstruct(parent);
          for (let i = 1; i <= path.length; i++) {
            snap(null, `A* shortest path: ${path.length} steps.`, null, visited, frontier, path.slice(0, i), 'success');
          }
        } else {
          snap(null, 'Target unreachable.', null, visited, frontier, [], 'error');
        }
      }

      player.load(frames);
    }

    function showIdle(msg) {
      updateGridCellClasses();
      const frames = [{
        line: null,
        msg: msg || 'Configure the grid or choose an algorithm, then select "Find Path".',
        current: null,
        visited: new Set(),
        frontier: new Set(),
        path: [],
      }];
      player.load(frames, { autoplay: false });
    }

    function applyAlgo() {
      const A = ALGOS_INFO[algo];
      L.setCode(A.name, CODE[algo]);
      L.setComplexity(COMPLEXITY[algo]);
    }

    const ALGOS_INFO = {
      bfs: { name: 'Breadth-First Search (BFS)' },
      dfs: { name: 'Depth-First Search (DFS)' },
      dijkstra: { name: "Dijkstra's Algorithm" },
      astar: { name: 'A* Search' },
    };

    /* ----- Render frame ----- */
    function render(f) {
      const pathSet = new Set(f.path || []);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const key = k(r, c);
          const cell = cellMap.get(key);
          if (!cell) continue;

          let cls = 'gcell';
          if (r === startPos.r && c === startPos.c) {
            cls += ' start';
          } else if (r === endPos.r && c === endPos.c) {
            cls += ' end';
          } else if (walls.has(key)) {
            cls += ' wall';
          } else {
            if (weights.has(key)) cls += ' weight';
            if (pathSet.has(key)) cls += ' v-path';
            else if (f.current && f.current.r === r && f.current.c === c) cls += ' v-current';
            else if (f.frontier && f.frontier.has(key)) cls += ' v-frontier';
            else if (f.visited && f.visited.has(key)) cls += ' v-visited';
          }
          if (cell.className !== cls) cell.className = cls;
        }
      }

      L.applyFrame(f);
      L.setStats({
        'Explored Nodes': f.visited ? f.visited.size : 0,
        'Path Length': f.path && f.path.length ? `${f.path.length} steps` : '—',
        'Grid Size': `${rows} × ${cols}`,
        'Obstacles': `${walls.size} walls, ${weights.size} weights`,
      });
    }

    buildGridDOM();
    applyAlgo();
    showIdle();

    return { root: L.root, player };
  }

  DSA.modules.push({
    id: 'pathfinding',
    title: 'Pathfinding & Graphs',
    group: 'Graphs',
    blurb: 'BFS, DFS, Dijkstra and A* pathfinding on 2D grids with draggable start/goal, wall painting, and mazes.',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/><circle cx="6" cy="6" r="1.5" fill="currentColor"/><circle cx="18" cy="18" r="1.5" fill="currentColor"/>',
    create,
  });
})();
