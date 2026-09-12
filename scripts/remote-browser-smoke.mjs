import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4174';
const WEBDRIVER = 'http://127.0.0.1:9516';
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
    if (output.length > 24_000) output = output.slice(-24_000);
  };
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
  return value.sessionId ?? value['sessionId'];
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
    width, height, screenWidth: width, screenHeight: height, deviceScaleFactor: 1, mobile,
    positionX: 0, positionY: 0, dontSetVisibleSize: false,
  });
  await cdp(session, 'Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 });
}

async function navigate(session, url) {
  await webdriver(`/session/${session}/url`, { method: 'POST', body: JSON.stringify({ url }) });
}

async function screenshot(session, name) {
  const base64 = await webdriver(`/session/${session}/screenshot`);
  await writeFile(`${OUTPUT}/${name}.png`, Buffer.from(base64, 'base64'));
}

async function closeSession(session) {
  if (!session) return;
  try { await webdriver(`/session/${session}`, { method: 'DELETE' }); } catch {}
}

async function waitForText(session, text, timeoutMs = 20_000) {
  return waitFor(`text ${JSON.stringify(text)}`, () => execute(session, `return document.body?.innerText.includes(${JSON.stringify(text)}) ?? false;`), timeoutMs);
}

async function clickButton(session, text) {
  const clicked = await execute(session, `
    const button = [...document.querySelectorAll('button')].find((node) => node.textContent?.trim().startsWith(${JSON.stringify(text)}) && !node.disabled);
    if (!button) return false;
    button.click();
    return true;
  `);
  if (!clicked) throw new Error(`Enabled button ${text} not found`);
}

