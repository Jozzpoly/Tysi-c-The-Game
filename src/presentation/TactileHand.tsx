import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { rankOf, suitOf, type CardId } from '../core/index.js';
import { magneticCapture, magneticOffsetToRect } from './spatialMagnetism.js';
import {
  computeHandInsertionPreview,
  stabilizeInsertionTarget,
  type HandInsertionPreview,
} from './tactileHandLayout.js';
import {
  advanceTactilePointer,
  beginTactilePointer,
  classifyTactileRelease,
  moveCardInOrder,
  reconcileHandOrder,
  type TactilePointerState,
} from './tactileInteraction.js';
import {
  tactileCarryTiltDegrees,
  tactileMotionEnergy,
  tactileNeighborResponseMs,
  tactileReturnMotion,
  tactileSettleMotion,
} from './tactileMotion.js';

const SUIT_SYMBOL = { spades: '♠', clubs: '♣', diamonds: '♦', hearts: '♥' } as const;
const TACTILE_AUTHORITY_TIMEOUT_MS = 2200;
const TABLE_MAGNET_ENTER_PX = 30;
const TABLE_MAGNET_RELEASE_PX = 48;
const TABLE_MAGNET_MAX_PULL_PX = 10;

interface TactileHandProps {
  cards: readonly CardId[];
  handNumber: number;
  selectedCards: readonly CardId[];
  actionableCards: ReadonlySet<CardId>;
  throwableCards: ReadonlySet<CardId>;
  onActivate: (card: CardId) => void;
}

interface ReleaseGhost {
  card: CardId;
  left: number;
  top: number;
  width: number;
  height: number;
  tilt: number;
}

interface DragLayoutSnapshot {
  sourceIndex: number;
  centers: number[];
  pointerToSourceCenterX: number;
  playRect: DOMRect | null;
}

type FloatingCardProps =
  | { ghost: TactilePointerState; dragging: true }
  | { ghost: ReleaseGhost; dragging: false };

type SlotStyle = CSSProperties & {
  '--fan-rotate': string;
  '--fan-lift': string;
  '--dense-fan-rotate': string;
  '--dense-fan-lift': string;
  '--dense-fan-inset-x': string;
  '--hand-index': number;
  '--hand-preview-shift-x': string;
};

type FloatingStyle = CSSProperties & {
  '--drag-tilt': string;
};

type HandStyle = CSSProperties & {
  '--hand-spread-count': number;
  '--tactile-neighbor-response-ms': string;
};

function cardFace(card: CardId) {
  const suit = suitOf(card);
  const rank = rankOf(card);
  const symbol = SUIT_SYMBOL[suit];
  const red = suit === 'hearts' || suit === 'diamonds';
  return { suit, rank, symbol, red };
}

function pointerMotionSample(ghost: TactilePointerState) {
  return {
    displacementX: ghost.x - ghost.startX,
    velocityX: ghost.velocityX,
    velocityY: ghost.velocityY,
  };
}

