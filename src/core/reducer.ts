import { cardPoints, shuffledDeck, sortHand, suitOf, type CardId } from './cards.js';
import { roundDefenderScore } from './rules.js';
import { allowedBidValues, allowedContractValues, canDeclareMarriage, currentWinningPlay, hasFourNines, legalCards } from './legality.js';
import {
  cloneState,
  createHand,
  nextSeat,
  type ApplyResult,
  type Command,
  type GameEvent,
  type MatchState,
  type Scores,
  type Seat,
  type SeatObservation,
} from './model.js';

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

function finishAuction(state: MatchState, events: GameEvent[]): void {
  const hand = state.hand;
  const declarer = hand.auction.highBidder;
  hand.declarer = declarer;
  hand.revealedTalon = hand.talon.slice();
  hand.hands[declarer] = sortHand([...hand.hands[declarer], ...hand.talon]);
  hand.phase = 'exchange';
  events.push(
    { type: 'auction-won', audience: 'public', seat: declarer, value: hand.auction.currentBid },
    { type: 'talon-revealed', audience: 'public', cards: hand.talon.slice() },
  );
}

function removeCard(cards: CardId[], card: CardId): boolean {
  const index = cards.indexOf(card);
  if (index < 0) return false;
  cards.splice(index, 1);
  return true;
}

function finishMatchIfNeeded(state: MatchState, events: GameEvent[], declarerPrecedence: Seat | null): void {
  const winners = ([0, 1, 2] as Seat[]).filter((seat) => state.scores[seat] >= state.rules.targetScore);
  if (winners.length === 0) return;

  state.status = 'complete';
  state.winner = null;
  state.draw = false;

  if (declarerPrecedence !== null && winners.includes(declarerPrecedence)) {
    state.winner = declarerPrecedence;
  } else {
    const bestScore = Math.max(...winners.map((seat) => state.scores[seat]));
    const best = winners.filter((seat) => state.scores[seat] === bestScore);
    if (best.length === 1) state.winner = best[0];
    else state.draw = true;
  }

  events.push({
    type: 'match-completed',
    audience: 'public',
    winner: state.winner,
    draw: state.draw,
    scores: [...state.scores] as Scores,
  });
}

function scoreHand(state: MatchState, events: GameEvent[]): void {
  const hand = state.hand;
  if (hand.declarer === null || hand.contract === null) throw new Error('cannot score incomplete hand');

  const delta: Scores = [0, 0, 0];
  const declarerRaw = hand.capturedCardPoints[hand.declarer] + hand.marriagePoints[hand.declarer];
  const contractMade = declarerRaw >= hand.contract;
  delta[hand.declarer] = contractMade ? hand.contract : -hand.contract;

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
  hand.completion = { kind: 'played' };
  hand.phase = 'complete';

  events.push({
    type: 'hand-scored',
    audience: 'public',
    delta: [...delta] as Scores,
    scores: [...state.scores] as Scores,
    declarer: hand.declarer,
    contract: hand.contract,
    contractMade,
  });

  finishMatchIfNeeded(state, events, hand.declarer);
}

function success(state: MatchState, events: GameEvent[] = []): ApplyResult {
  state.revision += 1;
  return { ok: true, state, events };
}

function failure(state: MatchState, reason: string): ApplyResult {
  return { ok: false, state, reason, events: [] };
}

/**
 * Canonical visibility filter for transient command feedback.
 * Adapters must never send the authoritative event list directly to a seat.
 */
export function eventsForSeat(events: readonly GameEvent[], seat: Seat): GameEvent[] {
  return events.filter((event) => event.audience === 'public' || event.audience === seat);
}

