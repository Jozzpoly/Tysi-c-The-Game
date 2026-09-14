import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4188';
const WEBDRIVER = 'http://127.0.0.1:9530';
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

async function cdp(session, cmd, params = {}) {
  return webdriver(`/session/${session}/goog/cdp/execute`, {
    method: 'POST', body: JSON.stringify({ cmd, params }),
  });
}

async function execute(session, script) {
  return webdriver(`/session/${session}/execute/sync`, {
    method: 'POST', body: JSON.stringify({ script, args: [] }),
  });
}

async function createSession() {
  const value = await webdriver('/session', {
    method: 'POST',
    body: JSON.stringify({
      capabilities: {
        alwaysMatch: {
          browserName: 'chrome',
          'goog:chromeOptions': {
            args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--window-size=1440,1000'],
          },
        },
      },
    }),
  });
  return value.sessionId;
}

async function mouse(session, type, x, y, pressed = false) {
  await cdp(session, 'Input.dispatchMouseEvent', {
    type,
    x,
    y,
    button: type === 'mouseMoved' ? 'none' : 'left',
    buttons: pressed ? 1 : 0,
    clickCount: type === 'mouseMoved' ? 0 : 1,
  });
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
    const slots = [...document.querySelectorAll('.hand > .hand-slot')].map((slot, index) => {
      const rect = slot.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const hit = document.elementFromPoint(x, y);
      return {
        index,
        label: slot.querySelector(':scope > .card')?.getAttribute('aria-label') ?? '',
        card: slot.dataset.card ?? '',
        x,
        y,
        shift: Number(slot.dataset.previewShiftX ?? 0),
        hitCard: hit?.closest?.('.hand-slot')?.dataset?.card ?? '',
        hitTag: hit?.tagName ?? '',
        hitClass: typeof hit?.className === 'string' ? hit.className : '',
      };
    });
    return {
      heading: document.querySelector('.decision-card h2')?.textContent?.trim() ?? '',
      revision: revText ? Number(revText.slice(4)) : null,
      phase: hand?.dataset.gesturePhase ?? '',
      insertionPosition: Number(hand?.dataset.insertionPosition || NaN),
      insertionTarget: Number(hand?.dataset.insertionTarget || NaN),
      slots,
    };
  `);
}

async function installPointerTrace(session) {
  await execute(session, `
    window.__desktopPointerTrace = [];
    for (const type of ['pointerdown', 'pointermove', 'gotpointercapture', 'lostpointercapture', 'pointerup', 'pointercancel']) {
      document.addEventListener(type, (event) => {
        const targetSlot = event.target?.closest?.('.hand-slot');
        window.__desktopPointerTrace.push({
          type,
          pointerId: event.pointerId,
          pointerType: event.pointerType,
          button: event.button,
          buttons: event.buttons,
          x: Math.round(event.clientX * 10) / 10,
          y: Math.round(event.clientY * 10) / 10,
          targetCard: targetSlot?.dataset?.card ?? '',
          phase: document.querySelector('.tactile-hand')?.dataset?.gesturePhase ?? '',
        });
      }, true);
    }
    return true;
  `);
}

async function pointerTrace(session) {
  return execute(session, `return window.__desktopPointerTrace ?? [];`);
}

async function run() {
  const session = await createSession();
  try {
    await cdp(session, 'Emulation.setDeviceMetricsOverride', {
      width: 1440, height: 1000, screenWidth: 1440, screenHeight: 1000,
      deviceScaleFactor: 1, mobile: false, positionX: 0, positionY: 0, dontSetVisibleSize: false,
    });
    await webdriver(`/session/${session}/url`, {
      method: 'POST', body: JSON.stringify({ url: `${BASE_URL}?seed=2&seat=0` }),
    });
    const initial = await waitFor('desktop opening auction', async () => {
      const candidate = await state(session);
      return candidate.heading === 'Twoja licytacja' && candidate.slots.length === 7 && candidate.revision !== null
        ? candidate
        : false;
    });
    const labels = initial.slots.map((slot) => slot.label);
    const source = initial.slots[0];
    const targetX = (initial.slots[3].x + initial.slots[4].x) / 2;
    await installPointerTrace(session);

    await mouse(session, 'mousePressed', source.x, source.y, true);
    await sleep(45);
    const afterPress = await state(session);
    for (let step = 1; step <= 8; step += 1) {
      const ratio = step / 8;
      await mouse(session, 'mouseMoved', source.x + (targetX - source.x) * ratio, source.y, true);
      await sleep(28);
    }
    const afterMoves = await state(session);
    const trace = await pointerTrace(session);

    const shiftedAfterMoves = afterMoves.slots.filter((slot) => Math.abs(slot.shift) > 6);
    if (!(afterMoves.phase === 'held' && afterMoves.insertionPosition > 3 && shiftedAfterMoves.length >= 2)) {
      await screenshot(session, 'desktop-living-hand-diagnostic-fail');
      throw new Error(`desktop living gap missing: ${JSON.stringify({
        source,
        targetX,
        sourceHitMatches: source.hitCard === source.card,
        afterPress: {
          phase: afterPress.phase,
          insertionPosition: afterPress.insertionPosition,
          insertionTarget: afterPress.insertionTarget,
        },
        afterMoves: {
          phase: afterMoves.phase,
          insertionPosition: afterMoves.insertionPosition,
          insertionTarget: afterMoves.insertionTarget,
          shifted: shiftedAfterMoves.map((slot) => ({ index: slot.index, card: slot.card, shift: slot.shift })),
        },
        pointerTrace: trace,
      })}`);
    }

    const preview = { ...afterMoves, shifted: shiftedAfterMoves };
    if (JSON.stringify(preview.slots.map((slot) => slot.label)) !== JSON.stringify(labels)) {
      throw new Error('desktop order changed before mouse release');
    }
    if (preview.revision !== initial.revision) {
      throw new Error(`desktop preview changed revision ${initial.revision} -> ${preview.revision}`);
    }
    const physicallyMoved = preview.slots.filter((slot, index) => Math.abs(slot.x - initial.slots[index].x) > 6);
    if (physicallyMoved.length < 2) throw new Error(`desktop neighbors did not yield: ${JSON.stringify(preview)}`);
    await screenshot(session, 'desktop-living-hand-gap-open');

    await mouse(session, 'mouseReleased', targetX, source.y, false);
    const settled = await waitFor('desktop reorder settle', async () => {
      const candidate = await state(session);
      const movedIndex = candidate.slots.findIndex((slot) => slot.label === labels[0]);
      return candidate.phase === 'idle' && movedIndex >= 2 ? { ...candidate, movedIndex } : false;
    });
    if (settled.revision !== initial.revision) {
      throw new Error(`desktop reorder changed revision ${initial.revision} -> ${settled.revision}`);
    }
    await screenshot(session, 'desktop-living-hand-settled');

    return {
      sourceHitMatches: source.hitCard === source.card,
      pressPhase: afterPress.phase,
      previewOrderUnchanged: true,
      previewRevision: `${initial.revision}->${preview.revision}`,
      insertionPosition: preview.insertionPosition,
      shiftedNeighbors: preview.shifted.map((slot) => ({ index: slot.index, shift: slot.shift })),
      physicallyMovedNeighbors: physicallyMoved.length,
      pointerEvents: trace.map(({ type, targetCard, phase }) => ({ type, targetCard, phase })),
      releasedToIndex: settled.movedIndex,
      releaseRevision: `${initial.revision}->${settled.revision}`,
    };
  } finally {
    try { await webdriver(`/session/${session}`, { method: 'DELETE' }); } catch {}
  }
}

await mkdir(OUTPUT, { recursive: true });
const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4188']);
const driver = startProcess('chromedriver', ['--port=9530']);
try {
  await waitFor('Vite desktop living server', async () => (await fetch(BASE_URL).catch(() => null))?.ok);
  await waitFor('ChromeDriver desktop living', async () => (await fetch(`${WEBDRIVER}/status`).catch(() => null))?.ok);
  const evidence = await run();
  console.log('desktop living hand browser smoke: PASS');
  console.log(JSON.stringify(evidence, null, 2));
} catch (error) {
  console.error('desktop living hand browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  stopProcess(driver.child);
  stopProcess(vite.child);
}
