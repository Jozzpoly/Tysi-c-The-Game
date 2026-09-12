import assert from 'node:assert/strict';
import {
  PLAYOK_3P_800_CANDIDATE,
  actingSeat,
  applyCommand,
  assertCoreInvariants,
  createMatch,
  productBotCommand,
} from '../dist/core/index.js';

function playProductBotMatch(seed, maxCommands = 10000) {
  let state = createMatch(PLAYOK_3P_800_CANDIDATE, seed);
  assertCoreInvariants(state);

  for (let i = 0; i < maxCommands; i += 1) {
    if (state.status === 'complete') return state;

    if (state.hand.phase === 'complete') {
      const next = applyCommand(state, { type: 'next-hand' });
      assert.equal(next.ok, true, next.reason);
      state = next.state;
      assertCoreInvariants(state);
      continue;
    }

    const seat = actingSeat(state);
    assert.notEqual(seat, null);
    const command = productBotCommand(state, seat);
    const result = applyCommand(state, command);
    assert.equal(result.ok, true, `product bot command rejected: ${result.reason}`);
    state = result.state;
    assertCoreInvariants(state);
  }

  throw new Error(
    `product bots did not finish seed ${seed} within ${maxCommands} commands; ` +
      `hand=${state.handNumber} scores=${state.scores.join('/')} phase=${state.hand.phase} ` +
      `bid=${state.hand.auction.currentBid} declarer=${state.hand.declarer} contract=${state.hand.contract}`,
  );
}

for (const seed of [4, 11, 23, 71, 101]) {
  const end = playProductBotMatch(seed);
  assert.ok(end.winner !== null || end.draw);
  console.log(`product-bot seed=${seed} winner=${end.winner} hands=${end.handNumber} scores=${end.scores.join('/')}`);
}

console.log('product bot smoke: PASS');
