import { useLayoutEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { rankOf, suitOf, type CardId, type GameEvent, type Seat } from '../core/index.js';

const SUIT_SYMBOL = { spades: '♠', clubs: '♣', diamonds: '♦', hearts: '♥' } as const;
export const EXCHANGE_TRANSFER_TOTAL_MS = 430;
const EXCHANGE_CARD_FLIGHT_MS = 370;
const EXCHANGE_CARD_STAGGER_MS = 24;

export interface MaterialRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CapturedExchangeCard {
  card: CardId;
  to: Seat;
  from: MaterialRect;
}

interface MaterialExchangeTransferProps {
  event: Extract<GameEvent, { type: 'exchange-completed' }>;
  receivedEvent: Extract<GameEvent, { type: 'card-received' }> | null;
  humanSeat: Seat;
  capturedOutgoing: readonly CapturedExchangeCard[] | null;
  onComplete: () => void;
}

interface ExchangeFlight {
  key: string;
  card: CardId | null;
  recipient: Seat;
  faceVisible: boolean;
  from: MaterialRect;
  to: MaterialRect;
  rotate: number;
  delayMs: number;
}

type FlightStyle = CSSProperties & {
  '--exchange-flight-x': string;
  '--exchange-flight-y': string;
  '--exchange-flight-scale-x': number;
  '--exchange-flight-scale-y': number;
  '--exchange-flight-rotate': string;
  '--exchange-flight-delay': string;
  '--exchange-flight-duration': string;
};

export function materialRectOf(node: Element): MaterialRect {
  const rect = node.getBoundingClientRect();
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}

function face(card: CardId) {
  const suit = suitOf(card);
  return {
    rank: rankOf(card),
    symbol: SUIT_SYMBOL[suit],
    red: suit === 'hearts' || suit === 'diamonds',
  };
}

function centeredRect(anchor: Element, width: number, height: number, offsetX = 0): MaterialRect {
  const rect = anchor.getBoundingClientRect();
  return {
    left: rect.left + rect.width / 2 - width / 2 + offsetX,
    top: rect.top + rect.height / 2 - height / 2,
    width,
    height,
  };
}

function sourceBackRect(anchor: HTMLElement, index: number): MaterialRect {
  const backs = [...anchor.querySelectorAll<HTMLElement>('.card-backs i')];
  const node = backs.at(-(index + 1)) ?? anchor.querySelector<HTMLElement>('.card-backs') ?? anchor;
  return materialRectOf(node);
}

function targetBackRect(anchor: HTMLElement, source: MaterialRect): MaterialRect {
  const back = anchor.querySelector<HTMLElement>('.card-backs i:last-child');
  if (back) return materialRectOf(back);
  const width = Math.max(20, Math.min(36, source.width * .7));
  return centeredRect(anchor, width, width / .68);
}

export function MaterialExchangeTransfer({
  event,
  receivedEvent,
  humanSeat,
  capturedOutgoing,
  onComplete,
}: MaterialExchangeTransferProps) {
  const [flights, setFlights] = useState<ExchangeFlight[]>([]);
  const [receivingAnchors, setReceivingAnchors] = useState<HTMLElement[]>([]);
  const [materializingTarget, setMaterializingTarget] = useState<HTMLElement | null>(null);
  const capturedKey = capturedOutgoing?.map((item) => `${item.card}>${item.to}`).join('|') ?? '';

  useLayoutEffect(() => {
    const sourceAnchor = document.querySelector<HTMLElement>(`[data-seat-anchor="${event.from}"]`);
    const recipientAnchors = event.recipients.map((seat) => document.querySelector<HTMLElement>(`[data-seat-anchor="${seat}"]`));
    const humanIsDeclarer = event.from === humanSeat;

    if (!sourceAnchor || recipientAnchors.some((anchor) => !anchor)) {
      setFlights([]);
      setReceivingAnchors([]);
      setMaterializingTarget(null);
      const timer = window.setTimeout(onComplete, 0);
      return () => window.clearTimeout(timer);
    }

    const ownReceivedCard = !humanIsDeclarer && receivedEvent?.to === humanSeat
      ? receivedEvent.card
      : null;
    const ownTargetSlot = ownReceivedCard
      ? document.querySelector<HTMLElement>(`.hand-slot[data-card="${ownReceivedCard}"]`)
      : null;
    const ownTargetCard = ownTargetSlot?.querySelector<HTMLElement>(':scope > .card') ?? null;

    if (!humanIsDeclarer && event.recipients.includes(humanSeat) && (!ownTargetSlot || !ownTargetCard)) {
      setFlights([]);
      setReceivingAnchors([]);
      setMaterializingTarget(null);
      const timer = window.setTimeout(onComplete, 0);
      return () => window.clearTimeout(timer);
    }

    const resolvedRecipientAnchors = recipientAnchors as HTMLElement[];
    const nextFlights = event.recipients.map((recipient, index) => {
      const targetAnchor = resolvedRecipientAnchors[index]!;
      if (humanIsDeclarer) {
        const captured = capturedOutgoing?.find((item) => item.to === recipient) ?? null;
        const fallback = sourceBackRect(sourceAnchor, index);
        const from = captured?.from ?? fallback;
        return {
          key: captured?.card ?? `known-${recipient}`,
          card: captured?.card ?? null,
          recipient,
          faceVisible: Boolean(captured?.card),
          from,
          to: targetBackRect(targetAnchor, from),
          rotate: (index === 0 ? -1 : 1) * 7,
          delayMs: index * EXCHANGE_CARD_STAGGER_MS,
        } satisfies ExchangeFlight;
      }

      const from = sourceBackRect(sourceAnchor, index);
      const to = recipient === humanSeat && ownTargetCard
        ? materialRectOf(ownTargetCard)
        : targetBackRect(targetAnchor, from);
      return {
        key: recipient === humanSeat && ownReceivedCard ? ownReceivedCard : `hidden-${recipient}`,
        card: recipient === humanSeat ? ownReceivedCard : null,
        recipient,
        faceVisible: false,
        from,
        to,
        rotate: (index === 0 ? -1 : 1) * 5,
        delayMs: index * EXCHANGE_CARD_STAGGER_MS,
      } satisfies ExchangeFlight;
    });

    // These markers are React-owned portals inside the authoritative targets.
    // They replace the old classList mutation race with GameTable/TactileHand:
    // CSS can hide the already-authoritative back/card while the transfer object
    // is still visibly materializing, without React wiping presentation state.
    setReceivingAnchors(resolvedRecipientAnchors);
    setMaterializingTarget(ownTargetSlot);
    setFlights(nextFlights);

    const timer = window.setTimeout(onComplete, EXCHANGE_TRANSFER_TOTAL_MS);
    return () => window.clearTimeout(timer);
  }, [capturedKey, event.from, event.recipients, humanSeat, onComplete, receivedEvent]);

  if (flights.length === 0) return null;

  const transferLayer = createPortal(
    <div className="exchange-transfer-layer" aria-hidden="true" data-exchange-transfer-count={flights.length}>
      {flights.map((flight) => {
        const scaleX = flight.from.width > 0 ? flight.to.width / flight.from.width : 1;
        const scaleY = flight.from.height > 0 ? flight.to.height / flight.from.height : 1;
        const style = {
          left: flight.from.left,
          top: flight.from.top,
          width: flight.from.width,
          height: flight.from.height,
          '--exchange-flight-x': `${flight.to.left - flight.from.left}px`,
          '--exchange-flight-y': `${flight.to.top - flight.from.top}px`,
          '--exchange-flight-scale-x': scaleX,
          '--exchange-flight-scale-y': scaleY,
          '--exchange-flight-rotate': `${flight.rotate}deg`,
          '--exchange-flight-delay': `${flight.delayMs}ms`,
          '--exchange-flight-duration': `${EXCHANGE_CARD_FLIGHT_MS}ms`,
        } as FlightStyle;

        if (flight.faceVisible && flight.card) {
          const cardFace = face(flight.card);
          return (
            <div
              key={flight.key}
              className={`card exchange-transfer-card is-face ${cardFace.red ? 'red' : ''}`}
              data-exchange-card={flight.card}
              data-exchange-recipient={flight.recipient}
              style={style}
            >
              <span className="rank" data-suit={cardFace.symbol}>{cardFace.rank}</span>
              <span className="suit">{cardFace.symbol}</span>
            </div>
          );
        }

        return (
          <div
            key={flight.key}
            className="exchange-transfer-card exchange-transfer-back is-back"
            data-exchange-card={flight.card ?? undefined}
            data-exchange-recipient={flight.recipient}
            style={style}
          />
        );
      })}
    </div>,
    document.body,
    'exchange-transfer-layer',
  );

  const receivingMarkers = receivingAnchors.map((anchor, index) => createPortal(
    <span
      className="exchange-receiving-marker"
      data-exchange-receiving-seat={event.recipients[index]}
      aria-hidden="true"
    />,
    anchor,
    `exchange-receiving-${event.recipients[index]}`,
  ));

  const materializingMarker = materializingTarget && receivedEvent
    ? createPortal(
      <span
        className="exchange-materializing-marker"
        data-exchange-materializing-card={receivedEvent.card}
        aria-hidden="true"
      />,
      materializingTarget,
      `exchange-materializing-${receivedEvent.card}`,
    )
    : null;

  return (
    <>
      {transferLayer}
      {receivingMarkers}
      {materializingMarker}
    </>
  );
}
