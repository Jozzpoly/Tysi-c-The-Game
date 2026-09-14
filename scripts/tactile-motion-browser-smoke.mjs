import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4189';
const WEBDRIVER = 'http://127.0.0.1:9531';
const OUTPUT = 'artifacts/browser';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(label, probe, timeoutMs = 12_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await probe();
      if (value) return value;
    } catch (error) { lastError = error; }
    await sleep(50);
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError}` : ''}`);
}

function startProcess(command, args) {
  const child = spawn(command, args, { detached: true, stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
  let output = '';
  const capture = (chunk) => { output = `${output}${chunk.toString()}`.slice(-12_000); };
  child.stdout.on('data', capture);
  child.stderr.on('data', capture);
  return { child, getOutput: () => output };
}

function stopProcess(child) {
  if (!child?.pid || child.exitCode !== null) return;
  try { process.kill(-child.pid, 'SIGTERM'); }
  catch { try { child.kill('SIGTERM'); } catch {} }
}

async function webdriver(path, init = {}) {
  const response = await fetch(`${WEBDRIVER}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.value?.error) throw new Error(JSON.stringify(body));
  return body.value;
}

async function createSession() {
  const value = await webdriver('/session', {
    method: 'POST',
    body: JSON.stringify({
      capabilities: {
        alwaysMatch: {
          browserName: 'chrome',
          'goog:chromeOptions': {
            args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--window-size=390,844'],
          },
        },
      },
    }),
  });
  return value.sessionId;
}

async function execute(session, script) {
  return webdriver(`/session/${session}/execute/sync`, {
    method: 'POST', body: JSON.stringify({ script, args: [] }),
  });
}

async function cdp(session, cmd, params = {}) {
  return webdriver(`/session/${session}/goog/cdp/execute`, {
    method: 'POST', body: JSON.stringify({ cmd, params }),
  });
}

async function touchActions(session, actions) {
  await webdriver(`/session/${session}/actions`, {
    method: 'POST',
    body: JSON.stringify({
      actions: [{
        type: 'pointer',
        id: 'tactile-motion-touch',
        parameters: { pointerType: 'touch' },
        actions,
      }],
    }),
  });
}

async function releaseActions(session) {
  await webdriver(`/session/${session}/actions`, { method: 'DELETE' });
}

async function screenshot(session, name) {
  const base64 = await webdriver(`/session/${session}/screenshot`);
  await writeFile(`${OUTPUT}/${name}.png`, Buffer.from(base64, 'base64'));
}

async function state(session) {
  return execute(session, `
    const revText = [...document.querySelectorAll('.footer span')]
      .map((node) => node.textContent?.trim() ?? '')
      .find((text) => /^rev \\d+$/.test(text));
    const hand = document.querySelector('.tactile-hand');
    const float = document.querySelector('.tactile-card-float:not(.releasing)');
    const slots = [...document.querySelectorAll('.hand > .hand-slot')].map((slot) => {
      const rect = slot.getBoundingClientRect();
      return {
        label: slot.querySelector(':scope > .card')?.getAttribute('aria-label') ?? '',
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    });
    return {
      heading: document.querySelector('.decision-card h2')?.textContent?.trim() ?? '',
      revision: revText ? Number(revText.slice(4)) : null,
      phase: hand?.dataset.gesturePhase ?? '',
      insertionTarget: Number(hand?.dataset.insertionTarget || NaN),
      insertionPosition: Number(hand?.dataset.insertionPosition || NaN),
      motionEnergy: Number(hand?.dataset.motionEnergy ?? NaN),
      neighborResponseMs: Number(hand?.dataset.neighborResponseMs ?? NaN),
      motionTilt: Number(float?.getAttribute('data-motion-tilt') ?? NaN),
      slots,
    };
  `);
}

async function installMotionTrace(session) {
  return execute(session, `
    const hand = document.querySelector('.tactile-hand');
    if (!hand) return false;
    window.__tactileMotionObserver?.disconnect?.();
    window.__tactileMotionTrace = [];
    const record = () => {
      const float = document.querySelector('.tactile-card-float:not(.releasing)');
      window.__tactileMotionTrace.push({
        t: performance.now(),
        phase: hand.dataset.gesturePhase ?? '',
        energy: Number(hand.dataset.motionEnergy ?? 0),
        response: Number(hand.dataset.neighborResponseMs ?? 0),
        tilt: Number(float?.getAttribute('data-motion-tilt') ?? 0),
        position: Number(hand.dataset.insertionPosition || NaN),
        target: Number(hand.dataset.insertionTarget || NaN),
      });
    };
    const observer = new MutationObserver(record);
    observer.observe(hand, {
      attributes: true,
      subtree: true,
      attributeFilter: [
        'data-gesture-phase',
        'data-motion-energy',
        'data-neighbor-response-ms',
        'data-motion-tilt',
        'data-insertion-position',
        'data-insertion-target',
      ],
    });
    window.__tactileMotionObserver = observer;
    record();
    return true;
  `);
}

async function resetMotionTrace(session) {
  await execute(session, `window.__tactileMotionTrace = []; return true;`);
}

async function motionTrace(session) {
  return execute(session, `return window.__tactileMotionTrace ?? [];`);
}

function labels(candidate) {
  return candidate.slots.map((slot) => slot.label);
}

function summarizeTrace(trace) {
  const held = trace.filter((entry) => entry.phase === 'held');
  if (held.length === 0) return { peakEnergy: 0, minNeighborResponseMs: Infinity, peakAbsTilt: 0, samples: 0 };
  return {
    peakEnergy: Math.max(...held.map((entry) => entry.energy)),
    minNeighborResponseMs: Math.min(...held.map((entry) => entry.response)),
    peakAbsTilt: Math.max(...held.map((entry) => Math.abs(entry.tilt))),
    samples: held.length,
  };
}

async function sampleGesture(session, label, moveDurationMs) {
  const before = await waitFor(`${label} idle opening hand`, async () => {
    const candidate = await state(session);
    return candidate.heading === 'Twoja licytacja'
      && candidate.phase === 'idle'
      && candidate.slots.length === 7
      && candidate.revision !== null
      ? candidate
      : false;
  });
  const openingLabels = labels(before);
  const source = before.slots[0];
  const x = Math.round(source.x);
  const y = Math.round(source.y);
  await resetMotionTrace(session);

  // Chrome executes this entire profile internally. MutationObserver records
  // every rendered response so the proof measures gesture peak, not an
  // arbitrary final interpolation frame.
  await touchActions(session, [
    { type: 'pointerMove', duration: 0, origin: 'viewport', x, y },
    { type: 'pointerDown', button: 0 },
    { type: 'pause', duration: 40 },
    { type: 'pointerMove', duration: moveDurationMs, origin: 'viewport', x: x + 8, y },
    { type: 'pointerMove', duration: moveDurationMs, origin: 'viewport', x: x + 16, y },
    { type: 'pointerMove', duration: moveDurationMs, origin: 'viewport', x: x + 24, y },
  ]);
  await sleep(20);

  const held = await waitFor(`${label} held motion state`, async () => {
    const candidate = await state(session);
    return candidate.phase === 'held'
      && candidate.insertionTarget === 0
      && Number.isFinite(candidate.motionEnergy)
      && Number.isFinite(candidate.neighborResponseMs)
      && Number.isFinite(candidate.motionTilt)
      ? candidate
      : false;
  }, 3_000);
  const trace = await motionTrace(session);
  const peak = summarizeTrace(trace);

  if (JSON.stringify(labels(held)) !== JSON.stringify(openingLabels)) {
    throw new Error(`${label} changed order while held`);
  }
  if (held.revision !== before.revision) {
    throw new Error(`${label} changed revision ${before.revision} -> ${held.revision}`);
  }
  if (peak.samples < 1) throw new Error(`${label} produced no held motion samples: ${JSON.stringify(trace)}`);
  await screenshot(session, `mobile-tactile-motion-${label}`);

  await releaseActions(session);
  const settled = await waitFor(`${label} return settle`, async () => {
    const candidate = await state(session);
    return candidate.phase === 'idle' ? candidate : false;
  }, 3_000);
  if (JSON.stringify(labels(settled)) !== JSON.stringify(openingLabels)) {
    throw new Error(`${label} local order changed after same-slot return`);
  }
  if (settled.revision !== before.revision) {
    throw new Error(`${label} changed revision after release ${before.revision} -> ${settled.revision}`);
  }

  return {
    peakEnergy: peak.peakEnergy,
    minNeighborResponseMs: peak.minNeighborResponseMs,
    peakAbsTilt: peak.peakAbsTilt,
    renderedSamples: peak.samples,
    finalEnergy: held.motionEnergy,
    finalNeighborResponseMs: held.neighborResponseMs,
    finalTilt: held.motionTilt,
    insertionPosition: held.insertionPosition,
    insertionTarget: held.insertionTarget,
    revision: `${before.revision}->${settled.revision}`,
    orderUnchanged: true,
  };
}

async function run() {
  const session = await createSession();
  try {
    await cdp(session, 'Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, screenWidth: 390, screenHeight: 844,
      deviceScaleFactor: 1, mobile: true, positionX: 0, positionY: 0, dontSetVisibleSize: false,
    });
    await cdp(session, 'Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await webdriver(`/session/${session}/url`, {
      method: 'POST', body: JSON.stringify({ url: `${BASE_URL}?seed=2&seat=0` }),
    });
    await waitFor('stable auction before motion rehearsal', async () => {
      const candidate = await state(session);
      return candidate.heading === 'Twoja licytacja' && candidate.revision !== null ? candidate : false;
    });
    if (!await installMotionTrace(session)) throw new Error('could not install motion trace');

    const slow = await sampleGesture(session, 'slow', 155);
    await sleep(120);
    const fast = await sampleGesture(session, 'fast', 14);

    if (!(fast.peakEnergy > slow.peakEnergy + 0.12)) {
      throw new Error(`fast gesture did not reach more motion energy: ${JSON.stringify({ slow, fast })}`);
    }
    if (!(fast.minNeighborResponseMs <= slow.minNeighborResponseMs - 8)) {
      throw new Error(`fast gesture did not shorten peak neighbor response: ${JSON.stringify({ slow, fast })}`);
    }
    if (!(fast.peakAbsTilt > slow.peakAbsTilt + 0.5)) {
      throw new Error(`fast gesture did not increase peak carried-card tilt: ${JSON.stringify({ slow, fast })}`);
    }
    if (slow.insertionTarget !== fast.insertionTarget || slow.insertionTarget !== 0) {
      throw new Error(`motion changed stable insertion semantics: ${JSON.stringify({ slow, fast })}`);
    }
    if (slow.revision !== fast.revision || !slow.orderUnchanged || !fast.orderUnchanged) {
      throw new Error(`motion rehearsal touched authority/order: ${JSON.stringify({ slow, fast })}`);
    }

    return { slow, fast };
  } finally {
    try { await releaseActions(session); } catch {}
    try { await webdriver(`/session/${session}`, { method: 'DELETE' }); } catch {}
  }
}

await mkdir(OUTPUT, { recursive: true });
const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4189']);
const driver = startProcess('chromedriver', ['--port=9531']);
try {
  await waitFor('Vite tactile motion server', async () => (await fetch(BASE_URL).catch(() => null))?.ok);
  await waitFor('ChromeDriver tactile motion', async () => (await fetch(`${WEBDRIVER}/status`).catch(() => null))?.ok);
  const evidence = await run();
  console.log('tactile motion browser smoke: PASS');
  console.log(JSON.stringify(evidence, null, 2));
} catch (error) {
  console.error('tactile motion browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  stopProcess(driver.child);
  stopProcess(vite.child);
}
