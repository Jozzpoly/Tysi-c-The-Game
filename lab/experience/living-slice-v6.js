(() => {
  const base = window.__livingSliceV5;
  if (!base) throw new Error('Living Slice V6 requires V5 fixture');

  const params = new URLSearchParams(location.search);
  const sentence = ['a','b','c'].includes(params.get('sentence')) ? params.get('sentence') : 'c';
  document.body.dataset.sentence = sentence;

  const layer = document.createElement('div');
  layer.className = 'v6-layer';
  layer.innerHTML = `
    <div class="v6-authority-seal" data-v6-authority-seal></div>
    <div class="v6-intent-thread" data-v6-intent-thread></div>
    <div class="v6-impact-core" data-v6-impact-core></div>
    <div class="v6-capture-thread" data-v6-capture-thread></div>
    <div class="v6-consequence-echo" data-v6-consequence-echo></div>
  `;
  document.body.appendChild(layer);

  const seal = layer.querySelector('[data-v6-authority-seal]');
  const intentThread = layer.querySelector('[data-v6-intent-thread]');
  const impact = layer.querySelector('[data-v6-impact-core]');
  const captureThread = layer.querySelector('[data-v6-capture-thread]');
  const echo = layer.querySelector('[data-v6-consequence-echo]');
  const shared = document.querySelector('[data-anchor="trick:shared"]');
  const capture = document.querySelector('[data-anchor="captured:0"]');
  const v6Trace = [];
  let lastPhase = null;

  const trace = (type, extra = {}) => v6Trace.push({ type, t: Math.round(performance.now()), sentence, ...extra });
  const center = (node) => {
    if (!node) return null;
    const r = node.getBoundingClientRect();
    return { x:r.left+r.width/2, y:r.top+r.height/2, left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height };
  };

  function setPoint(node, p) {
    if (!p) return;
    node.style.left = `${p.x}px`;
    node.style.top = `${p.y}px`;
  }

  function setLine(node, a, b) {
    if (!a || !b) { node.style.width='0px'; return; }
    const dx=b.x-a.x, dy=b.y-a.y;
    const length=Math.hypot(dx,dy);
    const angle=Math.atan2(dy,dx)*180/Math.PI;
    node.style.left=`${a.x}px`;
    node.style.top=`${a.y}px`;
    node.style.width=`${length}px`;
    node.style.transform=`rotate(${angle}deg)`;
  }

  function semanticPhase() {
    const snap = base.snapshot();
    const intent = document.body.dataset.playIntent || 'none';
    if (snap.phase === 'ready' && intent !== 'none') return 'intent';
    if (snap.phase === 'pending') return 'pending';
    if (snap.phase === 'accepted') return 'accepted';
    if (snap.phase === 'resolving') return 'resolving';
    if (snap.phase === 'settled') return 'settled';
    if (snap.phase === 'source-replay') return 'source-replay';
    return 'ready';
  }

  function refresh() {
    const snap = base.snapshot();
    const phase = semanticPhase();
    document.body.dataset.v6Phase = phase;

    if (phase !== lastPhase) {
      trace('sentence-phase', { from:lastPhase, to:phase, basePhase:snap.phase, playIntent:snap.playIntent });
      lastPhase = phase;
    }

    const held = document.querySelector('.hand-card.held');
    const placeholder = document.querySelector('.hand-card.placeholder');
    const selfTrick = document.querySelector('[data-anchor="trick-card:0"]');
    const sharedPoint = center(shared);
    const capturePoint = center(capture);
    const heldPoint = center(held);
    const placeholderPoint = center(placeholder);
    const trickPoint = center(selfTrick) || sharedPoint;

    setPoint(seal, heldPoint || trickPoint);
    setPoint(impact, trickPoint || sharedPoint);
    setPoint(echo, sharedPoint);

    if (phase === 'intent') setLine(intentThread, placeholderPoint, heldPoint);
    else intentThread.style.width = '0px';

    if (phase === 'resolving' || phase === 'settled') setLine(captureThread, trickPoint || sharedPoint, capturePoint);
    else captureThread.style.width = '0px';
  }

  const observer = new MutationObserver(refresh);
  observer.observe(document.body, { attributes:true, attributeFilter:['data-slice-state','data-play-intent','data-hand-assist'], subtree:false });
  observer.observe(document.querySelector('[data-hand]'), { childList:true, subtree:true, attributes:true, attributeFilter:['class','style'] });
  observer.observe(document.querySelector('.trick'), { childList:true, subtree:true, attributes:true, attributeFilter:['class','style'] });

  window.addEventListener('resize', refresh);
  window.addEventListener('pointermove', refresh, { passive:true });

  const baseSnapshot = base.snapshot.bind(base);
  window.__livingSliceV6 = {
    snapshot() {
      const snap = baseSnapshot();
      const geometry = (node) => {
        const r=node.getBoundingClientRect();
        return { left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height, opacity:Number(getComputedStyle(node).opacity) };
      };
      return {
        ...snap,
        version:6,
        sentence,
        sentencePhase:document.body.dataset.v6Phase || semanticPhase(),
        v6Trace:v6Trace.slice(),
        overlays:{
          authoritySeal:geometry(seal),
          intentThread:geometry(intentThread),
          impactCore:geometry(impact),
          captureThread:geometry(captureThread),
          consequenceEcho:geometry(echo),
        },
      };
    },
    setTimingScale:base.setTimingScale,
    rejectNext:base.rejectNext,
    replayOpponentSources:base.replayOpponentSources,
    reset:base.reset,
    refresh,
  };

  refresh();
  trace('v6-ready', { sentence });
})();
