export const SUITS = ['spades', 'clubs', 'diamonds', 'hearts'] as const;
export const RANKS = ['9', 'J', 'Q', 'K', '10', 'A'] as const;

export type Suit = (typeof SUITS)[number];
export type Rank = (typeof RANKS)[number];
export type CardId = `${Suit}:${Rank}`;

export const CARD_POINTS: Readonly<Record<Rank, number>> = {
  '9': 0,
  J: 2,
  Q: 3,
  K: 4,
  '10': 10,
  A: 11,
};

export const RANK_STRENGTH: Readonly<Record<Rank, number>> = {
  '9': 0,
  J: 1,
  Q: 2,
  K: 3,
  '10': 4,
  A: 5,
};

export function cardId(suit: Suit, rank: Rank): CardId {
  return `${suit}:${rank}`;
}

export function suitOf(card: CardId): Suit {
  return card.split(':', 1)[0] as Suit;
}

export function rankOf(card: CardId): Rank {
  return card.slice(card.indexOf(':') + 1) as Rank;
}

export function createDeck(): CardId[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => cardId(suit, rank)));
}

export function cardPoints(card: CardId): number {
  return CARD_POINTS[rankOf(card)];
}

export function compareSameSuit(a: CardId, b: CardId): number {
  return RANK_STRENGTH[rankOf(a)] - RANK_STRENGTH[rankOf(b)];
}

export function sortHand(cards: readonly CardId[]): CardId[] {
  return [...cards].sort((a, b) => {
    const suit = SUITS.indexOf(suitOf(a)) - SUITS.indexOf(suitOf(b));
    return suit !== 0 ? suit : RANK_STRENGTH[rankOf(a)] - RANK_STRENGTH[rankOf(b)];
  });
}

// Small explicit PRNG: deterministic across modern JS runtimes for the same uint32 seed.
export function shuffledDeck(seed: number): { deck: CardId[]; nextSeed: number } {
  let state = seed >>> 0;
  const next = (): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };

  const deck = createDeck();
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = next() % (i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return { deck, nextSeed: next() };
}
