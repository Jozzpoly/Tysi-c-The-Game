import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Seat } from '../core/index.js';
import { GameTable, type GameTableProps } from './GameTable.js';
import { TRICK_COMPLETION_TIMELINE, planTrickPresentation } from './trickPresentation.js';

const ALL_SEATS: readonly Seat[] = [0, 1, 2];

export function LivingGameTable({ events = [], ...props }: GameTableProps) {
  const view = props.projection.observation;
  const plan = useMemo(() => planTrickPresentation(events), [events]);
  const completedTrick = plan.kind === 'trick-completion' ? plan.completedTrick : null;
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const [consequenceRevision, setConsequenceRevision] = useState<number | null>(null);
  const [consequenceReady, setConsequenceReady] = useState(false);
  const [anchors, setAnchors] = useState<(HTMLElement | null)[]>([null, null, null]);
  const [centerAnchor, setCenterAnchor] = useState<HTMLElement | null>(null);

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

  return (
    <>
      <GameTable {...props} events={events} />
      {sceneFeedback}
      {markers}
    </>
  );
}