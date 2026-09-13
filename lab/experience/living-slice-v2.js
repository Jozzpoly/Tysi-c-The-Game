(() => {
  const hand = document.querySelector('[data-hand]');
  const handZone = document.querySelector('.hand-zone');
  const shared = document.querySelector('[data-anchor="trick:shared"]');
  const trick = document.querySelector('.trick');
  const note = document.querySelector('[data-scene-note]');
  const capture = document.querySelector('[data-anchor="captured:0"]');
  const capturePile = document.querySelector('[data-capture-pile]');
  const captured = document.querySelector('[data-captured-value]');
  const initiative = document.querySelector('[data-initiative]');
  const seat1 = document.querySelector('[data-anchor="seat:1"]');
  const seat2 = document.querySelector('[data-anchor="seat:2"]');

  const state = {
    phase: 'ready',
    held: null,
    placeholder: null,
    pointerId: null,
    playIntent: false,
    rejectNext: false,
    capturedValue: 40,
    matchScore: 340,
    timingScale: 1,
    trace: [],
  };

  const trace = (type, extra = {}) => state.trace.push({ type, t: Math.round(performance.now()), ...extra });
  const cards = () => [...hand.querySelectorAll('.hand-card:not(.placeholder)')];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const later = (ms, fn) => window.setTimeout(fn, ms * state.timingScale);

  function setPhase(phase) {
    state.phase = phase;
    document.body.dataset.sliceState = phase;
    trace('phase', { phase });
  }

  function clearField() {
    for (const card of cards()) {
      if (card === state.held) continue;
      card.style.removeProperty('--field-x');
      card.style.removeProperty('--field-y');
    }
  }

  function updateField(x, y) {
    const handRect = hand.getBoundingClientRect();
    if (y < handRect.top - 26 || y > handRect.bottom + 18) {
      clearField();
      return;
    }
    for (const card of cards()) {
      if (card === state.held) continue;
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const normalized = (cx - x) / Math.max(1, rect.width);
      const influence = Math.exp(-Math.abs(normalized) * 1.35);
      const direction = normalized < 0 ? -1 : 1;
      card.style.setProperty('--field-x', `${direction * 8 * influence}px`);
      card.style.setProperty('--field-y', `${-4.5 * influence}px`);
    }
  }

  function createPlaceholder(card) {
    const p = document.createElement('div');
    p.className = 'hand-card placeholder';
    const rect = card.getBoundingClientRect();
    p.style.width = `${rect.width}px`;
    p.style.height = `${rect.height}px`;
    return p;
  }

  function updateReorder(x, y) {
    const zone = hand.getBoundingClientRect();
    if (y < zone.top - 20 || !state.placeholder) return;
    const live = [...hand.children].filter((node) => node !== state.placeholder && !node.classList.contains('held'));
    let before = null;
    for (const node of live) {
      const rect = node.getBoundingClientRect();
      if (x < rect.left + rect.width / 2) { before = node; break; }
    }
    if (before) hand.insertBefore(state.placeholder, before); else hand.appendChild(state.placeholder);
  }

  function setHeldPose(card, x, y, dx = 0) {
    const rect = card.getBoundingClientRect();
    const w = rect.width || parseFloat(getComputedStyle(card).width);
    const h = rect.height || parseFloat(getComputedStyle(card).height);
    const rot = clamp(dx * .045, -7, 7);
    card.style.setProperty('--hold-x', `${x - w / 2}px`);
    card.style.setProperty('--hold-y', `${y - h * .62}px`);
    card.style.setProperty('--hold-rot', `${rot}deg`);
  }

  function resetSceneFeedback() {
    shared.classList.remove('receptive', 'blocked', 'closing');
    note.classList.remove('rule', 'quiet');
    if (state.phase === 'ready') note.textContent = 'Dwie karty są już w lewie.';
  }

  function beginHold(card, ev) {
    if (state.phase !== 'ready') return;
    state.held = card;
    state.pointerId = ev.pointerId;
    state.placeholder = createPlaceholder(card);
    hand.insertBefore(state.placeholder, card);
    const rect = card.getBoundingClientRect();
    card.dataset.startX = String(ev.clientX);
    card.style.width = `${rect.width}px`;
    card.style.height = `${rect.height}px`;
    card.classList.add('held');
    setHeldPose(card, ev.clientX, ev.clientY);
    card.setPointerCapture?.(ev.pointerId);
    trace('hold-start', { card: card.dataset.card, legalPlay: card.dataset.play === '1' });
  }

  function moveHold(ev) {
    const card = state.held;
    if (!card || state.pointerId !== ev.pointerId) return;
    const startX = Number(card.dataset.startX || ev.clientX);
    setHeldPose(card, ev.clientX, ev.clientY, ev.clientX - startX);
    updateField(ev.clientX, ev.clientY);
    const handRect = hand.getBoundingClientRect();
    const threshold = handRect.top - Math.min(72, Math.max(46, innerHeight * .065));
    state.playIntent = ev.clientY < threshold;
    card.classList.toggle('illegal-probe', state.playIntent && card.dataset.play !== '1');
    updateReorder(ev.clientX, ev.clientY);

    if (state.playIntent) {
      clearField();
      if (card.dataset.play === '1') {
        shared.classList.add('receptive');
        shared.classList.remove('blocked');
        note.classList.remove('rule', 'quiet');
        note.textContent = 'Puść, aby zagrać kartę.';
      } else {
        shared.classList.remove('receptive');
        shared.classList.add('blocked');
        note.classList.add('rule');
        note.classList.remove('quiet');
        note.textContent = 'W tej lewie musisz dołożyć ♥.';
      }
    } else {
      resetSceneFeedback();
    }
  }

  function settleBack(card, outcome) {
    const placeholder = state.placeholder;
    if (placeholder?.parentNode) placeholder.replaceWith(card);
    card.classList.remove('held', 'illegal-probe', 'pending');
    card.removeAttribute('style');
    clearField();
    trace(outcome, { card: card.dataset.card, index: cards().indexOf(card) });
    state.held = null;
    state.placeholder = null;
    state.pointerId = null;
    state.playIntent = false;
    resetSceneFeedback();
    setPhase('ready');
  }

  function semanticTargetRect() {
    const r = trick.getBoundingClientRect();
    const heldRect = state.held?.getBoundingClientRect();
    const w = heldRect?.width || 72;
    const h = heldRect?.height || w * 1.42;
    return { left: r.left + r.width / 2 - w / 2, top: r.top + r.height * .57 - h / 2 };
  }

  function commit(card) {
    setPhase('pending');
    card.classList.add('pending');
    shared.classList.remove('receptive');
    note.classList.remove('rule', 'quiet');
    note.textContent = 'Ruch oczekuje na potwierdzenie…';
    trace('commit', { card: card.dataset.card });
    const target = semanticTargetRect();
    card.style.transition = 'transform .20s cubic-bezier(.2,.72,.22,1), opacity .16s ease';
    card.style.setProperty('--hold-x', `${target.left}px`);
    card.style.setProperty('--hold-y', `${target.top}px`);
    card.style.setProperty('--hold-rot', '0deg');

    later(140, () => {
      if (state.rejectNext) {
        state.rejectNext = false;
        note.classList.add('rule');
        note.textContent = 'Ruch nie został przyjęty. Karta wraca do Twojej ręki.';
        trace('authority-reject', { card: card.dataset.card });
        later(170, () => settleBack(card, 'reject-settle'));
        return;
      }
      accept(card);
    });
  }

  function accept(card) {
    trace('authority-accept', { card: card.dataset.card });
    setPhase('accepted');
    state.placeholder?.remove();
    state.placeholder = null;
    state.held = null;
    state.pointerId = null;
    state.playIntent = false;
    card.remove();

    const played = document.createElement('div');
    played.className = 'trick-card self';
    played.dataset.anchor = 'trick-card:0';
    played.dataset.card = card.dataset.card;
    played.innerHTML = card.querySelector('.card-face').outerHTML;
    played.style.opacity = '0';
    trick.appendChild(played);
    requestAnimationFrame(() => { played.style.opacity = '1'; });
    note.textContent = 'Lewa zamknięta.';
    shared.classList.add('closing');
    later(170, resolveTrick);
  }

  function resolveTrick() {
    setPhase('resolving');
    trace('trick-completed', { winner: 0, points: 25 });
    note.classList.remove('quiet');
    note.textContent = 'Bierzesz lewę · 25 pkt w tym rozdaniu';
    const target = capture.getBoundingClientRect();
    const ghosts = [...trick.querySelectorAll('.trick-card')].map((node) => {
      const rect = node.getBoundingClientRect();
      const ghost = node.cloneNode(true);
      ghost.className = 'capture-ghost';
      ghost.style.left = `${rect.left}px`;
      ghost.style.top = `${rect.top}px`;
      ghost.style.transform = 'translate3d(0,0,0) scale(1)';
      document.body.appendChild(ghost);
      node.style.opacity = '0';
      return { ghost, rect };
    });
    requestAnimationFrame(() => {
      for (const { ghost, rect } of ghosts) {
        const dx = target.left - rect.left + 20;
        const dy = target.top - rect.top + 13;
        ghost.style.transform = `translate3d(${dx}px,${dy}px,0) scale(.34) rotate(4deg)`;
        ghost.style.opacity = '.10';
      }
    });

    later(310, () => {
      for (const { ghost } of ghosts) ghost.remove();
      trick.querySelectorAll('.trick-card').forEach((node) => node.remove());
      state.capturedValue = 65;
      captured.textContent = String(state.capturedValue);
      capture.classList.add('gain');
      capturePile.classList.add('recent');
      trace('captured-value', { before: 40, delta: 25, after: 65, matchScore: state.matchScore });
      initiative.textContent = 'Prowadzisz';
      handZone.classList.add('next-initiative');
      later(390, () => {
        setPhase('settled');
        trace('initiative', { seat: 0 });
        shared.classList.remove('closing');
        note.classList.add('quiet');
        later(720, () => capture.classList.remove('gain'));
        later(1100, () => capturePile.classList.remove('recent'));
      });
    });
  }

  function endHold(ev) {
    const card = state.held;
    if (!card || state.pointerId !== ev.pointerId) return;
    const wasPlayIntent = state.playIntent;
    const legal = card.dataset.play === '1';
    if (wasPlayIntent && legal) return commit(card);
    if (wasPlayIntent && !legal) {
      trace('illegal-play-probe', { card: card.dataset.card });
      return settleBack(card, 'illegal-probe-return');
    }
    settleBack(card, 'reorder-or-inspect-settle');
  }

  async function replayOpponentSources() {
    if (state.phase !== 'ready' || state.held) return false;
    const items = [
      { seat: 1, seatNode: seat1, node: trick.querySelector('[data-anchor="trick-card:1"]') },
      { seat: 2, seatNode: seat2, node: trick.querySelector('[data-anchor="trick-card:2"]') },
    ];
    if (items.some((item) => !item.node)) return false;
    setPhase('source-replay');
    note.textContent = 'Publiczne zagrania mają źródło przy stole.';
    for (const item of items) item.node.style.opacity = '0';

    for (const item of items) {
      const source = item.seatNode.querySelector('.seat-source').getBoundingClientRect();
      const dest = item.node.getBoundingClientRect();
      const ghost = item.node.cloneNode(true);
      ghost.className = 'source-ghost';
      ghost.style.left = `${source.left + source.width / 2 - dest.width / 2}px`;
      ghost.style.top = `${source.top + source.height / 2 - dest.height / 2}px`;
      ghost.style.transform = 'translate3d(0,0,0) scale(.64)';
      document.body.appendChild(ghost);
      item.seatNode.classList.add('action-source');
      trace('public-source-play', { seat: item.seat, card: item.node.dataset.card });
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          const dx = dest.left - parseFloat(ghost.style.left);
          const dy = dest.top - parseFloat(ghost.style.top);
          ghost.style.transform = `translate3d(${dx}px,${dy}px,0) scale(1)`;
        });
        later(250, resolve);
      });
      ghost.remove();
      item.node.style.opacity = '1';
      item.seatNode.classList.remove('action-source');
      await new Promise((resolve) => later(90, resolve));
    }
    note.textContent = 'Dwie karty są już w lewie.';
    setPhase('ready');
    return true;
  }

  hand.addEventListener('pointerdown', (ev) => {
    const card = ev.target.closest('.hand-card');
    if (!card || card.classList.contains('placeholder')) return;
    ev.preventDefault();
    beginHold(card, ev);
  });
  window.addEventListener('pointermove', moveHold, { passive: false });
  window.addEventListener('pointerup', endHold, { passive: false });
  window.addEventListener('pointercancel', endHold, { passive: false });

  window.__livingSlice = {
    snapshot() {
      return {
        version: 2,
        phase: state.phase,
        hand: cards().map((node) => node.dataset.card),
        playable: cards().filter((node) => node.dataset.play === '1').map((node) => node.dataset.card),
        capturedValue: state.capturedValue,
        matchScore: Number(document.querySelector('[data-match-score]').textContent),
        initiative: initiative.textContent,
        nextInitiativeVisual: handZone.classList.contains('next-initiative'),
        recentCaptureVisual: capturePile.classList.contains('recent'),
        trickCards: [...trick.querySelectorAll('.trick-card')].map((node) => node.dataset.card),
        trace: state.trace.slice(),
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    },
    rejectNext() { state.rejectNext = true; trace('inject-reject'); },
    setTimingScale(value) { state.timingScale = clamp(Number(value) || 1, .25, 8); trace('timing-scale', { value: state.timingScale }); },
    replayOpponentSources,
    reset() { location.reload(); },
  };

  trace('fixture-ready', { version: 2, hand: cards().map((node) => node.dataset.card) });
})();
