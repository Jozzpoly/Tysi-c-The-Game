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
