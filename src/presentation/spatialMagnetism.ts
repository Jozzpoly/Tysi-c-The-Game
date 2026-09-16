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

function targetSpan(rect: SpatialRect) {
  return Math.max(0, rect.right - rect.left, rect.bottom - rect.top);
}

function approachPadding(rect: SpatialRect, requestedPaddingPx: number, latched: boolean) {
  const span = targetSpan(rect);
  if (span >= 300) {
    return Math.max(requestedPaddingPx, latched ? 180 : 120);
  }
  return Math.max(requestedPaddingPx, latched ? 340 : 260);
}

function attractionField(rect: SpatialRect, requestedPaddingPx: number) {
  const span = targetSpan(rect);
  return Math.max(1, requestedPaddingPx, Math.min(620, Math.max(420, span * 1.05)));
}

export function pointInsideRect(point: SpatialPoint, rect: SpatialRect, paddingPx = 0) {
  return point.x >= rect.left - paddingPx
    && point.x <= rect.right + paddingPx
    && point.y >= rect.top - paddingPx
    && point.y <= rect.bottom + paddingPx;
}

/**
 * A carried card approaches both the trick and exchange recipients from the
 * player's hand below them. Make that natural approach forgiving while keeping
 * the top/side boundaries tight. This avoids turning a large part of the screen
 * into one symmetric hitbox or letting neighbouring exchange targets fight.
 */
export function magneticCapture(
  point: SpatialPoint,
  rect: SpatialRect,
  options: { latched: boolean; enterPaddingPx: number; releasePaddingPx: number },
) {
  const requested = Math.max(0, options.latched ? options.releasePaddingPx : options.enterPaddingPx);
  const bottomPadding = approachPadding(rect, requested, options.latched);
  return point.x >= rect.left - requested
    && point.x <= rect.right + requested
    && point.y >= rect.top - requested
    && point.y <= rect.bottom + bottomPadding;
}

/**
 * Return a continuous visual pull toward the nearest point of the canonical
 * target. Attraction begins well before acceptance, is almost imperceptible at
 * the outside edge, and strengthens smoothly on approach. The canonical target
 * never moves; this is presentation assistance only.
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
  const field = attractionField(rect, fieldPaddingPx);
  if (distance > field || distance < 0.001) return { x: 0, y: 0, strength: 0 };

  const strength = 1 - distance / field;
  const easedStrength = strength * strength * (3 - 2 * strength);
  const targetScaledPull = Math.min(36, targetSpan(rect) * 0.1);
  const effectiveMaxPull = Math.max(0, maxPullPx, targetScaledPull);
  const pullDistance = Math.min(distance, effectiveMaxPull * easedStrength);
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
 * Canonical occupancy wins over hysteresis. This matters when two generous
 * approach fields overlap: carrying a card visibly into another player's real
 * territory must switch targets immediately rather than remain stuck to the
 * previously latched recipient. Outside canonical rectangles, the preferred
 * target still receives the wider release field that prevents edge flicker.
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
  const canonical = targets
    .filter((target) => pointInsideRect(point, target.rect))
    .sort((a, b) => centerDistanceSquared(point, a.rect) - centerDistanceSquared(point, b.rect));
  if (canonical[0]) return canonical[0].id;

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
