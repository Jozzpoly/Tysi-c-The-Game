(() => {
  const base = window.__livingSliceV5;
  if (!base) throw new Error('Living Slice V7 requires V5 fixture');

  const trick = document.querySelector('.trick');
  const capture = document.querySelector('[data-anchor="captured:0"]');
  const handZone = document.querySelector('.hand-zone');
  const trace = [];
  let materialPhase = 'ready';
  let baseTraceLength = 0;
  let trickMemory = [];
  let residueTimer = null;
  let residueRemoveTimer = null;

  const log = (type, extra = {}) => trace.push({ type, t: Math.round(performance.now()), ...extra });

  function semanticPhase() {
    const snap = base.snapshot();
    const intent = document.body.dataset.playIntent || 'none';
    if (snap.phase === 'ready' && intent !== 'none') return 'intent';
    if (['pending','accepted','resolving','settled','source-replay'].includes(snap.phase)) return snap.phase;
    return 'ready';
  }

  function rememberPublicTrick() {
    const nodes = [...trick.querySelectorAll('.trick-card')];
    if (!nodes.length) return;
    const memory = nodes.map((node) => {
      const face = node.querySelector('.card-face');
      const corner = face?.querySelector('.corner');
      const rank = corner?.childNodes?.[0]?.textContent?.trim() || node.dataset.card || '?';
      const suit = corner?.querySelector('span')?.textContent?.trim() || '';
      return {
        card: node.dataset.card || rank + suit,
        rank,
        suit,
        red: Boolean(face?.classList.contains('red')),
      };
    });
    if (memory.length >= trickMemory.length) trickMemory = memory;
  }

  function makeResidue() {
    if (!capture || trickMemory.length < 3) return;
    capture.querySelector('.v7-recent-trick')?.remove();
    const residue = document.createElement('div');
    residue.className = 'v7-recent-trick';
    residue.dataset.cards = trickMemory.map((item) => item.card).join(',');
    for (const item of trickMemory.slice(0,3)) {
      const mini = document.createElement('div');
      mini.className = `v7-mini-card${item.red ? ' red' : ''}`;
      mini.textContent = item.rank;
      const suit = document.createElement('span');
      suit.textContent = item.suit;
      mini.appendChild(suit);
      residue.appendChild(mini);
    }
    capture.appendChild(residue);
    capture.classList.add('v7-has-residue');
    requestAnimationFrame(() => residue.classList.add('visible'));
    log('material-residue', { cards: trickMemory.map((item) => item.card) });

    clearTimeout(residueTimer);
    clearTimeout(residueRemoveTimer);
    residueTimer = window.setTimeout(() => residue.classList.add('fading'), 1250);
    residueRemoveTimer = window.setTimeout(() => {
      residue.remove();
      capture.classList.remove('v7-has-residue');
    }, 1650);
  }

  function decorateCaptureGhost(node) {
    if (!(node instanceof Element) || !node.classList.contains('capture-ghost')) return;
    node.classList.add('v7-material-ghost');
    // V5 writes opacity during its first animation frame. Reassert material
    // visibility afterwards without changing the canonical path or lifetime.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!node.isConnected) return;
      node.style.setProperty('opacity', '.54', 'important');
      log('material-capture-ghost', { card: node.dataset.card || null });
    }));
  }

  function setPhase(next) {
    if (next === materialPhase) return;
    const prior = materialPhase;
    materialPhase = next;
    document.body.dataset.materialPhase = next;
    log('material-phase', { from: prior, to: next });

    if (next === 'accepted' || next === 'resolving') rememberPublicTrick();
    if (next === 'settled') {
      makeResidue();
      handZone.classList.add('v7-initiative-return');
      window.setTimeout(() => handZone.classList.remove('v7-initiative-return'), 950);
    }
    if (next === 'ready' && prior !== 'source-replay') {
      document.body.dataset.materialReject = '0';
    }
  }

  function processTrace() {
    const events = base.snapshot().trace;
    if (baseTraceLength > events.length) baseTraceLength = 0;
    for (const event of events.slice(baseTraceLength)) {
      if (event.type === 'authority-reject') {
        document.body.dataset.materialReject = '1';
        const held = document.querySelector('.hand-card.held');
        held?.classList.add('v7-rejected');
        window.setTimeout(() => held?.classList.remove('v7-rejected'), 230);
        log('material-reject', { card: event.card || null });
      }
      if (event.type === 'captured-value') {
        rememberPublicTrick();
        // If phase observation lands after V5 removed the trick nodes, the
        // accepted-phase memory still supplies the public cards.
        makeResidue();
      }
      if (event.type === 'initiative') {
        handZone.classList.add('v7-initiative-return');
      }
    }
    baseTraceLength = events.length;
  }

  function refresh() {
    rememberPublicTrick();
    setPhase(semanticPhase());
    processTrace();
  }

  const bodyObserver = new MutationObserver(refresh);
  bodyObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-slice-state','data-play-intent','data-hand-assist'],
  });

  const trickObserver = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof Element && node.matches('.trick-card')) rememberPublicTrick();
      }
    }
    refresh();
  });
  trickObserver.observe(trick, { childList:true, subtree:true, attributes:true, attributeFilter:['style','class'] });

  const globalObserver = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) decorateCaptureGhost(node);
    }
  });
  globalObserver.observe(document.body, { childList:true });

  const baseSnapshot = base.snapshot.bind(base);
  window.__livingSliceV7 = {
    snapshot() {
      const snap = baseSnapshot();
      const residue = capture?.querySelector('.v7-recent-trick');
      const captureGhosts = [...document.querySelectorAll('.capture-ghost')];
      return {
        ...snap,
        version: 7,
        materialPhase,
        materialReject: document.body.dataset.materialReject === '1',
        trickMemory: trickMemory.map((item) => item.card),
        residue: residue ? {
          cards: residue.dataset.cards?.split(',').filter(Boolean) || [],
          visible: residue.classList.contains('visible'),
          fading: residue.classList.contains('fading'),
        } : null,
        materialCaptureGhosts: captureGhosts.map((node) => ({
          card: node.dataset.card || null,
          opacity: Number(getComputedStyle(node).opacity),
          material: node.classList.contains('v7-material-ghost'),
        })),
        materialTrace: trace.slice(),
      };
    },
    rejectNext: base.rejectNext,
    setTimingScale: base.setTimingScale,
    replayOpponentSources: base.replayOpponentSources,
    reset: base.reset,
    refresh,
  };

  document.body.dataset.fixtureVersion = '7';
  document.body.dataset.materialReject = '0';
  refresh();
  log('v7-ready');
})();