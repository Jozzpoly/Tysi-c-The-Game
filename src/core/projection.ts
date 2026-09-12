import { legalCommands } from './legality.js';
import { observe } from './reducer.js';
import type { Command, MatchState, Scores, Seat, SeatObservation } from './model.js';

export interface SeatScoreBreakdown {
  cardPoints: number;
  marriagePoints: number;
  rawPoints: number;
  scoreBefore: number;
  scoreDelta: number;
  scoreAfter: number;
  locked: boolean;
}

export interface HandScoreSummary {
  declarer: Seat;
  contract: number;
  contractMade: boolean;
  lockThreshold: number;
  seats: [SeatScoreBreakdown, SeatScoreBreakdown, SeatScoreBreakdown];
}

export interface SeatProjection {
  profile: {
    id: string;
    version: number;
  };
  observation: SeatObservation;
  legalCommands: Command[];
  /**
   * Public, deterministic explanation of the most recently scored normal hand.
   * Derived from canonical state so reconnects receive the same explanation
   * without persisting a second scoring authority.
   */
  scoreSummary: HandScoreSummary | null;
}

function scoreSummary(state: MatchState): HandScoreSummary | null {
  const hand = state.hand;
  if (
    hand.phase !== 'complete' ||
    hand.completion?.kind !== 'played' ||
    hand.declarer === null ||
    hand.contract === null ||
    hand.handScoreDelta === null
  ) return null;

  const delta = hand.handScoreDelta;
  const raw = ([0, 1, 2] as const).map(
    (seat) => hand.capturedCardPoints[seat] + hand.marriagePoints[seat],
  ) as Scores;
  const declarer = hand.declarer;

  const seats = ([0, 1, 2] as const).map((seat) => {
    const scoreAfter = state.scores[seat];
    const scoreBefore = scoreAfter - delta[seat];
    return {
      cardPoints: hand.capturedCardPoints[seat],
      marriagePoints: hand.marriagePoints[seat],
      rawPoints: raw[seat],
      scoreBefore,
      scoreDelta: delta[seat],
      scoreAfter,
      locked: seat !== declarer && scoreBefore >= state.rules.scoring.lockThreshold,
    };
  }) as HandScoreSummary['seats'];

  return {
    declarer,
    contract: hand.contract,
    contractMade: raw[declarer] >= hand.contract,
    lockThreshold: state.rules.scoring.lockThreshold,
    seats,
  };
}

/**
 * The only game-state shape a human-facing adapter should need.
 * Local play may build it in-process; online play can serialize the same contract.
 */
export function projectSeat(state: MatchState, seat: Seat): SeatProjection {
  return {
    profile: { id: state.rules.id, version: state.rules.version },
    observation: observe(state, seat),
    legalCommands: legalCommands(state, seat),
    scoreSummary: scoreSummary(state),
  };
}