export function applyCommand(original: MatchState, command: Command): ApplyResult {
  if (original.status !== 'playing' && command.type !== 'next-hand') return failure(original, 'MATCH_COMPLETE');
  const state = cloneState(original);
  const hand = state.hand;
  const events: GameEvent[] = [];

  if (command.type === 'bid') {
    if (hand.phase !== 'auction') return failure(original, 'WRONG_PHASE');
    if (command.seat !== hand.auction.turn || !hand.auction.active[command.seat]) return failure(original, 'NOT_YOUR_TURN');
    if (!allowedBidValues(state, command.seat).includes(command.value)) return failure(original, 'ILLEGAL_BID');
    hand.auction.currentBid = command.value;
    hand.auction.highBidder = command.seat;
    hand.auction.turn = nextActiveSeat(hand.auction.active, command.seat);
    events.push({ type: 'bid-placed', audience: 'public', seat: command.seat, value: command.value });
    return success(state, events);
  }

  if (command.type === 'pass') {
    if (hand.phase !== 'auction') return failure(original, 'WRONG_PHASE');
    if (command.seat !== hand.auction.turn || !hand.auction.active[command.seat]) return failure(original, 'NOT_YOUR_TURN');
    hand.auction.active[command.seat] = false;
    events.push({ type: 'player-passed', audience: 'public', seat: command.seat });
    if (activeCount(hand.auction.active) === 1) finishAuction(state, events);
    else hand.auction.turn = nextActiveSeat(hand.auction.active, command.seat);
    return success(state, events);
  }

  if (command.type === 'bomb') {
    if (hand.phase !== 'exchange' || hand.declarer === null) return failure(original, 'WRONG_PHASE');
    if (command.seat !== hand.declarer) return failure(original, 'NOT_DECLARER');
    if (!state.rules.bomb.enabled) return failure(original, 'BOMB_DISABLED');

    state.bombsUsed[command.seat] += 1;
    const bombNumber = state.bombsUsed[command.seat];
    const delta: Scores = [0, 0, 0];
    const free = state.rules.bomb.firstBombFree && bombNumber === 1;

    if (!free) {
      for (const seat of [0, 1, 2] as const) {
        if (seat === command.seat) continue;
        if (
          state.rules.bomb.opponentAwardRespectsLock &&
          state.scores[seat] >= state.rules.scoring.lockThreshold
        ) continue;
        delta[seat] = state.rules.bomb.repeatedOpponentAward;
      }
    }

    state.scores = [
      state.scores[0] + delta[0],
      state.scores[1] + delta[1],
      state.scores[2] + delta[2],
    ];
    hand.handScoreDelta = delta;
    hand.completion = { kind: 'bomb', seat: command.seat, bombNumber };
    hand.phase = 'complete';

    events.push({
      type: 'hand-bombed',
      audience: 'public',
      seat: command.seat,
      bombNumber,
      delta: [...delta] as Scores,
      scores: [...state.scores] as Scores,
    });
    finishMatchIfNeeded(state, events, null);
    return success(state, events);
  }

  if (command.type === 'exchange') {
    if (hand.phase !== 'exchange' || hand.declarer === null) return failure(original, 'WRONG_PHASE');
    if (command.seat !== hand.declarer) return failure(original, 'NOT_DECLARER');
    const recipients = command.give.map((item) => item.to) as [Seat, Seat];
    const cards = command.give.map((item) => item.card);
    if (new Set(recipients).size !== 2 || recipients.includes(command.seat)) return failure(original, 'INVALID_RECIPIENTS');
    if (new Set(cards).size !== 2 || !cards.every((card) => hand.hands[command.seat].includes(card))) {
      return failure(original, 'INVALID_TRANSFER_CARDS');
    }
    for (const item of command.give) {
      removeCard(hand.hands[command.seat], item.card);
      hand.hands[item.to].push(item.card);
      hand.hands[item.to] = sortHand(hand.hands[item.to]);
      events.push({ type: 'card-received', audience: item.to, from: command.seat, to: item.to, card: item.card });
    }
    hand.hands[command.seat] = sortHand(hand.hands[command.seat]);
    hand.fourNinesSeat = null;

    if (state.rules.fourNines.enabled && state.rules.fourNines.window === 'after-exchange-before-contract') {
      const eligible = ([0, 1, 2] as Seat[]).find((seat) => hasFourNines(hand.hands[seat]));
      if (eligible !== undefined) {
        hand.phase = 'redeal-option';
        hand.fourNinesSeat = eligible;
        events.push({ type: 'four-nines-option', audience: eligible, seat: eligible });
      } else {
        hand.phase = 'contract';
      }
    } else {
      hand.phase = 'contract';
    }

    events.unshift({ type: 'exchange-completed', audience: 'public', from: command.seat, recipients });
    return success(state, events);
  }

  if (command.type === 'request-redeal') {
    if (hand.phase !== 'redeal-option' || hand.fourNinesSeat === null) return failure(original, 'WRONG_PHASE');
    if (command.seat !== hand.fourNinesSeat) return failure(original, 'NOT_YOUR_TURN');
    if (!state.rules.fourNines.enabled || !hasFourNines(hand.hands[command.seat])) return failure(original, 'REDEAL_NOT_AVAILABLE');

    const shuffled = shuffledDeck(state.seed);
    state.seed = shuffled.nextSeed;
    const dealer = state.rules.fourNines.redealKeepsDealer ? state.dealer : nextSeat(state.dealer);
    state.dealer = dealer;
    state.hand = createHand(dealer, shuffled.deck, state.rules);
    events.push({ type: 'four-nines-redeal', audience: 'public', seat: command.seat, handNumber: state.handNumber, dealer });
    return success(state, events);
  }

  if (command.type === 'continue-after-four-nines') {
    if (hand.phase !== 'redeal-option' || hand.fourNinesSeat === null) return failure(original, 'WRONG_PHASE');
    if (command.seat !== hand.fourNinesSeat) return failure(original, 'NOT_YOUR_TURN');
    if (!state.rules.fourNines.optional) return failure(original, 'REDEAL_REQUIRED');
    if (!hasFourNines(hand.hands[command.seat])) return failure(original, 'REDEAL_NOT_AVAILABLE');
    hand.fourNinesSeat = null;
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
    events.push({ type: 'contract-set', audience: 'public', seat: command.seat, value: command.value });
    return success(state, events);
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
        const points = state.rules.marriage.values[suit];
        hand.marriagePoints[command.seat] += points;
        events.push({ type: 'marriage-declared', audience: 'public', seat: command.seat, suit, points });
      }
    }

    hand.trick.push({ seat: command.seat, card: command.card });
    events.push({ type: 'card-played', audience: 'public', seat: command.seat, card: command.card });
    if (hand.trick.length < 3) return success(state, events);

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

    events.push({
      type: 'trick-completed',
      audience: 'public',
      trick: {
        ...hand.lastCompletedTrick,
        plays: hand.lastCompletedTrick.plays.map((play) => ({ ...play })),
      },
    });

    if (hand.trickIndex === 8) scoreHand(state, events);
    return success(state, events);
  }

  if (command.type === 'next-hand') {
    if (original.status !== 'playing' || hand.phase !== 'complete') return failure(original, 'HAND_NOT_COMPLETE');
    const nextDealer = nextSeat(state.dealer);
    const shuffled = shuffledDeck(state.seed);
    state.seed = shuffled.nextSeed;
    state.dealer = nextDealer;
    state.handNumber += 1;
    state.hand = createHand(nextDealer, shuffled.deck, state.rules);
    events.push({ type: 'hand-started', audience: 'public', handNumber: state.handNumber, dealer: nextDealer });
    return success(state, events);
  }

  return failure(original, 'UNKNOWN_COMMAND');
}

