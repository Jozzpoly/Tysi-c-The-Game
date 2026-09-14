import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4197';
const WEBDRIVER = 'http://127.0.0.1:9537';
const OUTPUT = 'artifacts/browser';
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

async function clickHighestBid(session) {
  return execute(session, `
    const candidates = [...document.querySelectorAll('.decision-card button:not(:disabled)')]
      .map((button) => ({ button, value: Number(button.textContent?.trim()) }))
      .filter((entry) => Number.isFinite(entry.value))
      .sort((a, b) => a.value - b.value);
    const chosen = candidates.at(-1);
    if (!chosen) return null;
    chosen.button.click();
    return chosen.value;
  `);
}

async function driveToTransfer(session, label) {
  for (let round = 0; round < 10; round += 1) {
    const state = await waitFor(`${label}: auction or transfer`, () => execute(session, `
      if (document.querySelector('.material-talon-state.is-active')) return 'transfer';
      const heading = document.querySelector('.decision-card h2')?.textContent?.trim() ?? '';
      if (heading === 'Twoja licytacja') return 'auction';
      if (heading === 'Oddaj po jednej karcie') return 'exchange';
      return '';
    `), 15_000);
    if (state === 'transfer') return;
    if (state === 'exchange') throw new Error(`${label}: exchange appeared without observable material transfer`);
    const bid = await clickHighestBid(session);
    if (bid === null) throw new Error(`${label}: no enabled numeric bid`);
  }
  throw new Error(`${label}: transfer not reached in bounded auction loop`);
}

async function inspectTransfer(session) {
  return execute(session, `
    const transferCards = [...document.querySelectorAll('.talon-transfer-card')];
    const sourceCards = [...document.querySelectorAll('.talon .mini-cards > .card')];
    const materialSlots = [...document.querySelectorAll('.hand-slot.is-talon-materializing')];
    const talon = document.querySelector('.talon');
    const visible = (node) => {
      if (!node) return false;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > .02 && rect.width > 1 && rect.height > 1;
    };
    return {
      state: document.querySelector('.material-talon-state')?.getAttribute('data-talon-material-state') ?? 'missing',
      transferCards: transferCards.map((node) => node.getAttribute('data-talon-transfer-card')),
      visibleTransferCards: transferCards.filter(visible).length,
      sourceCards: sourceCards.length,
      hiddenSourceCards: sourceCards.filter((node) => getComputedStyle(node).visibility === 'hidden').length,
      materialSlots: materialSlots.map((node) => node.getAttribute('data-card')),
      hiddenMaterialTargets: materialSlots.filter((node) => {
        const card = node.querySelector(':scope > .card');
        return card && getComputedStyle(card).visibility === 'hidden';
      }).length,
      enabledHandCards: document.querySelectorAll('.hand .card:not(:disabled)').length,
      handCards: document.querySelectorAll('.hand .card').length,
      decisionHeading: document.querySelector('.decision-card h2')?.textContent?.trim() ?? '',
      talonDisplay: talon ? getComputedStyle(talon).display : 'missing',
    };
  `);
}

async function inspectSettled(session) {
  return execute(session, `
    const talon = document.querySelector('.talon');
    return {
      state: document.querySelector('.material-talon-state')?.getAttribute('data-talon-material-state') ?? 'missing',
      transferCards: document.querySelectorAll('.talon-transfer-card').length,
      materialSlots: document.querySelectorAll('.hand-slot.is-talon-materializing').length,
      handCards: document.querySelectorAll('.hand .card').length,
      enabledHandCards: document.querySelectorAll('.hand .card:not(:disabled)').length,
      decisionHeading: document.querySelector('.decision-card h2')?.textContent?.trim() ?? '',
      talonDisplay: talon ? getComputedStyle(talon).display : 'missing',
      scrollWidth: document.documentElement.scrollWidth,
      width: document.documentElement.clientWidth,
    };
  `);
}

async function runViewport(label, width, height, mobile) {
  const session = await createSession();
  try {
    await cdp(session, 'Emulation.setDeviceMetricsOverride', {
      width, height, screenWidth: width, screenHeight: height,
      deviceScaleFactor: 1, mobile, positionX: 0, positionY: 0, dontSetVisibleSize: false,
    });
    await cdp(session, 'Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 });
    await webdriver(`/session/${session}/url`, {
      method: 'POST', body: JSON.stringify({ url: `${BASE_URL}?seed=2&seat=0` }),
    });

    await driveToTransfer(session, label);
    await waitFor(`${label}: three material cards`, async () => (await inspectTransfer(session)).visibleTransferCards === 3, 500);
    await sleep(90);
    const flight = await inspectTransfer(session);
    if (flight.state !== 'active') throw new Error(`${label}: transfer state is not active ${JSON.stringify(flight)}`);
    if (flight.transferCards.length !== 3 || flight.visibleTransferCards !== 3) throw new Error(`${label}: expected three visible transfer cards ${JSON.stringify(flight)}`);
    if (flight.sourceCards !== 3 || flight.hiddenSourceCards !== 3) throw new Error(`${label}: source talon duplicates remain visible ${JSON.stringify(flight)}`);
    if (flight.materialSlots.length !== 3 || flight.hiddenMaterialTargets !== 3) throw new Error(`${label}: canonical hand targets are not hidden during transfer ${JSON.stringify(flight)}`);
    if (new Set(flight.transferCards).size !== 3 || flight.transferCards.some((card) => !flight.materialSlots.includes(card))) {
      throw new Error(`${label}: transfer identities do not match exact hand targets ${JSON.stringify(flight)}`);
    }
    if (flight.enabledHandCards !== 0 || flight.decisionHeading === 'Oddaj po jednej karcie') {
      throw new Error(`${label}: exchange input became active before ownership materialized ${JSON.stringify(flight)}`);
    }
    await screenshot(session, `${label}-talon-transfer-flight`);

    const settled = await waitFor(`${label}: transfer settled`, async () => {
      const state = await inspectSettled(session);
      return state.state === 'settled'
        && state.transferCards === 0
        && state.materialSlots === 0
        && state.handCards === 10
        && state.enabledHandCards === 10
        && state.decisionHeading === 'Oddaj po jednej karcie'
        && state.talonDisplay === 'none'
        ? state
        : false;
    }, 3_000);
    if (settled.scrollWidth > settled.width + 1) throw new Error(`${label}: transfer introduced horizontal overflow ${JSON.stringify(settled)}`);
    await screenshot(session, `${label}-talon-transfer-settled`);

    return { label, flight, settled };
  } finally {
    await closeSession(session);
  }
}

await mkdir(OUTPUT, { recursive: true });
const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4197']);
const driver = startProcess('chromedriver', ['--port=9537']);

try {
  await waitFor('Vite talon transfer server', async () => (await fetch(BASE_URL).catch(() => null))?.ok);
  await waitFor('ChromeDriver', async () => (await fetch(`${WEBDRIVER}/status`).catch(() => null))?.ok);
  const desktop = await runViewport('desktop', 1440, 1000, false);
  const mobile = await runViewport('mobile', 390, 844, true);
  console.log('talon transfer browser smoke: PASS');
  console.log(JSON.stringify({ desktop, mobile }, null, 2));
} catch (error) {
  console.error('talon transfer browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  stopProcess(driver.child);
  stopProcess(vite.child);
}
