(() => {
  const hand = document.querySelector('[data-hand]');
  const handZone = document.querySelector('.hand-zone');
  const stateLabel = document.querySelector('[data-state-label]');
  const intentLabel = document.querySelector('[data-intent-label]');
  const fingerProxy = document.querySelector('[data-finger-proxy]');
  const contactThread = document.querySelector('[data-contact-thread]');
  const assistMode = document.body.dataset.assist || 'auto';

  const state = {
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
    trace: [],
  };

  const cards = () => [...hand.querySelectorAll('.hand-card:not(.placeholder)')];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const trace = (type, extra = {}) => state.trace.push({ type, t: Math.round(performance.now()), ...extra });

  function setState(name) {
    document.body.dataset.state = name;
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
    const zone = hand.getBoundingClientRect();
    if (y < zone.top - 25 || y > zone.bottom + 20) {
      clearField();
      return;
    }
    for (const card of cards()) {
      if (card === state.held) continue;
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const normalized = (cx - x) / Math.max(1, rect.width);
      const influence = Math.exp(-Math.abs(normalized) * 1.28);
      const direction = normalized < 0 ? -1 : 1;
      card.style.setProperty('--field-x', `${direction * 9 * influence}px`);
      card.style.setProperty('--field-y', `${-5 * influence}px`);
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
    if (y < zone.top - 24 || y > zone.bottom + 28) return;
    const live = [...hand.children].filter((node) => node !== state.placeholder && !node.classList.contains('held'));
    let before = null;
    for (const node of live) {
      const rect = node.getBoundingClientRect();
      if (x < rect.left + rect.width / 2) { before = node; break; }
    }
    if (before) hand.insertBefore(state.placeholder, before); else hand.appendChild(state.placeholder);
  }

  function setFingerDebug(x, y) {
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
      const angle = Math.atan2(-dx, dy) * 180 / Math.PI;
      contactThread.style.transform = `rotate(${angle}deg)`;
    } else {
      contactThread.classList.remove('active');
      contactThread.style.removeProperty('transform');
    }
  }

  function applyHeldPose(x, y) {
    const card = state.held;
    if (!card) return;
    const dx = x - state.startX;
    const rot = clamp(dx * .035, -6, 6);
    card.style.setProperty('--hold-left', `${x - state.grabX}px`);
    card.style.setProperty('--hold-top', `${y - state.grabY}px`);
    card.style.setProperty('--assist-x', `${state.assistX}px`);
    card.style.setProperty('--assist-y', `${state.assistY}px`);
    card.style.setProperty('--hold-rot', `${rot}deg`);
    card.classList.toggle('assisted', Math.hypot(state.assistX, state.assistY) > 1);
    setFingerDebug(x, y);
  }

  function edgeCorrection(rawLeft, width, margin = 8) {
    const minLeft = margin;
    const maxRight = innerWidth - margin;
    if (rawLeft < minLeft) return minLeft - rawLeft;
    if (rawLeft + width > maxRight) return maxRight - (rawLeft + width);
    return 0;
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

    // Horizontal correction is only allowed while the occlusion assistance is
    // already active. It is the minimum correction needed to keep the rendered
    // card inside an 8px viewport safety margin; clear contacts remain exact.
    const rawLeft = x - state.grabX;
    const safeX = progress > 0 ? edgeCorrection(rawLeft, width) : 0;
    state.assistX = safeX * progress;

    state.identityOcclusion = identityOcclusion(
      width, height, state.grabX, state.grabY, state.assistY,
    );
  }

  function updateIntent(x, y) {
    const card = state.held;
    if (!card) return;
    const zone = handZone.getBoundingClientRect();
    const threshold = zone.top - Math.min(76, Math.max(48, innerHeight * .065));
    state.playIntent = y < threshold;
    document.body.dataset.playIntent = state.playIntent ? (card.dataset.play === '1' ? 'legal' : 'illegal') : 'none';
    card.classList.toggle('illegal-probe', state.playIntent && card.dataset.play !== '1');
    if (state.playIntent) {
      clearField();
      intentLabel.textContent = card.dataset.play === '1'
        ? 'release would commit this card'
        : 'ta karta nie spełnia warunku zagrania';
      stateLabel.textContent = card.dataset.play === '1' ? 'zamiar zagrania' : 'próba niedozwolonej relacji';
    } else {
      intentLabel.textContent = 'przenieś kartę wyżej, aby sprawdzić zamiar zagrania';
      stateLabel.textContent = Math.hypot(state.assistX, state.assistY) > 1
        ? 'kontakt · adaptacyjne odsłonięcie'
        : 'kontakt · prywatna manipulacja';
    }
  }

  function beginHold(card, ev) {
    if (state.held) return;
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
    applyHeldPose(ev.clientX, ev.clientY);
    card.setPointerCapture?.(ev.pointerId);
    document.body.dataset.playIntent = 'none';
    setState('held');
    trace('hold-start', {
      card: card.dataset.card,
      pointerType: state.pointerType,
      grabX: +state.grabX.toFixed(2),
      grabY: +state.grabY.toFixed(2),
      assistTarget: state.assistTarget,
      identityOcclusion: +state.identityOcclusion.toFixed(3),
    });
  }

  function moveHold(ev) {
    if (!state.held || state.pointerId !== ev.pointerId) return;
    ev.preventDefault();
    state.x = ev.clientX;
    state.y = ev.clientY;
    updateAssist(ev.clientX, ev.clientY);
    applyHeldPose(ev.clientX, ev.clientY);
    updateIntent(ev.clientX, ev.clientY);
    if (!state.playIntent) {
      updateField(ev.clientX, ev.clientY);
      updateReorder(ev.clientX, ev.clientY);
    }
    trace('hold-move', {
      card: state.held.dataset.card,
      x: Math.round(ev.clientX),
      y: Math.round(ev.clientY),
      assistX: +state.assistX.toFixed(2),
      assistY: +state.assistY.toFixed(2),
      occlusion: +state.identityOcclusion.toFixed(3),
      playIntent: state.playIntent,
    });
  }

  function settleHeld(outcome) {
    const card = state.held;
    if (!card) return;
    if (state.placeholder?.parentNode) state.placeholder.replaceWith(card);
    card.classList.remove('held', 'assisted', 'illegal-probe');
    card.removeAttribute('style');
    clearField();
    fingerProxy.classList.remove('active');
    contactThread.classList.remove('active');
    contactThread.style.removeProperty('transform');
    document.body.dataset.playIntent = 'none';
    stateLabel.textContent = 'dotknij / przeciągnij / przełóż';
    intentLabel.textContent = 'przenieś kartę wyżej, aby sprawdzić zamiar zagrania';
    trace(outcome, { card: card.dataset.card, index: cards().indexOf(card) });
    state.held = null;
    state.placeholder = null;
    state.pointerId = null;
    state.pointerType = null;
    state.playIntent = false;
    state.assistX = 0;
    state.assistY = 0;
    state.assistTarget = 0;
    setState('ready');
  }

  function endHold(ev) {
    if (!state.held || state.pointerId !== ev.pointerId) return;
    ev.preventDefault();
    const card = state.held;
    if (state.playIntent) {
      if (card.dataset.play === '1') {
        trace('would-commit', {
          card: card.dataset.card,
          assistX: +state.assistX.toFixed(2),
          assistY: +state.assistY.toFixed(2),
        });
        settleHeld('play-intent-return');
      } else {
        trace('illegal-play-probe', { card: card.dataset.card });
        settleHeld('illegal-probe-return');
      }
      return;
    }
    settleHeld('reorder-settle');
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

  window.__handBodyV41 = {
    snapshot() {
      const placeholderRect = state.placeholder?.getBoundingClientRect();
      const heldRect = state.held?.getBoundingClientRect();
      return {
        version: '4.1',
        assistMode,
        state: document.body.dataset.state,
        playIntent: document.body.dataset.playIntent,
        order: cards().map((node) => node.dataset.card),
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
          rect: heldRect ? { left: heldRect.left, right: heldRect.right, top: heldRect.top, bottom: heldRect.bottom, width: heldRect.width, height: heldRect.height } : null,
        } : null,
        placeholder: placeholderRect ? {
          width: placeholderRect.width,
          height: placeholderRect.height,
          originCard: state.placeholder?.dataset.originCard || null,
        } : null,
        field: cards().map((node) => ({
          card: node.dataset.card,
          x: parseFloat(node.style.getPropertyValue('--field-x')) || 0,
          y: parseFloat(node.style.getPropertyValue('--field-y')) || 0,
        })),
        trace: state.trace.slice(),
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    },
  };

  trace('fixture-ready', { version: '4.1', assistMode, order: cards().map((node) => node.dataset.card) });
})();
