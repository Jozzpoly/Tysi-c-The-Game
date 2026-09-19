import type { CompletedTrick, GameEvent, PlayedCard } from '../core/index.js';

export type TrickPresentationKind = 'static' | 'ordinary-play' | 'trick-completion';
export type TrickCompletionStage = 'arrival' | 'resolve' | 'collect' | 'consequence' | 'settled';

export interface TrickPresentationPlan {
  kind: TrickPresentationKind;
  freshPlay: PlayedCard | null;
  completedTrick: CompletedTrick | null;
  durationMs: number;
}

// Readable table cadence: preserve enough dwell to see ordinary plays and keep
// heavier causal events progressively longer instead of collapsing them into a burst.
export const NORMAL_PRESENTATION_MS = 480;
export const MARRIAGE_PRESENTATION_MS = 680;
export const TRICK_COMPLETION_PRESENTATION_MS = 900;
// Dealing is deliberately unchanged: the last staggered card completes its
// physical flight at roughly 552 ms, so 620 ms remains the safe material gate.
export const DEAL_PRESENTATION_MS = 620;

export const TRICK_COMPLETION_TIMELINE = {
  resolveMs: 220,
  collectMs: 390,
  consequenceMs: 620,
  settleMs: 820,
} as const;

function lastEventOfType<T extends GameEvent['type']>(
  events: readonly GameEvent[],
  type: T,
): Extract<GameEvent, { type: T }> | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.type === type) return event as Extract<GameEvent, { type: T }>;
  }
  return null;
}

export function presentationFrameDuration(events: readonly GameEvent[]): number {
  if (events.some((event) => event.type === 'trick-completed')) return TRICK_COMPLETION_PRESENTATION_MS;
  if (events.some((event) => event.type === 'marriage-declared')) return MARRIAGE_PRESENTATION_MS;
  if (events.some((event) => event.type === 'hand-started' || event.type === 'four-nines-redeal')) return DEAL_PRESENTATION_MS;
  return NORMAL_PRESENTATION_MS;
}

export function trickCompletionStageAt(elapsedMs: number): TrickCompletionStage {
  const elapsed = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0);
  if (elapsed < TRICK_COMPLETION_TIMELINE.resolveMs) return 'arrival';
  if (elapsed < TRICK_COMPLETION_TIMELINE.collectMs) return 'resolve';
  if (elapsed < TRICK_COMPLETION_TIMELINE.consequenceMs) return 'collect';
  if (elapsed < TRICK_COMPLETION_TIMELINE.settleMs) return 'consequence';
  return 'settled';
}

export function planTrickPresentation(events: readonly GameEvent[]): TrickPresentationPlan {
  const played = lastEventOfType(events, 'card-played');
  const completed = lastEventOfType(events, 'trick-completed');

  if (completed) {
    return {
      kind: 'trick-completion',
      freshPlay: played ? { seat: played.seat, card: played.card } : null,
      completedTrick: {
        ...completed.trick,
        plays: completed.trick.plays.map((play) => ({ ...play })),
      },
      durationMs: presentationFrameDuration(events),
    };
  }

  if (played) {
    return {
      kind: 'ordinary-play',
      freshPlay: { seat: played.seat, card: played.card },
      completedTrick: null,
      durationMs: presentationFrameDuration(events),
    };
  }

  return {
    kind: 'static',
    freshPlay: null,
    completedTrick: null,
    durationMs: presentationFrameDuration(events),
  };
}
