import assert from 'node:assert/strict';
import {
  PLAYOK_3P_800_CANDIDATE,
  allowedBidValues,
  applyCommand,
  assertCoreInvariants,
  cardId,
  createMatch,
  eventsForSeat,
  legalCards,
  legalCommands,
  observe,
  playAutomatedHand,
  playAutomatedMatch,
  roundDefenderScore,
} from '../dist/core/index.js';

assert.equal(roundDefenderScore(25, 'nearest-10-half-up'), 30);
assert.equal(roundDefenderScore(25, 'nearest-10-six-up'), 20);

// Hidden-information boundary before anything is public: no opponent card or talon
// identity may appear anywhere in seat 0's serialized observation.
const hiddenState = createMatch(PLAYOK_3P_800_CANDIDATE, 1234, 0);
const hiddenObservation = observe(hiddenState, 0);
const hiddenSerialized = JSON.stringify(hiddenObservation);
for (const card of [...hiddenState.hand.hands[1], ...hiddenState.hand.hands[2], ...hiddenState.hand.talon]) {
  assert.equal(hiddenSerialized.includes(card), false, `hidden card leaked into observation: ${card}`);
}
assert.deepEqual(hiddenObservation.ownHand, hiddenState.hand.hands[0]);
assert.equal(hiddenObservation.revealedTalon, null);
assert.equal('hands' in hiddenObservation, false);

// Rejected commands never emit feedback facts.
const rejected = applyCommand(hiddenState, { type: 'pass', seat: 0 });
assert.equal(rejected.ok, false);
assert.deepEqual(rejected.events, []);

// Forced 100: after both other players pass, the forced forehand wins.
let state = hiddenState;
assert.equal(state.hand.auction.highBidder, 1);
assert.equal(state.hand.auction.turn, 2);
let result = applyCommand(state, { type: 'pass', seat: 2 });
assert.equal(result.ok, true);
assert.deepEqual(result.events.map((event) => event.type), ['player-passed']);
state = result.state;
result = applyCommand(state, { type: 'pass', seat: 0 });
assert.equal(result.ok, true);
assert.deepEqual(result.events.map((event) => event.type), ['player-passed', 'auction-won', 'talon-revealed']);
state = result.state;
assert.equal(state.hand.phase, 'exchange');
assert.equal(state.hand.declarer, 1);
assert.equal(state.hand.hands[1].length, 10);
assert.equal(state.hand.revealedTalon?.length, 3);
assertCoreInvariants(state);

// Candidate bomb window: only the declarer can withdraw after the talon is revealed
// and before committing the exchange. The first bomb is free and ends the hand
// without creating a final contract or pretending that tricks were played.
assert.ok(legalCommands(state, 1).some((command) => command.type === 'bomb'));
assert.equal(legalCommands(state, 0).some((command) => command.type === 'bomb'), false);
const wrongBomb = applyCommand(state, { type: 'bomb', seat: 0 });
assert.equal(wrongBomb.ok, false);
assert.equal(wrongBomb.reason, 'NOT_DECLARER');
assert.deepEqual(wrongBomb.events, []);

const firstBomb = applyCommand(state, { type: 'bomb', seat: 1 });
assert.equal(firstBomb.ok, true);
assert.equal(firstBomb.state.hand.phase, 'complete');
assert.equal(firstBomb.state.hand.contract, null);
assert.deepEqual(firstBomb.state.hand.completion, { kind: 'bomb', seat: 1, bombNumber: 1 });
assert.deepEqual(firstBomb.state.hand.handScoreDelta, [0, 0, 0]);
assert.deepEqual(firstBomb.state.scores, [0, 0, 0]);
assert.deepEqual(firstBomb.state.bombsUsed, [0, 1, 0]);
assert.deepEqual(firstBomb.events.map((event) => event.type), ['hand-bombed']);
assertCoreInvariants(firstBomb.state);

const afterBombAdvance = applyCommand(firstBomb.state, { type: 'next-hand', seat: 0 });
assert.equal(afterBombAdvance.ok, true);
assert.equal(afterBombAdvance.state.hand.phase, 'auction');
assert.deepEqual(afterBombAdvance.state.bombsUsed, [0, 1, 0]);
assertCoreInvariants(afterBombAdvance.state);

