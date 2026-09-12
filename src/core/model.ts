import { shuffledDeck, sortHand, type CardId, type Suit } from './cards.js';
import type { ThreePlayerRules } from './rules.js';

export type Seat = 0 | 1 | 2;
export type Scores = [number, number, number];
export type Hands = [CardId[], CardId[], CardId[]];
export type BombCounts = [number, number, number];

export interface PlayedCard {
  seat: Seat;
  card: CardId;
}

export interface CompletedTrick {
  plays: PlayedCard[];
  winner: Seat;
  points: number;
  index: number;
}

export interface SeatScoreSummary {
  cardPoints: number;
  marriagePoints: number;
  rawPoints: number;
  scoreDelta: number;
  locked: boolean;
}

export interface HandScoreSummary {
  declarer: Seat;
  contract: number;
  contractMade: boolean;
  lockThreshold: number;
  seats: [SeatScoreSummary, SeatScoreSummary, SeatScoreSummary];
}

export type HandCompletion =
  | { kind: 'played' }
  | { kind: 'bomb'; seat: Seat; bombNumber: number }
  | null;

export type Command =
  | { type: 'bid'; seat: Seat; value: number }
  | { type: 'pass'; seat: Seat }
  | { type: 'bomb'; seat: Seat }
  | { type: 'exchange'; seat: Seat; give: readonly [{ to: Seat; card: CardId }, { to: Seat; card: CardId }] }
  | { type: 'request-redeal'; seat: Seat }
  | { type: 'continue-after-four-nines'; seat: Seat }
  | { type: 'contract'; seat: Seat; value: number }
  | { type: 'play'; seat: Seat; card: CardId; declareMarriage?: boolean }
  | { type: 'next-hand'; seat: Seat };

export type GameEvent =
  | { type: 'bid-placed'; audience: 'public'; seat: Seat; value: number }
  | { type: 'player-passed'; audience: 'public'; seat: Seat }
  | { type: 'auction-won'; audience: 'public'; seat: Seat; value: number }
  | { type: 'talon-revealed'; audience: 'public'; cards: CardId[] }
  | { type: 'hand-bombed'; audience: 'public'; seat: Seat; bombNumber: number; delta: Scores; scores: Scores }
  | { type: 'exchange-completed'; audience: 'public'; from: Seat; recipients: [Seat, Seat] }
  | { type: 'card-received'; audience: Seat; from: Seat; to: Seat; card: CardId }
  | { type: 'four-nines-option'; audience: Seat; seat: Seat }
  | { type: 'four-nines-redeal'; audience: 'public'; seat: Seat; handNumber: number; dealer: Seat }
  | { type: 'contract-set'; audience: 'public'; seat: Seat; value: number }
  | { type: 'marriage-declared'; audience: 'public'; seat: Seat; suit: Suit; points: number }
  | { type: 'card-played'; audience: 'public'; seat: Seat; card: CardId }
  | { type: 'trick-completed'; audience: 'public'; trick: CompletedTrick }
  | {
      type: 'hand-scored';
      audience: 'public';
      delta: Scores;
      scores: Scores;
      declarer: Seat;
      contract: number;
      contractMade: boolean;
      summary: HandScoreSummary;
    }
  | { type: 'match-completed'; audience: 'public'; winner: Seat | null; draw: boolean; scores: Scores }
  | { type: 'hand-started'; audience: 'public'; handNumber: number; dealer: Seat };

export interface AuctionState {
  currentBid: number;
  highBidder: Seat;
  active: [boolean, boolean, boolean];
  turn: Seat;
}

export interface HandState {
  dealer: Seat;
  hands: Hands;
  talon: CardId[];
  revealedTalon: CardId[] | null;
  phase: 'auction' | 'exchange' | 'redeal-option' | 'contract' | 'trick' | 'complete';
  auction: AuctionState;
  declarer: Seat | null;
  contract: number | null;
  fourNinesSeat: Seat | null;
  trump: Suit | null;
  trickIndex: number;
  trickLeader: Seat | null;
  trick: PlayedCard[];
  lastCompletedTrick: CompletedTrick | null;
  capturedCardPoints: Scores;
  capturedCards: [CardId[], CardId[], CardId[]];
  marriagePoints: Scores;
  capturedTricks: [number, number, number];
  declaredMarriages: [Suit[], Suit[], Suit[]];
  lastTrickWinner: Seat | null;
  handScoreDelta: Scores | null;
  /** Public persistent explanation for a normally played/scored hand. */
  scoreSummary: HandScoreSummary | null;
  completion: HandCompletion;
}

export interface MatchState {
  rules: ThreePlayerRules;
  seed: number;
  revision: number;
  scores: Scores;
  bombsUsed: BombCounts;
  dealer: Seat;
  handNumber: number;
  hand: HandState;
  status: 'playing' | 'complete';
  winner: Seat | null;
  draw: boolean;
}

