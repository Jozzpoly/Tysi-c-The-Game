import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4192';
const WEBDRIVER = 'http://127.0.0.1:9532';
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
    await sleep(20);
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError}` : ''}`);
}

function startProcess(command, args) {
  const child = spawn(command, args, { detached: true, stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
  let output = '';
  const capture = (chunk) => { output = `${output}${chunk.toString()}`.slice(-18_000); };
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
  if (!response.ok || body?.value?.error) throw new Error(JSON.stringify(body));
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

async function emulateViewport(session, width, height, mobile) {
  await cdp(session, 'Emulation.setDeviceMetricsOverride', {
    width, height, screenWidth: width, screenHeight: height,
    deviceScaleFactor: 1, mobile, positionX: 0, positionY: 0, dontSetVisibleSize: false,
  });
  await cdp(session, 'Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 });
}

async function screenshot(session, name) {
  const base64 = await webdriver(`/session/${session}/screenshot`);
  await writeFile(`${OUTPUT}/${name}.png`, Buffer.from(base64, 'base64'));
}

async function clickButtonStartingWith(session, text) {
  const clicked = await execute(session, `
    const button = [...document.querySelectorAll('button')]
      .find((node) => node.textContent?.trim().startsWith(${JSON.stringify(text)}) && !node.disabled);
    if (!button) return false;
    button.click();
    return true;
  `);
  if (!clicked) throw new Error(`enabled button starting with ${text} not found`);
}

async function clickFirstPlayableCard(session) {
  const clicked = await execute(session, `
    const card = document.querySelector('.hand .card:not(:disabled)');
    if (!card) return false;
    card.click();
    return true;
  `);
  if (!clicked) throw new Error('playable hand card not found');
}

async function installLifecycleTrace(session) {
  await execute(session, `
    window.__livingTrickTrace = [];
    let lastSignature = '';
    const sample = () => {
      const trick = document.querySelector('.trick');
      if (!trick) return;
      const played = [...trick.querySelectorAll('.played')].map((node) => ({
        seat: node.dataset.seat ?? '',
        card: node.dataset.card ?? '',
        fresh: node.classList.contains('is-fresh-arrival'),
        winner: node.classList.contains('is-trick-winner'),
      }));
      const semantic = {
        kind: trick.dataset.presentationKind ?? '',
        stage: trick.dataset.trickStage ?? '',
        freshPlay: trick.dataset.freshPlay ?? '',
        winnerSeat: trick.dataset.winnerSeat ?? '',
        winnerPosition: trick.dataset.winnerPosition ?? '',
        played,
        result: document.querySelector('.trick-result')?.textContent?.trim() ?? '',
        capture: document.querySelector('.capture-pulse')?.textContent?.trim() ?? '',
        enabledActions: document.querySelectorAll('.decision-card button:not(:disabled), .hand .card:not(:disabled)').length,
      };
      const signature = JSON.stringify(semantic);
      if (signature !== lastSignature) {
        lastSignature = signature;
        window.__livingTrickTrace.push({ t: performance.now(), ...semantic });
      }
    };
    const observer = new MutationObserver(sample);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true });
    window.__livingTrickObserver = observer;
    sample();
  `);
}

async function trace(session) {
  return execute(session, `return window.__livingTrickTrace ?? [];`);
}

async function stageState(session, stage) {
  return execute(session, `
    const trick = document.querySelector('.trick');
    if (trick?.dataset.presentationKind !== 'trick-completion' || trick.dataset.trickStage !== ${JSON.stringify(stage)}) return null;
    return {
      stage: trick.dataset.trickStage,
      freshPlay: trick.dataset.freshPlay ?? '',
      winnerSeat: trick.dataset.winnerSeat ?? '',
      winnerPosition: trick.dataset.winnerPosition ?? '',
      played: [...trick.querySelectorAll('.played')].map((node) => ({
        seat: node.dataset.seat ?? '', card: node.dataset.card ?? '',
        fresh: node.classList.contains('is-fresh-arrival'),
        winner: node.classList.contains('is-trick-winner'),
      })),
      result: document.querySelector('.trick-result')?.textContent?.trim() ?? '',
      capture: document.querySelector('.capture-pulse')?.textContent?.trim() ?? '',
      enabledActions: document.querySelectorAll('.decision-card button:not(:disabled), .hand .card:not(:disabled)').length,
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    };
  `);
}

async function runViewport(label, width, height, mobile) {
  const session = await createSession();
  try {
    await emulateViewport(session, width, height, mobile);
    await webdriver(`/session/${session}/url`, {
      method: 'POST', body: JSON.stringify({ url: `${BASE_URL}?seed=1&seat=0` }),
    });
    await waitFor(`${label}: auction`, () => execute(session, `return document.querySelector('.decision-card h2')?.textContent?.trim() === 'Twoja licytacja';`));
    await clickButtonStartingWith(session, 'Pas');
    await waitFor(`${label}: first human trick action`, () => execute(session, `
      return document.querySelector('.decision-card h2')?.textContent?.trim() === 'Twój ruch'
        && document.querySelector('.hand .card:not(:disabled)') !== null;
    `), 25_000);

    await installLifecycleTrace(session);
    await clickFirstPlayableCard(session);

    const resolve = await waitFor(`${label}: resolve`, () => stageState(session, 'resolve'), 8_000);
    if (resolve.played.length !== 3) throw new Error(`${label}: resolve has ${resolve.played.length} cards`);
    if (!resolve.freshPlay || resolve.played.filter((play) => play.fresh).length !== 1) {
      throw new Error(`${label}: fresh authoritative arrival is ambiguous: ${JSON.stringify(resolve)}`);
    }
    if (!resolve.winnerSeat || resolve.played.filter((play) => play.winner).length !== 1) {
      throw new Error(`${label}: authoritative winner is ambiguous: ${JSON.stringify(resolve)}`);
    }
    if (resolve.enabledActions !== 0) throw new Error(`${label}: input active during resolve`);

    const collect = await waitFor(`${label}: collect`, () => stageState(session, 'collect'), 3_000);
    if (collect.played.length !== 3 || collect.enabledActions !== 0) throw new Error(`${label}: invalid collect state ${JSON.stringify(collect)}`);
    await screenshot(session, `${label}-living-trick-collect`);

    const consequence = await waitFor(`${label}: consequence`, () => stageState(session, 'consequence'), 3_000);
    if (!consequence.capture.includes('pkt')) throw new Error(`${label}: point consequence did not attach to winner: ${JSON.stringify(consequence)}`);
    if (consequence.enabledActions !== 0) throw new Error(`${label}: input active during consequence`);
    await screenshot(session, `${label}-living-trick-consequence`);

    // Settled is intentionally brief: the next actor may start shortly after the
    // completion frame drains. Observe it in-page through MutationObserver rather
    // than requiring a slower WebDriver round trip to land inside that window.
    const settled = await waitFor(`${label}: settled trace`, async () => {
      const entries = await trace(session);
      return entries.find((entry) => entry.kind === 'trick-completion' && entry.stage === 'settled') ?? false;
    }, 3_000);
    if (settled.played.length !== 0 || settled.result !== '' || settled.capture !== '') {
      throw new Error(`${label}: completed trick leaked after settle: ${JSON.stringify(settled)}`);
    }

    const layout = await execute(session, `return {
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    };`);
    if (layout.scrollWidth > layout.width + 1) throw new Error(`${label}: horizontal overflow after settle`);

    const lifecycleTrace = await trace(session);
    const completionEntries = lifecycleTrace.filter((entry) => entry.kind === 'trick-completion');
    const stages = completionEntries.map((entry) => entry.stage);
    for (const required of ['arrival', 'resolve', 'collect', 'consequence', 'settled']) {
      if (!stages.includes(required)) throw new Error(`${label}: missing ${required} in lifecycle trace ${JSON.stringify(stages)}`);
    }
    const firstIndex = (stage) => stages.indexOf(stage);
    if (!(firstIndex('arrival') < firstIndex('resolve')
      && firstIndex('resolve') < firstIndex('collect')
      && firstIndex('collect') < firstIndex('consequence')
      && firstIndex('consequence') < firstIndex('settled'))) {
      throw new Error(`${label}: lifecycle out of order ${JSON.stringify(stages)}`);
    }

    return {
      label,
      freshPlay: resolve.freshPlay,
      winnerSeat: resolve.winnerSeat,
      winnerPosition: resolve.winnerPosition,
      result: resolve.result,
      capture: consequence.capture,
      stages,
    };
  } finally {
    try { await webdriver(`/session/${session}`, { method: 'DELETE' }); } catch {}
  }
}

await mkdir(OUTPUT, { recursive: true });
const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4192']);
const driver = startProcess('chromedriver', ['--port=9532']);

try {
  await waitFor('Vite living trick server', async () => (await fetch(BASE_URL).catch(() => null))?.ok);
  await waitFor('ChromeDriver', async () => (await fetch(`${WEBDRIVER}/status`).catch(() => null))?.ok);
  const desktop = await runViewport('desktop', 1440, 1000, false);
  const mobile = await runViewport('mobile', 390, 844, true);
  console.log('living trick browser smoke: PASS');
  console.log(JSON.stringify({ desktop, mobile }, null, 2));
} catch (error) {
  console.error('living trick browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  stopProcess(driver.child);
  stopProcess(vite.child);
}
