import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4194/lab/experience/living-slice-v2.html?geometry=c';
const WEBDRIVER = 'http://127.0.0.1:9536';
const OUTPUT = 'artifacts/experience';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(label, probe, timeoutMs = 12_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await probe();
      if (value) return value;
    } catch (error) { lastError = error; }
    await sleep(35);
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
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function assert(condition, message) { if (!condition) throw new Error(message); }

async function flightGeometry(session) {
  return execute(session, `
    const ghost = document.querySelector('.source-ghost');
    const seat = document.querySelector('[data-anchor="seat:1"] .seat-source');
    const target = document.querySelector('[data-anchor="trick-card:1"]');
    const point = (node) => {
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return { x:r.left+r.width/2, y:r.top+r.height/2, left:r.left, top:r.top, width:r.width, height:r.height };
    };
    return {
      phase: document.body.dataset.sliceState,
      ghost: point(ghost),
      seat: point(seat),
      target: point(target),
      ghostOpacity: ghost ? Number(getComputedStyle(ghost).opacity) : null,
      geometry: document.body.dataset.geometry,
    };
  `);
}

await mkdir(OUTPUT, { recursive: true });
const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4194']);
const driver = startProcess('chromedriver', ['--port=9536']);
let session;
try {
  await waitFor('Vite source-flight server', async () => (await fetch(BASE_URL).catch(() => null))?.ok);
  await waitFor('ChromeDriver source-flight', async () => (await fetch(`${WEBDRIVER}/status`).catch(() => null))?.ok);
  const created = await webdriver('/session', {
    method: 'POST',
    body: JSON.stringify({ capabilities: { alwaysMatch: { browserName: 'chrome', 'goog:chromeOptions': { args: ['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--window-size=1440,900'] } } } }),
  });
  session = created.sessionId;
  await cdp(session, 'Emulation.setDeviceMetricsOverride', { width:1440,height:900,screenWidth:1440,screenHeight:900,deviceScaleFactor:1,mobile:false,positionX:0,positionY:0,dontSetVisibleSize:false });
  await webdriver(`/session/${session}/url`, { method:'POST', body:JSON.stringify({ url:BASE_URL }) });
  await waitFor('fixture ready', () => execute(session, `return Boolean(window.__livingSlice) && document.body.dataset.sliceState === 'ready';`));

  await execute(session, `window.__livingSlice.setTimingScale(4); window.__livingSlice.replayOpponentSources(); return true;`);
  await waitFor('source ghost exists', () => execute(session, `return Boolean(document.querySelector('.source-ghost'));`));

  const origin = await flightGeometry(session);
  assert(origin.geometry === 'c', `expected geometry c, got ${origin.geometry}`);
  assert(origin.ghost && origin.seat && origin.target, `missing source-flight geometry ${JSON.stringify(origin)}`);
  assert(origin.ghostOpacity > 0.5, `source ghost too faint at origin ${origin.ghostOpacity}`);
  const originSourceDistance = distance(origin.ghost, origin.seat);
  const originTargetDistance = distance(origin.ghost, origin.target);
  assert(originSourceDistance < 12, `ghost does not originate at actor source (${originSourceDistance.toFixed(2)}px)`);
  assert(originTargetDistance > 80, `source and trick target are not spatially distinct (${originTargetDistance.toFixed(2)}px)`);
  await screenshot(session, 'living-slice-v2-desktop-source-origin');

  await sleep(120);
  const mid = await flightGeometry(session);
  assert(mid.ghost, 'source ghost disappeared before mid-flight probe');
  const midTargetDistance = distance(mid.ghost, mid.target);
  assert(midTargetDistance < originTargetDistance * 0.82, `ghost did not materially progress toward trick (${midTargetDistance.toFixed(2)} vs ${originTargetDistance.toFixed(2)})`);
  await screenshot(session, 'living-slice-v2-desktop-source-mid');

  await waitFor('source replay returns to ready', () => execute(session, `return document.body.dataset.sliceState === 'ready';`));
  const trace = await execute(session, `return window.__livingSlice.snapshot().trace.filter((event) => event.type === 'public-source-play');`);
  assert(trace.length === 2 && trace[0].seat === 1 && trace[1].seat === 2, `wrong public source trace ${JSON.stringify(trace)}`);

  console.log('experience source-flight browser smoke: PASS');
  console.log(JSON.stringify({ originSourceDistance, originTargetDistance, midTargetDistance, trace }, null, 2));
} catch (error) {
  console.error('experience source-flight browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  if (session) try { await webdriver(`/session/${session}`, { method:'DELETE' }); } catch {}
  stopProcess(driver.child);
  stopProcess(vite.child);
}
