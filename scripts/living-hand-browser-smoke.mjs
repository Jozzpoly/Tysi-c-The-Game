import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4187';
const WEBDRIVER = 'http://127.0.0.1:9529';
const OUTPUT = 'artifacts/browser';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(label, probe, timeoutMs = 12_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await probe();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(50);
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError}` : ''}`);
}

function startProcess(command, args) {
  const child = spawn(command, args, { detached: true, stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
  let output = '';
  const capture = (chunk) => { output = `${output}${chunk.toString()}`.slice(-14_000); };
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

async function touch(session, type, points) {
  await cdp(session, 'Input.dispatchTouchEvent', { type, touchPoints: points });
}

async function screenshot(session, name) {
  const base64 = await webdriver(`/session/${session}/screenshot`);
  await writeFile(`${OUTPUT}/${name}.png`, Buffer.from(base64, 'base64'));
}

async function handState(session) {
  return execute(session, `
    const revText = [...document.querySelectorAll('.footer span')]
      .map((node) => node.textContent?.trim() ?? '')
      .find((text) => /^rev \\d+$/.test(text));
    const hand = document.querySelector('.tactile-hand');
    const slots = [...document.querySelectorAll('.hand > .hand-slot')].map((slot, index) => {
      const card = slot.querySelector(':scope > .card');
      const rect = slot.getBoundingClientRect();
      return {
        index,
        label: card?.getAttribute('aria-label') ?? '',
        left: rect.left,
        right: rect.right,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        shift: Number(slot.dataset.previewShiftX ?? 0),
      };
    });
    return {
      revision: revText ? Number(revText.slice(4)) : null,
      heading: document.querySelector('.decision-card h2')?.textContent?.trim() ?? '',
      phase: hand?.dataset.gesturePhase ?? '',
      insertionPosition: Number(hand?.dataset.insertionPosition || NaN),
      insertionTarget: Number(hand?.dataset.insertionTarget || NaN),
      slots,
    };
  `);
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

    const initial = await waitFor('stable opening auction', async () => {
      const state = await handState(session);
      return state.heading === 'Twoja licytacja' && state.slots.length === 7 && state.revision !== null
        ? state
        : false;
    });
    const openingLabels = initial.slots.map((slot) => slot.label);
    const source = initial.slots[0];
    const targetA = initial.slots[3];
    const targetB = initial.slots[4];
    const heldTargetX = (targetA.x + targetB.x) / 2;

    await touch(session, 'touchStart', [{ x: source.x, y: source.y, radiusX: 7, radiusY: 7, force: 1 }]);
    await sleep(35);
    const steps = 8;
    for (let step = 1; step <= steps; step += 1) {
      const ratio = step / steps;
      await touch(session, 'touchMove', [{
        x: source.x + (heldTargetX - source.x) * ratio,
        y: source.y,
        radiusX: 7,
        radiusY: 7,
        force: 1,
      }]);
      await sleep(28);
    }

    const preview = await waitFor('continuous insertion preview', async () => {
      const state = await handState(session);
      const shifted = state.slots.filter((slot) => Math.abs(slot.shift) > 4);
      return state.phase === 'held'
        && Number.isFinite(state.insertionPosition)
        && state.insertionPosition > 2
        && shifted.length >= 2
        ? { ...state, shifted }
        : false;
    }, 3_000);

    const previewLabels = preview.slots.map((slot) => slot.label);
    if (JSON.stringify(previewLabels) !== JSON.stringify(openingLabels)) {
      throw new Error(`DOM order changed before release: ${JSON.stringify({ openingLabels, previewLabels })}`);
    }
    if (preview.revision !== initial.revision) {
      throw new Error(`living-hand preview changed game revision ${initial.revision} -> ${preview.revision}`);
    }

    const physicallyMoved = preview.slots.filter((slot, index) => Math.abs(slot.x - initial.slots[index].x) > 4);
    if (physicallyMoved.length < 2) {
      throw new Error(`neighbors did not visibly yield before release: ${JSON.stringify({ preview, physicallyMoved })}`);
    }

    await screenshot(session, 'mobile-living-hand-gap-open');
    await touch(session, 'touchEnd', []);

    const settled = await waitFor('local order commit after release', async () => {
      const state = await handState(session);
      const movedIndex = state.slots.findIndex((slot) => slot.label === openingLabels[0]);
      return movedIndex >= 2 && state.phase === 'idle' ? { ...state, movedIndex } : false;
    }, 4_000);

    if (settled.revision !== initial.revision) {
      throw new Error(`local reorder changed game revision ${initial.revision} -> ${settled.revision}`);
    }
    if (settled.slots.some((slot) => Math.abs(slot.shift) > .5)) {
      throw new Error(`preview shift leaked after release: ${JSON.stringify(settled.slots)}`);
    }

    await screenshot(session, 'mobile-living-hand-settled');

    return {
      openingOrder: openingLabels,
      previewOrderUnchanged: true,
      previewRevision: `${initial.revision}->${preview.revision}`,
      insertionPosition: preview.insertionPosition,
      insertionTarget: preview.insertionTarget,
      shiftedNeighbors: preview.shifted.map((slot) => ({ index: slot.index, shift: slot.shift })),
      physicallyMovedNeighbors: physicallyMoved.length,
      releasedToIndex: settled.movedIndex,
      releaseRevision: `${initial.revision}->${settled.revision}`,
    };
  } finally {
    try { await webdriver(`/session/${session}`, { method: 'DELETE' }); } catch {}
  }
}

await mkdir(OUTPUT, { recursive: true });
const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4187']);
const driver = startProcess('chromedriver', ['--port=9529']);

try {
  await waitFor('Vite living-hand server', async () => (await fetch(BASE_URL).catch(() => null))?.ok);
  await waitFor('ChromeDriver', async () => (await fetch(`${WEBDRIVER}/status`).catch(() => null))?.ok);
  const evidence = await run();
  console.log('living hand browser smoke: PASS');
  console.log(JSON.stringify(evidence, null, 2));
} catch (error) {
  console.error('living hand browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  stopProcess(driver.child);
  stopProcess(vite.child);
}