import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4193/lab/experience/living-slice-v1.html';
const WEBDRIVER = 'http://127.0.0.1:9535';
const OUTPUT = 'artifacts/experience';
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
    await sleep(70);
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError}` : ''}`);
}

function startProcess(command, args) {
  let output = '';
  const child = spawn(command, args, { detached: true, stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
  const capture = (chunk) => {
    output += chunk.toString();
    if (output.length > 25_000) output = output.slice(-25_000);
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
            args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--window-size=1440,900'],
          },
        },
      },
    }),
  });
  return value.sessionId;
}

async function execute(session, script) {
  return webdriver(`/session/${session}/execute/sync`, {
    method: 'POST',
    body: JSON.stringify({ script, args: [] }),
  });
}

async function cdp(session, cmd, params = {}) {
  return webdriver(`/session/${session}/goog/cdp/execute`, {
    method: 'POST', body: JSON.stringify({ cmd, params }),
  });
}

async function setViewport(session, width, height, mobile) {
  await cdp(session, 'Emulation.setDeviceMetricsOverride', {
    width, height, screenWidth: width, screenHeight: height,
    deviceScaleFactor: 1, mobile, positionX: 0, positionY: 0,
    dontSetVisibleSize: false,
  });
  await cdp(session, 'Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 });
}

async function navigate(session) {
  await webdriver(`/session/${session}/url`, { method: 'POST', body: JSON.stringify({ url: BASE_URL }) });
  await waitFor('Living Slice ready', () => execute(session, `return Boolean(window.__livingSlice) && document.body.dataset.sliceState === 'ready';`));
}

async function closeSession(session) {
  if (!session) return;
  try { await webdriver(`/session/${session}`, { method: 'DELETE' }); } catch {}
}

async function screenshot(session, name) {
  const base64 = await webdriver(`/session/${session}/screenshot`);
  await writeFile(`${OUTPUT}/${name}.png`, Buffer.from(base64, 'base64'));
}

async function snapshot(session) {
  return execute(session, `return window.__livingSlice.snapshot();`);
}

async function geometry(session) {
  return execute(session, `
    const nodes = [...document.querySelectorAll('[data-hand] .hand-card:not(.placeholder)')];
    const cards = nodes.map((node, index) => {
      const rect = node.getBoundingClientRect();
      const next = nodes[index + 1]?.getBoundingClientRect();
      const exposed = next ? Math.max(8, Math.min(rect.width, next.left - rect.left)) : rect.width;
      const x = index === nodes.length - 1 ? rect.left + rect.width * .56 : rect.left + exposed * .46;
      const y = rect.top + rect.height * .58;
      const hit = document.elementFromPoint(x, y)?.closest?.('.hand-card');
      return {
        card: node.dataset.card,
        play: node.dataset.play,
        x, y,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
        physicallyAcquirable: hit === node,
      };
    });
    const shared = document.querySelector('[data-anchor="trick:shared"]').getBoundingClientRect();
    return {
      width: innerWidth,
      height: innerHeight,
      docWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      hand: document.querySelector('[data-hand]').getBoundingClientRect().toJSON(),
      shared: shared.toJSON(),
      cards,
    };
  `);
}

async function mouseDrag(session, from, to, steps = 12) {
  await cdp(session, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x: from.x, y: from.y, button: 'none' });
  await cdp(session, 'Input.dispatchMouseEvent', { type: 'mousePressed', x: from.x, y: from.y, button: 'left', buttons: 1, clickCount: 1 });
  for (let i = 1; i <= steps; i += 1) {
    const u = i / steps;
    await cdp(session, 'Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: from.x + (to.x - from.x) * u,
      y: from.y + (to.y - from.y) * u,
      button: 'left', buttons: 1,
    });
    await sleep(12);
  }
  await cdp(session, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x: to.x, y: to.y, button: 'left', buttons: 0, clickCount: 1 });
}

