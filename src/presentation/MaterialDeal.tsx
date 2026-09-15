import { useLayoutEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { rankOf, suitOf, type CardId, type Seat } from '../core/index.js';
import { DEAL_PRESENTATION_MS } from './trickPresentation.js';

const SUIT_SYMBOL = { spades: '♠', clubs: '♣', diamonds: '♦', hearts: '♥' } as const;
const DEAL_CARD_FLIGHT_MS = 300;
const DEAL_ROUND_STAGGER_MS = 38;
const DEAL_SEAT_STAGGER_MS = 12;

interface MaterialDealProps {
  ownCards: readonly CardId[];
  dealer: Seat;
  humanSeat: Seat;
  onComplete: () => void;
}

interface MaterialRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface DealFlight {
  key: string;
  seat: Seat;
  card: CardId | null;
  faceVisible: boolean;
  from: MaterialRect;
  to: MaterialRect;
  rotate: number;
  delayMs: number;
}

type FlightStyle = CSSProperties & {
  '--deal-flight-x': string;
  '--deal-flight-y': string;
  '--deal-flight-scale-x': number;
  '--deal-flight-scale-y': number;
  '--deal-flight-rotate': string;
  '--deal-flight-delay': string;
  '--deal-flight-duration': string;
};

type SourceStyle = CSSProperties & {
  '--deal-source-width': string;
  '--deal-source-height': string;
};

function rectOf(node: Element): MaterialRect {
  const rect = node.getBoundingClientRect();
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}

function nextSeat(seat: Seat): Seat {
  return ((seat + 1) % 3) as Seat;
}

function cardFace(card: CardId) {
  const suit = suitOf(card);
  return {
    rank: rankOf(card),
    symbol: SUIT_SYMBOL[suit],
    red: suit === 'hearts' || suit === 'diamonds',
  };
}

function sourceRect(center: HTMLElement): MaterialRect {
  const rect = center.getBoundingClientRect();
  const width = 32;
  const height = width / .68;
  return {
    left: rect.left + rect.width / 2 - width / 2,
    top: rect.top + Math.min(64, Math.max(30, rect.height * .18)),
    width,
    height,
  };
}

export function MaterialDeal({ ownCards, dealer, humanSeat, onComplete }: MaterialDealProps) {
  const [flights, setFlights] = useState<DealFlight[]>([]);
  const [source, setSource] = useState<MaterialRect | null>(null);
  const cardsKey = ownCards.join('|');

  useLayoutEffect(() => {
    const center = document.querySelector<HTMLElement>('.center');
    const humanSlots = ownCards.map((card) => document.querySelector<HTMLElement>(`.hand-slot[data-card="${card}"]`));
    const opponentSeats = ([0, 1, 2] as Seat[]).filter((seat) => seat !== humanSeat);
    const opponentAnchors = opponentSeats.map((seat) => document.querySelector<HTMLElement>(`[data-seat-anchor="${seat}"]`));
    const opponentBacks = opponentAnchors.map((anchor) => anchor ? [...anchor.querySelectorAll<HTMLElement>('.card-backs i')] : []);

    const geometryReady = Boolean(
      center
      && ownCards.length === 7
      && humanSlots.every(Boolean)
      && opponentAnchors.every(Boolean)
      && opponentBacks.every((backs) => backs.length >= 7),
    );

    if (!geometryReady || !center) {
      const timer = window.setTimeout(onComplete, 0);
      return () => window.clearTimeout(timer);
    }

    const origin = sourceRect(center);
    const order: Seat[] = [nextSeat(dealer), nextSeat(nextSeat(dealer)), dealer];
    const nextFlights: DealFlight[] = [];

    for (let round = 0; round < 7; round += 1) {
      for (let orderIndex = 0; orderIndex < order.length; orderIndex += 1) {
        const seat = order[orderIndex];
        const delayMs = round * DEAL_ROUND_STAGGER_MS + orderIndex * DEAL_SEAT_STAGGER_MS;
        const from = {
          left: origin.left + (orderIndex - 1) * 1.8,
          top: origin.top + (round % 3) * .7,
          width: origin.width,
          height: origin.height,
        };

        if (seat === humanSeat) {
          const card = ownCards[round];
          const targetCard = humanSlots[round]?.querySelector<HTMLElement>(':scope > .card');
          if (!targetCard) continue;
          nextFlights.push({
            key: `${seat}:${round}:${card}`,
            seat,
            card,
            faceVisible: true,
            from,
            to: rectOf(targetCard),
            rotate: (round - 3) * .7,
            delayMs,
          });
          continue;
        }

        const opponentIndex = opponentSeats.indexOf(seat);
        const targetBack = opponentIndex >= 0 ? opponentBacks[opponentIndex][round] : null;
        if (!targetBack) continue;
        nextFlights.push({
          key: `${seat}:${round}:hidden`,
          seat,
          card: null,
          faceVisible: false,
          from,
          to: rectOf(targetBack),
          rotate: (seat === order[0] ? -1 : 1) * (2 + round * .45),
          delayMs,
        });
      }
    }

    if (nextFlights.length !== 21) {
      const timer = window.setTimeout(onComplete, 0);
      return () => window.clearTimeout(timer);
    }

    for (const slot of humanSlots) slot?.classList.add('is-deal-materializing');
    for (const anchor of opponentAnchors) anchor?.classList.add('is-deal-receiving');
    setSource(origin);
    setFlights(nextFlights);

    const timer = window.setTimeout(onComplete, DEAL_PRESENTATION_MS);
    return () => {
      window.clearTimeout(timer);
      for (const slot of humanSlots) slot?.classList.remove('is-deal-materializing');
      for (const anchor of opponentAnchors) anchor?.classList.remove('is-deal-receiving');
    };
  }, [cardsKey, dealer, humanSeat, onComplete]);

  if (!source || flights.length === 0) return null;

  const sourceStyle = {
    left: source.left,
    top: source.top,
    width: source.width,
    height: source.height,
    '--deal-source-width': `${source.width}px`,
    '--deal-source-height': `${source.height}px`,
  } as SourceStyle;

  return createPortal(
    <div className="deal-material-layer" aria-hidden="true" data-deal-transfer-count={flights.length}>
      <span className="deal-source-stack" style={sourceStyle} data-deal-source="deck">
        <i /><i /><i />
      </span>
      {flights.map((flight) => {
        const scaleX = flight.from.width > 0 ? flight.to.width / flight.from.width : 1;
        const scaleY = flight.from.height > 0 ? flight.to.height / flight.from.height : 1;
        const style = {
          left: flight.from.left,
          top: flight.from.top,
          width: flight.from.width,
          height: flight.from.height,
          '--deal-flight-x': `${flight.to.left - flight.from.left}px`,
          '--deal-flight-y': `${flight.to.top - flight.from.top}px`,
          '--deal-flight-scale-x': scaleX,
          '--deal-flight-scale-y': scaleY,
          '--deal-flight-rotate': `${flight.rotate}deg`,
          '--deal-flight-delay': `${flight.delayMs}ms`,
          '--deal-flight-duration': `${DEAL_CARD_FLIGHT_MS}ms`,
        } as FlightStyle;

        if (flight.faceVisible && flight.card) {
          const face = cardFace(flight.card);
          return (
            <div
              key={flight.key}
              className={`card deal-transfer-card is-face ${face.red ? 'red' : ''}`}
              data-deal-seat={flight.seat}
              data-deal-card={flight.card}
              style={style}
            >
              <span className="rank" data-suit={face.symbol}>{face.rank}</span>
              <span className="suit">{face.symbol}</span>
            </div>
          );
        }

        return (
          <span
            key={flight.key}
            className="deal-transfer-card deal-transfer-back is-back"
            data-deal-seat={flight.seat}
            style={style}
          />
        );
      })}
    </div>,
    document.body,
    'deal-material-layer',
  );
}
