(() => {
  const base = window.__livingSliceV72;
  if (!base) throw new Error('Living Slice V7.3 requires V7.2 fixture');

  const shared = document.querySelector('[data-anchor="trick:shared"]');
  const trick = document.querySelector('.trick');
  const hand = document.querySelector('[data-hand]');
  const trace = [];
  let lastThreshold = null;

  const log = (type, extra = {}) => trace.push({ type, t: Math.round(performance.now()), ...extra });
  const rect = (node) => {
    if (!node) return null;
    const r = node.getBoundingClientRect();
    return { left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height, x:r.left+r.width/2, y:r.top+r.height/2 };
  };
  const setStyleIfChanged = (node, name, value) => {
    if (node.style.getPropertyValue(name) !== value) node.style.setProperty(name, value);
  };

  function rawCardSize(node, measured) {
    const width = parseFloat(node?.style.width) || measured?.width || 60;
    const height = parseFloat(node?.style.height) || measured?.height || width * 1.42;
    return { width, height };
  }

  function finalTarget(cardRect) {
    const r = trick.getBoundingClientRect();
    const w = cardRect?.width || 60;
    const h = cardRect?.height || w * 1.42;
    return {
      left:r.left+r.width/2-w/2,
      top:r.top+r.height*.57-h/2,
      width:w,
      height:h,
      x:r.left+r.width/2,
      y:r.top+r.height*.57,
    };
  }

  function thresholdTarget(cardRect) {
    const s = shared.getBoundingClientRect();
    const w = cardRect?.width || 60;
    const h = cardRect?.height || w * 1.42;
    // Near-side ingress: materially inside the shared field, but well outside
    // the canonical third-card seat. Scales with the scene on desktop/mobile.
    const x = s.left + s.width * .50;
    const y = s.top + s.height * .80;
    return { left:x-w/2, top:y-h/2, width:w, height:h, x, y };
  }

  function thresholdNodeForPhase(phase) {
    if (phase === 'pending') return document.querySelector('.hand-card.held.pending');
    if (phase === 'intent') return document.querySelector('.hand-card.held');
    return null;
  }

  function applyThreshold() {
    if (document.body.dataset.fixtureVersion !== '7.3') document.body.dataset.fixtureVersion = '7.3';
    const snap = base.snapshot();
    const phase = snap.materialPhase;
    const heldNode = thresholdNodeForPhase(phase);
    if (!heldNode) return;

    const measured = rect(heldNode);
    const size = rawCardSize(heldNode, measured);
    const threshold = thresholdTarget(size);
    const final = finalTarget(size);

    // Arm the threshold while the card is still directly controlled. CSS does
    // not consume these variables until .pending exists, so intent remains
    // exact-grab. On commit the pending selector already has its destination
    // and never needs to fall through to V5's canonical trick target.
    setStyleIfChanged(heldNode, '--v73-threshold-left', `${threshold.left.toFixed(3)}px`);
    setStyleIfChanged(heldNode, '--v73-threshold-top', `${threshold.top.toFixed(3)}px`);
    setStyleIfChanged(heldNode, '--v73-threshold-rot', '-1.2deg');

    const next = {
      threshold,
      final,
      authorityTravel:Math.hypot(threshold.x-final.x, threshold.y-final.y),
      verticalAuthorityTravel:threshold.y-final.y,
    };
    if (!lastThreshold || Math.abs(lastThreshold.authorityTravel-next.authorityTravel)>.5) {
      log(phase === 'intent' ? 'authority-threshold-armed' : 'authority-threshold', {
        authorityTravel:+next.authorityTravel.toFixed(2),
        verticalAuthorityTravel:+next.verticalAuthorityTravel.toFixed(2),
      });
    }
    lastThreshold = next;
  }

  const observer = new MutationObserver(applyThreshold);
  observer.observe(document.body, { attributes:true, attributeFilter:['data-slice-state','data-material-phase','data-play-intent'] });
  observer.observe(hand, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
  window.addEventListener('resize', applyThreshold);

  const baseSnapshot = base.snapshot.bind(base);
  window.__livingSliceV73 = {
    snapshot() {
      const snap = baseSnapshot();
      const controlledNode = thresholdNodeForPhase(snap.materialPhase);
      const pendingNode = document.querySelector('.hand-card.held.pending');
      const acceptedNode = document.querySelector('[data-anchor="trick-card:0"]');
      const controlled = rect(controlledNode);
      const pending = rect(pendingNode);
      const accepted = rect(acceptedNode);
      let threshold = null;
      let final = null;
      if (controlledNode) {
        const size = rawCardSize(controlledNode, controlled);
        threshold = thresholdTarget(size);
        final = finalTarget(size);
      }
      return {
        ...snap,
        version:7.3,
        armedThreshold:controlled && threshold && final ? {
          phase:snap.materialPhase,
          held:controlled,
          threshold,
          final,
          objectThresholdError:Math.hypot(controlled.x-threshold.x, controlled.y-threshold.y),
          authorityTravel:Math.hypot(threshold.x-final.x, threshold.y-final.y),
          verticalAuthorityTravel:threshold.y-final.y,
          shared:rect(shared),
        } : null,
        authorityThreshold:pending && threshold && final ? {
          held:pending,
          threshold,
          final,
          thresholdError:Math.hypot(pending.x-threshold.x, pending.y-threshold.y),
          authorityTravel:Math.hypot(threshold.x-final.x, threshold.y-final.y),
          verticalAuthorityTravel:threshold.y-final.y,
          shared:rect(shared),
        } : null,
        acceptedCard:accepted,
        v73Trace:trace.slice(),
      };
    },
    rejectNext:base.rejectNext,
    setTimingScale:base.setTimingScale,
    replayOpponentSources:base.replayOpponentSources,
    reset:base.reset,
    refresh(){ base.refresh?.(); applyThreshold(); },
  };

  document.body.dataset.fixtureVersion = '7.3';
  applyThreshold();
  log('v7.3-ready');
})();
