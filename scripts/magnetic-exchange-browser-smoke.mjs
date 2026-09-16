import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4199';
const WEBDRIVER = 'http://127.0.0.1:9539';
const OUTPUT = 'artifacts/browser';
const OUTSIDE_BY_PX = 16;
const MIN_TAKEOVER_PX = 18;
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

async function screenshot(session, name) {
  const base64 = await webdriver(`/session/${session}/screenshot`);
  await writeFile(`${OUTPUT}/${name}.png`, Buffer.from(base64, 'base64'));
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

async function driveToExchange(session, label) {
  for (let round = 0; round < 12; round += 1) {
    const state = await waitFor(`${label}: auction/exchange state`, () => execute(session, `
      const heading = document.querySelector('.decision-card h2')?.textContent?.trim() ?? '';
      if (heading === 'Oddaj po jednej karcie' && document.querySelectorAll('[data-exchange-target-seat]').length === 2) return 'exchange';
      if (heading === 'Twoja licytacja') return 'auction';
      if (document.querySelector('.material-talon-state.is-active')) return 'talon';
      return '';
    `), 20_000);

    if (state === 'exchange') return;
    if (state === 'auction') {
      const bid = await clickHighestBid(session);
      if (bid === null) throw new Error(`${label}: no numeric bid while driving to exchange`);
      continue;
    }
    if (state === 'talon') {
      await waitFor(`${label}: talon settled into exchange`, () => execute(session, `
        return document.querySelector('.material-talon-state')?.getAttribute('data-talon-material-state') === 'settled'
          && document.querySelector('.decision-card h2')?.textContent?.trim() === 'Oddaj po jednej karcie';
      `), 5_000);
      return;
    }
  }
  throw new Error(`${label}: exchange not reached`);
}

async function geometry(session, height) {
  return execute(session, `
    const sourceSlot = [...document.querySelectorAll('.hand-slot[data-card]')]
      .find((slot) => !slot.classList.contains('is-exchange-staged'));
    const sourceCard = sourceSlot?.querySelector(':scope > .card');
    const target = document.querySelector('[data-exchange-target-seat]');
    const backs = target?.querySelector('.card-backs');
    if (!sourceSlot || !sourceCard || !target || !backs) return null;
    const source = sourceCard.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const backsRect = backs.getBoundingClientRect();
    const release = { x: targetRect.left + targetRect.width / 2, y: targetRect.bottom + ${OUTSIDE_BY_PX} };
    return {
      card: sourceSlot.getAttribute('data-card') ?? '',
      seat: target.getAttribute('data-exchange-target-seat') ?? '',
      from: { x: source.left + source.width / 2, y: source.top + source.height / 2 },
      release,
      retreat: { x: release.x, y: Math.min(${height} - 72, targetRect.bottom + 380) },
      target: { left: targetRect.left, right: targetRect.right, top: targetRect.top, bottom: targetRect.bottom },
      backs: { x: backsRect.left + backsRect.width / 2, y: backsRect.top + backsRect.height / 2 },
    };
  `);
}

async function pointerDown(session, point, mobile) {
  if (mobile) {
    await cdp(session, 'Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: point.x, y: point.y, radiusX: 7, radiusY: 7, force: 1 }],
    });
    return;
  }
  await cdp(session, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y });
  await cdp(session, 'Input.dispatchMouseEvent', {
    type: 'mousePressed', x: point.x, y: point.y, button: 'left', buttons: 1, clickCount: 1,
  });
}

async function pointerMove(session, point, mobile) {
  if (mobile) {
    await cdp(session, 'Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: point.x, y: point.y, radiusX: 7, radiusY: 7, force: 1 }],
    });
    return;
  }
  await cdp(session, 'Input.dispatchMouseEvent', {
    type: 'mouseMoved', x: point.x, y: point.y, button: 'left', buttons: 1,
  });
}

