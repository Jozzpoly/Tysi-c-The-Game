import type { Seat } from '../core/index.js';

export type TablePosition = 'self' | 'left' | 'right';

/**
 * Presentation-only topology for a three-seat table.
 *
 * Seat ids keep their canonical game meaning. Screen left/right is derived from
 * the current viewer so every human sees the same cyclic table rotated toward
 * themselves: viewer 0 => 1 left / 2 right; viewer 1 => 2 left / 0 right;
 * viewer 2 => 0 left / 1 right.
 */
export function seatPositionFromViewer(viewer: Seat, actor: Seat): TablePosition {
  if (viewer === actor) return 'self';
  const delta = (actor - viewer + 3) % 3;
  return delta === 1 ? 'left' : 'right';
}

export function opponentSeatsFromViewer(viewer: Seat): readonly [Seat, Seat] {
  return [((viewer + 1) % 3) as Seat, ((viewer + 2) % 3) as Seat];
}
