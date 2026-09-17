import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  rankOf,
  suitOf,
  type CardId,
  type Command,
  type GameEvent,
  type Seat,
  type SeatProjection,
} from '../core/index.js';
import { RulesGuide } from './RulesGuide.js';
import { ScoreSummary } from './ScoreSummary.js';
import { chooseMagneticTarget } from './spatialMagnetism.js';
import { TactileHand } from './TactileHand.js';
import {
  TRICK_COMPLETION_TIMELINE,
  planTrickPresentation,
  type TrickCompletionStage,
} from './trickPresentation.js';

const SUIT_SYMBOL = { spades: '♠', clubs: '♣', diamonds: '♦', hearts: '♥' } as const;
const ALL_SEATS: readonly Seat[] = [0, 1, 2];
const EXCHANGE_MAGNET_MOUSE_ENTER_PX = 24;
const EXCHANGE_MAGNET_MOUSE_RELEASE_PX = 40;
const EXCHANGE_MAGNET_TOUCH_ENTER_PX = 30;
const EXCHANGE_MAGNET_TOUCH_RELEASE_PX = 48;
const EXCHANGE_STAGE_MOTION_MS = 260;
const EXCHANGE_STAGE_DWELL_MS = 180;
type ExchangeDraft = Partial<Record<Seat, CardId>>;

export interface GameTableProps {
  projection: SeatProjection;
  seatNames: readonly [string, string, string];
  events?: readonly GameEvent[];
  message?: string;
  onCommand: (command: Command) => void | Promise<void>;
  onNewGame?: () => void;
}

