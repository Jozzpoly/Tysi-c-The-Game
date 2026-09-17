type Scenario = 'idle' | 'drag' | 'exchange' | 'deal' | 'trick' | 'remote-playback';

interface Distribution {
  samples: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
}

export interface PerformanceProbeReport {
  version: 1;
  elapsedMs: number;
  device: {
    viewportWidth: number;
    viewportHeight: number;
    devicePixelRatio: number;
    visibility: DocumentVisibilityState;
    userAgent: string;
  };
  frames: Distribution & {
    over32Ms: number;
    over50Ms: number;
    over100Ms: number;
  };
  inputToFrame: Distribution;
  longTasks: {
    supported: boolean;
    count: number;
    totalMs: number;
    maxMs: number;
  };
  scenarios: Record<Scenario, number>;
}

declare global {
  interface Window {
    __tysiacPerfReport?: () => PerformanceProbeReport;
    __tysiacPerfReportText?: () => string;
    __tysiacPerfReset?: () => void;
  }
}

const SESSION_KEY = 'tysiac:performance-probe';
const MAX_FRAME_SAMPLES = 30_000;
const MAX_INPUT_SAMPLES = 5_000;
const SCENARIO_SAMPLE_MS = 250;
const PANEL_REFRESH_MS = 1_000;
const EMPTY_SCENARIOS: Record<Scenario, number> = {
  idle: 0,
  drag: 0,
  exchange: 0,
  deal: 0,
  trick: 0,
  'remote-playback': 0,
};

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function percentile(sorted: readonly number[], ratio: number) {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1));
  return sorted[index];
}

function distribution(values: readonly number[]): Distribution {
  if (values.length === 0) return { samples: 0, p50Ms: 0, p95Ms: 0, p99Ms: 0, maxMs: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  return {
    samples: values.length,
    p50Ms: round(percentile(sorted, .5)),
    p95Ms: round(percentile(sorted, .95)),
    p99Ms: round(percentile(sorted, .99)),
    maxMs: round(sorted[sorted.length - 1]),
  };
}

function sessionGet() {
  try { return window.sessionStorage.getItem(SESSION_KEY); }
  catch { return null; }
}

function sessionSet(value: string | null) {
  try {
    if (value === null) window.sessionStorage.removeItem(SESSION_KEY);
    else window.sessionStorage.setItem(SESSION_KEY, value);
  } catch {}
}

function requested() {
  const value = new URLSearchParams(window.location.search).get('perf');
  if (value === '1') {
    sessionSet('1');
    return true;
  }
  if (value === '0') {
    sessionSet(null);
    return false;
  }
  return sessionGet() === '1';
}

function detectScenario(): Scenario {
  if (document.querySelector('.tactile-card-float')) return 'drag';
  if (document.querySelector('[data-deal-material-state="active"], .deal-material-layer')) return 'deal';
  if (document.querySelector('[data-exchange-material-state="active"], .exchange-transfer-layer')) return 'exchange';

  const connection = document.querySelector('.connection-banner')?.textContent ?? '';
  if (connection.includes('ruchy przy stole')) return 'remote-playback';

  if (document.querySelector('.trick .played')) return 'trick';
  return 'idle';
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  }
}

