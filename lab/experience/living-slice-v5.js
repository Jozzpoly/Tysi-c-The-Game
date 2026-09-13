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
  const fingerProxy = document.querySelector('[data-finger-proxy]');
  const contactThread = document.querySelector('[data-contact-thread]');
  const assistMode = document.body.dataset.assist || 'auto';

  const state = {
    phase: 'ready',
    held: null,
    placeholder: null,
    pointerId: null,
    pointerType: null,
    grabX: 0,
    grabY: 0,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    assistX: 0,
    assistY: 0,
    assistTarget: 0,
    identityOcclusion: 0,
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
  const sleepScaled = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms * state.timingScale));

  function setPhase(phase) {
    state.phase = phase;
    document.body.dataset.sliceState = phase;
    trace('phase', { phase, version: 5 });
  }

  function identityOcclusion(width, height, grabX, grabY, renderLift = 0) {
    const fingerRx = 20;
    const fingerRy = 24;
    const identityW = Math.min(23, width * .36);
    const identityH = Math.min(31, height * .365);
    let hidden = 0;
    let total = 0;
    for (let y = 0; y < identityH; y += 1.5) {
      for (let x = 0; x < identityW; x += 1.5) {
        total += 1;
        const dx = (x - grabX) / fingerRx;
        const dy = (y + renderLift - grabY) / fingerRy;
        if (dx * dx + dy * dy <= 1) hidden += 1;
      }
    }
    return total ? hidden / total : 0;
  }

  function adaptiveLift(width, height, grabX, grabY) {
    const baseline = identityOcclusion(width, height, grabX, grabY, 0);
    if (baseline <= .22) return { baseline, lift: 0, after: baseline };
    let lift = 0;
    let after = baseline;
    for (let candidate = 4; candidate <= 36; candidate += 2) {
      const next = identityOcclusion(width, height, grabX, grabY, -candidate);
      lift = candidate;
      after = next;
      if (next <= .12) break;
    }
    return { baseline, lift, after };
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

  function createPlaceholder(card, rect) {
    const p = document.createElement('div');
    p.className = 'hand-card placeholder';
    p.style.height = `${rect.height}px`;
    p.dataset.originCard = card.dataset.card || '';
    return p;
  }

  function updateReorder(x, y) {
    if (!state.placeholder) return;
    const zone = hand.getBoundingClientRect();
    if (y < zone.top - 20 || y > zone.bottom + 24) return;
    const live = [...hand.children].filter((node) => node !== state.placeholder && !node.classList.contains('held'));
    let before = null;
    for (const node of live) {
      const rect = node.getBoundingClientRect();
      if (x < rect.left + rect.width / 2) { before = node; break; }
    }
    if (before) hand.insertBefore(state.placeholder, before); else hand.appendChild(state.placeholder);
  }

  function edgeCorrection(rawLeft, width, margin = 8) {
    if (rawLeft < margin) return margin - rawLeft;
    const maxRight = innerWidth - margin;
    if (rawLeft + width > maxRight) return maxRight - (rawLeft + width);
    return 0;
  }

  function setFingerDebug(x, y) {
    if (!fingerProxy || !contactThread) return;
    fingerProxy.style.left = `${x}px`;
    fingerProxy.style.top = `${y}px`;
    fingerProxy.classList.add('active');
    const dx = state.assistX;
    const dy = state.assistY;
    const distance = Math.hypot(dx, dy);
    if (distance > 1) {
      contactThread.classList.add('active');
      contactThread.style.left = `${x}px`;
      contactThread.style.top = `${y}px`;
      contactThread.style.height = `${distance}px`;
      contactThread.style.transform = `rotate(${Math.atan2(-dx, dy) * 180 / Math.PI}deg)`;
    } else {
      contactThread.classList.remove('active');
      contactThread.style.removeProperty('transform');
    }
  }

  function updateAssist(x, y) {
    const card = state.held;
    if (!card) return;
    const width = parseFloat(card.style.width);
    const height = parseFloat(card.style.height);
    const move = Math.hypot(x - state.startX, y - state.startY);
    const touchLike = state.pointerType === 'touch';
    let progress = 0;
    if (assistMode === 'auto' && touchLike && state.assistTarget > 0 && move > 8) {
      progress = clamp((move - 8) / 16, 0, 1);
    }
    state.assistY = -state.assistTarget * progress;
    const rawLeft = x - state.grabX;
    state.assistX = (progress > 0 ? edgeCorrection(rawLeft, width) : 0) * progress;
    state.identityOcclusion = identityOcclusion(width, height, state.grabX, state.grabY, state.assistY);
    document.body.dataset.handAssist = Math.hypot(state.assistX, state.assistY) > 1 ? '1' : '0';
  }

  function setHeldPose(card, x, y, dx = 0) {
    const rot = clamp(dx * .045, -7, 7);
    card.style.setProperty('--hold-x', `${x - state.grabX + state.assistX}px`);
    card.style.setProperty('--hold-y', `${y - state.grabY + state.assistY}px`);
    card.style.setProperty('--hold-rot', `${rot}deg`);
    setFingerDebug(x, y);
  }

  function resetSceneFeedback() {
    shared.classList.remove('receptive', 'blocked', 'closing');
    note.classList.remove('rule', 'quiet');
    document.body.dataset.playIntent = 'none';
    if (state.phase === 'ready') note.textContent = 'Dwie karty są już w lewie.';
  }

  function updateIntent(card, x, y) {
    const handRect = hand.getBoundingClientRect();
    const threshold = handRect.top - Math.min(72, Math.max(46, innerHeight * .065));
    state.playIntent = y < threshold;
    document.body.dataset.playIntent = state.playIntent ? (card.dataset.play === '1' ? 'legal' : 'illegal') : 'none';
    card.classList.toggle('illegal-probe', state.playIntent && card.dataset.play !== '1');

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

  function beginHold(card, ev) {
    if (state.phase !== 'ready' || state.held) return;
    const rect = card.getBoundingClientRect();
    state.held = card;
    state.pointerId = ev.pointerId;
    state.pointerType = ev.pointerType || 'mouse';
    state.grabX = clamp(ev.clientX - rect.left, 0, rect.width);
    state.grabY = clamp(ev.clientY - rect.top, 0, rect.height);
    state.startX = state.x = ev.clientX;
    state.startY = state.y = ev.clientY;
    state.assistX = 0;
    state.assistY = 0;
    const assist = adaptiveLift(rect.width, rect.height, state.grabX, state.grabY);
    state.assistTarget = assistMode === 'auto' ? assist.lift : 0;
    state.identityOcclusion = assist.baseline;
    state.playIntent = false;

    state.placeholder = createPlaceholder(card, rect);
    hand.insertBefore(state.placeholder, card);
    card.style.width = `${rect.width}px`;
    card.style.height = `${rect.height}px`;
    card.classList.add('held');
    setHeldPose(card, ev.clientX, ev.clientY);
    card.setPointerCapture?.(ev.pointerId);
    trace('hold-start', {
      card: card.dataset.card,
      legalPlay: card.dataset.play === '1',
      pointerType: state.pointerType,
      grabX: +state.grabX.toFixed(2),
      grabY: +state.grabY.toFixed(2),
      assistTarget: state.assistTarget,
      identityOcclusion: +state.identityOcclusion.toFixed(3),
    });
  }

  function moveHold(ev) {
    const card = state.held;
    if (!card || state.pointerId !== ev.pointerId) return;
    ev.preventDefault();
    state.x = ev.clientX;
    state.y = ev.clientY;
    updateAssist(ev.clientX, ev.clientY);
    setHeldPose(card, ev.clientX, ev.clientY, ev.clientX - state.startX);
    updateIntent(card, ev.clientX, ev.clientY);
    if (!state.playIntent) {
      updateField(ev.clientX, ev.clientY);
      updateReorder(ev.clientX, ev.clientY);
    }
    trace('hold-move', {
      card: card.dataset.card,
      x: Math.round(ev.clientX),
      y: Math.round(ev.clientY),
      assistX: +state.assistX.toFixed(2),
      assistY: +state.assistY.toFixed(2),
      occlusion: +state.identityOcclusion.toFixed(3),
      playIntent: state.playIntent,
    });
  }

  function clearHandDebug() {
    fingerProxy?.classList.remove('active');
    contactThread?.classList.remove('active');
    contactThread?.style.removeProperty('transform');
    document.body.dataset.handAssist = '0';
    document.body.dataset.playIntent = 'none';
  }

  function settleBack(card, outcome) {
    const placeholder = state.placeholder;
    if (placeholder?.parentNode) placeholder.replaceWith(card);
    card.classList.remove('held', 'illegal-probe', 'pending');
    card.removeAttribute('style');
    clearField();
    clearHandDebug();
    trace(outcome, { card: card.dataset.card, index: cards().indexOf(card) });
    state.held = null;
    state.placeholder = null;
    state.pointerId = null;
    state.pointerType = null;
    state.playIntent = false;
    state.assistX = 0;
    state.assistY = 0;
    state.assistTarget = 0;
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
    clearField();
    clearHandDebug();
    state.assistX = 0;
    state.assistY = 0;
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
    state.pointerType = null;
    state.playIntent = false;
    clearHandDebug();
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
    ev.preventDefault();
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
    if (items.some((item) => !item.node || !item.seatNode)) return false;

    const priorPointerEvents = hand.style.pointerEvents;
    hand.style.pointerEvents = 'none';
    setPhase('source-replay');
    note.textContent = 'Publiczne zagrania mają źródło przy stole.';
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

        const initialGhost = ghost.getBoundingClientRect();
        const sourceCenterX = source.left + source.width / 2;
        const sourceCenterY = source.top + source.height / 2;
        const ghostCenterX = initialGhost.left + initialGhost.width / 2;
        const ghostCenterY = initialGhost.top + initialGhost.height / 2;
        ghost.style.left = `${sourceCenterX - ghostCenterX}px`;
        ghost.style.top = `${sourceCenterY - ghostCenterY}px`;

        item.seatNode.classList.add('action-source');
        trace('public-source-play', { seat: item.seat, card: item.node.dataset.card, version: 5 });
        trace('source-establish', { seat: item.seat, card: item.node.dataset.card, version: 5 });
        await sleepScaled(55);

        await new Promise((resolve) => {
          requestAnimationFrame(() => {
            ghost.dataset.flight = 'moving';
            trace('source-flight', { seat: item.seat, card: item.node.dataset.card, version: 5 });
            const from = ghost.getBoundingClientRect();
            const fromCenterX = from.left + from.width / 2;
            const fromCenterY = from.top + from.height / 2;
            const destCenterX = dest.left + dest.width / 2;
            const destCenterY = dest.top + dest.height / 2;
            ghost.style.transform = `translate3d(${destCenterX - fromCenterX}px,${destCenterY - fromCenterY}px,0) scale(1)`;
            resolve();
          });
        });
        await sleepScaled(250);
        trace('source-arrival', { seat: item.seat, card: item.node.dataset.card, version: 5 });
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
      setPhase('ready');
    }
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

  window.__livingSliceV5 = {
    snapshot() {
      const heldRect = state.held?.getBoundingClientRect();
      const placeholderRect = state.placeholder?.getBoundingClientRect();
      return {
        version: 5,
        phase: state.phase,
        hand: cards().map((node) => node.dataset.card),
        playable: cards().filter((node) => node.dataset.play === '1').map((node) => node.dataset.card),
        held: state.held ? {
          card: state.held.dataset.card,
          pointerType: state.pointerType,
          grabX: state.grabX,
          grabY: state.grabY,
          x: state.x,
          y: state.y,
          assistX: state.assistX,
          assistY: state.assistY,
          assistTarget: state.assistTarget,
          identityOcclusion: state.identityOcclusion,
          rect: heldRect ? { left:heldRect.left, right:heldRect.right, top:heldRect.top, bottom:heldRect.bottom, width:heldRect.width, height:heldRect.height } : null,
        } : null,
        placeholder: placeholderRect ? { width:placeholderRect.width, height:placeholderRect.height, originCard:state.placeholder?.dataset.originCard || null } : null,
        field: cards().map((node) => ({
          card: node.dataset.card,
          x: parseFloat(node.style.getPropertyValue('--field-x')) || 0,
          y: parseFloat(node.style.getPropertyValue('--field-y')) || 0,
        })),
        playIntent: document.body.dataset.playIntent || 'none',
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
    rejectNext() { state.rejectNext = true; trace('inject-reject', { version:5 }); },
    setTimingScale(value) { state.timingScale = clamp(Number(value) || 1, .25, 8); trace('timing-scale', { value:state.timingScale, version:5 }); },
    replayOpponentSources,
    reset() { location.reload(); },
  };

  trace('fixture-ready', { version: 5, hand: cards().map((node) => node.dataset.card) });
})();
