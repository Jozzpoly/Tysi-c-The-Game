(() => {
  const base = window.__livingSliceV7;
  if (!base) throw new Error('Living Slice V7.2 requires V7 fixture');

  const trick = document.querySelector('.trick');
  const trace = [];
  let lastPending = null;

  const log = (type, extra = {}) => trace.push({ type, t: Math.round(performance.now()), ...extra });
  const rect = (node) => {
    if (!node) return null;
    const r = node.getBoundingClientRect();
    return { left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height, x:r.left+r.width/2, y:r.top+r.height/2 };
  };

  function finalSelfTarget(cardRect) {
    const r = trick.getBoundingClientRect();
    const w = cardRect?.width || 60;
    const h = cardRect?.height || w * 1.42;
    return {
      left: r.left + r.width / 2 - w / 2,
      top: r.top + r.height * .57 - h / 2,
      width:w,
      height:h,
      x:r.left+r.width/2,
      y:r.top+r.height*.57,
    };
  }

  function refresh() {
    document.body.dataset.fixtureVersion = '7.2';
    const snap = base.snapshot();
    if (snap.materialPhase === 'pending') {
      const held = rect(document.querySelector('.hand-card.held.pending'));
      if (held) {
        const target = finalSelfTarget({ width:parseFloat(document.querySelector('.hand-card.held.pending')?.style.width) || held.width/1.035, height:parseFloat(document.querySelector('.hand-card.held.pending')?.style.height) || held.height/1.035 });
        const pending = {
          centerOffset: Math.hypot(held.x-target.x, held.y-target.y),
          verticalOffset: held.y-target.y,
          held,
          target,
        };
        if (!lastPending || Math.abs(lastPending.verticalOffset-pending.verticalOffset) > .5) {
          log('pending-dock', { centerOffset:+pending.centerOffset.toFixed(2), verticalOffset:+pending.verticalOffset.toFixed(2) });
        }
        lastPending = pending;
      }
    }
  }

  const observer = new MutationObserver(refresh);
  observer.observe(document.body, { attributes:true, attributeFilter:['data-slice-state','data-material-phase','data-play-intent'] });
  observer.observe(document.querySelector('[data-hand]'), { childList:true, subtree:true, attributes:true, attributeFilter:['class','style'] });
  observer.observe(trick, { childList:true, subtree:true, attributes:true, attributeFilter:['class','style'] });
  window.addEventListener('resize', refresh);

  const baseSnapshot = base.snapshot.bind(base);
  window.__livingSliceV72 = {
    snapshot() {
      const snap = baseSnapshot();
      const heldNode = document.querySelector('.hand-card.held.pending');
      const selfNode = document.querySelector('[data-anchor="trick-card:0"]');
      const held = rect(heldNode);
      const accepted = rect(selfNode);
      const target = heldNode ? finalSelfTarget({ width:parseFloat(heldNode.style.width) || held?.width/1.035, height:parseFloat(heldNode.style.height) || held?.height/1.035 }) : null;
      return {
        ...snap,
        version:7.2,
        pendingDock: held && target ? {
          held,
          target,
          centerOffset:Math.hypot(held.x-target.x,held.y-target.y),
          verticalOffset:held.y-target.y,
        } : null,
        acceptedCard:accepted,
        v72Trace:trace.slice(),
      };
    },
    rejectNext:base.rejectNext,
    setTimingScale:base.setTimingScale,
    replayOpponentSources:base.replayOpponentSources,
    reset:base.reset,
    refresh,
  };

  document.body.dataset.fixtureVersion = '7.2';
  refresh();
  log('v7.2-ready');
})();