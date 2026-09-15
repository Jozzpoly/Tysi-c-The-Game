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
  return value.sessionId ?? value.sessionId;
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

async function navigate(session, url) {
  await webdriver(`/session/${session}/url`, { method: 'POST', body: JSON.stringify({ url }) });
}

async function closeSession(session) {
  if (!session) return;
  try { await webdriver(`/session/${session}`, { method: 'DELETE' }); } catch {}
}

async function screenshot(session, name) {
  const base64 = await webdriver(`/session/${session}/screenshot`);
  await writeFile(`${OUTPUT}/${name}.png`, Buffer.from(base64, 'base64'));
}

async function clickButton(session, text) {
  const clicked = await execute(session, `
    const button = [...document.querySelectorAll('button')].find((node) => node.textContent?.trim() === ${JSON.stringify(text)} && !node.disabled);
    if (!button) return false;
    button.click();
    return true;
  `);
  if (!clicked) throw new Error(`enabled button not found: ${text}`);
}

async function inspect(session) {
  return execute(session, `
    const hand = document.querySelector('.hand');
    const materialHandCards = [...document.querySelectorAll('.hand-slot.is-deal-materializing > .card')];
    const materialOpponentBacks = [...document.querySelectorAll('.is-deal-receiving .card-backs i')];
    const dealerAnchor = [...document.querySelectorAll('[data-seat-anchor]')]
      .find((node) => node.textContent?.includes('rozdaje'));
    return {
      width: document.documentElement.clientWidth,
      innerWidth: window.innerWidth,
      visualWidth: window.visualViewport?.width ?? null,
      scrollWidth: document.documentElement.scrollWidth,
      handCards: document.querySelectorAll('.hand .card').length,
      handClientWidth: hand?.clientWidth ?? 0,
      handScrollWidth: hand?.scrollWidth ?? 0,
      heading: document.querySelector('.topbar h1')?.textContent?.trim() ?? '',
      decision: document.querySelector('.decision-card')?.innerText ?? '',
      body: document.body?.innerText ?? '',
      dealerSeat: dealerAnchor?.getAttribute('data-seat-anchor') ?? null,
      scores: [...document.querySelectorAll('.seat-score, .hand-score strong')].map((node) => node.textContent?.trim() ?? ''),
      message: document.querySelector('.message')?.textContent?.trim() ?? '',
      enabledDecisionButtons: document.querySelectorAll('.decision-card button:not(:disabled)').length,
      dealState: document.querySelector('.material-deal-state')?.getAttribute('data-deal-material-state') ?? 'missing',
      dealEvent: document.querySelector('.material-deal-state')?.getAttribute('data-deal-material-event') ?? '',
      dealTransfers: document.querySelectorAll('.deal-transfer-card').length,
      dealFaces: document.querySelectorAll('.deal-transfer-card.is-face').length,
      dealBacks: document.querySelectorAll('.deal-transfer-card.is-back').length,
      hiddenDealHandCards: materialHandCards.filter((node) => getComputedStyle(node).visibility === 'hidden').length,
      hiddenDealOpponentBacks: materialOpponentBacks.filter((node) => getComputedStyle(node).visibility === 'hidden').length,
    };
  `);
}

function assertViewport(label, layout, expectedWidth) {
  if (layout.width !== expectedWidth || layout.innerWidth !== expectedWidth || Math.round(layout.visualWidth ?? -1) !== expectedWidth) {
    throw new Error(`${label}: viewport mismatch document=${layout.width} inner=${layout.innerWidth} visual=${layout.visualWidth}`);
  }
  if (layout.scrollWidth > layout.width + 1) throw new Error(`${label}: horizontal page overflow ${layout.scrollWidth} > ${layout.width}`);
  if (layout.handScrollWidth > layout.handClientWidth + 1) throw new Error(`${label}: horizontal hand overflow ${layout.handScrollWidth} > ${layout.handClientWidth}`);
}

async function openFixture(width, height, mobile, seat) {
  const session = await createSession();
  await emulateViewport(session, width, height, mobile);
  await navigate(session, `${BASE_URL}/test/browser-fixtures/four-nines.html?seat=${seat}`);
  return session;
}

