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

function startupSeat(): Seat {
  const raw = new URLSearchParams(window.location.search).get('seat');
  return raw === '1' ? 1 : raw === '2' ? 2 : 0;
}

function namesForHuman(humanSeat: Seat): readonly [string, string, string] {
  const names = ['', '', ''] as [string, string, string];
  let botIndex = 0;
  for (const seat of [0, 1, 2] as const) {
    if (seat === humanSeat) names[seat] = 'Ty';
    else names[seat] = `Bot ${String.fromCharCode(65 + botIndex++)}`;
  }
  return names;
}

/**
 * Local single-player authority adapter.
 *
 * GameTable below receives only SeatProjection + commands, exactly the boundary
 * a future remote client will use. Hidden MatchState and bot orchestration stay
 * on this side of the presentation boundary. ?seat=N is QA-only and proves the
 * renderer/controller boundary does not rely on the human occupying seat 0.
 */
function App() {
  const [humanSeat] = useState<Seat>(startupSeat);
  const seatNames = useMemo(() => namesForHuman(humanSeat), [humanSeat]);
  const [authority, setAuthority] = useState<MatchState>(() => freshMatch(startupSeed()));
  const [message, setMessage] = useState('Pierwszy grywalny vertical slice — profil PlayOK/Kurnik candidate.');
  const projection = useMemo(() => projectSeat(authority, humanSeat), [authority, humanSeat]);
  const seatName = (seat: Seat) => seatNames[seat];

  function publishFeedback(events: Parameters<typeof describeFeedback>[0], fallback = '') {
    const text = describeFeedback(eventsForSeat(events, humanSeat), seatName);
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
    if (actor === null || actor === humanSeat) return;

    const delay = authority.hand.phase === 'trick' ? 520 : 360;
    const timer = window.setTimeout(() => {
      try {
        const command = productBotCommand(authority, actor);
        const result = applyCommand(authority, command);
        if (!result.ok) {
          setMessage(`${seatNames[actor]}: ruch odrzucony (${result.reason})`);
          return;
        }
        assertCoreInvariants(result.state);
        setAuthority(result.state);
        publishFeedback(result.events, `${seatNames[actor]} wykonał ruch.`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : String(error));
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [authority, humanSeat, seatNames]);

  return (
    <GameTable
      projection={projection}
      seatNames={seatNames}
      message={message}
      onCommand={commit}
      onNewGame={startNewGame}
    />
  );
}

export default App;
