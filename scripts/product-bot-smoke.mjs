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
  let forcedMade = 0;
  let forcedFailed = 0;
  let voluntaryMade = 0;
  let voluntaryFailed = 0;
  assertCoreInvariants(state);

  for (let i = 0; i < maxCommands; i += 1) {
    if (state.status === 'complete') {
      return {
        state,
        minScore,
        contracts,
        contractTotal,
        contractMax,
        madeContracts,
        failedContracts,
        forcedMade,
        forcedFailed,
        voluntaryMade,
        voluntaryFailed,
        commands: i,
      };
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
      const made = delta > 0;
      const forcedHundred = result.state.hand.auction.currentBid === 100;

      if (made) madeContracts += 1;
      else failedContracts += 1;

      if (forcedHundred) {
        if (made) forcedMade += 1;
        else forcedFailed += 1;
      } else if (made) voluntaryMade += 1;
      else voluntaryFailed += 1;
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
const forcedMade = results.reduce((sum, result) => sum + result.forcedMade, 0);
const forcedFailed = results.reduce((sum, result) => sum + result.forcedFailed, 0);
const voluntaryMade = results.reduce((sum, result) => sum + result.voluntaryMade, 0);
const voluntaryFailed = results.reduce((sum, result) => sum + result.voluntaryFailed, 0);
const winnerCounts = [0, 0, 0];
let draws = 0;
for (const result of results) {
  if (result.state.winner === null) draws += 1;
  else winnerCounts[result.state.winner] += 1;
}

const rate = (won, lost) => (won / Math.max(1, won + lost)).toFixed(3);
console.log(
  `product-bot survey matches=${results.length} avgHands=${(totalHands / results.length).toFixed(1)} ` +
    `maxHands=${maxHands} worstMinScore=${worstMinScore} avgContract=${(totalContractValue / totalContracts).toFixed(1)} ` +
    `maxContract=${maxContract} overall=${made}/${failed}:${rate(made, failed)} ` +
    `forced100=${forcedMade}/${forcedFailed}:${rate(forcedMade, forcedFailed)} ` +
    `voluntary=${voluntaryMade}/${voluntaryFailed}:${rate(voluntaryMade, voluntaryFailed)} ` +
    `winners=${winnerCounts.join('/')} draws=${draws}`,
);
console.log('product bot smoke: PASS');
