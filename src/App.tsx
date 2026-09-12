import { useMemo, useState } from 'react';
import {
  PLAYOK_3P_800_CANDIDATE,
  actingSeat,
  applyCommand,
  assertCoreInvariants,
  createMatch,
  legalCommands,
  productBotCommand,
  rankOf,
  suitOf,
  type CardId,
  type Command,
  type MatchState,
  type Seat,
} from './core/index.js';
import './styles.css';

const HUMAN: Seat = 0;
const SEAT_NAMES = ['Ty', 'Bot A', 'Bot B'] as const;
const SUIT_SYMBOL = { spades: '♠', clubs: '♣', diamonds: '♦', hearts: '♥' } as const;

function settleBots(initial: MatchState, maxSteps = 128): MatchState {
  let state = initial;
  for (let i = 0; i < maxSteps; i += 1) {
    if (state.status === 'complete' || state.hand.phase === 'complete') return state;
    const actor = actingSeat(state);
    if (actor === null || actor === HUMAN) return state;
    const result = applyCommand(state, productBotCommand(state, actor));
    if (!result.ok) throw new Error(`Bot command rejected: ${result.reason}`);
    state = result.state;
    assertCoreInvariants(state);
  }
  throw new Error('Bot settle loop exceeded safety limit');
}

function freshMatch(seed = Date.now() >>> 0): MatchState {
  const state = createMatch(PLAYOK_3P_800_CANDIDATE, seed, 0);
  assertCoreInvariants(state);
  return settleBots(state);
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
  const [state, setState] = useState<MatchState>(() => freshMatch(1));
  const [selectedTransfer, setSelectedTransfer] = useState<CardId[]>([]);
  const [message, setMessage] = useState('Pierwszy grywalny vertical slice — profil PlayOK/Kurnik candidate.');

  const humanCommands = useMemo(() => legalCommands(state, HUMAN), [state]);
  const humanCards = state.hand.hands[HUMAN];
  const playable = new Set(
    humanCommands.filter((c): c is Extract<Command, { type: 'play' }> => c.type === 'play').map((c) => c.card),
  );
  const marriageCards = new Set(
    humanCommands
      .filter((c): c is Extract<Command, { type: 'play' }> => c.type === 'play' && Boolean(c.declareMarriage))
      .map((c) => c.card),
  );
  const bids = humanCommands.filter((c): c is Extract<Command, { type: 'bid' }> => c.type === 'bid');
  const contracts = humanCommands.filter((c): c is Extract<Command, { type: 'contract' }> => c.type === 'contract');

  function commit(command: Command) {
    const result = applyCommand(state, command);
    if (!result.ok) {
      setMessage(`Odrzucone: ${result.reason}`);
      return;
    }
    try {
      assertCoreInvariants(result.state);
      const settled = settleBots(result.state);
      assertCoreInvariants(settled);
      setState(settled);
      setSelectedTransfer([]);
      setMessage('');
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
    if (state.hand.declarer !== HUMAN || selectedTransfer.length !== 2) return;
    const command = humanCommands.find(
      (candidate): candidate is Extract<Command, { type: 'exchange' }> =>
        candidate.type === 'exchange' &&
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
    trick: `Lewa ${Math.min(8, state.hand.trickIndex + 1)}/8`,
    complete: 'Rozdanie zakończone',
  }[state.hand.phase];

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
            setState(freshMatch());
            setSelectedTransfer([]);
            setMessage('Nowy seed.');
          }}
        >
          Nowa gra
        </button>
      </header>

      <section className="scoreboard" aria-label="Wynik meczu">
        {state.scores.map((score, seat) => (
          <div className={`score ${seat === HUMAN ? 'human' : ''}`} key={seat}>
            <span>{SEAT_NAMES[seat]}</span>
            <strong>{score}</strong>
            <small>{state.dealer === seat ? 'rozdaje' : state.hand.declarer === seat ? 'gra' : ''}</small>
          </div>
        ))}
      </section>

      <section className="table">
        <div className="opponents">
          {[1, 2].map((seat) => (
            <div className="opponent" key={seat}>
              <strong>{SEAT_NAMES[seat]}</strong>
              <span>{state.hand.hands[seat as Seat].length} kart</span>
              <div className="card-backs" aria-hidden="true">
                {Array.from({ length: Math.min(state.hand.hands[seat as Seat].length, 8) }, (_, i) => (
                  <i key={i} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="center">
          <div className="status-strip">
            <span>Stawka <strong>{state.hand.auction.currentBid}</strong></span>
            <span>Kontrakt <strong>{state.hand.contract ?? '—'}</strong></span>
            <span>Atut <strong>{state.hand.trump ? SUIT_SYMBOL[state.hand.trump] : '—'}</strong></span>
          </div>

          {state.hand.revealedTalon && state.hand.phase !== 'trick' && state.hand.phase !== 'complete' && (
            <div className="talon">
              <span>Musik</span>
              <div className="mini-cards">
                {state.hand.revealedTalon.map((card) => <Card key={card} card={card} disabled />)}
              </div>
            </div>
          )}

          <div className="trick" aria-label="Aktualna lewa">
            {state.hand.trick.length === 0 ? (
              <span className="muted">Stół czeka na zagranie</span>
            ) : (
              state.hand.trick.map((play) => (
                <div className="played" key={`${play.seat}-${play.card}`}>
                  <small>{SEAT_NAMES[play.seat]}</small>
                  <Card card={play.card} disabled />
                </div>
              ))
            )}
          </div>
        </div>

        <section className="decision" aria-live="polite">
          {state.status === 'complete' && (
            <div className="decision-card">
              <h2>{state.draw ? 'Remis' : `${SEAT_NAMES[state.winner ?? 0]} wygrywa`}</h2>
              <p>Pełny mecz doszedł do końca na tym samym reducerze co testy headless.</p>
              <button className="primary" onClick={() => setState(freshMatch())}>Zagraj ponownie</button>
            </div>
          )}

          {state.status === 'playing' && state.hand.phase === 'auction' && actingSeat(state) === HUMAN && (
            <div className="decision-card">
              <h2>Twoja licytacja</h2>
              <div className="actions">
                <button onClick={() => commit({ type: 'pass', seat: HUMAN })}>Pas</button>
                {bids.slice(0, 8).map((bid) => (
                  <button className="primary" key={bid.value} onClick={() => commit(bid)}>{bid.value}</button>
                ))}
              </div>
              {bids.length > 8 && <small>Pokazuję pierwsze 8 legalnych podbić; zakres wynika z meldunków w ręce.</small>}
            </div>
          )}

          {state.status === 'playing' && state.hand.phase === 'exchange' && state.hand.declarer === HUMAN && (
            <div className="decision-card">
              <h2>Oddaj po jednej karcie</h2>
              <p>1. wybrana → Bot A, 2. wybrana → Bot B. Widoczność transferu jest na razie jawnym pinem profilu.</p>
              <button className="primary" disabled={selectedTransfer.length !== 2} onClick={confirmTransfer}>Potwierdź wymianę</button>
            </div>
          )}

          {state.status === 'playing' && state.hand.phase === 'contract' && state.hand.declarer === HUMAN && (
            <div className="decision-card">
              <h2>Ile ostatecznie grasz?</h2>
              <div className="actions contract-actions">
                {contracts.map((contract) => (
                  <button key={contract.value} onClick={() => commit(contract)}>{contract.value}</button>
                ))}
              </div>
            </div>
          )}

          {state.status === 'playing' && state.hand.phase === 'trick' && actingSeat(state) === HUMAN && (
            <div className="decision-card compact">
              <h2>Twój ruch</h2>
              {marriageCards.size > 0 && (
                <div className="actions">
                  {[...marriageCards].map((card) => (
                    <button className="primary" key={card} onClick={() => playCard(card, true)}>
                      Melduj {SUIT_SYMBOL[suitOf(card)]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {state.status === 'playing' && state.hand.phase === 'complete' && (
            <div className="decision-card">
              <h2>Rozdanie {state.handNumber} zakończone</h2>
              <p>
                Zmiana: {state.hand.handScoreDelta?.map((value, seat) => `${SEAT_NAMES[seat]} ${value >= 0 ? '+' : ''}${value}`).join(' · ')}
              </p>
              <button className="primary" onClick={() => commit({ type: 'next-hand' })}>Następne rozdanie</button>
            </div>
          )}
        </section>
      </section>

      <section className="hand-area">
        <div className="hand-heading">
          <strong>Twoje karty</strong>
          <span>{humanCards.length}</span>
        </div>
        <div className="hand">
          {humanCards.map((card) => {
            const exchangeMode = state.hand.phase === 'exchange' && state.hand.declarer === HUMAN;
            const canPlay = state.hand.phase === 'trick' && playable.has(card);
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
        <span>Profil: {state.rules.id} v{state.rules.version}</span>
        <span>rev {state.revision}</span>
        {message && <span className="message">{message}</span>}
      </footer>
    </main>
  );
}

export default App;
