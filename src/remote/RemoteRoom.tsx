import { useEffect, useMemo, useRef, useState } from 'react';
import type { Command, GameEvent, Seat, SeatProjection } from '../core/index.js';
import { describeFeedback } from '../presentation/feedback.js';
import { GameTable } from '../presentation/GameTable.js';
import {
  commandEnvelope,
  forgetSeatToken,
  getPublicRoom,
  getRoomSession,
  joinRemoteRoom,
  openRoomSocket,
  storedSeatToken,
  type RoomSnapshot,
  type RoomSocketMessage,
} from './room-client.js';

interface RemoteRoomProps {
  room: string;
  onLeave: () => void;
}

type ConnectionState = 'loading' | 'lobby' | 'connected' | 'reconnecting' | 'error';

function namesForRoom(state: RoomSnapshot, ownSeat: Seat | null): readonly [string, string, string] {
  return state.seats.map((role, index) => {
    if (index === ownSeat) return 'Ty';
    if (role === 'bot') return `Bot ${index + 1}`;
    if (role === 'open') return 'Wolne miejsce';
    return `Gracz ${index + 1}`;
  }) as [string, string, string];
}

function feedback(events: readonly GameEvent[], names: readonly [string, string, string]): string {
  return describeFeedback(events, (seat) => names[seat]);
}

