import { DurableObject } from 'cloudflare:workers';
import {
  PLAYOK_3P_800_CANDIDATE,
  applyCommand,
  assertCoreInvariants,
  createMatch,
  eventsForSeat,
  projectSeat,
  type Command,
  type GameEvent,
  type MatchState,
  type Seat,
  type SeatProjection,
} from '../src/core/index.js';

const ROOM_KEY = 'room';
const MAX_RECEIPTS = 128;

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
  state: MatchState;
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
  revision: number;
  projection: SeatProjection;
}

export type CommandResponse = CommandAccepted | CommandRejected;

interface TransactionAccepted {
  response: CommandAccepted;
  broadcastState?: MatchState;
  broadcastEvents?: GameEvent[];
}

interface TransactionRejected {
  response: CommandRejected;
  broadcastState?: undefined;
  broadcastEvents?: undefined;
}

type TransactionOutcome = TransactionAccepted | TransactionRejected;

interface SocketAttachment {
  seat: Seat;
}

function isSeat(value: unknown): value is Seat {
  return value === 0 || value === 1 || value === 2;
}

function commandSeat(command: Command): Seat | null {
  return command.type === 'next-hand' ? null : command.seat;
}

function commandFingerprint(command: Command): string {
  return JSON.stringify(command);
}

function validCommandId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9:_-]{1,128}$/.test(value);
}

function randomSeed(): number {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0];
}

/**
 * Real match authority built around the same pure core used by local play.
 *
 * The room owns canonical MatchState and persistence. Clients only receive
 * SeatProjection plus audience-filtered GameEvents. Seat identity is currently
 * a foundation transport context, NOT production authentication; opaque seat
 * tokens/join flow must replace the query-param canary before remote shipping.
 */
export class MatchRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));

    this.ctx.blockConcurrencyWhile(async () => {
      const existing = await this.ctx.storage.get<StoredRoom>(ROOM_KEY);
      if (existing) return;
      const state = createMatch(PLAYOK_3P_800_CANDIDATE, randomSeed(), 0);
      assertCoreInvariants(state);
      await this.ctx.storage.put<StoredRoom>(ROOM_KEY, { state, receipts: [] });
    });
  }

  private async readRoom(): Promise<StoredRoom> {
    const room = await this.ctx.storage.get<StoredRoom>(ROOM_KEY);
    if (!room) throw new Error('MATCH_ROOM_NOT_INITIALIZED');
    return room;
  }

  async getProjection(seat: Seat): Promise<SeatProjection> {
    if (!isSeat(seat)) throw new Error('INVALID_SEAT');
    return projectSeat((await this.readRoom()).state, seat);
  }

  private reject(room: StoredRoom, seat: Seat, reason: string): CommandRejected {
    return {
      ok: false,
      reason,
      revision: room.state.revision,
      projection: projectSeat(room.state, seat),
    };
  }

  async submitCommand(seat: Seat, envelope: ClientCommandEnvelope): Promise<CommandResponse> {
    if (!isSeat(seat)) throw new Error('INVALID_SEAT');

    const outcome = await this.ctx.storage.transaction(async (txn): Promise<TransactionOutcome> => {
      const room = await txn.get<StoredRoom>(ROOM_KEY);
      if (!room) throw new Error('MATCH_ROOM_NOT_INITIALIZED');

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
        };
      }

      if (envelope.expectedRevision !== room.state.revision) {
        return { response: this.reject(room, seat, 'REVISION_MISMATCH') };
      }

      const actor = commandSeat(envelope.command);
      if (actor !== null && actor !== seat) {
        return { response: this.reject(room, seat, 'SEAT_COMMAND_MISMATCH') };
      }

      // Explicit Foundation policy: a seat-bound participant may advance an
      // already-complete hand. This is intentionally provisional; a later
      // ready/auto-advance policy can replace it without changing game rules.
      const applied = applyCommand(room.state, envelope.command);
      if (!applied.ok) {
        return { response: this.reject(room, seat, applied.reason ?? 'COMMAND_REJECTED') };
      }

      assertCoreInvariants(applied.state);
      const receipt: StoredReceipt = {
        clientCommandId: envelope.clientCommandId,
        seat,
        commandFingerprint: fingerprint,
        acceptedRevision: applied.state.revision,
      };
      const receipts = [...room.receipts, receipt].slice(-MAX_RECEIPTS);
      await txn.put<StoredRoom>(ROOM_KEY, { state: applied.state, receipts });

      return {
        response: {
          ok: true,
          duplicate: false,
          revision: applied.state.revision,
          acceptedRevision: applied.state.revision,
          projection: projectSeat(applied.state, seat),
          events: eventsForSeat(applied.events, seat),
        },
        broadcastState: applied.state,
        broadcastEvents: applied.events,
      };
    });

    if (outcome.response.ok && !outcome.response.duplicate && outcome.broadcastState && outcome.broadcastEvents) {
      this.broadcastUpdate(
        envelope.clientCommandId,
        outcome.broadcastState,
        outcome.broadcastEvents,
      );
    }

    return outcome.response;
  }

  private broadcastUpdate(clientCommandId: string, state: MatchState, events: readonly GameEvent[]): void {
    for (const socket of this.ctx.getWebSockets()) {
      try {
        const attachment = socket.deserializeAttachment() as SocketAttachment | null;
        if (!attachment || !isSeat(attachment.seat)) {
          socket.close(1008, 'missing seat context');
          continue;
        }
        socket.send(JSON.stringify({
          type: 'update',
          clientCommandId,
          revision: state.revision,
          projection: projectSeat(state, attachment.seat),
          events: eventsForSeat(events, attachment.seat),
        }));
      } catch {
        try { socket.close(1011, 'broadcast failed'); } catch {}
      }
    }
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return Response.json({ error: 'WEBSOCKET_UPGRADE_REQUIRED' }, { status: 426 });
    }

    const seatValue = Number(new URL(request.url).searchParams.get('seat'));
    if (!isSeat(seatValue)) return Response.json({ error: 'INVALID_SEAT' }, { status: 400 });

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.serializeAttachment({ seat: seatValue } satisfies SocketAttachment);
    this.ctx.acceptWebSocket(server);

    server.send(JSON.stringify({
      type: 'snapshot',
      projection: await this.getProjection(seatValue),
    }));

    return new Response(null, { status: 101, webSocket: client });
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

    const response = await this.submitCommand(attachment.seat, envelope);
    if (!response.ok) {
      ws.send(JSON.stringify({
        type: 'rejected',
        clientCommandId: envelope.clientCommandId,
        ...response,
      }));
      return;
    }

    // Fresh accepted commands are delivered through the per-seat broadcast.
    // Duplicates intentionally do not replay feedback events/animations.
    if (response.duplicate) {
      ws.send(JSON.stringify({
        type: 'duplicate',
        clientCommandId: envelope.clientCommandId,
        ...response,
      }));
    }
  }
}