function FloatingCard(props: FloatingCardProps) {
  let left: number;
  let top: number;
  let tilt: number;
  let commitReady = false;
  let throwIntent = false;
  let magnetStrength = 0;
  let magnetOffsetX = 0;
  let magnetOffsetY = 0;
  let gesturePhase: string;

  if (props.dragging) {
    const ghost = props.ghost;
    magnetStrength = ghost.magnetStrength;
    magnetOffsetX = ghost.magnetOffsetX + ghost.assistOffsetX;
    magnetOffsetY = ghost.magnetOffsetY + ghost.assistOffsetY;
    left = ghost.x - ghost.offsetX + magnetOffsetX;
    top = ghost.y - ghost.offsetY + magnetOffsetY;
    tilt = tactileCarryTiltDegrees(pointerMotionSample(ghost));
    commitReady = ghost.commitReady;
    throwIntent = ghost.throwIntent;
    gesturePhase = ghost.phase;
  } else {
    const ghost = props.ghost;
    left = ghost.left;
    top = ghost.top;
    tilt = ghost.tilt;
    gesturePhase = 'releasing';
  }

  const ghost = props.ghost;
  const { rank, symbol, red } = cardFace(ghost.card);
  const style = {
    left,
    top,
    width: ghost.width,
    height: ghost.height,
    '--drag-tilt': `${tilt}deg`,
  } as FloatingStyle;

  return (
    <div
      className={`card tactile-card-float ${red ? 'red' : ''} ${throwIntent ? 'throw-intent' : ''} ${commitReady ? 'commit-ready' : ''} ${magnetStrength > 0 ? 'magnet-assisted' : ''} ${props.dragging ? '' : 'pending-handoff'}`}
      style={style}
      data-rank={rank}
      data-suit={symbol}
      data-gesture-phase={gesturePhase}
      data-card-id={ghost.card}
      data-authority-state={props.dragging ? '' : 'pending'}
      data-motion-tilt={tilt.toFixed(2)}
      data-magnet-strength={magnetStrength.toFixed(3)}
      data-magnet-offset-x={magnetOffsetX.toFixed(2)}
      data-magnet-offset-y={magnetOffsetY.toFixed(2)}
      data-magnet-assist-strength={props.dragging ? props.ghost.assistStrength.toFixed(3) : '0.000'}
      aria-hidden="true"
    >
      <span className="rank" data-suit={symbol}>{rank}</span>
      <span className="suit">{symbol}</span>
    </div>
  );
}

