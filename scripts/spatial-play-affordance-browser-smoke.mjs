import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4195';
const WEBDRIVER = 'http://127.0.0.1:9535';
const OUTPUT = 'artifacts/browser';
const MIN_TAKEOVER_PX = 18;
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

async function moveTouch(session, start, end, steps = 9) {
  for (let step = 1; step <= steps; step += 1) {
    const ratio = step / steps;
    await touch(session, 'touchMove', [{
      x: start.x + (end.x - start.x) * ratio,
      y: start.y + (end.y - start.y) * ratio,
      radiusX: 7,
      radiusY: 7,
      force: 1,
    }]);
    await sleep(24);
  }
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

async function screenshot(session, name) {
  const base64 = await webdriver(`/session/${session}/screenshot`);
  await writeFile(`${OUTPUT}/${name}.png`, Buffer.from(base64, 'base64'));
}

async function readPlayable(session) {
  return execute(session, `
    if (document.querySelector('.decision-card h2')?.textContent?.trim() !== 'Twój ruch') return null;
    const slot = document.querySelector('.hand-slot.is-throwable');
    const card = slot?.querySelector(':scope > .card');
    const trick = document.querySelector('.trick');
    if (!slot || !card || !trick) return null;
    const rect = card.getBoundingClientRect();
    const zone = trick.getBoundingClientRect();
    return {
      card: slot.dataset.card ?? '',
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      width: rect.width,
      height: rect.height,
      zone: {
        left: zone.left, right: zone.right, top: zone.top, bottom: zone.bottom,
        x: zone.left + zone.width / 2,
        y: zone.top + zone.height / 2,
      },
    };
  `);
}

async function affordanceState(session, card) {
  return execute(session, `
    const hand = document.querySelector('.tactile-hand');
    const ghost = document.querySelector('.tactile-card-float[data-card-id="${card}"]:not(.pending-handoff)');
    const trick = document.querySelector('.trick');
    const shell = document.querySelector('.app-shell');
    if (!hand || !ghost || !trick || !shell) return null;
    const surface = getComputedStyle(trick, '::before');
    const cue = getComputedStyle(trick, '::after');
    const legacy = document.querySelector('.tactile-commit-zone');
    const ownerX = Number.parseFloat(shell.style.getPropertyValue('--owner-card-magnet-x')) || 0;
    const ownerY = Number.parseFloat(shell.style.getPropertyValue('--owner-card-magnet-y')) || 0;
    return {
      phase: hand.dataset.gesturePhase ?? '',
      surfaceOpacity: Number(surface.opacity),
      cueOpacity: Number(cue.opacity),
      cueContent: cue.content,
      surfaceBorder: surface.borderColor,
      legacyDisplay: legacy ? getComputedStyle(legacy).display : 'missing',
      ghostReady: ghost.classList.contains('commit-ready'),
      magnetStrength: Number(ghost.dataset.magnetStrength ?? 0),
      magnetOffsetX: Number(ghost.dataset.magnetOffsetX ?? 0),
      magnetOffsetY: Number(ghost.dataset.magnetOffsetY ?? 0),
      acceptedSelectorMatches: Boolean(document.querySelector('.app-shell:has(.tactile-card-float.commit-ready:not(.pending-handoff))')),
      ownerMode: shell.getAttribute('data-owner-card-magnet-mode') ?? '',
      ownerTarget: shell.getAttribute('data-owner-card-magnet-target') ?? '',
      ownerMagnitude: Math.hypot(ownerX, ownerY),
      sourceStillInHand: Boolean(document.querySelector('.hand-slot[data-card="${card}"]')),
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
    await cdp(session, 'Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await webdriver(`/session/${session}/url`, {
      method: 'POST', body: JSON.stringify({ url: `${BASE_URL}?seed=1&seat=0` }),
    });

    await waitFor(`${label}: auction`, () => execute(session, `
      return document.querySelector('.decision-card h2')?.textContent?.trim() === 'Twoja licytacja';
    `));
    await clickButtonStartingWith(session, 'Pas');
    const playable = await waitFor(`${label}: legal card`, () => readPlayable(session), 25_000);

    const outside = {
      x: playable.zone.x,
      y: Math.max(18, playable.zone.top - Math.max(54, playable.height * .62)),
    };
    await touch(session, 'touchStart', [{ x: playable.x, y: playable.y, radiusX: 7, radiusY: 7, force: 1 }]);
    await sleep(30);
    await moveTouch(session, { x: playable.x, y: playable.y }, outside);

    const available = await waitFor(`${label}: available surface`, async () => {
      const state = await affordanceState(session, playable.card);
      return state?.phase === 'held' && !state.ghostReady && state.surfaceOpacity > .2 && state.cueOpacity > .1
        ? state
        : false;
    }, 2_000);
    if (available.legacyDisplay !== 'none' || !available.cueContent.toLowerCase().includes('zagraj')) {
      throw new Error(`${label}: available affordance still depends on legacy pill ${JSON.stringify(available)}`);
    }
    await screenshot(session, `${label}-spatial-play-available`);

    // The pointer/card centre remains outside the canonical `.trick` rectangle.
    // The bounded magnetic field must capture it before the strict geometry does.
    const magneticEdge = { x: playable.zone.x, y: playable.zone.top - 16 };
    await moveTouch(session, outside, magneticEdge);
    const acceptedGesture = await waitFor(`${label}: magnetic accepted gesture`, async () => {
      const state = await affordanceState(session, playable.card);
      return state?.phase === 'accepted'
        && state.ghostReady
        && state.magnetStrength > 0
        && state.magnetOffsetY > 0
        ? state
        : false;
    }, 2_000);

    if (magneticEdge.y >= playable.zone.top) {
      throw new Error(`${label}: magnetic probe accidentally entered canonical table geometry`);
    }

    // Gesture truth and presentation have different clocks. Wait for the rAF
    // bridge and short CSS surface transition, then require a visible takeover.
    const takeover = await waitFor(`${label}: table takeover`, async () => {
      const state = await affordanceState(session, playable.card);
      return state?.phase === 'accepted'
        && state.ghostReady
        && state.ownerMode === 'takeover'
        && state.ownerTarget === 'table'
        && state.ownerMagnitude >= ${MIN_TAKEOVER_PX}
        ? state
        : false;
    }, 2_000);
    await sleep(180);
    const accepted = await affordanceState(session, playable.card);
    if (!accepted
      || accepted.phase !== 'accepted'
      || !accepted.ghostReady
      || accepted.magnetStrength <= 0
      || accepted.magnetOffsetY <= 0
      || !accepted.acceptedSelectorMatches
      || accepted.ownerMode !== 'takeover'
      || accepted.ownerTarget !== 'table'
      || accepted.ownerMagnitude < ${MIN_TAKEOVER_PX}
      || accepted.surfaceOpacity < .75
      || accepted.cueOpacity < .65
      || !accepted.cueContent.toLowerCase().includes('puść')) {
      throw new Error(`${label}: magnetic accepted surface disagrees with gesture ${JSON.stringify({ acceptedGesture, takeover, accepted })}`);
    }
    await screenshot(session, `${label}-spatial-play-magnetic-takeover`);

    // Retreat without releasing. Acceptance and the new visual ownership must
    // both unwind while the canonical card remains in the player's hand.
    await moveTouch(session, magneticEdge, outside);
    const reversed = await waitFor(`${label}: table takeover reversal`, async () => {
      const state = await affordanceState(session, playable.card);
      return state?.phase === 'held'
        && !state.ghostReady
        && state.ownerMagnitude < 1.5
        && state.sourceStillInHand
        ? state
        : false;
    }, 2_000);
    await screenshot(session, `${label}-spatial-play-magnetic-reversed`);

    // Re-enter with the same held card. No stale bridge state may be required for
    // the second capture; TactileHand truth must drive takeover again.
    await moveTouch(session, outside, magneticEdge);
    const retakeover = await waitFor(`${label}: table retakeover`, async () => {
      const state = await affordanceState(session, playable.card);
      return state?.phase === 'accepted'
        && state.ghostReady
        && state.ownerMode === 'takeover'
        && state.ownerTarget === 'table'
        && state.ownerMagnitude >= ${MIN_TAKEOVER_PX}
        ? state
        : false;
    }, 2_000);

    await touch(session, 'touchEnd', []);
    await waitFor(`${label}: magnetic release committed`, () => execute(session, `
      return document.querySelector('.tactile-hand')?.dataset.gesturePhase === 'idle'
        && !document.querySelector('.hand-slot[data-card="${playable.card}"]');
    `), 4_000);

    return {
      label,
      card: playable.card,
      magneticOutsideByPx: playable.zone.top - magneticEdge.y,
      available,
      acceptedGesture,
      takeover,
      accepted,
      reversed,
      retakeover,
      committedOutsideCanonical: true,
    };
  } finally {
    try { await webdriver(`/session/${session}`, { method: 'DELETE' }); } catch {}
  }
}

await mkdir(OUTPUT, { recursive: true });
const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4195']);
const driver = startProcess('chromedriver', ['--port=9535']);

try {
  await waitFor('Vite spatial play server', async () => (await fetch(BASE_URL).catch(() => null))?.ok);
  await waitFor('ChromeDriver', async () => (await fetch(`${WEBDRIVER}/status`).catch(() => null))?.ok);
  const desktop = await runViewport('desktop', 1440, 1000, false);
  const mobile = await runViewport('mobile', 390, 844, true);
  console.log('spatial play affordance browser smoke: PASS');
  console.log(JSON.stringify({ desktop, mobile }, null, 2));
} catch (error) {
  console.error('spatial play affordance browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  stopProcess(driver.child);
  stopProcess(vite.child);
}
