import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4185';
const WEBDRIVER = 'http://127.0.0.1:9527';
const OUTPUT = 'artifacts/browser';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(label, probe, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await probe();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(60);
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError}` : ''}`);
}

function startProcess(command, args) {
  let output = '';
  const child = spawn(command, args, { detached: true, stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
  const capture = (chunk) => {
    output += chunk.toString();
    if (output.length > 20_000) output = output.slice(-20_000);
  };
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
  if (!response.ok || body?.value?.error) {
    throw new Error(`WebDriver ${init.method ?? 'GET'} ${path}: ${JSON.stringify(body)}`);
  }
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

async function emulateMobile(session) {
  await cdp(session, 'Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    screenWidth: 390,
    screenHeight: 844,
    deviceScaleFactor: 1,
    mobile: true,
    positionX: 0,
    positionY: 0,
    dontSetVisibleSize: false,
  });
  await cdp(session, 'Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
}

async function navigate(session, url) {
  await webdriver(`/session/${session}/url`, { method: 'POST', body: JSON.stringify({ url }) });
}

async function closeSession(session) {
  if (!session) return;
  try { await webdriver(`/session/${session}`, { method: 'DELETE' }); } catch {}
}

async function screenshot(session, name) {
  const base64 = await webdriver(`/session/${session}/screenshot`);
  await writeFile(`${OUTPUT}/${name}.png`, Buffer.from(base64, 'base64'));
}

async function touchStart(session, x, y) {
  await cdp(session, 'Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y, radiusX: 7, radiusY: 7, force: 1 }],
  });
}

async function touchMove(session, x, y) {
  await cdp(session, 'Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x, y, radiusX: 7, radiusY: 7, force: 1 }],
  });
}

async function touchEnd(session) {
  await cdp(session, 'Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function dragTouch(session, from, to, steps = 6, holdBeforeRelease = false) {
  await touchStart(session, from.x, from.y);
  await sleep(40);
  for (let step = 1; step <= steps; step += 1) {
    const ratio = step / steps;
    await touchMove(
      session,
      from.x + (to.x - from.x) * ratio,
      from.y + (to.y - from.y) * ratio,
    );
    await sleep(28);
  }
  if (!holdBeforeRelease) await touchEnd(session);
}

async function uiState(session) {
  return execute(session, `
    const revText = [...document.querySelectorAll('.footer span')]
      .map((node) => node.textContent?.trim() ?? '')
      .find((text) => /^rev \\d+$/.test(text));
    return {
      heading: document.querySelector('.decision-card h2')?.textContent?.trim() ?? '',
      revision: revText ? Number(revText.slice(4)) : null,
      handCount: document.querySelectorAll('.hand .card').length,
      playable: document.querySelectorAll('.hand .card:not(:disabled)').length,
    };
  `);
}

async function handSnapshot(session) {
  return execute(session, `
    return [...document.querySelectorAll('.hand > .hand-slot')].map((slot, index) => {
      const card = slot.querySelector(':scope > .card');
      const rect = card.getBoundingClientRect();
      const slotStyle = getComputedStyle(slot);
      return {
        index,
        label: card.getAttribute('aria-label'),
        disabled: card.disabled,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height,
        slotTouchAction: slotStyle.touchAction,
      };
    });
  `);
}

async function clickButton(session, text) {
  const clicked = await execute(session, `
    const button = [...document.querySelectorAll('button:not(:disabled)')]
      .find((node) => node.textContent?.trim() === ${JSON.stringify(text)});
    if (!button) return false;
    button.click();
    return true;
  `);
  if (!clicked) throw new Error(`button ${JSON.stringify(text)} unavailable`);
}

async function clickHighestNumeric(session) {
  const value = await execute(session, `
    const buttons = [...document.querySelectorAll('.decision-card button:not(:disabled)')]
      .map((node) => ({ node, value: Number(node.textContent?.trim()) }))
      .filter((entry) => Number.isFinite(entry.value))
      .sort((a, b) => b.value - a.value);
    if (!buttons.length) return null;
    buttons[0].node.click();
    return buttons[0].value;
  `);
  if (value === null) throw new Error('numeric decision unavailable');
  return value;
}

async function clickLowestNumeric(session) {
  const value = await execute(session, `
    const buttons = [...document.querySelectorAll('.decision-card button:not(:disabled)')]
      .map((node) => ({ node, value: Number(node.textContent?.trim()) }))
      .filter((entry) => Number.isFinite(entry.value))
      .sort((a, b) => a.value - b.value);
    if (!buttons.length) return null;
    buttons[0].node.click();
    return buttons[0].value;
  `);
  if (value === null) throw new Error('numeric decision unavailable');
  return value;
}

async function waitRevisionAdvance(session, before, label) {
  return waitFor(label, async () => {
    const current = await uiState(session);
    return current.revision !== null && before !== null && current.revision > before ? current : false;
  }, 7_000);
}

async function driveToExchange(session) {
  for (let step = 0; step < 16; step += 1) {
    const state = await waitFor('auction/exchange decision', async () => {
      const current = await uiState(session);
      return current.heading === 'Twoja licytacja' || current.heading === 'Oddaj po jednej karcie' ? current : false;
    });
    if (state.heading === 'Oddaj po jednej karcie') return state;
    const before = state.revision;
    await clickHighestNumeric(session);
    await waitRevisionAdvance(session, before, 'auction revision advance');
  }
  throw new Error('auction did not reach exchange');
}

async function run() {
  const session = await createSession();
  try {
    await emulateMobile(session);
    await navigate(session, `${BASE_URL}?seed=2&seat=0`);
    const initial = await waitFor('initial auction', async () => {
      const current = await uiState(session);
      return current.heading === 'Twoja licytacja' ? current : false;
    });

    const beforeOrder = await handSnapshot(session);
    if (beforeOrder.length !== 7) throw new Error(`expected 7 opening cards, got ${beforeOrder.length}`);
    if (!beforeOrder.every((card) => card.disabled)) throw new Error('opening auction unexpectedly has playable hand cards');
    if (!beforeOrder.every((card) => card.slotTouchAction === 'none')) {
      throw new Error(`hand slots do not own touch gestures: ${JSON.stringify(beforeOrder)}`);
    }

    const draggedLabel = beforeOrder[0].label;
    await dragTouch(
      session,
      { x: beforeOrder[0].x, y: beforeOrder[0].y },
      { x: beforeOrder[3].x, y: beforeOrder[3].y },
    );

    const reordered = await waitFor('local hand reorder', async () => {
      const snapshot = await handSnapshot(session);
      return snapshot[0]?.label !== draggedLabel ? snapshot : false;
    }, 3_000);
    const afterLocalDrag = await uiState(session);
    if (afterLocalDrag.revision !== initial.revision) {
      throw new Error(`presentation-only reorder changed game revision ${initial.revision} -> ${afterLocalDrag.revision}`);
    }
    if (reordered.filter((card) => card.label === draggedLabel)[0]?.index < 2) {
      throw new Error(`dragged card did not materially move: ${JSON.stringify(reordered)}`);
    }
    await screenshot(session, 'mobile-tactile-hand-reordered');

    await driveToExchange(session);
    const exchangeOrder = await handSnapshot(session);
    const reorderedLabels = reordered.map((card) => card.label);
    const retainedOrder = exchangeOrder.map((card) => card.label).filter((label) => reorderedLabels.includes(label));
    if (JSON.stringify(retainedOrder) !== JSON.stringify(reorderedLabels)) {
      throw new Error(`local order did not survive authority revisions: ${JSON.stringify({ reorderedLabels, retainedOrder })}`);
    }

    await execute(session, `document.querySelectorAll('.hand .card:not(:disabled)')[0]?.click();`);
    await execute(session, `document.querySelectorAll('.hand .card:not(:disabled)')[1]?.click();`);
    await waitFor('two exchange selections', () => execute(session, `return document.querySelectorAll('.hand .card.selected').length === 2;`));
    const exchangeRevision = (await uiState(session)).revision;
    await clickButton(session, 'Potwierdź wymianę');
    await waitRevisionAdvance(session, exchangeRevision, 'exchange accepted');

    await waitFor('contract decision', async () => (await uiState(session)).heading === 'Ile ostatecznie grasz?');
    const contractRevision = (await uiState(session)).revision;
    await clickLowestNumeric(session);
    await waitRevisionAdvance(session, contractRevision, 'contract accepted');

    const playableState = await waitFor('playable trick hand', async () => {
      const current = await uiState(session);
      return current.heading === 'Twój ruch' && current.playable > 0 ? current : false;
    }, 10_000);

    await execute(session, `document.querySelector('.hand .card:not(:disabled)')?.scrollIntoView({ block: 'center', inline: 'center' });`);
    await sleep(100);
    const playableCards = (await handSnapshot(session)).filter((card) => !card.disabled);
    if (!playableCards.length) throw new Error('no playable card geometry');
    const card = playableCards[0];
    const beforeThrowCount = playableState.handCount;

    await dragTouch(
      session,
      { x: card.x, y: card.y },
      { x: card.x, y: Math.max(24, card.y - 96) },
      7,
      true,
    );

    const commitReady = await waitFor('throw commit affordance', () => execute(session, `
      const zone = document.querySelector('.tactile-commit-zone.ready');
      const floating = document.querySelector('.tactile-card-float.commit-ready');
      return zone && floating ? { text: zone.textContent?.trim() ?? '', floating: true } : false;
    `), 2_000);
    await screenshot(session, 'mobile-tactile-hand-throw-ready');
    await touchEnd(session);

    const afterThrow = await waitRevisionAdvance(session, playableState.revision, 'thrown card accepted');
    if (afterThrow.handCount !== beforeThrowCount - 1) {
      throw new Error(`throw did not remove exactly one card: ${beforeThrowCount} -> ${afterThrow.handCount}`);
    }

    const selection = await execute(session, `return window.getSelection()?.toString() ?? '';`);
    if (selection) throw new Error(`tactile gestures selected text: ${JSON.stringify(selection)}`);

    return {
      draggedLabel,
      openingOrder: beforeOrder.map((card) => card.label),
      reorderedOrder: reordered.map((card) => card.label),
      orderSurvivedRevisions: true,
      throwCommitText: commitReady.text,
      throwRevision: `${playableState.revision}->${afterThrow.revision}`,
      handCount: `${beforeThrowCount}->${afterThrow.handCount}`,
    };
  } finally {
    await closeSession(session);
  }
}

await mkdir(OUTPUT, { recursive: true });
const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4185']);
const driver = startProcess('chromedriver', ['--port=9527']);

try {
  await waitFor('Vite tactile server', async () => {
    const response = await fetch(BASE_URL).catch(() => null);
    return response?.ok;
  });
  await waitFor('ChromeDriver', async () => {
    const response = await fetch(`${WEBDRIVER}/status`).catch(() => null);
    return response?.ok;
  });
  const evidence = await run();
  console.log('tactile hand browser smoke: PASS');
  console.log(JSON.stringify(evidence, null, 2));
} catch (error) {
  console.error('tactile hand browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  stopProcess(driver.child);
  stopProcess(vite.child);
}
