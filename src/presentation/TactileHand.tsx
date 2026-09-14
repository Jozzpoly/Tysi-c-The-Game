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
import {
  computeHandInsertionPreview,
  stabilizeInsertionTarget,
  type HandInsertionPreview,
} from './tactileHandLayout.js';
import {
  TACTILE_RELEASE_MS,
  TACTILE_RETURN_MS,
  advanceTactilePointer,
  beginTactilePointer,
  classifyTactileRelease,
  moveCardInOrder,
  reconcileHandOrder,
  tactileTiltDegrees,
  type TactilePointerState,
} from './tactileInteraction.js';

const SUIT_SYMBOL = { spades: '♠', clubs: '♣', diamonds: '♦', hearts: '♥' } as const;

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
}

type FloatingCardProps =
  | { ghost: TactilePointerState; dragging: true }
  | { ghost: ReleaseGhost; dragging: false };

type SlotStyle = CSSProperties & {
  '--fan-rotate': string;
  '--fan-lift': string;
  '--hand-index': number;
  '--hand-preview-shift-x': string;
};

type FloatingStyle = CSSProperties & {
  '--drag-tilt': string;
};

function cardFace(card: CardId) {
  const suit = suitOf(card);
  const rank = rankOf(card);
  const symbol = SUIT_SYMBOL[suit];
  const red = suit === 'hearts' || suit === 'diamonds';
  return { suit, rank, symbol, red };
}

