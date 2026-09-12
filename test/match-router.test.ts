import { exports as workerExports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import type { Command, SeatProjection } from '../src/core/index.js';
import type { ClientCommandEnvelope, RoomMode } from '../worker/match-room.js';

interface CreatedRoom {
  room: string;
  seat: 0;
  token: string;
  state: { mode: RoomMode; status: string; seats: string[]; revision: number | null };
}

interface JoinedRoom {
  room: string;
  ok: true;
  seat: 1 | 2;
  token: string;
  state: { mode: RoomMode; status: string; seats: string[]; revision: number | null };
}

function nextMessage(socket: WebSocket): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('WebSocket message timeout')), 2_500);
    socket.addEventListener('message', (event) => {
      clearTimeout(timeout);
      try {
        resolve(JSON.parse(event.data as string));
      } catch {
        resolve(event.data);
      }
    }, { once: true });
  });
}

function envelope(id: string, projection: SeatProjection, command: Command): ClientCommandEnvelope {
  return { type: 'command', clientCommandId: id, expectedRevision: projection.observation.revision, command };
}

function passCommand(projection: SeatProjection): Command {
  const pass = projection.legalCommands.find((command) => command.type === 'pass');
  if (!pass) throw new Error(`seat ${projection.observation.seat} has no pass command`);
  return pass;
}

async function createRoom(mode: RoomMode): Promise<CreatedRoom> {
  const response = await workerExports.default.fetch('https://example.com/api/rooms', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ mode }),
  });
  expect(response.status).toBe(201);
  expect(response.headers.get('cache-control')).toBe('no-store');
  const body = await response.json() as CreatedRoom;
  expect(body.room).toMatch(/^[0-9A-HJKMNP-TV-Z]{12}$/);
  expect(body.seat).toBe(0);
  expect(body.token).toMatch(/^ts1_/);
  return body;
}

async function joinRoom(room: string): Promise<JoinedRoom> {
  const response = await workerExports.default.fetch(`https://example.com/api/rooms/${room}/join`, { method: 'POST' });
  expect(response.status).toBe(201);
  return await response.json() as JoinedRoom;
}