export function observe(state: MatchState, seat: Seat): SeatObservation {
  const hand = state.hand;
  const ownsFourNinesOption = hand.phase === 'redeal-option' && hand.fourNinesSeat === seat;
  const projectedPhase: SeatObservation['phase'] = hand.phase === 'redeal-option' && !ownsFourNinesOption ? 'contract' : hand.phase;
  return {
    revision: state.revision,
    seat,
    scores: [...state.scores] as Scores,
    bombsUsed: [...state.bombsUsed] as SeatObservation['bombsUsed'],
    handNumber: state.handNumber,
    dealer: state.dealer,
    phase: projectedPhase,
    ownHand: hand.hands[seat].slice(),
    opponentCardCounts: [hand.hands[0].length, hand.hands[1].length, hand.hands[2].length],
    revealedTalon: hand.revealedTalon?.slice() ?? null,
    auction: { ...hand.auction, active: [...hand.auction.active] as [boolean, boolean, boolean] },
    declarer: hand.declarer,
    contract: hand.contract,
    fourNinesOption: ownsFourNinesOption,
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
    capturedTricks: [...hand.capturedTricks] as [number, number, number],
    declaredMarriages: hand.declaredMarriages.map((suits) => suits.slice()) as SeatObservation['declaredMarriages'],
    lastTrickWinner: hand.lastTrickWinner,
    handScoreDelta: hand.handScoreDelta ? ([...hand.handScoreDelta] as Scores) : null,
    completion: hand.completion ? { ...hand.completion } : null,
    status: state.status,
    winner: state.winner,
    draw: state.draw,
  };
}
