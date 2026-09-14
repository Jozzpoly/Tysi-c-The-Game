import type { CompletedTrick, GameEvent, PlayedCard } from '../core/index.js';

export type TrickPresentationKind = 'static' | 'ordinary-play' | 'trick-completion';

export interface TrickPresentationPlan {
  kind: TrickPresentationKind;
  freshPlay: PlayedCard | null;
  completedTrick: CompletedTrick | null;
  durationMs: number;
}

export const NORMAL_PRESENTATION_MS = 480;
export const MARRIAGE_PRESENTATION_MS = 680;
export const TRICK_COMPLETION_PRESENTATION_MS = 900;

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
  return NORMAL_PRESENTATION_MS;
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
