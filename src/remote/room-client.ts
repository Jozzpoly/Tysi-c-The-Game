import type { Command, GameEvent, Seat, SeatProjection } from '../core/index.js';

export type RoomMode = 'solo' | 'duo' | 'trio';
export type PublicSeatRole = 'human' | 'open' | 'bot';

export interface RoomSnapshot {
  mode: RoomMode;
  status: 'lobby' | 'playing' | 'complete';
  seats: [PublicSeatRole, PublicSeatRole, PublicSeatRole];
  revision: number | null;
}

export interface RoomIdentity {
  room: string;
  seat: Seat;
  token: string;
  state: RoomSnapshot;
}

export interface RoomSession {
  room: string;
  seat: Seat;
  state: RoomSnapshot;
  projection: SeatProjection | null;
}

export interface CommandEnvelope {
  type: 'command';
  clientCommandId: string;
  expectedRevision: number;
  command: Command;
}

export type RoomSocketMessage =
  | { type: 'lobby'; seat: Seat; room: RoomSnapshot }
  | { type: 'started'; revision: number; projection: SeatProjection; events: GameEvent[] }
  | { type: 'snapshot'; projection: SeatProjection }
  | { type: 'update'; clientCommandId: string | null; revision: number; projection: SeatProjection; events: GameEvent[] }
  | { type: 'duplicate'; clientCommandId: string; revision: number; projection: SeatProjection; events: GameEvent[] }
  | { type: 'rejected'; clientCommandId: string; reason: string; revision: number | null; projection: SeatProjection | null }
  | { type: 'error'; reason: string };

const STORAGE_PREFIX = 'tysiac:seat-token:';

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({})) as T & { error?: string; reason?: string };
  if (!response.ok) throw new Error(body.error ?? body.reason ?? `HTTP_${response.status}`);
  return body;
}

export function normalizedRoomCode(value: string): string | null {
  const room = value.trim().toUpperCase();
  return /^[0-9A-HJKMNP-TV-Z]{12}$/.test(room) ? room : null;
}

export function storedSeatToken(room: string): string | null {
  try { return localStorage.getItem(`${STORAGE_PREFIX}${room}`); } catch { return null; }
}

export function rememberSeatToken(room: string, token: string): void {
  try { localStorage.setItem(`${STORAGE_PREFIX}${room}`, token); } catch {}
}

export function forgetSeatToken(room: string): void {
  try { localStorage.removeItem(`${STORAGE_PREFIX}${room}`); } catch {}
}

export async function createRemoteRoom(mode: RoomMode): Promise<RoomIdentity> {
  const result = await jsonRequest<{ room: string; seat: Seat; token: string; state: RoomSnapshot }>('/api/rooms', {
    method: 'POST',
    body: JSON.stringify({ mode }),
  });
  rememberSeatToken(result.room, result.token);
  return result;
}

export async function getPublicRoom(room: string): Promise<RoomSnapshot> {
  const result = await jsonRequest<{ room: string; state: RoomSnapshot }>(`/api/rooms/${encodeURIComponent(room)}`);
  return result.state;
}

export async function joinRemoteRoom(room: string): Promise<RoomIdentity> {
  const result = await jsonRequest<RoomIdentity>(`/api/rooms/${encodeURIComponent(room)}/join`, { method: 'POST' });
  rememberSeatToken(room, result.token);
  return result;
}

export async function getRoomSession(room: string, token: string): Promise<RoomSession> {
  const result = await jsonRequest<{ room: string; ok: true; seat: Seat; roomState?: RoomSnapshot; room?: string; projection: SeatProjection | null; state?: RoomSnapshot }>(
    `/api/match/${encodeURIComponent(room)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  ) as unknown as { room: string; ok: true; seat: Seat; state?: RoomSnapshot; projection: SeatProjection | null } & { room?: string };

  // Worker spreads SessionResponse after { room }, and SessionResponse itself names
  // its public snapshot `room`. JSON therefore contains the snapshot at `room`.
  const raw = result as unknown as { room: RoomSnapshot; seat: Seat; projection: SeatProjection | null };
  return { room, seat: raw.seat, state: raw.room, projection: raw.projection };
}

export function openRoomSocket(room: string, token: string): WebSocket {
  const scheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${scheme}//${window.location.host}/api/match/${encodeURIComponent(room)}/ws`;
  return new WebSocket(url, ['tysiac.v1', `seat.${token}`]);
}

export function commandEnvelope(projection: SeatProjection, command: Command): CommandEnvelope {
  return {
    type: 'command',
    clientCommandId: `c:${crypto.randomUUID()}`,
    expectedRevision: projection.observation.revision,
    command,
  };
}
