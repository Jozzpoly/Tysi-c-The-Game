import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE = 'http://127.0.0.1:4196/lab/experience/hand-body-v4.html';
const WEBDRIVER = 'http://127.0.0.1:9538';
const OUTPUT = 'artifacts/experience';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function assert(condition, message) { if (!condition) throw new Error(message); }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

async function waitFor(label, probe, timeoutMs = 12000) {
  const end = Date.now() + timeoutMs;
  let last;
  while (Date.now() < end) {
    try { const value = await probe(); if (value) return value; } catch (error) { last = error; }
    await sleep(35);
  }
  throw new Error(`${label} timed out${last ? `: ${last}` : ''}`);
}

function startProcess(command, args) {
  let output = '';
  const child = spawn(command, args, { detached: true, stdio: ['ignore','pipe','pipe'], env: process.env });
  const capture = (chunk) => { output += chunk.toString(); if (output.length > 22000) output = output.slice(-22000); };
  child.stdout.on('data', capture); child.stderr.on('data', capture);
  return { child, getOutput: () => output };
}
function stopProcess(child) {
  if (!child?.pid || child.exitCode !== null) return;
  try { process.kill(-child.pid, 'SIGTERM'); } catch { try { child.kill('SIGTERM'); } catch {} }
}

async function webdriver(path, init = {}) {
  const response = await fetch(`${WEBDRIVER}${path}`, { ...init, headers: { 'content-type':'application/json', ...(init.headers ?? {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.value?.error) throw new Error(`WebDriver ${init.method ?? 'GET'} ${path}: ${JSON.stringify(body)}`);
  return body.value;
}
async function execute(session, script) {
  return webdriver(`/session/${session}/execute/sync`, { method:'POST', body:JSON.stringify({ script, args:[] }) });
}
async function cdp(session, cmd, params = {}) {
  return webdriver(`/session/${session}/goog/cdp/execute`, { method:'POST', body:JSON.stringify({ cmd, params }) });
}
async function screenshot(session, name) {
  const data = await webdriver(`/session/${session}/screenshot`);
  await writeFile(`${OUTPUT}/${name}.png`, Buffer.from(data, 'base64'));
}
async function createSession() {
  const value = await webdriver('/session', { method:'POST', body:JSON.stringify({ capabilities:{ alwaysMatch:{ browserName:'chrome', 'goog:chromeOptions':{ args:['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--window-size=1440,900'] } } } }) });
  return value.sessionId;
}
async function setViewport(session, width, height, mobile) {
  await cdp(session, 'Emulation.setDeviceMetricsOverride', { width, height, screenWidth:width, screenHeight:height, deviceScaleFactor:1, mobile, positionX:0, positionY:0, dontSetVisibleSize:false });
  await cdp(session, 'Emulation.setTouchEmulationEnabled', { enabled:mobile, maxTouchPoints:mobile ? 5 : 1 });
}
async function navigate(session, mobile, assist = 'auto') {
  const url = `${BASE}?assist=${assist}${mobile ? '&debugFinger=1' : ''}`;
  await webdriver(`/session/${session}/url`, { method:'POST', body:JSON.stringify({ url }) });
  await waitFor('Hand Body V4 ready', () => execute(session, `return Boolean(window.__handBodyV4) && window.__handBodyV4.snapshot().version === 4;`));
}
async function snapshot(session) { return execute(session, `return window.__handBodyV4.snapshot();`); }

async function cardsGeometry(session) {
  return execute(session, `
    return [...document.querySelectorAll('[data-hand] .hand-card:not(.placeholder)')].map((node) => {
      const r = node.getBoundingClientRect();
      return { card:node.dataset.card, left:r.left, top:r.top, width:r.width, height:r.height, right:r.right, bottom:r.bottom };
    });
  `);
}
async function heldGeometry(session) {
  return execute(session, `
    const node = document.querySelector('.hand-card.held');
    if (!node) return null;
    const r = node.getBoundingClientRect();
    return { left:r.left, top:r.top, width:r.width, height:r.height, right:r.right, bottom:r.bottom };
  `);
}
async function intentGeometry(session) {
  return execute(session, `
    const r = document.querySelector('[data-intent-space]').getBoundingClientRect();
    return { left:r.left, top:r.top, width:r.width, height:r.height };
  `);
}
function cardBy(cards, id) {
  const card = cards.find((entry) => entry.card === id);
  if (!card) throw new Error(`missing card ${id}`);
  return card;
}

async function mouseStart(session, p) {
  await cdp(session, 'Input.dispatchMouseEvent', { type:'mouseMoved', x:p.x, y:p.y, button:'none' });
  await cdp(session, 'Input.dispatchMouseEvent', { type:'mousePressed', x:p.x, y:p.y, button:'left', buttons:1, clickCount:1 });
}
async function mouseMove(session, p) {
  await cdp(session, 'Input.dispatchMouseEvent', { type:'mouseMoved', x:p.x, y:p.y, button:'left', buttons:1 });
}
async function mouseEnd(session, p) {
  await cdp(session, 'Input.dispatchMouseEvent', { type:'mouseReleased', x:p.x, y:p.y, button:'left', buttons:0, clickCount:1 });
}
async function touchStart(session, p) {
  await cdp(session, 'Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{ x:p.x, y:p.y, radiusX:8, radiusY:9, force:1 }] });
}
async function touchMove(session, p) {
  await cdp(session, 'Input.dispatchTouchEvent', { type:'touchMove', touchPoints:[{ x:p.x, y:p.y, radiusX:8, radiusY:9, force:1 }] });
}
async function touchEnd(session) {
  await cdp(session, 'Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] });
}
async function start(session, mobile, p) { return mobile ? touchStart(session,p) : mouseStart(session,p); }
async function move(session, mobile, p) { return mobile ? touchMove(session,p) : mouseMove(session,p); }
async function end(session, mobile, p) { return mobile ? touchEnd(session) : mouseEnd(session,p); }

async function assertExactPickup(session, mobile, cardId, nx, ny, label) {
  const cards = await cardsGeometry(session);
  const card = cardBy(cards, cardId);
  const pointer = { x:card.left + card.width * nx, y:card.top + card.height * ny };
  const hit = await execute(session, `
    const n=document.elementFromPoint(${pointer.x},${pointer.y}); return n?.closest?.('.hand-card')?.dataset.card ?? null;
  `);
  assert(hit === cardId, `${label}: chosen contact does not acquire ${cardId}; hit ${hit}`);
  await start(session, mobile, pointer);
  await waitFor(`${label}: held`, async () => Boolean((await snapshot(session)).held));
  const snap = await snapshot(session);
  const held = await heldGeometry(session);
  const material = { x:held.left + snap.held.grabX, y:held.top + snap.held.grabY };
  const error = dist(pointer, material);
  assert(error < 1.5, `${label}: pickup material point jumped ${error.toFixed(2)}px`);
  assert(Math.abs(snap.held.assistY) < .1, `${label}: assistance changed pickup contact immediately ${snap.held.assistY}`);
  return { pointer, snap, held, error };
}

async function runDesktop(session) {
  await setViewport(session, 1440, 900, false);
  await navigate(session, false, 'auto');
  const initial = await snapshot(session);
  assert(!initial.overflowX, 'desktop: horizontal overflow');
  const pickup = await assertExactPickup(session, false, '9S', .18, .20, 'desktop exact-grab');
  const moved = { x:pickup.pointer.x + 40, y:pickup.pointer.y + 8 };
  await move(session, false, moved);
  await sleep(30);
  const mid = await snapshot(session);
  assert(mid.held?.pointerType === 'mouse', `desktop: pointer type ${mid.held?.pointerType}`);
  assert(Math.abs(mid.held.assistY) < .1, `desktop: mouse incorrectly received touch assist ${mid.held.assistY}`);
  assert(mid.field.filter((f) => Math.abs(f.x) > .3).length >= 2, 'desktop: neighbor field did not respond');
  await screenshot(session, 'hand-body-v4-desktop-exact-grab');
  await end(session, false, moved);
  await waitFor('desktop settle', async () => (await snapshot(session)).state === 'ready');
  return { pickupError:pickup.error, fieldResponders:mid.field.filter((f) => Math.abs(f.x) > .3).length };
}

async function runMobile(session) {
  await setViewport(session, 390, 844, true);
  await navigate(session, true, 'auto');
  let initial = await snapshot(session);
  assert(!initial.overflowX, 'mobile: horizontal overflow');
  await screenshot(session, 'hand-body-v4-mobile-ready');

  // Occluded identity contact: pickup must remain exact, then assistance may
  // progressively move the visual card only after deliberate movement.
  const occluded = await assertExactPickup(session, true, '9S', .18, .20, 'mobile occluded exact-grab');
  assert(occluded.snap.held.pointerType === 'touch', `mobile: pointer type ${occluded.snap.held.pointerType}`);
  assert(occluded.snap.held.assistTarget > 10, `mobile: expected occlusion assistance candidate, got ${occluded.snap.held.assistTarget}`);
  await screenshot(session, 'hand-body-v4-mobile-contact');
  const assistPoint = { x:occluded.pointer.x + 26, y:occluded.pointer.y + 2 };
  await move(session, true, assistPoint);
  await sleep(35);
  const assisted = await snapshot(session);
  assert(assisted.held.assistY < -10, `mobile: adaptive visibility did not engage ${assisted.held.assistY}`);
  assert(assisted.held.identityOcclusion < occluded.snap.held.identityOcclusion * .55,
    `mobile: assistance did not materially reveal identity ${assisted.held.identityOcclusion} vs ${occluded.snap.held.identityOcclusion}`);
  assert(assisted.field.filter((f) => Math.abs(f.x) > .3).length >= 2, 'mobile: neighbor field did not respond');
  await screenshot(session, 'hand-body-v4-mobile-adaptive-assist');
  await end(session, true, assistPoint);
  await waitFor('mobile assisted settle', async () => (await snapshot(session)).state === 'ready');

  // Reload and acquire a non-occluding contact. Auto assist must stay dormant.
  await navigate(session, true, 'auto');
  const clear = await assertExactPickup(session, true, '9S', .82, .82, 'mobile clear exact-grab');
  assert(clear.snap.held.assistTarget === 0, `mobile: clear contact received assist target ${clear.snap.held.assistTarget}`);
  const clearMove = { x:clear.pointer.x - 25, y:clear.pointer.y - 2 };
  await move(session, true, clearMove);
  await sleep(25);
  const clearMid = await snapshot(session);
  assert(Math.abs(clearMid.held.assistY) < .1, `mobile: clear contact shifted ${clearMid.held.assistY}`);
  await end(session, true, clearMove);
  await waitFor('mobile clear settle', async () => (await snapshot(session)).state === 'ready');

  // Reorder must alter private topology without producing play intent/commit.
  await navigate(session, true, 'auto');
  const beforeOrder = (await snapshot(session)).order.join(',');
  let cards = await cardsGeometry(session);
  const from = cardBy(cards, '9C');
  const to = cardBy(cards, 'QS');
  const reorderStart = { x:from.left + Math.min(12, from.width*.18), y:from.top + from.height*.72 };
  const reorderEnd = { x:to.left + to.width*.78, y:reorderStart.y };
  await start(session, true, reorderStart);
  await move(session, true, reorderEnd);
  await sleep(30);
  const reorderMid = await snapshot(session);
  assert(reorderMid.playIntent === 'none', `mobile reorder crossed into play intent ${reorderMid.playIntent}`);
  assert(reorderMid.field.filter((f) => Math.abs(f.x) > .3).length >= 2, 'mobile reorder has no field response');
  await screenshot(session, 'hand-body-v4-mobile-reorder-mid');
  await end(session, true, reorderEnd);
  await waitFor('mobile reorder settle', async () => (await snapshot(session)).state === 'ready');
  const afterReorder = await snapshot(session);
  assert(afterReorder.order.join(',') !== beforeOrder, `mobile reorder did not change topology ${afterReorder.order}`);
  assert(!afterReorder.trace.some((e) => e.type === 'would-commit'), 'mobile reorder accidentally committed');

  // Legal play intent is a relation, not a separate mode. This isolated V4
  // records would-commit and returns the card rather than simulating authority.
  await navigate(session, true, 'auto');
  cards = await cardsGeometry(session);
  const legal = cardBy(cards, 'AH');
  const intent = await intentGeometry(session);
  const legalStart = { x:legal.left + Math.min(13, legal.width*.2), y:legal.top + legal.height*.66 };
  const intentPoint = { x:intent.left + intent.width*.5, y:intent.top + intent.height*.67 };
  await start(session, true, legalStart);
  await move(session, true, intentPoint);
  await waitFor('mobile legal play intent', async () => (await snapshot(session)).playIntent === 'legal');
  await screenshot(session, 'hand-body-v4-mobile-play-intent');
  await end(session, true, intentPoint);
  await waitFor('mobile legal return', async () => (await snapshot(session)).state === 'ready');
  const legalAfter = await snapshot(session);
  assert(legalAfter.order.includes('AH'), 'mobile isolated legal intent lost card');
  assert(legalAfter.trace.some((e) => e.type === 'would-commit' && e.card === 'AH'), 'mobile missing would-commit trace');

  // Illegal probe must remain manipulable and return to hand.
  await navigate(session, true, 'auto');
  cards = await cardsGeometry(session);
  const illegal = cardBy(cards, 'QS');
  const illegalStart = { x:illegal.left + Math.min(13, illegal.width*.2), y:illegal.top + illegal.height*.66 };
  await start(session, true, illegalStart);
  await move(session, true, intentPoint);
  await waitFor('mobile illegal play intent', async () => (await snapshot(session)).playIntent === 'illegal');
  await end(session, true, intentPoint);
  await waitFor('mobile illegal return', async () => (await snapshot(session)).state === 'ready');
  const illegalAfter = await snapshot(session);
  assert(illegalAfter.order.includes('QS'), 'mobile illegal probe lost card');
  assert(illegalAfter.trace.some((e) => e.type === 'illegal-play-probe' && e.card === 'QS'), 'mobile missing illegal probe trace');

  return {
    occludedPickupError:occluded.error,
    assistTarget:occluded.snap.held.assistTarget,
    assistedOcclusion:assisted.held.identityOcclusion,
    clearPickupError:clear.error,
    reordered:afterReorder.order,
  };
}

await mkdir(OUTPUT, { recursive:true });
const vite = startProcess('npm', ['run','dev','--','--host','127.0.0.1','--port','4196']);
const driver = startProcess('chromedriver', ['--port=9538']);

let session;
try {
  await waitFor('Vite V4', async () => (await fetch(`${BASE}?assist=auto`).catch(() => null))?.ok);
  await waitFor('ChromeDriver V4', async () => (await fetch(`${WEBDRIVER}/status`).catch(() => null))?.ok);
  session = await createSession();
  const desktop = await runDesktop(session);
  await webdriver(`/session/${session}`, { method:'DELETE' });
  session = await createSession();
  const mobile = await runMobile(session);
  await webdriver(`/session/${session}`, { method:'DELETE' });
  session = null;
  console.log('experience hand body v4 browser smoke: PASS');
  console.log(JSON.stringify({ desktop, mobile }, null, 2));
} catch (error) {
  console.error('experience hand body v4 browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  if (session) { try { await webdriver(`/session/${session}`, { method:'DELETE' }); } catch {} }
  stopProcess(driver.child);
  stopProcess(vite.child);
}
