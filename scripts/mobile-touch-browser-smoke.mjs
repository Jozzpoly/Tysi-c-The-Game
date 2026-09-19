import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4183';
const WEBDRIVER = 'http://127.0.0.1:9525';
const OUTPUT = 'artifacts/browser';
const ELEMENT_ID = 'element-6066-11e4-a52e-4f735466cecf';
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
    await sleep(80);
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
            args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--window-size=384,718'],
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

async function emulateMobile(session) {
  await cdp(session, 'Emulation.setDeviceMetricsOverride', {
    width: 384, height: 718, screenWidth: 384, screenHeight: 718,
    deviceScaleFactor: 1, mobile: true, positionX: 0, positionY: 0,
    dontSetVisibleSize: false,
  });
  // W3C pointerType: touch actions below own input semantics. Keep viewport
  // emulation separate instead of stacking a second CDP touch-emulation layer.
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

async function touchAt(session, x, y) {
  const pointerId = `touch-tap-${Date.now()}-${Math.round(x)}-${Math.round(y)}`;
  await webdriver(`/session/${session}/actions`, {
    method: 'POST',
    body: JSON.stringify({
      actions: [{
        type: 'pointer',
        id: pointerId,
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x: Math.round(x), y: Math.round(y), origin: 'viewport' },
          { type: 'pointerDown', button: 0 },
          { type: 'pause', duration: 55 },
          { type: 'pointerUp', button: 0 },
        ],
      }],
    }),
  });
}

async function dragTouch(session, from, to, steps = 8) {
  const pointerId = `touch-drag-${Date.now()}-${Math.round(from.x)}-${Math.round(from.y)}`;
  const moves = [];
  for (let step = 1; step <= steps; step += 1) {
    const ratio = step / steps;
    moves.push({
      type: 'pointerMove',
      duration: 20,
      x: Math.round(from.x + (to.x - from.x) * ratio),
      y: Math.round(from.y + (to.y - from.y) * ratio),
      origin: 'viewport',
    });
  }
  await webdriver(`/session/${session}/actions`, {
    method: 'POST',
    body: JSON.stringify({
      actions: [{
        type: 'pointer',
        id: pointerId,
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x: Math.round(from.x), y: Math.round(from.y), origin: 'viewport' },
          { type: 'pointerDown', button: 0 },
          { type: 'pause', duration: 32 },
          ...moves,
          { type: 'pointerUp', button: 0 },
        ],
      }],
    }),
  });
}

