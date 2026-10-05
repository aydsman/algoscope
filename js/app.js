/* ==========================================================================
   AlgoScope — Application Shell & Router
   Manages navigation, hash routing, keyboard shortcuts, theme, and workbench directory
   ========================================================================== */
(function () {
  'use strict';

  const { ui, modules } = DSA;
  const { el } = ui;

  const appRoot = document.getElementById('app');
  let activeModuleId = null;
  let activeModuleInstance = null;
  const moduleInstances = new Map();

  /* ----- Theme Management ----- */
  function getTheme() {
    return localStorage.getItem('algoscope-theme') || 'dark';
  }

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('algoscope-theme', t);
  }

  /* ----- Interactive Sandbox (Live Quick Playground on Home View) ----- */
  function createInteractiveSandbox() {
    const defaultData = [44, 18, 88, 62, 29, 93, 37, 56, 75, 12, 69, 48, 82, 25];
    let array = [...defaultData];
    let steps = [];
    let curStepIdx = 0;
    let timer = null;

    const barsContainer = el('div', { class: 'sandbox-bars' });
    const statusText = el('div', { class: 'sandbox-status' }, 'Ready. Click "Run Bubble Sort" or "Step Next".');
    const compStat = el('span', null, el('span', null, 'Comparisons: '), el('strong', null, '0'));
    const swapStat = el('span', null, el('span', null, 'Swaps: '), el('strong', null, '0'));
    const stepStat = el('span', null, el('span', null, 'Step: '), el('strong', null, '0/0'));

    function generateSteps(arr) {
      const a = [...arr];
      const n = a.length;
      const history = [];
      let comps = 0;
      let swaps = 0;
      const sortedIndices = [];

      history.push({
        array: [...a],
        comparing: [],
        swapped: [],
        sorted: [],
        comps: 0,
        swaps: 0,
        msg: 'Initial array state. Ready to step.'
      });

      for (let i = 0; i < n - 1; i++) {
        let anySwapped = false;
        for (let j = 0; j < n - 1 - i; j++) {
          comps++;
          history.push({
            array: [...a],
            comparing: [j, j + 1],
            swapped: [],
            sorted: [...sortedIndices],
            comps,
            swaps,
            msg: `Comparing index ${j} (${a[j]}) and index ${j + 1} (${a[j + 1]}).`
          });

          if (a[j] > a[j + 1]) {
            const tmp = a[j];
            a[j] = a[j + 1];
            a[j + 1] = tmp;
            swaps++;
            anySwapped = true;
            history.push({
              array: [...a],
              comparing: [],
              swapped: [j, j + 1],
              sorted: [...sortedIndices],
              comps,
              swaps,
              msg: `Swapped index ${j} and index ${j + 1} (${a[j + 1]} > ${a[j]}).`
            });
          }
        }
        sortedIndices.unshift(n - 1 - i);
        history.push({
          array: [...a],
          comparing: [],
          swapped: [],
          sorted: [...sortedIndices],
          comps,
          swaps,
          msg: `Element ${a[n - 1 - i]} is confirmed in final sorted position.`
        });
        if (!anySwapped) break;
      }

      history.push({
        array: [...a],
        comparing: [],
        swapped: [],
        sorted: Array.from({ length: n }, (_, idx) => idx),
        comps,
        swaps,
        msg: `Sorting completed in ${history.length} steps (${comps} comparisons, ${swaps} swaps).`
      });

      return history;
    }

    function renderBars(state) {
      const maxVal = Math.max(...array, 100);
      const cols = state.array.map((val, idx) => {
        let cls = 's-bar';
        if (state.swapped.includes(idx)) cls += ' swapped';
        else if (state.comparing.includes(idx)) cls += ' comparing';
        else if (state.sorted.includes(idx)) cls += ' sorted';

        const heightPercent = Math.max(8, Math.round((val / maxVal) * 100));
        const bar = el('div', { class: cls, style: { height: `${heightPercent}%` } });
        const valText = el('span', { class: 's-bar-val' }, val);
        return el('div', { class: 's-bar-col' }, bar, valText);
      });
      barsContainer.replaceChildren(...cols);
    }

    function updateView() {
      const step = steps[curStepIdx] || steps[0];
      renderBars(step);
      statusText.textContent = step.msg;
      compStat.querySelector('strong').textContent = step.comps;
      swapStat.querySelector('strong').textContent = step.swaps;
      stepStat.querySelector('strong').textContent = `${curStepIdx} / ${steps.length - 1}`;
    }

    function stopAutoPlay() {
      if (timer) {
        clearInterval(timer);
        timer = null;
        runBtn.textContent = 'Run Bubble Sort';
      }
    }

    function stepNext() {
      if (curStepIdx < steps.length - 1) {
        curStepIdx++;
        updateView();
      } else {
        stopAutoPlay();
      }
    }

    function reset() {
      stopAutoPlay();
      steps = generateSteps(array);
      curStepIdx = 0;
      updateView();
    }

    function randomize() {
      stopAutoPlay();
      array = Array.from({ length: 14 }, () => Math.floor(Math.random() * 85) + 10);
      steps = generateSteps(array);
      curStepIdx = 0;
      updateView();
    }

    const runBtn = el('button', {
      type: 'button',
      class: 'btn primary',
      onclick: () => {
        if (timer) {
          stopAutoPlay();
        } else {
          if (curStepIdx >= steps.length - 1) {
            curStepIdx = 0;
          }
          runBtn.textContent = 'Pause Execution';
          timer = setInterval(() => {
            if (curStepIdx < steps.length - 1) {
              stepNext();
            } else {
              stopAutoPlay();
            }
          }, 240);
        }
      }
    }, 'Run Bubble Sort');

    const stepBtn = el('button', {
      type: 'button',
      class: 'btn',
      onclick: () => {
        stopAutoPlay();
        stepNext();
      }
    }, 'Step Next');

    const randBtn = el('button', {
      type: 'button',
      class: 'btn',
      onclick: randomize
    }, 'Randomize Data');

    const resetBtn = el('button', {
      type: 'button',
      class: 'btn',
      onclick: reset
    }, 'Reset');

    const fullSuiteLink = el('a', {
      href: '#/sorting',
      class: 'dir-action-btn',
      onclick: (e) => {
        e.preventDefault();
        window.location.hash = '#/sorting';
      }
    }, 'Launch Full Sorting Suite →');

    // Init state
    steps = generateSteps(array);
    updateView();

    const sandbox = el('div', { class: 'sandbox-card' },
      el('div', { class: 'sandbox-head' },
        el('div', { class: 'sandbox-head-title' },
          el('span', { html: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>` }),
          'Live Interactive Array Sandbox',
          el('span', { class: 'sandbox-badge' }, 'Bubble Sort • Step-by-Step State Machine')
        ),
        fullSuiteLink
      ),
      el('div', { class: 'sandbox-body' },
        barsContainer,
        el('div', { class: 'sandbox-foot' },
          el('div', { class: 'sandbox-controls' }, runBtn, stepBtn, randBtn, resetBtn),
          el('div', { class: 'sandbox-metrics' }, compStat, swapStat, stepStat)
        ),
        el('div', { style: { marginTop: '10px' } }, statusText)
      )
    );

    return sandbox;
  }

  /* ----- Home / Dashboard View ----- */
  function createHomeView() {
    const hero = el('div', { class: 'hero' },
      el('div', { class: 'version-pill', style: { marginBottom: '14px' } },
        el('span', { class: 'v-dot' }),
        'BUILD v2.1 • ZERO EXTERNAL DEPENDENCIES • INTERACTIVE ALGORITHMIC ENGINE'
      ),
      el('h1', null, 'AlgoScope — Engineering Workbench'),
      el('p', null, 'A high-density, deterministic visual environment for evaluating algorithm complexity, inspecting memory layouts, tracing graph traversals, and debugging algorithmic state machines step-by-step.'),
      el('div', { class: 'specs-ribbon' },
        el('div', { class: 'spec-item' },
          el('span', { class: 'spec-val' }, '7 Core Suites'),
          el('span', { class: 'spec-lbl' }, 'Arrays, Lists, Trees & Graphs')
        ),
        el('div', { class: 'spec-item' },
          el('span', { class: 'spec-val' }, '24 Operations'),
          el('span', { class: 'spec-lbl' }, 'Partitioning, Traversals, Pathfinding')
        ),
        el('div', { class: 'spec-item' },
          el('span', { class: 'spec-val' }, 'Synchronized Trace'),
          el('span', { class: 'spec-lbl' }, 'Line-by-line pseudocode highlighter')
        ),
        el('div', { class: 'spec-item' },
          el('span', { class: 'spec-val' }, 'Time-Travel Player'),
          el('span', { class: 'spec-lbl' }, 'Forward/backward step debugging')
        )
      )
    );

    // Interactive Sandbox Preview
    const sandbox = createInteractiveSandbox();

    // High-Density Engineering Directory (Replacing Vibe-Coded Cards)
    const directoryContainer = el('div', { class: 'directory' });

    const directorySections = [
      {
        group: 'Array & Partitioning Algorithms',
        desc: 'Contiguous memory structures with indexed access, cache locality, and in-place partitioning routines.',
        items: [
          {
            id: 'sorting',
            title: 'Sorting Algorithms',
            desc: 'Bubble, Selection, Insertion, Merge, Quick, and Heap sort with live comparison, swap tracking, and partition boundaries.',
            ops: ['Bubble Sort', 'Selection Sort', 'Insertion Sort', 'Merge Sort', 'Quick Sort', 'Heap Sort'],
            time: 'O(n log n)',
            space: 'O(1) – O(n)',
            icon: `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`,
          },
          {
            id: 'searching',
            title: 'Searching Algorithms',
            desc: 'Linear, Binary, and Jump search with window narrowing pointers (lo / mid / hi) and range reduction.',
            ops: ['Linear Search', 'Binary Search', 'Jump Search'],
            time: 'O(log n) – O(n)',
            space: 'O(1)',
            icon: `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`,
          },
        ],
      },
      {
        group: 'Sequential Linear Structures',
        desc: 'Pointer-based and indexed linear collections implementing LIFO, FIFO, and non-contiguous node chains.',
        items: [
          {
            id: 'stackqueue',
            title: 'Stack & Circular Queue',
            desc: 'Fixed-capacity LIFO stack and ring-buffer circular queue with top, front, and rear pointer wraparound visualization.',
            ops: ['Push / Enqueue', 'Pop / Dequeue', 'Peek / Front', 'Ring Wraparound'],
            time: 'O(1)',
            space: 'O(n)',
            icon: `<path d="M4 6h16M4 12h16M4 18h16"/><rect x="2" y="3" width="20" height="18" rx="2" fill="none"/>`,
          },
          {
            id: 'linkedlist',
            title: 'Singly Linked List',
            desc: 'Dynamic node list with pointer re-wiring for head, tail, and arbitrary index operations plus in-place pointer reversal.',
            ops: ['Insert Head/Tail/Index', 'Delete Node', 'Search Key', 'In-place Reverse'],
            time: 'O(1) head / O(n) index',
            space: 'O(n)',
            icon: `<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>`,
          },
        ],
      },
      {
        group: 'Hierarchical Trees & Priority Heaps',
        desc: 'Recursive tree structures and array-backed binary heaps with complete binary tree invariants.',
        items: [
          {
            id: 'bst',
            title: 'Binary Search Tree (BST)',
            desc: 'Binary search tree with ordered key invariant, node deletion via in-order successor, and 4 traversal algorithms.',
            ops: ['Insert Key', 'Search Key', 'Delete Node', 'In/Pre/Post/Level-Order'],
            time: 'O(log n) avg / O(n) worst',
            space: 'O(n)',
            icon: `<circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><path d="M12 8v3M5 16l5-5M19 16l-5-5"/>`,
          },
          {
            id: 'heap',
            title: 'Binary Heap / Priority Queue',
            desc: 'Max and Min heap complete binary tree with simultaneous array representation, heapify up/down, and linear build-heap.',
            ops: ['Insert Element', 'Extract Top', 'Toggle Max/Min', 'Build Heap (Floyd)'],
            time: 'O(log n) op / O(n) build',
            space: 'O(n)',
            icon: `<polygon points="12 3 2 21 22 21"/><line x1="12" y1="11" x2="12" y2="17"/>`,
          },
        ],
      },
      {
        group: 'Graph Theory & Pathfinding',
        desc: 'Unweighted and weighted 2D grid graph representations with obstacle matrices and heuristic distance estimators.',
        items: [
          {
            id: 'pathfinding',
            title: 'Grid Pathfinding & Graph Search',
            desc: 'Shortest path algorithms on 2D grid graphs with interactive wall painting, terrain weights, and randomized maze generation.',
            ops: ['BFS (Shortest Unweighted)', 'DFS (Exhaustive)', 'Dijkstra (Weighted)', 'A* (Manhattan Heuristic)'],
            time: 'O(V + E) / O(E log V)',
            space: 'O(V)',
            icon: `<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>`,
          },
        ],
      },
    ];

    for (const sec of directorySections) {
      const secEl = el('div', { class: 'dir-section' },
        el('div', { class: 'dir-head' },
          el('h3', { class: 'dir-title' }, sec.group),
          el('p', { class: 'dir-desc' }, sec.desc)
        )
      );

      const table = el('table', { class: 'dir-table' },
        el('thead', null,
          el('tr', null,
            el('th', { style: { width: '30%' } }, 'Module & Structure'),
            el('th', { style: { width: '32%' } }, 'Operations Visualized'),
            el('th', { style: { width: '16%' } }, 'Worst Time'),
            el('th', { style: { width: '10%' } }, 'Space'),
            el('th', { style: { width: '12%' } }, 'Action')
          )
        )
      );

      const tbody = el('tbody');
      for (const item of sec.items) {
        const row = el('tr', null,
          el('td', null,
            el('div', { class: 'dir-mod-cell' },
              el('span', { class: 'dir-mod-icon', html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${item.icon}</svg>` }),
              el('div', null,
                el('div', { class: 'dir-mod-title' }, item.title),
                el('div', { class: 'dir-mod-desc' }, item.desc)
              )
            )
          ),
          el('td', null,
            el('div', null, item.ops.map((op) => el('span', { class: 'badge-pill' }, op)))
          ),
          el('td', null,
            el('span', { class: 'badge-complexity' }, item.time)
          ),
          el('td', null,
            el('span', { class: 'badge-space' }, item.space)
          ),
          el('td', null,
            el('a', {
              href: `#/${item.id}`,
              class: 'dir-action-btn',
              onclick: (e) => {
                e.preventDefault();
                window.location.hash = `#/${item.id}`;
              }
            }, 'Launch →')
          )
        );
        tbody.append(row);
      }
      table.append(tbody);

      const wrap = el('div', { class: 'dir-table-wrap' }, table);
      secEl.append(wrap);
      directoryContainer.append(secEl);
    }

    return el('div', { class: 'home' }, hero, sandbox, directoryContainer);
  }

  /* ----- Navigation Shell ----- */
  function renderSidebar(sidebarEl) {
    const brand = el('a', { href: '#/', class: 'brand' },
      el('div', { class: 'brand-logo' },
        el('span', { html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>` })
      ),
      el('div', null,
        'AlgoScope',
        el('small', null, 'Interactive Workbench')
      )
    );

    const versionPill = el('div', { class: 'version-pill' },
      el('span', { class: 'v-dot' }),
      'Build v2.1 • Refined'
    );

    const nav = el('nav', { class: 'nav' });

    // Home link
    const homeLink = el('a', { href: '#/', 'data-id': 'home' },
      el('span', { class: 'icon', html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>` }),
      'Workbench Index'
    );
    nav.append(homeLink);

    // Group modules by category
    const groups = {};
    for (const mod of modules) {
      if (!groups[mod.group]) groups[mod.group] = [];
      groups[mod.group].push(mod);
    }

    for (const [groupName, groupMods] of Object.entries(groups)) {
      nav.append(el('div', { class: 'nav-group-title' }, groupName));
      for (const m of groupMods) {
        const link = el('a', { href: `#/${m.id}`, 'data-id': m.id },
          el('span', { class: 'icon', html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${m.icon}</svg>` }),
          m.title
        );
        nav.append(link);
      }
    }

    // Theme Switcher & Shortcuts
    const currentTheme = getTheme();
    const themeBtn = el('button', {
      type: 'button',
      class: 'btn btn-theme',
      onclick: () => {
        const cur = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = cur === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        updateThemeBtn(next);
      }
    });

    function updateThemeBtn(theme) {
      if (theme === 'dark') {
        themeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> Light Mode`;
      } else {
        themeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> Dark Mode`;
      }
    }
    updateThemeBtn(currentTheme);

    const shortcuts = el('div', { class: 'sidebar-foot' },
      el('div', { style: { fontWeight: '600', marginBottom: '4px', color: 'var(--text)' } }, 'Keybindings'),
      el('div', null, el('kbd', null, 'Space'), ' Play / Pause'),
      el('div', null, el('kbd', null, '←'), ' / ', el('kbd', null, '→'), ' Step back / forward'),
      themeBtn
    );

    sidebarEl.append(brand, versionPill, nav, shortcuts);
  }

  /* ----- Router ----- */
  function navigate() {
    const rawHash = window.location.hash.slice(1);
    const path = rawHash.replace(/^\//, '') || 'home';

    // Update active nav link
    const navLinks = document.querySelectorAll('.nav a');
    navLinks.forEach((a) => {
      a.classList.toggle('active', a.dataset.id === path);
    });

    const mainEl = document.querySelector('.main');
    if (!mainEl) return;

    if (path === 'home') {
      activeModuleId = 'home';
      activeModuleInstance = null;
      mainEl.replaceChildren(createHomeView());
      document.title = 'AlgoScope — Engineering Workbench';
      return;
    }

    const targetMod = modules.find((m) => m.id === path);
    if (!targetMod) {
      window.location.hash = '#/';
      return;
    }

    // Pause any currently playing module
    if (activeModuleInstance && activeModuleInstance.player) {
      activeModuleInstance.player.pause();
    }

    activeModuleId = path;
    if (!moduleInstances.has(path)) {
      moduleInstances.set(path, targetMod.create());
    }

    activeModuleInstance = moduleInstances.get(path);
    mainEl.replaceChildren(activeModuleInstance.root);
    document.title = `${targetMod.title} — AlgoScope`;
  }

  /* ----- Keyboard shortcuts ----- */
  window.addEventListener('keydown', (e) => {
    // Avoid triggering shortcuts while typing inside text boxes
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    if (!activeModuleInstance || !activeModuleInstance.player) return;
    const player = activeModuleInstance.player;

    if (e.code === 'Space') {
      e.preventDefault();
      player.toggle();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      player.stepBack();
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      player.stepForward();
    }
  });

  /* ----- App Bootstrapper ----- */
  function init() {
    applyTheme(getTheme());

    const sidebar = el('aside', { class: 'sidebar' });
    const main = el('main', { class: 'main' });
    appRoot.replaceChildren(sidebar, main);

    renderSidebar(sidebar);
    window.addEventListener('hashchange', navigate);
    navigate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
