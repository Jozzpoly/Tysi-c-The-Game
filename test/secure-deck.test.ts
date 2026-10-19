import { describe, expect, it } from 'vitest';
import { PLAYOK_3P_800_CANDIDATE, applyCommand, createDeck, createHand, createMatch, playAutomatedHand, shuffledDeck } from '../src/core/index.js';
import { secureShuffledDeck } from '../worker/secure-deck.js';

describe('cryptographically unpredictable multiplayer deals', () => {
  it('emits a complete unique deck and draws fresh independent permutations', () => {
    const wholeDeck = createDeck().slice().sort();
    const permutations = new Set<string>();
    for (let i = 0; i < 24; i += 1) {
      const deck = secureShuffledDeck();
      expect(deck.slice().sort()).toEqual(wholeDeck);
      permutations.add(deck.join('|'));
    }
    expect(permutations.size).toBe(24);
  });

  it('injects a private deal without changing reproducible core defaults', () => {
    const custom = shuffledDeck(928151).deck;
    const overridden = createMatch(PLAYOK_3P_800_CANDIDATE, 1, 0, custom);
    expect(overridden.hand.hands).toEqual(createHand(0, custom, PLAYOK_3P_800_CANDIDATE).hands);
    expect(createMatch(PLAYOK_3P_800_CANDIDATE, 1, 0).hand.hands).toEqual(
      createMatch(PLAYOK_3P_800_CANDIDATE, 1, 0).hand.hands);
    const completed = playAutomatedHand(overridden);
    const nextDeck = shuffledDeck(391).deck;
    const transitioned = applyCommand(completed, { type: 'next-hand', seat: 0 }, nextDeck);
    expect(transitioned.ok).toBe(true);
    if (!transitioned.ok) return;
    expect(transitioned.state.hand.hands).toEqual(createHand(1, nextDeck, PLAYOK_3P_800_CANDIDATE).hands);
  });
});
