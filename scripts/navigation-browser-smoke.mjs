import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4176';
const WEBDRIVER = 'http://127.0.0.1:9518';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(label, probe, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await probe();
      if (value) return value;
    } catch (error) { lastError = error; }
    await sleep(120);
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError}` : ''}`);
}

function startProcess(command, args) {
  const child = spawn(command, args, { detached: true, stdio: 'ignore', env: process.env });
  return child;
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

async function execute(session, script) {
  return webdriver(`/session/${session}/execute/sync`, {
    method: 'POST', body: JSON.stringify({ script, args: [] }),
  });
}

async function clickLeading(session, text) {
  const clicked = await execute(session, `
    const button = [...document.querySelectorAll('button')].find((node) => node.textContent?.trim().startsWith(${JSON.stringify(text)}) && !node.disabled);
    if (!button) return false;
    button.click();
    return true;
  `);
  if (!clicked) throw new Error(`Button ${text} not found`);
}

async function waitText(session, text) {
  return waitFor(text, () => execute(session, `return document.body?.innerText.includes(${JSON.stringify(text)}) ?? false;`));
}

const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4176']);
const driver = startProcess('chromedriver', ['--port=9518']);
let session;

try {
  await waitFor('vite', async () => (await fetch(BASE_URL).catch(() => null))?.ok);
  await waitFor('chromedriver', async () => (await fetch(`${WEBDRIVER}/status`).catch(() => null))?.ok);

  const created = await webdriver('/session', {
    method: 'POST',
    body: JSON.stringify({
      capabilities: {
        alwaysMatch: {
          browserName: 'chrome',
          'goog:chromeOptions': { args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--window-size=390,844'] },
        },
      },
    }),
  });
  session = created.sessionId ?? created.sessionId;

  await webdriver(`/session/${session}/goog/cdp/execute`, {
    method: 'POST',
    body: JSON.stringify({
      cmd: 'Emulation.setDeviceMetricsOverride',
      params: { width: 390, height: 844, screenWidth: 390, screenHeight: 844, deviceScaleFactor: 1, mobile: true },
    }),
  });

  await webdriver(`/session/${session}/url`, { method: 'POST', body: JSON.stringify({ url: BASE_URL }) });
  await waitText(session, 'Usiądź do stołu');
  await clickLeading(session, 'Zagraj sam');

  const room = await waitFor('remote game', async () => execute(session, `
    const room = new URLSearchParams(location.search).get('room');
    const online = document.querySelector('.connection-banner')?.textContent?.includes('online');
    return room && online && document.querySelector('.hand .card') ? room : false;
  `));

  const geometry = await execute(session, `
    const heading = document.querySelector('.topbar h1')?.getBoundingClientRect();
    const banner = document.querySelector('.connection-banner')?.getBoundingClientRect();
    const exit = document.querySelector('.room-exit')?.getBoundingClientRect();
    return { heading, banner, exit, width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth };
  `);
  if (geometry.width !== 390 || geometry.scrollWidth > 391) throw new Error(`mobile overflow: ${JSON.stringify(geometry)}`);
  if (!geometry.heading || !geometry.banner || !geometry.exit) throw new Error('remote navigation controls missing');
  const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  if (overlaps(geometry.heading, geometry.banner) || overlaps(geometry.heading, geometry.exit)) {
    throw new Error(`mobile remote controls overlap heading: ${JSON.stringify(geometry)}`);
  }

  await clickLeading(session, 'Jak grać');
  await waitText(session, 'Tysiąc w 60 sekund');
  const guide = await execute(session, `
    const overlay = document.querySelector('.rules-overlay');
    const dialog = document.querySelector('.rules-dialog');
    if (!overlay || !dialog) return null;
    const rect = dialog.getBoundingClientRect();
    const x = Math.max(1, Math.min(innerWidth - 2, rect.left + Math.min(36, rect.width / 2)));
    const y = Math.max(1, Math.min(innerHeight - 2, rect.top + Math.min(36, rect.height / 2)));
    const top = document.elementFromPoint(x, y);
    return {
      portalToBody: overlay.parentElement === document.body,
      dialogTopmost: Boolean(top && dialog.contains(top)),
      rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height },
      viewport: { width: innerWidth, height: innerHeight },
      overlayZ: getComputedStyle(overlay).zIndex,
    };
  `);
  if (!guide?.portalToBody || !guide.dialogTopmost) throw new Error(`rules overlay is not app-global/topmost: ${JSON.stringify(guide)}`);
  if (guide.rect.left < -1 || guide.rect.right > guide.viewport.width + 1 || guide.rect.top < -1 || guide.rect.bottom > guide.viewport.height + 1) {
    throw new Error(`rules dialog escapes mobile viewport: ${JSON.stringify(guide)}`);
  }
  await clickLeading(session, 'Wracam do stołu');
  await waitFor('rules guide closes', () => execute(session, `return !document.querySelector('.rules-overlay');`));

  await clickLeading(session, 'Wróć do startu');
  await waitText(session, 'Usiądź do stołu');
  const homeUrl = await execute(session, 'return location.href;');
  if (new URL(homeUrl).searchParams.has('room')) throw new Error('leave kept room query on home');

  await webdriver(`/session/${session}/back`, { method: 'POST', body: '{}' });
  await waitFor('history restores room', () => execute(session, `
    return new URLSearchParams(location.search).get('room') === ${JSON.stringify(room)} && Boolean(document.querySelector('.connection-banner'));
  `));
  const restoredToken = await execute(session, `return localStorage.getItem('tysiac:seat-token:' + ${JSON.stringify(room)});`);
  if (!restoredToken?.startsWith('ts1_')) throw new Error('history room restore lost reconnect credential');

  await webdriver(`/session/${session}/back`, { method: 'POST', body: '{}' });
  await waitText(session, 'Usiądź do stołu');
  const rootRoom = await execute(session, `return new URLSearchParams(location.search).get('room');`);
  if (rootRoom !== null) throw new Error(`second history back did not restore root: ${rootRoom}`);

  console.log(`navigation browser smoke: PASS room=${room}`);
} finally {
  if (session) {
    try { await webdriver(`/session/${session}`, { method: 'DELETE' }); } catch {}
  }
  stopProcess(driver);
  stopProcess(vite);
}
