import { useLayoutEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { cardId, rankOf, suitOf, type CardId, type GameEvent } from '../core/index.js';
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
  captured?: CapturedMarriageMaterial | null;
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

interface MarriageGeometry {
  mode: 'local' | 'opponent';
  playedCard: CardId;
  partnerCard: CardId;
  playedFrom: MaterialRect;
  partnerFrom: MaterialRect;
  playedTarget: MaterialRect;
  partnerTarget: MaterialRect;
  pairCenter: { x: number; y: number };
  trumpTarget: { x: number; y: number };
}

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

function centeredRect(x: number, y: number, width: number, height: number): MaterialRect {
  return { left: x - width / 2, top: y - height / 2, width, height };
}

function publicMarriagePartner(event: MaterialMarriageProps['event'], playedCard: CardId): CardId | null {
  if (suitOf(playedCard) !== event.suit) return null;
  const rank = rankOf(playedCard);
  if (rank === 'K') return cardId(event.suit, 'Q');
  if (rank === 'Q') return cardId(event.suit, 'K');
  return null;
}

export function MaterialMarriage({ event, playedEvent, captured = null, onComplete }: MaterialMarriageProps) {
  const [geometry, setGeometry] = useState<MarriageGeometry | null>(null);

  useLayoutEffect(() => {
    const playedRoot = document.querySelector<HTMLElement>(
      `.played[data-seat="${event.seat}"][data-card="${playedEvent.card}"]`,
    );
    const playedTargetNode = playedRoot?.querySelector<HTMLElement>(':scope > .card') ?? null;
    const trumpStatus = document.querySelector<HTMLElement>('.status-strip > span:nth-child(3)');
    const sourceAnchor = document.querySelector<HTMLElement>(`[data-seat-anchor="${event.seat}"]`);

    const localPartnerSlot = captured
      ? document.querySelector<HTMLElement>(`.hand-slot[data-card="${captured.partnerCard}"]`)
      : null;
    const localPartnerCard = localPartnerSlot?.querySelector<HTMLElement>(':scope > .card') ?? null;

    const playedCard = captured?.playedCard ?? playedEvent.card;
    const partnerCard = captured?.partnerCard ?? publicMarriagePartner(event, playedCard);
    const local = Boolean(captured);

    if (
      !playedRoot
      || !playedTargetNode
      || !trumpStatus
      || !partnerCard
      || (local && (!localPartnerSlot || !localPartnerCard))
      || (!local && !sourceAnchor)
    ) {
      const timer = window.setTimeout(onComplete, 0);
      return () => window.clearTimeout(timer);
    }

    const playedTarget = rectOf(playedTargetNode);
    const trumpRect = trumpStatus.getBoundingClientRect();
    let playedFrom: MaterialRect;
    let partnerFrom: MaterialRect;
    let partnerTarget: MaterialRect;
    let pairCenter: { x: number; y: number };

    if (captured && localPartnerCard) {
      playedFrom = captured.playedFrom;
      partnerFrom = captured.partnerFrom;
      partnerTarget = rectOf(localPartnerCard);
      const playedSourceCenter = center(playedFrom);
      const partnerSourceCenter = center(partnerFrom);
      const sourceMidX = (playedSourceCenter.x + partnerSourceCenter.x) / 2;
      const sourceTop = Math.min(playedFrom.top, partnerFrom.top);
      const sourceMidY = Math.max(86, sourceTop - Math.min(72, Math.max(46, window.innerHeight * .075)));
      pairCenter = { x: sourceMidX, y: sourceMidY };
      localPartnerSlot?.classList.add('is-marriage-materializing');
    } else if (sourceAnchor) {
      const sourceVisual = sourceAnchor.querySelector<HTMLElement>('.card-backs') ?? sourceAnchor;
      const sourceRect = rectOf(sourceVisual);
      const sourceCenter = center(sourceRect);
      const targetCenter = center(playedTarget);
      const aspect = playedTarget.height / Math.max(1, playedTarget.width);
      const faceWidth = Math.max(42, Math.min(playedTarget.width * .82, Math.max(48, sourceRect.width * .44)));
      const faceHeight = faceWidth * aspect;
      playedFrom = centeredRect(sourceCenter.x - 7, sourceCenter.y, faceWidth, faceHeight);
      partnerFrom = centeredRect(sourceCenter.x + 7, sourceCenter.y, faceWidth, faceHeight);
      partnerTarget = centeredRect(sourceCenter.x + 7, sourceCenter.y, faceWidth, faceHeight);
      pairCenter = {
        x: Math.max(52, Math.min(window.innerWidth - 52, sourceCenter.x + (targetCenter.x - sourceCenter.x) * .34)),
        y: Math.max(78, Math.min(window.innerHeight - 150, sourceCenter.y + (targetCenter.y - sourceCenter.y) * .34)),
      };
      sourceAnchor.classList.add('is-marriage-origin');
    } else {
      const timer = window.setTimeout(onComplete, 0);
      return () => window.clearTimeout(timer);
    }

    playedRoot.classList.add('is-marriage-materializing');
    trumpStatus.classList.add('is-marriage-receiving');

    setGeometry({
      mode: local ? 'local' : 'opponent',
      playedCard,
      partnerCard,
      playedFrom,
      partnerFrom,
      playedTarget,
      partnerTarget,
      pairCenter,
      trumpTarget: { x: trumpRect.left + trumpRect.width / 2, y: trumpRect.top + trumpRect.height / 2 },
    });

    const timer = window.setTimeout(onComplete, MARRIAGE_MATERIAL_TOTAL_MS);
    return () => {
      window.clearTimeout(timer);
      playedRoot.classList.remove('is-marriage-materializing');
      localPartnerSlot?.classList.remove('is-marriage-materializing');
      sourceAnchor?.classList.remove('is-marriage-origin');
      trumpStatus.classList.remove('is-marriage-receiving');
    };
  }, [captured, event, onComplete, playedEvent.card]);

  if (!geometry) return null;

  const playedFace = face(geometry.playedCard);
  const partnerFace = face(geometry.partnerCard);
  const cueStartX = geometry.pairCenter.x;
  const cueStartY = geometry.pairCenter.y;

  const cardStyle = (from: MaterialRect, target: MaterialRect, side: -1 | 1) => ({
    left: from.left,
    top: from.top,
    width: from.width,
    height: from.height,
    '--marriage-pair-x': `${geometry.pairCenter.x + side * 22 - (from.left + from.width / 2)}px`,
    '--marriage-pair-y': `${geometry.pairCenter.y - (from.top + from.height / 2)}px`,
    '--marriage-target-x': `${target.left - from.left}px`,
    '--marriage-target-y': `${target.top - from.top}px`,
    '--marriage-target-scale-x': from.width > 0 ? target.width / from.width : 1,
    '--marriage-target-scale-y': from.height > 0 ? target.height / from.height : 1,
    '--marriage-card-duration': `${MARRIAGE_CARD_MOTION_MS}ms`,
  } as MarriageCardStyle);

  const cueStyle = {
    left: cueStartX,
    top: cueStartY,
    '--marriage-cue-x': `${geometry.trumpTarget.x - cueStartX}px`,
    '--marriage-cue-y': `${geometry.trumpTarget.y - cueStartY}px`,
  } as TrumpCueStyle;

  return createPortal(
    <div
      className={`marriage-material-layer is-${geometry.mode}`}
      aria-hidden="true"
      data-marriage-material-count="2"
      data-marriage-mode={geometry.mode}
      data-marriage-source-seat={event.seat}
      data-marriage-suit={event.suit}
      data-marriage-played={geometry.playedCard}
      data-marriage-partner={geometry.partnerCard}
    >
      <div
        className={`card marriage-material-card is-played ${playedFace.red ? 'red' : ''}`}
        data-marriage-card={geometry.playedCard}
        data-marriage-role="played"
        style={cardStyle(geometry.playedFrom, geometry.playedTarget, -1)}
      >
        <span className="rank" data-suit={playedFace.symbol}>{playedFace.rank}</span>
        <span className="suit">{playedFace.symbol}</span>
      </div>
      <div
        className={`card marriage-material-card is-partner ${partnerFace.red ? 'red' : ''}`}
        data-marriage-card={geometry.partnerCard}
        data-marriage-role="partner"
        style={cardStyle(geometry.partnerFrom, geometry.partnerTarget, 1)}
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
