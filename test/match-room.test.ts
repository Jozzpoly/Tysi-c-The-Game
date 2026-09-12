import { evictDurableObject } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import type { Command, Seat, SeatProjection } from '../src/core/index.js';
import type { ClientCommandEnvelope, CreateRoomAccepted, JoinRoomAccepted } from '../worker/match-room.js';

const SEATS = [0, 1, 2] as const;
type MatchStub = DurableObjectStub<import('../worker/index.js').MatchRoom>;

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
  return {
    type: 'command',
    clientCommandId: id,
    expectedRevision: projection.observation.revision,
    command,
  };
}

function passCommand(projection: SeatProjection): Extract<Command, { type: 'pass' }> {
  const command = projection.legalCommands.find((candidate): candidate is Extract<Command, { type: 'pass' }> => candidate.type === 'pass');
  if (!command) throw new Error(`seat ${projection.observation.seat} has no pass command`);
  return command;
}

function bidCommand(projection: SeatProjection): Extract<Command, { type: 'bid' }> {
  const command = projection.legalCommands.find((candidate): candidate is Extract<Command, { type: 'bid' }> => candidate.type === 'bid');
  if (!command) throw new Error(`seat ${projection.observation.seat} has no bid command`);
  return command;
}

async function createTrio(stub: MatchStub): Promise<{ create: CreateRoomAccepted; joins: [JoinRoomAccepted, JoinRoomAccepted]; tokens: [string, string, string] }> {
  const created = await stub.createRoom('trio');
  expect(created.ok).toBe(true);
  if (!created.ok) throw new Error(created.reason);
  const join1 = await stub.joinRoom();
  const join2 = await stub.joinRoom();
  expect(join1.ok).toBe(true);
  expect(join2.ok).toBe(true);
  if (!join1.ok || !join2.ok) throw new Error('trio join failed');
  expect(join1.seat).toBe(1);
  expect(join2.seat).toBe(2);
  return { create: created, joins: [join1, join2], tokens: [created.token, join1.token, join2.token] };
}

async function projectionFor(stub: MatchStub, token: string): Promise<SeatProjection> {
  const session = await stub.getSession(token);
  expect(session.ok).toBe(true);
  if (!session.ok || !session.projection) throw new Error('expected active session projection');
  return session.projection;
}

async function openSocket(stub: MatchStub, token: string): Promise<{ socket: WebSocket; first: any }> {
  const response = await stub.fetch('https://example.com/ws', {
    headers: {
      Upgrade: 'websocket',
      Origin: 'https://example.com',
      'Sec-WebSocket-Protocol': `tysiac.v1, seat.${token}`,
    },
  });
  expect(response.status).toBe(101);
  expect(response.headers.get('Sec-WebSocket-Protocol')).toBe('tysiac.v1');
  const socket = response.webSocket;
  if (!socket) throw new Error('Expected WebSocket response');
  const firstPromise = nextMessage(socket);
  socket.accept();
  return { socket, first: await firstPromise };
}

