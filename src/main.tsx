import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';
import './touch.css';
import './visual-language.css';
import './visual-language-02.css';
import './visual-language-03.css';
import './tactile-hand.css';
import './tactile-hand-fit.css';
import './tactile-positive-feedback.css';
import './tactile-living-hand.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);