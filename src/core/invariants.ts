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

  for (const seat of [0, 1, 2] as const) {
    const points = hand.capturedCards[seat].reduce((sum, card) => sum + cardPoints(card), 0);
    if (points !== hand.capturedCardPoints[seat]) throw new Error(`captured points mismatch for seat ${seat}`);
    if (['contract', 'trick', 'complete'].includes(hand.phase)) {
      const playedPending = hand.trick.some((play) => play.seat === seat) ? 1 : 0;
      const expected = Math.max(0, 8 - hand.trickIndex - playedPending);
      if (hand.hands[seat].length !== expected) throw new Error(`seat ${seat} hand size ${hand.hands[seat].length} !== ${expected}`);
    }
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
