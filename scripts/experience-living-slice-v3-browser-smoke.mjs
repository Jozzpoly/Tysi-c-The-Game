import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4195/lab/experience/living-slice-v3.html?geometry=c';
const WEBDRIVER = 'http://127.0.0.1:9537';
const OUTPUT = 'artifacts/experience';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(label, probe, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await probe();
      if (value) return value;
    } catch (error) { lastError = error; }
    await sleep(30);
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError}` : ''}`);
}

function startProcess(command, args) {
  let output = '';
  const child = spawn(command, args, { detached: true, stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
  const capture = (chunk) => {
    output += chunk.toString();
    if (output.length > 25000) output = output.slice(-25000);
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

async function execute(session, script) {
  return webdriver(`/session/${session}/execute/sync`, { method: 'POST', body: JSON.stringify({ script, args: [] }) });
}

async function cdp(session, cmd, params = {}) {
  return webdriver(`/session/${session}/goog/cdp/execute`, { method: 'POST', body: JSON.stringify({ cmd, params }) });
}

async function screenshot(session, name) {
  const base64 = await webdriver(`/session/${session}/screenshot`);
  await writeFile(`${OUTPUT}/${name}.png`, Buffer.from(base64, 'base64'));
}

function assert(condition, message) { if (!condition) throw new Error(message); }
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

async function createSession() {
  const value = await webdriver('/session', {
    method: 'POST',
    body: JSON.stringify({ capabilities: { alwaysMatch: { browserName: 'chrome', 'goog:chromeOptions': { args: ['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--window-size=1440,900'] } } } }),
  });
  return value.sessionId;
}

async function setViewport(session, width, height, mobile) {
  await cdp(session, 'Emulation.setDeviceMetricsOverride', {
    width, height, screenWidth: width, screenHeight: height,
    deviceScaleFactor: 1, mobile, positionX: 0, positionY: 0, dontSetVisibleSize: false,
  });
  await cdp(session, 'Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 });
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
      return { card:node.dataset.card, x, y, left:rect.left, top:rect.top, width:rect.width, height:rect.height, physicallyAcquirable:hit === node };
    });
    const shared = document.querySelector('[data-anchor="trick:shared"]').getBoundingClientRect();
    return { width:innerWidth, docWidth:document.documentElement.clientWidth, scrollWidth:document.documentElement.scrollWidth, cards, shared:shared.toJSON() };
  `);
}

async function flightGeometry(session) {
  return execute(session, `
    const ghost = document.querySelector('.source-ghost');
    const seat = document.querySelector('[data-anchor="seat:1"] .seat-source');
    const target = document.querySelector('[data-anchor="trick-card:1"]');
    const point = (node) => {
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return { x:r.left+r.width/2, y:r.top+r.height/2, width:r.width, height:r.height };
    };
    return {
      phase: document.body.dataset.sliceState,
      flight: ghost?.dataset.flight ?? null,
      ghost:point(ghost), seat:point(seat), target:point(target),
      opacity:ghost ? Number(getComputedStyle(ghost).opacity) : null,
      fixtureVersion:document.body.dataset.fixtureVersion,
    };
  `);
}

async function mouseDrag(session, from, to, steps = 12) {
  await cdp(session, 'Input.dispatchMouseEvent', { type:'mouseMoved', x:from.x, y:from.y, button:'none' });
  await cdp(session, 'Input.dispatchMouseEvent', { type:'mousePressed', x:from.x, y:from.y, button:'left', buttons:1, clickCount:1 });
  for (let i = 1; i <= steps; i += 1) {
    const u = i / steps;
    await cdp(session, 'Input.dispatchMouseEvent', { type:'mouseMoved', x:from.x+(to.x-from.x)*u, y:from.y+(to.y-from.y)*u, button:'left', buttons:1 });
    await sleep(10);
  }
  await cdp(session, 'Input.dispatchMouseEvent', { type:'mouseReleased', x:to.x, y:to.y, button:'left', buttons:0, clickCount:1 });
}

async function touchDrag(session, from, to, steps = 12) {
  await cdp(session, 'Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{ x:from.x, y:from.y, radiusX:7, radiusY:7, force:1 }] });
  for (let i = 1; i <= steps; i += 1) {
    const u = i / steps;
    await cdp(session, 'Input.dispatchTouchEvent', { type:'touchMove', touchPoints:[{ x:from.x+(to.x-from.x)*u, y:from.y+(to.y-from.y)*u, radiusX:7, radiusY:7, force:1 }] });
    await sleep(10);
  }
  await cdp(session, 'Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] });
}

async function drag(session, mobile, from, to) {
  return mobile ? touchDrag(session, from, to) : mouseDrag(session, from, to);
}

function cardBy(geo, id) {
  const card = geo.cards.find((entry) => entry.card === id);
  if (!card) throw new Error(`card ${id} missing`);
  return card;
}

function playTarget(geo) {
  return { x:geo.shared.left + geo.shared.width * .5, y:geo.shared.top + geo.shared.height * .58 };
}

async function testSourceFlight(session, label) {
  await execute(session, `window.__livingSlice.setTimingScale(4); window.__livingSlice.replayOpponentSources(); return true;`);
  await waitFor(`${label}: establish`, () => execute(session, `return document.querySelector('.source-ghost')?.dataset.flight === 'establish';`));
  const origin = await flightGeometry(session);
  assert(origin.fixtureVersion === '3', `${label}: wrong fixture version ${origin.fixtureVersion}`);
  assert(origin.ghost && origin.seat && origin.target, `${label}: missing flight geometry ${JSON.stringify(origin)}`);
  assert(origin.opacity > .5, `${label}: ghost too faint ${origin.opacity}`);
  const originSourceDistance = distance(origin.ghost, origin.seat);
  const originTargetDistance = distance(origin.ghost, origin.target);
  assert(originSourceDistance < 12, `${label}: establish not owned by source ${originSourceDistance.toFixed(2)}px`);
  assert(originTargetDistance > 70, `${label}: source and target collapse spatially ${originTargetDistance.toFixed(2)}px`);
  await screenshot(session, `${label}-source-establish`);

  await waitFor(`${label}: flight start`, () => execute(session, `return document.querySelector('.source-ghost')?.dataset.flight === 'moving';`));
  await sleep(120);
  const mid = await flightGeometry(session);
  assert(mid.ghost, `${label}: ghost disappeared before mid-flight`);
  const midTargetDistance = distance(mid.ghost, mid.target);
  assert(midTargetDistance < originTargetDistance * .82, `${label}: no material flight progress ${midTargetDistance.toFixed(2)} vs ${originTargetDistance.toFixed(2)}`);
  await screenshot(session, `${label}-source-mid`);

  await waitFor(`${label}: source replay ready`, () => execute(session, `return window.__livingSlice.snapshot().phase === 'ready';`));
  await execute(session, `window.__livingSlice.setTimingScale(1); return true;`);
  const trace = (await snapshot(session)).trace;
  for (const type of ['source-establish','source-flight','source-arrival']) {
    const events = trace.filter((event) => event.type === type);
    assert(events.length === 2 && events[0].seat === 1 && events[1].seat === 2, `${label}: wrong ${type} trace ${JSON.stringify(events)}`);
  }
  return { originSourceDistance, originTargetDistance, midTargetDistance };
}

async function testInteractionChain(session, mobile, label) {
  let snap = await snapshot(session);
  let geo = await geometry(session);
  assert(snap.version === 3, `${label}: expected v3 snapshot`);
  assert(snap.phase === 'ready' && snap.hand.length === 7, `${label}: bad baseline`);
  assert(snap.capturedValue === 40 && snap.matchScore === 340, `${label}: bad baseline values`);
  assert(geo.width === geo.docWidth && geo.scrollWidth <= geo.width + 1, `${label}: horizontal overflow`);
  assert(geo.cards.every((card) => card.physicallyAcquirable && card.width >= 56 && card.height >= 78), `${label}: bad acquisition geometry`);
  await screenshot(session, `${label}-ready`);

  const reorderFrom = cardBy(geo, '9C');
  const reorderTo = cardBy(geo, 'QS');
  await drag(session, mobile, { x:reorderFrom.x, y:reorderFrom.y }, { x:reorderTo.left+reorderTo.width*.78, y:reorderFrom.y });
  await waitFor(`${label}: reorder`, async () => (await snapshot(session)).phase === 'ready');
  snap = await snapshot(session);
  assert(snap.hand.includes('9C') && snap.hand.join(',') !== '9C,JH,QS,AH,KD,10C,9S', `${label}: reorder failed`);
  assert(!snap.trace.some((event) => event.type === 'commit'), `${label}: reorder accidentally committed`);

  geo = await geometry(session);
  const illegal = cardBy(geo, 'QS');
  await drag(session, mobile, { x:illegal.x, y:illegal.y }, playTarget(geo));
  await waitFor(`${label}: illegal return`, async () => (await snapshot(session)).phase === 'ready');
  snap = await snapshot(session);
  assert(snap.hand.includes('QS') && snap.capturedValue === 40 && snap.matchScore === 340, `${label}: illegal probe corrupted state`);
  assert(snap.trace.some((event) => event.type === 'illegal-play-probe' && event.card === 'QS'), `${label}: missing illegal probe trace`);

  await execute(session, `window.__livingSlice.rejectNext(); return true;`);
  geo = await geometry(session);
  const rejectCard = cardBy(geo, 'JH');
  await drag(session, mobile, { x:rejectCard.x, y:rejectCard.y }, playTarget(geo));
  await waitFor(`${label}: reject`, async () => {
    const current = await snapshot(session);
    return current.phase === 'ready' && current.trace.some((event) => event.type === 'authority-reject');
  });
  snap = await snapshot(session);
  assert(snap.hand.includes('JH') && snap.capturedValue === 40 && snap.matchScore === 340, `${label}: reject corrupted truth`);

  geo = await geometry(session);
  const acceptCard = cardBy(geo, 'AH');
  await drag(session, mobile, { x:acceptCard.x, y:acceptCard.y }, playTarget(geo));
  await waitFor(`${label}: accept settle`, async () => (await snapshot(session)).phase === 'settled');
  snap = await snapshot(session);
  assert(!snap.hand.includes('AH'), `${label}: accepted card remained in hand`);
  assert(snap.capturedValue === 65, `${label}: expected captured value 65, got ${snap.capturedValue}`);
  assert(snap.matchScore === 340, `${label}: ordinary trick changed match score`);
  assert(snap.trickCards.length === 0, `${label}: trick did not collect`);
  assert(snap.nextInitiativeVisual && snap.recentCaptureVisual, `${label}: missing persistent consequence/initiative cues`);
  const value = snap.trace.find((event) => event.type === 'captured-value');
  assert(value?.before === 40 && value?.delta === 25 && value?.after === 65 && value?.matchScore === 340, `${label}: wrong value causality`);
  await screenshot(session, `${label}-settled`);
  return snap;
}

async function runViewport({ label, width, height, mobile }) {
  const session = await createSession();
  try {
    await setViewport(session, width, height, mobile);
    await webdriver(`/session/${session}/url`, { method:'POST', body:JSON.stringify({ url:BASE_URL }) });
    await waitFor(`${label}: fixture ready`, () => execute(session, `return Boolean(window.__livingSlice) && window.__livingSlice.snapshot().version === 3;`));
    const flight = await testSourceFlight(session, label);
    const settled = await testInteractionChain(session, mobile, label);
    const selection = await execute(session, `return window.getSelection()?.toString() ?? '';`);
    assert(!selection, `${label}: interaction left selected text ${JSON.stringify(selection)}`);
    return { label, flight, settled: { capturedValue:settled.capturedValue, matchScore:settled.matchScore, initiative:settled.initiative } };
  } finally {
    try { await webdriver(`/session/${session}`, { method:'DELETE' }); } catch {}
  }
}

await mkdir(OUTPUT, { recursive: true });
const vite = startProcess('npm', ['run','dev','--','--host','127.0.0.1','--port','4195']);
const driver = startProcess('chromedriver', ['--port=9537']);

try {
  await waitFor('Vite v3 server', async () => (await fetch(BASE_URL).catch(() => null))?.ok);
  await waitFor('ChromeDriver v3', async () => (await fetch(`${WEBDRIVER}/status`).catch(() => null))?.ok);
  const desktop = await runViewport({ label:'living-slice-v3-desktop', width:1440, height:900, mobile:false });
  const mobile = await runViewport({ label:'living-slice-v3-mobile', width:390, height:844, mobile:true });
  console.log('experience living slice v3 browser smoke: PASS');
  console.log(JSON.stringify({ desktop, mobile }, null, 2));
} catch (error) {
  console.error('experience living slice v3 browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  stopProcess(driver.child);
  stopProcess(vite.child);
}
