import { StrictMode } from 'react';

/** Source checkout seen by Vite at client bundle construction time. */
declare const __TYSIAC_CLIENT_SOURCE_SHA__: string;
import { createRoot } from 'react-dom/client';
import App from './App.js';
import { installPerformanceProbe } from './performance/performanceProbe.js';
import { installOwnerMagnetismBridge } from './presentation/ownerMagnetismBridge.js';
import { installSeatPresentationBridge } from './presentation/seatPresentationBridge.js';
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
import './run05-owner-magnetism.css';
import './run05-seat-topology.css';
import './run06-mobile-composition.css';

installPerformanceProbe();
installOwnerMagnetismBridge();
installSeatPresentationBridge();

// A cached SPA can outlive a Worker redeploy. This belongs to the JS currently
// executing in this tab and intentionally differs from the server buildSha.
document.documentElement.dataset.tysiacClientSourceSha = __TYSIAC_CLIENT_SOURCE_SHA__;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
