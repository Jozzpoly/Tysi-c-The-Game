from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    if old not in text:
        raise SystemExit(f"missing patch anchor in {path}: {old[:80]!r}")
    file.write_text(text.replace(old, new, 1))


hand = "src/presentation/TactileHand.tsx"
css = "src/run04-tactile-hand.css"

replace_once(
    hand,
    "const SUIT_SYMBOL = { spades: '♠', clubs: '♣', diamonds: '♦', hearts: '♥' } as const;\n",
    "const SUIT_SYMBOL = { spades: '♠', clubs: '♣', diamonds: '♦', hearts: '♥' } as const;\nconst TACTILE_AUTHORITY_TIMEOUT_MS = 2200;\n",
)

replace_once(
    hand,
    "      className={`card tactile-card-float ${red ? 'red' : ''} ${throwIntent ? 'throw-intent' : ''} ${commitReady ? 'commit-ready' : ''} ${props.dragging ? '' : 'releasing'}`}\n",
    "      className={`card tactile-card-float ${red ? 'red' : ''} ${throwIntent ? 'throw-intent' : ''} ${commitReady ? 'commit-ready' : ''} ${props.dragging ? '' : 'pending-handoff'}`}\n",
)

replace_once(
    hand,
    "      data-gesture-phase={gesturePhase}\n      data-motion-tilt={tilt.toFixed(2)}\n",
    "      data-gesture-phase={gesturePhase}\n      data-card-id={ghost.card}\n      data-authority-state={props.dragging ? '' : 'pending'}\n      data-motion-tilt={tilt.toFixed(2)}\n",
)

replace_once(
    hand,
    "  const releaseTimer = useRef<number | null>(null);\n  const cardsKey = cards.join('|');\n",
    "  const releaseTimer = useRef<number | null>(null);\n  const handoffAnimation = useRef<Animation | null>(null);\n  const cardsKey = cards.join('|');\n",
)

replace_once(
    hand,
    "  useEffect(() => () => {\n    if (releaseTimer.current !== null) window.clearTimeout(releaseTimer.current);\n  }, []);\n",
    "  useEffect(() => () => {\n    if (releaseTimer.current !== null) window.clearTimeout(releaseTimer.current);\n    handoffAnimation.current?.cancel();\n  }, []);\n",
)

replace_once(
    hand,
    "  }, [order]);\n\n  function applyInsertionPreview(state: TactilePointerState) {\n",
    """  }, [order]);

  // A committed throw remains a local presentation object until the canonical
  // hand actually loses that same card and the authoritative fresh-play target
  // exists. Only then do we bridge the physical card into its real table slot.
  useLayoutEffect(() => {
    if (!releaseGhost || cards.includes(releaseGhost.card)) return;

    const target = document.querySelector<HTMLElement>(
      `.played-self.is-fresh-arrival[data-card=\"${releaseGhost.card}\"]`,
    );
    const ghost = document.querySelector<HTMLElement>(
      `.tactile-card-float.pending-handoff[data-card-id=\"${releaseGhost.card}\"]`,
    );
    if (!target || !ghost) {
      setReleaseGhost(null);
      return;
    }

    if (releaseTimer.current !== null) {
      window.clearTimeout(releaseTimer.current);
      releaseTimer.current = null;
    }

    // Remove the generic self-arrival before paint. This local throw already has
    // its own physical origin, so replaying a second fly-in would duplicate it.
    target.classList.remove('is-fresh-arrival');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduced) {
      target.classList.add('is-local-handoff-complete');
      setReleaseGhost(null);
      return;
    }

    target.classList.add('is-local-handoff-target');
    const targetCard = target.querySelector<HTMLElement>(':scope > .card') ?? target;
    const targetRect = targetCard.getBoundingClientRect();
    const startRect = ghost.getBoundingClientRect();
    const distance = Math.hypot(targetRect.left - startRect.left, targetRect.top - startRect.top);
    const duration = Math.round(Math.max(TACTILE_RELEASE_MS, Math.min(280, 165 + distance * .16)));
    const startTransform = getComputedStyle(ghost).transform;

    ghost.dataset.authorityState = 'handoff';
    ghost.getAnimations().forEach((animation) => animation.cancel());
    const animation = ghost.animate(
      [
        {
          left: `${releaseGhost.left}px`,
          top: `${releaseGhost.top}px`,
          width: `${releaseGhost.width}px`,
          height: `${releaseGhost.height}px`,
          transform: startTransform,
          opacity: .99,
        },
        {
          left: `${targetRect.left}px`,
          top: `${targetRect.top}px`,
          width: `${targetRect.width}px`,
          height: `${targetRect.height}px`,
          transform: 'none',
          opacity: 1,
        },
      ],
      { duration, easing: 'cubic-bezier(.17,.82,.25,1)', fill: 'forwards' },
    );
    handoffAnimation.current = animation;

    const complete = () => {
      target.classList.remove('is-local-handoff-target');
      target.classList.add('is-local-handoff-complete');
      handoffAnimation.current = null;
      setReleaseGhost((current) => current?.card === releaseGhost.card ? null : current);
    };
    animation.addEventListener('finish', complete, { once: true });
    animation.addEventListener('cancel', () => target.classList.remove('is-local-handoff-target'), { once: true });

    return () => {
      if (handoffAnimation.current === animation) {
        handoffAnimation.current = null;
        animation.cancel();
      }
    };
  }, [cardsKey, releaseGhost]);

  function applyInsertionPreview(state: TactilePointerState) {
""",
)

