export interface SpatialPoint {
  x: number;
  y: number;
}

export interface SpatialRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface MagneticTarget<T> {
  id: T;
  rect: SpatialRect;
}

export interface MagneticOffset {
  x: number;
  y: number;
  strength: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function pointInsideRect(point: SpatialPoint, rect: SpatialRect, paddingPx = 0) {
  return point.x >= rect.left - paddingPx
    && point.x <= rect.right + paddingPx
    && point.y >= rect.top - paddingPx
    && point.y <= rect.bottom + paddingPx;
}

/**
 * A magnetic target is easier to enter than a strict hit rectangle, and harder
 * to accidentally leave once captured. The caller owns the `latched` bit so
 * this remains pure geometry rather than hidden interaction state.
 */
export function magneticCapture(
  point: SpatialPoint,
  rect: SpatialRect,
  options: { latched: boolean; enterPaddingPx: number; releasePaddingPx: number },
) {
  const padding = options.latched ? options.releasePaddingPx : options.enterPaddingPx;
  return pointInsideRect(point, rect, Math.max(0, padding));
}

/**
 * Return a small visual pull toward the nearest point of the canonical target.
 * The canonical rectangle itself never moves: assistance exists only while the
 * pointer/card centre is just outside it, and smoothly reaches zero at its edge.
 */
export function magneticOffsetToRect(
  point: SpatialPoint,
  rect: SpatialRect,
  fieldPaddingPx: number,
  maxPullPx: number,
): MagneticOffset {
  if (pointInsideRect(point, rect)) return { x: 0, y: 0, strength: 1 };

  const nearestX = clamp(point.x, rect.left, rect.right);
  const nearestY = clamp(point.y, rect.top, rect.bottom);
  const dx = nearestX - point.x;
  const dy = nearestY - point.y;
  const distance = Math.hypot(dx, dy);
  const field = Math.max(1, fieldPaddingPx);
  if (distance > field || distance < 0.001) return { x: 0, y: 0, strength: 0 };

  const strength = 1 - distance / field;
  const pullDistance = Math.min(
    Math.max(0, maxPullPx),
    distance * (0.25 + 0.35 * strength),
  );
  const scale = pullDistance / distance;
  return {
    x: dx * scale,
    y: dy * scale,
    strength,
  };
}

function centerDistanceSquared(point: SpatialPoint, rect: SpatialRect) {
  const centerX = (rect.left + rect.right) / 2;
  const centerY = (rect.top + rect.bottom) / 2;
  const dx = point.x - centerX;
  const dy = point.y - centerY;
  return dx * dx + dy * dy;
}

/**
 * Prefer an already captured target while the pointer remains in its wider
 * release field. Otherwise choose the nearest target whose enter field contains
 * the point. This prevents edge flicker and avoids first-DOM-node bias when two
 * generous fields overlap.
 */
export function chooseMagneticTarget<T>(
  point: SpatialPoint,
  targets: readonly MagneticTarget<T>[],
  options: {
    preferredId: T | null;
    enterPaddingPx: number;
    releasePaddingPx: number;
  },
): T | null {
  if (options.preferredId !== null) {
    const preferred = targets.find((target) => Object.is(target.id, options.preferredId));
    if (preferred && magneticCapture(point, preferred.rect, {
      latched: true,
      enterPaddingPx: options.enterPaddingPx,
      releasePaddingPx: options.releasePaddingPx,
    })) return preferred.id;
  }

  const candidates = targets
    .filter((target) => magneticCapture(point, target.rect, {
      latched: false,
      enterPaddingPx: options.enterPaddingPx,
      releasePaddingPx: options.releasePaddingPx,
    }))
    .sort((a, b) => centerDistanceSquared(point, a.rect) - centerDistanceSquared(point, b.rect));

  return candidates[0]?.id ?? null;
}
