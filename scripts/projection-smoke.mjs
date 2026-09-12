import assert from 'node:assert/strict';
import {
  PLAYOK_3P_800_CANDIDATE,
  createMatch,
  projectSeat,
} from '../dist/core/index.js';

for (const seat of [0, 1, 2]) {
  const state = createMatch(PLAYOK_3P_800_CANDIDATE, 1234, 0);
  const projection = projectSeat(state, seat);
  const serialized = JSON.stringify(projection);

  assert.equal(projection.profile.id, PLAYOK_3P_800_CANDIDATE.id);
  assert.equal(projection.profile.version, PLAYOK_3P_800_CANDIDATE.version);
  assert.deepEqual(projection.observation.ownHand, state.hand.hands[seat]);

  for (const other of [0, 1, 2]) {
    if (other === seat) continue;
    for (const card of state.hand.hands[other]) {
      assert.equal(serialized.includes(card), false, `seat ${seat} projection leaked seat ${other} card ${card}`);
    }
  }
  for (const card of state.hand.talon) {
    assert.equal(serialized.includes(card), false, `seat ${seat} projection leaked hidden talon card ${card}`);
  }
}

// In trick play the projection may expose legal command card ids, but only cards
// already present in the observing seat's own hand.
const trickState = createMatch(PLAYOK_3P_800_CANDIDATE, 4321, 0);
trickState.hand.phase = 'trick';
trickState.hand.declarer = 0;
trickState.hand.contract = 100;
trickState.hand.trickLeader = 0;
const trickProjection = projectSeat(trickState, 0);
const ownCards = new Set(trickProjection.observation.ownHand);
for (const command of trickProjection.legalCommands) {
  if (command.type === 'play') assert.ok(ownCards.has(command.card), `legal command exposed non-owned card ${command.card}`);
}
const trickSerialized = JSON.stringify(trickProjection);
for (const card of [...trickState.hand.hands[1], ...trickState.hand.hands[2], ...trickState.hand.talon]) {
  assert.equal(trickSerialized.includes(card), false, `trick projection leaked hidden card ${card}`);
}

console.log('seat projection smoke: PASS');
