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
  type GameEvent,
  type MatchState,
  type Seat,
} from './core/index.js';
import { describeFeedback } from './presentation/feedback.js';
import { GameTable } from './presentation/GameTable.js';
import { RulesGuide } from './presentation/RulesGuide.js';
import { RemoteRoom } from './remote/RemoteRoom.js';
import { createRemoteRoom, normalizedRoomCode, type RoomMode } from './remote/room-client.js';
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

function LocalGame() {
  const [humanSeat] = useState<Seat>(startupSeat);
  const seatNames = useMemo(() => namesForHuman(humanSeat), [humanSeat]);
  const [authority, setAuthority] = useState<MatchState>(() => freshMatch(startupSeed()));
  const [presentedEvents, setPresentedEvents] = useState<GameEvent[]>([]);
  const [message, setMessage] = useState('Lokalny QA slice — profil PlayOK/Kurnik candidate.');
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
      setPresentedEvents(eventsForSeat(result.events, humanSeat));
      publishFeedback(result.events, 'Ruch przyjęty.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  function startNewGame() {
    setAuthority(freshMatch());
    setPresentedEvents([]);
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
        setPresentedEvents(eventsForSeat(result.events, humanSeat));
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
      events={presentedEvents}
      message={message}
      onCommand={commit}
      onNewGame={startNewGame}
    />
  );
}

function roomFromUrl(): string | null {
  const raw = new URLSearchParams(window.location.search).get('room');
  return raw ? normalizedRoomCode(raw) : null;
}

function localQaRequested(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.has('seed') || params.has('seat') || params.get('local') === '1';
}

function App() {
  const [room, setRoom] = useState<string | null>(roomFromUrl);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<RoomMode | 'code' | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (localQaRequested()) return;
    const syncFromHistory = () => setRoom(roomFromUrl());
    window.addEventListener('popstate', syncFromHistory);
    return () => window.removeEventListener('popstate', syncFromHistory);
  }, []);

  if (localQaRequested()) return <LocalGame />;

  function navigateRoom(nextRoom: string | null) {
    const url = new URL(window.location.href);
    url.search = '';
    if (nextRoom) url.searchParams.set('room', nextRoom);
    window.history.pushState({}, '', url);
    setRoom(nextRoom);
  }

  async function create(mode: RoomMode) {
    setBusy(mode);
    setMessage('Tworzę pokój…');
    try {
      const identity = await createRemoteRoom(mode);
      navigateRoom(identity.room);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  }

  function openCode() {
    const normalized = normalizedRoomCode(code);
    if (!normalized) {
      setMessage('Kod pokoju powinien mieć 12 znaków.');
      return;
    }
    setBusy('code');
    navigateRoom(normalized);
    setBusy(null);
  }

  if (room) return <RemoteRoom room={room} onLeave={() => navigateRoom(null)} />;

  return (
    <main className="home-shell">
      <section className="home-card">
        <div className="eyebrow">Tysiąc The Game</div>
        <h1>Usiądź do stołu</h1>
        <p>Bez konta. Prywatny pokój działa na tym samym silniku reguł dla ludzi i botów.</p>

        <div className="home-guide-row">
          <span>Pierwszy raz grasz w Tysiąca?</span>
          <RulesGuide label="Zasady w 60 sekund" />
        </div>

        <div className="mode-grid">
          <button className="mode-card primary" disabled={busy !== null} onClick={() => void create('solo')}>
            <strong>Zagraj sam</strong><span>Ty + 2 boty</span>
          </button>
          <button className="mode-card" disabled={busy !== null} onClick={() => void create('duo')}>
            <strong>Zagraj we dwóch</strong><span>2 graczy + bot</span>
          </button>
          <button className="mode-card" disabled={busy !== null} onClick={() => void create('trio')}>
            <strong>Zagraj we trzech</strong><span>3 graczy</span>
          </button>
        </div>

        <div className="join-row">
          <input
            aria-label="Kod pokoju"
            inputMode="text"
            maxLength={12}
            placeholder="KOD POKOJU"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            onKeyDown={(event) => { if (event.key === 'Enter') openCode(); }}
          />
          <button disabled={busy !== null} onClick={openCode}>Dołącz kodem</button>
        </div>

        {message && <div className="home-message">{message}</div>}
        <small>Zasady: PlayOK/Kurnik 3P 800 · wersja testowa. Rzadkie warianty nadal weryfikujemy.</small>
      </section>
    </main>
  );
}

export default App;
