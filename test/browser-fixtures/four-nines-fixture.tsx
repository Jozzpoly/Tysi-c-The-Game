import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  PLAYOK_3P_800_CANDIDATE,
  applyCommand,
  assertCoreInvariants,
  cardId,
  createDeck,
  createMatch,
  eventsForSeat,
  projectSeat,
  sortHand,
  type Command,
  type GameEvent,
  type MatchState,
  type Seat,
} from '../../src/core/index.js';
import { describeFeedback } from '../../src/presentation/feedback.js';
import { LivingGameTable } from '../../src/presentation/LivingGameTable.js';
import '../../src/styles.css';
import '../../src/run05-deal.css';

function buildFixtureState(): MatchState {
  const state = createMatch(PLAYOK_3P_800_CANDIDATE, 20260912, 0);
  const deck = createDeck();
  const threeNines = [cardId('spades', '9'), cardId('clubs', '9'), cardId('diamonds', '9')];
  const transferredNine = cardId('hearts', '9');
  const nonNines = deck.filter((card) => !card.endsWith(':9'));
  const seat1 = sortHand([...threeNines, ...nonNines.slice(0, 4)]);
  const seat2 = sortHand(nonNines.slice(4, 11));
  const used = new Set([...seat1, ...seat2]);
  const declarer = sortHand(deck.filter((card) => !used.has(card)));
  const secondTransfer = declarer.find((card) => card !== transferredNine);
  if (!secondTransfer) throw new Error('fixture transfer card missing');

  state.hand.phase = 'exchange';
  state.hand.declarer = 0;
  state.hand.auction.currentBid = 100;
  state.hand.auction.highBidder = 0;
  state.hand.hands = [declarer, seat1, seat2];
  state.hand.revealedTalon = declarer.slice(0, 3);
  state.hand.fourNinesSeat = null;
  assertCoreInvariants(state);

  const exchanged = applyCommand(state, {
    type: 'exchange',
    seat: 0,
    give: [
      { to: 1, card: transferredNine },
      { to: 2, card: secondTransfer },
    ],
  });
  if (!exchanged.ok) throw new Error(exchanged.reason ?? 'fixture exchange rejected');
  assertCoreInvariants(exchanged.state);
  return exchanged.state;
}

function fixtureSeat(): Seat {
  const raw = new URLSearchParams(window.location.search).get('seat');
  return raw === '0' ? 0 : raw === '2' ? 2 : 1;
}

function Fixture() {
  const [seat] = useState<Seat>(fixtureSeat);
  const [state, setState] = useState<MatchState>(buildFixtureState);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [message, setMessage] = useState('Kontrolowany scenariusz testowy.');
  const names = useMemo(() => {
    const value = ['Gracz 1', 'Gracz 2', 'Gracz 3'] as [string, string, string];
    value[seat] = 'Ty';
    return value;
  }, [seat]);
  const projection = useMemo(() => projectSeat(state, seat), [state, seat]);

  function command(next: Command) {
    const result = applyCommand(state, next);
    if (!result.ok) {
      setMessage(`Odrzucone: ${result.reason}`);
      return;
    }
    assertCoreInvariants(result.state);
    const presentedEvents = eventsForSeat(result.events, seat);
    setState(result.state);
    setEvents(presentedEvents);
    const feedback = describeFeedback(presentedEvents, (target) => names[target]);
    setMessage(feedback || 'Ruch przyjęty.');
  }

  return (
    <LivingGameTable
      projection={projection}
      seatNames={names}
      events={events}
      message={message}
      onCommand={command}
    />
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('fixture root missing');
createRoot(root).render(<Fixture />);
