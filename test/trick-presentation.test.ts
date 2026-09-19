import { describe, expect, it } from 'vitest';
import type { GameEvent } from '../src/core/index.js';
import {
  DEAL_PRESENTATION_MS,
  MARRIAGE_PRESENTATION_MS,
  NORMAL_PRESENTATION_MS,
  TRICK_COMPLETION_PRESENTATION_MS,
  TRICK_COMPLETION_TIMELINE,
  planTrickPresentation,
  presentationFrameDuration,
  trickCompletionStageAt,
} from '../src/presentation/trickPresentation.js';

const ordinaryPlay: GameEvent[] = [
  { type: 'card-played', audience: 'public', seat: 1, card: 'diamonds:J' },
];

const completedTrick: GameEvent[] = [
  { type: 'card-played', audience: 'public', seat: 0, card: 'diamonds:J' },
  {
    type: 'trick-completed',
    audience: 'public',
    trick: {
      index: 1,
      winner: 1,
      points: 15,
      plays: [
        { seat: 1, card: 'diamonds:10' },
        { seat: 2, card: 'diamonds:Q' },
        { seat: 0, card: 'diamonds:J' },
      ],
    },
  },
];

describe('Run 04 trick presentation planning', () => {
  it('recognizes an authoritative ordinary card arrival', () => {
    expect(planTrickPresentation(ordinaryPlay)).toEqual({
      kind: 'ordinary-play',
      freshPlay: { seat: 1, card: 'diamonds:J' },
      completedTrick: null,
      durationMs: NORMAL_PRESENTATION_MS,
    });
  });

  it('keeps the fresh third card and completed trick in one authoritative frame', () => {
    const plan = planTrickPresentation(completedTrick);
    expect(plan.kind).toBe('trick-completion');
    expect(plan.freshPlay).toEqual({ seat: 0, card: 'diamonds:J' });
    expect(plan.completedTrick?.winner).toBe(1);
    expect(plan.completedTrick?.points).toBe(15);
    expect(plan.completedTrick?.plays).toHaveLength(3);
    expect(plan.durationMs).toBe(TRICK_COMPLETION_PRESENTATION_MS);
  });

  it('does not invent a fresh play for a snapshot-like frame with no events', () => {
    expect(planTrickPresentation([])).toEqual({
      kind: 'static',
      freshPlay: null,
      completedTrick: null,
      durationMs: NORMAL_PRESENTATION_MS,
    });
  });

  it('pins the readable table cadence while leaving material deal room intact', () => {
    expect(NORMAL_PRESENTATION_MS).toBe(480);
    expect(MARRIAGE_PRESENTATION_MS).toBe(680);
    expect(TRICK_COMPLETION_PRESENTATION_MS).toBe(900);
    expect(DEAL_PRESENTATION_MS).toBe(620);
  });

  it('uses the deliberate marriage pacing for sensory readability', () => {
    const marriage: GameEvent[] = [
      { type: 'marriage-declared', audience: 'public', seat: 0, suit: 'hearts', points: 100 },
      { type: 'card-played', audience: 'public', seat: 0, card: 'hearts:K' },
    ];
    expect(presentationFrameDuration(marriage)).toBe(MARRIAGE_PRESENTATION_MS);
  });

  it('stages completion in causal order before the playback frame can advance', () => {
    expect(trickCompletionStageAt(0)).toBe('arrival');
    expect(trickCompletionStageAt(TRICK_COMPLETION_TIMELINE.resolveMs - 1)).toBe('arrival');
    expect(trickCompletionStageAt(TRICK_COMPLETION_TIMELINE.resolveMs)).toBe('resolve');
    expect(trickCompletionStageAt(TRICK_COMPLETION_TIMELINE.collectMs)).toBe('collect');
    expect(trickCompletionStageAt(TRICK_COMPLETION_TIMELINE.consequenceMs)).toBe('consequence');
    expect(trickCompletionStageAt(TRICK_COMPLETION_TIMELINE.settleMs)).toBe('settled');
    expect(TRICK_COMPLETION_TIMELINE.settleMs).toBeLessThan(TRICK_COMPLETION_PRESENTATION_MS);
  });

  it('normalizes invalid/negative elapsed time to the arrival stage', () => {
    expect(trickCompletionStageAt(-500)).toBe('arrival');
    expect(trickCompletionStageAt(Number.NaN)).toBe('arrival');
  });
});
