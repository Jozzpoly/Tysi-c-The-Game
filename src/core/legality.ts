import { cardId, compareSameSuit, rankOf, suitOf, type CardId, type Suit } from './cards.js';
import { maxBidForHand } from './rules.js';
import { nextSeat, type Command, type MatchState, type PlayedCard, type Seat } from './model.js';

export function currentWinningPlay(plays: readonly PlayedCard[], trump: Suit | null): PlayedCard {
  if (plays.length === 0) throw new Error('empty trick');
  const leadSuit = suitOf(plays[0].card);
  let winner = plays[0];
  for (const play of plays.slice(1)) {
    const candidateSuit = suitOf(play.card);
    const winnerSuit = suitOf(winner.card);
    if (trump) {
      if (candidateSuit === trump && winnerSuit !== trump) {
        winner = play;
        continue;
      }
      if (candidateSuit === trump && winnerSuit === trump && compareSameSuit(play.card, winner.card) > 0) {
        winner = play;
        continue;
      }
      if (winnerSuit === trump) continue;
    }
    if (candidateSuit === leadSuit && winnerSuit === leadSuit && compareSameSuit(play.card, winner.card) > 0) winner = play;
  }
  return winner;
}

export function legalCards(state: MatchState, seat: Seat): CardId[] {
  const hand = state.hand;
  if (state.status !== 'playing' || hand.phase !== 'trick') return [];
  const expected = hand.trick.length === 0 ? hand.trickLeader : nextSeat(hand.trick[hand.trick.length - 1].seat);
  if (expected !== seat) return [];
  const cards = hand.hands[seat];
  if (hand.trick.length === 0) return cards.slice();

  const leadSuit = suitOf(hand.trick[0].card);
  const suited = cards.filter((card) => suitOf(card) === leadSuit);
  const winner = currentWinningPlay(hand.trick, hand.trump);

  if (suited.length > 0) {
    if (suitOf(winner.card) === leadSuit) {
      const stronger = suited.filter((card) => compareSameSuit(card, winner.card) > 0);
      if (stronger.length > 0) return stronger;
    }
    return suited;
  }

  if (!hand.trump) return cards.slice();
  const trumps = cards.filter((card) => suitOf(card) === hand.trump);
  if (trumps.length === 0) return cards.slice();
  if (suitOf(winner.card) === hand.trump) {
    const overtrumps = trumps.filter((card) => compareSameSuit(card, winner.card) > 0);
    if (overtrumps.length > 0) return overtrumps;
  }
  return trumps;
}

export function canDeclareMarriage(state: MatchState, seat: Seat, card: CardId): boolean {
  const hand = state.hand;
  if (hand.phase !== 'trick' || hand.trick.length !== 0 || hand.trickLeader !== seat) return false;
  if (!state.rules.marriage.allowedOnFirstTrick && hand.trickIndex === 0) return false;
  const rank = rankOf(card);
  if (rank !== 'K' && rank !== 'Q') return false;
  const pair = cardId(suitOf(card), rank === 'K' ? 'Q' : 'K');
  return hand.hands[seat].includes(pair);
}

export function allowedBidValues(state: MatchState, seat: Seat): number[] {
  const hand = state.hand;
  if (hand.phase !== 'auction' || hand.auction.turn !== seat || !hand.auction.active[seat]) return [];
  const max = maxBidForHand(hand.hands[seat], state.rules);
  const values: number[] = [];
  for (let value = hand.auction.currentBid + state.rules.auction.increment; value <= max; value += state.rules.auction.increment) values.push(value);
  return values;
}

export function allowedContractValues(state: MatchState): number[] {
  const hand = state.hand;
  if (hand.phase !== 'contract' || hand.declarer === null) return [];
  const min = hand.auction.currentBid;
  const max = Math.max(min, maxBidForHand(hand.hands[hand.declarer], state.rules));
  const values: number[] = [];
  for (let value = min; value <= max; value += state.rules.auction.increment) values.push(value);
  return values;
}

export function legalCommands(state: MatchState, seat?: Seat): Command[] {
  if (state.status !== 'playing') return [];
  const hand = state.hand;
  if (hand.phase === 'auction') {
    const actor = seat ?? hand.auction.turn;
    if (actor !== hand.auction.turn) return [];
    return [{ type: 'pass', seat: actor }, ...allowedBidValues(state, actor).map((value) => ({ type: 'bid', seat: actor, value }) as const)];
  }
  if (hand.phase === 'exchange') {
    if (hand.declarer === null) return [];
    const actor = seat ?? hand.declarer;
    if (actor !== hand.declarer) return [];
    const opponents = ([0, 1, 2] as Seat[]).filter((candidate) => candidate !== actor);
    const commands: Command[] = [];
    for (const first of hand.hands[actor]) for (const second of hand.hands[actor]) {
      if (first === second) continue;
      commands.push({ type: 'exchange', seat: actor, give: [{ to: opponents[0], card: first }, { to: opponents[1], card: second }] });
    }
    return commands;
  }
  if (hand.phase === 'contract') {
    if (hand.declarer === null) return [];
    const actor = seat ?? hand.declarer;
    if (actor !== hand.declarer) return [];
    return allowedContractValues(state).map((value) => ({ type: 'contract', seat: actor, value }));
  }
  if (hand.phase === 'trick') {
    if (hand.trickLeader === null) return [];
    const actor = hand.trick.length === 0 ? hand.trickLeader : nextSeat(hand.trick[hand.trick.length - 1].seat);
    if (seat !== undefined && seat !== actor) return [];
    const commands: Command[] = [];
    for (const card of legalCards(state, actor)) {
      commands.push({ type: 'play', seat: actor, card });
      if (canDeclareMarriage(state, actor, card)) commands.push({ type: 'play', seat: actor, card, declareMarriage: true });
    }
    return commands;
  }
  return hand.phase === 'complete' ? [{ type: 'next-hand' }] : [];
}
