import assert from 'node:assert/strict';
import {
  PLAYOK_3P_800_CANDIDATE,
  applyCommand,
  assertCoreInvariants,
  cardId,
  createMatch,
  legalCards,
  observe,
  playAutomatedHand,
  playAutomatedMatch,
  roundDefenderScore,
} from '../dist/core/index.js';

assert.equal(roundDefenderScore(25, 'nearest-10-half-up'), 30);
assert.equal(roundDefenderScore(25, 'nearest-10-six-up'), 20);

// Forced 100: after both other players pass, the forced forehand wins.
let state = createMatch(PLAYOK_3P_800_CANDIDATE, 1234, 0);
assert.equal(state.hand.auction.highBidder, 1);
assert.equal(state.hand.auction.turn, 2);
let result = applyCommand(state, { type: 'pass', seat: 2 });
assert.equal(result.ok, true);
state = result.state;
result = applyCommand(state, { type: 'pass', seat: 0 });
assert.equal(result.ok, true);
state = result.state;
assert.equal(state.hand.phase, 'exchange');
assert.equal(state.hand.declarer, 1);
assert.equal(state.hand.hands[1].length, 10);
assert.equal(state.hand.revealedTalon?.length, 3);
assertCoreInvariants(state);

// Projection exposes the observing seat's cards, counts and public talon, not authoritative hands.
const observation = observe(state, 0);
assert.equal(observation.ownHand.length, 7);
assert.deepEqual(observation.opponentCardCounts, [7, 10, 7]);
assert.equal('hands' in observation, false);

// Strict PlayOK candidate: following suit has precedence and a stronger in-suit card is mandatory.
const manual = createMatch(PLAYOK_3P_800_CANDIDATE, 55, 0);
manual.hand.phase = 'trick';
manual.hand.declarer = 0;
manual.hand.contract = 100;
manual.hand.trickLeader = 0;
manual.hand.hands = [
  [cardId('clubs', '9')],
  [cardId('clubs', 'A'), cardId('clubs', 'J'), cardId('hearts', 'A')],
  [cardId('spades', '9')],
];
manual.hand.trick = [{ seat: 0, card: cardId('clubs', 'K') }];
assert.deepEqual(legalCards(manual, 1), [cardId('clubs', 'A')]);

for (const seed of [1, 2, 3, 17, 99]) {
  const handEnd = playAutomatedHand(createMatch(PLAYOK_3P_800_CANDIDATE, seed));
  assert.equal(handEnd.hand.phase, 'complete');
  assert.equal(handEnd.hand.trickIndex, 8);
  assert.equal(handEnd.hand.hands.flat().length, 0);
  assertCoreInvariants(handEnd);
}

for (const seed of [1, 7, 42]) {
  const matchEnd = playAutomatedMatch(createMatch(PLAYOK_3P_800_CANDIDATE, seed), 500);
  assert.equal(matchEnd.status, 'complete');
  assert.ok(matchEnd.winner !== null || matchEnd.draw);
  assertCoreInvariants(matchEnd);
  console.log(`seed=${seed} winner=${matchEnd.winner} hands=${matchEnd.handNumber} scores=${matchEnd.scores.join('/')}`);
}

console.log('core smoke: PASS');