export interface ApplyResult {
  ok: boolean;
  state: MatchState;
  events: GameEvent[];
  reason?: string;
}

export interface SeatObservation {
  revision: number;
  seat: Seat;
  scores: Scores;
  bombsUsed: BombCounts;
  handNumber: number;
  dealer: Seat;
  phase: HandState['phase'];
  ownHand: CardId[];
  opponentCardCounts: [number, number, number];
  revealedTalon: CardId[] | null;
  auction: AuctionState;
  declarer: Seat | null;
  contract: number | null;
  fourNinesOption: boolean;
  trump: Suit | null;
  trickIndex: number;
  trickLeader: Seat | null;
  trick: PlayedCard[];
  lastCompletedTrick: CompletedTrick | null;
  capturedCardPoints: Scores;
  capturedCards: [CardId[], CardId[], CardId[]];
  marriagePoints: Scores;
  capturedTricks: [number, number, number];
  declaredMarriages: [Suit[], Suit[], Suit[]];
  lastTrickWinner: Seat | null;
  handScoreDelta: Scores | null;
  scoreSummary: HandScoreSummary | null;
  completion: HandCompletion;
  status: MatchState['status'];
  winner: Seat | null;
  draw: boolean;
}

export function asSeat(value: number): Seat {
  return ((value % 3) + 3) % 3 as Seat;
}

export function nextSeat(seat: Seat): Seat {
  return asSeat(seat + 1);
}

export function createHand(dealer: Seat, deck: readonly CardId[], rules: ThreePlayerRules): HandState {
  if (deck.length !== 24 || new Set(deck).size !== 24) throw new Error('deck must contain 24 unique cards');
  const hands: Hands = [[], [], []];
  const forehand = nextSeat(dealer);
  for (let i = 0; i < 21; i += 1) hands[asSeat(forehand + (i % 3))].push(deck[i]);
  for (const seat of [0, 1, 2] as const) hands[seat] = sortHand(hands[seat]);
  return {
    dealer,
    hands,
    talon: deck.slice(21),
    revealedTalon: null,
    phase: 'auction',
    auction: { currentBid: rules.auction.openingBid, highBidder: forehand, active: [true, true, true], turn: nextSeat(forehand) },
    declarer: null,
    contract: null,
    fourNinesSeat: null,
    trump: null,
    trickIndex: 0,
    trickLeader: null,
    trick: [],
    lastCompletedTrick: null,
    capturedCardPoints: [0, 0, 0],
    capturedCards: [[], [], []],
    marriagePoints: [0, 0, 0],
    capturedTricks: [0, 0, 0],
    declaredMarriages: [[], [], []],
    lastTrickWinner: null,
    handScoreDelta: null,
    scoreSummary: null,
    completion: null,
  };
}

export function createMatch(rules: ThreePlayerRules, seed = 1, dealer: Seat = 0): MatchState {
  const shuffled = shuffledDeck(seed);
  return {
    rules,
    seed: shuffled.nextSeed,
    revision: 0,
    scores: [0, 0, 0],
    bombsUsed: [0, 0, 0],
    dealer,
    handNumber: 1,
    hand: createHand(dealer, shuffled.deck, rules),
    status: 'playing',
    winner: null,
    draw: false,
  };
}

function cloneScoreSummary(summary: HandScoreSummary | null | undefined): HandScoreSummary | null {
  if (!summary) return null;
  return {
    ...summary,
    seats: summary.seats.map((seat) => ({ ...seat })) as HandScoreSummary['seats'],
  };
}

export function cloneState(state: MatchState): MatchState {
  const hand = state.hand;
  return {
    ...state,
    scores: [...state.scores] as Scores,
    // Runtime compatibility for persisted pre-bomb rooms. The old pinned rules
    // stay old; this only supplies neutral structural state that did not exist yet.
    bombsUsed: [...(state.bombsUsed ?? [0, 0, 0])] as BombCounts,
    hand: {
      ...hand,
      hands: [hand.hands[0].slice(), hand.hands[1].slice(), hand.hands[2].slice()],
      talon: hand.talon.slice(),
      revealedTalon: hand.revealedTalon?.slice() ?? null,
      auction: { ...hand.auction, active: [...hand.auction.active] as [boolean, boolean, boolean] },
      fourNinesSeat: hand.fourNinesSeat ?? null,
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
      declaredMarriages: hand.declaredMarriages.map((suits) => suits.slice()) as [Suit[], Suit[], Suit[]],
      handScoreDelta: hand.handScoreDelta ? ([...hand.handScoreDelta] as Scores) : null,
      // Older persisted rooms simply have no summary; rules/state are not migrated.
      scoreSummary: cloneScoreSummary(hand.scoreSummary),
      completion: hand.completion ? { ...hand.completion } : null,
    },
  };
}
