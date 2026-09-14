export interface HandInsertionPreview {
  sourceIndex: number;
  position: number;
  targetIndex: number;
  stepPx: number;
  shiftsPx: readonly number[];
}

export const INSERTION_TARGET_HYSTERESIS = 0.12;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function median(values: readonly number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function signedShift(stepPx: number, progress: number, direction: -1 | 1) {
  const amount = stepPx * clamp(progress, 0, 1);
  return amount === 0 ? 0 : amount * direction;
}

export function estimateHandStep(centers: readonly number[]): number {
  const positive = centers
    .slice(1)
    .map((center, index) => center - centers[index])
    .filter((distance) => Number.isFinite(distance) && distance > 0.5);
  return median(positive);
}

export function fractionalInsertionPosition(
  heldCenterX: number,
  centers: readonly number[],
): number {
  if (centers.length <= 1) return 0;
  if (heldCenterX <= centers[0]) return 0;
  const lastIndex = centers.length - 1;
  if (heldCenterX >= centers[lastIndex]) return lastIndex;

  for (let index = 0; index < lastIndex; index += 1) {
    const left = centers[index];
    const right = centers[index + 1];
    if (heldCenterX > right) continue;
    const span = Math.max(1, right - left);
    return index + clamp((heldCenterX - left) / span, 0, 1);
  }

  return lastIndex;
}

export function stabilizeInsertionTarget(input: {
  position: number;
  previousTarget: number;
  slotCount: number;
  hysteresis?: number;
}): number {
  if (input.slotCount <= 0) return 0;
  const lastIndex = input.slotCount - 1;
  const previous = clamp(Math.round(input.previousTarget), 0, lastIndex);
  const candidate = clamp(Math.round(input.position), 0, lastIndex);
  if (candidate === previous) return previous;

  const margin = Math.max(0, Math.min(0.49, input.hysteresis ?? INSERTION_TARGET_HYSTERESIS));
  if (candidate > previous) {
    return input.position >= previous + 0.5 + margin ? candidate : previous;
  }
  return input.position <= previous - 0.5 - margin ? candidate : previous;
}

export function computeHandInsertionPreview(input: {
  sourceIndex: number;
  heldCenterX: number;
  centers: readonly number[];
}): HandInsertionPreview {
  const { sourceIndex, centers } = input;
  if (centers.length === 0) {
    return { sourceIndex: 0, position: 0, targetIndex: 0, stepPx: 0, shiftsPx: [] };
  }

  const safeSource = clamp(sourceIndex, 0, centers.length - 1);
  const position = fractionalInsertionPosition(input.heldCenterX, centers);
  const stepPx = estimateHandStep(centers);
  const shiftsPx = centers.map((_, index) => {
    if (index === safeSource || stepPx <= 0) return 0;

    if (position > safeSource && index > safeSource) {
      return signedShift(stepPx, position - (index - 1), -1);
    }

    if (position < safeSource && index < safeSource) {
      return signedShift(stepPx, (index + 1) - position, 1);
    }

    return 0;
  });

  return {
    sourceIndex: safeSource,
    position,
    targetIndex: clamp(Math.round(position), 0, centers.length - 1),
    stepPx,
    shiftsPx,
  };
}
