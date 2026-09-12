import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4173';
const WEBDRIVER = 'http://127.0.0.1:9515';
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
    await sleep(120);
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
    method: 'POST',
    body: JSON.stringify({ script, args: [] }),
  });
}

async function cdp(session, cmd, params = {}) {
  return webdriver(`/session/${session}/goog/cdp/execute`, {
    method: 'POST',
    body: JSON.stringify({ cmd, params }),
  });
}

async function emulateViewport(session, width, height, mobile) {
  await cdp(session, 'Emulation.setDeviceMetricsOverride', {
    width, height, screenWidth: width, screenHeight: height, deviceScaleFactor: 1, mobile,
    positionX: 0, positionY: 0, dontSetVisibleSize: false,
  });
  await cdp(session, 'Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 });
}

async function closeSession(session) {
  if (!session) return;
  try { await webdriver(`/session/${session}`, { method: 'DELETE' }); } catch {}
}

async function screenshot(session, name) {
  const base64 = await webdriver(`/session/${session}/screenshot`);
  await writeFile(`${OUTPUT}/${name}.png`, Buffer.from(base64, 'base64'));
}

async function inspect(session) {
  return execute(session, `
    const decision = document.querySelector('.decision-card');
    return {
      width: document.documentElement.clientWidth,
      innerWidth: window.innerWidth,
      visualWidth: window.visualViewport?.width ?? null,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      body: document.body?.innerText ?? '',
      decision: decision?.innerText ?? '',
      decisionBottom: decision?.getBoundingClientRect().bottom ?? null,
      deltas: [...document.querySelectorAll('.decision-card .score strong')].map((node) => node.textContent?.trim() ?? ''),
    };
  `);
}

function assertLayout(label, view, width) {
  if (view.width !== width || view.innerWidth !== width || Math.round(view.visualWidth ?? -1) !== width) {
    throw new Error(`${label}: viewport mismatch document=${view.width} inner=${view.innerWidth} visual=${view.visualWidth}`);
  }
  if (view.scrollWidth > view.width + 1) throw new Error(`${label}: horizontal overflow ${view.scrollWidth} > ${view.width}`);
  for (const text of [
    'kontrakt niezrealizowany',
    'karty 90 = 90 · kontrakt 100',
    'karty 15 = 15 · blokada 800+',
    'karty 15 = 15 · po zaokrągleniu',
  ]) {
    if (!view.decision.includes(text)) throw new Error(`${label}: scoring explanation missing ${JSON.stringify(text)}`);
  }
  if (JSON.stringify(view.deltas) !== JSON.stringify(['-100', '+0', '+20'])) {
    throw new Error(`${label}: unexpected score deltas ${JSON.stringify(view.deltas)}`);
  }
}

async function runViewport(label, width, height, mobile) {
  const session = await createSession();
  try {
    await emulateViewport(session, width, height, mobile);
    await webdriver(`/session/${session}/url`, {
      method: 'POST',
      body: JSON.stringify({ url: `${BASE_URL}/test/browser-fixtures/scoring.html` }),
    });
    const view = await waitFor(`${label}: scoring summary`, async () => {
      const current = await inspect(session);
      return current.decision.includes('kontrakt niezrealizowany') ? current : false;
    });
    assertLayout(label, view, width);
    await screenshot(session, `${label}-scoring-summary`);
    return view;
  } finally {
    await closeSession(session);
  }
}

await mkdir(OUTPUT, { recursive: true });
const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173']);
const driver = startProcess('chromedriver', ['--port=9515']);

try {
  await waitFor('Vite scoring fixture', async () => {
    const response = await fetch(`${BASE_URL}/test/browser-fixtures/scoring.html`).catch(() => null);
    return response?.ok;
  });
  await waitFor('ChromeDriver', async () => {
    const response = await fetch(`${WEBDRIVER}/status`).catch(() => null);
    return response?.ok;
  });

  const evidence = {
    desktop: await runViewport('desktop', 1440, 1000, false),
    mobile: await runViewport('mobile', 390, 844, true),
  };
  console.log('scoring browser smoke: PASS');
  console.log(JSON.stringify(evidence, null, 2));
} catch (error) {
  console.error('scoring browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  stopProcess(driver.child);
  stopProcess(vite.child);
}
