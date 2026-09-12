import { evictDurableObject } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import type { Command, Seat, SeatProjection } from '../src/core/index.js';
import type { ClientCommandEnvelope } from '../worker/match-room.js';

const SEATS = [0, 1, 2] as const;

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

async function actorProjection(stub: DurableObjectStub<import('../worker/index.js').MatchRoom>): Promise<{ seat: Seat; projection: SeatProjection }> {
  const publicView = await stub.getProjection(0);
  const seat = publicView.observation.auction.turn;
  return { seat, projection: await stub.getProjection(seat) };
}

function envelope(id: string, projection: SeatProjection, command: Command): ClientCommandEnvelope {
  return {
    type: 'command',
    clientCommandId: id,
    expectedRevision: projection.observation.revision,
    command,
  };
}

function passCommand(projection: SeatProjection): Command {
  const command = projection.legalCommands.find((candidate) => candidate.type === 'pass');
  if (!command) throw new Error(`seat ${projection.observation.seat} has no pass command`);
  return command;
}

function bidCommand(projection: SeatProjection): Command {
  const command = projection.legalCommands.find((candidate) => candidate.type === 'bid');
  if (!command) throw new Error(`seat ${projection.observation.seat} has no bid command`);
  return command;
}

async function openSocket(stub: DurableObjectStub<import('../worker/index.js').MatchRoom>, seat: Seat): Promise<WebSocket> {
  const response = await stub.fetch(`https://example.com/ws?seat=${seat}`, {
    headers: { Upgrade: 'websocket' },
  });
  const socket = response.webSocket;
  if (!socket) throw new Error('Expected WebSocket response');
  socket.accept();
  return socket;
}

