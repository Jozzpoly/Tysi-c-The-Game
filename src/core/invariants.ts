import { CARD_POINTS, RANK_STRENGTH, SUITS, cardPoints } from './cards.js';
import type { MatchState } from './model.js';

export function assertCoreInvariants(state: MatchState): void {
  const hand = state.hand;
  const held = hand.hands.flat();
  const pending = hand.trick.map((play) => play.card);
  const captured = hand.capturedCards.flat();
  const talonOutsideHands = hand.phase === 'auction' ? hand.talon : [];
  const accounted = [...held, ...pending, ...captured, ...talonOutsideHands];

  if (accounted.length !== 24) throw new Error(`card conservation failed: ${accounted.length} !== 24`);
  if (new Set(accounted).size !== 24) throw new Error('card uniqueness failed');
  if (captured.length !== hand.trickIndex * 3) throw new Error('captured card count does not match completed tricks');

  for (const count of state.bombsUsed) {
    if (!Number.isInteger(count) || count < 0) throw new Error('bomb counts must be non-negative integers');
  }

  for (const seat of [0, 1, 2] as const) {
    const points = hand.capturedCards[seat].reduce((sum, card) => sum + cardPoints(card), 0);
    if (points !== hand.capturedCardPoints[seat]) throw new Error(`captured points mismatch for seat ${seat}`);

    const bombComplete = hand.phase === 'complete' && hand.completion?.kind === 'bomb';
    if (bombComplete) {
      const expected = seat === hand.declarer ? 10 : 7;
      if (hand.hands[seat].length !== expected) {
        throw new Error(`bomb-complete seat ${seat} hand size ${hand.hands[seat].length} !== ${expected}`);
      }
    } else if (['contract', 'trick', 'complete'].includes(hand.phase)) {
      const playedPending = hand.trick.some((play) => play.seat === seat) ? 1 : 0;
      const expected = Math.max(0, 8 - hand.trickIndex - playedPending);
      if (hand.hands[seat].length !== expected) throw new Error(`seat ${seat} hand size ${hand.hands[seat].length} !== ${expected}`);
    }
  }

  if (hand.completion?.kind === 'bomb') {
    if (hand.phase !== 'complete') throw new Error('bomb completion requires complete hand phase');
    if (hand.declarer !== hand.completion.seat) throw new Error('only the declarer can complete a hand by bomb');
    if (hand.contract !== null) throw new Error('bombed hand must not have a final contract');
    if (hand.trickIndex !== 0 || captured.length !== 0 || pending.length !== 0) {
      throw new Error('bombed hand must end before trick play');
    }
    if (state.bombsUsed[hand.completion.seat] !== hand.completion.bombNumber) {
      throw new Error('bomb completion count must match match bomb counter');
    }
  }

  if (hand.completion?.kind === 'played' && hand.phase !== 'complete') {
    throw new Error('played completion requires complete hand phase');
  }

  if (hand.lastCompletedTrick) {
    if (hand.lastCompletedTrick.plays.length !== 3) throw new Error('completed trick must contain exactly 3 plays');
    if (hand.lastCompletedTrick.index !== hand.trickIndex) throw new Error('completed trick index must match current completed trick count');
    if (!hand.lastCompletedTrick.plays.some((play) => play.seat === hand.lastCompletedTrick?.winner)) {
      throw new Error('completed trick winner must be one of its players');
    }
    const points = hand.lastCompletedTrick.plays.reduce((sum, play) => sum + cardPoints(play.card), 0);
    if (points !== hand.lastCompletedTrick.points) throw new Error('completed trick point total mismatch');
  }

  if (hand.phase === 'auction' && hand.talon.length !== 3) throw new Error('auction talon must have 3 cards');
  if (hand.phase === 'exchange' && hand.declarer !== null && hand.hands[hand.declarer].length !== 10) {
    throw new Error('declarer must hold 10 cards before exchange');
  }
  if (hand.trick.length > 2) throw new Error('pending trick cannot contain more than 2 cards');
  if (hand.trickIndex < 0 || hand.trickIndex > 8) throw new Error('trick index out of range');
  if (Object.values(CARD_POINTS).reduce((a, b) => a + b, 0) * SUITS.length !== 120) throw new Error('deck card points must total 120');
  if (RANK_STRENGTH.A <= RANK_STRENGTH['10']) throw new Error('rank ordering corrupted');
}
