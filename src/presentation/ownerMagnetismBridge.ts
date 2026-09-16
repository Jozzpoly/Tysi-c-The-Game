import { chooseMagneticTarget, magneticOffsetToRect } from './spatialMagnetism.js';

const MOUSE_ENTER_PX = 24;
const MOUSE_RELEASE_PX = 40;
const TOUCH_ENTER_PX = 30;
const TOUCH_RELEASE_PX = 48;

let preferredExchangeTarget: string | null = null;

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

function updateOwnerMagnetism(event: PointerEvent) {
  const shell = document.querySelector<HTMLElement>('.app-shell');
  const floating = shell?.querySelector<HTMLElement>('.tactile-card-float:not(.pending-handoff)');
  if (!shell || !floating) {
    preferredExchangeTarget = null;
    clearMagnet(shell);
    return;
  }

  const point = { x: event.clientX, y: event.clientY };
  const coarse = event.pointerType === 'touch' || event.pointerType === 'pen';
  const enterPaddingPx = coarse ? TOUCH_ENTER_PX : MOUSE_ENTER_PX;
  const releasePaddingPx = coarse ? TOUCH_RELEASE_PX : MOUSE_RELEASE_PX;

  if (shell.classList.contains('exchange-mode')) {
    const targets = [...shell.querySelectorAll<HTMLElement>('[data-exchange-target-seat]')]
      .map((node) => ({ id: node.dataset.exchangeTargetSeat ?? '', rect: node.getBoundingClientRect() }))
      .filter((target) => target.id !== '');
    const targetId = chooseMagneticTarget(point, targets, {
      preferredId: preferredExchangeTarget,
      enterPaddingPx,
      releasePaddingPx,
    });
    preferredExchangeTarget = targetId;
    const target = targets.find((candidate) => candidate.id === targetId);
    if (target) {
      applyMagnet(shell, point, target.rect, enterPaddingPx, `seat-${target.id}`);
      return;
    }
    clearMagnet(shell);
    return;
  }

  preferredExchangeTarget = null;
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
  applyMagnet(shell, point, trick.getBoundingClientRect(), enterPaddingPx, 'table');
}

function finishOwnerMagnetism() {
  preferredExchangeTarget = null;
  clearMagnet(document.querySelector<HTMLElement>('.app-shell'));
}

/**
 * Presentation-only bridge. It makes the already-authoritative table/exchange
 * targets physically tug the carried card before release; it never emits game
 * commands or owns acceptance state.
 */
export function installOwnerMagnetismBridge() {
  document.addEventListener('pointermove', updateOwnerMagnetism, { capture: true, passive: true });
  document.addEventListener('pointerup', finishOwnerMagnetism, { capture: true, passive: true });
  document.addEventListener('pointercancel', finishOwnerMagnetism, { capture: true, passive: true });
}
