import { DurableObject } from 'cloudflare:workers';
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
  type SeatProjection,
} from '../src/core/index.js';

const ROOM_KEY = 'room';
const MAX_RECEIPTS = 256;
const MAX_BOT_TRANSITIONS = 64;
const WS_PROTOCOL = 'tysiac.v1';
const TOKEN_PROTOCOL_PREFIX = 'seat.';

export type RoomMode = 'solo' | 'duo' | 'trio';
export type PublicSeatRole = 'human' | 'open' | 'bot';

interface OpenSeat {
  role: 'open';
}

interface BotSeat {
  role: 'bot';
}

interface HumanSeat {
  role: 'human';
  tokenHash: string;
}

type StoredSeat = OpenSeat | BotSeat | HumanSeat;
type StoredSeats = [StoredSeat, StoredSeat, StoredSeat];

export interface RoomSnapshot {
  mode: RoomMode;
  status: 'lobby' | 'playing' | 'complete';
  seats: [PublicSeatRole, PublicSeatRole, PublicSeatRole];
  revision: number | null;
}

export interface CreateRoomAccepted {
  ok: true;
  seat: 0;
  token: string;
  room: RoomSnapshot;
}

export interface JoinRoomAccepted {
  ok: true;
  seat: Seat;
  token: string;
  room: RoomSnapshot;
}

export interface RoomRejected {
  ok: false;
  reason: string;
  room?: RoomSnapshot;
}

export type CreateRoomResponse = CreateRoomAccepted | RoomRejected;
export type JoinRoomResponse = JoinRoomAccepted | RoomRejected;

export interface SessionAccepted {
  ok: true;
  seat: Seat;
  room: RoomSnapshot;
  projection: SeatProjection | null;
}

export type SessionResponse = SessionAccepted | RoomRejected;

export interface ClientCommandEnvelope {
  type: 'command';
  clientCommandId: string;
  expectedRevision: number;
  command: Command;
}

interface StoredReceipt {
  clientCommandId: string;
  seat: Seat;
  commandFingerprint: string;
  acceptedRevision: number;
}

interface StoredRoom {
  mode: RoomMode;
  seats: StoredSeats;
  state: MatchState | null;
  receipts: StoredReceipt[];
}

export interface CommandAccepted {
  ok: true;
  duplicate: boolean;
  revision: number;
  acceptedRevision: number;
  projection: SeatProjection;
  events: GameEvent[];
}

export interface CommandRejected {
  ok: false;
  reason: string;
  revision: number | null;
  projection: SeatProjection | null;
}

export type CommandResponse = CommandAccepted | CommandRejected;

interface Transition {
  state: MatchState;
  events: GameEvent[];
  clientCommandId: string | null;
}

interface TransactionAccepted {
  response: CommandAccepted;
  transitions: Transition[];
}

interface TransactionRejected {
  response: CommandRejected;
  transitions?: undefined;
}

type TransactionOutcome = TransactionAccepted | TransactionRejected;

interface SocketAttachment {
  seat: Seat;
}

function isSeat(value: unknown): value is Seat {
  return value === 0 || value === 1 || value === 2;
}

function isRoomMode(value: unknown): value is RoomMode {
  return value === 'solo' || value === 'duo' || value === 'trio';
}

function seatsForMode(mode: RoomMode, hostTokenHash: string): StoredSeats {
  if (mode === 'solo') return [{ role: 'human', tokenHash: hostTokenHash }, { role: 'bot' }, { role: 'bot' }];
  if (mode === 'duo') return [{ role: 'human', tokenHash: hostTokenHash }, { role: 'open' }, { role: 'bot' }];
  return [{ role: 'human', tokenHash: hostTokenHash }, { role: 'open' }, { role: 'open' }];
}

function publicRoom(room: StoredRoom): RoomSnapshot {
  return {
    mode: room.mode,
    status: room.state === null ? 'lobby' : room.state.status === 'complete' ? 'complete' : 'playing',
    seats: room.seats.map((seat) => seat.role) as RoomSnapshot['seats'],
    revision: room.state?.revision ?? null,
  };
}

function randomSeed(): number {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0];
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function randomSeatToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `ts1_${bytesToBase64Url(bytes)}`;
}

async function hashSeatToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return bytesToBase64Url(new Uint8Array(digest));
}

function seatForHash(room: StoredRoom, tokenHash: string): Seat | null {
  for (const seat of [0, 1, 2] as const) {
    const slot = room.seats[seat];
    if (slot.role === 'human' && slot.tokenHash === tokenHash) return seat;
  }
  return null;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, stableValue(item)]));
  }
  return value;
}

