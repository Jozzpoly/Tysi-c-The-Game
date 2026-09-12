import { RANK_STRENGTH, SUITS, cardPoints, rankOf, suitOf, type CardId } from './cards.js';
import { currentWinningPlay, legalCommands } from './legality.js';
import { applyCommand, observe } from './reducer.js';
import { marriageValueInHand, type ThreePlayerRules } from './rules.js';
import type { Command, MatchState, Seat, SeatObservation } from './model.js';

function lowCardScore(card: CardId): number {
  return RANK_STRENGTH[rankOf(card)];
}

/**
 * Intentionally boring deterministic controller used by core simulations.
 * Keep this simple: it is test infrastructure, not the player-facing bot.
 */
export function conservativeCommand(state: MatchState): Command {
  const phase = state.hand.phase;
  const commands = legalCommands(state);
  if (commands.length === 0) throw new Error(`no legal command in phase ${phase}`);

  if (phase === 'auction') {
    const pass = commands.find((command) => command.type === 'pass');
    if (!pass) throw new Error('auction has no pass');
    return pass;
  }

  if (phase === 'exchange') {
    const exchanges = commands.filter((command): command is Extract<Command, { type: 'exchange' }> => command.type === 'exchange');
    exchanges.sort((a, b) => {
      const aScore = a.give.reduce((total, item) => total + lowCardScore(item.card), 0);
      const bScore = b.give.reduce((total, item) => total + lowCardScore(item.card), 0);
      return aScore - bScore;
    });
    return exchanges[0];
  }

  if (phase === 'contract') {
    return commands.filter((command): command is Extract<Command, { type: 'contract' }> => command.type === 'contract')[0];
  }

  if (phase === 'trick') {
    const marriages = commands.filter(
      (command): command is Extract<Command, { type: 'play' }> => command.type === 'play' && Boolean(command.declareMarriage),
    );
    if (marriages.length > 0) {
      marriages.sort((a, b) => RANK_STRENGTH[rankOf(b.card)] - RANK_STRENGTH[rankOf(a.card)]);
      return marriages[0];
    }
    const plays = commands.filter((command): command is Extract<Command, { type: 'play' }> => command.type === 'play');
    plays.sort((a, b) => RANK_STRENGTH[rankOf(b.card)] - RANK_STRENGTH[rankOf(a.card)]);
    return plays[0];
  }

  return commands[0];
}

function estimateContract(hand: readonly CardId[], rules: ThreePlayerRules): number {
  const rawPoints = hand.reduce((sum, card) => sum + cardPoints(card), 0);
  const marriage = marriageValueInHand(hand, rules);
  const aces = hand.filter((card) => rankOf(card) === 'A').length;
  const protectedTens = SUITS.filter(
    (suit) => hand.some((card) => suitOf(card) === suit && rankOf(card) === 'A') && hand.some((card) => suitOf(card) === suit && rankOf(card) === '10'),
  ).length;

  // Calibrated to the capabilities of this deliberately shallow player.
  // A marriage is potential rather than guaranteed score, so only part of its nominal
  // value is trusted at auction time. This is bot policy, not a game-rule claim.
  // The 60-point base is the current A/B candidate after the 70-point base produced
  // only ~44% success on voluntarily won contracts across a 40-match seeded survey.
  const estimate =
    60 +
    Math.floor(rawPoints * 0.75) +
    Math.floor(marriage * 0.45) +
    aces * 5 +
    protectedTens * 5;
  return Math.max(100, Math.floor(estimate / 10) * 10);
}

function transferCost(card: CardId, hand: readonly CardId[]): number {
  const rank = rankOf(card);
  const suit = suitOf(card);
  const pairRank = rank === 'K' ? 'Q' : rank === 'Q' ? 'K' : null;
  const breaksMarriage = pairRank !== null && hand.some((candidate) => suitOf(candidate) === suit && rankOf(candidate) === pairRank);
  return cardPoints(card) * 12 + RANK_STRENGTH[rank] * 3 + (breaksMarriage ? 100 : 0);
}

function playCost(card: CardId): number {
  return cardPoints(card) * 10 + RANK_STRENGTH[rankOf(card)];
}

/**
 * First product-bot policy. It receives only the same seat observation a remote
 * player could receive plus already-filtered legal commands and public rules.
 * Hidden opponent card identities are therefore unavailable by construction.
 */
