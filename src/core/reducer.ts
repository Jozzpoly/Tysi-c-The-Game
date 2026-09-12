import { cardPoints, shuffledDeck, sortHand, suitOf, type CardId } from './cards.js';
import { roundDefenderScore } from './rules.js';
import { allowedBidValues, allowedContractValues, canDeclareMarriage, currentWinningPlay, legalCards } from './legality.js';
import { cloneState, createHand, nextSeat, type ApplyResult, type Command, type MatchState, type Scores, type Seat, type SeatObservation } from './model.js';

function activeCount(active: readonly boolean[]): number {
  return active.filter(Boolean).length;
}

function nextActiveSeat(active: readonly boolean[], seat: Seat): Seat {
  let cursor = nextSeat(seat);
  for (let i = 0; i < 3; i += 1) {
    if (active[cursor]) return cursor;
    cursor = nextSeat(cursor);
  }
  throw new Error('no active bidder');
}

function finishAuction(state: MatchState): void {
  const hand = state.hand;
  const declarer = hand.auction.highBidder;
  hand.declarer = declarer;
  hand.revealedTalon = hand.talon.slice();
  hand.hands[declarer] = sortHand([...hand.hands[declarer], ...hand.talon]);
  hand.phase = 'exchange';
}

function removeCard(cards: CardId[], card: CardId): boolean {
  const index = cards.indexOf(card);
  if (index < 0) return false;
  cards.splice(index, 1);
  return true;
}

function scoreHand(state: MatchState): void {
  const hand = state.hand;
  if (hand.declarer === null || hand.contract === null) throw new Error('cannot score incomplete hand');

  const delta: Scores = [0, 0, 0];
  const declarerRaw = hand.capturedCardPoints[hand.declarer] + hand.marriagePoints[hand.declarer];
  delta[hand.declarer] = declarerRaw >= hand.contract ? hand.contract : -hand.contract;

  for (const seat of [0, 1, 2] as const) {
    if (seat === hand.declarer) continue;
    if (state.scores[seat] >= state.rules.scoring.lockThreshold) continue;
    delta[seat] = roundDefenderScore(
      hand.capturedCardPoints[seat] + hand.marriagePoints[seat],
      state.rules.scoring.defenderRounding,
    );
  }

  state.scores = [
    state.scores[0] + delta[0],
    state.scores[1] + delta[1],
    state.scores[2] + delta[2],
  ];
  hand.handScoreDelta = delta;
  hand.phase = 'complete';

  const winners = ([0, 1, 2] as Seat[]).filter((seat) => state.scores[seat] >= state.rules.targetScore);
  if (winners.length === 0) return;

  state.status = 'complete';
  if (winners.includes(hand.declarer)) {
    state.winner = hand.declarer;
    return;
  }

  const bestScore = Math.max(...winners.map((seat) => state.scores[seat]));
  const best = winners.filter((seat) => state.scores[seat] === bestScore);
  if (best.length === 1) state.winner = best[0];
  else state.draw = true;
}

function success(state: MatchState): ApplyResult {
  state.revision += 1;
  return { ok: true, state };
}

function failure(state: MatchState, reason: string): ApplyResult {
  return { ok: false, state, reason };
}

