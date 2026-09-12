import { legalCommands } from './legality.js';
import { observe } from './reducer.js';
import type { Command, MatchState, Seat, SeatObservation } from './model.js';

export interface SeatProjection {
  profile: {
    id: string;
    version: number;
  };
  observation: SeatObservation;
  legalCommands: Command[];
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
  };
}
