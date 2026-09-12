import { exports as workerExports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import type { Command, SeatProjection } from '../src/core/index.js';
import type { ClientCommandEnvelope } from '../worker/match-room.js';

function nextMessage(socket: WebSocket): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('WebSocket message timeout')), 2_500);
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

function passCommand(projection: SeatProjection): Command {
  const pass = projection.legalCommands.find((command) => command.type === 'pass');
  if (!pass) throw new Error(`seat ${projection.observation.seat} has no pass command`);
  return pass;
}

function envelope(id: string, projection: SeatProjection, command: Command): ClientCommandEnvelope {
  return {
    type: 'command',
    clientCommandId: id,
    expectedRevision: projection.observation.revision,
    command,
  };
}

async function getProjection(room: string, seat: number): Promise<SeatProjection> {
  const response = await workerExports.default.fetch(`https://example.com/api/match/${room}?seat=${seat}`);
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  const body = await response.json() as { room: string; projection: SeatProjection };
  expect(body.room).toBe(room);
  return body.projection;
}

describe('MatchRoom Worker router', () => {
  it('exposes a narrow health endpoint and rejects malformed room/seat routes', async () => {
    const health = await workerExports.default.fetch('https://example.com/api/match');
    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({
      ok: true,
      service: 'match-room',
      auth: 'foundation-seat-context',
    });

    expect((await workerExports.default.fetch('https://example.com/api/match/good-room')).status).toBe(400);
    expect((await workerExports.default.fetch('https://example.com/api/match/good-room?seat=9')).status).toBe(400);
    expect((await workerExports.default.fetch('https://example.com/api/match/bad%20room?seat=0')).status).toBe(404);
    expect((await workerExports.default.fetch('https://example.com/api/match/good-room?seat=0', { method: 'DELETE' })).status).toBe(405);
  });

  it('returns only seat projections over HTTP and submits the same core commands', async () => {
    const room = 'router-http-room';
    const actorProjection = await getProjection(room, 2);
    expect(actorProjection.observation.auction.turn).toBe(2);
    expect(actorProjection.observation.seat).toBe(2);

    const seat0Before = await getProjection(room, 0);
    const seat2Cards = actorProjection.observation.ownHand;
    for (const hiddenCard of seat2Cards) {
      expect(JSON.stringify(seat0Before)).not.toContain(hiddenCard);
    }

    const command = passCommand(actorProjection);
    const submit = await workerExports.default.fetch(`https://example.com/api/match/${room}?seat=2`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(envelope('router:http:pass', actorProjection, command)),
    });
    expect(submit.status).toBe(200);
    const body = await submit.json() as any;
    expect(body.room).toBe(room);
    expect(body.ok).toBe(true);
    expect(body.duplicate).toBe(false);
    expect(body.revision).toBe(1);
    expect(body.projection.observation.seat).toBe(2);
    expect(body.events.map((event: { type: string }) => event.type)).toEqual(['player-passed']);

    const seat0After = await getProjection(room, 0);
    expect(seat0After.observation.revision).toBe(1);
    expect(seat0After.observation.auction.turn).toBe(0);
  });

  it('maps stale and invalid HTTP commands without exposing authority state', async () => {
    const room = 'router-errors-room';
    const actor = await getProjection(room, 2);
    const pass = passCommand(actor);

    const malformed = await workerExports.default.fetch(`https://example.com/api/match/${room}?seat=2`, {
      method: 'POST',
      body: '{',
    });
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toEqual({ error: 'INVALID_JSON' });

    const wrongSeat = await workerExports.default.fetch(`https://example.com/api/match/${room}?seat=0`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(envelope('router:wrong-seat', actor, pass)),
    });
    expect(wrongSeat.status).toBe(403);
    const wrongSeatBody = await wrongSeat.json() as any;
    expect(wrongSeatBody.reason).toBe('SEAT_COMMAND_MISMATCH');
    expect(wrongSeatBody.projection.observation.seat).toBe(0);
    expect(wrongSeatBody.state).toBeUndefined();

    const accepted = await workerExports.default.fetch(`https://example.com/api/match/${room}?seat=2`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(envelope('router:fresh', actor, pass)),
    });
    expect(accepted.status).toBe(200);

    const stale = await workerExports.default.fetch(`https://example.com/api/match/${room}?seat=2`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(envelope('router:stale', actor, pass)),
    });
    expect(stale.status).toBe(409);
    const staleBody = await stale.json() as any;
    expect(staleBody.reason).toBe('REVISION_MISMATCH');
    expect(staleBody.projection.observation.revision).toBe(1);
    expect(staleBody.state).toBeUndefined();
  });

  it('forwards WebSocket upgrades to the named MatchRoom', async () => {
    const response = await workerExports.default.fetch('https://example.com/api/match/router-ws-room/ws?seat=2', {
      headers: { Upgrade: 'websocket' },
    });
    expect(response.status).toBe(101);
    const socket = response.webSocket;
    if (!socket) throw new Error('Expected WebSocket response');

    const snapshotPromise = nextMessage(socket);
    socket.accept();
    const snapshot = await snapshotPromise;
    expect(snapshot.type).toBe('snapshot');
    expect(snapshot.projection.observation.seat).toBe(2);
    expect(snapshot.projection.observation.revision).toBe(0);

    const updatePromise = nextMessage(socket);
    socket.send(JSON.stringify(envelope('router:ws:pass', snapshot.projection, passCommand(snapshot.projection))));
    const update = await updatePromise;
    expect(update.type).toBe('update');
    expect(update.revision).toBe(1);
    expect(update.projection.observation.seat).toBe(2);
    expect(update.events.map((event: { type: string }) => event.type)).toEqual(['player-passed']);

    socket.close(1000, 'test complete');
  });
});
