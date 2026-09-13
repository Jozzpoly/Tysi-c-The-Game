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

  function applyThreshold() {
    if (document.body.dataset.fixtureVersion !== '7.3') document.body.dataset.fixtureVersion = '7.3';
    const heldNode = document.querySelector('.hand-card.held.pending');
    const snap = base.snapshot();
    if (!heldNode || snap.materialPhase !== 'pending') return;

    const natural = rect(heldNode);
    const rawW = parseFloat(heldNode.style.width) || natural?.width || 60;
    const rawH = parseFloat(heldNode.style.height) || natural?.height || rawW*1.42;
    const threshold = thresholdTarget({ width:rawW, height:rawH });
    const final = finalTarget({ width:rawW, height:rawH });

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
      log('authority-threshold', {
        authorityTravel:+next.authorityTravel.toFixed(2),
        verticalAuthorityTravel:+next.verticalAuthorityTravel.toFixed(2),
      });
    }
    lastThreshold = next;
  }

  const observer = new MutationObserver(applyThreshold);
  // Observe semantic state/class transitions only. V7.3 writes inline custom
  // properties itself; observing style would create a feedback loop.
  observer.observe(document.body, { attributes:true, attributeFilter:['data-slice-state','data-material-phase','data-play-intent'] });
  observer.observe(hand, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
  window.addEventListener('resize', applyThreshold);

  const baseSnapshot = base.snapshot.bind(base);
  window.__livingSliceV73 = {
    snapshot() {
      const snap = baseSnapshot();
      const heldNode = document.querySelector('.hand-card.held.pending');
      const acceptedNode = document.querySelector('[data-anchor="trick-card:0"]');
      const held = rect(heldNode);
      const accepted = rect(acceptedNode);
      let threshold = null;
      let final = null;
      if (heldNode) {
        const rawW = parseFloat(heldNode.style.width) || held?.width || 60;
        const rawH = parseFloat(heldNode.style.height) || held?.height || rawW*1.42;
        threshold = thresholdTarget({ width:rawW, height:rawH });
        final = finalTarget({ width:rawW, height:rawH });
      }
      return {
        ...snap,
        version:7.3,
        authorityThreshold:held && threshold && final ? {
          held,
          threshold,
          final,
          thresholdError:Math.hypot(held.x-threshold.x, held.y-threshold.y),
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