async function runEligible(label, width, height, mobile) {
  let session;
  try {
    session = await openFixture(width, height, mobile, 1);
    await waitFor(`${label}: eligible decision`, async () => (await inspect(session)).decision.includes('Masz cztery dziewiątki'));
    const option = await inspect(session);
    assertViewport(`${label}: option`, option, width);
    if (option.handCards !== 8) throw new Error(`${label}: expected 8 cards at redeal option, got ${option.handCards}`);
    if (!option.decision.includes('Rozdaj ponownie') || !option.decision.includes('Graj dalej')) throw new Error(`${label}: missing redeal choices`);
    const initialDealer = option.dealerSeat;
    if (initialDealer === null) throw new Error(`${label}: dealer marker missing before redeal`);
    await screenshot(session, `${label}-four-nines-option`);

    await clickButton(session, 'Graj dalej');
    await waitFor(`${label}: continue`, async () => (await inspect(session)).heading === 'Deklaracja gry');
    const continued = await inspect(session);
    assertViewport(`${label}: continued`, continued, width);
    if (continued.body.includes('Masz cztery dziewiątki') || continued.body.includes('Rozdaj ponownie')) throw new Error(`${label}: four-nines choice persisted after continue`);
    if (continued.handCards !== 8) throw new Error(`${label}: continue changed hand size`);
    if (continued.dealTransfers !== 0 || continued.dealState !== 'missing') throw new Error(`${label}: continue falsely materialized a redeal`);
    await screenshot(session, `${label}-four-nines-continued`);

    await navigate(session, `${BASE_URL}/test/browser-fixtures/four-nines.html?seat=1`);
    await waitFor(`${label}: option after reload`, async () => (await inspect(session)).decision.includes('Masz cztery dziewiątki'));
    await clickButton(session, 'Rozdaj ponownie');

    await waitFor(`${label}: material redeal active`, async () => (await inspect(session)).dealState === 'active', 1_500);
    await waitFor(`${label}: 21 material redeal cards`, async () => (await inspect(session)).dealTransfers === 21, 750);
    const redealFlight = await inspect(session);
    assertViewport(`${label}: redeal flight`, redealFlight, width);
    if (redealFlight.dealEvent !== 'four-nines-redeal' || redealFlight.dealFaces !== 7 || redealFlight.dealBacks !== 14) {
      throw new Error(`${label}: four-nines redeal did not use canonical material deal ${JSON.stringify(redealFlight)}`);
    }
    if (redealFlight.hiddenDealHandCards !== 7 || redealFlight.hiddenDealOpponentBacks !== 14) {
      throw new Error(`${label}: canonical redeal targets became visible before landing ${JSON.stringify(redealFlight)}`);
    }
    if (redealFlight.enabledDecisionButtons !== 0 || redealFlight.handCards !== 7 || redealFlight.heading !== 'Licytacja') {
      throw new Error(`${label}: redeal presentation/input contract broken ${JSON.stringify(redealFlight)}`);
    }
    await screenshot(session, `${label}-four-nines-redeal-flight`);

    const redealt = await waitFor(`${label}: material redeal settled`, async () => {
      const state = await inspect(session);
      return state.dealState === 'settled' && state.dealTransfers === 0 && state.handCards === 7 ? state : false;
    }, 2_500);
    assertViewport(`${label}: redealt`, redealt, width);
    if (redealt.dealerSeat !== initialDealer) throw new Error(`${label}: redeal rotated dealer ${initialDealer} -> ${redealt.dealerSeat}`);
    if (redealt.scores.some((score) => score !== '0')) throw new Error(`${label}: redeal changed score ${JSON.stringify(redealt.scores)}`);
    if (!redealt.message.toLowerCase().includes('ponowne rozdanie')) throw new Error(`${label}: redeal feedback missing`);
    await screenshot(session, `${label}-four-nines-redealt`);

    return { option, continued, redealFlight, redealt };
  } finally {
    await closeSession(session);
  }
}

async function runNonEligible(label, width, height, mobile) {
  let session;
  try {
    session = await openFixture(width, height, mobile, 0);
    await waitFor(`${label}: masked phase`, async () => (await inspect(session)).heading === 'Deklaracja gry');
    const view = await inspect(session);
    assertViewport(`${label}: noneligible`, view, width);
    for (const secret of ['Cztery dziewiątki', 'Masz cztery dziewiątki', 'Rozdaj ponownie', 'Graj dalej']) {
      if (view.body.includes(secret)) throw new Error(`${label}: hidden four-nines option leaked through UI: ${secret}`);
    }
    if (view.handCards !== 8) throw new Error(`${label}: noneligible seat expected 8 cards`);
    if (view.dealTransfers !== 0 || view.dealState !== 'missing') throw new Error(`${label}: hidden option created material side channel`);
    await screenshot(session, `${label}-four-nines-noneligible`);
    return view;
  } finally {
    await closeSession(session);
  }
}

await mkdir(OUTPUT, { recursive: true });
const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173']);
const driver = startProcess('chromedriver', ['--port=9515']);

try {
  await waitFor('Vite fixture server', async () => {
    const response = await fetch(`${BASE_URL}/test/browser-fixtures/four-nines.html`).catch(() => null);
    return response?.ok;
  });
  await waitFor('ChromeDriver', async () => {
    const response = await fetch(`${WEBDRIVER}/status`).catch(() => null);
    return response?.ok;
  });

  const evidence = {
    desktop: {
      eligible: await runEligible('desktop', 1440, 1000, false),
      noneligible: await runNonEligible('desktop', 1440, 1000, false),
    },
    mobile: {
      eligible: await runEligible('mobile', 390, 844, true),
      noneligible: await runNonEligible('mobile', 390, 844, true),
    },
  };
  console.log('four-nines browser smoke: PASS');
  console.log(JSON.stringify(evidence, null, 2));
} catch (error) {
  console.error('four-nines browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  stopProcess(driver.child);
  stopProcess(vite.child);
}
