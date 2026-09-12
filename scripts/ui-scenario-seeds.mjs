import assert from 'node:assert/strict';
import {
  PLAYOK_3P_800_CANDIDATE,
  actingSeat,
  applyCommand,
  createMatch,
  legalCommands,
  productBotCommand,
} from '../dist/core/index.js';

function aggressiveHumanAuction(seed) {
  let state = createMatch(PLAYOK_3P_800_CANDIDATE, seed, 0);
  for (let step = 0; step < 32 && state.hand.phase === 'auction'; step += 1) {
    const actor = actingSeat(state);
    assert.notEqual(actor, null);
    let command;
    if (actor === 0) {
      const commands = legalCommands(state, 0);
      const bids = commands.filter((candidate) => candidate.type === 'bid').sort((a, b) => a.value - b.value);
      command = bids.at(-1) ?? commands.find((candidate) => candidate.type === 'pass');
    } else {
      command = productBotCommand(state, actor);
    }
    assert.ok(command, `seed ${seed}: no command for actor ${actor}`);
    const result = applyCommand(state, command);
    assert.equal(result.ok, true, `seed ${seed}: command rejected`);
    state = result.state;
  }
  assert.notEqual(state.hand.phase, 'auction', `seed ${seed}: auction did not terminate`);
  return state;
}

let declarerSeed = null;
for (let seed = 1; seed <= 500; seed += 1) {
  const state = aggressiveHumanAuction(seed);
  if (state.hand.declarer === 0) {
    declarerSeed = seed;
    console.log(`browser declarer seed=${seed} bid=${state.hand.auction.currentBid} hand=${state.hand.hands[0].join(',')}`);
    break;
  }
}

assert.notEqual(declarerSeed, null, 'no human-declarer browser scenario seed found in 1..500');
console.log(`browser scenario seed: PASS (${declarerSeed})`);