replace_once(
    hand,
    """    if (outcome === 'commit') {
      setReleaseGhost({
        card: drag.card,
        left: drag.x - drag.offsetX,
        top: drag.y - drag.offsetY,
        width: drag.width,
        height: drag.height,
        tilt: tactileCarryTiltDegrees(pointerMotionSample(drag)),
      });
      if (releaseTimer.current !== null) window.clearTimeout(releaseTimer.current);
      releaseTimer.current = window.setTimeout(() => setReleaseGhost(null), TACTILE_RELEASE_MS);
      onActivate(drag.card);
""",
    """    if (outcome === 'commit') {
      const pendingGhost: ReleaseGhost = {
        card: drag.card,
        left: drag.x - drag.offsetX,
        top: drag.y - drag.offsetY,
        width: drag.width,
        height: drag.height,
        tilt: tactileCarryTiltDegrees(pointerMotionSample(drag)),
      };
      setReleaseGhost(pendingGhost);
      if (releaseTimer.current !== null) window.clearTimeout(releaseTimer.current);
      releaseTimer.current = window.setTimeout(() => {
        releaseTimer.current = null;
        setReleaseGhost((current) => current?.card === pendingGhost.card ? null : current);
      }, TACTILE_AUTHORITY_TIMEOUT_MS);
      onActivate(drag.card);
""",
)

replace_once(
    hand,
    "        const held = drag?.card === card;\n        const offset = index - (visibleOrder.length - 1) / 2;\n",
    "        const held = drag?.card === card;\n        const awaitingAuthority = releaseGhost?.card === card;\n        const offset = index - (visibleOrder.length - 1) / 2;\n",
)

replace_once(
    hand,
    "            className={`hand-slot ${actionable ? 'is-actionable' : ''} ${throwable ? 'is-throwable' : ''} ${held ? 'is-held' : ''} ${held && drag?.moved ? 'is-dragging' : ''}`}\n",
    "            className={`hand-slot ${actionable ? 'is-actionable' : ''} ${throwable ? 'is-throwable' : ''} ${held ? 'is-held' : ''} ${held && drag?.moved ? 'is-dragging' : ''} ${awaitingAuthority ? 'is-awaiting-authority' : ''}`}\n",
)

replace_once(
    css,
    ".tactile-hand .hand-slot.is-dragging > .card {\n  opacity: 0;\n}\n",
    ".tactile-hand .hand-slot.is-dragging > .card {\n  opacity: 0;\n}\n\n/* A legal throw physically leaves the hand while authority is pending. */\n.tactile-hand .hand-slot.is-awaiting-authority > .card {\n  opacity: 0 !important;\n  pointer-events: none;\n}\n",
)

replace_once(
    css,
    ".tactile-card-float.releasing {\n  animation: run04-tactile-release .19s cubic-bezier(.15,.76,.3,1) forwards;\n}\n",
    ".tactile-card-float.pending-handoff {\n  will-change: left, top, width, height, transform, opacity;\n}\n\n/* During a local throw the authoritative DOM target is geometry only until the\n * same physical card reaches it. Reconnect/click/replay never receive this class. */\n.trick .played-self.is-local-handoff-target {\n  animation: none !important;\n  opacity: 0;\n}\n\n.trick .played-self.is-local-handoff-complete {\n  animation: none !important;\n}\n",
)

text = Path(css).read_text()
text = text.replace(
    "\n@keyframes run04-tactile-release {\n  from { opacity: .99; transform: rotate(var(--drag-tilt)) scale(1.1); }\n  to { opacity: 0; transform: translateY(-72px) rotate(var(--drag-tilt)) scale(.87); }\n}\n",
    "\n",
)
text = text.replace(
    "\n  .tactile-card-float.releasing {\n    animation-name: run04-tactile-release-peek;\n  }\n",
    "\n",
)
text = text.replace(
    "\n@keyframes run04-tactile-release-peek {\n  from { opacity: .99; transform: translateY(-21px) rotate(var(--drag-tilt)) scale(1.1); }\n  to { opacity: 0; transform: translateY(-93px) rotate(var(--drag-tilt)) scale(.87); }\n}\n",
    "\n",
)
Path(css).write_text(text)

Path(".github/workflows/run04-p4b-patch.yml").unlink()
Path("scripts/run04-p4b-patch.py").unlink()
