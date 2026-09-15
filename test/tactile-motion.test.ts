import { describe, expect, it } from 'vitest';
import {
  tactileCarryTiltDegrees,
  tactileMotionEnergy,
  tactileNeighborResponseMs,
  tactileReturnMotion,
  tactileSettleMotion,
} from '../src/presentation/tactileMotion.js';

describe('tactile presentation motion', () => {
  it('keeps idle motion calm and finite', () => {
    expect(tactileMotionEnergy(0, 0)).toBe(0);
    expect(tactileCarryTiltDegrees({ displacementX: 0, velocityX: 0, velocityY: 0 })).toBe(0);
    expect(tactileNeighborResponseMs(0, 0)).toBe(104);
    expect(tactileReturnMotion({ displacementX: 0, velocityX: 0, velocityY: 0 })).toEqual({ durationMs: 220, overshootX: 0, overshootY: 0 });
    expect(tactileSettleMotion(0, 0)).toEqual({ durationMs: 150, overshootX: 0, overshootY: 0 });
  });

  it('makes fast carry more responsive without changing its bounded geometry', () => {
    const slowTilt = tactileCarryTiltDegrees({ displacementX: 42, velocityX: 0.08, velocityY: 0 });
    const fastTilt = tactileCarryTiltDegrees({ displacementX: 42, velocityX: 1.2, velocityY: 0 });
    expect(fastTilt).toBeGreaterThan(slowTilt);
    expect(fastTilt).toBeLessThanOrEqual(12);
    expect(tactileNeighborResponseMs(1.2, 0)).toBeLessThan(tactileNeighborResponseMs(0.08, 0));
  });

  it('responds symmetrically to gesture direction', () => {
    const right = tactileCarryTiltDegrees({ displacementX: 70, velocityX: 1.1, velocityY: 0 });
    const left = tactileCarryTiltDegrees({ displacementX: -70, velocityX: -1.1, velocityY: 0 });
    expect(right).toBeGreaterThan(0);
    expect(left).toBeLessThan(0);
    expect(Math.abs(right)).toBeCloseTo(Math.abs(left));
  });

  it('bounds extreme velocity so presentation cannot explode', () => {
    expect(tactileMotionEnergy(999, -999)).toBe(1);
    expect(tactileCarryTiltDegrees({ displacementX: 9999, velocityX: 999, velocityY: 0 })).toBe(12);
    expect(tactileCarryTiltDegrees({ displacementX: -9999, velocityX: -999, velocityY: 0 })).toBe(-12);
    expect(tactileNeighborResponseMs(999, 999)).toBe(56);
    expect(tactileReturnMotion({ displacementX: 0, velocityX: 999, velocityY: -999 })).toEqual({ durationMs: 178, overshootX: 20, overshootY: -14 });
  });

  it('keeps return overshoot presentation-only and modest at realistic speed', () => {
    const response = tactileReturnMotion({ displacementX: 120, velocityX: 0.8, velocityY: -0.5 });
    expect(response.durationMs).toBeGreaterThanOrEqual(178);
    expect(response.durationMs).toBeLessThanOrEqual(220);
    expect(response.overshootX).toBeCloseTo(10.4);
    expect(response.overshootY).toBeCloseTo(-5);
  });

  it('settles reordered neighbors with a small opposite-side overshoot', () => {
    const rightwardDelta = tactileSettleMotion(60, 8);
    const leftwardDelta = tactileSettleMotion(-60, -8);
    expect(rightwardDelta.durationMs).toBeGreaterThan(150);
    expect(rightwardDelta.durationMs).toBeLessThanOrEqual(180);
    expect(rightwardDelta.overshootX).toBeCloseTo(-3.3);
    expect(rightwardDelta.overshootY).toBeCloseTo(-0.36);
    expect(leftwardDelta.overshootX).toBeCloseTo(3.3);
    expect(leftwardDelta.overshootY).toBeCloseTo(0.36);
  });

  it('clamps settle spring even for extreme FLIP displacement', () => {
    expect(tactileSettleMotion(9999, -9999)).toEqual({ durationMs: 180, overshootX: -4.5, overshootY: 3 });
  });
});
