import { magneticOffsetToRect } from './spatialMagnetism.js';

const MOUSE_CUE_FIELD_PX = 24;
const TOUCH_CUE_FIELD_PX = 30;
const CUE_MAX_PULL_PX = 10;
const TAKEOVER_FRACTION = 0.48;
const MOUSE_TAKEOVER_MAX_PX = 86;
const TOUCH_TAKEOVER_MAX_PX = 104;
const FOLLOW_RATE = 0.42;
const RELEASE_FOLLOW_RATE = 0.34;
const SETTLE_EPSILON_PX = 0.25;

type PointerSample = {
  x: number;
  y: number;
  pointerType: string;
};

type MagnetRenderTarget = {
  x: number;
  y: number;
  target: string;
  mode: 'cue' | 'takeover' | 'return' | '';
};

let latestPointer: PointerSample | null = null;
let frameId: number | null = null;
let renderedX = 0;
let renderedY = 0;
let releasing = false;

function reducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function clearMagnet(shell: HTMLElement | null) {
  renderedX = 0;
  renderedY = 0;
  releasing = false;
  if (!shell) return;
  shell.style.removeProperty('--owner-card-magnet-x');
  shell.style.removeProperty('--owner-card-magnet-y');
  delete shell.dataset.ownerCardMagnetStrength;
  delete shell.dataset.ownerCardMagnetTarget;
  delete shell.dataset.ownerCardMagnetMode;
}

function targetCenterOffset(
  floating: HTMLElement,
  target: DOMRect,
  pointerType: string,
) {
  const rect = floating.getBoundingClientRect();
  // getBoundingClientRect includes our current CSS `translate`. Remove it so
  // repeated rAF samples do not feed the presentation offset back into itself.
  const sourceX = rect.left + rect.width / 2 - renderedX;
  const sourceY = rect.top + rect.height / 2 - renderedY;
  const targetX = target.left + target.width / 2;
  const targetY = target.top + target.height / 2;
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.001) return { x: 0, y: 0 };

  const coarse = pointerType === 'touch' || pointerType === 'pen';
  const maxPull = coarse ? TOUCH_TAKEOVER_MAX_PX : MOUSE_TAKEOVER_MAX_PX;
  const pull = Math.min(maxPull, distance * TAKEOVER_FRACTION);
  const scale = pull / distance;
  return { x: dx * scale, y: dy * scale };
}

function desiredMagnet(
  shell: HTMLElement,
  floating: HTMLElement,
  pointer: PointerSample,
): MagnetRenderTarget {
  if (reducedMotion()) return { x: 0, y: 0, target: '', mode: '' };

  if (shell.classList.contains('exchange-mode')) {
    // GameTable owns exchange target choice and hysteresis. This bridge only
    // renders the already-published target; it never independently chooses one.
    const seat = shell.dataset.exchangeMagnetSeat ?? '';
    if (!seat) return { x: 0, y: 0, target: '', mode: 'return' };
    const recipient = shell.querySelector<HTMLElement>(`[data-exchange-target-seat="${seat}"] .card-backs`)
      ?? shell.querySelector<HTMLElement>(`[data-exchange-target-seat="${seat}"]`);
    if (!recipient) return { x: 0, y: 0, target: '', mode: 'return' };
    const offset = targetCenterOffset(floating, recipient.getBoundingClientRect(), pointer.pointerType);
    return { ...offset, target: `seat-${seat}`, mode: 'takeover' };
  }

  const heldThrowable = shell.querySelector('.tactile-hand > .hand-slot.is-held.is-throwable');
  const trick = shell.querySelector<HTMLElement>('.trick');
  if (!heldThrowable || !trick) return { x: 0, y: 0, target: '', mode: 'return' };

  if (floating.classList.contains('commit-ready')) {
    // TactileHand owns play acceptance. Once it says the table can take the
    // card, presentation visibly transfers some spatial ownership toward the
    // canonical table locus while the pointer remains free to retreat.
    const offset = targetCenterOffset(floating, trick.getBoundingClientRect(), pointer.pointerType);
    return { ...offset, target: 'table', mode: 'takeover' };
  }

  // Before acceptance, retain only the weak approach cue. If TactileHand has
  // already applied its native bounded magnet, do not stack another early pull.
  if (Number(floating.dataset.magnetStrength ?? '0') > 0) {
    return { x: 0, y: 0, target: '', mode: 'return' };
  }
  const coarse = pointer.pointerType === 'touch' || pointer.pointerType === 'pen';
  const cue = magneticOffsetToRect(
    { x: pointer.x, y: pointer.y },
    trick.getBoundingClientRect(),
    coarse ? TOUCH_CUE_FIELD_PX : MOUSE_CUE_FIELD_PX,
    CUE_MAX_PULL_PX,
  );
  return cue.strength > 0
    ? { x: cue.x, y: cue.y, target: 'table', mode: 'cue' }
    : { x: 0, y: 0, target: '', mode: 'return' };
}

