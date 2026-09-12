import assert from 'node:assert/strict';
import {
  PLAYOK_3P_800_CANDIDATE,
  applyCommand,
  assertCoreInvariants,
  cardId,
  createDeck,
  createMatch,
  eventsForSeat,
  legalCommands,
  observe,
  projectSeat,
  sortHand,
} from '../dist/core/index.js';

function receivedFourthNineScenario() {
  const state = createMatch(PLAYOK_3P_800_CANDIDATE, 20260912, 0);
  const deck = createDeck();
  const threeNines = [cardId('spades', '9'), cardId('clubs', '9'), cardId('diamonds', '9')];
  const transferredNine = cardId('hearts', '9');
  const nonNines = deck.filter((card) => !card.endsWith(':9'));

  const seat1 = sortHand([...threeNines, ...nonNines.slice(0, 4)]);
  const seat2 = sortHand(nonNines.slice(4, 11));
  const used = new Set([...seat1, ...seat2]);
  const declarer = sortHand(deck.filter((card) => !used.has(card)));
  assert.equal(declarer.length, 10);
  assert.ok(declarer.includes(transferredNine));

  state.hand.phase = 'exchange';
  state.hand.declarer = 0;
  state.hand.auction.currentBid = 100;
  state.hand.auction.highBidder = 0;
  state.hand.hands = [declarer, seat1, seat2];
  state.hand.revealedTalon = declarer.slice(0, 3);
  state.hand.fourNinesSeat = null;
  state.hand.contract = null;
  state.hand.trick = [];
  state.hand.trickIndex = 0;
  state.hand.capturedCards = [[], [], []];
  state.hand.capturedCardPoints = [0, 0, 0];
  state.hand.marriagePoints = [0, 0, 0];
  state.hand.capturedTricks = [0, 0, 0];
  state.hand.declaredMarriages = [[], [], []];
  state.hand.completion = null;

  const secondTransfer = declarer.find((card) => card !== transferredNine);
  assert.ok(secondTransfer);
  assertCoreInvariants(state);
  return { state, transferredNine, secondTransfer };
}

const scenario = receivedFourthNineScenario();
let result = applyCommand(scenario.state, {
  type: 'exchange',
  seat: 0,
  give: [
    { to: 1, card: scenario.transferredNine },
    { to: 2, card: scenario.secondTransfer },
  ],
});
assert.equal(result.ok, true);
assert.equal(result.state.hand.phase, 'redeal-option');
assert.equal(result.state.hand.fourNinesSeat, 1);
assert.equal(result.state.hand.hands[1].filter((card) => card.endsWith(':9')).length, 4);
assertCoreInvariants(result.state);

// Only the holder learns that a four-nines choice exists. The command/event/projection
// boundary must not tell the declarer or the other defender why the game is waiting.
assert.deepEqual(
  legalCommands(result.state, 1).map((command) => command.type).sort(),
  ['continue-after-four-nines', 'request-redeal'],
);
assert.deepEqual(legalCommands(result.state, 0), []);
assert.deepEqual(legalCommands(result.state, 2), []);

const eligibleObservation = observe(result.state, 1);
assert.equal(eligibleObservation.phase, 'redeal-option');
assert.equal(eligibleObservation.fourNinesOption, true);
for (const seat of [0, 2]) {
  const observation = observe(result.state, seat);
  assert.equal(observation.phase, 'contract');
  assert.equal(observation.fourNinesOption, false);
  const projectionJson = JSON.stringify(projectSeat(result.state, seat));
  assert.equal(projectionJson.includes('redeal-option'), false);
  assert.equal(projectionJson.includes('request-redeal'), false);
  assert.equal(projectionJson.includes('continue-after-four-nines'), false);
}

const eligibleEvents = eventsForSeat(result.events, 1);
assert.ok(eligibleEvents.some((event) => event.type === 'four-nines-option'));
for (const seat of [0, 2]) {
  const eventJson = JSON.stringify(eventsForSeat(result.events, seat));
  assert.equal(eventJson.includes('four-nines-option'), false);
}

const optionState = result.state;
const wrongSeat = applyCommand(optionState, { type: 'request-redeal', seat: 0 });
assert.equal(wrongSeat.ok, false);
assert.equal(wrongSeat.reason, 'NOT_YOUR_TURN');
assert.deepEqual(wrongSeat.events, []);

// Declining is private in effect: no public explanatory event is emitted, and the
// normal declarer contract decision resumes from the same cards/scores.
const continued = applyCommand(optionState, { type: 'continue-after-four-nines', seat: 1 });
assert.equal(continued.ok, true);
assert.deepEqual(continued.events, []);
assert.equal(continued.state.hand.phase, 'contract');
assert.equal(continued.state.hand.fourNinesSeat, null);
assert.ok(legalCommands(continued.state, 0).some((command) => command.type === 'contract'));
assert.deepEqual(continued.state.scores, optionState.scores);
assertCoreInvariants(continued.state);

// Requesting a redeal is public, but it is a repeat of the current hand: scores,
// bomb counters, hand number and dealer stay put while a fresh deterministic deal
// replaces the cards and returns to auction.
const beforeSeed = optionState.seed;
const beforeScores = [...optionState.scores];
const beforeBombs = [...optionState.bombsUsed];
const beforeHandNumber = optionState.handNumber;
const beforeDealer = optionState.dealer;
const oldHands = JSON.stringify(optionState.hand.hands);
const redealt = applyCommand(optionState, { type: 'request-redeal', seat: 1 });
assert.equal(redealt.ok, true);
assert.equal(redealt.state.hand.phase, 'auction');
assert.equal(redealt.state.handNumber, beforeHandNumber);
assert.equal(redealt.state.dealer, beforeDealer);
assert.equal(redealt.state.hand.dealer, beforeDealer);
assert.deepEqual(redealt.state.scores, beforeScores);
assert.deepEqual(redealt.state.bombsUsed, beforeBombs);
assert.notEqual(redealt.state.seed, beforeSeed);
assert.notEqual(JSON.stringify(redealt.state.hand.hands), oldHands);
assert.equal(redealt.state.hand.fourNinesSeat, null);
assert.deepEqual(redealt.events.map((event) => event.type), ['four-nines-redeal']);
assert.ok(eventsForSeat(redealt.events, 0).some((event) => event.type === 'four-nines-redeal'));
assert.ok(eventsForSeat(redealt.events, 2).some((event) => event.type === 'four-nines-redeal'));
assertCoreInvariants(redealt.state);

console.log('four-nines smoke: PASS');
