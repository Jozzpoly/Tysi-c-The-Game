import { RANK_STRENGTH, rankOf, type CardId } from './cards.js';
import { legalCommands } from './legality.js';
import { applyCommand } from './reducer.js';
import type { Command, MatchState, Seat } from './model.js';

function lowCardScore(card: CardId): number {
  return RANK_STRENGTH[rankOf(card)];
}

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
