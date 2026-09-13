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

const SUIT_SYMBOL = { spades: '♠', clubs: '♣', diamonds: '♦', hearts: '♥' } as const;
const DRAG_SLOP = 6;
const RELEASE_MS = 190;

interface TactileHandProps {
  cards: readonly CardId[];
  handNumber: number;
  selectedCards: readonly CardId[];
  actionableCards: ReadonlySet<CardId>;
  throwableCards: ReadonlySet<CardId>;
  onActivate: (card: CardId) => void;
}

interface DragState {
  card: CardId;
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  moved: boolean;
  throwIntent: boolean;
  commitReady: boolean;
  zoneTop: number;
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
  | { ghost: DragState; dragging: true }
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

function reconcileOrder(order: readonly CardId[], cards: readonly CardId[]): CardId[] {
  const incoming = new Set(cards);
  const kept = order.filter((card) => incoming.has(card));
  const keptSet = new Set(kept);
  return [...kept, ...cards.filter((card) => !keptSet.has(card))];
}

function FloatingCard(props: FloatingCardProps) {
  const { ghost } = props;
  const { rank, symbol, red } = cardFace(ghost.card);
  const left = props.dragging ? ghost.x - ghost.offsetX : ghost.left;
  const top = props.dragging ? ghost.y - ghost.offsetY : ghost.top;
  const tilt = props.dragging
    ? Math.max(-12, Math.min(12, (ghost.x - ghost.startX) / 10))
    : ghost.tilt;
  const commitReady = props.dragging && ghost.commitReady;
  const throwIntent = props.dragging && ghost.throwIntent;
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
      aria-hidden="true"
    >
      <span className="rank" data-suit={symbol}>{rank}</span>
      <span className="suit">{symbol}</span>
    </div>
  );
}

function moveCard(order: readonly CardId[], card: CardId, targetIndex: number): CardId[] {
  const sourceIndex = order.indexOf(card);
  if (sourceIndex < 0 || sourceIndex === targetIndex) return [...order];
  const next = [...order];
  next.splice(sourceIndex, 1);
  next.splice(Math.max(0, Math.min(targetIndex, next.length)), 0, card);
  return next;
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
  const [drag, setDrag] = useState<DragState | null>(null);
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
    ? reconcileOrder(order, cards)
    : [...cards];

  useEffect(() => {
    setOrder((current) => previousHandNumber.current === handNumber
      ? reconcileOrder(current, cards)
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
    setOrder((current) => moveCard(reconcileOrder(current, cards), card, nearestIndex));
  }

  function beginDrag(event: ReactPointerEvent<HTMLDivElement>, card: CardId) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const button = event.currentTarget.querySelector<HTMLElement>(':scope > .card');
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const handRect = handRef.current?.getBoundingClientRect() ?? rect;
    event.currentTarget.setPointerCapture(event.pointerId);
    if (button instanceof HTMLButtonElement && !button.disabled) button.focus({ preventScroll: true });
    setDrag({
      card,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      width: rect.width,
      height: rect.height,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      moved: false,
      throwIntent: false,
      commitReady: false,
      zoneTop: Math.max(14, handRect.top - 76),
    });
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    const moved = drag.moved || distance >= DRAG_SLOP;
    const commitDistance = Math.max(62, drag.height * 0.72);
    const throwIntent = moved && event.clientY <= drag.startY - commitDistance;
    const commitReady = throwIntent && throwableCards.has(drag.card);

    if (moved) {
      event.preventDefault();
      // Reordering remains free while the card is near the hand. Once the card
      // is pulled decisively toward the table, stop shuffling slots underneath it.
      if (!throwIntent) reorderFromPointer(drag.card, event.clientX, event.clientY);
    }

    setDrag((current) => current && current.pointerId === event.pointerId
      ? { ...current, x: event.clientX, y: event.clientY, moved, throwIntent, commitReady }
      : current);
  }

  function finishDrag(event: ReactPointerEvent<HTMLDivElement>, cancelled = false) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);

    const shouldCommit = !cancelled && drag.moved && drag.commitReady && throwableCards.has(drag.card);
    if (drag.moved && actionableCards.has(drag.card)) {
      suppressClick.current = drag.card;
      window.setTimeout(() => {
        if (suppressClick.current === drag.card) suppressClick.current = null;
      }, 0);
    }

    if (shouldCommit) {
      const tilt = Math.max(-12, Math.min(12, (drag.x - drag.startX) / 10));
      setReleaseGhost({
        card: drag.card,
        left: drag.x - drag.offsetX,
        top: drag.y - drag.offsetY,
        width: drag.width,
        height: drag.height,
        tilt,
      });
      if (releaseTimer.current !== null) window.clearTimeout(releaseTimer.current);
      releaseTimer.current = window.setTimeout(() => setReleaseGhost(null), RELEASE_MS);
      onActivate(drag.card);
    }

    // A non-committing throw is not an error state. The card simply falls back
    // into the freely arranged hand with no red/error feedback.
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
