/* ==========================================================================
   AlgoScope — Application Shell & Router
   Manages navigation, hash routing, keyboard shortcuts, and landing page
   ========================================================================== */
(function () {
  'use strict';

  const { ui, modules } = DSA;
  const { el } = ui;

  const appRoot = document.getElementById('app');
  let activeModuleId = null;
  let activeModuleInstance = null;
  const moduleInstances = new Map();

  /* ----- Home / Dashboard View ----- */
  function createHomeView() {
    const hero = el('div', { class: 'hero' },
      el('h1', null, 'AlgoScope — Visualizing ', el('span', null, 'DSA in Real-Time')),
      el('p', null, 'An interactive playground for exploring fundamental data structures and computer science algorithms. Experiment with custom inputs, tweak data sizes, watch pseudocode synchronization, and scrub through execution step-by-step.')
    );

    const cardsGrid = el('div', { class: 'cards' });

    for (const mod of modules) {
      const card = el('a', {
        href: `#/${mod.id}`,
        class: 'card',
        onclick: (e) => {
          e.preventDefault();
          window.location.hash = `#/${mod.id}`;
        },
      },
        el('div', { class: 'group' }, mod.group),
        el('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
          el('span', { class: 'icon', html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${mod.icon}</svg>` }),
          el('h3', null, mod.title)
        ),
        el('p', null, mod.blurb),
        el('div', { style: { marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontWeight: '600', fontSize: '13px' } },
          'Open visualizer →'
        )
      );
      cardsGrid.append(card);
    }

    return el('div', { class: 'home' }, hero, cardsGrid);
  }

  /* ----- Navigation Shell ----- */
  function renderSidebar(sidebarEl) {
    const brand = el('a', { href: '#/', class: 'brand' },
      el('div', { class: 'brand-logo' },
        el('span', { html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>` })
      ),
      el('div', null, 'AlgoScope', el('small', null, 'Interactive Visualizer'))
    );

    const nav = el('nav', { class: 'nav' });

    // Home link
    const homeLink = el('a', { href: '#/', 'data-id': 'home' },
      el('span', { class: 'icon', html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>` }),
      'Dashboard'
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

    const shortcuts = el('div', { class: 'sidebar-foot' },
      el('div', { style: { fontWeight: '600', marginBottom: '4px', color: 'var(--text)' } }, 'Shortcuts'),
      el('div', null, el('kbd', null, 'Space'), ' Play / Pause'),
      el('div', null, el('kbd', null, '←'), ' / ', el('kbd', null, '→'), ' Step back / forward')
    );

    sidebarEl.append(brand, nav, shortcuts);
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
      document.title = 'AlgoScope — Data Structures & Algorithms Visualizer';
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
