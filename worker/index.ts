import { DurableObject } from 'cloudflare:workers';
import type { ClientCommandEnvelope } from './match-room.js';
export { MatchRoom } from './match-room.js';

export interface RevisionResult {
  ok: boolean;
  revision: number;
  reason?: 'REVISION_MISMATCH';
}

interface BumpMessage {
  type: 'bump';
  expectedRevision?: number;
}

interface SnapshotMessage {
  type: 'snapshot';
  revision: number;
}

interface RevisionMessage {
  type: 'revision';
  revision: number;
}

interface ErrorMessage {
  type: 'error';
  reason: string;
  revision?: number;
}

/**
 * Temporary infrastructure canary kept only until the real MatchRoom router is
 * proven end-to-end. It deliberately contains no game logic.
 */
export class MatchCanary extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  async getRevision(): Promise<number> {
    return (await this.ctx.storage.get<number>('revision')) ?? 0;
  }

  async bump(expectedRevision?: number): Promise<RevisionResult> {
    return this.ctx.storage.transaction(async (txn) => {
      const current = (await txn.get<number>('revision')) ?? 0;
      if (expectedRevision !== undefined && expectedRevision !== current) {
        return { ok: false, revision: current, reason: 'REVISION_MISMATCH' };
      }

      const revision = current + 1;
      await txn.put('revision', revision);
      return { ok: true, revision };
    });
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return Response.json({ error: 'WEBSOCKET_UPGRADE_REQUIRED' }, { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);

    const snapshot: SnapshotMessage = { type: 'snapshot', revision: await this.getRevision() };
    server.send(JSON.stringify(snapshot));

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    if (typeof raw !== 'string') {
      ws.send(JSON.stringify({ type: 'error', reason: 'TEXT_MESSAGES_ONLY' } satisfies ErrorMessage));
      return;
    }

    let message: BumpMessage;
    try {
      message = JSON.parse(raw) as BumpMessage;
    } catch {
      ws.send(JSON.stringify({ type: 'error', reason: 'INVALID_JSON' } satisfies ErrorMessage));
      return;
    }

    if (message.type !== 'bump') {
      ws.send(JSON.stringify({ type: 'error', reason: 'UNKNOWN_MESSAGE' } satisfies ErrorMessage));
      return;
    }

    const result = await this.bump(message.expectedRevision);
    if (!result.ok) {
      ws.send(
        JSON.stringify({
          type: 'error',
          reason: result.reason ?? 'REVISION_REJECTED',
          revision: result.revision,
        } satisfies ErrorMessage),
      );
      return;
    }

    const update = JSON.stringify({ type: 'revision', revision: result.revision } satisfies RevisionMessage);
    for (const socket of this.ctx.getWebSockets()) socket.send(update);
  }
}

interface RoomRoute {
  room: string;
  websocket: boolean;
}

function decodeRoom(raw: string): string | null {
  let room: string;
  try {
    room = decodeURIComponent(raw);
  } catch {
    return null;
  }
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(room) ? room : null;
}

function routeFromPath(pathname: string, prefix: 'match' | 'canary'): RoomRoute | null {
  const expression = new RegExp(`^/api/${prefix}/([^/]+?)(/ws)?$`);
  const match = expression.exec(pathname);
  if (!match) return null;
  const room = decodeRoom(match[1]);
  return room ? { room, websocket: Boolean(match[2]) } : null;
}

function seatFromUrl(url: URL): 0 | 1 | 2 | null {
  const raw = url.searchParams.get('seat');
  if (raw === '0') return 0;
  if (raw === '1') return 1;
  if (raw === '2') return 2;
  return null;
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

function commandStatus(reason: string): number {
  if (reason === 'SEAT_COMMAND_MISMATCH') return 403;
  if (reason === 'REVISION_MISMATCH' || reason === 'CLIENT_COMMAND_ID_REUSED') return 409;
  if (reason === 'INVALID_CLIENT_COMMAND_ID' || reason === 'INVALID_COMMAND_ENVELOPE') return 400;
  return 422;
}

async function handleMatch(request: Request, env: Env, url: URL, route: RoomRoute): Promise<Response> {
  const seat = seatFromUrl(url);
  if (seat === null) return json({ error: 'INVALID_SEAT' }, 400);

  const stub = env.MATCH_ROOM.getByName(route.room);
  if (route.websocket) {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return json({ error: 'WEBSOCKET_UPGRADE_REQUIRED' }, 426);
    }
    return stub.fetch(request);
  }

  if (request.method === 'GET') {
    return json({ room: route.room, projection: await stub.getProjection(seat) });
  }

  if (request.method === 'POST') {
    let envelope: ClientCommandEnvelope;
    try {
      envelope = (await request.json()) as ClientCommandEnvelope;
    } catch {
      return json({ error: 'INVALID_JSON' }, 400);
    }

    const result = await stub.submitCommand(seat, envelope);
    return json({ room: route.room, ...result }, result.ok ? 200 : commandStatus(result.reason));
  }

  return new Response('Method not allowed', {
    status: 405,
    headers: { allow: 'GET, POST', 'cache-control': 'no-store' },
  });
}

async function handleCanary(request: Request, env: Env, route: RoomRoute): Promise<Response> {
  const stub = env.MATCH_CANARY.getByName(route.room);
  if (route.websocket) return stub.fetch(request);

  if (request.method === 'GET') {
    return json({ room: route.room, revision: await stub.getRevision() });
  }

  if (request.method === 'POST') {
    let expectedRevision: number | undefined;
    const text = await request.text();
    if (text.length > 0) {
      try {
        const body = JSON.parse(text) as { expectedRevision?: number };
        expectedRevision = body.expectedRevision;
      } catch {
        return json({ error: 'INVALID_JSON' }, 400);
      }
    }

    const result = await stub.bump(expectedRevision);
    return json({ room: route.room, ...result }, result.ok ? 200 : 409);
  }

  return new Response('Method not allowed', { status: 405 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/match') {
      return json({ ok: true, service: 'match-room', auth: 'foundation-seat-context' });
    }

    const matchRoute = routeFromPath(url.pathname, 'match');
    if (matchRoute) return handleMatch(request, env, url, matchRoute);

    // Legacy canary stays reachable only until MatchRoom routing has executable
    // end-to-end evidence; it will then be deleted rather than maintained.
    if (url.pathname === '/api/canary') {
      return json({ ok: true, service: 'match-canary', deprecated: true });
    }
    const canaryRoute = routeFromPath(url.pathname, 'canary');
    if (canaryRoute) return handleCanary(request, env, canaryRoute);

    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
