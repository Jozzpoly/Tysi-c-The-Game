import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4183';
const WEBDRIVER = 'http://127.0.0.1:9525';
const OUTPUT = 'artifacts/browser';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(label, probe, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await probe();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(80);
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
  try { process.kill(-child.pid, 'SIGTERM'); } catch { try { child.kill('SIGTERM'); } catch {} }
}

async function webdriver(path, init = {}) {
  const response = await fetch(`${WEBDRIVER}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.value?.error) throw new Error(`WebDriver ${init.method ?? 'GET'} ${path}: ${JSON.stringify(body)}`);
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
    width: 390, height: 844, screenWidth: 390, screenHeight: 844,
    deviceScaleFactor: 1, mobile: true, positionX: 0, positionY: 0,
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

async function touchAt(session, x, y) {
  await cdp(session, 'Input.dispatchTouchEvent', {
    type: 'touchStart', touchPoints: [{ x, y, radiusX: 7, radiusY: 7, force: 1 }],
  });
  await sleep(55);
  await cdp(session, 'Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function buttonGeometry(session) {
  return execute(session, `
    return [...document.querySelectorAll('.decision-card button:not(:disabled), .topbar-actions button:not(:disabled)')].map((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        text: node.textContent?.trim() ?? '',
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        userSelect: style.userSelect,
        webkitUserSelect: style.webkitUserSelect,
        touchAction: style.touchAction,
      };
    });
  `);
}

function assertTouchControls(label, controls) {
  if (!controls.length) throw new Error(`${label}: no enabled controls`);
  for (const control of controls) {
    if (control.height < 43.5) throw new Error(`${label}: touch target too short ${JSON.stringify(control)}`);
    if (control.userSelect !== 'none' && control.webkitUserSelect !== 'none') {
      throw new Error(`${label}: selectable control text ${JSON.stringify(control)}`);
    }
    if (control.touchAction !== 'manipulation') throw new Error(`${label}: unexpected touch-action ${JSON.stringify(control)}`);
  }
}

async function touchButton(session, text, mode = 'exact') {
  const rect = await execute(session, `
    const candidates = [...document.querySelectorAll('button:not(:disabled)')];
    const button = candidates.find((node) => {
      const text = node.textContent?.trim() ?? '';
      return ${JSON.stringify(mode)} === 'exact' ? text === ${JSON.stringify(text)} : text.startsWith(${JSON.stringify(text)});
    });
    if (!button) return null;
    const r = button.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: button.textContent?.trim() ?? '' };
  `);
  if (!rect) throw new Error(`button ${JSON.stringify(text)} not found`);
  await touchAt(session, rect.x, rect.y);
}

async function touchHighestNumericDecision(session) {
  const target = await execute(session, `
    const buttons = [...document.querySelectorAll('.decision-card button:not(:disabled)')]
      .map((node) => ({ node, value: Number(node.textContent?.trim()) }))
      .filter((entry) => Number.isFinite(entry.value))
      .sort((a, b) => b.value - a.value);
    if (!buttons[0]) return null;
    const r = buttons[0].node.getBoundingClientRect();
    return { value: buttons[0].value, x: r.left + r.width / 2, y: r.top + r.height / 2 };
  `);
  if (!target) throw new Error('numeric decision button missing');
  await touchAt(session, target.x, target.y);
  return target.value;
}

async function driveToExchange(session) {
  for (let i = 0; i < 8; i += 1) {
    const heading = await waitFor('auction/exchange decision', () => execute(session, `return document.querySelector('.decision-card h2')?.textContent?.trim() ?? '';`));
    if (heading === 'Oddaj po jednej karcie') return;
    if (heading !== 'Twoja licytacja') {
      await sleep(100);
      continue;
    }
    assertTouchControls('auction', await buttonGeometry(session));
    await touchHighestNumericDecision(session);
    await sleep(120);
  }
  throw new Error('did not reach exchange');
}

async function cardGeometry(session) {
  return execute(session, `
    const cards = [...document.querySelectorAll('.hand .card:not(:disabled)')];
    return cards.map((node, index) => {
      const r = node.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const hit = document.elementFromPoint(x, y);
      const hitButton = hit?.closest?.('button.card');
      const style = getComputedStyle(node);
      return {
        index,
        label: node.getAttribute('aria-label'),
        x, y,
        width: r.width,
        height: r.height,
        centerHitsSelf: hitButton === node,
        userSelect: style.userSelect,
        touchAction: style.touchAction,
      };
    });
  `);
}

async function selectedCount(session) {
  return execute(session, `return document.querySelectorAll('.hand .card.selected').length;`);
}

async function run() {
  const session = await createSession();
  try {
    await emulateMobile(session);
    await navigate(session, `${BASE_URL}?seed=2&seat=0`);
    await waitFor('first human auction', () => execute(session, `return document.querySelector('.decision-card h2')?.textContent?.trim() === 'Twoja licytacja';`));
    await driveToExchange(session);

    assertTouchControls('exchange actions', await buttonGeometry(session));
    const cards = await cardGeometry(session);
    if (cards.length !== 10) throw new Error(`expected 10 selectable exchange cards, got ${cards.length}`);
    for (const card of cards) {
      if (card.width < 47 || card.height < 68) throw new Error(`exchange card target too small ${JSON.stringify(card)}`);
      if (!card.centerHitsSelf) throw new Error(`exchange card center is occluded ${JSON.stringify(card)}`);
      if (card.userSelect !== 'none') throw new Error(`exchange card text selectable ${JSON.stringify(card)}`);
      if (card.touchAction !== 'manipulation') throw new Error(`exchange card touch-action ${JSON.stringify(card)}`);
    }

    await touchAt(session, cards[0].x, cards[0].y);
    await waitFor('first card selected by real touch', async () => (await selectedCount(session)) === 1);
    await touchAt(session, cards.at(-1).x, cards.at(-1).y);
    await waitFor('second card selected by real touch', async () => (await selectedCount(session)) === 2);
    const selection = await execute(session, `return window.getSelection()?.toString() ?? '';`);
    if (selection) throw new Error(`touch selected text instead of remaining action-only: ${JSON.stringify(selection)}`);

    assertTouchControls('exchange confirm', await buttonGeometry(session));
    await touchButton(session, 'Potwierdź wymianę');
    await waitFor('contract decision', () => execute(session, `return document.querySelector('.decision-card h2')?.textContent?.trim() === 'Ile ostatecznie grasz?';`));
    assertTouchControls('contract', await buttonGeometry(session));

    const lowest = await execute(session, `
      const buttons = [...document.querySelectorAll('.decision-card button:not(:disabled)')]
        .map((node) => ({ node, value: Number(node.textContent?.trim()) }))
        .filter((entry) => Number.isFinite(entry.value))
        .sort((a, b) => a.value - b.value);
      if (!buttons[0]) return null;
      const r = buttons[0].node.getBoundingClientRect();
      return { value: buttons[0].value, x: r.left + r.width / 2, y: r.top + r.height / 2 };
    `);
    if (!lowest) throw new Error('contract target missing');
    await touchAt(session, lowest.x, lowest.y);

    await waitFor('touch-playable hand', () => execute(session, `return document.querySelectorAll('.hand .card:not(:disabled)').length > 0;`));
    const playable = await cardGeometry(session);
    if (!playable.length) throw new Error('no touch-playable card');
    await touchAt(session, playable[0].x, playable[0].y);
    await waitFor('card touch accepted', () => execute(session, `return Boolean(document.querySelector('.trick-result')) || document.querySelectorAll('.hand .card').length < 8;`), 8_000);

    const finalSelection = await execute(session, `return window.getSelection()?.toString() ?? '';`);
    if (finalSelection) throw new Error(`gameplay touch left selected text: ${JSON.stringify(finalSelection)}`);
    await screenshot(session, 'mobile-touch-contract');

    return {
      exchangeCards: cards.length,
      minCardWidth: Math.min(...cards.map((card) => card.width)),
      minCardHeight: Math.min(...cards.map((card) => card.height)),
      exchangeCentersHitCorrectCard: cards.every((card) => card.centerHitsSelf),
      contractValue: lowest.value,
    };
  } finally {
    await closeSession(session);
  }
}

await mkdir(OUTPUT, { recursive: true });
const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4183']);
const driver = startProcess('chromedriver', ['--port=9525']);

try {
  await waitFor('Vite touch server', async () => {
    const response = await fetch(BASE_URL).catch(() => null);
    return response?.ok;
  });
  await waitFor('ChromeDriver', async () => {
    const response = await fetch(`${WEBDRIVER}/status`).catch(() => null);
    return response?.ok;
  });
  const evidence = await run();
  console.log('mobile touch browser smoke: PASS');
  console.log(JSON.stringify(evidence, null, 2));
} catch (error) {
  console.error('mobile touch browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  stopProcess(driver.child);
  stopProcess(vite.child);
}