function commandFingerprint(command: Command): string {
  return JSON.stringify(stableValue(command));
}

function validCommandId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9:_-]{1,128}$/.test(value);
}

function settleBotTurns(initial: MatchState, seats: StoredSeats): Transition[] {
  let state = initial;
  const transitions: Transition[] = [];

  for (let step = 0; step < MAX_BOT_TRANSITIONS; step += 1) {
    if (state.status === 'complete' || state.hand.phase === 'complete') return transitions;
    const actor = actingSeat(state);
    if (actor === null || seats[actor].role !== 'bot') return transitions;

    const applied = applyCommand(state, productBotCommand(state, actor));
    if (!applied.ok) throw new Error(`SERVER_BOT_REJECTED:${applied.reason ?? 'UNKNOWN'}`);
    assertCoreInvariants(applied.state);
    state = applied.state;
    transitions.push({ state, events: applied.events, clientCommandId: null });
  }

  throw new Error('SERVER_BOT_TRANSITION_LIMIT');
}

function maybeStartRoom(room: StoredRoom, seed: number): { room: StoredRoom; startEvents: GameEvent[] } {
  if (room.state !== null || room.seats.some((seat) => seat.role === 'open')) return { room, startEvents: [] };

  let state = createMatch(PLAYOK_3P_800_CANDIDATE, seed, 0);
  assertCoreInvariants(state);
  const botTransitions = settleBotTurns(state, room.seats);
  if (botTransitions.length > 0) state = botTransitions.at(-1)!.state;

  return {
    room: { ...room, state },
    startEvents: botTransitions.flatMap((transition) => transition.events),
  };
}

