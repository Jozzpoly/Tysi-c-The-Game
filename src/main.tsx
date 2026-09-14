import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';
import './touch.css';
import './visual-language.css';
import './visual-language-02.css';
import './visual-language-03.css';
import './run04-scene-compression.css';
import './run04-mobile-hand.css';
import './run04-tactile-hand.css';
import './run04-tactile-fix.css';
import './run04-touch-contract.css';
import './run04-trick-lifecycle.css';
import './run04-presence.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
