import assert from 'node:assert/strict';
import {
  PLAYOK_3P_800_CANDIDATE,
  allowedBidValues,
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

// Auction >120 is capped by marriage capacity for the acting hand.
const bidScenario = createMatch(PLAYOK_3P_800_CANDIDATE, 10, 0);
bidScenario.hand.auction.turn = 2;
bidScenario.hand.auction.currentBid = 100;
bidScenario.hand.hands[2] = [
  cardId('hearts', 'K'),
  cardId('hearts', 'Q'),
  cardId('clubs', '9'),
  cardId('clubs', 'J'),
  cardId('diamonds', '9'),
  cardId('spades', '9'),
  cardId('spades', 'J'),
];
assert.ok(allowedBidValues(bidScenario, 2).includes(220));
assert.ok(!allowedBidValues(bidScenario, 2).includes(230));
bidScenario.hand.hands[2] = bidScenario.hand.hands[2].filter((card) => card !== cardId('hearts', 'Q'));
assert.deepEqual(allowedBidValues(bidScenario, 2), [110, 120]);

// Strict candidate: following suit has precedence and a stronger in-suit card is mandatory.
const followScenario = createMatch(PLAYOK_3P_800_CANDIDATE, 55, 0);
followScenario.hand.phase = 'trick';
followScenario.hand.declarer = 0;
followScenario.hand.contract = 100;
followScenario.hand.trickLeader = 0;
followScenario.hand.hands = [
  [cardId('clubs', '9')],
  [cardId('clubs', 'A'), cardId('clubs', 'J'), cardId('hearts', 'A')],
  [cardId('spades', '9')],
];
followScenario.hand.trick = [{ seat: 0, card: cardId('clubs', 'K') }];
assert.deepEqual(legalCards(followScenario, 1), [cardId('clubs', 'A')]);

// If void in the led suit, the candidate requires trump.
const trumpScenario = createMatch(PLAYOK_3P_800_CANDIDATE, 56, 0);
trumpScenario.hand.phase = 'trick';
trumpScenario.hand.declarer = 0;
trumpScenario.hand.contract = 100;
trumpScenario.hand.trickLeader = 0;
trumpScenario.hand.trump = 'hearts';
trumpScenario.hand.trick = [{ seat: 0, card: cardId('clubs', 'A') }];
trumpScenario.hand.hands[1] = [cardId('hearts', '9'), cardId('spades', 'A')];
assert.deepEqual(legalCards(trumpScenario, 1), [cardId('hearts', '9')]);

// If a trump already wins and a higher trump exists, overtrump is mandatory.
const overtrumpScenario = createMatch(PLAYOK_3P_800_CANDIDATE, 57, 0);
overtrumpScenario.hand.phase = 'trick';
overtrumpScenario.hand.declarer = 0;
overtrumpScenario.hand.contract = 100;
overtrumpScenario.hand.trickLeader = 0;
overtrumpScenario.hand.trump = 'hearts';
overtrumpScenario.hand.trick = [
  { seat: 0, card: cardId('clubs', 'A') },
  { seat: 1, card: cardId('hearts', 'K') },
];
overtrumpScenario.hand.hands[2] = [cardId('hearts', 'A'), cardId('hearts', '9'), cardId('spades', 'A')];
assert.deepEqual(legalCards(overtrumpScenario, 2), [cardId('hearts', 'A')]);

// Following the led suit still has priority even when a trump currently wins the trick.
const precedenceScenario = createMatch(PLAYOK_3P_800_CANDIDATE, 58, 0);
precedenceScenario.hand.phase = 'trick';
precedenceScenario.hand.declarer = 0;
precedenceScenario.hand.contract = 100;
precedenceScenario.hand.trickLeader = 0;
precedenceScenario.hand.trump = 'hearts';
precedenceScenario.hand.trick = [
  { seat: 0, card: cardId('clubs', '9') },
  { seat: 1, card: cardId('hearts', '9') },
];
precedenceScenario.hand.hands[2] = [cardId('clubs', 'A'), cardId('hearts', 'A')];
assert.deepEqual(legalCards(precedenceScenario, 2), [cardId('clubs', 'A')]);

// Declaring a marriage on lead immediately establishes trump and awards the pinned marriage value.
const marriageScenario = createMatch(PLAYOK_3P_800_CANDIDATE, 59, 0);
marriageScenario.hand.phase = 'trick';
marriageScenario.hand.declarer = 0;
marriageScenario.hand.contract = 100;
marriageScenario.hand.trickLeader = 0;
marriageScenario.hand.hands[0] = [cardId('hearts', 'K'), cardId('hearts', 'Q')];
result = applyCommand(marriageScenario, { type: 'play', seat: 0, card: cardId('hearts', 'K'), declareMarriage: true });
assert.equal(result.ok, true);
assert.equal(result.state.hand.trump, 'hearts');
assert.equal(result.state.hand.marriagePoints[0], 100);

// Scoring boundary: a defender already on the 800 lock does not increase from defender points.
const lockScenario = createMatch(PLAYOK_3P_800_CANDIDATE, 60, 0);
lockScenario.scores = [0, 800, 790];
lockScenario.hand.phase = 'trick';
lockScenario.hand.declarer = 0;
lockScenario.hand.contract = 100;
lockScenario.hand.trickIndex = 7;
lockScenario.hand.trickLeader = 0;
lockScenario.hand.capturedCardPoints = [100, 50, 50];
lockScenario.hand.trick = [
  { seat: 0, card: cardId('clubs', 'A') },
  { seat: 1, card: cardId('clubs', '10') },
];
lockScenario.hand.hands[2] = [cardId('clubs', '9')];
result = applyCommand(lockScenario, { type: 'play', seat: 2, card: cardId('clubs', '9') });
assert.equal(result.ok, true);
assert.equal(result.state.scores[1], 800);

// If declarer and defenders all cross 1000 in the same hand, the documented declarer precedence wins.
const simultaneousScenario = createMatch(PLAYOK_3P_800_CANDIDATE, 61, 0);
simultaneousScenario.scores = [950, 790, 790];
simultaneousScenario.hand.phase = 'trick';
simultaneousScenario.hand.declarer = 0;
simultaneousScenario.hand.contract = 100;
simultaneousScenario.hand.trickIndex = 7;
simultaneousScenario.hand.trickLeader = 0;
simultaneousScenario.hand.capturedCardPoints = [100, 110, 110];
simultaneousScenario.hand.marriagePoints = [0, 100, 100];
simultaneousScenario.hand.trick = [
  { seat: 0, card: cardId('clubs', 'A') },
  { seat: 1, card: cardId('clubs', '10') },
];
simultaneousScenario.hand.hands[2] = [cardId('clubs', '9')];
result = applyCommand(simultaneousScenario, { type: 'play', seat: 2, card: cardId('clubs', '9') });
assert.equal(result.ok, true);
assert.equal(result.state.status, 'complete');
assert.equal(result.state.winner, 0);
assert.equal(result.state.draw, false);

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
