import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { cardId, rankOf, suitOf, type CardId, type Command, type Seat } from '../core/index.js';
import { GameTable, type GameTableProps } from './GameTable.js';
import { MaterialDeal } from './MaterialDeal.js';
import {
  MaterialExchangeTransfer,
  materialRectOf,
  type CapturedExchangeCard,
} from './MaterialExchangeTransfer.js';
import { MaterialMarriage, type CapturedMarriageMaterial } from './MaterialMarriage.js';
import { MaterialTalonTransfer } from './MaterialTalonTransfer.js';
import { TRICK_COMPLETION_TIMELINE, planTrickPresentation } from './trickPresentation.js';

const ALL_SEATS: readonly Seat[] = [0, 1, 2];

interface PendingExchangeMaterial {
  revision: number;
  cards: CapturedExchangeCard[];
}

export function LivingGameTable({ events = [], ...props }: GameTableProps) {
  const view = props.projection.observation;
  const plan = useMemo(() => planTrickPresentation(events), [events]);
  const completedTrick = plan.kind === 'trick-completion' ? plan.completedTrick : null;
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const [consequenceRevision, setConsequenceRevision] = useState<number | null>(null);
  const [consequenceReady, setConsequenceReady] = useState(false);
  const [anchors, setAnchors] = useState<(HTMLElement | null)[]>([null, null, null]);
  const [centerAnchor, setCenterAnchor] = useState<HTMLElement | null>(null);
  const [completedDealTransferKey, setCompletedDealTransferKey] = useState<string | null>(null);
  const [completedTalonTransferKey, setCompletedTalonTransferKey] = useState<string | null>(null);
  const [completedExchangeTransferKey, setCompletedExchangeTransferKey] = useState<string | null>(null);
  const [completedMarriageTransferKey, setCompletedMarriageTransferKey] = useState<string | null>(null);
  const [pendingExchangeMaterial, setPendingExchangeMaterial] = useState<PendingExchangeMaterial | null>(null);
  const [pendingMarriageMaterial, setPendingMarriageMaterial] = useState<CapturedMarriageMaterial | null>(null);

  const dealEvent = useMemo(() => {
    for (let index = events.length - 1; index >= 0; index -= 1) {
      const event = events[index];
      if (event.type === 'hand-started' || event.type === 'four-nines-redeal') return event;
    }
    return null;
  }, [events]);
  const talonEvent = useMemo(() => {
    for (let index = events.length - 1; index >= 0; index -= 1) {
      const event = events[index];
      if (event.type === 'talon-revealed') return event;
    }
    return null;
  }, [events]);
  const exchangeEvent = useMemo(() => {
    for (let index = events.length - 1; index >= 0; index -= 1) {
      const event = events[index];
      if (event.type === 'exchange-completed') return event;
    }
    return null;
  }, [events]);
  const receivedEvent = useMemo(() => {
    for (let index = events.length - 1; index >= 0; index -= 1) {
      const event = events[index];
      if (event.type === 'card-received' && event.to === view.seat) return event;
    }
    return null;
  }, [events, view.seat]);
  const marriageEvent = useMemo(() => {
    for (let index = events.length - 1; index >= 0; index -= 1) {
      const event = events[index];
      if (event.type === 'marriage-declared') return event;
    }
    return null;
  }, [events]);
  const marriagePlayedEvent = useMemo(() => {
    for (let index = events.length - 1; index >= 0; index -= 1) {
      const event = events[index];
      if (event.type === 'card-played') return event;
    }
    return null;
  }, [events]);

  const dealTransferKey = dealEvent
    ? `${dealEvent.type}:${view.handNumber}:${view.revision}:${dealEvent.dealer}`
    : null;
  const dealTransferActive = Boolean(
    dealTransferKey
    && dealEvent
    && dealEvent.handNumber === view.handNumber
    && view.phase === 'auction'
    && !prefersReducedMotion
    && completedDealTransferKey !== dealTransferKey,
  );
  const dealMaterialSettled = Boolean(
    dealTransferKey
    && completedDealTransferKey === dealTransferKey,
  );

  const talonTransferKey = talonEvent && view.declarer !== null
    ? `${view.handNumber}:${view.revision}:${view.declarer}:${talonEvent.cards.join('|')}`
    : null;
  const talonTransferActive = Boolean(
    talonTransferKey
    && talonEvent
    && view.declarer !== null
    && view.phase === 'exchange'
    && !prefersReducedMotion
    && completedTalonTransferKey !== talonTransferKey,
  );
  const talonMaterialSettled = Boolean(
    view.revealedTalon
    && view.phase !== 'auction'
    && view.phase !== 'trick'
    && view.phase !== 'complete'
    && !talonTransferActive,
  );

  const exchangeTransferKey = exchangeEvent
    ? `${view.handNumber}:${view.revision}:${exchangeEvent.from}:${exchangeEvent.recipients.join('-')}`
    : null;
  const exchangeTransferActive = Boolean(
    exchangeTransferKey
    && exchangeEvent
    && !prefersReducedMotion
    && completedExchangeTransferKey !== exchangeTransferKey,
  );
  const exchangeMaterialSettled = Boolean(
    exchangeTransferKey
    && completedExchangeTransferKey === exchangeTransferKey,
  );

  const authoritativeMarriageKey = marriageEvent && marriagePlayedEvent && marriageEvent.seat === marriagePlayedEvent.seat
    ? `${view.handNumber}:${view.revision}:${marriageEvent.seat}:${marriagePlayedEvent.card}:${marriageEvent.suit}`
    : null;
  const marriageTransferKey = pendingMarriageMaterial
    && authoritativeMarriageKey
    && marriageEvent?.seat === view.seat
    && marriagePlayedEvent?.seat === view.seat
    && marriagePlayedEvent.card === pendingMarriageMaterial.playedCard
    && view.revision > pendingMarriageMaterial.revision
      ? authoritativeMarriageKey
      : null;
  const marriageTransferActive = Boolean(
    marriageTransferKey
    && marriageEvent
    && marriagePlayedEvent
    && pendingMarriageMaterial
    && !prefersReducedMotion
    && completedMarriageTransferKey !== marriageTransferKey,
  );
  const marriageMaterialSettled = Boolean(
    authoritativeMarriageKey
    && completedMarriageTransferKey === authoritativeMarriageKey,
  );

  const materialTransferActive = dealTransferActive || talonTransferActive || exchangeTransferActive || marriageTransferActive;
  const tableProjection = materialTransferActive
    ? { ...props.projection, legalCommands: [] }
    : props.projection;

  const completeDealTransfer = useCallback(() => {
    if (dealTransferKey) setCompletedDealTransferKey(dealTransferKey);
  }, [dealTransferKey]);
  const completeTalonTransfer = useCallback(() => {
    if (talonTransferKey) setCompletedTalonTransferKey(talonTransferKey);
  }, [talonTransferKey]);
  const completeExchangeTransfer = useCallback(() => {
    if (exchangeTransferKey) setCompletedExchangeTransferKey(exchangeTransferKey);
    setPendingExchangeMaterial(null);
  }, [exchangeTransferKey]);
  const completeMarriageTransfer = useCallback(() => {
    if (marriageTransferKey) setCompletedMarriageTransferKey(marriageTransferKey);
    setPendingMarriageMaterial(null);
  }, [marriageTransferKey]);

  useEffect(() => {
    if (!prefersReducedMotion || !exchangeEvent || !pendingExchangeMaterial) return;
    setPendingExchangeMaterial(null);
  }, [exchangeEvent, pendingExchangeMaterial, prefersReducedMotion]);

  useEffect(() => {
    if (!pendingMarriageMaterial || view.revision <= pendingMarriageMaterial.revision) return;
    if (marriageTransferKey && prefersReducedMotion) {
      setCompletedMarriageTransferKey(marriageTransferKey);
      setPendingMarriageMaterial(null);
      return;
    }
    if (!marriageTransferKey) setPendingMarriageMaterial(null);
  }, [marriageTransferKey, pendingMarriageMaterial, prefersReducedMotion, view.revision]);

  function handleCommand(command: Command) {
    if (command.type === 'exchange' && command.seat === view.seat) {
      const captured = command.give.flatMap(({ card, to }) => {
        const node = document.querySelector<HTMLElement>(`.hand-slot[data-card="${card}"] > .card`);
        return node ? [{ card, to, from: materialRectOf(node) }] : [];
      });
      setPendingExchangeMaterial(captured.length === command.give.length
        ? { revision: view.revision, cards: captured }
        : null);
    }

    if (command.type === 'play' && command.seat === view.seat && command.declareMarriage) {
      const rank = rankOf(command.card);
      const partnerCard: CardId | null = rank === 'K'
        ? cardId(suitOf(command.card), 'Q')
        : rank === 'Q'
          ? cardId(suitOf(command.card), 'K')
          : null;
      const playedNode = document.querySelector<HTMLElement>(`.hand-slot[data-card="${command.card}"] > .card`);
      const partnerNode = partnerCard
        ? document.querySelector<HTMLElement>(`.hand-slot[data-card="${partnerCard}"] > .card`)
        : null;
      setPendingMarriageMaterial(partnerCard && playedNode && partnerNode
        ? {
            revision: view.revision,
            playedCard: command.card,
            partnerCard,
            playedFrom: materialRectOf(playedNode),
            partnerFrom: materialRectOf(partnerNode),
          }
        : null);
    }

    props.onCommand(command);
  }

  const displayedConsequenceReady = completedTrick === null
    ? true
    : prefersReducedMotion
      ? true
      : consequenceRevision === view.revision && consequenceReady;

  useEffect(() => {
    if (!completedTrick) {
      setConsequenceRevision(null);
      setConsequenceReady(false);
      return;
    }

    setConsequenceRevision(view.revision);
    if (prefersReducedMotion) {
      setConsequenceReady(true);
      return;
    }

    setConsequenceReady(false);
    const timer = window.setTimeout(() => setConsequenceReady(true), TRICK_COMPLETION_TIMELINE.consequenceMs);
    return () => window.clearTimeout(timer);
  }, [completedTrick, prefersReducedMotion, view.revision]);

  useLayoutEffect(() => {
    const next = ALL_SEATS.map((seat) => document.querySelector<HTMLElement>(`[data-seat-anchor="${seat}"]`));
    setAnchors((current) => current.every((anchor, index) => anchor === next[index]) ? current : next);
    const nextCenter = document.querySelector<HTMLElement>('.center');
    setCenterAnchor((current) => current === nextCenter ? current : nextCenter);
  }, [view.revision, view.seat]);

  // Run 05 P1: collection geometry is derived from the real destination pile.
  // The lifecycle remains authoritative; these custom properties only tell the
  // presentation layer where the already-completed trick should visually land.
  useLayoutEffect(() => {
    if (!completedTrick) return;

    const trick = document.querySelector<HTMLElement>('.trick');
    const target = document.querySelector<HTMLElement>(`[data-capture-pile-seat="${completedTrick.winner}"]`);
    if (!trick || !target) return;

    const targetRect = target.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;
    const played = [...trick.querySelectorAll<HTMLElement>('.played')];

    played.forEach((node, index) => {
      const card = node.querySelector<HTMLElement>(':scope > .card') ?? node;
      const rect = card.getBoundingClientRect();
      const sourceX = rect.left + rect.width / 2;
      const sourceY = rect.top + rect.height / 2;
      const scale = Math.max(.42, Math.min(.68, targetRect.width / Math.max(1, rect.width)));
      const rotate = (index - 1) * 3.2;

      node.style.setProperty('--run05-collect-x', `${targetX - sourceX}px`);
      node.style.setProperty('--run05-collect-y', `${targetY - sourceY}px`);
      node.style.setProperty('--run05-collect-scale', scale.toFixed(3));
      node.style.setProperty('--run05-collect-rotate', `${rotate}deg`);
    });

    return () => {
      for (const node of played) {
        node.style.removeProperty('--run05-collect-x');
        node.style.removeProperty('--run05-collect-y');
        node.style.removeProperty('--run05-collect-scale');
        node.style.removeProperty('--run05-collect-rotate');
      }
    };
  }, [anchors, completedTrick, view.revision]);

  const initiativeSeat = view.phase === 'trick'
    && view.trick.length === 0
    && view.trickLeader !== null
    && (!completedTrick || displayedConsequenceReady)
      ? view.trickLeader
      : null;

  const markers = ALL_SEATS.flatMap((seat) => {
    const anchor = anchors[seat];
    if (!anchor) return [];

    const pendingCapture = completedTrick?.winner === seat && !displayedConsequenceReady;
    const tricks = Math.max(0, view.capturedTricks[seat] - (pendingCapture ? 1 : 0));
    const points = Math.max(0, view.capturedCardPoints[seat] - (pendingCapture ? completedTrick?.points ?? 0 : 0));
    const updated = completedTrick?.winner === seat && displayedConsequenceReady;
    const initiative = initiativeSeat === seat;
    const pileLayers = Math.min(4, tricks);

    return [createPortal(
      <>
        <span
          className={`captured-pile ${seat === view.seat ? 'captured-pile-self' : ''} ${tricks === 0 ? 'is-empty' : ''} ${updated ? 'is-updated' : ''} ${initiative ? 'is-initiative' : ''}`}
          aria-hidden="true"
          data-capture-pile-seat={seat}
          data-captured-tricks={tricks}
          data-captured-points={points}
          data-next-initiative={initiative ? 'true' : 'false'}
          data-pile-layers={pileLayers}
        >
          <span className="captured-pile-cards">
            {Array.from({ length: pileLayers }, (_, index) => <i key={index} />)}
          </span>
          {tricks > 0 && <span className="captured-pile-value">{points}</span>}
        </span>
        <span
          className={`capture-state seat-consequence ${seat === view.seat ? 'seat-consequence-self' : ''} ${tricks === 0 && points === 0 ? 'is-empty' : ''} ${updated ? 'is-updated' : ''} ${initiative ? 'is-initiative' : ''}`}
          aria-label={`Zdobyte lewy: ${tricks}; punkty w kartach: ${points}${initiative ? '; następna inicjatywa' : ''}`}
          data-consequence-seat={seat}
          data-captured-tricks={tricks}
          data-captured-points={points}
          data-next-initiative={initiative ? 'true' : 'false'}
        >
          <span className="capture-state-mark" aria-hidden="true">◆</span>
          <span className="capture-state-tricks">{tricks}</span>
          <span>{points} pkt</span>
        </span>
      </>,
      anchor,
      String(seat),
    )];
  });

  const sceneFeedback = centerAnchor ? createPortal(
    <>
      {view.phase === 'auction' && (
        <span
          className="auction-focus"
          data-bid={view.auction.currentBid}
          aria-hidden="true"
        />
      )}
      {events.length > 0 && props.message && (
        <span
          key={`${view.revision}:${props.message}`}
          className="table-event-toast"
          data-message={props.message}
          aria-hidden="true"
        />
      )}
    </>,
    centerAnchor,
    'scene-feedback',
  ) : null;

  const dealMaterialState = centerAnchor && dealEvent
    ? createPortal(
      <span
        className={`material-deal-state ${dealTransferActive ? 'is-active' : dealMaterialSettled ? 'is-settled' : ''}`}
        data-deal-material-state={dealTransferActive ? 'active' : dealMaterialSettled ? 'settled' : 'idle'}
        data-deal-material-event={dealEvent.type}
        aria-hidden="true"
      />,
      centerAnchor,
      'material-deal-state',
    )
    : null;

  const talonMaterialState = centerAnchor && view.revealedTalon && view.phase !== 'trick' && view.phase !== 'complete'
    ? createPortal(
      <span
        className={`material-talon-state ${talonTransferActive ? 'is-active' : talonMaterialSettled ? 'is-settled' : ''}`}
        data-talon-material-state={talonTransferActive ? 'active' : talonMaterialSettled ? 'settled' : 'idle'}
        aria-hidden="true"
      />,
      centerAnchor,
      'material-talon-state',
    )
    : null;

  const exchangeMaterialState = centerAnchor && exchangeEvent
    ? createPortal(
      <span
        className={`material-exchange-state ${exchangeTransferActive ? 'is-active' : exchangeMaterialSettled ? 'is-settled' : ''}`}
        data-exchange-material-state={exchangeTransferActive ? 'active' : exchangeMaterialSettled ? 'settled' : 'idle'}
        aria-hidden="true"
      />,
      centerAnchor,
      'material-exchange-state',
    )
    : null;

  const marriageMaterialState = centerAnchor && authoritativeMarriageKey
    ? createPortal(
      <span
        className={`material-marriage-state ${marriageTransferActive ? 'is-active' : marriageMaterialSettled ? 'is-settled' : ''}`}
        data-marriage-material-state={marriageTransferActive ? 'active' : marriageMaterialSettled ? 'settled' : 'idle'}
        data-marriage-material-card={marriagePlayedEvent?.card ?? ''}
        data-marriage-material-suit={marriageEvent?.suit ?? ''}
        aria-hidden="true"
      />,
      centerAnchor,
      'material-marriage-state',
    )
    : null;

  return (
    <>
      <GameTable {...props} projection={tableProjection} events={events} onCommand={handleCommand} />
      {dealTransferActive && dealEvent && (
        <MaterialDeal
          ownCards={view.ownHand}
          dealer={dealEvent.dealer}
          humanSeat={view.seat}
          onComplete={completeDealTransfer}
        />
      )}
      {talonTransferActive && talonEvent && view.declarer !== null && (
        <MaterialTalonTransfer
          cards={talonEvent.cards}
          declarer={view.declarer}
          humanSeat={view.seat}
          onComplete={completeTalonTransfer}
        />
      )}
      {exchangeTransferActive && exchangeEvent && (
        <MaterialExchangeTransfer
          event={exchangeEvent}
          receivedEvent={receivedEvent}
          humanSeat={view.seat}
          capturedOutgoing={pendingExchangeMaterial?.cards ?? null}
          onComplete={completeExchangeTransfer}
        />
      )}
      {marriageTransferActive && marriageEvent && marriagePlayedEvent && pendingMarriageMaterial && (
        <MaterialMarriage
          event={marriageEvent}
          playedEvent={marriagePlayedEvent}
          captured={pendingMarriageMaterial}
          onComplete={completeMarriageTransfer}
        />
      )}
      {dealMaterialState}
      {talonMaterialState}
      {exchangeMaterialState}
      {marriageMaterialState}
      {sceneFeedback}
      {markers}
    </>
  );
}
