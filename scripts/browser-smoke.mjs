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
  const child = spawn(command, args, {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });
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
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    try { child.kill('SIGTERM'); } catch {}
  }
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
            args: [
              '--headless=new',
              '--no-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu',
              '--window-size=1440,1000',
            ],
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

async function cdp(session, cmd, params = {}) {
  return webdriver(`/session/${session}/goog/cdp/execute`, {
    method: 'POST',
    body: JSON.stringify({ cmd, params }),
  });
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

async function navigate(session, url) {
  await webdriver(`/session/${session}/url`, {
    method: 'POST',
    body: JSON.stringify({ url }),
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

async function waitForText(session, text, timeoutMs = 15_000) {
  return waitFor(`text ${JSON.stringify(text)}`, () => execute(session, `return document.body?.innerText.includes(${JSON.stringify(text)}) ?? false;`), timeoutMs);
}

async function decisionHeading(session) {
  return execute(session, `return document.querySelector('.decision-card h2')?.textContent?.trim() ?? '';`);
}

async function clickButtonByText(session, text) {
  const clicked = await execute(session, `
    const button = [...document.querySelectorAll('button')].find((node) => node.textContent?.trim() === ${JSON.stringify(text)} && !node.disabled);
    if (!button) return false;
    button.click();
    return true;
  `);
  if (!clicked) throw new Error(`Enabled button ${text} not found`);
}

async function clickNumericDecisionButton(session, mode) {
  const clicked = await execute(session, `
    const buttons = [...document.querySelectorAll('.decision-card button:not(:disabled)')]
      .map((button) => ({ button, value: Number(button.textContent?.trim()) }))
      .filter((entry) => Number.isFinite(entry.value));
    if (buttons.length === 0) return null;
    buttons.sort((a, b) => a.value - b.value);
    const chosen = ${JSON.stringify(mode)} === 'highest' ? buttons.at(-1) : buttons[0];
    chosen.button.click();
    return chosen.value;
  `);
  if (clicked === null) throw new Error(`No numeric decision button found (${mode})`);
  return clicked;
}

async function clickFirstUnselectedHandCard(session) {
  const clicked = await execute(session, `
    const card = [...document.querySelectorAll('.hand .card:not(:disabled)')].find((node) => !node.classList.contains('selected'));
    if (!card) return false;
    card.click();
    return true;
  `);
  if (!clicked) throw new Error('No unselected enabled hand card found');
}

async function clickFirstPlayableHandCard(session) {
  const clicked = await execute(session, `
    const card = document.querySelector('.hand .card:not(:disabled)');
    if (!card) return false;
    card.click();
    return true;
  `);
  if (!clicked) throw new Error('No enabled hand card found');
}

async function inspectLayout(session) {
  return execute(session, `
    const hand = document.querySelector('.hand');
    return {
      title: document.title,
      width: document.documentElement.clientWidth,
      innerWidth: window.innerWidth,
      visualWidth: window.visualViewport?.width ?? null,
      scrollWidth: document.documentElement.scrollWidth,
      height: document.documentElement.clientHeight,
      innerHeight: window.innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
      devicePixelRatio: window.devicePixelRatio,
      enabledHandCards: document.querySelectorAll('.hand .card:not(:disabled)').length,
      selectedHandCards: document.querySelectorAll('.hand .card.selected').length,
      handCards: document.querySelectorAll('.hand .card').length,
      handClientWidth: hand?.clientWidth ?? 0,
      handScrollWidth: hand?.scrollWidth ?? 0,
      decision: document.querySelector('.decision-card')?.innerText ?? '',
      decisionHeading: document.querySelector('.decision-card h2')?.textContent?.trim() ?? '',
      message: document.querySelector('.message')?.innerText ?? '',
    };
  `);
}

function assertViewport(label, layout, expectedWidth) {
  if (layout.title !== 'Tysiąc The Game') throw new Error(`${label}: unexpected title ${layout.title}`);
  if (layout.width !== expectedWidth || layout.innerWidth !== expectedWidth || Math.round(layout.visualWidth ?? -1) !== expectedWidth) {
    throw new Error(`${label}: requested ${expectedWidth}px viewport but got document=${layout.width}, inner=${layout.innerWidth}, visual=${layout.visualWidth}`);
  }
  if (layout.scrollWidth > layout.width + 1) {
    throw new Error(`${label}: page overflows horizontally (${layout.scrollWidth} > ${layout.width})`);
  }
}

async function openScenario(label, width, height, mobile, seed) {
  const session = await createSession();
  await emulateViewport(session, width, height, mobile);
  await navigate(session, `${BASE_URL}?seed=${seed}`);
  return session;
}

async function runDefenderViewport(label, width, height, mobile) {
  let session;
  try {
    session = await openScenario(label, width, height, mobile, 1);
    await waitForText(session, 'Twoja licytacja');

    const auctionLayout = await inspectLayout(session);
    assertViewport(`${label}: defender auction`, auctionLayout, width);
    await screenshot(session, `${label}-defender-auction`);

    await clickButtonByText(session, 'Pas');
    await waitForText(session, 'Twój ruch', 20_000);
    const beforePlay = await inspectLayout(session);
    assertViewport(`${label}: defender human turn`, beforePlay, width);
    if (beforePlay.enabledHandCards < 1) throw new Error(`${label}: no playable human card`);
    await screenshot(session, `${label}-defender-human-turn`);

    await clickFirstPlayableHandCard(session);
    await waitFor(`${label}: defender completed trick`, () => execute(session, `return document.querySelector('.trick-result')?.textContent?.includes('Lewa 1:') ?? false;`), 5_000);
    const completed = await inspectLayout(session);
    assertViewport(`${label}: defender completed trick`, completed, width);
    await screenshot(session, `${label}-defender-completed-trick`);
    return { auctionLayout, beforePlay, completed };
  } finally {
    await closeSession(session);
  }
}

async function driveHumanToExchange(session, label) {
  for (let round = 0; round < 8; round += 1) {
    const heading = await waitFor(`${label}: auction decision`, async () => {
      const value = await decisionHeading(session);
      return value === 'Twoja licytacja' || value === 'Oddaj po jednej karcie' ? value : false;
    }, 10_000);
    if (heading === 'Oddaj po jednej karcie') return;
    await clickNumericDecisionButton(session, 'highest');
  }
  throw new Error(`${label}: human did not reach exchange after bounded auction loop`);
}

async function runDeclarerViewport(label, width, height, mobile) {
  let session;
  try {
    session = await openScenario(label, width, height, mobile, 2);
    await driveHumanToExchange(session, label);

    const exchange = await inspectLayout(session);
    assertViewport(`${label}: declarer exchange`, exchange, width);
    if (exchange.handCards !== 10 || exchange.enabledHandCards !== 10) {
      throw new Error(`${label}: expected 10 selectable cards at exchange, got hand=${exchange.handCards}, enabled=${exchange.enabledHandCards}`);
    }
    await screenshot(session, `${label}-declarer-exchange`);

    await clickFirstUnselectedHandCard(session);
    await waitFor(`${label}: first exchange card selection`, async () => (await inspectLayout(session)).selectedHandCards === 1);
    await clickFirstUnselectedHandCard(session);
    await waitFor(`${label}: second exchange card selection`, async () => (await inspectLayout(session)).selectedHandCards === 2);
    await clickButtonByText(session, 'Potwierdź wymianę');

    await waitForText(session, 'Ile ostatecznie grasz?');
    const contract = await inspectLayout(session);
    assertViewport(`${label}: declarer contract`, contract, width);
    if (contract.handCards !== 8) throw new Error(`${label}: expected 8 cards after exchange, got ${contract.handCards}`);
    await screenshot(session, `${label}-declarer-contract`);

    const contractValue = await clickNumericDecisionButton(session, 'lowest');
    await waitForText(session, 'Twój ruch');
    const lead = await inspectLayout(session);
    assertViewport(`${label}: declarer first lead`, lead, width);
    if (lead.enabledHandCards < 1) throw new Error(`${label}: declarer has no playable lead`);
    await screenshot(session, `${label}-declarer-lead`);

    await clickFirstPlayableHandCard(session);
    await waitFor(`${label}: declarer first trick completed`, () => execute(session, `return document.querySelector('.trick-result')?.textContent?.includes('Lewa 1:') ?? false;`), 5_000);
    const completed = await inspectLayout(session);
    assertViewport(`${label}: declarer completed trick`, completed, width);
    await screenshot(session, `${label}-declarer-completed-trick`);

    return { exchange, contract, contractValue, lead, completed };
  } finally {
    await closeSession(session);
  }
}

await mkdir(OUTPUT, { recursive: true });
const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173']);
const driver = startProcess('chromedriver', ['--port=9515']);

try {
  await waitFor('Vite dev server', async () => {
    const response = await fetch(BASE_URL).catch(() => null);
    return response?.ok;
  });
  await waitFor('ChromeDriver', async () => {
    const response = await fetch(`${WEBDRIVER}/status`).catch(() => null);
    return response?.ok;
  });

  const desktop = {
    defender: await runDefenderViewport('desktop', 1440, 1000, false),
    declarer: await runDeclarerViewport('desktop', 1440, 1000, false),
  };
  const mobile = {
    defender: await runDefenderViewport('mobile', 390, 844, true),
    declarer: await runDeclarerViewport('mobile', 390, 844, true),
  };
  console.log('browser smoke: PASS');
  console.log(JSON.stringify({ desktop, mobile }, null, 2));
} catch (error) {
  console.error('browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  stopProcess(driver.child);
  stopProcess(vite.child);
}
