import assert from 'node:assert/strict';
import {
  PLAYOK_3P_800_CANDIDATE,
  actingSeat,
  applyCommand,
  assertCoreInvariants,
  createMatch,
  productBotCommand,
} from '../dist/core/index.js';

function playProductBotMatch(seed, maxCommands = 20000) {
  let state = createMatch(PLAYOK_3P_800_CANDIDATE, seed);
  let minScore = Math.min(...state.scores);
  let contracts = 0;
  let contractTotal = 0;
  let contractMax = 0;
  let madeContracts = 0;
  let failedContracts = 0;
  assertCoreInvariants(state);

  for (let i = 0; i < maxCommands; i += 1) {
    if (state.status === 'complete') {
      return { state, minScore, contracts, contractTotal, contractMax, madeContracts, failedContracts, commands: i };
    }

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
    if (command.type === 'contract') {
      contracts += 1;
      contractTotal += command.value;
      contractMax = Math.max(contractMax, command.value);
    }

    const result = applyCommand(state, command);
    assert.equal(result.ok, true, `product bot command rejected: ${result.reason}`);

    if (state.hand.phase !== 'complete' && result.state.hand.phase === 'complete') {
      const declarer = result.state.hand.declarer;
      assert.notEqual(declarer, null);
      const delta = result.state.hand.handScoreDelta?.[declarer] ?? 0;
      if (delta > 0) madeContracts += 1;
      else failedContracts += 1;
    }

    state = result.state;
    minScore = Math.min(minScore, ...state.scores);
    assertCoreInvariants(state);
  }

  throw new Error(
    `product bots did not finish seed ${seed} within ${maxCommands} commands; ` +
      `hand=${state.handNumber} scores=${state.scores.join('/')} phase=${state.hand.phase} ` +
      `bid=${state.hand.auction.currentBid} declarer=${state.hand.declarer} contract=${state.hand.contract}`,
  );
}

const results = [];
for (let seed = 1; seed <= 40; seed += 1) {
  const result = playProductBotMatch(seed);
  assert.ok(result.state.winner !== null || result.state.draw);
  assert.ok(result.state.handNumber <= 200, `seed ${seed} took pathological ${result.state.handNumber} hands`);
  results.push(result);
}

const totalHands = results.reduce((sum, result) => sum + result.state.handNumber, 0);
const maxHands = Math.max(...results.map((result) => result.state.handNumber));
const worstMinScore = Math.min(...results.map((result) => result.minScore));
const totalContracts = results.reduce((sum, result) => sum + result.contracts, 0);
const totalContractValue = results.reduce((sum, result) => sum + result.contractTotal, 0);
const maxContract = Math.max(...results.map((result) => result.contractMax));
const made = results.reduce((sum, result) => sum + result.madeContracts, 0);
const failed = results.reduce((sum, result) => sum + result.failedContracts, 0);
const winnerCounts = [0, 0, 0];
let draws = 0;
for (const result of results) {
  if (result.state.winner === null) draws += 1;
  else winnerCounts[result.state.winner] += 1;
}

console.log(
  `product-bot survey matches=${results.length} avgHands=${(totalHands / results.length).toFixed(1)} ` +
    `maxHands=${maxHands} worstMinScore=${worstMinScore} avgContract=${(totalContractValue / totalContracts).toFixed(1)} ` +
    `maxContract=${maxContract} made=${made} failed=${failed} successRate=${(made / (made + failed)).toFixed(3)} ` +
    `winners=${winnerCounts.join('/')} draws=${draws}`,
);
console.log('product bot smoke: PASS');