function writeRenderedState(shell: HTMLElement, target: string, mode: string, desiredDistance: number) {
  shell.style.setProperty('--owner-card-magnet-x', `${renderedX.toFixed(2)}px`);
  shell.style.setProperty('--owner-card-magnet-y', `${renderedY.toFixed(2)}px`);
  shell.dataset.ownerCardMagnetTarget = target;
  shell.dataset.ownerCardMagnetMode = mode;
  const renderedDistance = Math.hypot(renderedX, renderedY);
  const scale = Math.max(1, desiredDistance, MOUSE_TAKEOVER_MAX_PX);
  shell.dataset.ownerCardMagnetStrength = Math.min(1, renderedDistance / scale).toFixed(3);
}

function renderOwnerMagnetism() {
  frameId = null;
  const shell = document.querySelector<HTMLElement>('.app-shell');
  if (!shell) {
    clearMagnet(null);
    return;
  }

  // On release, keep the currently rendered offset alive for the first physical
  // handoff frame and decay it toward zero. Pending-handoff therefore starts at
  // the exact visible takeover position instead of snapping back toward pointer.
  if (releasing) {
    renderedX += (0 - renderedX) * RELEASE_FOLLOW_RATE;
    renderedY += (0 - renderedY) * RELEASE_FOLLOW_RATE;
    if (Math.abs(renderedX) < SETTLE_EPSILON_PX) renderedX = 0;
    if (Math.abs(renderedY) < SETTLE_EPSILON_PX) renderedY = 0;
    writeRenderedState(shell, '', 'release', MOUSE_TAKEOVER_MAX_PX);
    if (renderedX !== 0 || renderedY !== 0) frameId = window.requestAnimationFrame(renderOwnerMagnetism);
    else clearMagnet(shell);
    return;
  }

  const floating = shell.querySelector<HTMLElement>('.tactile-card-float:not(.pending-handoff)');
  if (!floating || !latestPointer) {
    clearMagnet(shell);
    return;
  }

  const desired = desiredMagnet(shell, floating, latestPointer);
  renderedX += (desired.x - renderedX) * FOLLOW_RATE;
  renderedY += (desired.y - renderedY) * FOLLOW_RATE;

  if (Math.abs(renderedX) < SETTLE_EPSILON_PX && Math.abs(desired.x) < SETTLE_EPSILON_PX) renderedX = 0;
  if (Math.abs(renderedY) < SETTLE_EPSILON_PX && Math.abs(desired.y) < SETTLE_EPSILON_PX) renderedY = 0;

  writeRenderedState(
    shell,
    desired.target,
    desired.mode || (renderedX || renderedY ? 'return' : ''),
    Math.hypot(desired.x, desired.y),
  );

  const unsettled = Math.abs(desired.x - renderedX) > SETTLE_EPSILON_PX
    || Math.abs(desired.y - renderedY) > SETTLE_EPSILON_PX;
  if (unsettled) frameId = window.requestAnimationFrame(renderOwnerMagnetism);
  else if (!desired.target && renderedX === 0 && renderedY === 0) clearMagnet(shell);
}

function scheduleOwnerMagnetism(event: PointerEvent) {
  releasing = false;
  latestPointer = { x: event.clientX, y: event.clientY, pointerType: event.pointerType };
  if (frameId === null) frameId = window.requestAnimationFrame(renderOwnerMagnetism);
}

function finishOwnerMagnetism() {
  latestPointer = null;
  releasing = renderedX !== 0 || renderedY !== 0;
  if (frameId !== null) {
    window.cancelAnimationFrame(frameId);
    frameId = null;
  }
  if (releasing) frameId = window.requestAnimationFrame(renderOwnerMagnetism);
  else clearMagnet(document.querySelector<HTMLElement>('.app-shell'));
}

/**
 * Presentation-only bridge. Existing interaction owners decide whether a valid
 * destination has captured the card. This adapter merely renders a weak cue and
 * then a reversible physical takeover; it never emits game commands.
 */
export function installOwnerMagnetismBridge() {
  document.addEventListener('pointermove', scheduleOwnerMagnetism, { capture: true, passive: true });
  document.addEventListener('pointerup', finishOwnerMagnetism, { capture: true, passive: true });
  document.addEventListener('pointercancel', finishOwnerMagnetism, { capture: true, passive: true });
}
