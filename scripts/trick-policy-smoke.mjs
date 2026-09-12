import assert from 'node:assert/strict';
import {
  PLAYOK_3P_800_CANDIDATE,
  cardId,
  createMatch,
  legalCards,
} from '../dist/core/index.js';

function withTrick(overrides) {
  return {
    ...PLAYOK_3P_800_CANDIDATE,
    id: `TRICK_POLICY_SMOKE_${Object.entries(overrides).map(([key, value]) => `${key}_${value}`).join('_')}`,
    trick: { ...PLAYOK_3P_800_CANDIDATE.trick, ...overrides },
  };
}

function scenario(rules, { trump = 'hearts', trick, hand }) {
  const state = createMatch(rules, 20260912, 0);
  state.hand.phase = 'trick';
  state.hand.declarer = 0;
  state.hand.contract = 100;
  state.hand.trickLeader = 0;
  state.hand.trump = trump;
  state.hand.trick = trick;
  state.hand.hands[1] = hand;
  return state;
}

// Current PlayOK/Kurnik candidate remains strict: follow suit and beat in-suit
// when possible.
const strictFollow = scenario(PLAYOK_3P_800_CANDIDATE, {
  trick: [{ seat: 0, card: cardId('clubs', 'K') }],
  hand: [cardId('clubs', 'A'), cardId('clubs', 'J'), cardId('hearts', 'A')],
});
assert.deepEqual(legalCards(strictFollow, 1), [cardId('clubs', 'A')]);

// A bounded variant can keep follow-suit while disabling the stronger-card
// obligation. Off-suit cards are still illegal.
const noBeat = scenario(withTrick({ mustBeatWhenPossible: false }), {
  trick: [{ seat: 0, card: cardId('clubs', 'K') }],
  hand: [cardId('clubs', 'A'), cardId('clubs', 'J'), cardId('hearts', 'A')],
});
assert.deepEqual(legalCards(noBeat, 1), [cardId('clubs', 'A'), cardId('clubs', 'J')]);

// Pagat explicitly documents Polish tables where a player void in the led suit
// is not required to trump. Changing only mustTrumpWhenVoid must therefore make
// both the voluntary trump and an ordinary discard legal.
const strictTrump = scenario(PLAYOK_3P_800_CANDIDATE, {
  trick: [{ seat: 0, card: cardId('clubs', 'A') }],
  hand: [cardId('hearts', '9'), cardId('spades', 'A')],
});
assert.deepEqual(legalCards(strictTrump, 1), [cardId('hearts', '9')]);

const freeDiscard = scenario(withTrick({ mustTrumpWhenVoid: false }), {
  trick: [{ seat: 0, card: cardId('clubs', 'A') }],
  hand: [cardId('hearts', '9'), cardId('spades', 'A')],
});
assert.deepEqual(legalCards(freeDiscard, 1), [cardId('hearts', '9'), cardId('spades', 'A')]);

// When trumping is compulsory, overtrump is independently reversible. Turning
// it off permits any trump but still forbids an off-suit discard.
const strictOvertrump = scenario(PLAYOK_3P_800_CANDIDATE, {
  trick: [
    { seat: 0, card: cardId('clubs', 'A') },
    { seat: 1, card: cardId('hearts', 'K') },
  ],
  hand: [cardId('hearts', 'A'), cardId('hearts', '9'), cardId('spades', 'A')],
});
// Seat 2 acts after seats 0 and 1, so use a matching state for that actor.
strictOvertrump.hand.hands[2] = strictOvertrump.hand.hands[1];
strictOvertrump.hand.hands[1] = [];
assert.deepEqual(legalCards(strictOvertrump, 2), [cardId('hearts', 'A')]);

const noOvertrump = scenario(withTrick({ mustOvertrumpWhenPossible: false }), {
  trick: [
    { seat: 0, card: cardId('clubs', 'A') },
    { seat: 1, card: cardId('hearts', 'K') },
  ],
  hand: [cardId('hearts', 'A'), cardId('hearts', '9'), cardId('spades', 'A')],
});
noOvertrump.hand.hands[2] = noOvertrump.hand.hands[1];
noOvertrump.hand.hands[1] = [];
assert.deepEqual(legalCards(noOvertrump, 2), [cardId('hearts', 'A'), cardId('hearts', '9')]);

// Follow-suit remains the dominant obligation even when another player has
// already trumped the trick.
const precedence = scenario(PLAYOK_3P_800_CANDIDATE, {
  trick: [
    { seat: 0, card: cardId('clubs', '9') },
    { seat: 1, card: cardId('hearts', '9') },
  ],
  hand: [cardId('clubs', 'A'), cardId('hearts', 'A')],
});
precedence.hand.hands[2] = precedence.hand.hands[1];
precedence.hand.hands[1] = [];
assert.deepEqual(legalCards(precedence, 2), [cardId('clubs', 'A')]);

// Full follow-suit disable is supported as a structural capability, but is not a
// claim about PlayOK or the current Polish candidate.
const freePlay = scenario(withTrick({ mustFollowSuit: false }), {
  trick: [{ seat: 0, card: cardId('clubs', 'K') }],
  hand: [cardId('clubs', 'A'), cardId('clubs', 'J'), cardId('hearts', 'A')],
});
assert.deepEqual(legalCards(freePlay, 1), [cardId('clubs', 'A'), cardId('clubs', 'J'), cardId('hearts', 'A')]);

console.log('trick-policy-smoke: PASS');