function Card({ card, disabled, selected, onClick }: { card: CardId; disabled?: boolean; selected?: boolean; onClick?: () => void }) {
  const suit = suitOf(card);
  const rank = rankOf(card);
  const symbol = SUIT_SYMBOL[suit];
  const red = suit === 'hearts' || suit === 'diamonds';
  return (
    <button
      className={`card ${red ? 'red' : ''} ${selected ? 'selected' : ''}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={`${rank} ${suit}`}
      data-rank={rank}
      data-suit={symbol}
    >
      <span className="rank" data-suit={symbol}>{rank}</span>
      <span className="suit">{symbol}</span>
    </button>
  );
}

export function GameTable({ projection, seatNames, events = [], message = '', onCommand, onNewGame }: GameTableProps) {
  const view = projection.observation;
  const humanSeat = view.seat;
  const [exchangeDraft, setExchangeDraft] = useState<ExchangeDraft>({});
  const [exchangeHoverSeat, setExchangeHoverSeat] = useState<Seat | null>(null);
  const [exchangeSubmitting, setExchangeSubmitting] = useState(false);
  const [confirmBomb, setConfirmBomb] = useState(false);
  const [trickCompletionStage, setTrickCompletionStage] = useState<TrickCompletionStage>('settled');
  const [trickStageRevision, setTrickStageRevision] = useState<number | null>(null);
  const exchangeTargetRects = useRef<ReadonlyArray<{ id: Seat; rect: DOMRect }> | null>(null);
  const exchangeStageAnimations = useRef<Map<CardId, Animation>>(new Map());
  const trickPresentation = useMemo(() => planTrickPresentation(events), [events]);
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const displayedTrickStage: TrickCompletionStage = trickPresentation.kind === 'trick-completion' && trickStageRevision !== view.revision
    ? prefersReducedMotion ? 'consequence' : 'arrival'
    : trickCompletionStage;
  const presentationBlocksInput = trickPresentation.kind === 'trick-completion' && displayedTrickStage !== 'settled';
  const humanCommands = presentationBlocksInput ? [] : projection.legalCommands;

  useEffect(() => {
    setExchangeDraft({});
    setExchangeHoverSeat(null);
    setExchangeSubmitting(false);
    setConfirmBomb(false);
    exchangeTargetRects.current = null;
    for (const animation of exchangeStageAnimations.current.values()) animation.cancel();
    exchangeStageAnimations.current.clear();
  }, [view.revision]);

  useEffect(() => {
    if (trickPresentation.kind !== 'trick-completion') {
      setTrickStageRevision(null);
      setTrickCompletionStage('settled');
      return;
    }

    const timers: number[] = [];
    setTrickStageRevision(view.revision);
    setTrickCompletionStage(prefersReducedMotion ? 'consequence' : 'arrival');

    if (!prefersReducedMotion) {
      timers.push(window.setTimeout(() => setTrickCompletionStage('resolve'), TRICK_COMPLETION_TIMELINE.resolveMs));
      timers.push(window.setTimeout(() => setTrickCompletionStage('collect'), TRICK_COMPLETION_TIMELINE.collectMs));
      timers.push(window.setTimeout(() => setTrickCompletionStage('consequence'), TRICK_COMPLETION_TIMELINE.consequenceMs));
    }
    timers.push(window.setTimeout(() => setTrickCompletionStage('settled'), TRICK_COMPLETION_TIMELINE.settleMs));

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [prefersReducedMotion, trickPresentation.kind, view.revision]);

  const seatName = (seat: Seat) => seatNames[seat];
  const seatAction = (seat: Seat, you: string, thirdPerson: string) => seat === humanSeat ? you : `${seatName(seat)} ${thirdPerson}`;
  const seatRole = (seat: Seat) => {
    const role = view.dealer === seat ? 'rozdaje' : view.declarer === seat ? 'gra' : '';
    const bombs = view.bombsUsed[seat] > 0 ? `bomby: ${view.bombsUsed[seat]}` : '';
    return [role, bombs].filter(Boolean).join(' · ');
  };
  const opponentSeats = ALL_SEATS.filter((seat) => seat !== humanSeat);
  const playPosition = (seat: Seat) => seat === humanSeat ? 'self' : seat === opponentSeats[0] ? 'left' : 'right';
  const humanCards = view.ownHand;
  const playable = new Set(
    humanCommands.filter((command): command is Extract<Command, { type: 'play' }> => command.type === 'play').map((command) => command.card),
  );
  const marriageCards = new Set(
    humanCommands
      .filter((command): command is Extract<Command, { type: 'play' }> => command.type === 'play' && Boolean(command.declareMarriage))
      .map((command) => command.card),
  );
  const bids = humanCommands.filter((command): command is Extract<Command, { type: 'bid' }> => command.type === 'bid');
  const pass = humanCommands.find((command): command is Extract<Command, { type: 'pass' }> => command.type === 'pass');
  const bomb = humanCommands.find((command): command is Extract<Command, { type: 'bomb' }> => command.type === 'bomb');
  const exchanges = humanCommands.filter((command): command is Extract<Command, { type: 'exchange' }> => command.type === 'exchange');
  const requestRedeal = humanCommands.find((command): command is Extract<Command, { type: 'request-redeal' }> => command.type === 'request-redeal');
  const continueAfterFourNines = humanCommands.find(
    (command): command is Extract<Command, { type: 'continue-after-four-nines' }> => command.type === 'continue-after-four-nines',
  );
  const contracts = humanCommands.filter((command): command is Extract<Command, { type: 'contract' }> => command.type === 'contract');
  const nextHand = humanCommands.find((command): command is Extract<Command, { type: 'next-hand' }> => command.type === 'next-hand');
  const exchangeMode = view.phase === 'exchange' && exchanges.length > 0 && !confirmBomb;
  const selectedTransfer: CardId[] = opponentSeats.flatMap((seat) => {
    const card = exchangeDraft[seat];
    return card ? [card] : [];
  });
  const assignedExchangeCount = selectedTransfer.length;
  const handActionable = exchangeMode ? new Set<CardId>(humanCards) : playable;
  const throwableCards = view.phase === 'trick' ? playable : new Set<CardId>();

  function stagedSeatForCard(card: CardId): Seat | null {
    return opponentSeats.find((seat) => exchangeDraft[seat] === card) ?? null;
  }

  function stageExchangeCard(card: CardId, to: Seat) {
    if (!exchangeMode || exchangeSubmitting || to === humanSeat || !humanCards.includes(card)) return;
    setExchangeDraft((current) => {
      const next: ExchangeDraft = { ...current };
      for (const seat of opponentSeats) {
        if (next[seat] === card) delete next[seat];
      }
      next[to] = card;
      return next;
    });
  }

  function unstageExchangeCard(card: CardId) {
    setExchangeDraft((current) => {
      const next: ExchangeDraft = { ...current };
      let changed = false;
      for (const seat of opponentSeats) {
        if (next[seat] === card) {
          delete next[seat];
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }

  function exchangeCardFromPointerTarget(target: EventTarget | null): CardId | null {
    if (!(target instanceof Element)) return null;
    const slot = target.closest<HTMLElement>('.hand-slot[data-card]');
    return slot?.dataset.card as CardId | undefined ?? null;
  }

  function readExchangeTargets() {
    if (exchangeTargetRects.current) return exchangeTargetRects.current;
    const targets = opponentSeats.flatMap((seat) => {
      const target = document.querySelector<HTMLElement>(`[data-exchange-target-seat="${seat}"]`);
      return target ? [{ id: seat, rect: target.getBoundingClientRect() }] : [];
    });
    exchangeTargetRects.current = targets;
    return targets;
  }

  function exchangeTargetAt(clientX: number, clientY: number, pointerType: string): Seat | null {
    if (!exchangeMode) return null;
    const coarse = pointerType === 'touch' || pointerType === 'pen';
    return chooseMagneticTarget({ x: clientX, y: clientY }, readExchangeTargets(), {
      preferredId: exchangeHoverSeat,
      enterPaddingPx: coarse ? EXCHANGE_MAGNET_TOUCH_ENTER_PX : EXCHANGE_MAGNET_MOUSE_ENTER_PX,
      releasePaddingPx: coarse ? EXCHANGE_MAGNET_TOUCH_RELEASE_PX : EXCHANGE_MAGNET_MOUSE_RELEASE_PX,
    });
  }

  function handleExchangePointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (!exchangeMode || exchangeSubmitting) return;
    const card = exchangeCardFromPointerTarget(event.target);
    if (!card || !humanCards.includes(card)) return;
    const target = exchangeTargetAt(event.clientX, event.clientY, event.pointerType);
    setExchangeHoverSeat((current) => current === target ? current : target);
  }

  function handleExchangePointerUp(event: ReactPointerEvent<HTMLElement>) {
    if (!exchangeMode || exchangeSubmitting) return;
    const card = exchangeCardFromPointerTarget(event.target);
    if (!card || !humanCards.includes(card)) {
      exchangeTargetRects.current = null;
      setExchangeHoverSeat(null);
      return;
    }
    const target = exchangeTargetAt(event.clientX, event.clientY, event.pointerType);
    if (target !== null) stageExchangeCard(card, target);
    else if (stagedSeatForCard(card) !== null) unstageExchangeCard(card);
    exchangeTargetRects.current = null;
    setExchangeHoverSeat(null);
  }

  useLayoutEffect(() => {
    const expected = new Map<CardId, Seat>();
    if (exchangeMode) {
      for (const seat of opponentSeats) {
        const card = exchangeDraft[seat];
        if (card) expected.set(card, seat);
      }
    }

    // Preserve already-staged cards across the second assignment. Clearing and
    // rebuilding every staged slot made the first physical card re-enter from the
    // hand when the draft changed, which reads as a UI reset rather than ownership.
    for (const slot of document.querySelectorAll<HTMLElement>('.hand-slot.is-exchange-staged')) {
      const card = slot.dataset.card as CardId | undefined;
      const seat = card ? expected.get(card) : undefined;
      if (seat !== undefined && slot.dataset.exchangeRecipient === String(seat)) continue;
      if (card) {
        exchangeStageAnimations.current.get(card)?.cancel();
        exchangeStageAnimations.current.delete(card);
      }
      slot.classList.remove('is-exchange-staged');
      delete slot.dataset.exchangeRecipient;
      slot.style.removeProperty('--exchange-stage-x');
      slot.style.removeProperty('--exchange-stage-y');
    }

    if (!exchangeMode) return;

    for (const seat of opponentSeats) {
      const card = exchangeDraft[seat];
      if (!card) continue;
      const slot = document.querySelector<HTMLElement>(`.hand-slot[data-card="${card}"]`);
      const cardNode = slot?.querySelector<HTMLElement>(':scope > .card');
      const stageTarget = document.querySelector<HTMLElement>(`[data-exchange-target-seat="${seat}"] .card-backs`);
      if (!slot || !cardNode || !stageTarget) continue;

      const alreadyStaged = slot.classList.contains('is-exchange-staged')
        && slot.dataset.exchangeRecipient === String(seat);
      const computed = getComputedStyle(slot);
      const translateParts = computed.translate === 'none'
        ? []
        : computed.translate.split(/\s+/).map((part) => Number.parseFloat(part));
      const currentTranslateX = Number.isFinite(translateParts[0]) ? translateParts[0]! : 0;
      const currentTranslateY = Number.isFinite(translateParts[1]) ? translateParts[1]! : 0;
      const currentScale = Number.isFinite(Number.parseFloat(computed.scale))
        ? Number.parseFloat(computed.scale)
        : 1;

      // The tactile hand starts its generic return-to-hand animation before the
      // parent sees pointer-up. Capture the visible geometry first, then cancel
      // any old stage/return motion so the next animation starts from that truth.
      const source = cardNode.getBoundingClientRect();
      exchangeStageAnimations.current.get(card)?.cancel();
      exchangeStageAnimations.current.delete(card);
      if (!alreadyStaged) {
        slot.getAnimations().forEach((animation) => animation.cancel());
      }

      const target = stageTarget.getBoundingClientRect();
      const sourceX = source.left + source.width / 2;
      const sourceY = source.top + source.height / 2;
      const targetX = target.left + target.width / 2;
      const targetY = target.top + target.height / 2;
      const stageX = currentTranslateX + targetX - sourceX;
      const stageY = currentTranslateY + targetY - sourceY;
      const coarse = window.matchMedia?.('(pointer: coarse), (max-width: 620px)').matches ?? false;
      const finalScale = coarse ? .70 : .66;

      slot.style.setProperty('--exchange-stage-x', `${stageX}px`);
      slot.style.setProperty('--exchange-stage-y', `${stageY}px`);
      slot.dataset.exchangeRecipient = String(seat);
      slot.classList.add('is-exchange-staged');

      const needsMotion = Math.hypot(targetX - sourceX, targetY - sourceY) > .5
        || Math.abs(currentScale - finalScale) > .005;
      if (!prefersReducedMotion && needsMotion) {
        const animation = slot.animate(
          [
            { translate: `${currentTranslateX}px ${currentTranslateY}px`, scale: String(currentScale), offset: 0 },
            { translate: `${stageX}px ${stageY}px`, scale: String(finalScale), offset: 1 },
          ],
          {
            duration: EXCHANGE_STAGE_MOTION_MS,
            easing: 'cubic-bezier(.16,.74,.18,1)',
          },
        );
        exchangeStageAnimations.current.set(card, animation);
        const releaseAnimation = () => {
          if (exchangeStageAnimations.current.get(card) === animation) {
            exchangeStageAnimations.current.delete(card);
          }
        };
        animation.addEventListener('finish', releaseAnimation, { once: true });
        animation.addEventListener('cancel', releaseAnimation, { once: true });
      }
    }
  }, [exchangeDraft, exchangeMode, view.revision]);

  useEffect(() => {
    if (!exchangeMode || exchangeSubmitting || opponentSeats.length !== 2) return;
    const firstCard = exchangeDraft[opponentSeats[0]];
    const secondCard = exchangeDraft[opponentSeats[1]];
    if (!firstCard || !secondCard || firstCard === secondCard) return;

    const command = exchanges.find((candidate) => candidate.give.every(({ to, card }) => exchangeDraft[to] === card));
    if (!command) return;

    let cancelled = false;
    let dwellTimer: number | null = null;
    const stageAnimations = [firstCard, secondCard]
      .map((card) => exchangeStageAnimations.current.get(card))
      .filter((animation): animation is Animation => Boolean(animation));

    // Authority follows the exact WAAPI handles that created the material event.
    // There is no second CSS/DOM timing guess: the state transition can only start
    // after both physical cards have completed their own settle motion.
    void Promise.allSettled(stageAnimations.map((animation) => animation.finished)).then(() => {
      if (cancelled) return;
      dwellTimer = window.setTimeout(() => {
        if (cancelled) return;
        setExchangeSubmitting(true);
        void onCommand(command);
      }, EXCHANGE_STAGE_DWELL_MS);
    });

    return () => {
      cancelled = true;
      if (dwellTimer !== null) window.clearTimeout(dwellTimer);
    };
  }, [exchangeDraft, exchangeMode, exchangeSubmitting, exchanges, onCommand]);

  function playCard(card: CardId, marriage = false) {
    const command = humanCommands.find(
      (candidate): candidate is Extract<Command, { type: 'play' }> =>
        candidate.type === 'play' && candidate.card === card && Boolean(candidate.declareMarriage) === marriage,
    );
    if (command) void onCommand(command);
  }

  function activateHandCard(card: CardId) {
    if (exchangeMode) {
      if (stagedSeatForCard(card) !== null) unstageExchangeCard(card);
      return;
    }
    if (view.phase === 'trick' && playable.has(card)) playCard(card);
  }

  const phaseLabel = {
    auction: 'Licytacja',
    exchange: 'Wymiana po musiku',
    'redeal-option': 'Cztery dziewiątki',
    contract: 'Deklaracja gry',
    trick: `Lewa ${Math.min(8, view.trickIndex + 1)}/8`,
    complete: 'Rozdanie zakończone',
  }[view.phase];

  const completedTrick = trickPresentation.kind === 'trick-completion' ? trickPresentation.completedTrick : null;
  const showingCompletedTrick = completedTrick !== null && displayedTrickStage !== 'settled';
  const visibleTrick = view.trick.length > 0
    ? view.trick
    : showingCompletedTrick && completedTrick
      ? completedTrick.plays
      : [];
  const freshPlay = trickPresentation.freshPlay;
  const completedWinner = completedTrick?.winner ?? null;
  const completedWinnerPosition = completedWinner === null ? '' : playPosition(completedWinner);
  const bombCompletion = view.completion?.kind === 'bomb' ? view.completion : null;
  const winnerSeat = view.winner ?? humanSeat;

  return (
    <main
      className={`app-shell ${exchangeMode ? 'exchange-mode' : ''}`}
      data-exchange-submitting={exchangeSubmitting ? 'true' : 'false'}
      data-exchange-magnet-seat={exchangeHoverSeat ?? ''}
      onPointerDown={() => { exchangeTargetRects.current = null; }}
      onPointerMove={handleExchangePointerMove}
      onPointerUp={handleExchangePointerUp}
      onPointerCancel={() => {
        exchangeTargetRects.current = null;
        setExchangeHoverSeat(null);
      }}
    >
      <header className="topbar">
        <div>
          <div className="eyebrow">Tysiąc The Game</div>
          <h1>{phaseLabel}</h1>
        </div>
        <div className="topbar-actions">
          <RulesGuide />
          {onNewGame && <button className="ghost" onClick={onNewGame}>Nowa gra</button>}
        </div>
      </header>

      <section className="table">
        <div className="opponents">
          {opponentSeats.map((seat) => (
            <div
              className={`opponent ${showingCompletedTrick && completedWinner === seat && displayedTrickStage !== 'arrival' ? 'trick-winner-source' : ''} ${exchangeMode ? 'exchange-drop-target' : ''} ${exchangeHoverSeat === seat ? 'is-exchange-hot' : ''} ${exchangeDraft[seat] ? 'has-exchange-card' : ''}`}
              key={seat}
              data-seat-anchor={seat}
              data-exchange-target-seat={exchangeMode ? seat : undefined}
              data-exchange-assigned-card={exchangeDraft[seat] ?? ''}
            >
              <div className="seat-line">
                <strong>{seatName(seat)}</strong>
                <span className="seat-score">{view.scores[seat]}</span>
              </div>
              <span className="seat-role">{seatRole(seat) || '\u00a0'}</span>
              <span className="seat-cards">{view.opponentCardCounts[seat]} kart</span>
              <div className="card-backs" aria-hidden="true">
                {Array.from({ length: Math.min(view.opponentCardCounts[seat], 8) }, (_, index) => <i key={index} />)}
              </div>
              {showingCompletedTrick && completedWinner === seat && displayedTrickStage === 'consequence' && (
                <span className="capture-pulse">+{completedTrick?.points ?? 0} pkt</span>
              )}
            </div>
          ))}
        </div>

        <div className="center">
          <div className="status-strip">
            <span>Stawka <strong>{view.auction.currentBid}</strong></span>
            <span>Kontrakt <strong>{view.contract ?? '—'}</strong></span>
            <span>Atut <strong>{view.trump ? SUIT_SYMBOL[view.trump] : '—'}</strong></span>
          </div>

          {view.revealedTalon && view.phase !== 'trick' && view.phase !== 'complete' && (
            <div className="talon">
              <span>Musik</span>
              <div className="mini-cards">
                {view.revealedTalon.map((card) => <Card key={card} card={card} disabled />)}
              </div>
            </div>
          )}

          <div
            className={`trick ${showingCompletedTrick ? 'completed' : ''} trick-stage-${displayedTrickStage}`}
            aria-label="Aktualna lewa"
            data-presentation-kind={trickPresentation.kind}
            data-fresh-play={freshPlay ? `${freshPlay.seat}:${freshPlay.card}` : ''}
            data-trick-stage={displayedTrickStage}
            data-winner-seat={completedWinner ?? ''}
            data-winner-position={completedWinnerPosition}
          >
            {visibleTrick.length === 0 ? (
              <span className="muted">Stół czeka na zagranie</span>
            ) : (
              visibleTrick.map((play) => {
                const isFresh = freshPlay?.seat === play.seat && freshPlay.card === play.card;
                const isWinner = showingCompletedTrick && completedWinner === play.seat;
                return (
                  <div
                    className={`played played-${playPosition(play.seat)} ${isFresh ? 'is-fresh-arrival' : ''} ${isWinner ? 'is-trick-winner' : ''}`}
                    key={`${play.seat}-${play.card}`}
                    data-seat={play.seat}
                    data-card={play.card}
                  >
                    <small>{seatName(play.seat)}</small>
                    <Card card={play.card} disabled />
                  </div>
                );
              })
            )}
          </div>
          {showingCompletedTrick && completedTrick && displayedTrickStage !== 'arrival' && (
            <div className={`trick-result trick-result-${displayedTrickStage}`}>
              Lewa {completedTrick.index}: {seatName(completedTrick.winner)} · {completedTrick.points} pkt
            </div>
          )}
        </div>

        <section className="decision" aria-live="polite">
          {view.status === 'complete' && (
            <div className="decision-card">
              <h2>{view.draw ? 'Remis' : seatAction(winnerSeat, 'Wygrywasz', 'wygrywa')}</h2>
              {projection.scoreSummary ? (
                <ScoreSummary summary={projection.scoreSummary} nameForSeat={seatName} />
              ) : (
                <p>Mecz zakończony.</p>
              )}
              {onNewGame && <button className="primary" onClick={onNewGame}>Zagraj ponownie</button>}
            </div>
          )}

          {view.status === 'playing' && view.phase === 'auction' && (pass || bids.length > 0) && (
            <div className="decision-card">
              <h2>Twoja licytacja</h2>
              <div className="actions bid-actions">
                {pass && <button onClick={() => void onCommand(pass)}>Pas</button>}
                {bids.map((bid) => <button className="primary" key={bid.value} onClick={() => void onCommand(bid)}>{bid.value}</button>)}
              </div>
              <small className="decision-help">
                {pass
                  ? 'Licytujesz zobowiązanie punktowe. Jeśli wygrasz, bierzesz musik i zostajesz grającym; pas wycofuje cię z tej licytacji.'
                  : 'Masz obowiązkową stawkę 100. Jeśli wygrasz, bierzesz musik i zostajesz grającym.'}
              </small>
            </div>
          )}

          {view.status === 'playing' && view.phase === 'exchange' && (exchanges.length > 0 || bomb) && (
            <div className="decision-card physical-exchange-decision">
              {bomb && confirmBomb ? (
                <>
                  <h2>Potwierdź bombę</h2>
                  <p>Bomba natychmiast kończy to rozdanie bez rozgrywania kontraktu. Skutek punktowy zależy od liczby wcześniejszych bomb w tym meczu.</p>
                  <div className="actions">
                    <button className="primary" onClick={() => void onCommand(bomb)}>Potwierdź bombę</button>
                    <button onClick={() => setConfirmBomb(false)}>Anuluj</button>
                  </div>
                </>
              ) : (
                <>
                  <h2>Oddaj po jednej karcie</h2>
                  {exchanges.length > 0 && (
                    <small className="decision-help physical-exchange-help">
                      {exchangeSubmitting
                        ? 'Karty są oddawane.'
                        : assignedExchangeCount === 0
                          ? 'Przeciągnij kartę z ręki na gracza, któremu chcesz ją oddać.'
                          : assignedExchangeCount === 1
                            ? 'Dobrze. Przeciągnij drugą kartę do drugiego gracza. Kliknij oddaną kartę, żeby ją cofnąć.'
                            : 'Obie karty mają odbiorców — oddaję je.'}
                    </small>
                  )}
                  {bomb && (
                    <button
                      className="ghost"
                      onClick={() => {
                        setExchangeDraft({});
                        setExchangeHoverSeat(null);
                        setConfirmBomb(true);
                      }}
                    >
                      Bomba — wycofaj się
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {view.status === 'playing' && view.phase === 'redeal-option' && view.fourNinesOption && requestRedeal && (
            <div className="decision-card">
              <h2>Masz cztery dziewiątki</h2>
              <p>Możesz poprosić o ponowne rozdanie bez zmiany wyniku. Jeśli grasz dalej, twoje cztery dziewiątki ani wybór nie są pozostałym graczom jawnie pokazywane.</p>
              <div className="actions">
                <button className="primary" onClick={() => void onCommand(requestRedeal)}>Rozdaj ponownie</button>
                {continueAfterFourNines && <button onClick={() => void onCommand(continueAfterFourNines)}>Graj dalej</button>}
              </div>
            </div>
          )}

          {view.status === 'playing' && view.phase === 'contract' && contracts.length > 0 && (
            <div className="decision-card">
              <h2>Ile ostatecznie grasz?</h2>
              <div className="actions contract-actions">
                {contracts.map((contract) => <button key={contract.value} onClick={() => void onCommand(contract)}>{contract.value}</button>)}
              </div>
              <small className="decision-help">To ostateczne zobowiązanie punktowe. Nie może być niższe od wygranej stawki; jeśli go nie zrealizujesz, tracisz jego wartość.</small>
            </div>
          )}

          {view.status === 'playing' && view.phase === 'contract' && contracts.length === 0 && (
            <div className="decision-card compact"><h2>Czekamy na decyzję przy stole</h2></div>
          )}

          {view.status === 'playing' && view.phase === 'trick' && playable.size > 0 && (
            <div className="decision-card compact">
              <h2>Twój ruch</h2>
              {marriageCards.size > 0 && (
                <div className="actions">
                  {[...marriageCards].map((card) => (
                    <button className="primary" key={card} onClick={() => playCard(card, true)}>Melduj {rankOf(card)}{SUIT_SYMBOL[suitOf(card)]}</button>
                  ))}
                </div>
              )}
              <small className="decision-help">
                {marriageCards.size > 0
                  ? 'Meldunek K+Q daje punkty i ustawia ten kolor jako atut. Możesz też zagrać legalną kartę bez meldowania.'
                  : 'Każdą kartę możesz chwycić i przełożyć. Legalne zagrania dostają dodatkowy sygnał i możesz rzucić je na stół.'}
              </small>
            </div>
          )}

          {view.status === 'playing' && view.phase === 'complete' && nextHand && (
            <div className="decision-card">
              <h2>{bombCompletion ? seatAction(bombCompletion.seat, `Kończysz rozdanie bombą nr ${bombCompletion.bombNumber}`, `kończy rozdanie bombą nr ${bombCompletion.bombNumber}`) : `Rozdanie ${view.handNumber} zakończone`}</h2>
              {projection.scoreSummary ? (
                <ScoreSummary summary={projection.scoreSummary} nameForSeat={seatName} />
              ) : (
                <p>Zmiana: {view.handScoreDelta?.map((value, seat) => `${seatName(seat as Seat)} ${value >= 0 ? '+' : ''}${value}`).join(' · ')}</p>
              )}
              <button className="primary" onClick={() => void onCommand(nextHand)}>Następne rozdanie</button>
            </div>
          )}
        </section>
      </section>

      <section
        className={`hand-area ${showingCompletedTrick && completedWinner === humanSeat && displayedTrickStage !== 'arrival' ? 'trick-winner-source' : ''}`}
        data-seat-anchor={humanSeat}
      >
        <div className="hand-heading">
          <div className="hand-owner">
            <strong>Twoje karty</strong>
            <span>{seatRole(humanSeat) || `${humanCards.length} kart`}</span>
            {showingCompletedTrick && completedWinner === humanSeat && displayedTrickStage === 'consequence' && (
              <span className="capture-pulse">+{completedTrick?.points ?? 0} pkt</span>
            )}
          </div>
          <div className="hand-score" aria-label={`Twój wynik ${view.scores[humanSeat]}`}>
            <strong>{view.scores[humanSeat]}</strong>
            <span>pkt</span>
          </div>
        </div>
        <TactileHand
          cards={humanCards}
          handNumber={view.handNumber}
          selectedCards={selectedTransfer}
          actionableCards={handActionable}
          throwableCards={throwableCards}
          onActivate={activateHandCard}
        />
      </section>

      <footer className="footer">
        <span>Zasady: PlayOK/Kurnik 3P 800 · test v{projection.profile.version}</span>
        <span>rev {view.revision}</span>
        {message && <span className="message">{message}</span>}
      </footer>
    </main>
  );
}
