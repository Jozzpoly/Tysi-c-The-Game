import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4198';
const WEBDRIVER = 'http://127.0.0.1:9538';
const OUTPUT = 'artifacts/browser';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(label, probe, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await probe();
      if (value) return value;
    } catch (error) { lastError = error; }
    await sleep(20);
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError}` : ''}`);
}

function startProcess(command, args) {
  const child = spawn(command, args, { detached: true, stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
  let output = '';
  const capture = (chunk) => { output = `${output}${chunk.toString()}`.slice(-15_000); };
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

async function screenshot(session, name) {
  const base64 = await webdriver(`/session/${session}/screenshot`);
  await writeFile(`${OUTPUT}/${name}.png`, Buffer.from(base64, 'base64'));
}

async function closeSession(session) {
  if (!session) return;
  try { await webdriver(`/session/${session}`, { method: 'DELETE' }); } catch {}
}

async function clickButtonByText(session, text) {
  const clicked = await execute(session, `
    const button = [...document.querySelectorAll('button')].find((node) => node.textContent?.trim() === ${JSON.stringify(text)} && !node.disabled);
    if (!button) return false;
    button.click();
    return true;
  `);
  if (!clicked) throw new Error(`enabled button not found: ${text}`);
}

async function decisionHeading(session) {
  return execute(session, `return document.querySelector('.decision-card h2')?.textContent?.trim() ?? '';`);
}

async function clickHighestBid(session) {
  const value = await execute(session, `
    const buttons = [...document.querySelectorAll('.decision-card button:not(:disabled)')]
      .map((button) => ({ button, value: Number(button.textContent?.trim()) }))
      .filter((entry) => Number.isFinite(entry.value))
      .sort((a, b) => a.value - b.value);
    const chosen = buttons.at(-1);
    if (!chosen) return null;
    chosen.button.click();
    return chosen.value;
  `);
  if (value === null) throw new Error('no numeric bid');
  return value;
}

async function driveHumanToExchange(session, label) {
  for (let round = 0; round < 8; round += 1) {
    const heading = await waitFor(`${label}: auction/exchange`, async () => {
      const value = await decisionHeading(session);
      return value === 'Twoja licytacja' || value === 'Oddaj po jednej karcie' ? value : false;
    }, 12_000);
    if (heading === 'Oddaj po jednej karcie') return;
    await clickHighestBid(session);
  }
  throw new Error(`${label}: exchange not reached`);
}

async function openScenario(width, height, mobile) {
  const session = await createSession();
  await cdp(session, 'Emulation.setDeviceMetricsOverride', {
    width, height, screenWidth: width, screenHeight: height,
    deviceScaleFactor: 1, mobile, positionX: 0, positionY: 0, dontSetVisibleSize: false,
  });
  await cdp(session, 'Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 });
  await webdriver(`/session/${session}/url`, {
    method: 'POST', body: JSON.stringify({ url: `${BASE_URL}?seed=2&seat=0` }),
  });
  return session;
}

async function inspectDeal(session) {
  return execute(session, `
    const transfers = [...document.querySelectorAll('.deal-transfer-card')];
    const slots = [...document.querySelectorAll('.hand-slot.is-deal-materializing')];
    const receiving = [...document.querySelectorAll('[data-seat-anchor].is-deal-receiving')];
    const opponentBacks = [...document.querySelectorAll('.opponent .card-backs i')];
    const visible = (node) => {
      if (!node) return false;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > .02 && rect.width > 1 && rect.height > 1;
    };
    return {
      state: document.querySelector('.material-deal-state')?.getAttribute('data-deal-material-state') ?? 'missing',
      transfers: transfers.length,
      faces: transfers.filter((node) => node.classList.contains('is-face')).length,
      backs: transfers.filter((node) => node.classList.contains('is-back')).length,
      knownCards: transfers.map((node) => node.getAttribute('data-deal-card')).filter(Boolean),
      seats: transfers.map((node) => node.getAttribute('data-deal-seat')).filter(Boolean),
      visibleTransfers: transfers.filter(visible).length,
      sourceVisible: visible(document.querySelector('.deal-source-stack')),
      materialSlots: slots.map((node) => node.getAttribute('data-card')).filter(Boolean),
      hiddenMaterialTargets: slots.filter((node) => {
        const card = node.querySelector(':scope > .card');
        return card && getComputedStyle(card).visibility === 'hidden';
      }).length,
      receivingAnchors: receiving.length,
      opponentBacks: opponentBacks.length,
      hiddenOpponentBacks: opponentBacks.filter((node) => getComputedStyle(node).visibility === 'hidden').length,
      handCards: document.querySelectorAll('.hand .card').length,
      visibleHandCards: [...document.querySelectorAll('.hand .card')].filter(visible).length,
      decisionHeading: document.querySelector('.decision-card h2')?.textContent?.trim() ?? '',
      enabledDecisionButtons: document.querySelectorAll('.decision-card button:not(:disabled)').length,
      pageHeading: document.querySelector('.topbar h1')?.textContent?.trim() ?? '',
      scrollWidth: document.documentElement.scrollWidth,
      width: document.documentElement.clientWidth,
    };
  `);
}

async function runViewport(label, width, height, mobile) {
  const session = await openScenario(width, height, mobile);
  try {
    await driveHumanToExchange(session, label);
    await clickButtonByText(session, 'Bomba — wycofaj się');
    await waitFor(`${label}: bomb confirmation`, () => execute(session, `return document.querySelector('.decision-card h2')?.textContent?.trim() === 'Potwierdź bombę';`));
    await clickButtonByText(session, 'Potwierdź bombę');
    await waitFor(`${label}: hand complete`, () => execute(session, `return document.querySelector('.decision-card h2')?.textContent?.includes('Kończysz rozdanie bombą') ?? false;`));
    await clickButtonByText(session, 'Następne rozdanie');

    await waitFor(`${label}: material deal active`, () => execute(session, `return Boolean(document.querySelector('.material-deal-state.is-active'));`), 1_000);
    await waitFor(`${label}: 21 deal transfers`, async () => (await inspectDeal(session)).transfers === 21, 500);
    await sleep(140);
    const flight = await inspectDeal(session);
    if (flight.state !== 'active' || flight.transfers !== 21 || flight.faces !== 7 || flight.backs !== 14) {
      throw new Error(`${label}: deal does not materialize 7 known + 14 private cards ${JSON.stringify(flight)}`);
    }
    if (flight.knownCards.length !== 7 || new Set(flight.knownCards).size !== 7 || flight.materialSlots.length !== 7) {
      throw new Error(`${label}: human deal identities/targets are not exact ${JSON.stringify(flight)}`);
    }
    if (flight.knownCards.some((card) => !flight.materialSlots.includes(card)) || flight.hiddenMaterialTargets !== 7) {
      throw new Error(`${label}: canonical human targets became visible before landing ${JSON.stringify(flight)}`);
    }
    if (flight.receivingAnchors !== 2 || flight.opponentBacks !== 14 || flight.hiddenOpponentBacks !== 14) {
      throw new Error(`${label}: opponent deal targets are not singular/private ${JSON.stringify(flight)}`);
    }
    if (!flight.sourceVisible || flight.visibleHandCards !== 0 || flight.enabledDecisionButtons !== 0 || flight.pageHeading !== 'Licytacja') {
      throw new Error(`${label}: deal presentation/input contract broken ${JSON.stringify(flight)}`);
    }
    if (new Set(flight.seats).size !== 3) throw new Error(`${label}: deal does not address all three seats ${JSON.stringify(flight)}`);
    await screenshot(session, `${label}-deal-flight`);

    const settled = await waitFor(`${label}: deal settled`, async () => {
      const state = await inspectDeal(session);
      return state.state === 'settled'
        && state.transfers === 0
        && state.materialSlots.length === 0
        && state.receivingAnchors === 0
        && state.handCards === 7
        && state.visibleHandCards === 7
        && state.opponentBacks === 14
        && state.hiddenOpponentBacks === 0
        && state.decisionHeading === 'Twoja licytacja'
        && state.enabledDecisionButtons > 0
        ? state
        : false;
    }, 2_500);
    if (settled.scrollWidth > settled.width + 1) throw new Error(`${label}: deal caused horizontal overflow ${JSON.stringify(settled)}`);
    await screenshot(session, `${label}-deal-settled`);

    await webdriver(`/session/${session}/refresh`, { method: 'POST', body: '{}' });
    await waitFor(`${label}: static reload ready`, () => execute(session, `return document.querySelectorAll('.hand .card').length === 7;`), 5_000);
    await sleep(700);
    const staticState = await inspectDeal(session);
    if (staticState.transfers !== 0 || staticState.state !== 'missing') {
      throw new Error(`${label}: eventless/static load replayed deal material ${JSON.stringify(staticState)}`);
    }

    return { label, flight, settled, staticState: { state: staticState.state, transfers: staticState.transfers, handCards: staticState.handCards } };
  } finally {
    await closeSession(session);
  }
}

await mkdir(OUTPUT, { recursive: true });
const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4198']);
const driver = startProcess('chromedriver', ['--port=9538']);

try {
  await waitFor('Vite deal server', async () => (await fetch(BASE_URL).catch(() => null))?.ok);
  await waitFor('ChromeDriver', async () => (await fetch(`${WEBDRIVER}/status`).catch(() => null))?.ok);
  const evidence = {
    desktop: await runViewport('desktop-deal', 1440, 1000, false),
    mobile: await runViewport('mobile-deal', 390, 844, true),
  };
  console.log('material deal browser smoke: PASS');
  console.log(JSON.stringify(evidence, null, 2));
} catch (error) {
  console.error('material deal browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  stopProcess(driver.child);
  stopProcess(vite.child);
}
