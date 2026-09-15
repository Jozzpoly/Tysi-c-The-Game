import type { CardId } from '../core/index.js';

export const TACTILE_DRAG_SLOP = 6;
export const TACTILE_RELEASE_MS = 190;
export const TACTILE_RETURN_MS = 210;

export type TactileGesturePhase = 'pressed' | 'held' | 'table' | 'accepted';
export type TactileReleaseOutcome = 'tap' | 'return' | 'commit';

export interface TactilePointerState {
  card: CardId;
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  lastX: number;
  lastY: number;
  lastTimeMs: number;
  velocityX: number;
  velocityY: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  moved: boolean;
  throwIntent: boolean;
  commitReady: boolean;
  phase: TactileGesturePhase;
  zoneTop: number;
}

export interface BeginTactilePointerInput {
  card: CardId;
  pointerId: number;
  x: number;
  y: number;
  timeMs: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  zoneTop: number;
}

export interface AdvanceTactilePointerInput {
  x: number;
  y: number;
  timeMs: number;
  canCommit: boolean;
  inPlayZone: boolean;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function beginTactilePointer(input: BeginTactilePointerInput): TactilePointerState {
  return {
    card: input.card,
    pointerId: input.pointerId,
    startX: input.x,
    startY: input.y,
    x: input.x,
    y: input.y,
    lastX: input.x,
    lastY: input.y,
    lastTimeMs: input.timeMs,
    velocityX: 0,
    velocityY: 0,
    width: input.width,
    height: input.height,
    offsetX: input.offsetX,
    offsetY: input.offsetY,
    moved: false,
    throwIntent: false,
    commitReady: false,
    phase: 'pressed',
    zoneTop: input.zoneTop,
  };
}

export function advanceTactilePointer(state: TactilePointerState, input: AdvanceTactilePointerInput): TactilePointerState {
  const distance = Math.hypot(input.x - state.startX, input.y - state.startY);
  const moved = state.moved || distance >= TACTILE_DRAG_SLOP;
  // Run 05 P2: table intent is spatial. The presentation adapter measures the
  // real shared trick area and tells this pure gesture model whether the carried
  // card centre is inside it. Distance from the hand is no longer game intent.
  const throwIntent = moved && input.inPlayZone;
  const commitReady = throwIntent && input.canCommit;

  const dt = Math.max(1, input.timeMs - state.lastTimeMs);
  const rawVelocityX = (input.x - state.lastX) / dt;
  const rawVelocityY = (input.y - state.lastY) / dt;
  const velocityX = state.velocityX * 0.55 + rawVelocityX * 0.45;
  const velocityY = state.velocityY * 0.55 + rawVelocityY * 0.45;

  const phase: TactileGesturePhase = commitReady ? 'accepted' : throwIntent ? 'table' : moved ? 'held' : 'pressed';

  return {
    ...state,
    x: input.x,
    y: input.y,
    lastX: input.x,
    lastY: input.y,
    lastTimeMs: input.timeMs,
    velocityX,
    velocityY,
    moved,
    throwIntent,
    commitReady,
    phase,
  };
}

export function classifyTactileRelease(state: TactilePointerState, options: { cancelled: boolean; canCommit: boolean }): TactileReleaseOutcome {
  if (!state.moved) return 'tap';
  if (!options.cancelled && state.commitReady && options.canCommit) return 'commit';
  return 'return';
}

export function shouldReorderFromPointer(state: TactilePointerState) {
  return state.phase === 'held';
}

export function tactileTiltDegrees(state: Pick<TactilePointerState, 'x' | 'startX'>) {
  return clamp((state.x - state.startX) / 10, -12, 12);
}

export function reconcileHandOrder(order: readonly CardId[], cards: readonly CardId[]): CardId[] {
  const incoming = new Set(cards);
  const kept = order.filter((card) => incoming.has(card));
  const keptSet = new Set(kept);
  return [...kept, ...cards.filter((card) => !keptSet.has(card))];
}

export function moveCardInOrder(order: readonly CardId[], card: CardId, targetIndex: number): CardId[] {
  const sourceIndex = order.indexOf(card);
  if (sourceIndex < 0 || sourceIndex === targetIndex) return [...order];
  const next = [...order];
  next.splice(sourceIndex, 1);
  next.splice(Math.max(0, Math.min(targetIndex, next.length)), 0, card);
  return next;
}
