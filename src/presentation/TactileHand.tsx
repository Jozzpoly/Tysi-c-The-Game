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
  TACTILE_RELEASE_MS,
  TACTILE_RETURN_MS,
  advanceTactilePointer,
  beginTactilePointer,
  classifyTactileRelease,
  moveCardInOrder,
  reconcileHandOrder,
  shouldReorderFromPointer,
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

type FloatingCardProps =
  | { ghost: TactilePointerState; dragging: true }
  | { ghost: ReleaseGhost; dragging: false };

type SlotStyle = CSSProperties & {
  '--fan-rotate': string;
  '--fan-lift': string;
  '--hand-index': number;
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
  const [releaseGhost, setReleaseGhost] = useState<ReleaseGhost | null>(null);
  const handRef = useRef<HTMLDivElement>(null);
  const previousHandNumber = useRef(handNumber);
  const beforeRects = useRef<Map<string, DOMRect> | null>(null);
  const suppressClick = useRef<CardId | null>(null);
  const releaseTimer = useRef<number | null>(null);
  const cardsKey = cards.join('|');

  // Local order may remember preference, but it never gets to keep a card that
  // the canonical SeatProjection no longer contains.
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

  function reorderFromPointer(card: CardId, clientX: number, clientY: number) {
    const slots = [...(handRef.current?.querySelectorAll<HTMLElement>(':scope > .hand-slot') ?? [])];
    if (slots.length < 2) return;

    let nearestIndex = -1;
    let nearestDistance = Infinity;
    for (const slot of slots) {
      const rect = slot.getBoundingClientRect();
      const dx = clientX - (rect.left + rect.width / 2);
      const dy = clientY - (rect.top + rect.height / 2);
      const distance = dx * dx + dy * dy * 1.35;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = Number(slot.dataset.index ?? -1);
      }
    }

    const sourceIndex = visibleOrder.indexOf(card);
    if (nearestIndex < 0 || nearestIndex === sourceIndex) return;
    beforeRects.current = readSlotRects();
    setOrder((current) => moveCardInOrder(reconcileHandOrder(current, cards), card, nearestIndex));
  }

  function beginDrag(event: ReactPointerEvent<HTMLDivElement>, card: CardId) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const button = event.currentTarget.querySelector<HTMLElement>(':scope > .card');
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const handRect = handRef.current?.getBoundingClientRect() ?? rect;
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
      if (shouldReorderFromPointer(next)) reorderFromPointer(next.card, next.x, next.y);
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
      // A free throw is not a failed action. Let the physical card settle back
      // into the player's chosen hand order without error colour or rejection copy.
      animateReturnToHand(drag);
    }

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
        const slotStyle = {
          '--fan-rotate': `${rotate}deg`,
          '--fan-lift': `${lift}px`,
          '--hand-index': index,
        } as SlotStyle;

        return (
          <div
            key={card}
            className={`hand-slot ${actionable ? 'is-actionable' : ''} ${throwable ? 'is-throwable' : ''} ${held ? 'is-held' : ''} ${held && drag?.moved ? 'is-dragging' : ''}`}
            data-card={card}
            data-index={index}
            data-actionable={actionable ? 'true' : 'false'}
            data-throwable={throwable ? 'true' : 'false'}
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