async function getSession(room: string, token: string): Promise<{ seat: number; projection: SeatProjection | null; roomState: any }> {
  const response = await workerExports.default.fetch(`https://example.com/api/match/${room}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.status).toBe(200);
  const body = await response.json() as any;
  expect(body.ok).toBe(true);
  return { seat: body.seat, projection: body.projection, roomState: body.room };
}

async function createTrio(): Promise<{ room: string; tokens: [string, string, string] }> {
  const created = await createRoom('trio');
  const one = await joinRoom(created.room);
  const two = await joinRoom(created.room);
  const joins = [one, two].sort((a, b) => a.seat - b.seat);
  expect(joins.map((join) => join.seat)).toEqual([1, 2]);
  return { room: created.room, tokens: [created.token, joins[0].token, joins[1].token] };
}

describe('MatchRoom Worker router', () => {
  it('creates shareable room codes while keeping seat capabilities out of the public room state', async () => {
    const health = await workerExports.default.fetch('https://example.com/api/match');
    expect(await health.json()).toEqual({ ok: true, service: 'match-room', auth: 'seat-capability-v1' });

    const created = await createRoom('trio');
    expect(created.state).toEqual({ mode: 'trio', status: 'lobby', seats: ['human', 'open', 'open'], revision: null });

    const publicResponse = await workerExports.default.fetch(`https://example.com/api/rooms/${created.room.toLowerCase()}`);
    expect(publicResponse.status).toBe(200);
    const publicBody = await publicResponse.json() as any;
    expect(publicBody.room).toBe(created.room);
    expect(JSON.stringify(publicBody)).not.toContain(created.token);
    expect(JSON.stringify(publicBody)).not.toContain('tokenHash');

    expect((await workerExports.default.fetch('https://example.com/api/rooms/BAD')).status).toBe(404);
    const invalidMode = await workerExports.default.fetch('https://example.com/api/rooms', {
      method: 'POST', body: JSON.stringify({ mode: 'anything' }),
    });
    expect(invalidMode.status).toBe(400);
  });

  it('starts solo immediately with server-owned bots and restores the human seat from a bearer capability', async () => {
    const created = await createRoom('solo');
    expect(created.state.seats).toEqual(['human', 'bot', 'bot']);
    expect(created.state.status).toBe('playing');
    expect(created.state.revision).toBeGreaterThanOrEqual(1);

    const session = await getSession(created.room, created.token);
    expect(session.seat).toBe(0);
    expect(session.projection?.observation.seat).toBe(0);
    expect(session.projection?.legalCommands.length).toBeGreaterThan(0);
    expect(session.projection?.legalCommands.every((command) => command.seat === 0)).toBe(true);
  });

  it('requires the reconnect capability instead of accepting the old seat query shortcut', async () => {
    const created = await createRoom('solo');
    expect((await workerExports.default.fetch(`https://example.com/api/match/${created.room}?seat=0`)).status).toBe(401);
    expect((await workerExports.default.fetch(`https://example.com/api/match/${created.room}`, {
      headers: { Authorization: 'Bearer ts1_not-the-token' },
    })).status).toBe(401);

    const session = await getSession(created.room, created.token);
    expect(session.projection).not.toBeNull();
  });

  it('submits core commands over authenticated HTTP and maps malformed, wrong-seat and stale requests', async () => {
    const { room, tokens } = await createTrio();
    const actorSession = await getSession(room, tokens[2]);
    const actor = actorSession.projection!;
    expect(actor.observation.auction.turn).toBe(2);

    const seat0 = (await getSession(room, tokens[0])).projection!;
    for (const hiddenCard of actor.observation.ownHand) expect(JSON.stringify(seat0)).not.toContain(hiddenCard);

    const malformed = await workerExports.default.fetch(`https://example.com/api/match/${room}`, {
      method: 'POST', headers: { Authorization: `Bearer ${tokens[2]}` }, body: '{',
    });
    expect(malformed.status).toBe(400);

    const pass = passCommand(actor);
    const wrongSeat = await workerExports.default.fetch(`https://example.com/api/match/${room}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens[0]}`, 'content-type': 'application/json' },
      body: JSON.stringify(envelope('router:wrong-seat', actor, pass)),
    });
    expect(wrongSeat.status).toBe(403);
    const wrongBody = await wrongSeat.json() as any;
    expect(wrongBody.reason).toBe('SEAT_COMMAND_MISMATCH');
    expect(wrongBody.state).toBeUndefined();

    const accepted = await workerExports.default.fetch(`https://example.com/api/match/${room}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens[2]}`, 'content-type': 'application/json' },
      body: JSON.stringify(envelope('router:fresh', actor, pass)),
    });
    expect(accepted.status).toBe(200);
    const acceptedBody = await accepted.json() as any;
    expect(acceptedBody.ok).toBe(true);
    expect(acceptedBody.revision).toBe(1);
    expect(acceptedBody.projection.observation.seat).toBe(2);

    const stale = await workerExports.default.fetch(`https://example.com/api/match/${room}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens[2]}`, 'content-type': 'application/json' },
      body: JSON.stringify(envelope('router:stale', actor, pass)),
    });
    expect(stale.status).toBe(409);
    const staleBody = await stale.json() as any;
    expect(staleBody.reason).toBe('REVISION_MISMATCH');
    expect(staleBody.state).toBeUndefined();
  });

  it('forwards credentialed WebSockets without placing the reconnect secret in the URL', async () => {
    const { room, tokens } = await createTrio();
    const wsUrl = `https://example.com/api/match/${room}/ws`;
    expect(wsUrl).not.toContain(tokens[2]);

    const response = await workerExports.default.fetch(wsUrl, {
      headers: {
        Upgrade: 'websocket',
        Origin: 'https://example.com',
        'Sec-WebSocket-Protocol': `tysiac.v1, seat.${tokens[2]}`,
      },
    });
    expect(response.status).toBe(101);
    expect(response.headers.get('Sec-WebSocket-Protocol')).toBe('tysiac.v1');
    const socket = response.webSocket;
    if (!socket) throw new Error('Expected WebSocket response');

    const snapshotPromise = nextMessage(socket);
    socket.accept();
    const snapshot = await snapshotPromise;
    expect(snapshot.type).toBe('snapshot');
    expect(snapshot.projection.observation.seat).toBe(2);

    const updatePromise = nextMessage(socket);
    socket.send(JSON.stringify(envelope('router:ws:pass', snapshot.projection, passCommand(snapshot.projection))));
    const update = await updatePromise;
    expect(update.type).toBe('update');
    expect(update.revision).toBe(1);
    expect(update.projection.observation.seat).toBe(2);
    socket.close(1000, 'test complete');
  });
});
