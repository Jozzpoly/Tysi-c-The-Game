import { createDeck, type CardId } from '../src/core/cards.js';

/**
 * Multiplayer-only cryptographic deal entropy. No seed/state is sent to clients.
 * The deterministic core shuffler remains available for replayable local tests.
 * Use unbiased 32-bit rejection sampling for each Fisher-Yates selection.
 */
export function secureShuffledDeck(): CardId[] {
  const deck = createDeck();
  const random = new Uint32Array(1);
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const choices = index + 1;
    const limit = Math.floor(0x1_0000_0000 / choices) * choices;
    let value: number;
    do {
      crypto.getRandomValues(random);
      value = random[0];
    } while (value >= limit);
    const chosen = value % choices;
    [deck[index], deck[chosen]] = [deck[chosen], deck[index]];
  }
  return deck;
}