describe('MatchRoom Durable Object lifecycle and authority', () => {
  it('creates an accountless trio lobby, atomically fills human seats and never exposes credentials publicly', async () => {
    const stub = env.MATCH_ROOM.getByName('lifecycle-room');
    expect(await stub.getPublicRoom()).toBeNull();

    const created = await stub.createRoom('trio');
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.seat).toBe(0);
    expect(created.token).toMatch(/^ts1_[A-Za-z0-9_-]{40,}$/);
    expect(created.room).toEqual({ mode: 'trio', status: 'lobby', seats: ['human', 'open', 'open'], revision: null });
    expect(JSON.stringify(await stub.getPublicRoom())).not.toContain(created.token);

    const joins = await Promise.all([stub.joinRoom(), stub.joinRoom()]);
    expect(joins.every((result) => result.ok)).toBe(true);
    const accepted = joins.filter((result): result is JoinRoomAccepted => result.ok);
    expect(new Set(accepted.map((result) => result.seat))).toEqual(new Set([1, 2]));
    expect(new Set(accepted.map((result) => result.token)).size).toBe(2);

    const room = await stub.getPublicRoom();
    expect(room?.status).toBe('playing');
    expect(room?.seats).toEqual(['human', 'human', 'human']);
    const full = await stub.joinRoom();
    expect(full).toMatchObject({ ok: false, reason: 'ROOM_FULL' });

    const tokens = [created.token, ...accepted.sort((a, b) => a.seat - b.seat).map((result) => result.token)];
    const sessions = await Promise.all(tokens.map((token) => stub.getSession(token)));
    expect(sessions.map((session) => session.ok ? session.seat : null)).toEqual([0, 1, 2]);
    expect(JSON.stringify(room)).not.toContain('ts1_');
  });

  it('preserves hidden information across authenticated trio sessions', async () => {
    const stub = env.MATCH_ROOM.getByName('privacy-room');
    const { tokens } = await createTrio(stub);
    const projections = await Promise.all(tokens.map((token) => projectionFor(stub, token)));

    for (const seat of SEATS) {
      const projection = projections[seat];
      expect(projection.observation.seat).toBe(seat);
      const serialized = JSON.stringify(projection);
      for (const other of SEATS) {
        if (other === seat) continue;
        for (const hiddenCard of projections[other].observation.ownHand) expect(serialized).not.toContain(hiddenCard);
      }
    }
  });

  it('runs bot-owned seats inside authority until the next human decision', async () => {
    const stub = env.MATCH_ROOM.getByName('solo-bots-room');
    const created = await stub.createRoom('solo');
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.room.seats).toEqual(['human', 'bot', 'bot']);
    expect(created.room.status).toBe('playing');

    const initial = await projectionFor(stub, created.token);
    expect(initial.observation.seat).toBe(0);
    expect(initial.legalCommands.length).toBeGreaterThan(0);
    expect(initial.legalCommands.every((command) => command.seat === 0)).toBe(true);

    const command = initial.legalCommands[0];
    const result = await stub.submitCommand(created.token, envelope('solo:human:1', initial, command));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.acceptedRevision).toBe(initial.observation.revision + 1);
    expect(result.revision).toBeGreaterThan(result.acceptedRevision);
    expect(result.projection.observation.seat).toBe(0);
  });

  it('persists credential-bound state across Durable Object eviction', async () => {
    const stub = env.MATCH_ROOM.getByName('persist-match-room');
    const { tokens } = await createTrio(stub);
    const actor = await projectionFor(stub, tokens[2]);
    expect(actor.observation.auction.turn).toBe(2);
    const result = await stub.submitCommand(tokens[2], envelope('persist:1', actor, passCommand(actor)));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.revision).toBe(1);

    await evictDurableObject(stub);
    const restored = await projectionFor(stub, tokens[2]);
    expect(restored.observation.revision).toBe(1);
    expect(restored.observation.auction.active[2]).toBe(false);
  });

  it('canonicalizes semantic retries, suppresses replay feedback and rejects command-id reuse', async () => {
    const stub = env.MATCH_ROOM.getByName('idempotency-room');
    const { tokens } = await createTrio(stub);
    const actor = await projectionFor(stub, tokens[2]);
    const pass = passCommand(actor);
    const firstEnvelope = envelope('stable-command-id', actor, pass);

    const first = await stub.submitCommand(tokens[2], firstEnvelope);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.duplicate).toBe(false);

    const reorderedPass = { seat: pass.seat, type: 'pass' } as const;
    const retry = await stub.submitCommand(tokens[2], { ...firstEnvelope, command: reorderedPass });
    expect(retry.ok).toBe(true);
    if (!retry.ok) return;
    expect(retry.duplicate).toBe(true);
    expect(retry.revision).toBe(1);
    expect(retry.events).toEqual([]);

    const reused = await stub.submitCommand(tokens[2], { ...firstEnvelope, command: bidCommand(actor) });
    expect(reused.ok).toBe(false);
    if (reused.ok) return;
    expect(reused.reason).toBe('CLIENT_COMMAND_ID_REUSED');
  });

  it('binds authorization to the credential seat and serializes revision races', async () => {
    const stub = env.MATCH_ROOM.getByName('authorization-race-room');
    const { tokens } = await createTrio(stub);
    const actor = await projectionFor(stub, tokens[2]);
    const pass = passCommand(actor);
    const bid = bidCommand(actor);

    const wrongSeat = await stub.submitCommand(tokens[0], envelope('wrong-seat', actor, pass));
    expect(wrongSeat.ok).toBe(false);
    if (!wrongSeat.ok) expect(wrongSeat.reason).toBe('SEAT_COMMAND_MISMATCH');

    const results = await Promise.all([
      stub.submitCommand(tokens[2], envelope('race:pass', actor, pass)),
      stub.submitCommand(tokens[2], envelope('race:bid', actor, bid)),
    ]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok)).toHaveLength(1);
    const rejected = results.find((result) => !result.ok);
    expect(rejected && !rejected.ok ? rejected.reason : null).toBe('REVISION_MISMATCH');
  });

  it('moves an existing authenticated lobby WebSocket into a started duo room', async () => {
    const stub = env.MATCH_ROOM.getByName('duo-lobby-ws-room');
    const created = await stub.createRoom('duo');
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const host = await openSocket(stub, created.token);
    expect(host.first.type).toBe('lobby');
    expect(host.first.seat).toBe(0);
    expect(host.first.room.status).toBe('lobby');

    const startedPromise = nextMessage(host.socket);
    const joined = await stub.joinRoom();
    expect(joined.ok).toBe(true);
    if (!joined.ok) return;
    expect(joined.seat).toBe(1);
    expect(joined.room.status).toBe('playing');

    const started = await startedPromise;
    expect(started.type).toBe('started');
    expect(started.projection.observation.seat).toBe(0);
    expect(started.projection.legalCommands.length).toBeGreaterThan(0);
    expect(started.revision).toBeGreaterThanOrEqual(1);
    host.socket.close(1000, 'test complete');
  });

  it('keeps authenticated per-seat WebSockets safe across eviction and rejects bad credentials/origins', async () => {
    const stub = env.MATCH_ROOM.getByName('match-websocket-room');
    const { tokens } = await createTrio(stub);

    const invalid = await stub.fetch('https://example.com/ws', {
      headers: { Upgrade: 'websocket', 'Sec-WebSocket-Protocol': 'tysiac.v1, seat.invalid' },
    });
    expect(invalid.status).toBe(401);
    const crossOrigin = await stub.fetch('https://example.com/ws', {
      headers: { Upgrade: 'websocket', Origin: 'https://evil.example', 'Sec-WebSocket-Protocol': `tysiac.v1, seat.${tokens[2]}` },
    });
    expect(crossOrigin.status).toBe(403);

    const opened2 = await openSocket(stub, tokens[2]);
    const opened0 = await openSocket(stub, tokens[0]);
    expect(opened2.first.type).toBe('snapshot');
    expect(opened0.first.type).toBe('snapshot');
    expect(opened2.first.projection.observation.seat).toBe(2);
    expect(opened0.first.projection.observation.seat).toBe(0);

    for (const hiddenCard of opened2.first.projection.observation.ownHand) {
      expect(JSON.stringify(opened0.first.projection)).not.toContain(hiddenCard);
    }

    const update2Promise = nextMessage(opened2.socket);
    const update0Promise = nextMessage(opened0.socket);
    opened2.socket.send(JSON.stringify(envelope('ws:seat2-pass', opened2.first.projection, passCommand(opened2.first.projection))));
    const update2 = await update2Promise;
    const update0 = await update0Promise;
    expect(update2.type).toBe('update');
    expect(update0.type).toBe('update');
    expect(update2.revision).toBe(1);
    expect(update0.projection.observation.seat).toBe(0);

    await evictDurableObject(stub);

    const second2Promise = nextMessage(opened2.socket);
    const second0Promise = nextMessage(opened0.socket);
    opened0.socket.send(JSON.stringify(envelope('ws:seat0-pass', update0.projection, passCommand(update0.projection))));
    const second0 = await second0Promise;
    const second2 = await second2Promise;
    expect(second0.type).toBe('update');
    expect(second2.type).toBe('update');
    expect(second0.revision).toBe(2);
    expect((await projectionFor(stub, tokens[0])).observation.revision).toBe(2);

    opened0.socket.close(1000, 'test complete');
    opened2.socket.close(1000, 'test complete');
  }, 15_000);
});