export function TactileHand({
  cards,
  handNumber,
  selectedCards,
  actionableCards,
  throwableCards,
  onActivate,
}: TactileHandProps) {
  const [order, setOrder] = useState<CardId[]>(() => [...cards]);
  const [drag, setDrag] = useState<TactilePointerState | null>(null);
  const [insertionPreview, setInsertionPreview] = useState<HandInsertionPreview | null>(null);
  const [releaseGhost, setReleaseGhost] = useState<ReleaseGhost | null>(null);
  const handRef = useRef<HTMLDivElement>(null);
  const previousHandNumber = useRef(handNumber);
  const beforeRects = useRef<Map<string, DOMRect> | null>(null);
  const dragLayout = useRef<DragLayoutSnapshot | null>(null);
  const latestPreview = useRef<HandInsertionPreview | null>(null);
  const stableTarget = useRef<number | null>(null);
  const suppressClick = useRef<CardId | null>(null);
  const releaseTimer = useRef<number | null>(null);
  const handoffAnimation = useRef<Animation | null>(null);
  // Pointer events can arrive substantially faster than the display can present.
  // Keep the freshest gesture sample in a ref and publish it to React at most once
  // per animation frame; authority/geometry semantics stay unchanged.
  const liveDrag = useRef<TactilePointerState | null>(null);
  const dragFrame = useRef<number | null>(null);
  const cardsKey = cards.join('|');

  const visibleOrder = previousHandNumber.current === handNumber
    ? reconcileHandOrder(order, cards)
    : [...cards];

  useEffect(() => {
    setOrder((current) => previousHandNumber.current === handNumber
      ? reconcileHandOrder(current, cards)
      : [...cards]);
    previousHandNumber.current = handNumber;
  }, [cardsKey, handNumber]);

  useEffect(() => () => {
    if (releaseTimer.current !== null) window.clearTimeout(releaseTimer.current);
    if (dragFrame.current !== null) window.cancelAnimationFrame(dragFrame.current);
    liveDrag.current = null;
    handoffAnimation.current?.cancel();
  }, []);

  function readSlotRects(): Map<string, DOMRect> {
    const result = new Map<string, DOMRect>();
    for (const slot of handRef.current?.querySelectorAll<HTMLElement>(':scope > .hand-slot') ?? []) {
      const card = slot.dataset.card;
      if (card) result.set(card, slot.getBoundingClientRect());
    }
    return result;
  }

  function readSlotCenters(): number[] {
    return [...(handRef.current?.querySelectorAll<HTMLElement>(':scope > .hand-slot') ?? [])]
      .map((slot) => {
        const rect = slot.getBoundingClientRect();
        return rect.left + rect.width / 2;
      });
  }

  function readPlayZoneRect(): DOMRect | null {
    if (throwableCards.size === 0) return null;
    return document.querySelector<HTMLElement>('.trick')?.getBoundingClientRect() ?? null;
  }

  useLayoutEffect(() => {
    const previous = beforeRects.current;
    if (!previous || !handRef.current) return;
    beforeRects.current = null;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduced) return;

    for (const slot of handRef.current.querySelectorAll<HTMLElement>(':scope > .hand-slot')) {
      const card = slot.dataset.card;
      if (!card) continue;
      const oldRect = previous.get(card);
      if (!oldRect) continue;
      const newRect = slot.getBoundingClientRect();
      const dx = oldRect.left - newRect.left;
      const dy = oldRect.top - newRect.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
      const settle = tactileSettleMotion(dx, dy);
      slot.getAnimations().forEach((animation) => animation.cancel());
      slot.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)`, offset: 0 },
          { transform: `translate(${settle.overshootX}px, ${settle.overshootY}px)`, offset: .78 },
          { transform: 'translate(0, 0)', offset: 1 },
        ],
        { duration: settle.durationMs, easing: 'cubic-bezier(.18,.82,.2,1)' },
      );
    }
  }, [order]);

  // A committed throw remains a local presentation object until the canonical
  // hand actually loses that same card and the authoritative fresh-play target
  // exists. Only then do we bridge the physical card into its real table slot.
  useLayoutEffect(() => {
    if (!releaseGhost || cards.includes(releaseGhost.card)) return;

    const target = document.querySelector<HTMLElement>(
      `.played-self.is-fresh-arrival[data-card="${releaseGhost.card}"]`,
    );
    const ghost = document.querySelector<HTMLElement>(
      `.tactile-card-float.pending-handoff[data-card-id="${releaseGhost.card}"]`,
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
    // Keep pointer tracking immediate, then let the released card decelerate and
    // physically settle into the authoritative table slot. Finish comfortably
    // before the 300 ms ordinary presentation beat: completion is a local DOM
    // bridge marker and must not race the next React-owned presentation update.
    const duration = Math.round(Math.max(250, Math.min(280, 220 + distance * .16)));
    const startTransform = getComputedStyle(ghost).transform;
    const settleTilt = releaseGhost.tilt * .08;

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
          top: `${targetRect.top - 1.5}px`,
          width: `${targetRect.width}px`,
          height: `${targetRect.height}px`,
          transform: `rotate(${settleTilt}deg) scale(1.018)`,
          opacity: 1,
          offset: .84,
        },
        {
          left: `${targetRect.left}px`,
          top: `${targetRect.top}px`,
          width: `${targetRect.width}px`,
          height: `${targetRect.height}px`,
          transform: 'none',
          opacity: 1,
          offset: 1,
        },
      ],
      { duration, easing: 'cubic-bezier(.17,.70,.20,1)', fill: 'forwards' },
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
    const layout = dragLayout.current;
    if (!layout || state.phase !== 'held') return;
    // Reorder semantics use the logical hand-slot centre, not the transformed
    // card's axis-aligned bounding box. The visual fan can rotate/lift without
    // moving the interaction axis under the player's finger.
    const heldCenterX = state.x + layout.pointerToSourceCenterX;
    const rawPreview = computeHandInsertionPreview({
      sourceIndex: layout.sourceIndex,
      heldCenterX,
      centers: layout.centers,
    });
    const targetIndex = stabilizeInsertionTarget({
      position: rawPreview.position,
      previousTarget: stableTarget.current ?? layout.sourceIndex,
      slotCount: layout.centers.length,
    });
    stableTarget.current = targetIndex;
    const preview = targetIndex === rawPreview.targetIndex
      ? rawPreview
      : { ...rawPreview, targetIndex };
    latestPreview.current = preview;
    setInsertionPreview(preview);
  }

  function beginDrag(event: ReactPointerEvent<HTMLDivElement>, card: CardId) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const button = event.currentTarget.querySelector<HTMLElement>(':scope > .card');
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const handRect = handRef.current?.getBoundingClientRect() ?? rect;
    const playRect = readPlayZoneRect();
    const sourceIndex = visibleOrder.indexOf(card);
    const centers = readSlotCenters();
    const sourceCenterX = centers[sourceIndex] ?? event.clientX;
    dragLayout.current = {
      sourceIndex,
      centers,
      pointerToSourceCenterX: sourceCenterX - event.clientX,
      playRect,
    };
    latestPreview.current = null;
    stableTarget.current = sourceIndex;
    setInsertionPreview(null);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (button instanceof HTMLButtonElement && !button.disabled) button.focus({ preventScroll: true });
    const initialDrag = beginTactilePointer({
      card,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      timeMs: event.timeStamp,
      width: rect.width,
      height: rect.height,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      zoneTop: playRect ? playRect.top + playRect.height / 2 : Math.max(14, handRect.top - 76),
    });
    liveDrag.current = initialDrag;
    setDrag(initialDrag);
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const current = liveDrag.current;
    if (!current || event.pointerId !== current.pointerId) return;

    const playRect = dragLayout.current?.playRect ?? null;
    const cardCenterX = event.clientX - current.offsetX + current.width / 2;
    const cardCenterY = event.clientY - current.offsetY + current.height / 2;
    const cardCenter = { x: cardCenterX, y: cardCenterY };
    const fieldPadding = current.throwIntent ? TABLE_MAGNET_RELEASE_PX : TABLE_MAGNET_ENTER_PX;
    const inPlayZone = Boolean(playRect && magneticCapture(cardCenter, playRect, {
      latched: current.throwIntent,
      enterPaddingPx: TABLE_MAGNET_ENTER_PX,
      releasePaddingPx: TABLE_MAGNET_RELEASE_PX,
    }));
    // Keep one gesture owner while preserving two different meanings:
    // - assist: early visual attraction only;
    // - magnet: bounded acceptance-field feedback used by the handoff contract.
    // The old global bridge mixed these paths through a second pointer listener.
    const acceptedMagnet = playRect && inPlayZone
      ? magneticOffsetToRect(cardCenter, playRect, fieldPadding, TABLE_MAGNET_MAX_PULL_PX)
      : { x: 0, y: 0, strength: 0 };
    const assistMagnet = playRect && !inPlayZone
      ? magneticOffsetToRect(
        { x: event.clientX, y: event.clientY },
        playRect,
        TABLE_MAGNET_ENTER_PX,
        TABLE_MAGNET_MAX_PULL_PX,
      )
      : { x: 0, y: 0, strength: 0 };
    const next = advanceTactilePointer(current, {
      x: event.clientX,
      y: event.clientY,
      timeMs: event.timeStamp,
      canCommit: throwableCards.has(current.card),
      inPlayZone,
      magnetOffsetX: acceptedMagnet.x,
      magnetOffsetY: acceptedMagnet.y,
      magnetStrength: acceptedMagnet.strength,
      assistOffsetX: assistMagnet.x,
      assistOffsetY: assistMagnet.y,
      assistStrength: assistMagnet.strength,
    });

    liveDrag.current = next;
    if (next.moved) event.preventDefault();

    if (dragFrame.current !== null) return;
    dragFrame.current = window.requestAnimationFrame(() => {
      dragFrame.current = null;
      const frameDrag = liveDrag.current;
      if (!frameDrag) return;
      if (frameDrag.moved && frameDrag.phase === 'held') applyInsertionPreview(frameDrag);
      setDrag(frameDrag);
    });
  }

  function animateReturnToHand(state: TactilePointerState) {
    const slot = handRef.current?.querySelector<HTMLElement>(`:scope > .hand-slot[data-card="${state.card}"]`);
    if (!slot) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduced) return;

    const rect = slot.getBoundingClientRect();
    const currentLeft = state.x - state.offsetX + state.magnetOffsetX + state.assistOffsetX;
    const currentTop = state.y - state.offsetY + state.magnetOffsetY + state.assistOffsetY;
    const dx = currentLeft - rect.left;
    const dy = currentTop - rect.top;
    const motion = tactileReturnMotion(pointerMotionSample(state));
    const tilt = tactileCarryTiltDegrees(pointerMotionSample(state));
    slot.getAnimations().forEach((animation) => animation.cancel());
    slot.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) rotate(${tilt}deg) scale(1.06)`, offset: 0 },
        {
          transform: `translate(${dx * .12 + motion.overshootX}px, ${dy * .05 + motion.overshootY}px) rotate(${-tilt * .06}deg) scale(1.014)`,
          offset: .74,
        },
        { transform: 'translate(0, 0) rotate(0deg) scale(1)', offset: 1 },
      ],
      { duration: motion.durationMs, easing: 'cubic-bezier(.18,.78,.25,1)' },
    );
  }

  function commitPreviewOrder(card: CardId) {
    const preview = latestPreview.current;
    if (!preview) return false;
    if (preview.targetIndex === preview.sourceIndex) return false;
    beforeRects.current = readSlotRects();
    setOrder((current) => moveCardInOrder(reconcileHandOrder(current, cards), card, preview.targetIndex));
    return true;
  }

  function finishDrag(event: ReactPointerEvent<HTMLDivElement>, cancelled = false) {
    const activeDrag = liveDrag.current;
    if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    // Preserve the final pointer sample even when pointer-up beats the scheduled
    // render frame, so free-hand reordering cannot lose the last movement.
    if (activeDrag.moved && activeDrag.phase === 'held') applyInsertionPreview(activeDrag);

    const outcome = classifyTactileRelease(activeDrag, {
      cancelled,
      canCommit: throwableCards.has(activeDrag.card),
    });

    if (activeDrag.moved && actionableCards.has(activeDrag.card)) {
      suppressClick.current = activeDrag.card;
      window.setTimeout(() => {
        if (suppressClick.current === activeDrag.card) suppressClick.current = null;
      }, 0);
    }

    if (outcome === 'commit') {
      const pendingGhost: ReleaseGhost = {
        card: activeDrag.card,
        left: activeDrag.x - activeDrag.offsetX + activeDrag.magnetOffsetX,
        top: activeDrag.y - activeDrag.offsetY + activeDrag.magnetOffsetY,
        width: activeDrag.width,
        height: activeDrag.height,
        tilt: tactileCarryTiltDegrees(pointerMotionSample(activeDrag)),
      };
      setReleaseGhost(pendingGhost);
      if (releaseTimer.current !== null) window.clearTimeout(releaseTimer.current);
      releaseTimer.current = window.setTimeout(() => {
        releaseTimer.current = null;
        setReleaseGhost((current) => current?.card === pendingGhost.card ? null : current);
      }, TACTILE_AUTHORITY_TIMEOUT_MS);
      onActivate(activeDrag.card);
    } else if (outcome === 'return') {
      // Releasing from the shared table zone is a failed play attempt, not a hand
      // reorder. Only a release that is still in free-hand space may commit the
      // latest insertion preview.
      const reordered = activeDrag.phase === 'held' ? commitPreviewOrder(activeDrag.card) : false;
      if (reordered) {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => animateReturnToHand(activeDrag));
        });
      } else {
        animateReturnToHand(activeDrag);
      }
    }

    dragLayout.current = null;
    latestPreview.current = null;
    stableTarget.current = null;
    setInsertionPreview(null);
    if (dragFrame.current !== null) {
      window.cancelAnimationFrame(dragFrame.current);
      dragFrame.current = null;
    }
    liveDrag.current = null;
    setDrag(null);
  }

  function handleClick(event: ReactMouseEvent<HTMLElement>, card: CardId) {
    if (suppressClick.current === card) {
      suppressClick.current = null;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (actionableCards.has(card)) onActivate(card);
  }

  const motionEnergy = drag?.moved ? tactileMotionEnergy(drag.velocityX, drag.velocityY) : 0;
  const neighborResponseMs = drag?.moved ? tactileNeighborResponseMs(drag.velocityX, drag.velocityY) : 82;
  // Only contrast legality when the hand actually contains a choice between
  // usable and unusable cards. Waiting phases should not grey the whole hand.
  const showLegalityContrast = actionableCards.size > 0 && actionableCards.size < visibleOrder.length;
  const handStyle = {
    '--hand-spread-count': Math.max(0, visibleOrder.length - 1),
    '--tactile-neighbor-response-ms': `${neighborResponseMs}ms`,
  } as HandStyle;

  return (
    <div
      ref={handRef}
      className="hand tactile-hand"
      style={handStyle}
      data-gesture-phase={drag?.phase ?? 'idle'}
      data-insertion-position={insertionPreview?.position.toFixed(3) ?? ''}
      data-insertion-target={insertionPreview?.targetIndex ?? ''}
      data-motion-energy={motionEnergy.toFixed(3)}
      data-neighbor-response-ms={neighborResponseMs}
      data-magnet-strength={drag?.magnetStrength.toFixed(3) ?? '0.000'}
      aria-label="Twoje karty. Każdą możesz chwycić i przełożyć; stół podpowie, kiedy gest może stać się ruchem."
    >
      {visibleOrder.map((card, index) => {
        const { suit, rank, symbol, red } = cardFace(card);
        const selected = selectedCards.includes(card);
        const actionable = actionableCards.has(card);
        const unavailable = showLegalityContrast && !actionable;
        const throwable = throwableCards.has(card);
        const held = drag?.card === card;
        const awaitingAuthority = releaseGhost?.card === card;
        const offset = index - (visibleOrder.length - 1) / 2;
        const rotate = Math.max(-5.5, Math.min(5.5, offset * 1.15));
        const lift = Math.min(6, Math.abs(offset) * 1.15);
        // Ten-card mobile exchange needs a different physical fan: a tall hand
        // can read strongly with less angular spread and more vertical arc. Keep
        // both geometries available so desktop and ordinary hands stay unchanged.
        const denseRotate = Math.max(-3.5, Math.min(3.5, offset * .78));
        const denseLift = Math.min(18, Math.abs(offset) * 3.8);
        const denseInsetX = -Math.sign(offset) * Math.min(3, Math.abs(offset) * .7);
        const previewShiftX = insertionPreview?.shiftsPx[index] ?? 0;
        const slotStyle = {
          '--fan-rotate': `${rotate}deg`,
          '--fan-lift': `${lift}px`,
          '--dense-fan-rotate': `${denseRotate}deg`,
          '--dense-fan-lift': `${denseLift}px`,
          '--dense-fan-inset-x': `${denseInsetX}px`,
          '--hand-index': index,
          '--hand-preview-shift-x': `${previewShiftX}px`,
        } as SlotStyle;

        return (
          <div
            key={card}
            className={`hand-slot ${actionable ? 'is-actionable' : ''} ${unavailable ? 'is-unavailable' : ''} ${throwable ? 'is-throwable' : ''} ${held ? 'is-held' : ''} ${held && drag?.moved ? 'is-dragging' : ''} ${awaitingAuthority ? 'is-awaiting-authority' : ''}`}
            data-card={card}
            data-index={index}
            data-actionable={actionable ? 'true' : 'false'}
            data-throwable={throwable ? 'true' : 'false'}
            data-preview-shift-x={previewShiftX.toFixed(2)}
            style={slotStyle}
            onPointerDownCapture={(event) => beginDrag(event, card)}
            onPointerMove={moveDrag}
            onPointerUp={(event) => finishDrag(event)}
            onPointerCancel={(event) => finishDrag(event, true)}
          >
            <button
              type="button"
              className={`card hand-card ${red ? 'red' : ''} ${selected ? 'selected' : ''}`}
              disabled={!actionable}
              onClick={(event) => handleClick(event, card)}
              aria-label={`${rank} ${suit}`}
              aria-pressed={selected || undefined}
              data-rank={rank}
              data-suit={symbol}
              draggable={false}
            >
              <span className="rank" data-suit={symbol}>{rank}</span>
              <span className="suit">{symbol}</span>
            </button>
            <span
              className="hand-touch-target"
              data-touch-card={card}
              aria-hidden="true"
              onClick={(event) => handleClick(event, card)}
            />
          </div>
        );
      })}

      {drag?.moved && <FloatingCard ghost={drag} dragging />}
      {releaseGhost && <FloatingCard ghost={releaseGhost} dragging={false} />}
      {drag?.moved && throwableCards.has(drag.card) && (
        <div
          className={`tactile-commit-zone ${drag.commitReady ? 'ready' : ''}`}
          style={{ top: drag.zoneTop }}
          aria-hidden="true"
        >
          {drag.commitReady ? 'Puść — stół bierze kartę' : 'Ta karta może wejść na stół'}
        </div>
      )}
    </div>
  );
}
