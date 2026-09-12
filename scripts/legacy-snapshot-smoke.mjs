import assert from 'node:assert/strict';
import {
  PLAYOK_3P_800_CANDIDATE,
  applyCommand,
  assertCoreInvariants,
  createMatch,
  legalCommands,
  observe,
  projectSeat,
} from '../dist/core/index.js';

function legacyMatch(version) {
  const rules = structuredClone(PLAYOK_3P_800_CANDIDATE);
  rules.version = version;
  const state = createMatch(rules, 314159, 0);
  if (version < 2) {
    delete state.rules.bomb;
    delete state.bombsUsed;
    delete state.hand.completion;
  }
  if (version < 3) {
    delete state.rules.fourNines;
    delete state.hand.fourNinesSeat;
  }
  return state;
}

function passFor(state, seat) {
  const command = legalCommands(state, seat).find((candidate) => candidate.type === 'pass');
  assert.ok(command, `seat ${seat} must have a pass command`);
  return command;
}

function forceAuctionToExchange(initial) {
  let result = applyCommand(initial, passFor(initial, 2));
  assert.equal(result.ok, true);
  result = applyCommand(result.state, passFor(result.state, 0));
  assert.equal(result.ok, true);
  assert.equal(result.state.hand.phase, 'exchange');
  return result.state;
}

// Pre-bomb persisted state can be projected before any command and is lazily
// normalized structurally by the first accepted transition without changing its
// pinned profile version or retroactively enabling later rules.
const v1 = legacyMatch(1);
assertCoreInvariants(v1);
assert.deepEqual(observe(v1, 0).bombsUsed, [0, 0, 0]);
assert.equal(observe(v1, 0).completion, null);
assert.equal(projectSeat(v1, 0).profile.version, 1);

const v1Exchange = forceAuctionToExchange(v1);
assert.deepEqual(v1Exchange.bombsUsed, [0, 0, 0]);
assert.equal(v1Exchange.hand.fourNinesSeat, null);
assert.equal(v1Exchange.rules.version, 1);
assert.equal('bomb' in v1Exchange.rules, false);
assert.equal('fourNines' in v1Exchange.rules, false);
const v1Commands = legalCommands(v1Exchange, v1Exchange.hand.declarer);
assert.equal(v1Commands.some((command) => command.type === 'bomb'), false);
const v1ExchangeCommand = v1Commands.find((command) => command.type === 'exchange');
assert.ok(v1ExchangeCommand);
const v1AfterExchange = applyCommand(v1Exchange, v1ExchangeCommand);
assert.equal(v1AfterExchange.ok, true);
assert.equal(v1AfterExchange.state.hand.phase, 'contract');
assert.equal(v1AfterExchange.state.rules.version, 1);
assertCoreInvariants(v1AfterExchange.state);

// Version 2 keeps its bomb support but must not silently acquire four-nines
// behavior when the current runtime reads the historical rules snapshot.
const v2 = legacyMatch(2);
assertCoreInvariants(v2);
const v2Exchange = forceAuctionToExchange(v2);
assert.equal(v2Exchange.rules.version, 2);
assert.ok(v2Exchange.rules.bomb?.enabled);
assert.equal('fourNines' in v2Exchange.rules, false);
const v2Commands = legalCommands(v2Exchange, v2Exchange.hand.declarer);
assert.equal(v2Commands.some((command) => command.type === 'bomb'), true);
const v2ExchangeCommand = v2Commands.find((command) => command.type === 'exchange');
assert.ok(v2ExchangeCommand);
const v2AfterExchange = applyCommand(v2Exchange, v2ExchangeCommand);
assert.equal(v2AfterExchange.ok, true);
assert.equal(v2AfterExchange.state.hand.phase, 'contract');
assert.equal(v2AfterExchange.state.rules.version, 2);
assert.equal('fourNines' in v2AfterExchange.state.rules, false);
assertCoreInvariants(v2AfterExchange.state);

console.log('legacy snapshot smoke: PASS');
