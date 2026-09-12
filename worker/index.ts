import type { ClientCommandEnvelope } from './match-room.js';
export { MatchRoom } from './match-room.js';

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

function matchRouteFromPath(pathname: string): RoomRoute | null {
  const match = /^\/api\/match\/([^/]+?)(\/ws)?$/.exec(pathname);
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/match') {
      return json({ ok: true, service: 'match-room', auth: 'foundation-seat-context' });
    }

    const route = matchRouteFromPath(url.pathname);
    if (route) return handleMatch(request, env, url, route);

    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