export function RemoteRoom({ room, onLeave }: RemoteRoomProps) {
  const [token, setToken] = useState<string | null>(() => storedSeatToken(room));
  const [seat, setSeat] = useState<Seat | null>(null);
  const [roomState, setRoomState] = useState<RoomSnapshot | null>(null);
  const [projection, setProjection] = useState<SeatProjection | null>(null);
  const [message, setMessage] = useState('Łączenie z pokojem…');
  const [connection, setConnection] = useState<ConnectionState>('loading');
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const names = useMemo(
    () => roomState ? namesForRoom(roomState, seat) : ['Ty', 'Gracz 2', 'Gracz 3'] as const,
    [roomState, seat],
  );

  useEffect(() => {
    let cancelled = false;
    socketRef.current?.close(1000, 'room changed');
    socketRef.current = null;
    if (reconnectTimerRef.current !== null) window.clearTimeout(reconnectTimerRef.current);

    async function load() {
      setConnection('loading');
      setMessage('Łączenie z pokojem…');
      setProjection(null);
      setSeat(null);

      if (!token) {
        try {
          const state = await getPublicRoom(room);
          if (cancelled) return;
          setRoomState(state);
          setConnection('lobby');
          setMessage(state.status === 'lobby' ? 'Pokój czeka na graczy.' : 'Ten pokój już wystartował.');
        } catch (error) {
          if (cancelled) return;
          setConnection('error');
          setMessage(error instanceof Error ? error.message : String(error));
        }
        return;
      }

      try {
        const session = await getRoomSession(room, token);
        if (cancelled) return;
        setSeat(session.seat);
        setRoomState(session.state);
        setProjection(session.projection);
        setConnection(session.projection ? 'reconnecting' : 'lobby');
      } catch (error) {
        if (cancelled) return;
        forgetSeatToken(room);
        setToken(null);
        setConnection('error');
        setMessage(`Nie udało się odzyskać miejsca: ${error instanceof Error ? error.message : String(error)}`);
        return;
      }

      const connect = () => {
        if (cancelled || !token) return;
        const socket = openRoomSocket(room, token);
        socketRef.current = socket;

        socket.addEventListener('open', () => {
          if (cancelled) return;
          setConnection('connected');
          setMessage((current) => current === 'Łączenie z pokojem…' ? 'Połączono.' : current);
        });

        socket.addEventListener('message', (event) => {
          if (cancelled) return;
          let packet: RoomSocketMessage;
          try { packet = JSON.parse(String(event.data)) as RoomSocketMessage; }
          catch { setMessage('Serwer wysłał nieczytelną wiadomość.'); return; }

          if (packet.type === 'lobby') {
            setSeat(packet.seat);
            setRoomState(packet.room);
            setConnection('lobby');
            setMessage('Czekamy na pozostałych graczy.');
            return;
          }
          if (packet.type === 'snapshot') {
            setProjection(packet.projection);
            setSeat(packet.projection.observation.seat);
            setConnection('connected');
            return;
          }
          if (packet.type === 'started') {
            setProjection(packet.projection);
            setSeat(packet.projection.observation.seat);
            setConnection('connected');
            setRoomState((current) => current ? { ...current, status: 'playing', revision: packet.projection.observation.revision } : current);
            void getPublicRoom(room).then((state) => {
              if (!cancelled) setRoomState(state);
            }).catch(() => {});
            const provisionalNames = roomState
              ? namesForRoom(roomState, packet.projection.observation.seat)
              : ['Ty', 'Gracz 2', 'Gracz 3'] as const;
            const text = feedback(packet.events, provisionalNames);
            if (text) setMessage(text);
            return;
          }
          if (packet.type === 'update' || packet.type === 'duplicate') {
            setProjection(packet.projection);
            setSeat(packet.projection.observation.seat);
            setRoomState((current) => current ? {
              ...current,
              status: packet.projection.observation.status === 'complete' ? 'complete' : 'playing',
              revision: packet.projection.observation.revision,
            } : current);
            setConnection('connected');
            const eventNames = roomState
              ? namesForRoom(roomState, packet.projection.observation.seat)
              : ['Ty', 'Gracz 2', 'Gracz 3'] as const;
            const text = feedback(packet.events, eventNames);
            if (text) setMessage(text);
            return;
          }
          if (packet.type === 'rejected') {
            if (packet.projection) setProjection(packet.projection);
            setMessage(`Odrzucone: ${packet.reason}`);
            return;
          }
          if (packet.type === 'error') setMessage(`Błąd pokoju: ${packet.reason}`);
        });

        socket.addEventListener('close', () => {
          if (cancelled || socketRef.current !== socket) return;
          socketRef.current = null;
          setConnection('reconnecting');
          setMessage('Połączenie przerwane — ponawiam…');
          reconnectTimerRef.current = window.setTimeout(connect, 900);
        });

        socket.addEventListener('error', () => {
          if (!cancelled) setMessage('Problem z połączeniem — próbuję ponownie…');
        });
      };

      connect();
    }

    void load();
    return () => {
      cancelled = true;
      if (reconnectTimerRef.current !== null) window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
      socketRef.current?.close(1000, 'component unmounted');
      socketRef.current = null;
    };
  }, [room, token]);

  async function join() {
    try {
      setMessage('Zajmuję miejsce…');
      const identity = await joinRemoteRoom(room);
      setRoomState(identity.state);
      setSeat(identity.seat);
      setToken(identity.token);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function copyShareLink() {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('room', room);
    try {
      await navigator.clipboard.writeText(url.toString());
      setMessage('Link do pokoju skopiowany.');
    } catch {
      setMessage(`Kod pokoju: ${room}`);
    }
  }

  function sendCommand(command: Command) {
    if (!projection) return;
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setMessage('Brak połączenia — poczekaj na reconnect.');
      return;
    }
    socket.send(JSON.stringify(commandEnvelope(projection, command)));
  }

  if (projection) {
    return (
      <>
        <div className={`connection-banner ${connection}`}>Pokój {room} · {connection === 'connected' ? 'online' : 'łączenie…'}</div>
        <GameTable projection={projection} seatNames={names} message={message} onCommand={sendCommand} />
      </>
    );
  }

  const canJoin = !token && roomState?.status === 'lobby' && roomState.seats.includes('open');
  return (
    <main className="room-shell">
      <section className="room-card">
        <div className="eyebrow">Tysiąc The Game · prywatny pokój</div>
        <h1>{room}</h1>
        <p>{message}</p>
        {roomState && (
          <div className="room-seats" aria-label="Miejsca przy stole">
            {roomState.seats.map((role, index) => (
              <div key={index} className={`room-seat ${role}`}>
                <strong>Miejsce {index + 1}</strong>
                <span>{index === seat ? 'Ty' : role === 'human' ? 'Gracz' : role === 'bot' ? 'Bot' : 'Wolne'}</span>
              </div>
            ))}
          </div>
        )}
        <div className="room-actions">
          {canJoin && <button className="primary" onClick={() => void join()}>Dołącz do stołu</button>}
          {token && roomState?.status === 'lobby' && <button className="primary" onClick={() => void copyShareLink()}>Kopiuj link dla znajomego</button>}
          <button className="ghost" onClick={onLeave}>Wróć</button>
        </div>
        <small>Link zawiera tylko kod pokoju. Prywatny token miejsca zostaje w tej przeglądarce.</small>
      </section>
    </main>
  );
}
