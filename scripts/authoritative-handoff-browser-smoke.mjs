import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4194';
const WEBDRIVER = 'http://127.0.0.1:9534';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(label, probe, timeoutMs = 12_000) {
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
  const capture = (chunk) => { output = `${output}${chunk.toString()}`.slice(-14_000); };
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

async function touch(session, type, points) {
  await cdp(session, 'Input.dispatchTouchEvent', { type, touchPoints: points });
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

async function revision(session) {
  return execute(session, `
    const text = [...document.querySelectorAll('.footer span')]
      .map((node) => node.textContent?.trim() ?? '')
      .find((value) => /^rev \\d+$/.test(value));
    return text ? Number(text.slice(4)) : null;
  `);
}

async function installTrace(session, card) {
  await execute(session, `
    window.__handoffCard = ${JSON.stringify(card)};
    window.__handoffTrace = [];
    window.__handoffTraceStop = false;
    let lastSignature = '';
    const visible = (node) => {
      if (!node) return false;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > .05
        && rect.width > 1 && rect.height > 1;
    };
    const sample = () => {
      const id = window.__handoffCard;
      const ghost = document.querySelector('.tactile-card-float.pending-handoff[data-card-id="' + id + '"]');
      const target = document.querySelector('.played-self[data-card="' + id + '"]');
      const source = document.querySelector('.hand-slot[data-card="' + id + '"]');
      const state = {
        t: performance.now(),
        ghost: Boolean(ghost),
        ghostVisible: visible(ghost),
        authority: ghost?.dataset.authorityState ?? '',
        source: Boolean(source),
        awaiting: source?.classList.contains('is-awaiting-authority') ?? false,
        target: Boolean(target),
        targetVisible: visible(target),
        targetFresh: target?.classList.contains('is-fresh-arrival') ?? false,
        targetHandoff: target?.classList.contains('is-local-handoff-target') ?? false,
        targetComplete: target?.classList.contains('is-local-handoff-complete') ?? false,
      };
      const signature = JSON.stringify({ ...state, t: 0 });
      if (signature !== lastSignature) {
        lastSignature = signature;
        window.__handoffTrace.push(state);
      }
      if (!window.__handoffTraceStop) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  `);
}

async function runViewport(label, width, height, mobile) {
  const session = await createSession();
  try {
    await cdp(session, 'Emulation.setDeviceMetricsOverride', {
      width, height, screenWidth: width, screenHeight: height,
      deviceScaleFactor: 1, mobile, positionX: 0, positionY: 0, dontSetVisibleSize: false,
    });
    // Use the same physical touch throw on both layouts. The desktop half proves
    // desktop geometry; the mobile half proves the coarse-pointer presentation.
    await cdp(session, 'Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await webdriver(`/session/${session}/url`, {
      method: 'POST', body: JSON.stringify({ url: `${BASE_URL}?seed=1&seat=0` }),
    });

    await waitFor(`${label}: auction`, () => execute(session, `
      return document.querySelector('.decision-card h2')?.textContent?.trim() === 'Twoja licytacja';
    `));
    await clickButtonStartingWith(session, 'Pas');

    const playable = await waitFor(`${label}: legal throw`, () => execute(session, `
      if (document.querySelector('.decision-card h2')?.textContent?.trim() !== 'Twój ruch') return null;
      const slot = document.querySelector('.hand-slot.is-throwable');
      const card = slot?.querySelector(':scope > .card');
      if (!slot || !card) return null;
      const rect = card.getBoundingClientRect();
      return {
        card: slot.dataset.card ?? '',
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height,
      };
    `), 25_000);
    if (!playable.card) throw new Error(`${label}: throwable card has no CardId`);

    const beforeRevision = await revision(session);
    await installTrace(session, playable.card);

    const distance = Math.max(126, playable.height * 1.05);
    const end = { x: playable.x, y: Math.max(42, playable.y - distance) };
    await touch(session, 'touchStart', [{ x: playable.x, y: playable.y, radiusX: 7, radiusY: 7, force: 1 }]);
    await sleep(30);
    for (let step = 1; step <= 8; step += 1) {
      const ratio = step / 8;
      await touch(session, 'touchMove', [{
        x: playable.x,
        y: playable.y + (end.y - playable.y) * ratio,
        radiusX: 7, radiusY: 7, force: 1,
      }]);
      await sleep(24);
    }

    const armed = await waitFor(`${label}: throw armed`, () => execute(session, `
      const ghost = document.querySelector('.tactile-card-float.commit-ready');
      return ghost?.dataset.cardId === ${JSON.stringify(playable.card)};
    `), 2_000);
    if (!armed) throw new Error(`${label}: legal throw never became commit-ready`);

    await touch(session, 'touchEnd', []);

    const final = await waitFor(`${label}: authoritative handoff completion`, () => execute(session, `
      const id = ${JSON.stringify(playable.card)};
      const target = document.querySelector('.played-self[data-card="' + id + '"]');
      const ghost = document.querySelector('.tactile-card-float.pending-handoff[data-card-id="' + id + '"]');
      if (!target?.classList.contains('is-local-handoff-complete') || ghost) return null;
      return {
        targetCard: target.dataset.card ?? '',
        targetVisible: Number(getComputedStyle(target).opacity) > .05,
        sourceStillInHand: Boolean(document.querySelector('.hand-slot[data-card="' + id + '"]')),
      };
    `), 5_000);

    await sleep(40);
    const afterRevision = await revision(session);
    const trace = await execute(session, `window.__handoffTraceStop = true; return window.__handoffTrace ?? [];`);

    if (final.targetCard !== playable.card || !final.targetVisible || final.sourceStillInHand) {
      throw new Error(`${label}: authority ended on wrong physical representation ${JSON.stringify({ playable, final })}`);
    }
    if (!(Number.isInteger(beforeRevision) && Number.isInteger(afterRevision) && afterRevision > beforeRevision)) {
      throw new Error(`${label}: canonical revision did not advance ${beforeRevision} -> ${afterRevision}`);
    }

    const ghostObserved = trace.some((entry) => entry.ghost && entry.ghostVisible);
    const authorityObserved = trace.some((entry) => entry.authority === 'handoff');
    const hiddenTargetObserved = trace.some((entry) => entry.targetHandoff && !entry.targetVisible && entry.ghostVisible);
    const completionObserved = trace.some((entry) => entry.targetComplete && entry.targetVisible && !entry.ghost);
    const duplicatedVisibleCard = trace.find((entry) => entry.ghostVisible && entry.targetVisible && entry.targetHandoff);

    if (!ghostObserved || !authorityObserved || !hiddenTargetObserved || !completionObserved) {
      throw new Error(`${label}: incomplete handoff evidence ${JSON.stringify({
        ghostObserved, authorityObserved, hiddenTargetObserved, completionObserved, trace,
      })}`);
    }
    if (duplicatedVisibleCard) {
      throw new Error(`${label}: local ghost and authoritative target were simultaneously visible ${JSON.stringify(duplicatedVisibleCard)}`);
    }

    return {
      label,
      card: playable.card,
      revision: `${beforeRevision}->${afterRevision}`,
      ghostObserved,
      authorityObserved,
      targetHiddenDuringBridge: hiddenTargetObserved,
      singleVisibleRepresentation: !duplicatedVisibleCard,
      authoritativeCompletion: completionObserved,
      trace,
    };
  } finally {
    try { await webdriver(`/session/${session}`, { method: 'DELETE' }); } catch {}
  }
}

const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4194']);
const driver = startProcess('chromedriver', ['--port=9534']);

try {
  await waitFor('Vite authoritative-handoff server', async () => (await fetch(BASE_URL).catch(() => null))?.ok);
  await waitFor('ChromeDriver', async () => (await fetch(`${WEBDRIVER}/status`).catch(() => null))?.ok);
  const desktop = await runViewport('desktop', 1440, 1000, false);
  const mobile = await runViewport('mobile', 390, 844, true);
  console.log('authoritative handoff browser smoke: PASS');
  console.log(JSON.stringify({ desktop, mobile }, null, 2));
} catch (error) {
  console.error('authoritative handoff browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  stopProcess(driver.child);
  stopProcess(vite.child);
}
