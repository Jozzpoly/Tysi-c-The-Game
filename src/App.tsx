import { useEffect, useMemo, useState } from 'react';
import {
  PLAYOK_3P_800_CANDIDATE,
  actingSeat,
  applyCommand,
  assertCoreInvariants,
  createMatch,
  eventsForSeat,
  productBotCommand,
  projectSeat,
  type Command,
  type MatchState,
  type Seat,
} from './core/index.js';
import { describeFeedback } from './presentation/feedback.js';
import { GameTable } from './presentation/GameTable.js';
import './styles.css';

const HUMAN: Seat = 0;
const SEAT_NAMES: readonly [string, string, string] = ['Ty', 'Bot A', 'Bot B'];
const seatName = (seat: Seat) => SEAT_NAMES[seat];

function freshMatch(seed = Date.now() >>> 0): MatchState {
  const state = createMatch(PLAYOK_3P_800_CANDIDATE, seed, 0);
  assertCoreInvariants(state);
  return state;
}

function startupSeed(): number | undefined {
  const raw = new URLSearchParams(window.location.search).get('seed');
  if (raw === null) return undefined;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0 || value > 0xffff_ffff) return undefined;
  return value;
}

/**
 * Local single-player authority adapter.
 *
 * GameTable below receives only SeatProjection + commands, exactly the boundary
 * a future remote client will use. Hidden MatchState and bot orchestration stay
 * on this side of the presentation boundary.
 */
function App() {
  const [authority, setAuthority] = useState<MatchState>(() => freshMatch(startupSeed()));
  const [message, setMessage] = useState('Pierwszy grywalny vertical slice — profil PlayOK/Kurnik candidate.');
  const projection = useMemo(() => projectSeat(authority, HUMAN), [authority]);

  function publishFeedback(events: Parameters<typeof describeFeedback>[0], fallback = '') {
    const text = describeFeedback(eventsForSeat(events, HUMAN), seatName);
    setMessage(text || fallback);
  }

  function commit(command: Command) {
    const result = applyCommand(authority, command);
    if (!result.ok) {
      setMessage(`Odrzucone: ${result.reason}`);
      return;
    }
    try {
      assertCoreInvariants(result.state);
      setAuthority(result.state);
      publishFeedback(result.events, 'Ruch przyjęty.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  function startNewGame() {
    setAuthority(freshMatch());
    setMessage('Nowa gra.');
  }

  useEffect(() => {
    if (authority.status === 'complete' || authority.hand.phase === 'complete') return;
    const actor = actingSeat(authority);
    if (actor === null || actor === HUMAN) return;

    const delay = authority.hand.phase === 'trick' ? 520 : 360;
    const timer = window.setTimeout(() => {
      try {
        const command = productBotCommand(authority, actor);
        const result = applyCommand(authority, command);
        if (!result.ok) {
          setMessage(`${SEAT_NAMES[actor]}: ruch odrzucony (${result.reason})`);
          return;
        }
        assertCoreInvariants(result.state);
        setAuthority(result.state);
        publishFeedback(result.events, `${SEAT_NAMES[actor]} wykonał ruch.`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : String(error));
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [authority]);

  return (
    <GameTable
      projection={projection}
      seatNames={SEAT_NAMES}
      message={message}
      onCommand={commit}
      onNewGame={startNewGame}
    />
  );
}

export default App;