async function pointerUp(session, point, mobile) {
  if (mobile) {
    await cdp(session, 'Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    return;
  }
  await cdp(session, 'Input.dispatchMouseEvent', {
    type: 'mouseReleased', x: point.x, y: point.y, button: 'left', buttons: 0, clickCount: 1,
  });
}

async function moveHeld(session, from, to, mobile, steps = 10) {
  for (let step = 1; step <= steps; step += 1) {
    const ratio = step / steps;
    await pointerMove(session, {
      x: from.x + (to.x - from.x) * ratio,
      y: from.y + (to.y - from.y) * ratio,
    }, mobile);
    await sleep(20);
  }
}

async function dragToMagneticEdge(session, from, to, mobile) {
  await pointerDown(session, from, mobile);
  await sleep(28);
  await moveHeld(session, from, to, mobile);
}

async function inspectCapture(session, expectedSeat) {
  return execute(session, `
    const target = document.querySelector('[data-exchange-target-seat="${expectedSeat}"]');
    const root = document.querySelector('.app-shell');
    if (!target || !root) return null;
    return {
      seat: root.getAttribute('data-exchange-magnet-seat') ?? '',
      hot: target.classList.contains('is-exchange-hot'),
      assigned: target.getAttribute('data-exchange-assigned-card') ?? '',
    };
  `);
}

async function inspectTakeover(session, expectedTarget) {
  return execute(session, `
    const root = document.querySelector('.app-shell');
    const floating = document.querySelector('.tactile-card-float:not(.pending-handoff)');
    if (!root || !floating) return null;
    const x = Number.parseFloat(root.style.getPropertyValue('--owner-card-magnet-x')) || 0;
    const y = Number.parseFloat(root.style.getPropertyValue('--owner-card-magnet-y')) || 0;
    return {
      mode: root.getAttribute('data-owner-card-magnet-mode') ?? '',
      target: root.getAttribute('data-owner-card-magnet-target') ?? '',
      strength: Number(root.getAttribute('data-owner-card-magnet-strength') ?? 0),
      x,
      y,
      magnitude: Math.hypot(x, y),
      expected: ${JSON.stringify(expectedTarget)},
    };
  `);
}

async function inspectReversal(session, expectedSeat) {
  return execute(session, `
    const root = document.querySelector('.app-shell');
    const target = document.querySelector('[data-exchange-target-seat="${expectedSeat}"]');
    if (!root || !target) return null;
    const x = Number.parseFloat(root.style.getPropertyValue('--owner-card-magnet-x')) || 0;
    const y = Number.parseFloat(root.style.getPropertyValue('--owner-card-magnet-y')) || 0;
    return {
      seat: root.getAttribute('data-exchange-magnet-seat') ?? '',
      mode: root.getAttribute('data-owner-card-magnet-mode') ?? '',
      target: root.getAttribute('data-owner-card-magnet-target') ?? '',
      magnitude: Math.hypot(x, y),
      assigned: target.getAttribute('data-exchange-assigned-card') ?? '',
      staged: document.querySelectorAll('.hand-slot.is-exchange-staged').length,
    };
  `);
}

async function inspectStaged(session, card, seat) {
  return execute(session, `
    const slot = document.querySelector('.hand-slot.is-exchange-staged[data-card="${card}"]');
    const target = document.querySelector('[data-exchange-target-seat="${seat}"]');
    const cardNode = slot?.querySelector(':scope > .card');
    const backs = target?.querySelector('.card-backs');
    if (!slot || !target || !cardNode || !backs) return null;
    const cardRect = cardNode.getBoundingClientRect();
    const backsRect = backs.getBoundingClientRect();
    const cardCenter = { x: cardRect.left + cardRect.width / 2, y: cardRect.top + cardRect.height / 2 };
    const backsCenter = { x: backsRect.left + backsRect.width / 2, y: backsRect.top + backsRect.height / 2 };
    return {
      card: slot.getAttribute('data-card') ?? '',
      recipient: slot.getAttribute('data-exchange-recipient') ?? '',
      assigned: target.getAttribute('data-exchange-assigned-card') ?? '',
      stageCenterDistance: Math.hypot(cardCenter.x - backsCenter.x, cardCenter.y - backsCenter.y),
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

    await driveToExchange(session, label);
    const drag = await waitFor(`${label}: exchange geometry`, () => geometry(session, height));
    if (!(drag.release.y > drag.target.bottom)) throw new Error(`${label}: probe is not outside canonical recipient rect`);
    if (Math.round(drag.release.y - drag.target.bottom) !== OUTSIDE_BY_PX) {
      throw new Error(`${label}: unexpected outside distance ${JSON.stringify(drag)}`);
    }
    if (!(drag.retreat.y > drag.target.bottom + 340)) {
      throw new Error(`${label}: retreat probe is not beyond exchange release hysteresis ${JSON.stringify(drag)}`);
    }

    await dragToMagneticEdge(session, drag.from, drag.release, mobile);
    const captured = await waitFor(`${label}: magnetic recipient capture`, async () => {
      const state = await inspectCapture(session, drag.seat);
      return state?.seat === drag.seat && state.hot ? state : false;
    }, 2_000);
    if (captured.assigned) throw new Error(`${label}: target assigned before release ${JSON.stringify(captured)}`);

    const takeover = await waitFor(`${label}: visible target takeover`, async () => {
      const state = await inspectTakeover(session, `seat-${drag.seat}`);
      return state?.mode === 'takeover'
        && state.target === `seat-${drag.seat}`
        && state.magnitude >= ${MIN_TAKEOVER_PX}
        ? state
        : false;
    }, 2_000);
    await screenshot(session, `${label}-exchange-magnetic-takeover`);

    // Retreat while still holding the same card. Hysteresis must relinquish the
    // recipient, the presentation offset must decay back to zero, and no game
    // truth may be staged merely because takeover was visible.
    await moveHeld(session, drag.release, drag.retreat, mobile, 12);
    const reversed = await waitFor(`${label}: reversible magnetic retreat`, async () => {
      const state = await inspectReversal(session, drag.seat);
      return state?.seat === '' && state.assigned === '' && state.staged === 0 && state.magnitude < 1.5
        ? state
        : false;
    }, 2_000);
    await screenshot(session, `${label}-exchange-magnetic-reversed`);

    // The same held card can enter the field again. Re-capture must be driven by
    // GameTable truth again, not by stale state retained in the presentation bridge.
    await moveHeld(session, drag.retreat, drag.release, mobile, 12);
    const recaptured = await waitFor(`${label}: magnetic recipient recapture`, async () => {
      const state = await inspectCapture(session, drag.seat);
      return state?.seat === drag.seat && state.hot ? state : false;
    }, 2_000);
    const retakeover = await waitFor(`${label}: visible target retakeover`, async () => {
      const state = await inspectTakeover(session, `seat-${drag.seat}`);
      return state?.mode === 'takeover'
        && state.target === `seat-${drag.seat}`
        && state.magnitude >= ${MIN_TAKEOVER_PX}
        ? state
        : false;
    }, 2_000);

    await pointerUp(session, drag.release, mobile);
    const staged = await waitFor(`${label}: magnetic outside drop staged`, () => inspectStaged(session, drag.card, drag.seat), 2_000);
    if (staged.card !== drag.card || staged.recipient !== drag.seat || staged.assigned !== drag.card) {
      throw new Error(`${label}: magnetic outside drop mapped wrong card/recipient ${JSON.stringify({ drag, staged })}`);
    }
    if (staged.stageCenterDistance > 8) {
      throw new Error(`${label}: magnetic outside drop did not settle at recipient hand ${JSON.stringify(staged)}`);
    }
    await screenshot(session, `${label}-exchange-magnetic-staged`);

    return {
      label,
      card: drag.card,
      seat: drag.seat,
      outsideCanonicalByPx: drag.release.y - drag.target.bottom,
      captured,
      takeover,
      reversed,
      recaptured,
      retakeover,
      staged,
    };
  } finally {
    try { await webdriver(`/session/${session}`, { method: 'DELETE' }); } catch {}
  }
}

await mkdir(OUTPUT, { recursive: true });
const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4199']);
const driver = startProcess('chromedriver', ['--port=9539']);

try {
  await waitFor('Vite magnetic exchange server', async () => (await fetch(BASE_URL).catch(() => null))?.ok);
  await waitFor('ChromeDriver', async () => (await fetch(`${WEBDRIVER}/status`).catch(() => null))?.ok);
  const desktop = await runViewport('desktop', 1440, 1000, false);
  const mobile = await runViewport('mobile', 390, 844, true);
  console.log('magnetic exchange browser smoke: PASS');
  console.log(JSON.stringify({ desktop, mobile }, null, 2));
} catch (error) {
  console.error('magnetic exchange browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  stopProcess(driver.child);
  stopProcess(vite.child);
}
