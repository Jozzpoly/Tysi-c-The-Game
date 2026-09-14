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
  const [consequenceReady, setConsequenceReady] = useState(completedTrick === null);
  const [anchors, setAnchors] = useState<(HTMLElement | null)[]>([null, null, null]);

  useEffect(() => {
    if (!completedTrick) {
      setConsequenceReady(true);
      return;
    }

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reducedMotion) {
      setConsequenceReady(true);
      return;
    }

    setConsequenceReady(false);
    const timer = window.setTimeout(() => setConsequenceReady(true), TRICK_COMPLETION_TIMELINE.consequenceMs);
    return () => window.clearTimeout(timer);
  }, [completedTrick, view.revision]);

  useLayoutEffect(() => {
    const next = ALL_SEATS.map((seat) => document.querySelector<HTMLElement>(`[data-seat-anchor="${seat}"]`));
    setAnchors((current) => current.every((anchor, index) => anchor === next[index]) ? current : next);
  }, [view.revision, view.seat]);

  const initiativeSeat = view.phase === 'trick'
    && view.trick.length === 0
    && view.trickLeader !== null
    && (!completedTrick || consequenceReady)
      ? view.trickLeader
      : null;

  const markers = ALL_SEATS.flatMap((seat) => {
    const anchor = anchors[seat];
    if (!anchor) return [];

    const pendingCapture = completedTrick?.winner === seat && !consequenceReady;
    const tricks = Math.max(0, view.capturedTricks[seat] - (pendingCapture ? 1 : 0));
    const points = Math.max(0, view.capturedCardPoints[seat] - (pendingCapture ? completedTrick?.points ?? 0 : 0));
    const updated = completedTrick?.winner === seat && consequenceReady;
    const initiative = initiativeSeat === seat;

    return [createPortal(
      <span
        className={`capture-state seat-consequence ${seat === view.seat ? 'seat-consequence-self' : ''} ${tricks === 0 && points === 0 ? 'is-empty' : ''} ${updated ? 'is-updated' : ''} ${initiative ? 'is-initiative' : ''}`}
        aria-label={`Zdobyte lewy: ${tricks}; punkty w kartach: ${points}${initiative ? '; następna inicjatywa' : ''}`}
        data-consequence-seat={seat}
        data-captured-tricks={tricks}
        data-captured-points={points}
        data-next-initiative={initiative ? 'true' : 'false'}
        key={seat}
      >
        <span className="capture-state-mark" aria-hidden="true">◆</span>
        <strong>{tricks}</strong>
        <span>{points} pkt</span>
      </span>,
      anchor,
    )];
  });

  return (
    <>
      <GameTable {...props} events={events} />
      {markers}
    </>
  );
}
