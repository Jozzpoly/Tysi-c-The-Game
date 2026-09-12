import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const RAW_BASE_URL = process.env.TYSIAC_PUBLIC_URL ?? '';
const BASE_URL = RAW_BASE_URL.replace(/\/+$/u, '');
const WEBDRIVER = 'http://127.0.0.1:9519';
const OUTPUT = 'artifacts/browser';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

if (!/^https:\/\//u.test(BASE_URL)) {
  throw new Error('TYSIAC_PUBLIC_URL must be an https:// deployment URL');
}

async function waitFor(label, probe, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await probe();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(200);
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError}` : ''}`);
}

function startDriver() {
  return spawn('chromedriver', ['--port=9519'], {
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

async function createSession(width, height, mobile) {
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
  const session = value.sessionId ?? value['sessionId'];
  await webdriver(`/session/${session}/goog/cdp/execute`, {
    method: 'POST',
    body: JSON.stringify({
      cmd: 'Emulation.setDeviceMetricsOverride',
      params: {
        width,
        height,
        screenWidth: width,
        screenHeight: height,
        deviceScaleFactor: 1,
        mobile,
        positionX: 0,
        positionY: 0,
        dontSetVisibleSize: false,
      },
    }),
  });
  return session;
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

async function waitText(session, text, timeoutMs = 30_000) {
  return waitFor(
    `text ${JSON.stringify(text)}`,
    () => execute(session, `return document.body?.innerText.includes(${JSON.stringify(text)}) ?? false;`),
    timeoutMs,
  );
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

async function state(session) {
  return execute(session, `
    const room = new URLSearchParams(location.search).get('room');
    const token = room ? localStorage.getItem('tysiac:seat-token:' + room) : null;
    const revText = [...document.querySelectorAll('.footer span')]
      .map((node) => node.textContent?.trim() ?? '')
      .find((text) => /^rev \\d+$/.test(text));
    const hand = document.querySelector('.hand');
    return {
      room,
      token,
      url: location.href,
      body: document.body?.innerText ?? '',
      revision: revText ? Number(revText.slice(4)) : null,
      connection: document.querySelector('.connection-banner')?.textContent?.trim() ?? '',
      decision: document.querySelector('.decision-card h2')?.textContent?.trim() ?? '',
      handCards: [...document.querySelectorAll('.hand .card')].map((node) => node.getAttribute('aria-label')),
      scoreLabels: [...document.querySelectorAll('.score span')].map((node) => node.textContent?.trim() ?? ''),
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      handClientWidth: hand?.clientWidth ?? 0,
      handScrollWidth: hand?.scrollWidth ?? 0,
    };
  `);
}

function assertNoOverflow(label, value, expectedWidth) {
  if (value.width !== expectedWidth) throw new Error(`${label}: viewport ${value.width}, expected ${expectedWidth}`);
  if (value.scrollWidth > value.width + 1) throw new Error(`${label}: page overflow ${value.scrollWidth} > ${value.width}`);
  if (value.handClientWidth && value.handScrollWidth > value.handClientWidth + 1) {
    throw new Error(`${label}: hand overflow ${value.handScrollWidth} > ${value.handClientWidth}`);
  }
}

async function waitGame(session, label) {
  return waitFor(`${label}: connected game`, async () => {
    const value = await state(session);
    return value.connection.includes('online') && value.handCards.length > 0 && value.revision !== null ? value : false;
  });
}

async function clickAuctionDecision(session, label) {
  await waitFor(`${label}: auction decision`, async () => {
    const value = await state(session);
    return value.decision === 'Twoja licytacja' ? value : false;
  });

  const clicked = await execute(session, `
    const pass = [...document.querySelectorAll('.decision-card button:not(:disabled)')]
      .find((button) => button.textContent?.trim() === 'Pas');
    if (pass) { pass.click(); return 'pass'; }
    const bid = [...document.querySelectorAll('.bid-actions button:not(:disabled)')]
      .map((node) => ({ node, value: Number(node.textContent?.trim()) }))
      .filter((entry) => Number.isFinite(entry.value))
      .sort((a, b) => a.value - b.value)[0]?.node;
    if (!bid) return null;
    bid.click();
    return 'bid';
  `);
  if (!clicked) throw new Error(`${label}: no legal auction action`);
  return clicked;
}

await mkdir(OUTPUT, { recursive: true });

await waitFor('public worker health', async () => {
  const response = await fetch(`${BASE_URL}/api/match`, { cache: 'no-store' }).catch(() => null);
  if (!response?.ok) return false;
  const body = await response.json().catch(() => null);
  return body?.service === 'match-room';
}, 90_000);

const driver = startDriver();
let host;
let joiner;

try {
  await waitFor('ChromeDriver', async () => (await fetch(`${WEBDRIVER}/status`).catch(() => null))?.ok);
  host = await createSession(1440, 1000, false);
  joiner = await createSession(390, 844, true);

  await navigate(host, BASE_URL);
  await waitText(host, 'Usiądź do stołu');
  await clickLeading(host, 'Zagraj we dwóch');
  await waitText(host, 'Kopiuj link dla znajomego');
  const hostLobby = await state(host);
  if (!/^[0-9A-HJKMNP-TV-Z]{12}$/u.test(hostLobby.room ?? '')) throw new Error(`invalid public room ${hostLobby.room}`);
  if (!hostLobby.token?.startsWith('ts1_')) throw new Error('host reconnect token missing');
  if (hostLobby.url.includes(hostLobby.token) || hostLobby.body.includes(hostLobby.token)) throw new Error('host token leaked publicly');

  await navigate(joiner, `${BASE_URL}?room=${hostLobby.room}`);
  await waitText(joiner, 'Dołącz do stołu');
  const beforeJoin = await state(joiner);
  if (beforeJoin.token !== null) throw new Error('share-link visitor owns a credential before joining');
  await clickLeading(joiner, 'Dołącz do stołu');

  const [hostGame, joinerGame] = await Promise.all([
    waitGame(host, 'public host'),
    waitGame(joiner, 'public mobile joiner'),
  ]);
  assertNoOverflow('public host', hostGame, 1440);
  assertNoOverflow('public mobile joiner', joinerGame, 390);
  if (!joinerGame.token?.startsWith('ts1_')) throw new Error('joiner reconnect token missing');
  if (hostGame.token === joinerGame.token) throw new Error('public human seats share credential');
  if (joinerGame.url.includes(joinerGame.token) || joinerGame.body.includes(joinerGame.token)) throw new Error('joiner token leaked publicly');

  const hostCards = new Set(hostGame.handCards);
  for (const card of joinerGame.handCards) {
    if (hostCards.has(card)) throw new Error(`private card appears in both public seats: ${card}`);
  }

  const actor = await waitFor('public human auction actor', async () => {
    const hostState = await state(host);
    if (hostState.decision === 'Twoja licytacja') return { session: host, other: joiner, before: hostState, label: 'host' };
    const joinerState = await state(joiner);
    if (joinerState.decision === 'Twoja licytacja') return { session: joiner, other: host, before: joinerState, label: 'joiner' };
    return false;
  });

  const action = await clickAuctionDecision(actor.session, `public ${actor.label}`);
  const synchronized = await waitFor('public shared revision', async () => {
    const a = await state(actor.session);
    const b = await state(actor.other);
    return actor.before.revision !== null && a.revision > actor.before.revision && b.revision === a.revision ? { a, b } : false;
  });

  const stableRoom = synchronized.a.room;
  const stableToken = synchronized.a.token;
  const stableRevision = synchronized.a.revision;
  await navigate(actor.session, synchronized.a.url);
  const restored = await waitGame(actor.session, 'public refresh reconnect');
  if (restored.room !== stableRoom || restored.token !== stableToken) throw new Error('public refresh changed room/credential');
  if (restored.revision < stableRevision) throw new Error('public refresh restored stale state');

  await screenshot(host, 'public-deploy-desktop-host');
  await screenshot(joiner, 'public-deploy-mobile-joiner');

  console.log('public deploy smoke: PASS');
  console.log(JSON.stringify({
    baseUrl: BASE_URL,
    room: hostGame.room,
    hostLabels: hostGame.scoreLabels,
    joinerLabels: joinerGame.scoreLabels,
    action,
    revision: stableRevision,
    restoredRevision: restored.revision,
  }, null, 2));
} finally {
  await closeSession(joiner);
  await closeSession(host);
  stopProcess(driver);
}