async function remoteState(session) {
  return execute(session, `
    const params = new URLSearchParams(location.search);
    const room = params.get('room');
    const token = room ? localStorage.getItem('tysiac:seat-token:' + room) : null;
    const revText = [...document.querySelectorAll('.footer span')].map((node) => node.textContent?.trim() ?? '').find((text) => /^rev \\d+$/.test(text));
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

function assertLayout(label, state, expectedWidth) {
  if (state.width !== expectedWidth) throw new Error(`${label}: viewport ${state.width}, expected ${expectedWidth}`);
  if (state.scrollWidth > state.width + 1) throw new Error(`${label}: page horizontal overflow ${state.scrollWidth} > ${state.width}`);
  if (state.handClientWidth && state.handScrollWidth > state.handClientWidth + 1) {
    throw new Error(`${label}: hand horizontal overflow ${state.handScrollWidth} > ${state.handClientWidth}`);
  }
}

async function waitForGame(session, label) {
  await waitFor(`${label}: connected game`, async () => {
    const state = await remoteState(session);
    return state.connection.includes('online') && state.handCards.length > 0 && state.revision !== null ? state : false;
  });
  return remoteState(session);
}

async function performDecision(session, label) {
  const heading = await waitFor(`${label}: human decision`, async () => {
    const value = await execute(session, `return document.querySelector('.decision-card h2')?.textContent?.trim() ?? '';`);
    return value || false;
  });

  if (heading === 'Twoja licytacja') {
    const passed = await execute(session, `
      const pass = [...document.querySelectorAll('.decision-card button:not(:disabled)')].find((button) => button.textContent?.trim() === 'Pas');
      if (pass) { pass.click(); return true; }
      const numeric = [...document.querySelectorAll('.bid-actions button:not(:disabled)')]
        .map((button) => ({ button, value: Number(button.textContent?.trim()) }))
        .filter((entry) => Number.isFinite(entry.value))
        .sort((a, b) => a.value - b.value)[0];
      if (!numeric) return false;
      numeric.button.click();
      return true;
    `);
    if (!passed) throw new Error(`${label}: auction has no enabled legal action`);
    return heading;
  }

  if (heading === 'Oddaj po jednej karcie') {
    for (let count = 1; count <= 2; count += 1) {
      const clicked = await execute(session, `
        const card = [...document.querySelectorAll('.hand .card:not(:disabled)')].find((node) => !node.classList.contains('selected'));
        if (!card) return false;
        card.click();
        return true;
      `);
      if (!clicked) throw new Error(`${label}: cannot select exchange card ${count}`);
      await waitFor(`${label}: exchange selection ${count}`, () => execute(session, `return document.querySelectorAll('.hand .card.selected').length === ${count};`));
    }
    await clickButton(session, 'Potwierdź wymianę');
    return heading;
  }

  if (heading === 'Ile ostatecznie grasz?') {
    const clicked = await execute(session, `
      const button = [...document.querySelectorAll('.contract-actions button:not(:disabled)')]
        .map((node) => ({ node, value: Number(node.textContent?.trim()) }))
        .filter((entry) => Number.isFinite(entry.value))
        .sort((a, b) => a.value - b.value)[0]?.node;
      if (!button) return false;
      button.click();
      return true;
    `);
    if (!clicked) throw new Error(`${label}: no contract action`);
    return heading;
  }

  if (heading === 'Twój ruch') {
    const clicked = await execute(session, `
      const card = document.querySelector('.hand .card:not(:disabled)');
      if (!card) return false;
      card.click();
      return true;
    `);
    if (!clicked) throw new Error(`${label}: no playable card`);
    return heading;
  }

  if (heading.startsWith('Rozdanie ')) {
    await clickButton(session, 'Następne rozdanie');
    return heading;
  }

  throw new Error(`${label}: unsupported decision ${JSON.stringify(heading)}`);
}

async function runSoloReconnect(label, width, height, mobile) {
  let session;
  try {
    session = await createSession();
    await emulateViewport(session, width, height, mobile);
    await navigate(session, BASE_URL);
    await waitForText(session, 'Usiądź do stołu');
    await clickButton(session, 'Zagraj sam');

    const before = await waitForGame(session, `${label}: solo`);
    assertLayout(`${label}: solo`, before, width);
    if (!/^[0-9A-HJKMNP-TV-Z]{12}$/.test(before.room ?? '')) throw new Error(`${label}: invalid room code ${before.room}`);
    if (!before.token?.startsWith('ts1_')) throw new Error(`${label}: reconnect token missing from localStorage`);
    if (before.url.includes(before.token) || before.body.includes(before.token) || before.body.includes('ts1_')) {
      throw new Error(`${label}: reconnect token leaked to URL/DOM`);
    }
    await screenshot(session, `${label}-remote-solo-connected`);

    const initialRevision = before.revision;
    const decision = await performDecision(session, `${label}: solo`);
    const after = await waitFor(`${label}: remote revision advance`, async () => {
      const state = await remoteState(session);
      return state.revision !== null && initialRevision !== null && state.revision > initialRevision ? state : false;
    });
    assertLayout(`${label}: solo after command`, after, width);

    const stableToken = after.token;
    const currentUrl = after.url;
    await navigate(session, currentUrl);
    const restored = await waitForGame(session, `${label}: reconnect`);
    assertLayout(`${label}: reconnect`, restored, width);
    if (restored.token !== stableToken) throw new Error(`${label}: reconnect token changed across refresh`);
    if (restored.room !== before.room) throw new Error(`${label}: room changed across refresh`);
    if (restored.revision < after.revision) throw new Error(`${label}: reconnect restored stale revision`);
    await screenshot(session, `${label}-remote-solo-reconnected`);

    return { room: before.room, initialRevision, decision, afterRevision: after.revision, restoredRevision: restored.revision };
  } finally {
    await closeSession(session);
  }
}

async function runDuoCrossDevice() {
  let host;
  let joiner;
  try {
    host = await createSession();
    joiner = await createSession();
    await emulateViewport(host, 1440, 1000, false);
    await emulateViewport(joiner, 390, 844, true);

    await navigate(host, BASE_URL);
    await waitForText(host, 'Usiądź do stołu');
    await clickButton(host, 'Zagraj we dwóch');
    await waitForText(host, 'Kopiuj link dla znajomego');
    const hostLobby = await remoteState(host);
    if (!/^[0-9A-HJKMNP-TV-Z]{12}$/.test(hostLobby.room ?? '')) throw new Error(`duo: invalid host room ${hostLobby.room}`);
    if (!hostLobby.token?.startsWith('ts1_')) throw new Error('duo: host token missing');

    await navigate(joiner, `${BASE_URL}?room=${hostLobby.room}`);
    await waitForText(joiner, 'Dołącz do stołu');
    const guestLobby = await remoteState(joiner);
    if (guestLobby.token !== null) throw new Error('duo: share-link visitor unexpectedly owns a seat before join');
    await clickButton(joiner, 'Dołącz do stołu');

    const [hostGame, joinerGame] = await Promise.all([
      waitForGame(host, 'duo host'),
      waitForGame(joiner, 'duo joiner'),
    ]);
    assertLayout('duo host', hostGame, 1440);
    assertLayout('duo mobile joiner', joinerGame, 390);
    if (!joinerGame.token?.startsWith('ts1_')) throw new Error('duo: joiner token missing');
    if (hostGame.token === joinerGame.token) throw new Error('duo: two human seats share a credential');
    if (hostGame.url.includes(hostGame.token) || joinerGame.url.includes(joinerGame.token)) throw new Error('duo: credential leaked into URL');

    await waitFor('duo: host sees joined human seat', async () => {
      const state = await remoteState(host);
      return state.scoreLabels.includes('Gracz 2') ? state : false;
    });

    const hostCards = new Set(hostGame.handCards);
    for (const card of joinerGame.handCards) {
      if (hostCards.has(card)) throw new Error(`duo: private hand identity appears in both seats: ${card}`);
    }

    const actor = await waitFor('duo: one human has decision', async () => {
      const hostState = await remoteState(host);
      if (hostState.decision) return { session: host, other: joiner, label: 'host', state: hostState };
      const joinerState = await remoteState(joiner);
      if (joinerState.decision) return { session: joiner, other: host, label: 'joiner', state: joinerState };
      return false;
    });
    const beforeRevision = actor.state.revision;
    const decision = await performDecision(actor.session, `duo ${actor.label}`);
    const synchronized = await waitFor('duo: both browsers receive command revision', async () => {
      const a = await remoteState(actor.session);
      const b = await remoteState(actor.other);
      return beforeRevision !== null && a.revision > beforeRevision && b.revision >= a.revision ? { a, b } : false;
    });

    await screenshot(host, 'desktop-remote-duo-host');
    await screenshot(joiner, 'mobile-remote-duo-joiner');
    return {
      room: hostGame.room,
      hostSeatLabel: hostGame.scoreLabels,
      joinerSeatLabel: joinerGame.scoreLabels,
      hostHand: hostGame.handCards.length,
      joinerHand: joinerGame.handCards.length,
      decision,
      revision: synchronized.a.revision,
    };
  } finally {
    await closeSession(joiner);
    await closeSession(host);
  }
}

await mkdir(OUTPUT, { recursive: true });
const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4174']);
const driver = startProcess('chromedriver', ['--port=9516']);

try {
  await waitFor('Vite remote dev server', async () => {
    const response = await fetch(BASE_URL).catch(() => null);
    return response?.ok;
  });
  await waitFor('ChromeDriver remote', async () => {
    const response = await fetch(`${WEBDRIVER}/status`).catch(() => null);
    return response?.ok;
  });

  const soloDesktop = await runSoloReconnect('desktop', 1440, 1000, false);
  const soloMobile = await runSoloReconnect('mobile', 390, 844, true);
  const duo = await runDuoCrossDevice();
  console.log('remote browser smoke: PASS');
  console.log(JSON.stringify({ soloDesktop, soloMobile, duo }, null, 2));
} catch (error) {
  console.error('remote browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  stopProcess(driver.child);
  stopProcess(vite.child);
}
