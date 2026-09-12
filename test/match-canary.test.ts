import { evictDurableObject } from 'cloudflare:test';
import { env, exports as workerExports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

function nextMessage(socket: WebSocket): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('WebSocket message timeout')), 2_000);
    socket.addEventListener(
      'message',
      (event) => {
        clearTimeout(timeout);
        try {
          resolve(JSON.parse(event.data as string));
        } catch {
          resolve(event.data);
        }
      },
      { once: true },
    );
  });
}

describe('MatchCanary Durable Object', () => {
  it('persists revision across Durable Object eviction', async () => {
    const stub = env.MATCH_CANARY.getByName('persist-room');

    expect(await stub.getRevision()).toBe(0);
    expect(await stub.bump(0)).toEqual({ ok: true, revision: 1 });

    await evictDurableObject(stub);
    expect(await stub.getRevision()).toBe(1);
  });

  it('isolates independent room names', async () => {
    const alpha = env.MATCH_CANARY.getByName('alpha-room');
    const beta = env.MATCH_CANARY.getByName('beta-room');

    expect(await alpha.bump(0)).toEqual({ ok: true, revision: 1 });
    expect(await alpha.getRevision()).toBe(1);
    expect(await beta.getRevision()).toBe(0);
  });

  it('accepts only one concurrent command for the same expected revision', async () => {
    const stub = env.MATCH_CANARY.getByName('revision-gate-room');
    const results = await Promise.all([stub.bump(0), stub.bump(0)]);

    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok)).toHaveLength(1);
    expect(await stub.getRevision()).toBe(1);
    expect(results.find((result) => !result.ok)).toEqual({
      ok: false,
      revision: 1,
      reason: 'REVISION_MISMATCH',
    });
  });

  it('routes HTTP probes to the named room', async () => {
    const bump = await workerExports.default.fetch('https://example.com/api/canary/http-room', {
      method: 'POST',
      body: JSON.stringify({ expectedRevision: 0 }),
    });
    expect(bump.status).toBe(200);
    expect(await bump.json()).toEqual({ room: 'http-room', ok: true, revision: 1 });

    const stale = await workerExports.default.fetch('https://example.com/api/canary/http-room', {
      method: 'POST',
      body: JSON.stringify({ expectedRevision: 0 }),
    });
    expect(stale.status).toBe(409);

    const snapshot = await workerExports.default.fetch('https://example.com/api/canary/http-room');
    expect(await snapshot.json()).toEqual({ room: 'http-room', revision: 1 });
  });

  it('keeps a hibernatable WebSocket usable across eviction', async () => {
    const stub = env.MATCH_CANARY.getByName('websocket-room');
    const response = await stub.fetch('https://example.com/ws', {
      headers: { Upgrade: 'websocket' },
    });
    const socket = response.webSocket;
    if (!socket) throw new Error('Expected WebSocket response');
    socket.accept();

    expect(await nextMessage(socket)).toEqual({ type: 'snapshot', revision: 0 });

    const firstUpdate = nextMessage(socket);
    socket.send(JSON.stringify({ type: 'bump', expectedRevision: 0 }));
    expect(await firstUpdate).toEqual({ type: 'revision', revision: 1 });

    await evictDurableObject(stub);

    const afterEviction = nextMessage(socket);
    socket.send(JSON.stringify({ type: 'bump', expectedRevision: 1 }));
    expect(await afterEviction).toEqual({ type: 'revision', revision: 2 });
    expect(await stub.getRevision()).toBe(2);

    socket.close(1000, 'test complete');
  });
});