function FloatingCard(props: FloatingCardProps) {
  let left: number;
  let top: number;
  let tilt: number;
  let commitReady = false;
  let throwIntent = false;
  let gesturePhase: string;

  if (props.dragging) {
    const ghost = props.ghost;
    left = ghost.x - ghost.offsetX;
    top = ghost.y - ghost.offsetY;
    tilt = tactileTiltDegrees(ghost);
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
      className={`card tactile-card-float ${red ? 'red' : ''} ${throwIntent ? 'throw-intent' : ''} ${commitReady ? 'commit-ready' : ''} ${props.dragging ? '' : 'releasing'}`}
      style={style}
      data-rank={rank}
      data-suit={symbol}
      data-gesture-phase={gesturePhase}
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
      slot.getAnimations().forEach((animation) => animation.cancel());
      slot.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
        { duration: 145, easing: 'cubic-bezier(.2,.78,.24,1)' },
      );
    }
  }, [order]);

  function applyInsertionPreview(state: TactilePointerState) {
    const layout = dragLayout.current;
    if (!layout || state.phase !== 'held') return;
    const heldCenterX = state.x - state.offsetX + state.width / 2;
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
    const sourceIndex = visibleOrder.indexOf(card);
    dragLayout.current = {
      sourceIndex,
      centers: readSlotCenters(),
    };
    latestPreview.current = null;
    stableTarget.current = sourceIndex;
    setInsertionPreview(null);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (button instanceof HTMLButtonElement && !button.disabled) button.focus({ preventScroll: true });
    setDrag(beginTactilePointer({
      card,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      timeMs: event.timeStamp,
      width: rect.width,
      height: rect.height,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      zoneTop: Math.max(14, handRect.top - 76),
    }));
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const next = advanceTactilePointer(drag, {
      x: event.clientX,
      y: event.clientY,
      timeMs: event.timeStamp,
      canCommit: throwableCards.has(drag.card),
    });

    if (next.moved) {
      event.preventDefault();
      if (next.phase === 'held') applyInsertionPreview(next);
    }

    setDrag((current) => current?.pointerId === event.pointerId ? next : current);
  }

  function animateReturnToHand(state: TactilePointerState) {
    const slot = handRef.current?.querySelector<HTMLElement>(`:scope > .hand-slot[data-card="${state.card}"]`);
    if (!slot) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduced) return;

    const rect = slot.getBoundingClientRect();
    const currentLeft = state.x - state.offsetX;
    const currentTop = state.y - state.offsetY;
    const dx = currentLeft - rect.left;
    const dy = currentTop - rect.top;
    const tilt = tactileTiltDegrees(state);
    slot.getAnimations().forEach((animation) => animation.cancel());
    slot.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) rotate(${tilt}deg) scale(1.06)`, offset: 0 },
        { transform: `translate(${dx * .16}px, ${Math.min(8, dy * .04)}px) rotate(${tilt * .08}deg) scale(1.012)`, offset: .78 },
        { transform: 'translate(0, 0) rotate(0deg) scale(1)', offset: 1 },
      ],
      { duration: TACTILE_RETURN_MS, easing: 'cubic-bezier(.18,.78,.25,1)' },
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
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);

    const outcome = classifyTactileRelease(drag, {
      cancelled,
      canCommit: throwableCards.has(drag.card),
    });

    if (drag.moved && actionableCards.has(drag.card)) {
      suppressClick.current = drag.card;
      window.setTimeout(() => {
        if (suppressClick.current === drag.card) suppressClick.current = null;
      }, 0);
    }

    if (outcome === 'commit') {
      setReleaseGhost({
        card: drag.card,
        left: drag.x - drag.offsetX,
        top: drag.y - drag.offsetY,
        width: drag.width,
        height: drag.height,
        tilt: tactileTiltDegrees(drag),
      });
      if (releaseTimer.current !== null) window.clearTimeout(releaseTimer.current);
      releaseTimer.current = window.setTimeout(() => setReleaseGhost(null), TACTILE_RELEASE_MS);
      onActivate(drag.card);
    } else if (outcome === 'return') {
      const reordered = commitPreviewOrder(drag.card);
      if (reordered) {
        window.requestAnimationFrame(() => {
          window.requestAnimation(() => animateReturnToHand(drag));
        });
      } else {
        animateReturnToHand(drag);
      }
    }

    dragLayout.current = null;
    latestPreview.current = null;
    stableTarget.current = null;
    setInsertionPreview(null);
    setDrag(null);
  }

  function handleClick(event: ReactMouseEvent<HTMLButtonElement>, card: CardId) {
    if (suppressClick.current === card) {
      suppressClick.current = null;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (actionableCards.has(card)) onActivate(card);
  }

  const handStyle = { '--hand-spread-count': Math.max(0, visibleOrder.length - 1) } as CSSProperties;

  return (
    <div
      ref={handRef}
      className="hand tactile-hand"
      style={handStyle}
      data-gesture-phase={drag?.phase ?? 'idle'}
      data-insertion-position={insertionPreview?.position.toFixed(3) ?? ''}
      data-insertion-target={insertionPreview?.targetIndex ?? ''}
      aria-label="Twoje karty. Każdą możesz chwycić i przełożyć; stół podpowie, kiedy gest może stać się ruchem."
    >
      {visibleOrder.map((card, index) => {
        const { suit, rank, symbol, red } = cardFace(card);
        const selected = selectedCards.includes(card);
        const actionable = actionableCards.has(card);
        const throwable = throwableCards.has(card);
        const held = drag?.card === card;
        const offset = index - (visibleOrder.length - 1) / 2;
        const rotate = Math.max(-5.5, Math.min(5.5, offset * 1.15));
        const lift = Math.min(6, Math.abs(offset) * 1.15);
        const previewShiftX = insertionPreview?.shiftsPx[index] ?? 0;
        const slotStyle = {
          '--fan-rotate': `${rotate}deg`,
          '--fan-lift': `${lift}px`,
          '--hand-index': index,
          '--hand-preview-shift-x': `${previewShiftX}px`,
        } as SlotStyle;

        return (
          <div
            key={card}
            className={`hand-slot ${actionable ? 'is-actionable' : ''} ${throwable ? 'is-throwable' : ''} ${held ? 'is-held' : ''} ${held && drag?.moved ? 'is-dragging' : ''}`}
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
