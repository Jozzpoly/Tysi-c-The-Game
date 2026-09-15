import type { ClientCommandEnvelope, RoomMode } from './match-room.js';
export { MatchRoom } from './match-room.js';

const ROOM_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ROOM_CODE_LENGTH = 12;
const ROOM_CREATE_ATTEMPTS = 4;

interface MatchRoute {
  room: string;
  websocket: boolean;
}

interface RoomRoute {
  room: string;
  join: boolean;
}

function normalizeRoom(raw: string): string | null {
  let room: string;
  try { room = decodeURIComponent(raw).toUpperCase(); }
  catch { return null; }
  return new RegExp(`^[${ROOM_ALPHABET}]{${ROOM_CODE_LENGTH}}$`).test(room) ? room : null;
}

function generateRoomCode(): string {
  const bytes = new Uint8Array(ROOM_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => ROOM_ALPHABET[byte & 31]).join('');
}

function matchRouteFromPath(pathname: string): MatchRoute | null {
  const match = /^\/api\/match\/([^/]+?)(\/ws)?$/.exec(pathname);
  if (!match) return null;
  const room = normalizeRoom(match[1]);
  return room ? { room, websocket: Boolean(match[2]) } : null;
}

function roomRouteFromPath(pathname: string): RoomRoute | null {
  const match = /^\/api\/rooms\/([^/]+?)(\/join)?$/.exec(pathname);
  if (!match) return null;
  const room = normalizeRoom(match[1]);
  return room ? { room, join: Boolean(match[2]) } : null;
}

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get('Authorization');
  if (!authorization) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  return match?.[1] ?? null;
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

function roomStatus(reason: string): number {
  if (reason === 'ROOM_NOT_FOUND') return 404;
  if (reason === 'ROOM_FULL' || reason === 'ROOM_ALREADY_EXISTS') return 409;
  if (reason === 'INVALID_ROOM_MODE') return 400;
  return 422;
}

function commandStatus(reason: string): number {
  if (reason === 'ROOM_NOT_FOUND') return 404;
  if (reason === 'INVALID_CREDENTIAL') return 401;
  if (reason === 'SEAT_COMMAND_MISMATCH' || reason === 'SEAT_NOT_HUMAN') return 403;
  if (reason === 'REVISION_MISMATCH' || reason === 'CLIENT_COMMAND_ID_REUSED' || reason === 'ROOM_NOT_STARTED') return 409;
  if (reason === 'INVALID_CLIENT_COMMAND_ID' || reason === 'INVALID_COMMAND_ENVELOPE') return 400;
  return 422;
}

async function createRoom(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } });

  let mode: RoomMode;
  try {
    const body = await request.json() as { mode?: RoomMode };
    mode = body.mode as RoomMode;
  } catch {
    return json({ error: 'INVALID_JSON' }, 400);
  }

  if (mode !== 'solo' && mode !== 'duo' && mode !== 'trio') return json({ error: 'INVALID_ROOM_MODE' }, 400);

  for (let attempt = 0; attempt < ROOM_CREATE_ATTEMPTS; attempt += 1) {
    const room = generateRoomCode();
    const result = await env.MATCH_ROOM.getByName(room).createRoom(mode);
    if (result.ok) return json({ room, seat: result.seat, token: result.token, state: result.room }, 201);
    if (result.reason !== 'ROOM_ALREADY_EXISTS') return json({ room, ...result }, roomStatus(result.reason));
  }

  return json({ error: 'ROOM_CODE_COLLISION_RETRY_EXHAUSTED' }, 503);
}

async function handleRoom(request: Request, env: Env, route: RoomRoute): Promise<Response> {
  const stub = env.MATCH_ROOM.getByName(route.room);

  if (route.join) {
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } });
    const result = await stub.joinRoom();
    if (result.ok) return json({ room: route.room, seat: result.seat, token: result.token, state: result.room }, 201);
    return json({ room: route.room, ok: false, reason: result.reason, state: result.room ?? null }, roomStatus(result.reason));
  }

  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: { allow: 'GET' } });
  const room = await stub.getPublicRoom();
  if (!room) return json({ error: 'ROOM_NOT_FOUND' }, 404);
  return json({ room: route.room, state: room });
}

async function handleMatch(request: Request, env: Env, route: MatchRoute): Promise<Response> {
  const stub = env.MATCH_ROOM.getByName(route.room);

  if (route.websocket) {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return json({ error: 'WEBSOCKET_UPGRADE_REQUIRED' }, 426);
    return stub.fetch(request);
  }

  const token = bearerToken(request);
  if (!token) return json({ error: 'MISSING_CREDENTIAL' }, 401);

  if (request.method === 'GET') {
    const session = await stub.getSession(token);
    if (session.ok) {
      return json({ room: route.room, ok: true, seat: session.seat, state: session.room, projection: session.projection });
    }
    return json({ room: route.room, ok: false, reason: session.reason, state: session.room ?? null }, commandStatus(session.reason));
  }

  if (request.method === 'POST') {
    let envelope: ClientCommandEnvelope;
    try { envelope = (await request.json()) as ClientCommandEnvelope; }
    catch { return json({ error: 'INVALID_JSON' }, 400); }
    const result = await stub.submitCommand(token, envelope);
    return json({ room: route.room, ...result }, result.ok ? 200 : commandStatus(result.reason));
  }

  return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, POST', 'cache-control': 'no-store' } });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/rooms') return createRoom(request, env);
    const roomRoute = roomRouteFromPath(url.pathname);
    if (roomRoute) return handleRoom(request, env, roomRoute);

    if (url.pathname === '/api/match') {
      return json({
        ok: true,
        service: 'match-room',
        auth: 'seat-capability-v1',
        buildSha: env.TYSIAC_BUILD_SHA,
        deployClass: env.TYSIAC_DEPLOY_CLASS,
      });
    }
    const matchRoute = matchRouteFromPath(url.pathname);
    if (matchRoute) return handleMatch(request, env, matchRoute);

    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
