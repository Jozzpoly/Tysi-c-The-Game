import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  PLAYOK_3P_800_CANDIDATE,
  actingSeat,
  applyCommand,
  assertCoreInvariants,
  createMatch,
  eventsForSeat,
  productBotCommand,
  projectSeat,
  rankOf,
  suitOf,
  type CardId,
  type Command,
  type MatchState,
  type Seat,
} from './core/index.js';
import { describeFeedback } from './presentation/feedback.js';
import './styles.css';

const HUMAN: Seat = 0;
const SEAT_NAMES = ['Ty', 'Bot A', 'Bot B'] as const;
const SUIT_SYMBOL = { spades: '♠', clubs: '♣', diamonds: '♦', hearts: '♥' } as const;
const seatName = (seat: Seat) => SEAT_NAMES[seat];

function freshMatch(seed = Date.now() >>> 0): MatchState {
  const state = createMatch(PLAYOK_3P_800_CANDIDATE, seed, 0);
  assertCoreInvariants(state);
  return state;
}

function startupSeed(): number | undefined {
  const raw = new URLSearchParams(window.location.search).get('seed');
  if (raw === null) return undefined;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0 || value > 0xffff_ffff) return undefined;
  return value;
}

function Card({ card, disabled, selected, onClick }: { card: CardId; disabled?: boolean; selected?: boolean; onClick?: () => void }) {
  const suit = suitOf(card);
  const red = suit === 'hearts' || suit === 'diamonds';
  return (
    <button
      className={`card ${red ? 'red' : ''} ${selected ? 'selected' : ''}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={`${rankOf(card)} ${suit}`}
    >
      <span className="rank">{rankOf(card)}</span>
      <span className="suit">{SUIT_SYMBOL[suit]}</span>
    </button>
  );
}

function App() {
  // Local single-player authority. Rendering below intentionally uses only the
  // same seat projection a remote client could receive from MatchRoom.
  // ?seed=N is a reproducible QA hook; ordinary product startup stays random.
  const [authority, setAuthority] = useState<MatchState>(() => freshMatch(startupSeed()));
  const [selectedTransfer, setSelectedTransfer] = useState<CardId[]>([]);
  const [message, setMessage] = useState('Pierwszy grywalny vertical slice — profil PlayOK/Kurnik candidate.');

  const projection = useMemo(() => projectSeat(authority, HUMAN), [authority]);
  const view = projection.observation;
  const humanCommands = projection.legalCommands;

  function publishFeedback(events: Parameters<typeof describeFeedback>[0], fallback = '') {
    const text = describeFeedback(eventsForSeat(events, HUMAN), seatName);
    setMessage(text || fallback);
  }

  useEffect(() => {
    if (authority.status === 'complete' || authority.hand.phase === 'complete') return;
    const actor = actingSeat(authority);
    if (actor === null || actor === HUMAN) return;

    const delay = authority.hand.phase === 'trick' ? 520 : 360;
    const timer = window.setTimeout(() => {
      try {
        const command = productBotCommand(authority, actor);
        const result = applyCommand(authority, command);
        if (!result.ok) {
          setMessage(`${SEAT_NAMES[actor]}: ruch odrzucony (${result.reason})`);
          return;
        }
        assertCoreInvariants(result.state);
        setAuthority(result.state);
        publishFeedback(result.events, `${SEAT_NAMES[actor]} wykonał ruch.`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : String(error));
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [authority]);

  const humanCards = view.ownHand;
  const playable = new Set(
    humanCommands.filter((c): c is Extract<Command, { type: 'play' }> => c.type === 'play').map((c) => c.card),
  );
  const marriageCards = new Set(
    humanCommands
      .filter((c): c is Extract<Command, { type: 'play' }> => c.type === 'play' && Boolean(c.declareMarriage))
      .map((c) => c.card),
  );
  const bids = humanCommands.filter((c): c is Extract<Command, { type: 'bid' }> => c.type === 'bid');
  const pass = humanCommands.find((c): c is Extract<Command, { type: 'pass' }> => c.type === 'pass');
  const exchanges = humanCommands.filter((c): c is Extract<Command, { type: 'exchange' }> => c.type === 'exchange');
  const contracts = humanCommands.filter((c): c is Extract<Command, { type: 'contract' }> => c.type === 'contract');
  const nextHand = humanCommands.find((c): c is Extract<Command, { type: 'next-hand' }> => c.type === 'next-hand');

  function commit(command: Command) {
    const result = applyCommand(authority, command);
    if (!result.ok) {
      setMessage(`Odrzucone: ${result.reason}`);
      return;
    }
    try {
      assertCoreInvariants(result.state);
      setAuthority(result.state);
      setSelectedTransfer([]);
      publishFeedback(result.events, 'Ruch przyjęty.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  function toggleTransfer(card: CardId) {
    setSelectedTransfer((current) => {
      if (current.includes(card)) return current.filter((value) => value !== card);
      if (current.length >= 2) return [current[1], card];
      return [...current, card];
    });
  }

  function confirmTransfer() {
    if (view.declarer !== HUMAN || selectedTransfer.length !== 2) return;
    const command = exchanges.find(
      (candidate) =>
        candidate.give[0].card === selectedTransfer[0] &&
        candidate.give[1].card === selectedTransfer[1],
    );
    if (command) commit(command);
  }

  function playCard(card: CardId, marriage = false) {
    const command = humanCommands.find(
      (candidate): candidate is Extract<Command, { type: 'play' }> =>
        candidate.type === 'play' && candidate.card === card && Boolean(candidate.declareMarriage) === marriage,
    );
    if (command) commit(command);
  }

  const phaseLabel = {
    auction: 'Licytacja',
    exchange: 'Wymiana po musiku',
    contract: 'Deklaracja gry',
    trick: `Lewa ${Math.min(8, view.trickIndex + 1)}/8`,
    complete: 'Rozdanie zakończone',
  }[view.phase];

  const visibleTrick = view.trick.length > 0 ? view.trick : view.lastCompletedTrick?.plays ?? [];
  const showingCompletedTrick = view.trick.length === 0 && view.lastCompletedTrick !== null;
  const handStyle = {
    '--hand-spread-count': Math.max(0, humanCards.length - 1),
  } as CSSProperties;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">Tysiąc The Game · foundation slice</div>
          <h1>{phaseLabel}</h1>
        </div>
        <button
          className="ghost"
          onClick={() => {
            setAuthority(freshMatch());
            setSelectedTransfer([]);
            setMessage('Nowa gra.');
          }}
        >
          Nowa gra
        </button>
      </header>

      <section className="scoreboard" aria-label="Wynik meczu">
        {view.scores.map((score, seat) => (
          <div className={`score ${seat === HUMAN ? 'human' : ''}`} key={seat}>
            <span>{SEAT_NAMES[seat]}</span>
            <strong>{score}</strong>
            <small>{view.dealer === seat ? 'rozdaje' : view.declarer === seat ? 'gra' : ''}</small>
          </div>
        ))}
      </section>

      <section className="table">
        <div className="opponents">
          {[1, 2].map((seat) => (
            <div className="opponent" key={seat}>
              <strong>{SEAT_NAMES[seat]}</strong>
              <span>{view.opponentCardCounts[seat as Seat]} kart</span>
              <div className="card-backs" aria-hidden="true">
                {Array.from({ length: Math.min(view.opponentCardCounts[seat as Seat], 8) }, (_, i) => (
                  <i key={i} />
                ))}
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
                <div className="played" key={`${play.seat}-${play.card}`}>
                  <small>{SEAT_NAMES[play.seat]}</small>
                  <Card card={play.card} disabled />
                </div>
              ))
            )}
          </div>
          {showingCompletedTrick && view.lastCompletedTrick && (
            <div className="trick-result">
              Lewa {view.lastCompletedTrick.index}: {SEAT_NAMES[view.lastCompletedTrick.winner]} · {view.lastCompletedTrick.points} pkt
            </div>
          )}
        </div>

        <section className="decision" aria-live="polite">
          {view.status === 'complete' && (
            <div className="decision-card">
              <h2>{view.draw ? 'Remis' : `${SEAT_NAMES[view.winner ?? 0]} wygrywa`}</h2>
              <p>Pełny mecz doszedł do końca na tym samym reducerze co testy headless.</p>
              <button className="primary" onClick={() => setAuthority(freshMatch())}>Zagraj ponownie</button>
            </div>
          )}

          {view.status === 'playing' && view.phase === 'auction' && pass && (
            <div className="decision-card">
              <h2>Twoja licytacja</h2>
              <div className="actions bid-actions">
                <button onClick={() => commit(pass)}>Pas</button>
                {bids.map((bid) => (
                  <button className="primary" key={bid.value} onClick={() => commit(bid)}>{bid.value}</button>
                ))}
              </div>
              <small>Wszystkie wartości pokazane tutaj są legalne dla aktualnej ręki.</small>
            </div>
          )}

          {view.status === 'playing' && view.phase === 'exchange' && exchanges.length > 0 && (
            <div className="decision-card">
              <h2>Oddaj po jednej karcie</h2>
              <p>1. wybrana → Bot A, 2. wybrana → Bot B. Widoczność transferu jest na razie jawnym pinem profilu.</p>
              <button className="primary" disabled={selectedTransfer.length !== 2} onClick={confirmTransfer}>Potwierdź wymianę</button>
            </div>
          )}

          {view.status === 'playing' && view.phase === 'contract' && contracts.length > 0 && (
            <div className="decision-card">
              <h2>Ile ostatecznie grasz?</h2>
              <div className="actions contract-actions">
                {contracts.map((contract) => (
                  <button key={contract.value} onClick={() => commit(contract)}>{contract.value}</button>
                ))}
              </div>
            </div>
          )}

          {view.status === 'playing' && view.phase === 'trick' && playable.size > 0 && (
            <div className="decision-card compact">
              <h2>Twój ruch</h2>
              {marriageCards.size > 0 && (
                <div className="actions">
                  {[...marriageCards].map((card) => (
                    <button className="primary" key={card} onClick={() => playCard(card, true)}>
                      Melduj {rankOf(card)}{SUIT_SYMBOL[suitOf(card)]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {view.status === 'playing' && view.phase === 'complete' && nextHand && (
            <div className="decision-card">
              <h2>Rozdanie {view.handNumber} zakończone</h2>
              <p>
                Zmiana: {view.handScoreDelta?.map((value, seat) => `${SEAT_NAMES[seat]} ${value >= 0 ? '+' : ''}${value}`).join(' · ')}
              </p>
              <button className="primary" onClick={() => commit(nextHand)}>Następne rozdanie</button>
            </div>
          )}
        </section>
      </section>

      <section className="hand-area">
        <div className="hand-heading">
          <strong>Twoje karty</strong>
          <span>{humanCards.length}</span>
        </div>
        <div className="hand" style={handStyle}>
          {humanCards.map((card) => {
            const exchangeMode = view.phase === 'exchange' && exchanges.length > 0;
            const canPlay = view.phase === 'trick' && playable.has(card);
            return (
              <Card
                key={card}
                card={card}
                selected={selectedTransfer.includes(card)}
                disabled={!exchangeMode && !canPlay}
                onClick={exchangeMode ? () => toggleTransfer(card) : canPlay ? () => playCard(card) : undefined}
              />
            );
          })}
        </div>
      </section>

      <footer className="footer">
        <span>Profil: {projection.profile.id} v{projection.profile.version}</span>
        <span>rev {view.revision}</span>
        {message && <span className="message">{message}</span>}
      </footer>
    </main>
  );
}

export default App;
