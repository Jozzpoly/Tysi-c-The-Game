import { describe, expect, it } from 'vitest';
import {
  chooseMagneticTarget,
  magneticCapture,
  magneticOffsetToRect,
  pointInsideRect,
} from '../src/presentation/spatialMagnetism.js';

const RECT = { left: 100, right: 200, top: 100, bottom: 180 };

describe('spatial magnetism', () => {
  it('keeps canonical geometry strict while allowing an intentionally generous enter field', () => {
    const point = { x: -120, y: 140 };
    expect(pointInsideRect(point, RECT)).toBe(false);
    expect(magneticCapture(point, RECT, {
      latched: false,
      enterPaddingPx: 20,
      releasePaddingPx: 36,
    })).toBe(true);
    expect(magneticCapture({ x: -140, y: 140 }, RECT, {
      latched: false,
      enterPaddingPx: 20,
      releasePaddingPx: 36,
    })).toBe(false);
  });

  it('uses a wider release field after capture to avoid edge flicker', () => {
    const point = { x: -180, y: 140 };
    expect(magneticCapture(point, RECT, {
      latched: false,
      enterPaddingPx: 20,
      releasePaddingPx: 36,
    })).toBe(false);
    expect(magneticCapture(point, RECT, {
      latched: true,
      enterPaddingPx: 20,
      releasePaddingPx: 36,
    })).toBe(true);
  });

  it('starts visual attraction continuously at long range and strengthens on approach', () => {
    const outside = magneticOffsetToRect({ x: -270, y: 140 }, RECT, 24, 10);
    const boundary = magneticOffsetToRect({ x: -250, y: 140 }, RECT, 24, 10);
    const closer = magneticOffsetToRect({ x: 20, y: 140 }, RECT, 24, 10);

    expect(outside).toEqual({ x: 0, y: 0, strength: 0 });
    expect(boundary.x).toBeGreaterThan(0);
    expect(boundary.x).toBeLessThan(0.1);
    expect(boundary.y).toBe(0);
    expect(closer.x).toBeGreaterThan(boundary.x);
    expect(closer.strength).toBeGreaterThan(boundary.strength);
    expect(closer.x).toBeLessThanOrEqual(10);

    expect(magneticOffsetToRect({ x: 110, y: 140 }, RECT, 24, 10)).toEqual({ x: 0, y: 0, strength: 1 });
  });

  it('scales pull for a large physical destination without exceeding its bounded maximum', () => {
    const large = { left: 300, right: 650, top: 200, bottom: 360 };
    const assisted = magneticOffsetToRect({ x: 100, y: 280 }, large, 30, 10);
    expect(assisted.x).toBeGreaterThan(10);
    expect(assisted.x).toBeLessThanOrEqual(35);
    expect(assisted.y).toBe(0);
    expect(assisted.strength).toBeGreaterThan(0);
  });

  it('retains a captured target, then chooses the nearest target when free', () => {
    const targets = [
      { id: 'left', rect: { left: 20, right: 100, top: 20, bottom: 100 } },
      { id: 'right', rect: { left: 120, right: 200, top: 20, bottom: 100 } },
    ] as const;

    expect(chooseMagneticTarget({ x: 110, y: 60 }, targets, {
      preferredId: null,
      enterPaddingPx: 18,
      releasePaddingPx: 30,
    })).toBe('left');

    expect(chooseMagneticTarget({ x: 112, y: 60 }, targets, {
      preferredId: 'right',
      enterPaddingPx: 18,
      releasePaddingPx: 30,
    })).toBe('right');

    expect(chooseMagneticTarget({ x: 501, y: 60 }, targets, {
      preferredId: 'right',
      enterPaddingPx: 18,
      releasePaddingPx: 30,
    })).toBeNull();
  });
});
