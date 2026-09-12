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

async function createSession(width, height) {
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
              `--window-size=${width},${height}`,
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

async function clickButtonByText(session, text) {
  const clicked = await execute(session, `
    const button = [...document.querySelectorAll('button')].find((node) => node.textContent?.trim() === ${JSON.stringify(text)} && !node.disabled);
    if (!button) return false;
    button.click();
    return true;
  `);
  if (!clicked) throw new Error(`Enabled button ${text} not found`);
}

async function inspectLayout(session) {
  return execute(session, `return {
    title: document.title,
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    height: document.documentElement.clientHeight,
    scrollHeight: document.documentElement.scrollHeight,
    enabledHandCards: document.querySelectorAll('.hand .card:not(:disabled)').length,
    decision: document.querySelector('.decision-card')?.innerText ?? '',
    message: document.querySelector('.message')?.innerText ?? '',
  };`);
}

async function runViewport(label, width, height, playThroughTrick) {
  let session;
  try {
    session = await createSession(width, height);
    await navigate(session, BASE_URL);
    await waitForText(session, 'Twoja licytacja');

    const auctionLayout = await inspectLayout(session);
    if (auctionLayout.title !== 'Tysiąc The Game') throw new Error(`${label}: unexpected title ${auctionLayout.title}`);
    if (auctionLayout.scrollWidth > auctionLayout.width + 1) {
      throw new Error(`${label}: page overflows horizontally (${auctionLayout.scrollWidth} > ${auctionLayout.width})`);
    }
    await screenshot(session, `${label}-auction`);

    if (!playThroughTrick) return { auctionLayout };

    await clickButtonByText(session, 'Pas');
    await waitForText(session, 'Twój ruch', 20_000);
    const beforePlay = await inspectLayout(session);
    if (beforePlay.enabledHandCards < 1) throw new Error(`${label}: no playable human card`);
    await screenshot(session, `${label}-human-turn`);

    const clickedCard = await execute(session, `
      const card = document.querySelector('.hand .card:not(:disabled)');
      if (!card) return false;
      card.click();
      return true;
    `);
    if (!clickedCard) throw new Error(`${label}: could not click human card`);

    await waitFor(`${label}: completed trick`, () => execute(session, `return document.querySelector('.trick-result')?.textContent?.includes('Lewa 1:') ?? false;`), 5_000);
    const completed = await inspectLayout(session);
    await screenshot(session, `${label}-completed-trick`);
    return { auctionLayout, beforePlay, completed };
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

  const desktop = await runViewport('desktop', 1440, 1000, true);
  const mobile = await runViewport('mobile', 390, 844, false);
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