export function heuristicCommand(
  observation: SeatObservation,
  commands: readonly Command[],
  rules: ThreePlayerRules,
): Command {
  if (commands.length === 0) throw new Error('product bot received no legal commands');

  if (observation.phase === 'auction') {
    const pass = commands.find((command) => command.type === 'pass');
    const bids = commands
      .filter((command): command is Extract<Command, { type: 'bid' }> => command.type === 'bid')
      .sort((a, b) => a.value - b.value);
    const target = estimateContract(observation.ownHand, rules);
    const acceptable = bids.filter((bid) => bid.value <= target);
    return acceptable.at(-1) ?? pass ?? bids[0];
  }

  if (observation.phase === 'exchange') {
    const exchanges = commands.filter((command): command is Extract<Command, { type: 'exchange' }> => command.type === 'exchange');
    if (exchanges.length === 0) return commands[0];
    return exchanges.reduce((best, candidate) => {
      const candidateCost = candidate.give.reduce((sum, item) => sum + transferCost(item.card, observation.ownHand), 0);
      const bestCost = best.give.reduce((sum, item) => sum + transferCost(item.card, observation.ownHand), 0);
      return candidateCost < bestCost ? candidate : best;
    });
  }

  if (observation.phase === 'contract') {
    const contracts = commands
      .filter((command): command is Extract<Command, { type: 'contract' }> => command.type === 'contract')
      .sort((a, b) => a.value - b.value);
    if (contracts.length === 0) return commands[0];
    // The auction already expressed the bot's risk appetite. Do not increase the
    // obligation merely because the musik made a larger legal declaration possible.
    return contracts[0];
  }

  if (observation.phase === 'trick') {
    const plays = commands.filter((command): command is Extract<Command, { type: 'play' }> => command.type === 'play');
    if (plays.length === 0) return commands[0];

    if (observation.trick.length === 0) {
      const marriages = plays.filter((play) => play.declareMarriage);
      if (marriages.length > 0) {
        return marriages.reduce((best, candidate) => {
          const candidateValue = rules.marriage.values[suitOf(candidate.card)];
          const bestValue = rules.marriage.values[suitOf(best.card)];
          return candidateValue > bestValue ? candidate : best;
        });
      }
      const aces = plays.filter((play) => rankOf(play.card) === 'A' && !play.declareMarriage);
      if (aces.length > 0) return aces.sort((a, b) => playCost(a.card) - playCost(b.card))[0];
      return plays.filter((play) => !play.declareMarriage).sort((a, b) => playCost(a.card) - playCost(b.card))[0] ?? plays[0];
    }

    const winning = plays.filter((play) => {
      const trick = [...observation.trick, { seat: observation.seat, card: play.card }];
      return currentWinningPlay(trick, observation.trump).seat === observation.seat;
    });
    if (winning.length > 0) return winning.sort((a, b) => playCost(a.card) - playCost(b.card))[0];
    return plays.sort((a, b) => playCost(a.card) - playCost(b.card))[0];
  }

  return commands[0];
}

export function productBotCommand(state: MatchState, seat: Seat): Command {
  return heuristicCommand(observe(state, seat), legalCommands(state, seat), state.rules);
}

export function playAutomatedHand(state: MatchState, maxCommands = 128): MatchState {
  let current = state;
  const startingHand = current.handNumber;
  for (let i = 0; i < maxCommands; i += 1) {
    if (current.status === 'complete' || current.hand.phase === 'complete') return current;
    const result = applyCommand(current, conservativeCommand(current));
    if (!result.ok) throw new Error(`bot produced illegal command: ${result.reason}`);
    current = result.state;
    if (current.handNumber !== startingHand) throw new Error('hand changed unexpectedly');
  }
  throw new Error('automated hand command limit exceeded');
}

export function playAutomatedMatch(state: MatchState, maxHands = 500): MatchState {
  let current = state;
  for (let hand = 0; hand < maxHands; hand += 1) {
    current = playAutomatedHand(current);
    if (current.status === 'complete') return current;
    const next = applyCommand(current, { type: 'next-hand' });
    if (!next.ok) throw new Error(`cannot advance hand: ${next.reason}`);
    current = next.state;
  }
  throw new Error(`automated match did not finish within ${maxHands} hands`);
}

export function actingSeat(state: MatchState): Seat | null {
  const hand = state.hand;
  if (hand.phase === 'auction') return hand.auction.turn;
  if (hand.phase === 'exchange' || hand.phase === 'contract') return hand.declarer;
  if (hand.phase === 'trick' && hand.trickLeader !== null) {
    if (hand.trick.length === 0) return hand.trickLeader;
    return ((hand.trick[hand.trick.length - 1].seat + 1) % 3) as Seat;
  }
  return null;
}