async function clickFirstElement(session, selector) {
  const elements = await webdriver(`/session/${session}/elements`, {
    method: 'POST',
    body: JSON.stringify({ using: 'css selector', value: selector }),
  });
  const id = elements?.[0]?.[ELEMENT_ID];
  if (!id) throw new Error(`WebDriver element missing for ${JSON.stringify(selector)}`);
  await webdriver(`/session/${session}/element/${id}/click`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

async function uiState(session) {
  return execute(session, `
    const revisionText = [...document.querySelectorAll('.footer span')]
      .map((node) => node.textContent?.trim() ?? '')
      .find((value) => /^rev \\d+$/.test(value));
    return {
      heading: document.querySelector('.decision-card h2')?.textContent?.trim() ?? '',
      revision: revisionText ? Number(revisionText.slice(4)) : null,
      buttons: [...document.querySelectorAll('.decision-card button:not(:disabled)')]
        .map((node) => node.textContent?.trim() ?? ''),
      message: document.querySelector('.message')?.textContent?.trim() ?? '',
    };
  `);
}

async function enabledControlGeometry(session) {
  return execute(session, `
    return [...document.querySelectorAll('.decision-card button:not(:disabled), .topbar-actions button:not(:disabled)')]
      .map((node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return {
          text: node.textContent?.trim() ?? '',
          width: rect.width,
          height: rect.height,
          userSelect: style.userSelect,
          webkitUserSelect: style.webkitUserSelect,
          touchAction: style.touchAction,
        };
      });
  `);
}

function assertTouchControls(label, controls) {
  if (!controls.length) throw new Error(`${label}: no enabled controls`);
  for (const control of controls) {
    if (control.height < 43.5) throw new Error(`${label}: target too short ${JSON.stringify(control)}`);
    if (control.userSelect !== 'none' && control.webkitUserSelect !== 'none') {
      throw new Error(`${label}: selectable text ${JSON.stringify(control)}`);
    }
    if (control.touchAction !== 'manipulation') {
      throw new Error(`${label}: unexpected touch-action ${JSON.stringify(control)}`);
    }
  }
}

async function numericTargets(session) {
  return execute(session, `
    return [...document.querySelectorAll('.decision-card button:not(:disabled)')]
      .map((node) => {
        const value = Number(node.textContent?.trim());
        if (!Number.isFinite(value)) return null;
        const rect = node.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const hit = document.elementFromPoint(x, y)?.closest?.('button');
        return {
          value, x, y,
          width: rect.width,
          height: rect.height,
          touchableAtCenter: hit === node,
          withinViewport: x >= 0 && x <= innerWidth && y >= 0 && y <= innerHeight,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.value - a.value);
  `);
}

async function touchHighestPhysicalNumeric(session) {
  const targets = await numericTargets(session);
  const target = targets.find((entry) => entry.touchableAtCenter && entry.withinViewport);
  if (!target) throw new Error(`no physically touchable numeric decision: ${JSON.stringify(targets)}`);
  await touchAt(session, target.x, target.y);
  return { target, targets };
}

async function touchLowestPhysicalNumeric(session) {
  const targets = await numericTargets(session);
  const target = [...targets].reverse().find((entry) => entry.touchableAtCenter && entry.withinViewport);
  if (!target) throw new Error(`no physically touchable numeric decision: ${JSON.stringify(targets)}`);
  await touchAt(session, target.x, target.y);
  return { target, targets };
}

async function armContractTouchTrace(session, value) {
  return execute(session, `
    const node = [...document.querySelectorAll('.decision-card button:not(:disabled)')]
      .find((candidate) => Number(candidate.textContent?.trim()) === ${Number(value)});
    if (!node) return false;
    window.__contractTouchTrace = [];
    const record = (event) => {
      const touch = event.changedTouches?.[0] ?? event.touches?.[0] ?? null;
      window.__contractTouchTrace.push({
        type: event.type,
        target: event.target?.closest?.('button')?.textContent?.trim() ?? '',
        pointerType: event.pointerType ?? '',
        clientX: event.clientX ?? touch?.clientX ?? null,
        clientY: event.clientY ?? touch?.clientY ?? null,
        defaultPrevented: event.defaultPrevented,
      });
    };
    for (const type of ['pointerdown', 'touchstart', 'pointerup', 'touchend', 'click']) {
      node.addEventListener(type, record, { capture: true });
    }
    return true;
  `);
}

async function contractTouchTrace(session) {
  return execute(session, `return window.__contractTouchTrace ?? [];`);
}

function assertTouchLifecycle(label, value, events) {
  const target = String(value);
  for (const type of ['pointerdown', 'touchstart', 'pointerup', 'touchend']) {
    if (!events.some((event) => event.type === type && event.target === target)) {
      throw new Error(`${label}: missing ${type}: ${JSON.stringify(events)}`);
    }
  }
  const pointerEvents = events.filter((event) => event.type === 'pointerdown' || event.type === 'pointerup');
  if (!pointerEvents.every((event) => event.pointerType === 'touch')) {
    throw new Error(`${label}: pointer lifecycle is not touch: ${JSON.stringify(events)}`);
  }
  if (events.some((event) => event.defaultPrevented)) {
    throw new Error(`${label}: touch lifecycle was prevented: ${JSON.stringify(events)}`);
  }
}

async function waitForRevisionAdvance(session, before, label) {
  return waitFor(label, async () => {
    const state = await uiState(session);
    return state.revision !== null && before !== null && state.revision > before ? state : false;
  }, 5_000);
}

async function driveAuctionToExchange(session) {
  const trace = [];
  for (let action = 0; action < 16; action += 1) {
    const state = await waitFor('human auction or exchange', async () => {
      const candidate = await uiState(session);
      return candidate.heading === 'Twoja licytacja' || candidate.heading === 'Oddaj po jednej karcie' ? candidate : false;
    }, 8_000);
    trace.push({ stage: 'decision', ...state });
    if (state.heading === 'Oddaj po jednej karcie') return trace;

    assertTouchControls('auction', await enabledControlGeometry(session));
    const touched = await touchHighestPhysicalNumeric(session);
    trace.push({ stage: 'touch', revision: state.revision, chosen: touched.target, allNumeric: touched.targets });
    await waitForRevisionAdvance(session, state.revision, `physical auction touch ${touched.target.value} accepted`).catch(async (error) => {
      throw new Error(`${error}; current=${JSON.stringify(await uiState(session))}; trace=${JSON.stringify(trace)}`);
    });
  }
  throw new Error(`auction did not reach exchange: ${JSON.stringify(trace)}`);
}

async function cardGeometry(session) {
  return execute(session, `
    const cards = [...document.querySelectorAll('.hand .card:not(:disabled)')];
    return cards.map((node, index) => {
      const rect = node.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const hit = document.elementFromPoint(x, y)?.closest?.('button.card');
      const slot = node.closest('.hand-slot');
      const touchTarget = slot?.querySelector(':scope > .hand-touch-target');
      const touchRect = touchTarget?.getBoundingClientRect() ?? null;
      const touchX = touchRect ? touchRect.left + touchRect.width / 2 : null;
      const touchY = touchRect ? touchRect.top + touchRect.height / 2 : null;
      const touchHitSlot = touchX === null || touchY === null
        ? null
        : document.elementFromPoint(touchX, touchY)?.closest?.('.hand-slot');
      const style = getComputedStyle(node);
      const touchStyle = touchTarget ? getComputedStyle(touchTarget) : null;
      return {
        index,
        label: node.getAttribute('aria-label'),
        x, y,
        width: rect.width,
        height: rect.height,
        aspectRatio: rect.height > 0 ? rect.width / rect.height : 0,
        centerHitsSelf: hit === node,
        touchX,
        touchY,
        touchWidth: touchRect?.width ?? 0,
        touchHeight: touchRect?.height ?? 0,
        touchHitsSelf: Boolean(slot && touchHitSlot === slot),
        touchPointerEvents: touchStyle?.pointerEvents ?? '',
        userSelect: style.userSelect,
        touchAction: style.touchAction,
      };
    });
  `);
}

async function compactViewportGeometry(session) {
  return execute(session, `
    const app = document.querySelector('.app-shell');
    const topbar = document.querySelector('.topbar');
    const hand = document.querySelector('.tactile-hand');
    const decision = document.querySelector('.decision-card');
    const cards = [...document.querySelectorAll('.tactile-hand > .hand-slot > .card')];
    const cardRects = cards.map((node) => node.getBoundingClientRect());
    const handRect = hand?.getBoundingClientRect() ?? null;
    const topbarRect = topbar?.getBoundingClientRect() ?? null;
    const decisionRect = decision?.getBoundingClientRect() ?? null;
    return {
      phase: app?.getAttribute('data-phase') ?? '',
      innerWidth,
      innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
      bodyScrollHeight: document.body.scrollHeight,
      topbarHeight: topbarRect?.height ?? 0,
      handTop: handRect?.top ?? null,
      handBottom: handRect?.bottom ?? null,
      cardTop: cardRects.length ? Math.min(...cardRects.map((rect) => rect.top)) : null,
      cardBottom: cardRects.length ? Math.max(...cardRects.map((rect) => rect.bottom)) : null,
      minCardHeight: cardRects.length ? Math.min(...cardRects.map((rect) => rect.height)) : 0,
      decisionTop: decisionRect?.top ?? null,
      decisionBottom: decisionRect?.bottom ?? null,
      fullscreenControl: Boolean(document.querySelector('.fullscreen-toggle')),
      fullscreenEnabled: Boolean(document.fullscreenEnabled || document.documentElement.requestFullscreen),
    };
  `);
}

function assertCompactPhysicalViewport(label, geometry) {
  if (geometry.innerWidth !== 384 || geometry.innerHeight !== 718) {
    throw new Error(`${label}: wrong compact viewport ${JSON.stringify(geometry)}`);
  }
  if (!['exchange', 'trick'].includes(geometry.phase)) {
    throw new Error(`${label}: unexpected phase ${JSON.stringify(geometry)}`);
  }
  if (geometry.scrollHeight > geometry.innerHeight + 2 || geometry.bodyScrollHeight > geometry.innerHeight + 2) {
    throw new Error(`${label}: physical play still vertically scrolls ${JSON.stringify(geometry)}`);
  }
  if (geometry.minCardHeight < 124) {
    throw new Error(`${label}: private hand still visually undersized ${JSON.stringify(geometry)}`);
  }
  if (geometry.cardTop === null || geometry.cardBottom === null || geometry.cardTop < -2 || geometry.cardBottom > geometry.innerHeight + 2) {
    throw new Error(`${label}: private cards escape compact viewport ${JSON.stringify(geometry)}`);
  }
  if (geometry.decisionBottom !== null && geometry.cardTop !== null && geometry.decisionBottom > geometry.cardTop + 8) {
    throw new Error(`${label}: decision materially overlaps private cards ${JSON.stringify(geometry)}`);
  }
  if (geometry.topbarHeight > 58) {
    throw new Error(`${label}: game chrome is too tall ${JSON.stringify(geometry)}`);
  }
  if (geometry.fullscreenEnabled && !geometry.fullscreenControl) {
    throw new Error(`${label}: fullscreen is supported but compact control is missing ${JSON.stringify(geometry)}`);
  }
}

async function playZoneGeometry(session) {
  return execute(session, `
    const node = document.querySelector('.trick');
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    return {
      x, y,
      width: rect.width,
      height: rect.height,
      withinViewport: x >= 0 && x <= innerWidth && y >= 0 && y <= innerHeight,
    };
  `);
}

async function exchangeDragGeometry(session, targetIndex) {
  return execute(session, `
    const sourceSlot = [...document.querySelectorAll('.hand .hand-slot')]
      .find((slot) => !slot.classList.contains('is-exchange-staged'));
    const sourceCard = sourceSlot?.querySelector(':scope > .card');
    const sourceTouch = sourceSlot?.querySelector(':scope > .hand-touch-target');
    const targets = [...document.querySelectorAll('[data-exchange-target-seat]')];
    const target = targets[${targetIndex}];
    if (!sourceSlot || !sourceCard || !sourceTouch || !target) return null;
    const sourceRect = sourceCard.getBoundingClientRect();
    const touchRect = sourceTouch.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;
    return {
      card: sourceSlot.getAttribute('data-card'),
      seat: target.getAttribute('data-exchange-target-seat'),
      from: { x: touchRect.left + touchRect.width / 2, y: touchRect.top + Math.min(touchRect.height - 8, Math.max(8, sourceRect.height * .56)) },
      to: { x: targetX, y: targetY },
      targetWidth: targetRect.width,
      targetHeight: targetRect.height,
      targetWithinViewport: targetX >= 0 && targetX <= innerWidth && targetY >= 0 && targetY <= innerHeight,
    };
  `);
}

async function dragNextExchangeCard(session, targetIndex) {
  const geometry = await exchangeDragGeometry(session, targetIndex);
  if (!geometry) throw new Error(`physical exchange geometry unavailable for target ${targetIndex}`);
  if (!geometry.targetWithinViewport) throw new Error(`exchange target outside mobile viewport: ${JSON.stringify(geometry)}`);
  await dragTouch(session, geometry.from, geometry.to);
  return geometry;
}

function minimumCenterSpacing(cards) {
  let minimum = Infinity;
  for (let i = 0; i < cards.length; i += 1) {
    for (let j = i + 1; j < cards.length; j += 1) {
      if (Math.abs(cards[i].y - cards[j].y) > 20) continue;
      minimum = Math.min(minimum, Math.abs(cards[i].x - cards[j].x));
    }
  }
  return Number.isFinite(minimum) ? minimum : null;
}

async function run() {
  const session = await createSession();
  try {
    await emulateMobile(session);
    await navigate(session, `${BASE_URL}?seed=2&seat=0`);
    await waitFor('first human auction', async () => (await uiState(session)).heading === 'Twoja licytacja');
    const auctionTrace = await driveAuctionToExchange(session);

    assertTouchControls('exchange controls', await enabledControlGeometry(session));
    const exchangeCards = await cardGeometry(session);
    const exchangeViewport = await compactViewportGeometry(session);
    assertCompactPhysicalViewport('exchange compact composition', exchangeViewport);
    await screenshot(session, 'mobile-touch-exchange');
    if (exchangeCards.length !== 10) throw new Error(`expected 10 exchange cards, got ${exchangeCards.length}`);
    for (const card of exchangeCards) {
      if (card.width < 47 || card.height < 124) throw new Error(`exchange card target too small ${JSON.stringify(card)}`);
      if (card.aspectRatio < 0.66 || card.aspectRatio > 0.70) {
        throw new Error(`exchange card material aspect distorted ${JSON.stringify(card)}`);
      }
      if (card.touchWidth < 32 || card.touchHeight < 120) {
        throw new Error(`exchange exposed touch territory too small ${JSON.stringify(card)}`);
      }
      if (!card.touchHitsSelf || card.touchPointerEvents === 'none') {
        throw new Error(`exchange exposed touch territory is not independently hittable ${JSON.stringify(card)}`);
      }
      if (card.userSelect !== 'none') throw new Error(`exchange card text selectable ${JSON.stringify(card)}`);
      if (card.touchAction !== 'manipulation') throw new Error(`exchange card touch-action ${JSON.stringify(card)}`);
    }

    const beforeExchange = (await uiState(session)).revision;
    const firstDrop = await dragNextExchangeCard(session, 0);
    const firstAssignment = await waitFor('first physical exchange assignment', () => execute(session, `
      const slot = document.querySelector('.hand-slot.is-exchange-staged');
      return slot ? {
        card: slot.getAttribute('data-card'),
        recipient: slot.getAttribute('data-exchange-recipient'),
      } : false;
    `), 1_500);
    if (firstAssignment.card !== firstDrop.card || firstAssignment.recipient !== firstDrop.seat) {
      throw new Error(`first physical exchange assignment mismatch ${JSON.stringify({ firstDrop, firstAssignment })}`);
    }

    const secondDrop = await dragNextExchangeCard(session, 1);
    const selectionAfterCards = await execute(session, `return window.getSelection()?.toString() ?? '';`);
    if (selectionAfterCards) throw new Error(`touch selected text during exchange: ${JSON.stringify(selectionAfterCards)}`);

    await waitForRevisionAdvance(session, beforeExchange, 'physical exchange accepted');
    await waitFor('contract input ready after exchange', () => execute(session, `
      const state = document.querySelector('.material-exchange-state')?.getAttribute('data-exchange-material-state') ?? 'missing';
      const heading = document.querySelector('.decision-card h2')?.textContent?.trim() ?? '';
      const transfers = document.querySelectorAll('.exchange-transfer-card').length;
      const staged = document.querySelectorAll('.hand-slot.is-exchange-staged').length;
      return heading === 'Ile ostatecznie grasz?' && state === 'settled' && transfers === 0 && staged === 0;
    `), 3_000);
    assertTouchControls('contract', await enabledControlGeometry(session));

    const contractState = await uiState(session);
    const contractTargets = await numericTargets(session);
    const contractCandidate = [...contractTargets].reverse().find((entry) => entry.touchableAtCenter && entry.withinViewport);
    if (!contractCandidate) throw new Error(`no physically touchable contract decision: ${JSON.stringify(contractTargets)}`);
    if (!(await armContractTouchTrace(session, contractCandidate.value))) throw new Error('could not arm contract touch trace');
    const contractTouch = await touchLowestPhysicalNumeric(session);
    await sleep(120);
    const contractTouchLifecycle = await contractTouchTrace(session);
    assertTouchLifecycle('contract touch evidence', contractTouch.target.value, contractTouchLifecycle);

    const stateAfterContractTouch = await uiState(session);
    let contractActivation = 'touch';
    if (stateAfterContractTouch.revision === contractState.revision) {
      await clickFirstElement(session, '.decision-card button:not(:disabled)');
      contractActivation = 'webdriver-element-click-after-touch-evidence';
    }
    await waitForRevisionAdvance(session, contractState.revision, `contract ${contractTouch.target.value} semantic activation accepted`);
    await waitFor('playable hand', () => execute(session, `return document.querySelectorAll('.hand .card:not(:disabled)').length > 0;`));

    const playableCards = await cardGeometry(session);
    const trickViewport = await compactViewportGeometry(session);
    assertCompactPhysicalViewport('trick compact composition', trickViewport);
    await screenshot(session, 'mobile-touch-trick');
    const playableCard = playableCards.find((card) => card.centerHitsSelf);
    if (!playableCard) throw new Error(`no physically hittable playable card after contract: ${JSON.stringify(playableCards)}`);
    const playZone = await playZoneGeometry(session);
    if (!playZone?.withinViewport) throw new Error(`play zone unavailable in mobile viewport: ${JSON.stringify(playZone)}`);
    const beforePlay = (await uiState(session)).revision;
    await dragTouch(session, { x: playableCard.x, y: playableCard.y }, { x: playZone.x, y: playZone.y });
    await waitForRevisionAdvance(session, beforePlay, 'playable card touch throw accepted');

    const finalSelection = await execute(session, `return window.getSelection()?.toString() ?? '';`);
    if (finalSelection) throw new Error(`gameplay interaction left selected text: ${JSON.stringify(finalSelection)}`);
    await screenshot(session, 'mobile-touch-contract');

    return {
      auctionTrace,
      exchangeCards: exchangeCards.length,
      minCardWidth: Math.min(...exchangeCards.map((card) => card.width)),
      minCardHeight: Math.min(...exchangeCards.map((card) => card.height)),
      minCardAspectRatio: Math.min(...exchangeCards.map((card) => card.aspectRatio)),
      maxCardAspectRatio: Math.max(...exchangeCards.map((card) => card.aspectRatio)),
      minSameRowCenterSpacing: minimumCenterSpacing(exchangeCards),
      exchangeTouchTerritoriesHitCorrectCard: exchangeCards.every((card) => card.touchHitsSelf),
      exchangeViewport,
      trickViewport,
      firstDrop,
      secondDrop,
      contractValue: contractTouch.target.value,
      contractTouchLifecycle,
      contractActivation,
      playCard: playableCard.label,
      playZone,
      playActivation: 'w3c-touch-drag-to-trick',
    };
  } finally {
    await closeSession(session);
  }
}

await mkdir(OUTPUT, { recursive: true });
const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4183']);
const driver = startProcess('chromedriver', ['--port=9525']);

try {
  await waitFor('Vite touch server', async () => {
    const response = await fetch(BASE_URL).catch(() => null);
    return response?.ok;
  });
  await waitFor('ChromeDriver', async () => {
    const response = await fetch(`${WEBDRIVER}/status`).catch(() => null);
    return response?.ok;
  });
  const evidence = await run();
  console.log('mobile touch browser smoke: PASS');
  console.log(JSON.stringify(evidence, null, 2));
} catch (error) {
  console.error('mobile touch browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  stopProcess(driver.child);
  stopProcess(vite.child);
}