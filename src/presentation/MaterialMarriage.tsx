import { useLayoutEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { rankOf, suitOf, type CardId, type GameEvent } from '../core/index.js';
import type { MaterialRect } from './MaterialExchangeTransfer.js';

const SUIT_SYMBOL = { spades: '♠', clubs: '♣', diamonds: '♦', hearts: '♥' } as const;
export const MARRIAGE_MATERIAL_TOTAL_MS = 580;
const MARRIAGE_CARD_MOTION_MS = 540;

export interface CapturedMarriageMaterial {
  revision: number;
  playedCard: CardId;
  partnerCard: CardId;
  playedFrom: MaterialRect;
  partnerFrom: MaterialRect;
}

interface MaterialMarriageProps {
  event: Extract<GameEvent, { type: 'marriage-declared' }>;
  playedEvent: Extract<GameEvent, { type: 'card-played' }>;
  captured: CapturedMarriageMaterial;
  onComplete: () => void;
}

type MarriageCardStyle = CSSProperties & {
  '--marriage-pair-x': string;
  '--marriage-pair-y': string;
  '--marriage-target-x': string;
  '--marriage-target-y': string;
  '--marriage-target-scale-x': number;
  '--marriage-target-scale-y': number;
  '--marriage-card-duration': string;
};

type TrumpCueStyle = CSSProperties & {
  '--marriage-cue-x': string;
  '--marriage-cue-y': string;
};

function rectOf(node: Element): MaterialRect {
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

function center(rect: MaterialRect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export function MaterialMarriage({ event, playedEvent, captured, onComplete }: MaterialMarriageProps) {
  const [ready, setReady] = useState(false);
  const [playedTarget, setPlayedTarget] = useState<MaterialRect | null>(null);
  const [partnerTarget, setPartnerTarget] = useState<MaterialRect | null>(null);
  const [pairCenter, setPairCenter] = useState<{ x: number; y: number } | null>(null);
  const [trumpTarget, setTrumpTarget] = useState<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    const playedRoot = document.querySelector<HTMLElement>(
      `.played[data-seat="${event.seat}"][data-card="${playedEvent.card}"]`,
    );
    const playedCard = playedRoot?.querySelector<HTMLElement>(':scope > .card') ?? null;
    const partnerSlot = document.querySelector<HTMLElement>(`.hand-slot[data-card="${captured.partnerCard}"]`);
    const partnerCard = partnerSlot?.querySelector<HTMLElement>(':scope > .card') ?? null;
    const trumpStatus = document.querySelector<HTMLElement>('.status-strip > span:nth-child(3)');

    if (!playedRoot || !playedCard || !partnerSlot || !partnerCard || !trumpStatus) {
      const timer = window.setTimeout(onComplete, 0);
      return () => window.clearTimeout(timer);
    }

    const nextPlayedTarget = rectOf(playedCard);
    const nextPartnerTarget = rectOf(partnerCard);
    const trumpRect = trumpStatus.getBoundingClientRect();
    const playedSourceCenter = center(captured.playedFrom);
    const partnerSourceCenter = center(captured.partnerFrom);
    const sourceMidX = (playedSourceCenter.x + partnerSourceCenter.x) / 2;
    const sourceTop = Math.min(captured.playedFrom.top, captured.partnerFrom.top);
    const sourceMidY = Math.max(86, sourceTop - Math.min(72, Math.max(46, window.innerHeight * .075)));

    playedRoot.classList.add('is-marriage-materializing');
    partnerSlot.classList.add('is-marriage-materializing');
    trumpStatus.classList.add('is-marriage-receiving');

    setPlayedTarget(nextPlayedTarget);
    setPartnerTarget(nextPartnerTarget);
    setPairCenter({ x: sourceMidX, y: sourceMidY });
    setTrumpTarget({ x: trumpRect.left + trumpRect.width / 2, y: trumpRect.top + trumpRect.height / 2 });
    setReady(true);

    const timer = window.setTimeout(onComplete, MARRIAGE_MATERIAL_TOTAL_MS);
    return () => {
      window.clearTimeout(timer);
      playedRoot.classList.remove('is-marriage-materializing');
      partnerSlot.classList.remove('is-marriage-materializing');
      trumpStatus.classList.remove('is-marriage-receiving');
    };
  }, [captured, event.seat, onComplete, playedEvent.card]);

  if (!ready || !playedTarget || !partnerTarget || !pairCenter || !trumpTarget) return null;

  const playedFace = face(captured.playedCard);
  const partnerFace = face(captured.partnerCard);
  const cueStartX = pairCenter.x;
  const cueStartY = pairCenter.y;

  const cardStyle = (from: MaterialRect, target: MaterialRect, side: -1 | 1) => ({
    left: from.left,
    top: from.top,
    width: from.width,
    height: from.height,
    '--marriage-pair-x': `${pairCenter.x + side * 22 - (from.left + from.width / 2)}px`,
    '--marriage-pair-y': `${pairCenter.y - (from.top + from.height / 2)}px`,
    '--marriage-target-x': `${target.left - from.left}px`,
    '--marriage-target-y': `${target.top - from.top}px`,
    '--marriage-target-scale-x': from.width > 0 ? target.width / from.width : 1,
    '--marriage-target-scale-y': from.height > 0 ? target.height / from.height : 1,
    '--marriage-card-duration': `${MARRIAGE_CARD_MOTION_MS}ms`,
  } as MarriageCardStyle);

  const cueStyle = {
    left: cueStartX,
    top: cueStartY,
    '--marriage-cue-x': `${trumpTarget.x - cueStartX}px`,
    '--marriage-cue-y': `${trumpTarget.y - cueStartY}px`,
  } as TrumpCueStyle;

  return createPortal(
    <div
      className="marriage-material-layer"
      aria-hidden="true"
      data-marriage-material-count="2"
      data-marriage-suit={event.suit}
      data-marriage-played={captured.playedCard}
      data-marriage-partner={captured.partnerCard}
    >
      <div
        className={`card marriage-material-card is-played ${playedFace.red ? 'red' : ''}`}
        data-marriage-card={captured.playedCard}
        data-marriage-role="played"
        style={cardStyle(captured.playedFrom, playedTarget, -1)}
      >
        <span className="rank" data-suit={playedFace.symbol}>{playedFace.rank}</span>
        <span className="suit">{playedFace.symbol}</span>
      </div>
      <div
        className={`card marriage-material-card is-partner ${partnerFace.red ? 'red' : ''}`}
        data-marriage-card={captured.partnerCard}
        data-marriage-role="partner"
        style={cardStyle(captured.partnerFrom, partnerTarget, 1)}
      >
        <span className="rank" data-suit={partnerFace.symbol}>{partnerFace.rank}</span>
        <span className="suit">{partnerFace.symbol}</span>
      </div>
      <span className="marriage-trump-cue" data-marriage-trump={event.suit} style={cueStyle}>
        {SUIT_SYMBOL[event.suit]}
      </span>
    </div>,
    document.body,
    'marriage-material-layer',
  );
}
