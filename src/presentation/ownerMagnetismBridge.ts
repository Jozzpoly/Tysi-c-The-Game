import { magneticOffsetToRect } from './spatialMagnetism.js';

const MOUSE_ENTER_PX = 24;
const TOUCH_ENTER_PX = 30;

type PointerSample = {
  x: number;
  y: number;
  pointerType: string;
};

let latestPointer: PointerSample | null = null;
let scheduledFrame: number | null = null;
let cachedShell: HTMLElement | null = null;
let cachedTargetKey = '';
let cachedTargetRect: DOMRect | null = null;

function shellNode() {
  if (cachedShell?.isConnected) return cachedShell;
  cachedShell = document.querySelector<HTMLElement>('.app-shell');
  return cachedShell;
}

function clearGeometryCache() {
  cachedTargetKey = '';
  cachedTargetRect = null;
}

function targetRect(node: HTMLElement, key: string) {
  if (cachedTargetKey === key && cachedTargetRect) return cachedTargetRect;
  cachedTargetKey = key;
  cachedTargetRect = node.getBoundingClientRect();
  return cachedTargetRect;
}

function clearMagnet(shell: HTMLElement | null) {
  if (!shell) return;
  shell.style.removeProperty('--owner-card-magnet-x');
  shell.style.removeProperty('--owner-card-magnet-y');
  delete shell.dataset.ownerCardMagnetStrength;
  delete shell.dataset.ownerCardMagnetTarget;
}

function applyMagnet(
  shell: HTMLElement,
  point: { x: number; y: number },
  rect: DOMRect,
  fieldPaddingPx: number,
  target: string,
) {
  const magnet = magneticOffsetToRect(point, rect, fieldPaddingPx, 10);
  shell.style.setProperty('--owner-card-magnet-x', `${magnet.x.toFixed(2)}px`);
  shell.style.setProperty('--owner-card-magnet-y', `${magnet.y.toFixed(2)}px`);
  shell.dataset.ownerCardMagnetStrength = magnet.strength.toFixed(3);
  shell.dataset.ownerCardMagnetTarget = target;
}

function renderOwnerMagnetism() {
  scheduledFrame = null;
  const sample = latestPointer;
  if (!sample) return;

  const shell = shellNode();
  // Table attraction is now owned entirely by TactileHand. Keep this bridge only
  // for exchange, where GameTable owns recipient selection/hysteresis.
  if (!shell || !shell.classList.contains('exchange-mode')) {
    clearMagnet(shell);
    return;
  }

  const floating = shell.querySelector<HTMLElement>('.tactile-card-float:not(.pending-handoff)');
  if (!floating) {
    clearMagnet(shell);
    return;
  }

  const targetId = shell.dataset.exchangeMagnetSeat ?? '';
  if (!targetId) {
    clearMagnet(shell);
    return;
  }
  const target = shell.querySelector<HTMLElement>(`[data-exchange-target-seat="${targetId}"]`);
  if (!target) {
    clearMagnet(shell);
    return;
  }

  const point = { x: sample.x, y: sample.y };
  const coarse = sample.pointerType === 'touch' || sample.pointerType === 'pen';
  const enterPaddingPx = coarse ? TOUCH_ENTER_PX : MOUSE_ENTER_PX;
  applyMagnet(shell, point, targetRect(target, `seat-${targetId}`), enterPaddingPx, `seat-${targetId}`);
}

function scheduleOwnerMagnetism(event: PointerEvent) {
  // Ordinary trick dragging has its own coalesced gesture owner; avoid scheduling
  // a second document-level frame for every pointer sample outside exchange.
  const shell = shellNode();
  if (!shell?.classList.contains('exchange-mode')) return;

  latestPointer = { x: event.clientX, y: event.clientY, pointerType: event.pointerType };
  if (scheduledFrame !== null) return;
  scheduledFrame = window.requestAnimationFrame(renderOwnerMagnetism);
}

function finishOwnerMagnetism() {
  latestPointer = null;
  if (scheduledFrame !== null) {
    window.cancelAnimationFrame(scheduledFrame);
    scheduledFrame = null;
  }
  clearGeometryCache();
  const shell = shellNode();
  clearMagnet(shell);
  cachedShell = null;
}

/**
 * Presentation-only exchange bridge. GameTable owns recipient acceptance and
 * hysteresis; this module only renders the corresponding tug. Table attraction
 * stays inside TactileHand so one gesture has one presentation owner.
 */
export function installOwnerMagnetismBridge() {
  document.addEventListener('pointermove', scheduleOwnerMagnetism, { capture: true, passive: true });
  document.addEventListener('pointerup', finishOwnerMagnetism, { capture: true, passive: true });
  document.addEventListener('pointercancel', finishOwnerMagnetism, { capture: true, passive: true });
}
