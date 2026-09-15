import { createRoot } from 'react-dom/client';
import {
  PLAYOK_3P_800_CANDIDATE,
  createMatch,
  projectSeat,
  type MatchState,
  type Seat,
} from '../../src/core/index.js';
import { GameTable } from '../../src/presentation/GameTable.js';
import '../../src/styles.css';
import '../../src/touch.css';
import '../../src/visual-language.css';
import '../../src/visual-language-02.css';
import '../../src/visual-language-03.css';
import '../../src/run04-scene-compression.css';
import '../../src/run04-tactile-hand.css';
import '../../src/run04-touch-contract.css';
import '../../src/run04-trick-lifecycle.css';
import '../../src/run04-friend-demo.css';
import '../../src/run04-friend-feedback.css';
import '../../src/run04-friend-flow.css';

function fixtureSeat(): Seat {
  const raw = new URLSearchParams(window.location.search).get('seat');
  return raw === '1' ? 1 : raw === '2' ? 2 : 0;
}

function buildState(): MatchState {
  const state = createMatch(PLAYOK_3P_800_CANDIDATE, 20260912, 0);
  state.hand.phase = 'complete';
  state.hand.declarer = 0;
  state.hand.contract = 100;
  state.hand.hands = [[], [], []];
  state.hand.capturedCardPoints = [90, 15, 15];
  state.hand.marriagePoints = [0, 0, 0];
  state.hand.handScoreDelta = [-100, 0, 20];
  state.hand.completion = { kind: 'played' };
  state.hand.trickIndex = 8;
  state.scores = [-100, 800, 20];
  return state;
}

function Fixture() {
  const seat = fixtureSeat();
  const names = ['Gracz 1', 'Gracz 2', 'Gracz 3'] as [string, string, string];
  names[seat] = 'Ty';
  const projection = projectSeat(buildState(), seat);
  return (
    <GameTable
      projection={projection}
      seatNames={names}
      message="Kontrolowany scenariusz rozliczenia rozdania."
      onCommand={() => undefined}
    />
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('fixture root missing');
createRoot(root).render(<Fixture />);
