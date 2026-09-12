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

  const match = events.find((event) => event.type === 'match-completed');
  if (match?.type === 'match-completed') {
    return match.draw ? 'Mecz zakończony remisem.' : `${nameForSeat(match.winner ?? 0)} wygrywa mecz.`;
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
    return bomb.bombNumber === 1
      ? `${nameForSeat(bomb.seat)} daje pierwszą bombę. Rozdanie kończy się bez zmiany wyniku.`
      : `${nameForSeat(bomb.seat)} daje bombę nr ${bomb.bombNumber}.${changes ? ` ${changes}.` : ' Bez zmiany wyniku.'}`;
  }

  const hand = events.find((event) => event.type === 'hand-scored');
  if (hand?.type === 'hand-scored') {
    const result = hand.contractMade ? 'realizuje' : 'nie realizuje';
    return `${nameForSeat(hand.declarer)} ${result} kontrakt ${hand.contract}.`;
  }

  const trick = events.find((event) => event.type === 'trick-completed');
  if (trick?.type === 'trick-completed') {
    return `${nameForSeat(trick.trick.winner)} bierze lewę ${trick.trick.index} · ${trick.trick.points} pkt`;
  }

  const marriage = events.find((event) => event.type === 'marriage-declared');
  const play = events.find((event) => event.type === 'card-played');
  if (marriage?.type === 'marriage-declared' && play?.type === 'card-played' && marriage.seat === play.seat) {
    return `${nameForSeat(play.seat)} melduje ${SUIT_SYMBOL[marriage.suit]} i zagrywa ${cardLabel(play.card)}`;
  }
  if (play?.type === 'card-played') return `${nameForSeat(play.seat)} zagrywa ${cardLabel(play.card)}`;

  const received = events.find((event) => event.type === 'card-received');
  if (received?.type === 'card-received') {
    return `Dostajesz ${cardLabel(received.card)} od ${nameForSeat(received.from)}.`;
  }

  const contract = events.find((event) => event.type === 'contract-set');
  if (contract?.type === 'contract-set') return `${nameForSeat(contract.seat)} gra ${contract.value}.`;

  const auction = events.find((event) => event.type === 'auction-won');
  if (auction?.type === 'auction-won') return `${nameForSeat(auction.seat)} wygrywa licytację za ${auction.value}.`;

  const exchange = events.find((event) => event.type === 'exchange-completed');
  if (exchange?.type === 'exchange-completed') return `${nameForSeat(exchange.from)} kończy wymianę kart.`;

  const bid = events.find((event) => event.type === 'bid-placed');
  if (bid?.type === 'bid-placed') return `${nameForSeat(bid.seat)} licytuje ${bid.value}.`;

  const passed = events.find((event) => event.type === 'player-passed');
  if (passed?.type === 'player-passed') return `${nameForSeat(passed.seat)} pasuje.`;

  const handStarted = events.find((event) => event.type === 'hand-started');
  if (handStarted?.type === 'hand-started') return `Rozdanie ${handStarted.handNumber}.`;

  return '';
}
