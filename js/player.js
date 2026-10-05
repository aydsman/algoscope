/* ==========================================================================
   AlgoScope — Player
   Plays back a precomputed list of animation "frames". Every visualization
   records frames up front, so users can play, pause, scrub, and step both
   forwards and backwards through any operation.
   ========================================================================== */
(function () {
  'use strict';

  const { el } = DSA.ui;

  const ICONS = {
    first: '<path d="M6 5v14"/><path d="M18 6l-8 6 8 6z"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    play: '<path d="M8 5.5l11 6.5-11 6.5z" fill="currentColor"/>',
    pause: '<path d="M8.5 5v14M15.5 5v14" stroke-width="3"/>',
    fwd: '<path d="M9 6l6 6-6 6"/>',
    last: '<path d="M18 5v14"/><path d="M6 6l8 6-8 6z"/>',
  };
  const svgIcon = (p) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;

  class Player {
    /**
     * @param {HTMLElement} container  element that receives the transport controls
     * @param {{onRender: (frame, index, frames) => void, speed?: number}} opts
     */
    constructor(container, { onRender, speed = 50 } = {}) {
      this.onRender = onRender;
      this.frames = [];
      this.index = 0;
      this.playing = false;
      this.timer = null;
      this.speed = speed;
      this._iconPlaying = null;

      const mk = (name, title, fn, cls = '') => {
        const b = el('button', { type: 'button', class: 'icon-btn ' + cls, title, onclick: fn });
        b.innerHTML = svgIcon(ICONS[name]);
        return b;
      };
      this.btnFirst = mk('first', 'Jump to start', () => { this.pause(); this.seek(0); });
      this.btnBack = mk('back', 'Step back (←)', () => this.stepBack());
      this.btnPlay = mk('play', 'Play / Pause (Space)', () => this.toggle(), 'play');
      this.btnFwd = mk('fwd', 'Step forward (→)', () => this.stepForward());
      this.btnLast = mk('last', 'Jump to end', () => { this.pause(); this.seek(this.frames.length - 1); });

      this.progress = el('input', { type: 'range', min: 0, max: 0, class: 'progress', title: 'Scrub through steps' });
      this.progress.value = 0;
      this.progress.addEventListener('input', () => { this.pause(); this.seek(+this.progress.value); });

      this.counter = el('span', { class: 'counter' }, 'step 0 / 0');

      const speedOut = el('b');
      this.speedInput = el('input', { type: 'range', min: 1, max: 100 });
      this.speedInput.value = speed;
      const setSpeedLabel = () => {
        const { delay, steps } = this.timing();
        const ms = delay / steps;
        speedOut.textContent = ms >= 10 ? `${Math.round(ms)} ms/step` : `${ms.toFixed(1)} ms/step`;
      };
      this.speedInput.addEventListener('input', () => {
        this.speed = +this.speedInput.value;
        setSpeedLabel();
        if (this.playing) this.schedule();
      });
      setSpeedLabel();

      container.append(
        el('div', { class: 'player-buttons' }, this.btnFirst, this.btnBack, this.btnPlay, this.btnFwd, this.btnLast),
        this.progress,
        this.counter,
        el('div', { class: 'field speed' }, el('span', { class: 'field-label' }, 'Speed', speedOut), this.speedInput)
      );
      this.updateUI();
    }

    /** Exponential speed curve: 1 → 900ms per step, 100 → ~2ms per step. */
    timing() {
      const d = 900 * Math.pow(0.94, this.speed - 1);
      if (d < 16) return { delay: 16, steps: Math.max(1, Math.round(16 / d)) };
      return { delay: d, steps: 1 };
    }

    load(frames, { autoplay = true } = {}) {
      this.pause();
      this.frames = frames || [];
      this.progress.max = Math.max(0, this.frames.length - 1);
      this.index = 0;
      if (this.frames.length) this.seek(0);
      if (autoplay && this.frames.length > 1) this.play();
      this.updateUI();
    }

    seek(i) {
      if (!this.frames.length) return;
      i = Math.max(0, Math.min(this.frames.length - 1, i));
      this.index = i;
      this.onRender(this.frames[i], i, this.frames);
      this.updateUI();
    }

    play() {
      if (this.frames.length < 2) return;
      if (this.index >= this.frames.length - 1) this.seek(0);
      this.playing = true;
      this.updateUI();
      this.schedule();
    }

    schedule() {
      clearTimeout(this.timer);
      const { delay, steps } = this.timing();
      this.timer = setTimeout(() => {
        if (!this.playing) return;
        const next = Math.min(this.index + steps, this.frames.length - 1);
        this.seek(next);
        if (next >= this.frames.length - 1) this.pause();
        else this.schedule();
      }, delay);
    }

    pause() {
      this.playing = false;
      clearTimeout(this.timer);
      this.updateUI();
    }

    toggle() { this.playing ? this.pause() : this.play(); }
    stepForward() { this.pause(); this.seek(this.index + 1); }
    stepBack() { this.pause(); this.seek(this.index - 1); }

    updateUI() {
      const n = this.frames.length;
      if (this._iconPlaying !== this.playing) {
        this._iconPlaying = this.playing;
        this.btnPlay.innerHTML = svgIcon(this.playing ? ICONS.pause : ICONS.play);
      }
      this.progress.value = this.index;
      this.counter.textContent = n ? `step ${this.index + 1} / ${n}` : 'step 0 / 0';
      const atStart = this.index <= 0;
      const atEnd = this.index >= n - 1;
      this.btnFirst.disabled = this.btnBack.disabled = atStart;
      this.btnFwd.disabled = this.btnLast.disabled = atEnd;
      this.btnPlay.disabled = n < 2;
    }
  }

  DSA.Player = Player;
})();