function parseSocketCredential(request: Request): string | null {
  const protocols = (request.headers.get('Sec-WebSocket-Protocol') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (!protocols.includes(WS_PROTOCOL)) return null;
  const credential = protocols.find((value) => value.startsWith(TOKEN_PROTOCOL_PREFIX));
  return credential?.slice(TOKEN_PROTOCOL_PREFIX.length) || null;
}

function originAllowed(request: Request): boolean {
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

/**
 * Authoritative lifecycle + match room.
 *
 * Shareable room identity and private seat identity are deliberately separate:
 * room codes can be shared, while reconnect tokens are opaque capabilities.
 * Only token hashes are persisted. Game clients receive SeatProjection and
 * audience-filtered GameEvents; MatchState never leaves the authority boundary.
 */
export class MatchRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  private async readRoom(): Promise<StoredRoom | null> {
    return (await this.ctx.storage.get<StoredRoom>(ROOM_KEY)) ?? null;
  }

  async createRoom(mode: RoomMode): Promise<CreateRoomResponse> {
    if (!isRoomMode(mode)) return { ok: false, reason: 'INVALID_ROOM_MODE' };

    const token = randomSeatToken();
    const tokenHash = await hashSeatToken(token);
    const seed = randomSeed();
    const outcome = await this.ctx.storage.transaction(async (txn): Promise<CreateRoomResponse & { startEvents?: GameEvent[] }> => {
      const existing = await txn.get<StoredRoom>(ROOM_KEY);
      if (existing) return { ok: false, reason: 'ROOM_ALREADY_EXISTS', room: publicRoom(existing) };

      let room: StoredRoom = {
        mode,
        seats: seatsForMode(mode, tokenHash),
        state: null,
        receipts: [],
      };
      const started = maybeStartRoom(room, seed);
      room = started.room;
      await txn.put(ROOM_KEY, room);
      return { ok: true, seat: 0, token, room: publicRoom(room), startEvents: started.startEvents };
    });

    if (outcome.ok && outcome.room.status !== 'lobby') {
      const room = await this.readRoom();
      if (room?.state) this.broadcastStarted(room.state, outcome.startEvents ?? []);
    }

    if (!outcome.ok) return outcome;
    return { ok: true, seat: 0, token, room: outcome.room };
  }

  async getPublicRoom(): Promise<RoomSnapshot | null> {
    const room = await this.readRoom();
    return room ? publicRoom(room) : null;
  }

  async joinRoom(): Promise<JoinRoomResponse> {
    const token = randomSeatToken();
    const tokenHash = await hashSeatToken(token);
    const seed = randomSeed();

    const outcome = await this.ctx.storage.transaction(async (txn): Promise<JoinRoomResponse & { startEvents?: GameEvent[] }> => {
      const current = await txn.get<StoredRoom>(ROOM_KEY);
      if (!current) return { ok: false, reason: 'ROOM_NOT_FOUND' };
      const seat = ([0, 1, 2] as const).find((candidate) => current.seats[candidate].role === 'open');
      if (seat === undefined) return { ok: false, reason: 'ROOM_FULL', room: publicRoom(current) };

      const seats = current.seats.map((slot) => ({ ...slot })) as StoredSeats;
      seats[seat] = { role: 'human', tokenHash };
      let room: StoredRoom = { ...current, seats };
      const started = maybeStartRoom(room, seed);
      room = started.room;
      await txn.put(ROOM_KEY, room);
      return { ok: true, seat, token, room: publicRoom(room), startEvents: started.startEvents };
    });

    if (outcome.ok && outcome.room.status !== 'lobby') {
      const room = await this.readRoom();
      if (room?.state) this.broadcastStarted(room.state, outcome.startEvents ?? []);
    }

    if (!outcome.ok) return outcome;
    return { ok: true, seat: outcome.seat, token, room: outcome.room };
  }

  async getSession(token: string): Promise<SessionResponse> {
    if (typeof token !== 'string' || token.length < 20) return { ok: false, reason: 'INVALID_CREDENTIAL' };
    const tokenHash = await hashSeatToken(token);
    const room = await this.readRoom();
    if (!room) return { ok: false, reason: 'ROOM_NOT_FOUND' };
    const seat = seatForHash(room, tokenHash);
    if (seat === null) return { ok: false, reason: 'INVALID_CREDENTIAL', room: publicRoom(room) };
    return {
      ok: true,
      seat,
      room: publicRoom(room),
      projection: room.state ? projectSeat(room.state, seat) : null,
    };
  }

  private reject(room: StoredRoom, seat: Seat, reason: string): CommandRejected {
    return {
      ok: false,
      reason,
      revision: room.state?.revision ?? null,
      projection: room.state ? projectSeat(room.state, seat) : null,
    };
  }

  private async submitForSeat(seat: Seat, envelope: ClientCommandEnvelope): Promise<CommandResponse> {
    const outcome = await this.ctx.storage.transaction(async (txn): Promise<TransactionOutcome> => {
      const room = await txn.get<StoredRoom>(ROOM_KEY);
      if (!room) return { response: { ok: false, reason: 'ROOM_NOT_FOUND', revision: null, projection: null } };
      if (room.state === null) return { response: this.reject(room, seat, 'ROOM_NOT_STARTED') };
      if (room.seats[seat].role !== 'human') return { response: this.reject(room, seat, 'SEAT_NOT_HUMAN') };

      if (!validCommandId(envelope?.clientCommandId)) {
        return { response: this.reject(room, seat, 'INVALID_CLIENT_COMMAND_ID') };
      }
      if (!Number.isInteger(envelope?.expectedRevision) || envelope.expectedRevision < 0 || !envelope.command) {
        return { response: this.reject(room, seat, 'INVALID_COMMAND_ENVELOPE') };
      }

      const fingerprint = commandFingerprint(envelope.command);
      const previous = room.receipts.find((receipt) => receipt.clientCommandId === envelope.clientCommandId);
      if (previous) {
        if (previous.seat !== seat || previous.commandFingerprint !== fingerprint) {
          return { response: this.reject(room, seat, 'CLIENT_COMMAND_ID_REUSED') };
        }
        return {
          response: {
            ok: true,
            duplicate: true,
            revision: room.state.revision,
            acceptedRevision: previous.acceptedRevision,
            projection: projectSeat(room.state, seat),
            events: [],
          },
          transitions: [],
        };
      }

      if (envelope.expectedRevision !== room.state.revision) {
        return { response: this.reject(room, seat, 'REVISION_MISMATCH') };
      }
      if (envelope.command.seat !== seat) {
        return { response: this.reject(room, seat, 'SEAT_COMMAND_MISMATCH') };
      }

      const applied = applyCommand(room.state, envelope.command);
      if (!applied.ok) return { response: this.reject(room, seat, applied.reason ?? 'COMMAND_REJECTED') };
      assertCoreInvariants(applied.state);

      const humanTransition: Transition = {
        state: applied.state,
        events: applied.events,
        clientCommandId: envelope.clientCommandId,
      };
      const botTransitions = settleBotTurns(applied.state, room.seats);
      const transitions = [humanTransition, ...botTransitions];
      const finalState = transitions.at(-1)!.state;
      const receipt: StoredReceipt = {
        clientCommandId: envelope.clientCommandId,
        seat,
        commandFingerprint: fingerprint,
        acceptedRevision: applied.state.revision,
      };
      const receipts = [...room.receipts, receipt].slice(-MAX_RECEIPTS);
      const stored: StoredRoom = { ...room, state: finalState, receipts };
      await txn.put(ROOM_KEY, stored);

      return {
        response: {
          ok: true,
          duplicate: false,
          revision: finalState.revision,
          acceptedRevision: applied.state.revision,
          projection: projectSeat(finalState, seat),
          events: eventsForSeat(transitions.flatMap((transition) => transition.events), seat),
        },
        transitions,
      };
    });

    if (outcome.transitions !== undefined) {
      for (const transition of outcome.transitions) this.broadcastTransition(transition);
    }
    return outcome.response;
  }

  async submitCommand(token: string, envelope: ClientCommandEnvelope): Promise<CommandResponse> {
    const session = await this.getSession(token);
    if (!session.ok) return { ok: false, reason: session.reason, revision: null, projection: null };
    return this.submitForSeat(session.seat, envelope);
  }

  private broadcastTransition(transition: Transition): void {
    for (const socket of this.ctx.getWebSockets()) {
      try {
        const attachment = socket.deserializeAttachment() as SocketAttachment | null;
        if (!attachment || !isSeat(attachment.seat)) {
          socket.close(1008, 'missing seat context');
          continue;
        }
        socket.send(JSON.stringify({
          type: 'update',
          clientCommandId: transition.clientCommandId,
          revision: transition.state.revision,
          projection: projectSeat(transition.state, attachment.seat),
          events: eventsForSeat(transition.events, attachment.seat),
        }));
      } catch {
        try { socket.close(1011, 'broadcast failed'); } catch {}
      }
    }
  }

  private broadcastStarted(state: MatchState, events: readonly GameEvent[]): void {
    for (const socket of this.ctx.getWebSockets()) {
      try {
        const attachment = socket.deserializeAttachment() as SocketAttachment | null;
        if (!attachment || !isSeat(attachment.seat)) continue;
        socket.send(JSON.stringify({
          type: 'started',
          revision: state.revision,
          projection: projectSeat(state, attachment.seat),
          events: eventsForSeat(events, attachment.seat),
        }));
      } catch {
        try { socket.close(1011, 'start broadcast failed'); } catch {}
      }
    }
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return Response.json({ error: 'WEBSOCKET_UPGRADE_REQUIRED' }, { status: 426 });
    }
    if (!originAllowed(request)) return Response.json({ error: 'ORIGIN_REJECTED' }, { status: 403 });

    const token = parseSocketCredential(request);
    if (!token) return Response.json({ error: 'INVALID_WEBSOCKET_CREDENTIAL' }, { status: 401 });
    const session = await this.getSession(token);
    if (!session.ok) return Response.json({ error: session.reason }, { status: session.reason === 'ROOM_NOT_FOUND' ? 404 : 401 });

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.serializeAttachment({ seat: session.seat } satisfies SocketAttachment);
    this.ctx.acceptWebSocket(server);

    if (session.projection) {
      server.send(JSON.stringify({ type: 'snapshot', projection: session.projection }));
    } else {
      server.send(JSON.stringify({ type: 'lobby', seat: session.seat, room: session.room }));
    }

    return new Response(null, {
      status: 101,
      webSocket: client,
      headers: { 'Sec-WebSocket-Protocol': WS_PROTOCOL },
    });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    const attachment = ws.deserializeAttachment() as SocketAttachment | null;
    if (!attachment || !isSeat(attachment.seat)) {
      ws.send(JSON.stringify({ type: 'error', reason: 'MISSING_SEAT_CONTEXT' }));
      ws.close(1008, 'missing seat context');
      return;
    }
    if (typeof raw !== 'string') {
      ws.send(JSON.stringify({ type: 'error', reason: 'TEXT_MESSAGES_ONLY' }));
      return;
    }

    let envelope: ClientCommandEnvelope;
    try {
      envelope = JSON.parse(raw) as ClientCommandEnvelope;
    } catch {
      ws.send(JSON.stringify({ type: 'error', reason: 'INVALID_JSON' }));
      return;
    }
    if (envelope?.type !== 'command') {
      ws.send(JSON.stringify({ type: 'error', reason: 'UNKNOWN_MESSAGE' }));
      return;
    }

    const response = await this.submitForSeat(attachment.seat, envelope);
    if (!response.ok) {
      ws.send(JSON.stringify({ type: 'rejected', clientCommandId: envelope.clientCommandId, ...response }));
      return;
    }

    if (response.duplicate) {
      ws.send(JSON.stringify({ type: 'duplicate', clientCommandId: envelope.clientCommandId, ...response }));
    }
  }
}
