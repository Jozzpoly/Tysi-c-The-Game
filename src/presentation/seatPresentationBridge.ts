import type { Seat } from '../core/index.js';
import { seatPositionFromViewer } from './seatTopology.js';

const OPPONENT_PLAY_FLIGHT_MS = 230;

function seatFrom(value: string | undefined): Seat | null {
  if (value === '0') return 0;
  if (value === '1') return 1;
  if (value === '2') return 2;
  return null;
}

function viewerSeat(shell: HTMLElement): Seat | null {
  const hand = shell.querySelector<HTMLElement>('.hand-area[data-seat-anchor]');
  return seatFrom(hand?.dataset.seatAnchor);
}

function sourceNodeForSeat(shell: HTMLElement, seat: Seat): HTMLElement | null {
  const anchor = shell.querySelector<HTMLElement>(`[data-seat-anchor="${seat}"]`);
  if (!anchor) return null;
  return anchor.querySelector<HTMLElement>('.card-backs i:last-child')
    ?? anchor.querySelector<HTMLElement>('.card-backs')
    ?? anchor;
}

function marriageOwnsFreshCard(shell: HTMLElement, card: string) {
  return [...shell.querySelectorAll<HTMLElement>('[data-marriage-material-state="active"]')]
    .some((node) => node.dataset.marriageMaterialCard === card);
}

function animateOpponentPlay(shell: HTMLElement, played: HTMLElement, seat: Seat) {
  if (played.dataset.materialPlayArrival) return;
  const cardId = played.dataset.card ?? '';
  if (!cardId || marriageOwnsFreshCard(shell, cardId)) {
    played.dataset.materialPlayArrival = 'delegated';
    return;
  }

  const source = sourceNodeForSeat(shell, seat);
  const card = played.querySelector<HTMLElement>(':scope > .card') ?? played;
  if (!source) {
    played.dataset.materialPlayArrival = 'fallback';
    return;
  }

  played.dataset.materialPlayArrival = 'active';
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  if (reduced) {
    played.dataset.materialPlayArrival = 'complete';
    return;
  }

  const sourceRect = source.getBoundingClientRect();
  const targetRect = card.getBoundingClientRect();
  const sourceX = sourceRect.left + sourceRect.width / 2;
  const sourceY = sourceRect.top + sourceRect.height / 2;
  const targetX = targetRect.left + targetRect.width / 2;
  const targetY = targetRect.top + targetRect.height / 2;
  const dx = sourceX - targetX;
  const dy = sourceY - targetY;
  const position = played.dataset.viewPosition;
  const startRotate = position === 'left' ? -7 : 7;
  const sourceScale = Math.max(.58, Math.min(.82, sourceRect.width / Math.max(1, targetRect.width)));

  played.getAnimations().forEach((animation) => animation.cancel());
  const animation = played.animate(
    [
      {
        transform: `translate(${dx}px, ${dy}px) scale(${sourceScale.toFixed(3)}) rotate(${startRotate}deg)`,
        opacity: .38,
        offset: 0,
      },
      {
        transform: `translate(${dx * .18}px, ${dy * .12}px) scale(1.02) rotate(${-startRotate * .12}deg)`,
        opacity: 1,
        offset: .78,
      },
      { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1, offset: 1 },
    ],
    {
      duration: OPPONENT_PLAY_FLIGHT_MS,
      easing: 'cubic-bezier(.18,.82,.24,1)',
    },
  );
  animation.addEventListener('finish', () => {
    played.dataset.materialPlayArrival = 'complete';
  }, { once: true });
}

function synchronizeSeatPresentation() {
  const shell = document.querySelector<HTMLElement>('.app-shell');
  if (!shell) return;
  const viewer = viewerSeat(shell);
  if (viewer === null) return;
  shell.dataset.viewerSeat = String(viewer);

  for (const anchor of shell.querySelectorAll<HTMLElement>('[data-seat-anchor]')) {
    const seat = seatFrom(anchor.dataset.seatAnchor);
    if (seat === null) continue;
    const position = seatPositionFromViewer(viewer, seat);
    if (anchor.dataset.viewPosition !== position) anchor.dataset.viewPosition = position;
  }

  for (const played of shell.querySelectorAll<HTMLElement>('.trick .played[data-seat]')) {
    const seat = seatFrom(played.dataset.seat);
    if (seat === null) continue;
    const position = seatPositionFromViewer(viewer, seat);
    if (played.dataset.viewPosition !== position) played.dataset.viewPosition = position;
    if (position !== 'self' && played.classList.contains('is-fresh-arrival')) {
      animateOpponentPlay(shell, played, seat);
    }
  }
}

/**
 * Presentation-only adapter between canonical seat ids and viewer-relative table
 * geometry. It also gives ordinary opponent plays the same source->destination
 * continuity already used by deal/exchange/capture. No commands or game truth are
 * emitted or modified here.
 */
export function installSeatPresentationBridge() {
  const observer = new MutationObserver(() => synchronizeSeatPresentation());
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'data-seat', 'data-seat-anchor'],
  });
  synchronizeSeatPresentation();
  return () => observer.disconnect();
}
