import { useEffect, useState } from 'react';

type LegacyFullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type LegacyFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function fullscreenElement(): Element | null {
  const doc = document as LegacyFullscreenDocument;
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function fullscreenSupported(): boolean {
  const root = document.documentElement as LegacyFullscreenElement;
  return Boolean(
    document.fullscreenEnabled
    || root.requestFullscreen
    || root.webkitRequestFullscreen,
  );
}

async function enterFullscreen() {
  const root = document.documentElement as LegacyFullscreenElement;
  if (root.requestFullscreen) {
    await root.requestFullscreen();
    return;
  }
  await root.webkitRequestFullscreen?.();
}

async function leaveFullscreen() {
  const doc = document as LegacyFullscreenDocument;
  if (document.exitFullscreen) {
    await document.exitFullscreen();
    return;
  }
  await doc.webkitExitFullscreen?.();
}

export function FullscreenToggle() {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sync = () => {
      setSupported(fullscreenSupported());
      setActive(Boolean(fullscreenElement()));
    };

    sync();
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync as EventListener);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync as EventListener);
    };
  }, []);

  if (!supported) return null;

  return (
    <button
      type="button"
      className={`ghost fullscreen-toggle ${active ? 'is-fullscreen' : ''}`}
      aria-label={active ? 'Wyłącz pełny ekran' : 'Pełny ekran'}
      title={active ? 'Wyłącz pełny ekran' : 'Pełny ekran'}
      onClick={() => {
        void (active ? leaveFullscreen() : enterFullscreen()).catch(() => {});
      }}
    >
      <span aria-hidden="true">⛶</span>
    </button>
  );
}
