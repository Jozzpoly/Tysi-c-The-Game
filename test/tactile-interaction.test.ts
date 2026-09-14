import { describe, expect, it } from 'vitest';
import type { CardId } from '../src/core/index.js';
import {
  advanceTactilePointer,
  beginTactilePointer,
  classifyTactileRelease,
  moveCardInOrder,
  reconcileHandOrder,
  shouldReorderFromPointer,
  tactileTiltDegrees,
} from '../src/presentation/tactileInteraction.js';

const CARD: CardId = 'spades:9';

function begin() {
  return beginTactilePointer({
    card: CARD,
    pointerId: 7,
    x: 100,
    y: 300,
    timeMs: 10,
    width: 52,
    height: 76,
    offsetX: 26,
    offsetY: 38,
    zoneTop: 220,
  });
}

describe('tactile interaction model', () => {
  it('stays pressed below drag slop and becomes held for a real free drag', () => {
    const pressed = advanceTactilePointer(begin(), {
      x: 103, y: 302, timeMs: 20, canCommit: false, inPlayZone: false,
    });
    expect(pressed.phase).toBe('pressed');
    expect(pressed.moved).toBe(false);
    expect(classifyTactileRelease(pressed, { cancelled: false, canCommit: false })).toBe('tap');
    const held = advanceTactilePointer(pressed, {
      x: 125, y: 305, timeMs: 30, canCommit: false, inPlayZone: false,
    });
    expect(held.phase).toBe('held');
    expect(held.moved).toBe(true);
    expect(shouldReorderFromPointer(held)).toBe(true);
    expect(classifyTactileRelease(held, { cancelled: false, canCommit: false })).toBe('return');
  });

  it('uses spatial table membership instead of vertical drag distance', () => {
    const highButOutside = advanceTactilePointer(begin(), {
      x: 100, y: 100, timeMs: 30, canCommit: true, inPlayZone: false,
    });
    expect(highButOutside.phase).toBe('held');
    expect(highButOutside.throwIntent).toBe(false);
    expect(highButOutside.commitReady).toBe(false);
    expect(classifyTactileRelease(highButOutside, { cancelled: false, canCommit: true })).toBe('return');

    const tableIntent = advanceTactilePointer(begin(), {
      x: 100, y: 220, timeMs: 30, canCommit: false, inPlayZone: true,
    });
    expect(tableIntent.phase).toBe('table');
    expect(tableIntent.throwIntent).toBe(true);
    expect(tableIntent.commitReady).toBe(false);
    expect(shouldReorderFromPointer(tableIntent)).toBe(false);
    expect(classifyTactileRelease(tableIntent, { cancelled: false, canCommit: false })).toBe('return');

    const accepted = advanceTactilePointer(begin(), {
      x: 100, y: 220, timeMs: 30, canCommit: true, inPlayZone: true,
    });
    expect(accepted.phase).toBe('accepted');
    expect(accepted.commitReady).toBe(true);
    expect(classifyTactileRelease(accepted, { cancelled: false, canCommit: true })).toBe('commit');
    expect(classifyTactileRelease(accepted, { cancelled: true, canCommit: true })).toBe('return');

    const leftAgain = advanceTactilePointer(accepted, {
      x: 100, y: 140, timeMs: 40, canCommit: true, inPlayZone: false,
    });
    expect(leftAgain.phase).toBe('held');
    expect(leftAgain.commitReady).toBe(false);
    expect(shouldReorderFromPointer(leftAgain)).toBe(true);
  });

  it('tracks pointer velocity without changing gesture classification', () => {
    const first = advanceTactilePointer(begin(), {
      x: 120, y: 300, timeMs: 20, canCommit: false, inPlayZone: false,
    });
    const second = advanceTactilePointer(first, {
      x: 150, y: 280, timeMs: 30, canCommit: false, inPlayZone: false,
    });
    expect(second.velocityX).toBeGreaterThan(0);
    expect(second.velocityY).toBeLessThan(0);
    expect(Number.isFinite(second.velocityX)).toBe(true);
    expect(Number.isFinite(second.velocityY)).toBe(true);
    expect(second.phase).toBe('held');
    expect(tactileTiltDegrees({ x: 500, startX: 100 })).toBe(12);
    expect(tactileTiltDegrees({ x: -500, startX: 100 })).toBe(-12);
  });

  it('keeps local preference only for cards still present in canonical hand', () => {
    const order: CardId[] = ['spades:9', 'clubs:9', 'diamonds:9'];
    const moved = moveCardInOrder(order, 'spades:9', 2);
    expect(moved).toEqual(['clubs:9', 'diamonds:9', 'spades:9']);
    const reconciled = reconcileHandOrder(moved, ['spades:9', 'diamonds:9', 'hearts:9']);
    expect(reconciled).toEqual(['diamonds:9', 'spades:9', 'hearts:9']);
  });
});
