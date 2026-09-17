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

function enableCompositorDrag(floating: HTMLElement) {
  // React still owns the exact drag position through its inline left/top values.
  // Sample those once per visual frame, then let CSS move the active ghost using
  // the compositor-friendly individual `translate` property. The inline values
  // remain intact so pointer-up can drop the class and hand the exact same
  // geometry to the existing pending-handoff path without conversion.
  const left = floating.style.left;
  const top = floating.style.top;
  if (!left || !top) return;
  floating.style.setProperty('--owner-card-drag-x', left);
  floating.style.setProperty('--owner-card-drag-y', top);
  floating.classList.add('is-compositor-drag');
}

function disableCompositorDrag(shell: HTMLElement | null) {
  const floating = shell?.querySelector<HTMLElement>('.tactile-card-float.is-compositor-drag');
  if (!floating) return;
  floating.classList.remove('is-compositor-drag');
  floating.style.removeProperty('--owner-card-drag-x');
  floating.style.removeProperty('--owner-card-drag-y');
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
  const floating = shell?.querySelector<HTMLElement>('.tactile-card-float:not(.pending-handoff)');
  if (!shell || !floating) {
    clearMagnet(shell);
    return;
  }

  enableCompositorDrag(floating);

  const point = { x: sample.x, y: sample.y };
  const coarse = sample.pointerType === 'touch' || sample.pointerType === 'pen';
  const enterPaddingPx = coarse ? TOUCH_ENTER_PX : MOUSE_ENTER_PX;

  if (shell.classList.contains('exchange-mode')) {
    // GameTable already owns recipient hit-testing and hysteresis. Reuse that
    // authoritative presentation choice instead of performing a second full
    // target scan and another pair of layout reads for every pointer sample.
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
    applyMagnet(shell, point, targetRect(target, `seat-${targetId}`), enterPaddingPx, `seat-${targetId}`);
    return;
  }

  const heldThrowable = shell.querySelector('.tactile-hand > .hand-slot.is-held.is-throwable');
  const trick = shell.querySelector<HTMLElement>('.trick');
  if (!heldThrowable || !trick) {
    clearMagnet(shell);
    return;
  }

  // TactileHand owns the accepted-zone pull. This bridge only supplies the weak
  // earlier approach cue, so the two presentation offsets never stack.
  if (Number(floating.dataset.magnetStrength ?? '0') > 0) {
    clearMagnet(shell);
    return;
  }
  applyMagnet(shell, point, targetRect(trick, 'table'), enterPaddingPx, 'table');
}

function scheduleOwnerMagnetism(event: PointerEvent) {
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
  disableCompositorDrag(shell);
  clearMagnet(shell);
  cachedShell = null;
}

/**
 * Presentation-only bridge. It makes the already-authoritative table/exchange
 * targets physically tug the carried card before release; it never emits game
 * commands or owns acceptance state.
 */
export function installOwnerMagnetismBridge() {
  document.addEventListener('pointermove', scheduleOwnerMagnetism, { capture: true, passive: true });
  document.addEventListener('pointerup', finishOwnerMagnetism, { capture: true, passive: true });
  document.addEventListener('pointercancel', finishOwnerMagnetism, { capture: true, passive: true });
}
