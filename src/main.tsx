import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';
import './touch.css';
import './visual-language.css';
import './visual-language-02.css';
import './visual-language-03.css';
import './run04-scene-compression.css';
import './run04-tactile-hand.css';
import './run04-trick-lifecycle.css';
import './run04-friend-demo.css';
import './run04-friend-feedback.css';
import './run04-friend-flow.css';
import './run05-physical-table.css';
import './run05-spatial-play.css';
import './run05-material-transfer.css';
import './run05-exchange-transfer.css';
import './run05-deal.css';
import './run05-marriage.css';
import './run05-desktop-composition.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
