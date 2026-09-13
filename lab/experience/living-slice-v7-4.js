(() => {
  const base = window.__livingSliceV72;
  if (!base) throw new Error('Living Slice V7.4 requires V7.2 fixture');

  const shared = document.querySelector('[data-anchor="trick:shared"]');
  const trick = document.querySelector('.trick');
  const hand = document.querySelector('[data-hand]');
  const trace = [];

  let captureRaf = 0;
  let lastPending = null;
  let activeHandoff = null;
  let lastHandoff = null;
  let handoffFallback = null;

  const log = (type, extra = {}) => trace.push({ type, t:Math.round(performance.now()), ...extra });
  const rect = (node) => {
    if (!node) return null;
    const r = node.getBoundingClientRect();
    return { left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height, x:r.left+r.width/2, y:r.top+r.height/2 };
  };
  const dist = (a,b) => a && b ? Math.hypot(a.x-b.x,a.y-b.y) : null;
  const setStyleIfChanged = (node,name,value) => {
    if (node.style.getPropertyValue(name) !== value) node.style.setProperty(name,value);
  };

  function rawCardSize(node, measured) {
    const width = parseFloat(node?.style.width) || measured?.width || 60;
    const height = parseFloat(node?.style.height) || measured?.height || width*1.42;
    return { width, height };
  }

  function thresholdTarget(cardSize) {
    const s = shared.getBoundingClientRect();
    const width = cardSize?.width || 60;
    const height = cardSize?.height || width*1.42;
    const x = s.left+s.width*.50;
    const y = s.top+s.height*.80;
    return { left:x-width/2, top:y-height/2, width, height, x, y };
  }

  function controlledNodeForPhase(phase) {
    if (phase === 'pending') return document.querySelector('.hand-card.held.pending');
    if (phase === 'intent') return document.querySelector('.hand-card.held');
    return null;
  }

  function applyThreshold() {
    if (document.body.dataset.fixtureVersion !== '7.4') document.body.dataset.fixtureVersion = '7.4';
    const snap = base.snapshot();
    const node = controlledNodeForPhase(snap.materialPhase);
    if (!node) return;
    const measured = rect(node);
    const size = rawCardSize(node,measured);
    const threshold = thresholdTarget(size);
    setStyleIfChanged(node,'--v74-threshold-left',`${threshold.left.toFixed(3)}px`);
    setStyleIfChanged(node,'--v74-threshold-top',`${threshold.top.toFixed(3)}px`);
    setStyleIfChanged(node,'--v74-threshold-rot','-1.2deg');
  }

  function capturePendingFrame() {
    captureRaf = 0;
    const snap = base.snapshot();
    const node = document.querySelector('.hand-card.held.pending');
    if (snap.materialPhase !== 'pending' || !node) return;
    const measured = rect(node);
    if (measured) {
      const next = {
        card:node.dataset.card || null,
        rect:measured,
        faceHTML:node.querySelector('.card-face')?.outerHTML || '',
        capturedAt:performance.now(),
      };
      if (!lastPending || lastPending.card !== next.card || dist(lastPending.rect,next.rect)>.75) {
        log('pending-material-captured',{ card:next.card, x:+next.rect.x.toFixed(2), y:+next.rect.y.toFixed(2) });
      }
      lastPending = next;
    }
    captureRaf = requestAnimationFrame(capturePendingFrame);
  }

  function ensurePendingCapture() {
    if (!captureRaf) captureRaf = requestAnimationFrame(capturePendingFrame);
  }

  function visibleCopies(card) {
    if (!card) return 0;
    return [...document.querySelectorAll(`[data-card="${CSS.escape(card)}"]`)].filter((node) => {
      const style = getComputedStyle(node);
      const r = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity)>.05 && r.width>1 && r.height>1;
    }).length;
  }

  function finishHandoff(reason='transition-end') {
    const h = activeHandoff;
    if (!h) return;
    clearTimeout(handoffFallback);
    handoffFallback = null;

    if (!h.targetNode?.isConnected || !h.ghost?.isConnected) {
      h.targetNode?.classList.remove('v74-handoff-target');
      h.ghost?.remove();
      log('authority-handoff-aborted',{ card:h.card, reason:'node-missing' });
      activeHandoff = null;
      return;
    }

    const ghostRect = rect(h.ghost);
    const targetRect = rect(h.targetNode);
    const revealGap = dist(ghostRect,targetRect);
    const sizeGap = targetRect ? Math.max(Math.abs(ghostRect.width-targetRect.width),Math.abs(ghostRect.height-targetRect.height)) : Infinity;

    h.targetNode.style.opacity = '1';
    h.targetNode.classList.remove('v74-handoff-target');
    h.ghost.remove();

    lastHandoff = {
      card:h.card,
      phase:'settled',
      reason,
      startRect:h.startRect,
      targetRect,
      startGap:h.startGap,
      authorityTravel:h.authorityTravel,
      revealGap,
      sizeGap,
      visibleCopies:visibleCopies(h.card),
    };
    log('authority-handoff-settled',{
      card:h.card,
      authorityTravel:+h.authorityTravel.toFixed(2),
      revealGap:revealGap == null ? null : +revealGap.toFixed(2),
      sizeGap:Number.isFinite(sizeGap) ? +sizeGap.toFixed(2) : null,
      visibleCopies:lastHandoff.visibleCopies,
      reason,
    });
    activeHandoff = null;
  }

  function beginHandoff(targetNode) {
    if (!targetNode || targetNode.dataset.anchor !== 'trick-card:0') return;
    const card = targetNode.dataset.card || null;
    if (!lastPending || !card || lastPending.card !== card) {
      log('authority-handoff-missing-source',{ card, pendingCard:lastPending?.card || null });
      return;
    }

    if (activeHandoff) finishHandoff('superseded');
    document.body.dataset.fixtureVersion = '7.4';
    targetNode.classList.add('v74-handoff-target');
    const targetRect = rect(targetNode);
    const startRect = lastPending.rect;
    if (!targetRect || !startRect) {
      targetNode.classList.remove('v74-handoff-target');
      log('authority-handoff-missing-geometry',{ card });
      return;
    }

    const ghost = document.createElement('div');
    ghost.className = 'v74-handoff-ghost';
    ghost.dataset.card = card;
    ghost.dataset.authorityCarrier = '1';
    ghost.dataset.handoffStage = 'established';
    ghost.style.left = `${startRect.left}px`;
    ghost.style.top = `${startRect.top}px`;
    ghost.style.width = `${startRect.width}px`;
    ghost.style.height = `${startRect.height}px`;
    ghost.innerHTML = lastPending.faceHTML;
    document.body.appendChild(ghost);

    const establishedRect = rect(ghost);
    const startGap = dist(startRect,establishedRect);
    const dx = targetRect.left-startRect.left;
    const dy = targetRect.top-startRect.top;
    const sx = targetRect.width/startRect.width;
    const sy = targetRect.height/startRect.height;
    const authorityTravel = dist(startRect,targetRect);

    activeHandoff = {
      card,
      phase:'established',
      ghost,
      targetNode,
      startRect,
      targetRect,
      startGap,
      authorityTravel,
      dx,dy,sx,sy,
    };
    log('authority-handoff-established',{
      card,
      startGap:+startGap.toFixed(2),
      authorityTravel:+authorityTravel.toFixed(2),
      visibleCopies:visibleCopies(card),
    });

    ghost.addEventListener('transitionend',(event) => {
      if (event.propertyName === 'transform') finishHandoff('transition-end');
    },{ once:true });

    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!activeHandoff || activeHandoff.ghost !== ghost) return;
      ghost.dataset.handoffStage = 'moving';
      ghost.style.transform = `translate3d(${dx}px,${dy}px,0) scale(${sx},${sy})`;
      activeHandoff.phase = 'moving';
      log('authority-handoff-moving',{ card, visibleCopies:visibleCopies(card) });
    }));

    handoffFallback = window.setTimeout(() => finishHandoff('fallback'),165);
  }

  function forceSettleBeforeResolution() {
    const h = activeHandoff;
    if (!h) return;
    h.ghost.style.transition = 'none';
    h.ghost.style.transform = `translate3d(${h.dx}px,${h.dy}px,0) scale(${h.sx},${h.sy})`;
    finishHandoff('resolution-boundary');
  }

  function refresh() {
    document.body.dataset.fixtureVersion = '7.4';
    applyThreshold();
    const snap = base.snapshot();
    if (snap.materialPhase === 'pending') ensurePendingCapture();
    if (snap.materialPhase === 'resolving' && activeHandoff) forceSettleBeforeResolution();
  }

  const bodyObserver = new MutationObserver(refresh);
  bodyObserver.observe(document.body,{ attributes:true, attributeFilter:['data-slice-state','data-material-phase','data-play-intent'] });
  const handObserver = new MutationObserver(refresh);
  handObserver.observe(hand,{ childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
  const trickObserver = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof Element && node.matches('.trick-card.self[data-anchor="trick-card:0"]')) beginHandoff(node);
      }
    }
    refresh();
  });
  trickObserver.observe(trick,{ childList:true, subtree:false });
  window.addEventListener('resize',refresh);

  const baseSnapshot = base.snapshot.bind(base);
  window.__livingSliceV74 = {
    snapshot() {
      const snap = baseSnapshot();
      const controlledNode = controlledNodeForPhase(snap.materialPhase);
      const pendingNode = document.querySelector('.hand-card.held.pending');
      const acceptedNode = document.querySelector('[data-anchor="trick-card:0"]');
      const controlled = rect(controlledNode);
      const pending = rect(pendingNode);
      let threshold = null;
      if (controlledNode) threshold = thresholdTarget(rawCardSize(controlledNode,controlled));
      const active = activeHandoff ? {
        card:activeHandoff.card,
        phase:activeHandoff.phase,
        startRect:activeHandoff.startRect,
        targetRect:rect(activeHandoff.targetNode) || activeHandoff.targetRect,
        ghostRect:rect(activeHandoff.ghost),
        startGap:activeHandoff.startGap,
        authorityTravel:activeHandoff.authorityTravel,
        visibleCopies:visibleCopies(activeHandoff.card),
      } : null;
      return {
        ...snap,
        version:7.4,
        armedThreshold:controlled && threshold ? {
          phase:snap.materialPhase,
          held:controlled,
          threshold,
          objectThresholdError:dist(controlled,threshold),
          shared:rect(shared),
        } : null,
        authorityThreshold:pending && threshold ? {
          held:pending,
          threshold,
          thresholdError:dist(pending,threshold),
          shared:rect(shared),
        } : null,
        acceptedCard:rect(acceptedNode),
        identityHandoff:active || lastHandoff,
        handoffCarrierVisible:Boolean(document.querySelector('.v74-handoff-ghost')),
        v74Trace:trace.slice(),
      };
    },
    rejectNext:base.rejectNext,
    setTimingScale:base.setTimingScale,
    replayOpponentSources:base.replayOpponentSources,
    reset:base.reset,
    refresh,
  };

  document.body.dataset.fixtureVersion = '7.4';
  refresh();
  log('v7.4-ready');
})();
