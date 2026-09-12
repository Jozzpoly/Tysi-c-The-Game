import { DurableObject } from 'cloudflare:workers';
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

function roomFromPath(pathname: string): { room: string; websocket: boolean } | null {
  const match = /^\/api\/canary\/([^/]+?)(\/ws)?$/.exec(pathname);
  if (!match) return null;
  return { room: decodeURIComponent(match[1]), websocket: Boolean(match[2]) };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/canary') {
      return Response.json({ ok: true, service: 'match-canary' });
    }

    const route = roomFromPath(url.pathname);
    if (!route || route.room.length === 0) return new Response('Not found', { status: 404 });

    const stub = env.MATCH_CANARY.getByName(route.room);
    if (route.websocket) return stub.fetch(request);

    if (request.method === 'GET') {
      return Response.json({ room: route.room, revision: await stub.getRevision() });
    }

    if (request.method === 'POST') {
      let expectedRevision: number | undefined;
      const text = await request.text();
      if (text.length > 0) {
        try {
          const body = JSON.parse(text) as { expectedRevision?: number };
          expectedRevision = body.expectedRevision;
        } catch {
          return Response.json({ error: 'INVALID_JSON' }, { status: 400 });
        }
      }

      const result = await stub.bump(expectedRevision);
      return Response.json({ room: route.room, ...result }, { status: result.ok ? 200 : 409 });
    }

    return new Response('Method not allowed', { status: 405 });
  },
} satisfies ExportedHandler<Env>;
