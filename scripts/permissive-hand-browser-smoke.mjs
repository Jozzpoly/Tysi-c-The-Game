import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4186';
const WEBDRIVER = 'http://127.0.0.1:9528';
const OUTPUT = 'artifacts/browser';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(label, probe, timeoutMs = 12_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await probe().catch(() => false);
    if (value) return value;
    await sleep(60);
  }
  throw new Error(`${label} timed out`);
}

function startProcess(command, args) {
  const child = spawn(command, args, { detached: true, stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
  let output = '';
  const capture = (chunk) => { output = `${output}${chunk.toString()}`.slice(-12_000); };
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
            args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--window-size=390,844'],
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

async function drag(session, from, to, { hold = false, steps = 7 } = {}) {
  await touch(session, 'touchStart', [{ x: from.x, y: from.y, radiusX: 7, radiusY: 7, force: 1 }]);
  await sleep(35);
  for (let step = 1; step <= steps; step += 1) {
    const ratio = step / steps;
    await touch(session, 'touchMove', [{
      x: from.x + (to.x - from.x) * ratio,
      y: from.y + (to.y - from.y) * ratio,
      radiusX: 7, radiusY: 7, force: 1,
    }]);
    await sleep(25);
  }
  if (!hold) await touch(session, 'touchEnd', []);
}

async function handState(session) {
  return execute(session, `
    const revText = [...document.querySelectorAll('.footer span')]
      .map((node) => node.textContent?.trim() ?? '')
      .find((text) => /^rev \\d+$/.test(text));
    const cards = [...document.querySelectorAll('.hand > .hand-slot')].map((slot, index) => {
      const card = slot.querySelector(':scope > .card');
      const rect = card.getBoundingClientRect();
      const style = getComputedStyle(card);
      return {
        index,
        label: card.getAttribute('aria-label'),
        disabled: card.disabled,
        actionable: slot.dataset.actionable,
        throwable: slot.dataset.throwable,
        opacity: style.opacity,
        filter: style.filter,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height,
      };
    });
    return {
      revision: revText ? Number(revText.slice(4)) : null,
      heading: document.querySelector('.decision-card h2')?.textContent?.trim() ?? '',
      cards,
    };
  `);
}

async function screenshot(session, name) {
  const base64 = await webdriver(`/session/${session}/screenshot`);
  await writeFile(`${OUTPUT}/${name}.png`, Buffer.from(base64, 'base64'));
}

async function run() {
  const session = await createSession();
  try {
    await cdp(session, 'Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, screenWidth: 390, screenHeight: 844,
      deviceScaleFactor: 1, mobile: true, positionX: 0, positionY: 0, dontSetVisibleSize: false,
    });
    await cdp(session, 'Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await webdriver(`/session/${session}/url`, {
      method: 'POST', body: JSON.stringify({ url: `${BASE_URL}?seed=2&seat=0` }),
    });

    const initial = await waitFor('opening auction', async () => {
      const state = await handState(session);
      return state.heading === 'Twoja licytacja' && state.cards.length === 7 ? state : false;
    });

    if (!initial.cards.every((card) => card.disabled && card.actionable === 'false' && card.throwable === 'false')) {
      throw new Error(`expected technically non-actionable opening hand: ${JSON.stringify(initial.cards)}`);
    }
    if (!initial.cards.every((card) => card.opacity === '1' && card.filter === 'none')) {
      throw new Error(`non-actionable cards are visually diminished: ${JSON.stringify(initial.cards)}`);
    }

    // Owner visual contract: an unavailable card may be dimmed, but it remains
    // a fully opaque/material card. Probe the unavailable presentation state
    // directly without changing game truth.
    const unavailableProbe = await execute(session, `
      const slot = document.querySelector('.hand > .hand-slot');
      const card = slot?.querySelector(':scope > .card');
      if (!slot || !card) return null;
      slot.classList.add('is-unavailable');
      const style = getComputedStyle(card);
      const result = { opacity: style.opacity, filter: style.filter };
      slot.classList.remove('is-unavailable');
      return result;
    `);
    if (!unavailableProbe || unavailableProbe.opacity !== '1') {
      throw new Error(`unavailable card lost material opacity: ${JSON.stringify(unavailableProbe)}`);
    }
    if (unavailableProbe.filter === 'none') {
      throw new Error(`unavailable card lost its non-alpha dimming cue: ${JSON.stringify(unavailableProbe)}`);
    }

    const playCard = initial.cards[1];
    const freeThrowTarget = { x: playCard.x + 14, y: Math.max(28, playCard.y - 104) };
    await drag(session, { x: playCard.x, y: playCard.y }, freeThrowTarget, { hold: true });

    const freeThrow = await waitFor('free held card body', () => execute(session, `
      const card = document.querySelector('.tactile-card-float[data-gesture-phase="held"]');
      if (!card) return false;
      const rect = card.getBoundingClientRect();
      const style = getComputedStyle(card);
      return {
        position: style.position,
        left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom,
        width: rect.width, height: rect.height,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
        hasFalseTableIntent: card.classList.contains('throw-intent'),
        hasPositiveCommitZone: Boolean(document.querySelector('.tactile-commit-zone')),
      };
    `), 2_000);

    if (freeThrow.position !== 'fixed'
      || freeThrow.width < 40 || freeThrow.height < 60
      || freeThrow.right <= 0 || freeThrow.bottom <= 0
      || freeThrow.left >= 390 || freeThrow.top >= 844) {
      throw new Error(`non-action card is not physically present during free drag: ${JSON.stringify(freeThrow)}`);
    }
    if (freeThrow.hasFalseTableIntent || freeThrow.hasPositiveCommitZone) {
      throw new Error(`non-action card incorrectly received table-action intent: ${JSON.stringify(freeThrow)}`);
    }

    const fingerPeekPx = freeThrowTarget.y - freeThrow.centerY;
    if (fingerPeekPx < 9 || fingerPeekPx > 32) {
      throw new Error(`mobile held card is not visibly revealed above finger: ${JSON.stringify({ fingerPeekPx, freeThrowTarget, freeThrow })}`);
    }

    await screenshot(session, 'mobile-permissive-free-throw');
    await touch(session, 'touchEnd', []);
    await sleep(120);

    const afterFreeThrow = await handState(session);
    if (afterFreeThrow.revision !== initial.revision || afterFreeThrow.cards.length !== initial.cards.length) {
      throw new Error(`free play changed game truth: ${initial.revision}/${initial.cards.length} -> ${afterFreeThrow.revision}/${afterFreeThrow.cards.length}`);
    }

    const draggedLabel = afterFreeThrow.cards[0].label;
    await drag(
      session,
      { x: afterFreeThrow.cards[0].x, y: afterFreeThrow.cards[0].y },
      { x: afterFreeThrow.cards[4].x, y: afterFreeThrow.cards[4].y },
    );

    const reordered = await waitFor('free reorder', async () => {
      const state = await handState(session);
      const movedIndex = state.cards.findIndex((card) => card.label === draggedLabel);
      return movedIndex >= 2 ? { ...state, movedIndex } : false;
    }, 3_000);

    if (reordered.revision !== initial.revision) {
      throw new Error(`free reorder changed revision ${initial.revision} -> ${reordered.revision}`);
    }

    await screenshot(session, 'mobile-permissive-reordered');

    return {
      openingCards: initial.cards.length,
      openingCardsRemainFullStrength: true,
      freeDragVisible: true,
      freeDragHasNoFalseTableIntent: !freeThrow.hasFalseTableIntent,
      freeDragHasNoFalsePositiveActionCue: !freeThrow.hasPositiveCommitZone,
      fingerPeekPx,
      freeThrowRevision: `${initial.revision}->${afterFreeThrow.revision}`,
      reorderedCard: draggedLabel,
      reorderedToIndex: reordered.movedIndex,
      reorderRevision: `${initial.revision}->${reordered.revision}`,
    };
  } finally {
    try { await webdriver(`/session/${session}`, { method: 'DELETE' }); } catch {}
  }
}

await mkdir(OUTPUT, { recursive: true });
const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4186']);
const driver = startProcess('chromedriver', ['--port=9528']);

try {
  await waitFor('Vite permissive-hand server', async () => (await fetch(BASE_URL).catch(() => null))?.ok);
  await waitFor('ChromeDriver', async () => (await fetch(`${WEBDRIVER}/status`).catch(() => null))?.ok);
  const evidence = await run();
  console.log('permissive hand browser smoke: PASS');
  console.log(JSON.stringify(evidence, null, 2));
} catch (error) {
  console.error('permissive hand browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  stopProcess(driver.child);
  stopProcess(vite.child);
}