export function installPerformanceProbe() {
  if (!requested()) return;

  let startedAt = performance.now();
  let lastFrameAt: number | null = null;
  let pendingInputAt: number | null = null;
  let rafId = 0;
  let frameDeltas: number[] = [];
  let inputLatencies: number[] = [];
  let longTaskCount = 0;
  let longTaskTotalMs = 0;
  let longTaskMaxMs = 0;
  let scenarios: Record<Scenario, number> = { ...EMPTY_SCENARIOS };

  const longTaskSupported = typeof PerformanceObserver !== 'undefined'
    && PerformanceObserver.supportedEntryTypes?.includes('longtask') === true;

  const longTaskObserver = longTaskSupported
    ? new PerformanceObserver((list) => {
        if (document.visibilityState !== 'visible') return;
        for (const entry of list.getEntries()) {
          longTaskCount += 1;
          longTaskTotalMs += entry.duration;
          longTaskMaxMs = Math.max(longTaskMaxMs, entry.duration);
        }
      })
    : null;

  if (longTaskObserver) longTaskObserver.observe({ entryTypes: ['longtask'] });

  function report(): PerformanceProbeReport {
    const frameStats = distribution(frameDeltas);
    return {
      version: 1,
      elapsedMs: Math.round(performance.now() - startedAt),
      device: {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        visibility: document.visibilityState,
        userAgent: navigator.userAgent,
      },
      frames: {
        ...frameStats,
        over32Ms: frameDeltas.filter((value) => value > 32).length,
        over50Ms: frameDeltas.filter((value) => value > 50).length,
        over100Ms: frameDeltas.filter((value) => value > 100).length,
      },
      inputToFrame: distribution(inputLatencies),
      longTasks: {
        supported: longTaskSupported,
        count: longTaskCount,
        totalMs: round(longTaskTotalMs),
        maxMs: round(longTaskMaxMs),
      },
      scenarios: { ...scenarios },
    };
  }

  function reportText() {
    return `TYSIAC_PERF_V1\n${JSON.stringify(report())}`;
  }

  function reset() {
    startedAt = performance.now();
    lastFrameAt = null;
    pendingInputAt = null;
    frameDeltas = [];
    inputLatencies = [];
    longTaskCount = 0;
    longTaskTotalMs = 0;
    longTaskMaxMs = 0;
    scenarios = { ...EMPTY_SCENARIOS };
  }

  window.__tysiacPerfReport = report;
  window.__tysiacPerfReportText = reportText;
  window.__tysiacPerfReset = reset;

  function frame(now: number) {
    if (document.visibilityState !== 'visible') {
      lastFrameAt = null;
      pendingInputAt = null;
    } else {
      if (lastFrameAt !== null && frameDeltas.length < MAX_FRAME_SAMPLES) {
        const delta = now - lastFrameAt;
        if (delta > 0 && delta < 5_000) frameDeltas.push(delta);
      }
      lastFrameAt = now;

      if (pendingInputAt !== null && inputLatencies.length < MAX_INPUT_SAMPLES) {
        inputLatencies.push(Math.max(0, now - pendingInputAt));
        pendingInputAt = null;
      }
    }
    rafId = window.requestAnimationFrame(frame);
  }

  const noteInput = () => {
    if (document.visibilityState !== 'visible') return;
    if (pendingInputAt === null) pendingInputAt = performance.now();
  };

  document.addEventListener('pointerdown', noteInput, { capture: true, passive: true });
  document.addEventListener('pointermove', noteInput, { capture: true, passive: true });
  document.addEventListener('pointerup', noteInput, { capture: true, passive: true });
  rafId = window.requestAnimationFrame(frame);

  const scenarioTimer = window.setInterval(() => {
    const scenario = detectScenario();
    scenarios[scenario] += 1;
  }, SCENARIO_SAMPLE_MS);

  let summaryNode: HTMLButtonElement | null = null;
  let detailsNode: HTMLElement | null = null;

  function refreshPanel() {
    if (!summaryNode || !detailsNode) return;
    const current = report();
    summaryNode.textContent = `PERF p95 ${current.frames.p95Ms}ms · >50 ${current.frames.over50Ms}`;
    detailsNode.textContent = [
      `frames ${current.frames.samples} · p99 ${current.frames.p99Ms} · max ${current.frames.maxMs} ms`,
      `>32 ${current.frames.over32Ms} · >50 ${current.frames.over50Ms} · >100 ${current.frames.over100Ms}`,
      `input→frame p95 ${current.inputToFrame.p95Ms} · max ${current.inputToFrame.maxMs} ms`,
      current.longTasks.supported
        ? `long tasks ${current.longTasks.count} · max ${current.longTasks.maxMs} ms`
        : 'long tasks unsupported',
    ].join('\n');
  }

  function mountPanel() {
    if (!document.body || document.querySelector('[data-performance-probe]')) return;

    const root = document.createElement('div');
    root.dataset.performanceProbe = 'enabled';
    root.style.cssText = 'position:fixed;top:8px;right:8px;z-index:2147483647;font:12px/1.35 system-ui,sans-serif;color:#fff;max-width:min(310px,calc(100vw - 16px));';

    const summary = document.createElement('button');
    summary.type = 'button';
    summary.dataset.performanceProbeToggle = 'true';
    summary.style.cssText = 'border:1px solid rgba(255,255,255,.35);border-radius:999px;background:rgba(8,12,16,.88);color:#fff;padding:7px 10px;font:inherit;box-shadow:0 2px 10px rgba(0,0,0,.35);';
    summary.textContent = 'PERF collecting…';

    const panel = document.createElement('div');
    panel.hidden = true;
    panel.style.cssText = 'margin-top:6px;border:1px solid rgba(255,255,255,.28);border-radius:10px;background:rgba(8,12,16,.94);padding:9px;box-shadow:0 4px 18px rgba(0,0,0,.45);';

    const details = document.createElement('pre');
    details.dataset.performanceProbeSummary = 'true';
    details.style.cssText = 'white-space:pre-wrap;margin:0 0 8px;font:11px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;';

    const controls = document.createElement('div');
    controls.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;';

    const copy = document.createElement('button');
    copy.type = 'button';
    copy.dataset.performanceProbeCopy = 'true';
    copy.textContent = 'Kopiuj raport';

    const resetButton = document.createElement('button');
    resetButton.type = 'button';
    resetButton.dataset.performanceProbeReset = 'true';
    resetButton.textContent = 'Reset';

    for (const button of [copy, resetButton]) {
      button.style.cssText = 'border:1px solid rgba(255,255,255,.3);border-radius:7px;background:#1d2730;color:#fff;padding:6px 8px;font:inherit;';
    }

    summary.addEventListener('click', () => { panel.hidden = !panel.hidden; });
    copy.addEventListener('click', async () => {
      const ok = await copyText(reportText());
      copy.textContent = ok ? 'Skopiowano' : 'Kopiowanie nieudane';
      window.setTimeout(() => { copy.textContent = 'Kopiuj raport'; }, 1_200);
    });
    resetButton.addEventListener('click', () => {
      reset();
      refreshPanel();
    });

    controls.append(copy, resetButton);
    panel.append(details, controls);
    root.append(summary, panel);
    document.body.append(root);
    summaryNode = summary;
    detailsNode = details;
    refreshPanel();
  }

  if (document.body) mountPanel();
  else document.addEventListener('DOMContentLoaded', mountPanel, { once: true });

  const panelTimer = window.setInterval(refreshPanel, PANEL_REFRESH_MS);

  window.addEventListener('pagehide', () => {
    window.cancelAnimationFrame(rafId);
    window.clearInterval(scenarioTimer);
    window.clearInterval(panelTimer);
    longTaskObserver?.disconnect();
  }, { once: true });
}
