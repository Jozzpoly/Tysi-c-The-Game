(() => {
  const api = window.__livingSlice;
  if (!api) throw new Error('Living Slice v3 requires v2 base fixture');

  const hand = document.querySelector('[data-hand]');
  const note = document.querySelector('[data-scene-note]');
  const trick = document.querySelector('.trick');
  const seat1 = document.querySelector('[data-anchor="seat:1"]');
  const seat2 = document.querySelector('[data-anchor="seat:2"]');

  const baseSnapshot = api.snapshot.bind(api);
  const baseSetTimingScale = api.setTimingScale.bind(api);
  const v3Trace = [];
  let timingScale = 1;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const trace = (type, extra = {}) => v3Trace.push({ type, t: Math.round(performance.now()), ...extra });
  const sleepScaled = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms * timingScale));

  function combinedTrace() {
    return [...baseSnapshot().trace, ...v3Trace].sort((a, b) => a.t - b.t);
  }

  api.setTimingScale = (value) => {
    timingScale = clamp(Number(value) || 1, .25, 8);
    baseSetTimingScale(timingScale);
  };

  api.snapshot = () => {
    const base = baseSnapshot();
    return {
      ...base,
      version: 3,
      phase: document.body.dataset.sliceState || base.phase,
      trace: combinedTrace(),
    };
  };

  api.replayOpponentSources = async () => {
    const snap = baseSnapshot();
    if (snap.phase !== 'ready' || document.querySelector('.hand-card.held')) return false;

    const items = [
      { seat: 1, seatNode: seat1, node: trick.querySelector('[data-anchor="trick-card:1"]') },
      { seat: 2, seatNode: seat2, node: trick.querySelector('[data-anchor="trick-card:2"]') },
    ];
    if (items.some((item) => !item.node || !item.seatNode)) return false;

    const priorPointerEvents = hand.style.pointerEvents;
    hand.style.pointerEvents = 'none';
    document.body.dataset.sliceState = 'source-replay';
    note.textContent = 'Publiczne zagrania mają źródło przy stole.';
    trace('phase', { phase: 'source-replay', version: 3 });

    for (const item of items) item.node.style.opacity = '0';

    try {
      for (const item of items) {
        const sourceNode = item.seatNode.querySelector('.seat-source');
        const source = sourceNode.getBoundingClientRect();
        const dest = item.node.getBoundingClientRect();
        const ghost = item.node.cloneNode(true);

        ghost.className = 'source-ghost';
        ghost.style.opacity = '';
        ghost.style.left = '0px';
        ghost.style.top = '0px';
        ghost.style.transformOrigin = '50% 50%';
        ghost.style.transform = 'translate3d(0,0,0) scale(.64)';
        ghost.dataset.flight = 'establish';
        ghost.dataset.sourceSeat = String(item.seat);
        document.body.appendChild(ghost);

        // Align from the ghost's actual rendered box rather than assuming that
        // its scaled box matches the destination card dimensions.
        const initialGhost = ghost.getBoundingClientRect();
        const sourceCenterX = source.left + source.width / 2;
        const sourceCenterY = source.top + source.height / 2;
        const ghostCenterX = initialGhost.left + initialGhost.width / 2;
        const ghostCenterY = initialGhost.top + initialGhost.height / 2;
        ghost.style.left = `${sourceCenterX - ghostCenterX}px`;
        ghost.style.top = `${sourceCenterY - ghostCenterY}px`;

        item.seatNode.classList.add('action-source');
        trace('public-source-play', { seat: item.seat, card: item.node.dataset.card, version: 3 });
        trace('source-establish', { seat: item.seat, card: item.node.dataset.card });

        // Briefly let the card perceptually belong to the actor before transfer.
        await sleepScaled(55);

        await new Promise((resolve) => {
          requestAnimationFrame(() => {
            ghost.dataset.flight = 'moving';
            trace('source-flight', { seat: item.seat, card: item.node.dataset.card });
            const from = ghost.getBoundingClientRect();
            const fromCenterX = from.left + from.width / 2;
            const fromCenterY = from.top + from.height / 2;
            const destCenterX = dest.left + dest.width / 2;
            const destCenterY = dest.top + dest.height / 2;
            ghost.style.transform = `translate3d(${destCenterX - fromCenterX}px,${destCenterY - fromCenterY}px,0) scale(1)`;
            resolve();
          });
        });

        // Keep the semantic hold long enough for slowed research capture while
        // the actual CSS motion remains short and game-like at normal speed.
        await sleepScaled(250);
        trace('source-arrival', { seat: item.seat, card: item.node.dataset.card });
        ghost.remove();
        item.node.style.opacity = '1';
        item.seatNode.classList.remove('action-source');
        await sleepScaled(90);
      }
    } finally {
      for (const item of items) item.node.style.opacity = '1';
      items.forEach((item) => item.seatNode.classList.remove('action-source'));
      document.querySelectorAll('.source-ghost').forEach((node) => node.remove());
      hand.style.pointerEvents = priorPointerEvents;
      note.textContent = 'Dwie karty są już w lewie.';
      document.body.dataset.sliceState = 'ready';
      trace('phase', { phase: 'ready', version: 3 });
    }

    return true;
  };

  document.body.dataset.fixtureVersion = '3';
  trace('fixture-upgrade', { version: 3 });
})();
