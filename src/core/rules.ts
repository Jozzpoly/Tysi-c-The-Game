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
  readonly trick: {
    readonly mustFollowSuit: true;
    readonly mustBeatWhenPossible: true;
    readonly mustTrumpWhenVoid: true;
    readonly mustOvertrumpWhenPossible: true;
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
    readonly bomb: true;
    readonly fourNinesRedeal: true;
  };
}

export const PLAYOK_3P_800_CANDIDATE: ThreePlayerRules = {
  id: 'PLAYOK_3P_800_CANDIDATE',
  version: 1,
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
  trick: {
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
    bomb: true,
    fourNinesRedeal: true,
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
