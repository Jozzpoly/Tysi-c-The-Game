import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4203';
const WEBDRIVER = 'http://127.0.0.1:9543';
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
    await sleep(40);
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError}` : ''}`);
}

function startProcess(command, args) {
  let output = '';
  const child = spawn(command, args, { detached: true, stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
  const capture = (chunk) => { output = `${output}${chunk.toString()}`.slice(-16_000); };
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
            args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--window-size=1440,1000'],
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

async function emulateViewport(session, width, height, mobile) {
  await cdp(session, 'Emulation.setDeviceMetricsOverride', {
    width, height, screenWidth: width, screenHeight: height,
    deviceScaleFactor: 1, mobile, positionX: 0, positionY: 0, dontSetVisibleSize: false,
  });
}

async function navigate(session, url) {
  await webdriver(`/session/${session}/url`, { method: 'POST', body: JSON.stringify({ url }) });
}

async function closeSession(session) {
  if (!session) return;
  try { await webdriver(`/session/${session}`, { method: 'DELETE' }); } catch {}
}

async function readPerspective(session) {
  return execute(session, `
    const shell = document.querySelector('.app-shell');
    const opponents = [...document.querySelectorAll('.opponents > .opponent')].map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        seat: Number(node.dataset.seatAnchor),
        position: node.dataset.viewPosition ?? '',
        centerX: rect.left + rect.width / 2,
      };
    });
    return {
      viewer: shell?.dataset.viewerSeat ?? '',
      opponents,
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    };
  `);
}

async function injectMaterialProbe(session, seat, id, staleClass) {
  return execute(session, `
    const trick = document.querySelector('.trick');
    if (!trick) return false;
    const node = document.createElement('div');
    node.className = 'played ${staleClass} is-fresh-arrival';
    node.dataset.seat = ${JSON.stringify(String(seat))};
    node.dataset.card = ${JSON.stringify(id)};
    node.dataset.probe = ${JSON.stringify(id)};
    node.innerHTML = '<small>probe</small><button class="card" disabled data-rank="A" data-suit="♠"><span class="rank" data-suit="♠">A</span><span class="suit">♠</span></button>';
    trick.appendChild(node);
    return true;
  `);
}

async function readProbe(session, id) {
  return execute(session, `
    const node = document.querySelector('[data-probe="${id}"]');
    if (!node) return null;
    const card = node.querySelector(':scope > .card') ?? node;
    const rect = card.getBoundingClientRect();
    return {
      position: node.dataset.viewPosition ?? '',
      arrival: node.dataset.materialPlayArrival ?? '',
      sourceSeat: node.dataset.materialPlaySourceSeat ?? '',
      dx: Number(node.dataset.materialPlayDx ?? NaN),
      dy: Number(node.dataset.materialPlayDy ?? NaN),
      centerX: rect.left + rect.width / 2,
      animations: node.getAnimations().length,
    };
  `);
}

async function runViewport(label, width, height, mobile) {
  const session = await createSession();
  try {
    await emulateViewport(session, width, height, mobile);
    await navigate(session, `${BASE_URL}/?local=1&seed=2&seat=1`);

    const perspective = await waitFor(`${label}: viewer topology`, async () => {
      const state = await readPerspective(session);
      return state.viewer === '1' && state.opponents.every((item) => item.position) ? state : false;
    });
    if (perspective.width !== width || perspective.scrollWidth > width + 1) {
      throw new Error(`${label}: invalid viewport ${JSON.stringify(perspective)}`);
    }
    const left = perspective.opponents.find((item) => item.position === 'left');
    const right = perspective.opponents.find((item) => item.position === 'right');
    if (!left || !right || left.seat !== 2 || right.seat !== 0 || !(left.centerX < right.centerX)) {
      throw new Error(`${label}: seat 1 perspective did not rotate cyclically ${JSON.stringify(perspective)}`);
    }

    if (!await injectMaterialProbe(session, 2, `${label}-left`, 'played-left')) {
      throw new Error(`${label}: left material probe could not be injected`);
    }
    if (!await injectMaterialProbe(session, 0, `${label}-right`, 'played-left')) {
      throw new Error(`${label}: right material probe could not be injected`);
    }

    const leftProbe = await waitFor(`${label}: left material arrival`, async () => {
      const state = await readProbe(session, `${label}-left`);
      return state && state.arrival ? state : false;
    });
    const rightProbe = await waitFor(`${label}: right material arrival`, async () => {
      const state = await readProbe(session, `${label}-right`);
      return state && state.arrival ? state : false;
    });

    if (leftProbe.position !== 'left' || leftProbe.sourceSeat !== '2') {
      throw new Error(`${label}: left play provenance wrong ${JSON.stringify(leftProbe)}`);
    }
    if (rightProbe.position !== 'right' || rightProbe.sourceSeat !== '0') {
      throw new Error(`${label}: right play provenance wrong ${JSON.stringify(rightProbe)}`);
    }
    if (!(leftProbe.dx < -20 && rightProbe.dx > 20 && leftProbe.dy < -30 && rightProbe.dy < -30)) {
      throw new Error(`${label}: opponent play did not originate from real seat geometry ${JSON.stringify({ leftProbe, rightProbe })}`);
    }
    if (!(Math.hypot(leftProbe.dx, leftProbe.dy) > 80 && Math.hypot(rightProbe.dx, rightProbe.dy) > 80)) {
      throw new Error(`${label}: material flight collapsed back to local trick-slot motion ${JSON.stringify({ leftProbe, rightProbe })}`);
    }
    if (!(leftProbe.centerX < rightProbe.centerX)) {
      throw new Error(`${label}: trick positions do not match viewer-relative topology ${JSON.stringify({ leftProbe, rightProbe })}`);
    }

    await execute(session, `document.querySelectorAll('[data-probe]').forEach((node) => node.remove()); return true;`);
    return { perspective, leftProbe, rightProbe };
  } finally {
    await closeSession(session);
  }
}

let session;
const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4203']);
const driver = startProcess('chromedriver', ['--port=9543']);

try {
  await waitFor('Vite seat topology server', async () => {
    const response = await fetch(BASE_URL).catch(() => null);
    return response?.ok;
  });
  await waitFor('ChromeDriver seat topology', async () => {
    const response = await fetch(`${WEBDRIVER}/status`).catch(() => null);
    return response?.ok;
  });

  const desktop = await runViewport('desktop', 1440, 1000, false);
  const mobile = await runViewport('mobile', 390, 844, true);
  console.log('seat topology browser smoke: PASS');
  console.log(JSON.stringify({ desktop, mobile }, null, 2));
} catch (error) {
  console.error('seat topology browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  await closeSession(session);
  stopProcess(driver.child);
  stopProcess(vite.child);
}