export function applyCommand(original: MatchState, command: Command): ApplyResult {
  if (original.status !== 'playing' && command.type !== 'next-hand') return failure(original, 'MATCH_COMPLETE');
  const state = cloneState(original);
  const hand = state.hand;

  if (command.type === 'bid') {
    if (hand.phase !== 'auction') return failure(original, 'WRONG_PHASE');
    if (command.seat !== hand.auction.turn || !hand.auction.active[command.seat]) return failure(original, 'NOT_YOUR_TURN');
    if (!allowedBidValues(state, command.seat).includes(command.value)) return failure(original, 'ILLEGAL_BID');
    hand.auction.currentBid = command.value;
    hand.auction.highBidder = command.seat;
    hand.auction.turn = nextActiveSeat(hand.auction.active, command.seat);
    return success(state);
  }

  if (command.type === 'pass') {
    if (hand.phase !== 'auction') return failure(original, 'WRONG_PHASE');
    if (command.seat !== hand.auction.turn || !hand.auction.active[command.seat]) return failure(original, 'NOT_YOUR_TURN');
    hand.auction.active[command.seat] = false;
    if (activeCount(hand.auction.active) === 1) finishAuction(state);
    else hand.auction.turn = nextActiveSeat(hand.auction.active, command.seat);
    return success(state);
  }

  if (command.type === 'exchange') {
    if (hand.phase !== 'exchange' || hand.declarer === null) return failure(original, 'WRONG_PHASE');
    if (command.seat !== hand.declarer) return failure(original, 'NOT_DECLARER');
    const recipients = command.give.map((item) => item.to);
    const cards = command.give.map((item) => item.card);
    if (new Set(recipients).size !== 2 || recipients.includes(command.seat)) return failure(original, 'INVALID_RECIPIENTS');
    if (new Set(cards).size !== 2 || !cards.every((card) => hand.hands[command.seat].includes(card))) {
      return failure(original, 'INVALID_TRANSFER_CARDS');
    }
    for (const item of command.give) {
      removeCard(hand.hands[command.seat], item.card);
      hand.hands[item.to].push(item.card);
      hand.hands[item.to] = sortHand(hand.hands[item.to]);
    }
    hand.hands[command.seat] = sortHand(hand.hands[command.seat]);
    hand.phase = 'contract';
    return success(state);
  }

  if (command.type === 'contract') {
    if (hand.phase !== 'contract' || hand.declarer === null) return failure(original, 'WRONG_PHASE');
    if (command.seat !== hand.declarer) return failure(original, 'NOT_DECLARER');
    if (!allowedContractValues(state).includes(command.value)) return failure(original, 'ILLEGAL_CONTRACT');
    hand.contract = command.value;
    hand.phase = 'trick';
    hand.trickLeader = hand.declarer;
    return success(state);
  }

  if (command.type === 'play') {
    if (hand.phase !== 'trick' || hand.trickLeader === null) return failure(original, 'WRONG_PHASE');
    if (!legalCards(state, command.seat).includes(command.card)) return failure(original, 'ILLEGAL_CARD');
    if (command.declareMarriage && !canDeclareMarriage(state, command.seat, command.card)) {
      return failure(original, 'ILLEGAL_MARRIAGE');
    }
    if (!removeCard(hand.hands[command.seat], command.card)) return failure(original, 'CARD_NOT_HELD');

    if (hand.trick.length === 0) hand.lastCompletedTrick = null;

    if (command.declareMarriage) {
      const suit = suitOf(command.card);
      hand.trump = suit;
      if (!hand.declaredMarriages[command.seat].includes(suit)) {
        hand.declaredMarriages[command.seat].push(suit);
        hand.marriagePoints[command.seat] += state.rules.marriage.values[suit];
      }
    }

    hand.trick.push({ seat: command.seat, card: command.card });
    if (hand.trick.length < 3) return success(state);

    const completedPlays = hand.trick.map((play) => ({ ...play }));
    const winner = currentWinningPlay(completedPlays, hand.trump).seat;
    const trickPoints = completedPlays.reduce((sum, play) => sum + cardPoints(play.card), 0);
    hand.capturedCardPoints[winner] += trickPoints;
    hand.capturedCards[winner].push(...completedPlays.map((play) => play.card));
    hand.capturedTricks[winner] += 1;
    hand.lastTrickWinner = winner;
    hand.trickIndex += 1;
    hand.lastCompletedTrick = {
      plays: completedPlays,
      winner,
      points: trickPoints,
      index: hand.trickIndex,
    };
    hand.trick = [];
    hand.trickLeader = winner;

    if (hand.trickIndex === 8) scoreHand(state);
    return success(state);
  }

  if (command.type === 'next-hand') {
    if (original.status !== 'playing' || hand.phase !== 'complete') return failure(original, 'HAND_NOT_COMPLETE');
    const nextDealer = nextSeat(state.dealer);
    const shuffled = shuffledDeck(state.seed);
    state.seed = shuffled.nextSeed;
    state.dealer = nextDealer;
    state.handNumber += 1;
    state.hand = createHand(nextDealer, shuffled.deck, state.rules);
    return success(state);
  }

  return failure(original, 'UNKNOWN_COMMAND');
}

export function observe(state: MatchState, seat: Seat): SeatObservation {
  const hand = state.hand;
  return {
    revision: state.revision,
    seat,
    scores: [...state.scores] as Scores,
    handNumber: state.handNumber,
    dealer: state.dealer,
    phase: hand.phase,
    ownHand: hand.hands[seat].slice(),
    opponentCardCounts: [hand.hands[0].length, hand.hands[1].length, hand.hands[2].length],
    revealedTalon: hand.revealedTalon?.slice() ?? null,
    auction: { ...hand.auction, active: [...hand.auction.active] as [boolean, boolean, boolean] },
    declarer: hand.declarer,
    contract: hand.contract,
    trump: hand.trump,
    trickIndex: hand.trickIndex,
    trickLeader: hand.trickLeader,
    trick: hand.trick.map((play) => ({ ...play })),
    lastCompletedTrick: hand.lastCompletedTrick
      ? {
          ...hand.lastCompletedTrick,
          plays: hand.lastCompletedTrick.plays.map((play) => ({ ...play })),
        }
      : null,
    capturedCardPoints: [...hand.capturedCardPoints] as Scores,
    capturedCards: hand.capturedCards.map((cards) => cards.slice()) as [CardId[], CardId[], CardId[]],
    marriagePoints: [...hand.marriagePoints] as Scores,
    lastTrickWinner: hand.lastTrickWinner,
    status: state.status,
    winner: state.winner,
    draw: state.draw,
  };
}
