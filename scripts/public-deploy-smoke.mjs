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

async function cdp(session, cmd, params = {}) {
  return webdriver(`/session/${session}/goog/cdp/execute`, {
    method: 'POST',
    body: JSON.stringify({ cmd, params }),
  });
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
  await cdp(session, 'Emulation.setDeviceMetricsOverride', {
    width,
    height,
    screenWidth: width,
    screenHeight: height,
    deviceScaleFactor: 1,
    mobile,
    positionX: 0,
    positionY: 0,
    dontSetVisibleSize: false,
  });
  await cdp(session, 'Emulation.setTouchEmulationEnabled', {
    enabled: mobile,
    maxTouchPoints: mobile ? 5 : 1,
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

async function browserDocument(session) {
  return execute(session, `return {
    url: location.href,
    title: document.title,
    readyState: document.readyState,
    body: (document.body?.innerText ?? '').slice(0, 1600),
  };`);
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

async function waitPublicHome(session, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  let attempt = 0;

  while (Date.now() < deadline) {
    const cacheBust = `${BASE_URL}/?__public_smoke=${Date.now()}-${attempt++}`;
    try {
      await navigate(session, cacheBust);
      for (let probe = 0; probe < 6 && Date.now() < deadline; probe += 1) {
        last = await browserDocument(session);
        if (last.body.includes('Usiądź do stołu')) return last;
        await sleep(500);
      }
    } catch (error) {
      last = { error: String(error) };
    }
    await sleep(1_000);
  }

  try { await screenshot(session, 'public-deploy-failure-home'); } catch {}
  throw new Error(`public home readiness timed out: ${JSON.stringify(last)}`);
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

async function prepareFreshJoiner(session, room) {
  await waitPublicHome(session);
  const storageKey = `tysiac:seat-token:${room}`;
  const clean = await execute(session, `
    localStorage.removeItem(${JSON.stringify(storageKey)});
    return localStorage.getItem(${JSON.stringify(storageKey)}) === null;
  `);
  if (!clean) throw new Error('cannot establish clean public joiner storage');
}

async function waitJoinableRoom(session, room, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  let attempt = 0;

  while (Date.now() < deadline) {
    try {
      await navigate(session, `${BASE_URL}/?room=${encodeURIComponent(room)}&__public_joiner=${Date.now()}-${attempt++}`);
      for (let probe = 0; probe < 12 && Date.now() < deadline; probe += 1) {
        last = await state(session);
        if (last.token !== null) {
          throw new Error(`share-link visitor unexpectedly owns credential before joining: ${last.token.slice(0, 8)}…`);
        }
        if (last.body.includes('Dołącz do stołu')) return last;
        if (last.body.includes('Ten pokój już wystartował.')) {
          throw new Error(`public room started before joiner could join: ${JSON.stringify(last)}`);
        }
        await sleep(500);
      }
    } catch (error) {
      last = { ...(last ?? {}), error: String(error) };
      if (String(error).includes('unexpectedly owns credential') || String(error).includes('started before joiner')) throw error;
    }
    await sleep(1_000);
  }

  const document = await browserDocument(session).catch(() => null);
  try { await screenshot(session, 'public-deploy-failure-joiner'); } catch {}
  throw new Error(`public joiner readiness timed out: ${JSON.stringify({ last, document })}`);
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
  }, 60_000);
}

async function clickAuctionDecision(session, label) {
  await waitFor(`${label}: auction decision`, async () => {
    const value = await state(session);
    return value.decision === 'Twoja licytacja' ? value : false;
  }, 60_000);

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

async function publicAssetsReady() {
  const response = await fetch(`${BASE_URL}/?__asset_probe=${Date.now()}`, {
    cache: 'no-store',
    headers: { 'cache-control': 'no-cache' },
  }).catch(() => null);
  if (!response?.ok) return false;

  const html = await response.text().catch(() => '');
  if (!html.includes('id="root"')) return false;

  const assetPaths = [...html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))(?:[?#][^"]*)?"/gu)]
    .map((match) => match[1]);
  if (assetPaths.length === 0) return false;

  for (const assetPath of assetPaths) {
    const assetUrl = new URL(assetPath, `${BASE_URL}/`).href;
    const asset = await fetch(`${assetUrl}${assetUrl.includes('?') ? '&' : '?'}__asset_probe=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'cache-control': 'no-cache' },
    }).catch(() => null);
    if (!asset?.ok) return false;
  }
  return true;
}

async function publicRoomCreateReady() {
  const response = await fetch(`${BASE_URL}/api/rooms`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'cache-control': 'no-cache',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ mode: 'duo' }),
  }).catch(() => null);
  if (!response) return false;

  // Temporary workers.dev publication can expose health/assets a little before
  // every API route is converged. Retry only deployment-readiness classes; any
  // other response is a real contract failure.
  if (response.status === 404 || response.status >= 500) return false;

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`public room-create readiness returned HTTP_${response.status}: ${JSON.stringify(body)}`);
  }
  return Boolean(
    body
    && /^[0-9A-HJKMNP-TV-Z]{12}$/u.test(body.room ?? '')
    && typeof body.token === 'string'
    && body.token.startsWith('ts1_')
    && body.state?.status === 'lobby'
  );
}

async function logDiagnostic(label, session) {
  if (!session) return;
  try {
    const document = await browserDocument(session);
    const snapshot = await state(session).catch(() => null);
    const safeSnapshot = snapshot ? { ...snapshot, token: snapshot.token ? `${snapshot.token.slice(0, 8)}…` : null } : null;
    console.error(`public deploy ${label} diagnostic: ${JSON.stringify({ document, state: safeSnapshot })}`);
    await screenshot(session, `public-deploy-failure-${label}`);
  } catch {}
}

await mkdir(OUTPUT, { recursive: true });

await waitFor('public worker health', async () => {
  const response = await fetch(`${BASE_URL}/api/match`, { cache: 'no-store' }).catch(() => null);
  if (!response?.ok) return false;
  const body = await response.json().catch(() => null);
  return body?.service === 'match-room';
}, 90_000);

await waitFor('public SPA assets', publicAssetsReady, 90_000);
await waitFor('public room-create API readiness', publicRoomCreateReady, 90_000);
console.log('public room-create API readiness: PASS');

const driver = startDriver();
let host;
let joiner;

try {
  await waitFor('ChromeDriver', async () => (await fetch(`${WEBDRIVER}/status`).catch(() => null))?.ok);
  host = await createSession(1440, 1000, false);
  joiner = await createSession(390, 844, true);

  await waitPublicHome(host);
  await clickLeading(host, 'Zagraj we dwóch');
  await waitFor('public host lobby', async () => {
    const value = await state(host);
    return value.body.includes('Kopiuj link dla znajomego') ? value : false;
  }, 60_000);
  const hostLobby = await state(host);
  if (!/^[0-9A-HJKMNP-TV-Z]{12}$/u.test(hostLobby.room ?? '')) throw new Error(`invalid public room ${hostLobby.room}`);
  if (!hostLobby.token?.startsWith('ts1_')) throw new Error('host reconnect token missing');
  if (hostLobby.url.includes(hostLobby.token) || hostLobby.body.includes(hostLobby.token)) throw new Error('host token leaked publicly');

  await prepareFreshJoiner(joiner, hostLobby.room);
  const beforeJoin = await waitJoinableRoom(joiner, hostLobby.room);
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
  }, 60_000);

  const action = await clickAuctionDecision(actor.session, `public ${actor.label}`);
  const synchronized = await waitFor('public shared revision', async () => {
    const a = await state(actor.session);
    const b = await state(actor.other);
    return actor.before.revision !== null && a.revision > actor.before.revision && b.revision === a.revision ? { a, b } : false;
  }, 60_000);

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
} catch (error) {
  await logDiagnostic('host', host);
  await logDiagnostic('joiner', joiner);
  throw error;
} finally {
  await closeSession(joiner);
  await closeSession(host);
  stopProcess(driver);
}