describe('MatchRoom Durable Object', () => {
  it('returns only seat projections and preserves hidden hands between seats', async () => {
    const stub = env.MATCH_ROOM.getByName('privacy-room');
    const projections = await Promise.all(SEATS.map((seat) => stub.getProjection(seat)));

    for (const seat of SEATS) {
      const projection = projections[seat];
      expect(projection.observation.seat).toBe(seat);
      expect(projection.observation.revealedTalon).toBeNull();
      const serialized = JSON.stringify(projection);

      for (const other of SEATS) {
        if (other === seat) continue;
        for (const hiddenCard of projections[other].observation.ownHand) {
          expect(serialized).not.toContain(hiddenCard);
        }
      }
    }
  });

  it('persists an accepted core command across Durable Object eviction', async () => {
    const stub = env.MATCH_ROOM.getByName('persist-match-room');
    const actor = await actorProjection(stub);
    const command = passCommand(actor.projection);
    const result = await stub.submitCommand(actor.seat, envelope('persist:1', actor.projection, command));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.duplicate).toBe(false);
    expect(result.revision).toBe(1);
    expect(result.events.map((event) => event.type)).toEqual(['player-passed']);

    await evictDurableObject(stub);
    const restored = await stub.getProjection(actor.seat);
    expect(restored.observation.revision).toBe(1);
    expect(restored.observation.auction.active[actor.seat]).toBe(false);
  });

  it('deduplicates retries without replaying feedback and rejects command-id reuse', async () => {
    const stub = env.MATCH_ROOM.getByName('idempotency-room');
    const actor = await actorProjection(stub);
    const pass = passCommand(actor.projection);
    const firstEnvelope = envelope('stable-command-id', actor.projection, pass);

    const first = await stub.submitCommand(actor.seat, firstEnvelope);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.duplicate).toBe(false);
    expect(first.acceptedRevision).toBe(1);

    const retry = await stub.submitCommand(actor.seat, firstEnvelope);
    expect(retry.ok).toBe(true);
    if (!retry.ok) return;
    expect(retry.duplicate).toBe(true);
    expect(retry.revision).toBe(1);
    expect(retry.acceptedRevision).toBe(1);
    expect(retry.events).toEqual([]);

    const reused = await stub.submitCommand(actor.seat, {
      ...firstEnvelope,
      command: bidCommand(actor.projection),
    });
    expect(reused.ok).toBe(false);
    if (reused.ok) return;
    expect(reused.reason).toBe('CLIENT_COMMAND_ID_REUSED');
    expect(reused.revision).toBe(1);
  });

  it('authorizes seat-bearing commands against the seat context', async () => {
    const stub = env.MATCH_ROOM.getByName('seat-context-room');
    const actor = await actorProjection(stub);
    const otherSeat = ((actor.seat + 1) % 3) as Seat;
    const result = await stub.submitCommand(otherSeat, envelope('wrong-seat', actor.projection, passCommand(actor.projection)));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('SEAT_COMMAND_MISMATCH');
    expect(result.revision).toBe(0);
    expect((await stub.getProjection(actor.seat)).observation.revision).toBe(0);
  });

  it('accepts exactly one concurrent command for a shared expected revision', async () => {
    const stub = env.MATCH_ROOM.getByName('match-race-room');
    const actor = await actorProjection(stub);
    const pass = passCommand(actor.projection);
    const bid = bidCommand(actor.projection);

    const results = await Promise.all([
      stub.submitCommand(actor.seat, envelope('race:pass', actor.projection, pass)),
      stub.submitCommand(actor.seat, envelope('race:bid', actor.projection, bid)),
    ]);

    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok)).toHaveLength(1);
    const rejected = results.find((result) => !result.ok);
    expect(rejected && !rejected.ok ? rejected.reason : null).toBe('REVISION_MISMATCH');
    expect((await stub.getProjection(actor.seat)).observation.revision).toBe(1);
  });

  it('keeps per-seat WebSocket projections safe and usable across eviction', async () => {
    const stub = env.MATCH_ROOM.getByName('match-websocket-room');
    const initial = await actorProjection(stub);
    expect(initial.seat).toBe(2);

    const socket2 = await openSocket(stub, 2);
    const socket0 = await openSocket(stub, 0);
    const snapshot2 = await nextMessage(socket2);
    const snapshot0 = await nextMessage(socket0);
    expect(snapshot2.type).toBe('snapshot');
    expect(snapshot2.projection.observation.seat).toBe(2);
    expect(snapshot0.projection.observation.seat).toBe(0);

    for (const hiddenCard of snapshot2.projection.observation.ownHand) {
      expect(JSON.stringify(snapshot0.projection)).not.toContain(hiddenCard);
    }

    const update2Promise = nextMessage(socket2);
    const update0Promise = nextMessage(socket0);
    socket2.send(JSON.stringify(envelope('ws:seat2-pass', snapshot2.projection, passCommand(snapshot2.projection))));
    const update2 = await update2Promise;
    const update0 = await update0Promise;
    expect(update2.type).toBe('update');
    expect(update0.type).toBe('update');
    expect(update2.revision).toBe(1);
    expect(update0.revision).toBe(1);
    expect(update2.projection.observation.seat).toBe(2);
    expect(update0.projection.observation.seat).toBe(0);
    expect(update0.events.map((event: { type: string }) => event.type)).toEqual(['player-passed']);

    await evictDurableObject(stub);

    // After seat 2 passes, seat 0 is the next bidder. Reuse the hibernated seat-0
    // socket to prove attachment restoration and core-backed command handling.
    expect(update0.projection.observation.auction.turn).toBe(0);
    const second2Promise = nextMessage(socket2);
    const second0Promise = nextMessage(socket0);
    socket0.send(JSON.stringify(envelope('ws:seat0-pass', update0.projection, passCommand(update0.projection))));
    const second0 = await second0Promise;
    const second2 = await second2Promise;
    expect(second0.type).toBe('update');
    expect(second2.type).toBe('update');
    expect(second0.revision).toBe(2);
    expect(second2.revision).toBe(2);
    expect((await stub.getProjection(0)).observation.revision).toBe(2);

    socket0.close(1000, 'test complete');
    socket2.close(1000, 'test complete');
  });
});
