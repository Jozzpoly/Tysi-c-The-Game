export interface TactileMotionSample {
  displacementX: number;
  velocityX: number;
  velocityY: number;
}

export interface TactileReturnMotion {
  durationMs: number;
  overshootX: number;
  overshootY: number;
}

export interface TactileSettleMotion {
  durationMs: number;
  overshootX: number;
  overshootY: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function tactileMotionEnergy(velocityX: number, velocityY: number): number {
  const speed = Math.hypot(velocityX, velocityY);
  return clamp((speed - 0.08) / 1.7, 0, 1);
}

export function tactileCarryTiltDegrees(sample: TactileMotionSample): number {
  const positional = clamp(sample.displacementX / 14, -7, 7);
  const velocity = clamp(sample.velocityX * 3.2, -5, 5);
  return clamp(positional + velocity, -12, 12);
}

export function tactileNeighborResponseMs(velocityX: number, velocityY: number): number {
  const energy = tactileMotionEnergy(velocityX, velocityY);
  return Math.round(104 - energy * 48);
}

export function tactileReturnMotion(sample: TactileMotionSample): TactileReturnMotion {
  const energy = tactileMotionEnergy(sample.velocityX, sample.velocityY);
  return {
    durationMs: Math.round(220 - energy * 42),
    overshootX: clamp(sample.velocityX * 13, -20, 20),
    overshootY: clamp(sample.velocityY * 10, -14, 14),
  };
}

/**
 * Presentation-only settling after a local reorder. The card starts displaced
 * by the FLIP delta, crosses rest by only a few pixels, then settles to zero.
 * The response is based only on rendered displacement and cannot affect order,
 * insertion targeting, legality, or authority.
 */
export function tactileSettleMotion(deltaX: number, deltaY: number): TactileSettleMotion {
  const distance = Math.hypot(deltaX, deltaY);
  const strength = clamp(distance / 90, 0, 1);
  return {
    durationMs: Math.round(150 + strength * 30),
    overshootX: -clamp(deltaX * 0.055, -4.5, 4.5),
    overshootY: -clamp(deltaY * 0.045, -3, 3),
  };
}
