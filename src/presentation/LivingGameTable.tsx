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
  }, [view.revision, view.seat]);

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

    return [createPortal(
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
      </span>,
      anchor,
      String(seat),
    )];
  });

  return (
    <>
      <GameTable {...props} events={events} />
      {markers}
    </>
  );
}
