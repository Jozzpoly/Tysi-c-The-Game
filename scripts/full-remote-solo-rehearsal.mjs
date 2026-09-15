import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4177';
const WEBDRIVER = 'http://127.0.0.1:9519';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(label, probe, timeoutMs = 25_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await probe();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(30);
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError}` : ''}`);
}

function startProcess(command, args) {
  let output = '';
  const child = spawn(command, args, { detached: true, stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
  const capture = (chunk) => {
    output += chunk.toString();
    if (output.length > 30_000) output = output.slice(-30_000);
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
  if (!response.ok || body?.value?.error) {
    throw new Error(`WebDriver ${init.method ?? 'GET'} ${path}: ${JSON.stringify(body)}`);
  }
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

async function touch(session, type, points) {
  await cdp(session, 'Input.dispatchTouchEvent', { type, touchPoints: points });
}

async function dragPointer(session, from, to, mobile, steps = 8) {
  if (mobile) {
    await touch(session, 'touchStart', [{ x: from.x, y: from.y, radiusX: 7, radiusY: 7, force: 1 }]);
    await sleep(32);
    for (let step = 1; step <= steps; step += 1) {
      const ratio = step / steps;
      await touch(session, 'touchMove', [{
        x: from.x + (to.x - from.x) * ratio,
        y: from.y + (to.y - from.y) * ratio,
        radiusX: 7,
        radiusY: 7,
        force: 1,
      }]);
      await sleep(20);
    }
    await touch(session, 'touchEnd', []);
    return;
  }

  await cdp(session, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x: from.x, y: from.y });
  await cdp(session, 'Input.dispatchMouseEvent', {
    type: 'mousePressed', x: from.x, y: from.y, button: 'left', buttons: 1, clickCount: 1,
  });
  await sleep(28);
  for (let step = 1; step <= steps; step += 1) {
    const ratio = step / steps;
    await cdp(session, 'Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: from.x + (to.x - from.x) * ratio,
      y: from.y + (to.y - from.y) * ratio,
      button: 'left',
      buttons: 1,
    });
    await sleep(18);
  }
  await cdp(session, 'Input.dispatchMouseEvent', {
    type: 'mouseReleased', x: to.x, y: to.y, button: 'left', buttons: 0, clickCount: 1,
  });
}

async function exchangeDragGeometry(session, targetIndex) {
  return execute(session, `
    const sourceSlot = [...document.querySelectorAll('.hand .hand-slot')]
      .find((slot) => !slot.classList.contains('is-exchange-staged'));
    const sourceCard = sourceSlot?.querySelector(':scope > .card');
    const targets = [...document.querySelectorAll('[data-exchange-target-seat]')];
    const target = targets[${targetIndex}];
    if (!sourceSlot || !sourceCard || !target) return null;
    const sourceRect = sourceCard.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    return {
      from: { x: sourceRect.left + sourceRect.width / 2, y: sourceRect.top + sourceRect.height / 2 },
      to: { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 },
    };
  `);
}

async function dragNextExchangeCard(session, targetIndex, mobile) {
  const geometry = await exchangeDragGeometry(session, targetIndex);
  if (!geometry) throw new Error(`physical exchange geometry unavailable for target ${targetIndex}`);
  await dragPointer(session, geometry.from, geometry.to, mobile);
}

async function emulateViewport(session, width, height, mobile) {
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
}

async function installAcceleratedPresentationClock(session) {
  await cdp(session, 'Page.addScriptToEvaluateOnNewDocument', {
    source: `
      (() => {
        const nativeSetTimeout = window.setTimeout.bind(window);
        window.setTimeout = (handler, delay = 0, ...args) => nativeSetTimeout(handler, Math.min(Number(delay) || 0, 18), ...args);
      })();
    `,
  });
}

async function navigate(session, url) {
  await webdriver(`/session/${session}/url`, { method: 'POST', body: JSON.stringify({ url }) });
}

async function closeSession(session) {
  if (!session) return;
  try { await webdriver(`/session/${session}`, { method: 'DELETE' }); } catch {}
}

async function clickButton(session, text) {
  return execute(session, `
    const button = [...document.querySelectorAll('button')]
      .find((node) => node.textContent?.trim() === ${JSON.stringify(text)} && !node.disabled);
    if (!button) return false;
    button.click();
    return true;
  `);
}

async function clickButtonStartingWith(session, text) {
  return execute(session, `
    const button = [...document.querySelectorAll('button')]
      .find((node) => node.textContent?.trim().startsWith(${JSON.stringify(text)}) && !node.disabled);
    if (!button) return false;
    button.click();
    return true;
  `);
}

async function view(session) {
  return execute(session, `
    const revText = [...document.querySelectorAll('.footer span')]
      .map((node) => node.textContent?.trim() ?? '')
      .find((text) => /^rev \\d+$/.test(text));
    const scores = [...document.querySelectorAll('.opponent .seat-score, .hand-score strong')]
      .map((node) => Number(node.textContent?.trim()))
      .filter(Number.isFinite);
    const hand = document.querySelector('.hand');
    return {
      body: document.body?.innerText ?? '',
      revision: revText ? Number(revText.slice(4)) : null,
      connection: document.querySelector('.connection-banner')?.textContent?.trim() ?? '',
      phaseTitle: document.querySelector('.topbar h1')?.textContent?.trim() ?? '',
      heading: document.querySelector('.decision-card h2')?.textContent?.trim() ?? '',
      decisionText: document.querySelector('.decision-card')?.innerText ?? '',
      message: document.querySelector('.message')?.textContent?.trim() ?? '',
      enabledButtons: [...document.querySelectorAll('.decision-card button:not(:disabled)')].map((node) => node.textContent?.trim() ?? ''),
      enabledHandCards: document.querySelectorAll('.hand .card:not(:disabled)').length,
      handCards: document.querySelectorAll('.hand .card').length,
      scores,
      width: window.innerWidth,
      contentWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      handClientWidth: hand?.clientWidth ?? 0,
      handScrollWidth: hand?.scrollWidth ?? 0,
      url: location.href,
      room: new URLSearchParams(location.search).get('room'),
    };
  `);
}

function compactDiagnostic(current) {
  return {
    revision: current.revision,
    connection: current.connection,
    phaseTitle: current.phaseTitle,
    heading: current.heading,
    decisionText: current.decisionText,
    message: current.message,
    enabledButtons: current.enabledButtons,
    enabledHandCards: current.enabledHandCards,
    handCards: current.handCards,
    scores: current.scores,
    room: current.room,
  };
}

function isMatchComplete(current) {
  return current.phaseTitle === 'Rozdanie zakończone'
    && (current.heading === 'Remis' || current.heading === 'Wygrywasz' || current.heading.endsWith(' wygrywa'));
}

function assertLayout(label, current, width) {
  if (current.width !== width) throw new Error(`${label}: viewport ${current.width}, expected ${width}`);
  if (current.scrollWidth > current.contentWidth + 1) {
    throw new Error(`${label}: horizontal overflow ${current.scrollWidth} > ${current.contentWidth}`);
  }
  if (current.handClientWidth && current.handScrollWidth > current.handClientWidth + 1) {
    throw new Error(`${label}: hand overflow ${current.handScrollWidth} > ${current.handClientWidth}`);
  }
}

async function waitForActionableState(session, label, previousRevision = null) {
  return waitFor(label, async () => {
    const current = await view(session);
    if (!current.connection.includes('online')) {
      throw new Error(`not online: ${JSON.stringify(compactDiagnostic(current))}`);
    }
    if (current.connection.includes('ruchy przy stole')) {
      throw new Error(`playback active: ${JSON.stringify(compactDiagnostic(current))}`);
    }
    if (isMatchComplete(current)) return current;
    const actionable = current.enabledButtons.length > 0 || current.enabledHandCards > 0;
    if (!actionable) {
      throw new Error(`no human action: ${JSON.stringify(compactDiagnostic(current))}`);
    }
    if (previousRevision !== null && current.revision !== null && current.revision < previousRevision) {
      throw new Error(`${label}: revision regressed ${current.revision} < ${previousRevision}`);
    }
    return current;
  }, 30_000);
}

async function takeDecision(session, current, counters, mobile) {
  const heading = current.heading;

  if (heading === 'Twoja licytacja') {
    if (current.enabledButtons.includes('Pas')) {
      if (!await clickButton(session, 'Pas')) throw new Error('auction pass disappeared');
      counters.auctionPasses += 1;
      return 'auction-pass';
    }
    const values = current.enabledButtons.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
    if (values.length === 0 || !await clickButton(session, String(values[0]))) throw new Error('no auction action');
    counters.auctionBids += 1;
    return 'auction-bid';
  }

  if (heading === 'Oddaj po jednej karcie') {
    await dragNextExchangeCard(session, 0, mobile);
    await waitFor('exchange physical assignment 1', () => execute(session, `
      return document.querySelectorAll('.hand-slot.is-exchange-staged').length === 1;
    `), 1_000);
    await dragNextExchangeCard(session, 1, mobile);
    await waitFor('exchange physical commit', () => execute(session, `
      const state = document.querySelector('.material-exchange-state')?.getAttribute('data-exchange-material-state');
      const heading = document.querySelector('.decision-card h2')?.textContent?.trim() ?? '';
      return state === 'active' || state === 'settled' || heading === 'Ile ostatecznie grasz?';
    `), 2_000);
    counters.exchanges += 1;
    return 'exchange';
  }

  if (heading === 'Masz cztery dziewiątki') {
    if (!await clickButton(session, 'Graj dalej')) throw new Error('four-nines continue unavailable');
    counters.fourNinesContinues += 1;
    return 'four-nines-continue';
  }

  if (heading === 'Ile ostatecznie grasz?') {
    const values = current.enabledButtons.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
    if (values.length === 0 || !await clickButton(session, String(values[0]))) throw new Error('contract unavailable');
    counters.contracts += 1;
    return 'contract';
  }

  if (heading === 'Twój ruch') {
    const meld = current.enabledButtons.find((value) => value.startsWith('Melduj '));
    if (meld) {
      if (!await clickButton(session, meld)) throw new Error('meld action disappeared');
      counters.marriages += 1;
      counters.cardsPlayed += 1;
      return 'marriage-play';
    }
    const clicked = await execute(session, `
      const card = document.querySelector('.hand .card:not(:disabled)');
      if (!card) return false;
      card.click();
      return true;
    `);
    if (!clicked) throw new Error('playable card unavailable');
    counters.cardsPlayed += 1;
    return 'card-play';
  }

  if (heading.startsWith('Rozdanie ')
    || heading.startsWith('Kończysz rozdanie bombą')
    || heading.includes('kończy rozdanie bombą')) {
    if (!await clickButton(session, 'Następne rozdanie')) throw new Error('next hand unavailable');
    counters.completedHands += 1;
    return 'next-hand';
  }

  throw new Error(`unsupported actionable heading ${JSON.stringify(heading)} buttons=${JSON.stringify(current.enabledButtons)}`);
}

async function runFullMatch(label, width, height, mobile) {
  let session;
  try {
    session = await createSession();
    await emulateViewport(session, width, height, mobile);
    await installAcceleratedPresentationClock(session);
    await navigate(session, BASE_URL);
    await waitFor(`${label}: home`, () => execute(session, `return document.body?.innerText.includes('Usiądź do stołu') ?? false;`));
    if (!await clickButtonStartingWith(session, 'Zagraj sam')) throw new Error(`${label}: cannot create solo room`);

    let current = await waitForActionableState(session, `${label}: initial human decision`);
    assertLayout(`${label}: initial`, current, width);
    const room = current.room;
    if (!room) throw new Error(`${label}: room code missing`);

    const counters = {
      decisions: 0,
      auctionPasses: 0,
      auctionBids: 0,
      exchanges: 0,
      fourNinesContinues: 0,
      contracts: 0,
      marriages: 0,
      cardsPlayed: 0,
      completedHands: 0,
      reconnects: 0,
    };
    let lastRevision = current.revision ?? 0;
    let maxRevision = lastRevision;
    let reconnectDone = false;
    const startedAt = Date.now();

    while (!isMatchComplete(current)) {
      if (counters.decisions >= 1400) throw new Error(`${label}: decision bound exceeded`);

      assertLayout(`${label}: decision ${counters.decisions}`, current, width);
      if (current.revision !== null) {
        if (current.revision < lastRevision) throw new Error(`${label}: revision regressed ${current.revision} < ${lastRevision}`);
        maxRevision = Math.max(maxRevision, current.revision);
      }

      await takeDecision(session, current, counters, mobile);
      counters.decisions += 1;
      const previousRevision = current.revision;

      if (!reconnectDone && counters.decisions >= 40) {
        const beforeReconnect = await waitFor(`${label}: server advances before reconnect`, async () => {
          const observed = await view(session);
          return observed.revision !== null && previousRevision !== null && observed.revision > previousRevision ? observed : false;
        });
        const reconnectUrl = beforeReconnect.url;
        const reconnectFloor = beforeReconnect.revision;
        await navigate(session, reconnectUrl);
        current = await waitForActionableState(session, `${label}: reconnect recovery`, reconnectFloor);
        if (current.revision !== null && current.revision < reconnectFloor) {
          throw new Error(`${label}: reconnect restored stale revision ${current.revision} < ${reconnectFloor}`);
        }
        counters.reconnects += 1;
        reconnectDone = true;
      } else {
        current = await waitForActionableState(session, `${label}: next decision`, previousRevision);
      }

      if (current.revision !== null) lastRevision = current.revision;
    }

    assertLayout(`${label}: match complete`, current, width);
    if (counters.completedHands < 1) throw new Error(`${label}: match completed without observing a hand completion screen`);
    if (counters.reconnects !== 1) throw new Error(`${label}: mid-match reconnect was not exercised`);
    if (current.scores.length !== 3) throw new Error(`${label}: expected three visible player scores, got ${current.scores.join('/')}`);
    if (Math.max(...current.scores) < 1000) throw new Error(`${label}: match ended without a >=1000 score: ${current.scores.join('/')}`);

    return {
      label,
      room,
      finalRevision: current.revision,
      maxRevision,
      finalScores: current.scores,
      winnerHeading: current.heading,
      elapsedMs: Date.now() - startedAt,
      ...counters,
    };
  } finally {
    await closeSession(session);
  }
}

const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4177']);
const driver = startProcess('chromedriver', ['--port=9519']);

try {
  await waitFor('Vite full-match server', async () => {
    const response = await fetch(BASE_URL).catch(() => null);
    return response?.ok;
  });
  await waitFor('ChromeDriver', async () => {
    const response = await fetch(`${WEBDRIVER}/status`).catch(() => null);
    return response?.ok;
  });

  const desktop = await runFullMatch('desktop-full-solo', 1440, 1000, false);
  const mobile = await runFullMatch('mobile-full-solo', 390, 844, true);

  console.log('full remote solo rehearsal: PASS');
  console.log(JSON.stringify({ desktop, mobile }, null, 2));
} catch (error) {
  console.error('full remote solo rehearsal: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  stopProcess(driver.child);
  stopProcess(vite.child);
}