async function touchDrag(session, from, to, steps = 12) {
  await cdp(session, 'Input.dispatchTouchEvent', {
    type: 'touchStart', touchPoints: [{ x: from.x, y: from.y, radiusX: 7, radiusY: 7, force: 1 }],
  });
  for (let i = 1; i <= steps; i += 1) {
    const u = i / steps;
    await cdp(session, 'Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: from.x + (to.x - from.x) * u, y: from.y + (to.y - from.y) * u, radiusX: 7, radiusY: 7, force: 1 }],
    });
    await sleep(12);
  }
  await cdp(session, 'Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function drag(session, mobile, from, to) {
  if (mobile) return touchDrag(session, from, to);
  return mouseDrag(session, from, to);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function cardBy(geo, id) {
  const card = geo.cards.find((entry) => entry.card === id);
  if (!card) throw new Error(`card ${id} missing from geometry ${JSON.stringify(geo.cards)}`);
  return card;
}

function playTarget(geo) {
  return {
    x: geo.shared.left + geo.shared.width * .50,
    y: geo.shared.top + geo.shared.height * .58,
  };
}

async function assertBaseline(session, label, expectedWidth) {
  const snap = await snapshot(session);
  const geo = await geometry(session);
  assert(snap.phase === 'ready', `${label}: expected ready, got ${snap.phase}`);
  assert(snap.hand.length === 7, `${label}: expected 7 cards, got ${snap.hand.length}`);
  assert(snap.capturedValue === 40, `${label}: captured value changed at rest`);
  assert(snap.matchScore === 340, `${label}: match score changed at rest`);
  assert(snap.trickCards.join(',') === '10H,KH', `${label}: unexpected pre-trick ${snap.trickCards}`);
  assert(!snap.overflowX, `${label}: snapshot reports horizontal overflow`);
  assert(geo.width === expectedWidth && geo.docWidth === expectedWidth, `${label}: viewport mismatch ${geo.width}/${geo.docWidth}`);
  assert(geo.scrollWidth <= expectedWidth + 1, `${label}: horizontal overflow ${geo.scrollWidth} > ${expectedWidth}`);
  assert(geo.cards.every((card) => card.width >= 56 && card.height >= 78), `${label}: undersized card ${JSON.stringify(geo.cards)}`);
  assert(geo.cards.every((card) => card.physicallyAcquirable), `${label}: occluded acquisition region ${JSON.stringify(geo.cards)}`);
  assert(snap.playable.includes('JH') && snap.playable.includes('AH'), `${label}: expected two heart play candidates ${snap.playable}`);
  return { snap, geo };
}

async function testReorder(session, mobile, label) {
  const before = await snapshot(session);
  const geo = await geometry(session);
  const from = cardBy(geo, '9C');
  const destination = cardBy(geo, 'QS');
  await drag(session, mobile, { x: from.x, y: from.y }, { x: destination.left + destination.width * .78, y: from.y });
  await waitFor(`${label}: reorder settle`, async () => (await snapshot(session)).phase === 'ready');
  const after = await snapshot(session);
  assert(after.hand.includes('9C'), `${label}: reorder lost 9C`);
  assert(after.hand.join(',') !== before.hand.join(','), `${label}: reorder did not alter local topology`);
  assert(after.trickCards.join(',') === '10H,KH', `${label}: reorder accidentally touched trick`);
  assert(!after.trace.some((event) => event.type === 'commit'), `${label}: reorder accidentally committed play`);
  return after.hand;
}

async function testIllegalProbe(session, mobile, label) {
  const geo = await geometry(session);
  const card = cardBy(geo, 'QS');
  await drag(session, mobile, { x: card.x, y: card.y }, playTarget(geo));
  await waitFor(`${label}: illegal probe settles`, async () => (await snapshot(session)).phase === 'ready');
  const after = await snapshot(session);
  assert(after.hand.includes('QS'), `${label}: illegal probe lost owned card`);
  assert(after.capturedValue === 40, `${label}: illegal probe changed captured value`);
  assert(after.matchScore === 340, `${label}: illegal probe changed match score`);
  assert(after.trace.some((event) => event.type === 'illegal-play-probe' && event.card === 'QS'), `${label}: illegal probe not recorded`);
}

async function testReject(session, mobile, label) {
  await execute(session, `window.__livingSlice.rejectNext(); return true;`);
  const geo = await geometry(session);
  const card = cardBy(geo, 'JH');
  await drag(session, mobile, { x: card.x, y: card.y }, playTarget(geo));
  await waitFor(`${label}: reject returns to ready`, async () => {
    const snap = await snapshot(session);
    return snap.phase === 'ready' && snap.trace.some((event) => event.type === 'authority-reject');
  });
  const after = await snapshot(session);
  assert(after.hand.includes('JH'), `${label}: rejected card did not return to hand`);
  assert(after.capturedValue === 40, `${label}: rejected command changed captured value`);
  assert(after.matchScore === 340, `${label}: rejected command changed match score`);
  assert(after.trickCards.join(',') === '10H,KH', `${label}: reject polluted shared trick`);
}

async function testAccept(session, mobile, label) {
  const geo = await geometry(session);
  const card = cardBy(geo, 'AH');
  await drag(session, mobile, { x: card.x, y: card.y }, playTarget(geo));
  await waitFor(`${label}: accepted scene settles`, async () => (await snapshot(session)).phase === 'settled');
  const after = await snapshot(session);
  assert(!after.hand.includes('AH'), `${label}: accepted card remained in hand`);
  assert(after.capturedValue === 65, `${label}: expected captured value 65, got ${after.capturedValue}`);
  assert(after.matchScore === 340, `${label}: ordinary trick illegally changed match score to ${after.matchScore}`);
  assert(after.trickCards.length === 0, `${label}: trick cards did not collect ${after.trickCards}`);
  assert(after.initiative.includes('Prowadzisz'), `${label}: next initiative not exposed ${after.initiative}`);
  for (const type of ['authority-accept', 'trick-completed', 'captured-value', 'initiative']) {
    assert(after.trace.some((event) => event.type === type), `${label}: missing trace ${type}`);
  }
  const value = after.trace.find((event) => event.type === 'captured-value');
  assert(value.before === 40 && value.delta === 25 && value.after === 65 && value.matchScore === 340, `${label}: wrong value causality ${JSON.stringify(value)}`);
  return after;
}

async function runViewport({ label, width, height, mobile }) {
  const session = await createSession();
  try {
    await setViewport(session, width, height, mobile);
    await navigate(session);
    const baseline = await assertBaseline(session, label, width);
    await screenshot(session, `${label}-ready`);
    const reordered = await testReorder(session, mobile, label);
    await testIllegalProbe(session, mobile, label);
    await testReject(session, mobile, label);
    const settled = await testAccept(session, mobile, label);
    await screenshot(session, `${label}-settled`);
    const selection = await execute(session, `return window.getSelection()?.toString() ?? '';`);
    assert(!selection, `${label}: interaction left selected text ${JSON.stringify(selection)}`);
    return { label, baseline: baseline.snap, reordered, settled };
  } finally {
    await closeSession(session);
  }
}

await mkdir(OUTPUT, { recursive: true });
const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4193']);
const driver = startProcess('chromedriver', ['--port=9535']);

try {
  await waitFor('Vite experience server', async () => {
    const response = await fetch(BASE_URL).catch(() => null);
    return response?.ok;
  });
  await waitFor('ChromeDriver experience', async () => {
    const response = await fetch(`${WEBDRIVER}/status`).catch(() => null);
    return response?.ok;
  });
  const desktop = await runViewport({ label: 'living-slice-desktop', width: 1440, height: 900, mobile: false });
  const mobile = await runViewport({ label: 'living-slice-mobile', width: 390, height: 844, mobile: true });
  console.log('experience living slice browser smoke: PASS');
  console.log(JSON.stringify({ desktop, mobile }, null, 2));
} catch (error) {
  console.error('experience living slice browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  stopProcess(driver.child);
  stopProcess(vite.child);
}
