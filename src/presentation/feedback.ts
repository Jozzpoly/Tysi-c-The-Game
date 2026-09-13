import { rankOf, suitOf, type GameEvent, type Seat } from '../core/index.js';

const SUIT_SYMBOL = { spades: '♠', clubs: '♣', diamonds: '♦', hearts: '♥' } as const;

function cardLabel(card: Parameters<typeof rankOf>[0]): string {
  return `${rankOf(card)}${SUIT_SYMBOL[suitOf(card)]}`;
}

/**
 * Cheap textual presenter for the current foundation UI.
 * Rich animation/audio/haptics should consume the same GameEvent stream later,
 * rather than reverse-engineering state diffs or parsing this text.
 */
export function describeFeedback(
  events: readonly GameEvent[],
  nameForSeat: (seat: Seat) => string,
): string {
  if (events.length === 0) return '';

  const forSeat = (seat: Seat, you: string, thirdPerson: string) => {
    const name = nameForSeat(seat);
    return name === 'Ty' ? you : `${name} ${thirdPerson}`;
  };

  const match = events.find((event) => event.type === 'match-completed');
  if (match?.type === 'match-completed') {
    return match.draw ? 'Mecz zakończony remisem.' : forSeat(match.winner ?? 0, 'Wygrywasz mecz.', 'wygrywa mecz.');
  }

  const redeal = events.find((event) => event.type === 'four-nines-redeal');
  if (redeal?.type === 'four-nines-redeal') {
    return `${nameForSeat(redeal.seat)}: cztery dziewiątki — ponowne rozdanie.`;
  }

  const bomb = events.find((event) => event.type === 'hand-bombed');
  if (bomb?.type === 'hand-bombed') {
    const changes = bomb.delta
      .map((value, seat) => value === 0 ? null : `${nameForSeat(seat as Seat)} +${value}`)
      .filter(Boolean)
      .join(' · ');
    const suffix = changes ? ` ${changes}.` : ' Bez zmiany wyniku.';
    return bomb.bombNumber === 1
      ? forSeat(bomb.seat, 'Dajesz pierwszą bombę. Rozdanie kończy się bez zmiany wyniku.', 'daje pierwszą bombę. Rozdanie kończy się bez zmiany wyniku.')
      : `${forSeat(bomb.seat, `Dajesz bombę nr ${bomb.bombNumber}.`, `daje bombę nr ${bomb.bombNumber}.`)}${suffix}`;
  }

  const hand = events.find((event) => event.type === 'hand-scored');
  if (hand?.type === 'hand-scored') {
    return hand.contractMade
      ? forSeat(hand.declarer, `Realizujesz kontrakt ${hand.contract}.`, `realizuje kontrakt ${hand.contract}.`)
      : forSeat(hand.declarer, `Nie realizujesz kontraktu ${hand.contract}.`, `nie realizuje kontraktu ${hand.contract}.`);
  }

  const trick = events.find((event) => event.type === 'trick-completed');
  if (trick?.type === 'trick-completed') {
    return forSeat(
      trick.trick.winner,
      `Bierzesz lewę ${trick.trick.index} · ${trick.trick.points} pkt`,
      `bierze lewę ${trick.trick.index} · ${trick.trick.points} pkt`,
    );
  }

  const marriage = events.find((event) => event.type === 'marriage-declared');
  const play = events.find((event) => event.type === 'card-played');
  if (marriage?.type === 'marriage-declared' && play?.type === 'card-played' && marriage.seat === play.seat) {
    return forSeat(
      play.seat,
      `Meldujesz ${SUIT_SYMBOL[marriage.suit]} i zagrywasz ${cardLabel(play.card)}`,
      `melduje ${SUIT_SYMBOL[marriage.suit]} i zagrywa ${cardLabel(play.card)}`,
    );
  }
  if (play?.type === 'card-played') {
    return forSeat(play.seat, `Zagrywasz ${cardLabel(play.card)}`, `zagrywa ${cardLabel(play.card)}`);
  }

  const received = events.find((event) => event.type === 'card-received');
  if (received?.type === 'card-received') {
    return `Dostajesz ${cardLabel(received.card)} od ${nameForSeat(received.from)}.`;
  }

  const contract = events.find((event) => event.type === 'contract-set');
  if (contract?.type === 'contract-set') {
    return forSeat(contract.seat, `Grasz ${contract.value}.`, `gra ${contract.value}.`);
  }

  const auction = events.find((event) => event.type === 'auction-won');
  if (auction?.type === 'auction-won') {
    return forSeat(auction.seat, `Wygrywasz licytację za ${auction.value}.`, `wygrywa licytację za ${auction.value}.`);
  }

  const exchange = events.find((event) => event.type === 'exchange-completed');
  if (exchange?.type === 'exchange-completed') {
    return forSeat(exchange.from, 'Kończysz wymianę kart.', 'kończy wymianę kart.');
  }

  const bid = events.find((event) => event.type === 'bid-placed');
  if (bid?.type === 'bid-placed') {
    return forSeat(bid.seat, `Licytujesz ${bid.value}.`, `licytuje ${bid.value}.`);
  }

  const passed = events.find((event) => event.type === 'player-passed');
  if (passed?.type === 'player-passed') return forSeat(passed.seat, 'Pasujesz.', 'pasuje.');

  const handStarted = events.find((event) => event.type === 'hand-started');
  if (handStarted?.type === 'hand-started') return `Rozdanie ${handStarted.handNumber}.`;

  return '';
}
