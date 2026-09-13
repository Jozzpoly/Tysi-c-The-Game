import { useEffect, useState, type CSSProperties } from 'react';
import {
  rankOf,
  suitOf,
  type CardId,
  type Command,
  type Seat,
  type SeatProjection,
} from '../core/index.js';
import { RulesGuide } from './RulesGuide.js';
import { ScoreSummary } from './ScoreSummary.js';

const SUIT_SYMBOL = { spades: '♠', clubs: '♣', diamonds: '♦', hearts: '♥' } as const;
const ALL_SEATS: readonly Seat[] = [0, 1, 2];

export interface GameTableProps {
  projection: SeatProjection;
  seatNames: readonly [string, string, string];
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

export function GameTable({ projection, seatNames, message = '', onCommand, onNewGame }: GameTableProps) {
  const view = projection.observation;
  const humanSeat = view.seat;
  const humanCommands = projection.legalCommands;
  const [selectedTransfer, setSelectedTransfer] = useState<CardId[]>([]);
  const [confirmBomb, setConfirmBomb] = useState(false);

  useEffect(() => {
    setSelectedTransfer([]);
    setConfirmBomb(false);
  }, [view.revision]);

  const seatName = (seat: Seat) => seatNames[seat];
  const seatAction = (seat: Seat, you: string, thirdPerson: string) => seat === humanSeat ? you : `${seatName(seat)} ${thirdPerson}`;
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

  function toggleTransfer(card: CardId) {
    setSelectedTransfer((current) => {
      if (current.includes(card)) return current.filter((value) => value !== card);
      if (current.length >= 2) return [current[1], card];
      return [...current, card];
    });
  }

  function confirmTransfer() {
    if (view.declarer !== humanSeat || selectedTransfer.length !== 2) return;
    const command = exchanges.find((candidate) => candidate.give[0].card === selectedTransfer[0] && candidate.give[1].card === selectedTransfer[1]);
    if (command) void onCommand(command);
  }

  function playCard(card: CardId, marriage = false) {
    const command = humanCommands.find(
      (candidate): candidate is Extract<Command, { type: 'play' }> =>
        candidate.type === 'play' && candidate.card === card && Boolean(candidate.declareMarriage) === marriage,
    );
    if (command) void onCommand(command);
  }

  const phaseLabel = {
    auction: 'Licytacja',
    exchange: 'Wymiana po musiku',
    'redeal-option': 'Cztery dziewiątki',
    contract: 'Deklaracja gry',
    trick: `Lewa ${Math.min(8, view.trickIndex + 1)}/8`,
    complete: 'Rozdanie zakończone',
  }[view.phase];

  const visibleTrick = view.trick.length > 0 ? view.trick : view.lastCompletedTrick?.plays ?? [];
  const showingCompletedTrick = view.trick.length === 0 && view.lastCompletedTrick !== null;
  const handStyle = { '--hand-spread-count': Math.max(0, humanCards.length - 1) } as CSSProperties;
  const bombCompletion = view.completion?.kind === 'bomb' ? view.completion : null;
  const winnerSeat = view.winner ?? humanSeat;

  return (
    <main className="app-shell">
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

      <section className="scoreboard" aria-label="Wynik meczu">
        {view.scores.map((score, seat) => {
          const role = view.dealer === seat ? 'rozdaje' : view.declarer === seat ? 'gra' : '';
          const bombs = view.bombsUsed[seat] > 0 ? `bomby: ${view.bombsUsed[seat]}` : '';
          return (
            <div className={`score ${seat === humanSeat ? 'human' : ''}`} key={seat}>
              <span>{seatName(seat as Seat)}</span>
              <strong>{score}</strong>
              <small>{[role, bombs].filter(Boolean).join(' · ')}</small>
            </div>
          );
        })}
      </section>

      <section className="table">
        <div className="opponents">
          {opponentSeats.map((seat) => (
            <div className="opponent" key={seat}>
              <strong>{seatName(seat)}</strong>
              <span>{view.opponentCardCounts[seat]} kart</span>
              <div className="card-backs" aria-hidden="true">
                {Array.from({ length: Math.min(view.opponentCardCounts[seat], 8) }, (_, index) => <i key={index} />)}
              </div>
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

          <div className={`trick ${showingCompletedTrick ? 'completed' : ''}`} aria-label="Aktualna lewa">
            {visibleTrick.length === 0 ? (
              <span className="muted">Stół czeka na zagranie</span>
            ) : (
              visibleTrick.map((play) => (
                <div className={`played played-${playPosition(play.seat)}`} key={`${play.seat}-${play.card}`}>
                  <small>{seatName(play.seat)}</small>
                  <Card card={play.card} disabled />
                </div>
              ))
            )}
          </div>
          {showingCompletedTrick && view.lastCompletedTrick && (
            <div className="trick-result">Lewa {view.lastCompletedTrick.index}: {seatName(view.lastCompletedTrick.winner)} · {view.lastCompletedTrick.points} pkt</div>
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
            <div className="decision-card">
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
                    <>
                      <p>Po musiku oddajesz po jednej karcie każdemu rywalowi. 1. wybrana → {seatName(exchanges[0].give[0].to)}, 2. wybrana → {seatName(exchanges[0].give[1].to)}.</p>
                      <button className="primary" disabled={selectedTransfer.length !== 2} onClick={confirmTransfer}>Potwierdź wymianę</button>
                    </>
                  )}
                  {bomb && <button className="ghost" onClick={() => setConfirmBomb(true)}>Bomba — wycofaj się</button>}
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
                  ? 'Meldunek K+Q daje punkty i ustawia ten kolor jako atut. Możesz też zagrać aktywną kartę bez meldowania.'
                  : 'Kliknij jedną z aktywnych kart — interfejs blokuje zagrania nielegalne w tej lewie.'}
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

      <section className="hand-area">
        <div className="hand-heading"><strong>Twoje karty</strong><span>{humanCards.length}</span></div>
        <div className="hand" style={handStyle}>
          {humanCards.map((card) => {
            const exchangeMode = view.phase === 'exchange' && exchanges.length > 0;
            const canPlay = view.phase === 'trick' && playable.has(card);
            return <Card key={card} card={card} selected={selectedTransfer.includes(card)} disabled={!exchangeMode && !canPlay} onClick={exchangeMode ? () => toggleTransfer(card) : canPlay ? () => playCard(card) : undefined} />;
          })}
        </div>
      </section>

      <footer className="footer">
        <span>Zasady: PlayOK/Kurnik 3P 800 · test v{projection.profile.version}</span>
        <span>rev {view.revision}</span>
        {message && <span className="message">{message}</span>}
      </footer>
    </main>
  );
}
