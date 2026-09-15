import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const RAW_BASE_URL = process.env.TYSIAC_PUBLIC_URL ?? '';
const BASE_URL = RAW_BASE_URL.replace(/\/+$/u, '');
const WEBDRIVER = 'http://127.0.0.1:9520';
const OUTPUT = 'artifacts/browser';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

if (!/^https:\/\//u.test(BASE_URL)) {
  throw new Error('TYSIAC_PUBLIC_URL must be an https:// deployment URL');
}

async function waitFor(label, probe, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await probe();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(250);
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError}` : ''}`);
}

function startDriver() {
  return spawn('chromedriver', ['--port=9520'], {
    detached: true,
    stdio: 'ignore',
    env: process.env,
  });
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

async function createSession(width, height) {
  const value = await webdriver('/session', {
    method: 'POST',
    body: JSON.stringify({
      capabilities: {
        alwaysMatch: {
          browserName: 'chrome',
          'goog:chromeOptions': {
            args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', `--window-size=${width},${height}`],
          },
        },
      },
    }),
  });
  return value.sessionId ?? value['sessionId'];
}

async function execute(session, script) {
  return webdriver(`/session/${session}/execute/sync`, {
    method: 'POST',
    body: JSON.stringify({ script, args: [] }),
  });
}

async function navigate(session, url) {
  await webdriver(`/session/${session}/url`, {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

async function closeSession(session) {
  if (!session) return;
  try { await webdriver(`/session/${session}`, { method: 'DELETE' }); } catch {}
}

async function screenshot(session, name) {
  const base64 = await webdriver(`/session/${session}/screenshot`);
  await writeFile(`${OUTPUT}/${name}.png`, Buffer.from(base64, 'base64'));
}

async function pageState(session) {
  return execute(session, `
    const room = new URLSearchParams(location.search).get('room');
    const token = room ? localStorage.getItem('tysiac:seat-token:' + room) : null;
    return {
      url: location.href,
      room,
      token,
      body: document.body?.innerText ?? '',
      connection: document.querySelector('.connection-banner')?.textContent?.trim() ?? '',
      copiedLink: window.__tysiacCopiedLink ?? null,
    };
  `);
}

async function clickLeading(session, text) {
  const clicked = await execute(session, `
    const button = [...document.querySelectorAll('button')]
      .find((node) => node.textContent?.trim().startsWith(${JSON.stringify(text)}) && !node.disabled);
    if (!button) return false;
    button.click();
    return true;
  `);
  if (!clicked) throw new Error(`Enabled button ${text} not found`);
}

async function installClipboardCapture(session) {
  const result = await execute(session, `
    try {
      window.__tysiacCopiedLink = null;
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (text) => {
            window.__tysiacCopiedLink = String(text);
          },
        },
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  `);
  if (!result?.ok) throw new Error(`cannot instrument clipboard capture: ${result?.error ?? 'unknown error'}`);
}

function assertInviteContract(invite, room) {
  const base = new URL(`${BASE_URL}/`);
  const url = new URL(invite);
  if (url.protocol !== 'https:') throw new Error(`friend invite is not HTTPS: ${invite}`);
  if (url.origin !== base.origin) throw new Error(`friend invite changed origin: ${url.origin} !== ${base.origin}`);
  if (url.pathname !== base.pathname) throw new Error(`friend invite changed pathname: ${url.pathname} !== ${base.pathname}`);
  if (url.hash) throw new Error(`friend invite contains unexpected hash: ${url.hash}`);
  const keys = [...url.searchParams.keys()];
  if (keys.length !== 1 || keys[0] !== 'room') {
    throw new Error(`friend invite must contain only room query parameter: ${url.search}`);
  }
  if (url.searchParams.get('room') !== room) throw new Error('friend invite room does not match host room');
  if (/ts1_/u.test(invite)) throw new Error('friend invite leaked a seat credential');
}

await mkdir(OUTPUT, { recursive: true });

const driver = startDriver();
let host;
let joiner;

try {
  await waitFor('ChromeDriver', async () => (await fetch(`${WEBDRIVER}/status`).catch(() => null))?.ok);
  host = await createSession(1440, 1000);
  joiner = await createSession(390, 844);

  await navigate(host, `${BASE_URL}/?__share_link_smoke=${Date.now()}#must-not-leak-into-friend-invite`);
  await waitFor('public home', async () => {
    const value = await pageState(host);
    return value.body.includes('Usiądź do stołu') ? value : false;
  });

  await clickLeading(host, 'Zagraj we dwóch');
  const lobby = await waitFor('host lobby', async () => {
    const value = await pageState(host);
    return value.room && value.body.includes('Kopiuj link dla znajomego') ? value : false;
  });
  if (!/^[0-9A-HJKMNP-TV-Z]{12}$/u.test(lobby.room)) throw new Error(`invalid room code ${lobby.room}`);
  if (!lobby.token?.startsWith('ts1_')) throw new Error('host reconnect token missing');

  await installClipboardCapture(host);
  await clickLeading(host, 'Kopiuj link dla znajomego');
  const copied = await waitFor('actual copied friend link', async () => {
    const value = await pageState(host);
    return value.copiedLink ? value : false;
  });
  assertInviteContract(copied.copiedLink, lobby.room);
  if (!copied.body.includes('Link do pokoju skopiowany.')) throw new Error('copy-link success feedback missing');

  await navigate(joiner, copied.copiedLink);
  const beforeJoin = await waitFor('joiner opens copied friend link', async () => {
    const value = await pageState(joiner);
    if (value.token !== null) throw new Error('friend invite visitor unexpectedly owns credential before joining');
    return value.room === lobby.room && value.body.includes('Dołącz do stołu') ? value : false;
  });
  if (beforeJoin.url !== copied.copiedLink) throw new Error('joiner did not remain on the exact copied friend link');

  await clickLeading(joiner, 'Dołącz do stołu');
  const joined = await waitFor('joiner enters live room from copied link', async () => {
    const value = await pageState(joiner);
    return value.token?.startsWith('ts1_') && value.connection.includes('online') ? value : false;
  });
  if (joined.token === lobby.token) throw new Error('host and friend received the same private seat credential');
  if (joined.url.includes(joined.token)) throw new Error('friend credential leaked into URL after join');

  await screenshot(host, 'public-share-link-host');
  await screenshot(joiner, 'public-share-link-friend');

  console.log('public share-link smoke: PASS');
  console.log(JSON.stringify({
    baseUrl: BASE_URL,
    room: lobby.room,
    copiedInvite: copied.copiedLink,
    sameOrigin: new URL(copied.copiedLink).origin === new URL(BASE_URL).origin,
    friendJoined: true,
  }, null, 2));
} catch (error) {
  try { if (host) await screenshot(host, 'public-share-link-failure-host'); } catch {}
  try { if (joiner) await screenshot(joiner, 'public-share-link-failure-friend'); } catch {}
  throw error;
} finally {
  await closeSession(joiner);
  await closeSession(host);
  stopProcess(driver);
}
