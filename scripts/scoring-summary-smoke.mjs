import assert from 'node:assert/strict';
import {
  PLAYOK_3P_800_CANDIDATE,
  createMatch,
  projectSeat,
} from '../dist/core/index.js';

// A completed normal hand with one failed contract, one defender blocked at 800,
// and one defender whose 55 raw points round to +60.
const state = createMatch(PLAYOK_3P_800_CANDIDATE, 20260912, 0);
state.hand.phase = 'complete';
state.hand.declarer = 0;
state.hand.contract = 100;
state.hand.capturedCardPoints = [90, 55, 55];
state.hand.marriagePoints = [0, 0, 0];
state.hand.handScoreDelta = [-100, 0, 60];
state.hand.completion = { kind: 'played' };
state.scores = [-100, 800, 60];

const summary = projectSeat(state, 0).scoreSummary;
assert.ok(summary);
assert.equal(summary.declarer, 0);
assert.equal(summary.contract, 100);
assert.equal(summary.contractMade, false);
assert.equal(summary.lockThreshold, 800);
assert.deepEqual(summary.seats[0], {
  cardPoints: 90,
  marriagePoints: 0,
  rawPoints: 90,
  scoreBefore: 0,
  scoreDelta: -100,
  scoreAfter: -100,
  locked: false,
});
assert.deepEqual(summary.seats[1], {
  cardPoints: 55,
  marriagePoints: 0,
  rawPoints: 55,
  scoreBefore: 800,
  scoreDelta: 0,
  scoreAfter: 800,
  locked: true,
});
assert.deepEqual(summary.seats[2], {
  cardPoints: 55,
  marriagePoints: 0,
  rawPoints: 55,
  scoreBefore: 0,
  scoreDelta: 60,
  scoreAfter: 60,
  locked: false,
});

// Scoring explanation is public and does not vary by observing seat.
assert.deepEqual(projectSeat(state, 1).scoreSummary, summary);
assert.deepEqual(projectSeat(state, 2).scoreSummary, summary);

// Marriage contribution remains explicit rather than folded invisibly into raw points.
const made = createMatch(PLAYOK_3P_800_CANDIDATE, 20260913, 0);
made.hand.phase = 'complete';
made.hand.declarer = 2;
made.hand.contract = 120;
made.hand.capturedCardPoints = [20, 30, 80];
made.hand.marriagePoints = [0, 0, 40];
made.hand.handScoreDelta = [20, 30, 120];
made.hand.completion = { kind: 'played' };
made.scores = [20, 30, 120];
const madeSummary = projectSeat(made, 0).scoreSummary;
assert.ok(madeSummary);
assert.equal(madeSummary.contractMade, true);
assert.deepEqual(madeSummary.seats[2], {
  cardPoints: 80,
  marriagePoints: 40,
  rawPoints: 120,
  scoreBefore: 0,
  scoreDelta: 120,
  scoreAfter: 120,
  locked: false,
});

// A bomb has different semantics and deliberately keeps the existing bomb-specific UI.
const bombed = createMatch(PLAYOK_3P_800_CANDIDATE, 20260914, 0);
bombed.hand.phase = 'complete';
bombed.hand.declarer = 1;
bombed.hand.handScoreDelta = [0, 0, 0];
bombed.hand.completion = { kind: 'bomb', seat: 1, bombNumber: 1 };
assert.equal(projectSeat(bombed, 0).scoreSummary, null);

// Incomplete hands must never expose a speculative scoring explanation.
const live = createMatch(PLAYOK_3P_800_CANDIDATE, 20260915, 0);
assert.equal(projectSeat(live, 0).scoreSummary, null);

console.log('scoring-summary-smoke: PASS');
