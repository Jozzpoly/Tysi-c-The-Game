import { useLayoutEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { rankOf, suitOf, type CardId, type Seat } from '../core/index.js';

const SUIT_SYMBOL = { spades: '♠', clubs: '♣', diamonds: '♦', hearts: '♥' } as const;
export const TALON_TRANSFER_TOTAL_MS = 430;
const TALON_CARD_FLIGHT_MS = 360;
const TALON_CARD_STAGGER_MS = 25;

interface MaterialTalonTransferProps {
  cards: readonly CardId[];
  declarer: Seat;
  humanSeat: Seat;
  onComplete: () => void;
}

interface FlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface TalonFlight {
  card: CardId;
  from: FlightRect;
  to: FlightRect;
  rotate: number;
  delayMs: number;
}

type FlightStyle = CSSProperties & {
  '--talon-flight-x': string;
  '--talon-flight-y': string;
  '--talon-flight-scale-x': number;
  '--talon-flight-scale-y': number;
  '--talon-flight-rotate': string;
  '--talon-flight-delay': string;
  '--talon-flight-duration': string;
};

function rectOf(node: Element): FlightRect {
  const rect = node.getBoundingClientRect();
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}

function opponentTargetRect(anchor: HTMLElement, source: FlightRect, index: number): FlightRect {
  const backs = anchor.querySelector<HTMLElement>('.card-backs');
  const rect = (backs ?? anchor).getBoundingClientRect();
  const width = Math.max(25, Math.min(38, source.width * .72));
  const height = width / .68;
  const spread = 14;
  return {
    left: rect.left + rect.width / 2 - width / 2 + (index - 1) * spread,
    top: rect.top + rect.height / 2 - height / 2 + Math.abs(index - 1) * 2,
    width,
    height,
  };
}

function cardFace(card: CardId) {
  const suit = suitOf(card);
  const rank = rankOf(card);
  const symbol = SUIT_SYMBOL[suit];
  return { rank, symbol, red: suit === 'hearts' || suit === 'diamonds' };
}

export function MaterialTalonTransfer({ cards, declarer, humanSeat, onComplete }: MaterialTalonTransferProps) {
  const [flights, setFlights] = useState<TalonFlight[]>([]);
  const cardsKey = cards.join('|');

  useLayoutEffect(() => {
    const talon = document.querySelector<HTMLElement>('.talon');
    const sources = talon ? [...talon.querySelectorAll<HTMLElement>('.mini-cards > .card')] : [];
    const targetAnchor = document.querySelector<HTMLElement>(`[data-seat-anchor="${declarer}"]`);
    const targetSlots = declarer === humanSeat
      ? cards.map((card) => document.querySelector<HTMLElement>(`.hand-slot[data-card="${card}"]`))
      : [];

    const geometryReady = Boolean(
      talon
      && sources.length >= cards.length
      && targetAnchor
      && (declarer !== humanSeat || targetSlots.every(Boolean)),
    );

    if (!geometryReady || !talon || !targetAnchor) {
      const timer = window.setTimeout(onComplete, 0);
      return () => window.clearTimeout(timer);
    }

    const nextFlights = cards.map((card, index) => {
      const from = rectOf(sources[index]);
      let to: FlightRect;
      if (declarer === humanSeat) {
        const targetCard = targetSlots[index]?.querySelector<HTMLElement>(':scope > .card');
        to = targetCard ? rectOf(targetCard) : from;
      } else {
        to = opponentTargetRect(targetAnchor, from, index);
      }
      return {
        card,
        from,
        to,
        rotate: (index - 1) * 5,
        delayMs: index * TALON_CARD_STAGGER_MS,
      };
    });

    talon.classList.add('is-talon-materializing');
    for (const slot of targetSlots) slot?.classList.add('is-talon-materializing');
    setFlights(nextFlights);

    const timer = window.setTimeout(onComplete, TALON_TRANSFER_TOTAL_MS);
    return () => {
      window.clearTimeout(timer);
      talon.classList.remove('is-talon-materializing');
      for (const slot of targetSlots) slot?.classList.remove('is-talon-materializing');
    };
  }, [cardsKey, declarer, humanSeat, onComplete]);

  if (flights.length === 0) return null;

  return createPortal(
    <div className="talon-transfer-layer" aria-hidden="true" data-transfer-count={flights.length}>
      {flights.map((flight) => {
        const { rank, symbol, red } = cardFace(flight.card);
        const scaleX = flight.from.width > 0 ? flight.to.width / flight.from.width : 1;
        const scaleY = flight.from.height > 0 ? flight.to.height / flight.from.height : 1;
        const style = {
          left: flight.from.left,
          top: flight.from.top,
          width: flight.from.width,
          height: flight.from.height,
          '--talon-flight-x': `${flight.to.left - flight.from.left}px`,
          '--talon-flight-y': `${flight.to.top - flight.from.top}px`,
          '--talon-flight-scale-x': scaleX,
          '--talon-flight-scale-y': scaleY,
          '--talon-flight-rotate': `${flight.rotate}deg`,
          '--talon-flight-delay': `${flight.delayMs}ms`,
          '--talon-flight-duration': `${TALON_CARD_FLIGHT_MS}ms`,
        } as FlightStyle;
        return (
          <div
            key={flight.card}
            className={`card talon-transfer-card ${red ? 'red' : ''}`}
            data-talon-transfer-card={flight.card}
            style={style}
          >
            <span className="rank" data-suit={symbol}>{rank}</span>
            <span className="suit">{symbol}</span>
          </div>
        );
      })}
    </div>,
    document.body,
    'talon-transfer-layer',
  );
}