// Repeated bomb candidate: each unlocked opponent receives +60. The ordinary
// Kurnik 800 lock is provisionally applied to bomb awards as well.
let repeatBombState = createMatch(PLAYOK_3P_800_CANDIDATE, 4321, 0);
repeatBombState.scores = [790, 0, 800];
repeatBombState.bombsUsed = [0, 1, 0];
result = applyCommand(repeatBombState, { type: 'pass', seat: 2 });
assert.equal(result.ok, true);
repeatBombState = result.state;
result = applyCommand(repeatBombState, { type: 'pass', seat: 0 });
assert.equal(result.ok, true);
repeatBombState = result.state;
assert.equal(repeatBombState.hand.declarer, 1);
const secondBomb = applyCommand(repeatBombState, { type: 'bomb', seat: 1 });
assert.equal(secondBomb.ok, true);
assert.deepEqual(secondBomb.state.bombsUsed, [0, 2, 0]);
assert.deepEqual(secondBomb.state.hand.completion, { kind: 'bomb', seat: 1, bombNumber: 2 });
assert.deepEqual(secondBomb.state.hand.handScoreDelta, [60, 0, 0]);
assert.deepEqual(secondBomb.state.scores, [850, 0, 800]);
const bombEvent = secondBomb.events.find((event) => event.type === 'hand-bombed');
assert.deepEqual(bombEvent?.delta, [60, 0, 0]);
assertCoreInvariants(secondBomb.state);

// Projection exposes the observing seat's cards, counts and now-public talon,
// but still not authoritative hands.
const observation = observe(state, 0);
assert.equal(observation.ownHand.length, 7);
assert.deepEqual(observation.opponentCardCounts, [7, 10, 7]);
assert.equal('hands' in observation, false);

// Current recipient-private transfer pin: the recipient sees the card received by
// that seat, while the card transferred to the other opponent remains hidden.
// Choose cards that came from the declarer's original hand rather than the public talon.
const publicTalon = new Set(state.hand.revealedTalon ?? []);
const privateTransferCards = state.hand.hands[1].filter((card) => !publicTalon.has(card)).slice(0, 2);
assert.equal(privateTransferCards.length, 2);
result = applyCommand(state, {
  type: 'exchange',
  seat: 1,
  give: [
    { to: 0, card: privateTransferCards[0] },
    { to: 2, card: privateTransferCards[1] },
  ],
});
assert.equal(result.ok, true);
assert.deepEqual(result.events.map((event) => event.type), ['exchange-completed', 'card-received', 'card-received']);

// The transient feedback channel must obey the same hidden-information boundary
// as SeatObservation. Seat 0 gets only its private received-card event; seat 2 gets
// only its own; the declarer sees no private receive event at all.
const seat0EventJson = JSON.stringify(eventsForSeat(result.events, 0));
assert.ok(seat0EventJson.includes(privateTransferCards[0]), 'seat 0 event feed must include its received card');
assert.equal(seat0EventJson.includes(privateTransferCards[1]), false, 'seat 2 transfer leaked through event feed');
const seat2EventJson = JSON.stringify(eventsForSeat(result.events, 2));
assert.ok(seat2EventJson.includes(privateTransferCards[1]), 'seat 2 event feed must include its received card');
assert.equal(seat2EventJson.includes(privateTransferCards[0]), false, 'seat 0 transfer leaked through event feed');
const declarerEventJson = JSON.stringify(eventsForSeat(result.events, 1));
assert.equal(declarerEventJson.includes(privateTransferCards[0]), false, 'private transfer identity leaked through public event');
assert.equal(declarerEventJson.includes(privateTransferCards[1]), false, 'private transfer identity leaked through public event');

state = result.state;
assertCoreInvariants(state);
const recipientObservation = observe(state, 0);
const recipientSerialized = JSON.stringify(recipientObservation);
assert.ok(recipientObservation.ownHand.includes(privateTransferCards[0]), 'recipient must see its received card');
assert.equal(recipientSerialized.includes(privateTransferCards[1]), false, 'other transferred card leaked to recipient');

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

// Declaring a marriage on lead immediately establishes trump, awards the pinned
// marriage value and emits presentation facts without requiring state diffing.
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
assert.deepEqual(result.events.map((event) => event.type), ['marriage-declared', 'card-played']);
const marriageEvent = result.events.find((event) => event.type === 'marriage-declared');
assert.equal(marriageEvent?.points, 100);
assert.equal(marriageEvent?.suit, 'hearts');

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
assert.ok(result.events.some((event) => event.type === 'trick-completed'));
assert.ok(result.events.some((event) => event.type === 'hand-scored'));

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
assert.ok(result.events.some((event) => event.type === 'match-completed'));

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
