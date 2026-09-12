import { cardId, type CardId, type Suit } from './cards.js';

export type RoundingMode = 'nearest-10-half-up' | 'nearest-10-six-up';

export interface ThreePlayerRules {
  readonly id: string;
  readonly version: number;
  readonly targetScore: number;
  readonly auction: {
    readonly openingBid: number;
    readonly increment: number;
    readonly maxWithoutMarriage: number;
    readonly bidCapUsesMarriageValue: boolean;
    readonly finalContractCap: 'same-marriage-cap';
  };
  readonly exchange: {
    readonly transferVisibility: 'recipient-private' | 'public';
  };
  /**
   * Optional at runtime for persisted matches created before bomb support existed.
   * Absence means the historical pinned match keeps that feature disabled.
   */
  readonly bomb?: {
    readonly enabled: boolean;
    readonly window: 'after-talon-before-exchange';
    readonly firstBombFree: boolean;
    readonly repeatedOpponentAward: number;
    readonly opponentAwardRespectsLock: boolean;
  };
  /**
   * Optional at runtime for persisted matches created before four-nines support.
   * Absence means the historical pinned match keeps that feature disabled.
   */
  readonly fourNines?: {
    readonly enabled: boolean;
    readonly window: 'after-exchange-before-contract';
    readonly optional: boolean;
    readonly redealKeepsDealer: boolean;
  };
  readonly trick: {
    /** Follow the led suit whenever the hand contains it. */
    readonly mustFollowSuit: boolean;
    /** While following suit, beat the current led-suit winner when possible. */
    readonly mustBeatWhenPossible: boolean;
    /** When void in the led suit and trump exists, a trump is compulsory. */
    readonly mustTrumpWhenVoid: boolean;
    /** If trump is compulsory and a trump already wins, overtrump when possible. */
    readonly mustOvertrumpWhenPossible: boolean;
  };
  readonly marriage: {
    readonly values: Readonly<Record<Suit, number>>;
    readonly allowedOnFirstTrick: boolean;
    readonly requiresCapturedTrickForScore: boolean;
  };
  readonly scoring: {
    readonly defenderRounding: RoundingMode;
    readonly lockThreshold: number;
  };
  readonly unresolved: {
    readonly bombReferenceValidation?: true;
    readonly fourNinesReferenceValidation?: true;
    readonly bomb?: true;
    readonly fourNinesRedeal?: true;
  };
}

export const PLAYOK_3P_800_CANDIDATE: ThreePlayerRules = {
  id: 'PLAYOK_3P_800_CANDIDATE',
  version: 3,
  targetScore: 1000,
  auction: {
    openingBid: 100,
    increment: 10,
    maxWithoutMarriage: 120,
    bidCapUsesMarriageValue: true,
    // Provisional pin: after exchange, use the same 120 + currently held
    // marriage-value cap until PlayOK is reference-probed.
    finalContractCap: 'same-marriage-cap',
  },
  exchange: {
    transferVisibility: 'recipient-private',
  },
  bomb: {
    enabled: true,
    // Kurnik documents withdrawal by the declarer and the first-free/later-60
    // scoring. The exact reference UI timing is not documented precisely enough,
    // so the candidate pins the smallest natural window: after the talon is
    // revealed/taken and before any exchange is committed.
    window: 'after-talon-before-exchange',
    firstBombFree: true,
    repeatedOpponentAward: 60,
    // Kurnik places the 800-lock rule immediately after bomb scoring. Until a
    // black-box reference probe says otherwise, ordinary score-lock semantics
    // also apply to bomb-awarded opponent points.
    opponentAwardRespectsLock: true,
  },
  fourNines: {
    enabled: true,
    // Kurnik says that a player who "gets four nines" may request a redeal.
    // Pagat's broader 1000 description places this check after the exchange and
    // explicitly notes that a fourth nine may be received from the declarer.
    window: 'after-exchange-before-contract',
    optional: true,
    // A redeal repeats the deal rather than advancing normal dealer rotation.
    // This matches the explicit same-dealer wording in Pagat and remains a
    // source-scoped candidate behavior until PlayOK itself is reference-probed.
    redealKeepsDealer: true,
  },
  trick: {
    // Current PlayOK/Kurnik textual-reading pin. These are deliberately ordinary
    // booleans because documented Polish variants differ, especially on whether
    // trump is compulsory when void in the led suit.
    mustFollowSuit: true,
    mustBeatWhenPossible: true,
    mustTrumpWhenVoid: true,
    mustOvertrumpWhenPossible: true,
  },
  marriage: {
    values: {
      spades: 40,
      clubs: 60,
      diamonds: 80,
      hearts: 100,
    },
    allowedOnFirstTrick: true,
    requiresCapturedTrickForScore: false,
  },
  scoring: {
    defenderRounding: 'nearest-10-half-up',
    lockThreshold: 800,
  },
  unresolved: {
    bombReferenceValidation: true,
    fourNinesReferenceValidation: true,
  },
};

export function marriageValueInHand(hand: readonly CardId[], rules: ThreePlayerRules): number {
  let total = 0;
  for (const [suit, value] of Object.entries(rules.marriage.values) as [Suit, number][]) {
    if (hand.includes(cardId(suit, 'K')) && hand.includes(cardId(suit, 'Q'))) total += value;
  }
  return total;
}

export function maxBidForHand(hand: readonly CardId[], rules: ThreePlayerRules): number {
  const marriage = marriageValueInHand(hand, rules);
  return marriage === 0 ? rules.auction.maxWithoutMarriage : rules.auction.maxWithoutMarriage + marriage;
}

export function roundDefenderScore(value: number, mode: RoundingMode): number {
  const remainder = ((value % 10) + 10) % 10;
  const down = value - remainder;
  if (mode === 'nearest-10-six-up') return remainder >= 6 ? down + 10 : down;
  return remainder >= 5 ? down + 10 : down;
}
