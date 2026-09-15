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

async function touch(session, type, points) {
  await cdp(session, 'Input.dispatchTouchEvent', { type, touchPoints: points });
}

async function dragPointer(session, from, to, mobile, steps = 8) {
  if (mobile) {
    await touch(session, 'touchStart', [{ x: from.x, y: from.y, radiusX: 7, radiusY: 7, force: 1 }]);
    await sleep(32);
    for (let step = 1; step <= steps; step += 1) {
      const ratio = step / steps;
      await touch(session, 'touchMove', [{
        x: from.x + (to.x - from.x) * ratio,
        y: from.y + (to.y - from.y) * ratio,
        radiusX: 7,
        radiusY: 7,
        force: 1,
      }]);
      await sleep(20);
    }
    await touch(session, 'touchEnd', []);
    return;
  }

  await cdp(session, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x: from.x, y: from.y });
  await cdp(session, 'Input.dispatchMouseEvent', {
    type: 'mousePressed', x: from.x, y: from.y, button: 'left', buttons: 1, clickCount: 1,
  });
  await sleep(28);
  for (let step = 1; step <= steps; step += 1) {
    const ratio = step / steps;
    await cdp(session, 'Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: from.x + (to.x - from.x) * ratio,
      y: from.y + (to.y - from.y) * ratio,
      button: 'left',
      buttons: 1,
    });
    await sleep(18);
  }
  await cdp(session, 'Input.dispatchMouseEvent', {
    type: 'mouseReleased', x: to.x, y: to.y, button: 'left', buttons: 0, clickCount: 1,
  });
}

async function exchangeDragGeometry(session, targetIndex) {
  return execute(session, `
    const sourceSlot = [...document.querySelectorAll('.hand .hand-slot')]
      .find((slot) => !slot.classList.contains('is-exchange-staged'));
    const sourceCard = sourceSlot?.querySelector(':scope > .card');
    const targets = [...document.querySelectorAll('[data-exchange-target-seat]')];
    const target = targets[${targetIndex}];
    if (!sourceSlot || !sourceCard || !target) return null;
    const sourceRect = sourceCard.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    return {
      card: sourceSlot.getAttribute('data-card'),
      seat: target.getAttribute('data-exchange-target-seat'),
      from: { x: sourceRect.left + sourceRect.width / 2, y: sourceRect.top + sourceRect.height / 2 },
      to: { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 },
    };
  `);
}

async function dragNextExchangeCard(session, targetIndex, mobile) {
  const geometry = await exchangeDragGeometry(session, targetIndex);
  if (!geometry) throw new Error(`physical exchange geometry unavailable for target ${targetIndex}`);
  await dragPointer(session, geometry.from, geometry.to, mobile);
  return geometry;
}

async function inspectExchangeDraft(session) {
  return execute(session, `
    const rectData = (rect) => rect ? ({
      left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom,
      width: rect.width, height: rect.height,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
    }) : null;
    const staged = [...document.querySelectorAll('.hand-slot.is-exchange-staged')].map((slot) => {
      const card = slot.querySelector(':scope > .card');
      const rect = card?.getBoundingClientRect();
      const slotRect = slot.getBoundingClientRect();
      const recipient = slot.getAttribute('data-exchange-recipient') ?? '';
      const target = document.querySelector('[data-exchange-target-seat="' + recipient + '"]');
      const targetRect = target?.getBoundingClientRect();
      const anchor = document.querySelector('[data-exchange-stage-seat="' + recipient + '"]');
      const anchorRect = anchor?.getBoundingClientRect();
      const centerX = rect ? rect.left + rect.width / 2 : null;
      const centerY = rect ? rect.top + rect.height / 2 : null;
      const slotStyle = getComputedStyle(slot);
      const cardStyle = card ? getComputedStyle(card) : null;
      return {
        card: slot.getAttribute('data-card'),
        recipient,
        centerX,
        centerY,
        stageXInline: slot.style.getPropertyValue('--exchange-stage-x'),
        stageYInline: slot.style.getPropertyValue('--exchange-stage-y'),
        computedTranslate: slotStyle.translate,
        computedScale: slotStyle.scale,
        computedTransform: slotStyle.transform,
        cardTransform: cardStyle?.transform ?? null,
        slotRect: rectData(slotRect),
        cardRect: rectData(rect),
        targetRect: rectData(targetRect),
        anchorRect: rectData(anchorRect),
        insideRecipient: Boolean(rect && targetRect
          && centerX >= targetRect.left && centerX <= targetRect.right
          && centerY >= targetRect.top && centerY <= targetRect.bottom),
      };
    });
    const targets = [...document.querySelectorAll('[data-exchange-target-seat]')].map((target) => ({
      seat: target.getAttribute('data-exchange-target-seat'),
      assignedCard: target.getAttribute('data-exchange-assigned-card') ?? '',
      hot: target.classList.contains('is-exchange-hot'),
      rect: rectData(target.getBoundingClientRect()),
    }));
    return {
      staged,
      targets,
      hasLegacyConfirm: [...document.querySelectorAll('.decision-card button')]
        .some((button) => button.textContent?.trim() === 'Potwierdź wymianę'),
      help: document.querySelector('.physical-exchange-help')?.textContent?.trim() ?? '',
      materialActive: Boolean(document.querySelector('.material-exchange-state.is-active')),
    };
  `);
}

async function screenshot(session, name) {
  const base64 = await webdriver(`/session/${session}/screenshot`);
  await writeFile(`${OUTPUT}/${name}.png`, Buffer.from(base64, 'base64'));
}

async function closeSession(session) {
  if (!session) return;
  try { await webdriver(`/session/${session}`, { method: 'DELETE' }); } catch {}
}

async function clickButtonByText(session, text) {
  const clicked = await execute(session, `
    const button = [...document.querySelectorAll('button')].find((node) => node.textContent?.trim() === ${JSON.stringify(text)} && !node.disabled);
    if (!button) return false;
    button.click();
    return true;
  `);
  if (!clicked) throw new Error(`enabled button not found: ${text}`);
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

async function inspectTalonTransfer(session) {
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

async function inspectTalonSettled(session) {
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

async function inspectExchangeTransfer(session) {
  return execute(session, `
    const transfers = [...document.querySelectorAll('.exchange-transfer-card')];
    const materialMarkers = [...document.querySelectorAll('[data-exchange-materializing-card]')];
    const materialSlots = materialMarkers
      .map((marker) => marker.closest('.hand-slot'))
      .filter(Boolean);
    const receivingMarkers = [...document.querySelectorAll('[data-exchange-receiving-seat]')];
    const receiving = receivingMarkers
      .map((marker) => marker.closest('[data-seat-anchor]'))
      .filter(Boolean);
    return {
      state: document.querySelector('.material-exchange-state')?.getAttribute('data-exchange-material-state') ?? 'missing',
      transfers: transfers.length,
      faces: transfers.filter((node) => node.classList.contains('is-face')).length,
      backs: transfers.filter((node) => node.classList.contains('is-back')).length,
      knownCards: transfers.map((node) => node.getAttribute('data-exchange-card')).filter(Boolean),
      recipients: transfers.map((node) => node.getAttribute('data-exchange-recipient')).filter(Boolean),
      materialSlots: materialSlots.map((node) => node.getAttribute('data-card')).filter(Boolean),
      hiddenMaterialTargets: materialSlots.filter((node) => {
        const card = node.querySelector(':scope > .card');
        return card && getComputedStyle(card).visibility === 'hidden';
      }).length,
      receivingAnchors: receivingMarkers.length,
      hiddenRecipientBacks: receiving.filter((node) => {
        const back = node.querySelector('.card-backs i:last-child');
        return back && getComputedStyle(back).visibility === 'hidden';
      }).length,
      handCards: document.querySelectorAll('.hand .card').length,
      enabledHandCards: document.querySelectorAll('.hand .card:not(:disabled)').length,
      decisionHeading: document.querySelector('.decision-card h2')?.textContent?.trim() ?? '',
    };
  `);
}

async function inspectExchangeSettled(session) {
  return execute(session, `
    const talon = document.querySelector('.talon');
    const numericButtons = [...document.querySelectorAll('.decision-card button:not(:disabled)')]
      .filter((node) => Number.isFinite(Number(node.textContent?.trim()))).length;
    return {
      state: document.querySelector('.material-exchange-state')?.getAttribute('data-exchange-material-state') ?? 'missing',
      transfers: document.querySelectorAll('.exchange-transfer-card').length,
      materialSlots: document.querySelectorAll('[data-exchange-materializing-card]').length,
      receivingAnchors: document.querySelectorAll('[data-exchange-receiving-seat]').length,
      handCards: document.querySelectorAll('.hand .card').length,
      decisionHeading: document.querySelector('.decision-card h2')?.textContent?.trim() ?? '',
      numericButtons,
      talonDisplay: talon ? getComputedStyle(talon).display : 'missing',
      scrollWidth: document.documentElement.scrollWidth,
      width: document.documentElement.clientWidth,
    };
  `);
}

async function openScenario(width, height, mobile, seed) {
  const session = await createSession();
  await cdp(session, 'Emulation.setDeviceMetricsOverride', {
    width, height, screenWidth: width, screenHeight: height,
    deviceScaleFactor: 1, mobile, positionX: 0, positionY: 0, dontSetVisibleSize: false,
  });
  await cdp(session, 'Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 });
  await webdriver(`/session/${session}/url`, {
    method: 'POST', body: JSON.stringify({ url: `${BASE_URL}?seed=${seed}&seat=0` }),
  });
  return session;
}

async function runDeclarerViewport(label, width, height, mobile) {
  const session = await openScenario(width, height, mobile, 2);
  try {
    await driveToTransfer(session, label);
    await waitFor(`${label}: three material cards`, async () => (await inspectTalonTransfer(session)).visibleTransferCards === 3, 500);
    await sleep(90);
    const talonFlight = await inspectTalonTransfer(session);
    if (talonFlight.state !== 'active') throw new Error(`${label}: talon transfer state is not active ${JSON.stringify(talonFlight)}`);
    if (talonFlight.transferCards.length !== 3 || talonFlight.visibleTransferCards !== 3) throw new Error(`${label}: expected three visible talon cards ${JSON.stringify(talonFlight)}`);
    if (talonFlight.sourceCards !== 3 || talonFlight.hiddenSourceCards !== 3) throw new Error(`${label}: source talon duplicates remain visible ${JSON.stringify(talonFlight)}`);
    if (talonFlight.materialSlots.length !== 3 || talonFlight.hiddenMaterialTargets !== 3) throw new Error(`${label}: canonical hand targets are not hidden during talon transfer ${JSON.stringify(talonFlight)}`);
    if (new Set(talonFlight.transferCards).size !== 3 || talonFlight.transferCards.some((card) => !talonFlight.materialSlots.includes(card))) {
      throw new Error(`${label}: talon identities do not match exact hand targets ${JSON.stringify(talonFlight)}`);
    }
    if (talonFlight.enabledHandCards !== 0 || talonFlight.decisionHeading === 'Oddaj po jednej karcie') {
      throw new Error(`${label}: exchange input became active before talon ownership materialized ${JSON.stringify(talonFlight)}`);
    }
    await screenshot(session, `${label}-talon-transfer-flight`);

    const talonSettled = await waitFor(`${label}: talon transfer settled`, async () => {
      const state = await inspectTalonSettled(session);
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
    if (talonSettled.scrollWidth > talonSettled.width + 1) throw new Error(`${label}: talon transfer introduced horizontal overflow ${JSON.stringify(talonSettled)}`);

    const initialDraft = await inspectExchangeDraft(session);
    if (initialDraft.hasLegacyConfirm) throw new Error(`${label}: legacy confirm button survived physical exchange ${JSON.stringify(initialDraft)}`);
    if (initialDraft.targets.length !== 2 || initialDraft.staged.length !== 0) throw new Error(`${label}: physical recipient territories not ready ${JSON.stringify(initialDraft)}`);
    await screenshot(session, `${label}-physical-exchange-ready`);

    const firstDrop = await dragNextExchangeCard(session, 0, mobile);
    const firstDraft = await waitFor(`${label}: first physical recipient assignment`, async () => {
      const state = await inspectExchangeDraft(session);
      return state.staged.length === 1 ? state : false;
    }, 1_000);
    if (firstDraft.hasLegacyConfirm) throw new Error(`${label}: physical assignment exposed legacy confirmation ${JSON.stringify(firstDraft)}`);
    if (firstDraft.staged[0].recipient !== firstDrop.seat || firstDraft.staged[0].card !== firstDrop.card || !firstDraft.staged[0].insideRecipient) {
      throw new Error(`${label}: first recipient was not derived from spatial drop target ${JSON.stringify({ firstDrop, firstDraft })}`);
    }
    if (firstDraft.materialActive) throw new Error(`${label}: exchange committed before both physical recipients were assigned ${JSON.stringify(firstDraft)}`);
    await screenshot(session, `${label}-physical-exchange-first-card`);

    const secondDrop = await dragNextExchangeCard(session, 1, mobile);
    const secondDraft = await waitFor(`${label}: second physical recipient assignment`, async () => {
      const state = await inspectExchangeDraft(session);
      return state.staged.length === 2 ? state : false;
    }, 170);
    const recipientMap = new Map(secondDraft.staged.map((entry) => [entry.recipient, entry.card]));
    if (recipientMap.get(firstDrop.seat) !== firstDrop.card || recipientMap.get(secondDrop.seat) !== secondDrop.card) {
      throw new Error(`${label}: two-card exchange mapping does not match spatial recipients ${JSON.stringify({ firstDrop, secondDrop, secondDraft })}`);
    }
    if (!secondDraft.staged.every((entry) => entry.insideRecipient)) {
      throw new Error(`${label}: staged cards are not physically resident in recipient territories ${JSON.stringify(secondDraft)}`);
    }
    await screenshot(session, `${label}-physical-exchange-two-cards`);

    const exchangeFlight = await waitFor(`${label}: complete declarer exchange flight`, async () => {
      const state = await inspectExchangeTransfer(session);
      return state.state === 'active'
        && state.transfers === 2
        && state.faces === 2
        && state.backs === 0
        && state.knownCards.length === 2
        && new Set(state.knownCards).size === 2
        && state.receivingAnchors === 2
        && state.hiddenRecipientBacks === 2
        && state.enabledHandCards === 0
        && state.decisionHeading !== 'Ile ostatecznie grasz?'
        ? state
        : false;
    }, 1_500);
    if (exchangeFlight.knownCards.length !== 2 || new Set(exchangeFlight.knownCards).size !== 2) {
      throw new Error(`${label}: declarer transfer lost exact outgoing identities ${JSON.stringify(exchangeFlight)}`);
    }
    const outgoingStillInHand = await execute(session, `
      const cards = ${JSON.stringify(exchangeFlight.knownCards)};
      return cards.filter((card) => document.querySelector('.hand-slot[data-card="' + card + '"]'));
    `);
    if (outgoingStillInHand.length > 0) throw new Error(`${label}: outgoing card still visible in canonical hand ${JSON.stringify({ exchangeFlight, outgoingStillInHand })}`);
    if (exchangeFlight.receivingAnchors !== 2 || exchangeFlight.hiddenRecipientBacks !== 2) {
      throw new Error(`${label}: opponent destination backs appeared before the transfer landed ${JSON.stringify(exchangeFlight)}`);
    }
    if (exchangeFlight.enabledHandCards !== 0 || exchangeFlight.decisionHeading === 'Ile ostatecznie grasz?') {
      throw new Error(`${label}: contract input became active before exchange materialized ${JSON.stringify(exchangeFlight)}`);
    }
    await screenshot(session, `${label}-exchange-transfer-flight`);

    const exchangeSettled = await waitFor(`${label}: exchange material settled`, async () => {
      const state = await inspectExchangeSettled(session);
      return state.state === 'settled'
        && state.transfers === 0
        && state.materialSlots === 0
        && state.receivingAnchors === 0
        && state.handCards === 8
        && state.decisionHeading === 'Ile ostatecznie grasz?'
        && state.numericButtons > 0
        && state.talonDisplay === 'none'
        ? state
        : false;
    }, 2_000);
    if (exchangeSettled.scrollWidth > exchangeSettled.width + 1) throw new Error(`${label}: exchange transfer introduced horizontal overflow ${JSON.stringify(exchangeSettled)}`);
    await screenshot(session, `${label}-exchange-transfer-settled`);

    return { label, talonFlight, talonSettled, firstDrop, firstDraft, secondDrop, secondDraft, exchangeFlight, exchangeSettled };
  } finally {
    await closeSession(session);
  }
}

async function runDefenderPrivacyViewport(label, width, height, mobile) {
  const session = await openScenario(width, height, mobile, 1);
  try {
    await waitFor(`${label}: human auction`, () => execute(session, `return document.querySelector('.decision-card h2')?.textContent?.trim() === 'Twoja licytacja';`));
    await clickButtonByText(session, 'Pas');

    await waitFor(`${label}: opponent talon material active`, () => execute(session, `return Boolean(document.querySelector('.material-talon-state.is-active'));`), 10_000);
    const opponentTalon = await waitFor(`${label}: opponent talon cards`, async () => {
      const state = await inspectTalonTransfer(session);
      return state.visibleTransferCards === 3 ? state : false;
    }, 500);
    if (opponentTalon.materialSlots.length !== 0 || opponentTalon.handCards !== 7 || opponentTalon.enabledHandCards !== 0) {
      throw new Error(`${label}: opponent talon transfer contaminated human hand ${JSON.stringify(opponentTalon)}`);
    }
    await screenshot(session, `${label}-opponent-talon-transfer-flight`);

    await waitFor(`${label}: opponent talon settled`, () => execute(session, `
      const marker = document.querySelector('.material-talon-state');
      const talon = document.querySelector('.talon');
      return marker?.getAttribute('data-talon-material-state') === 'settled' && talon && getComputedStyle(talon).display === 'none';
    `), 2_000);

    const privateFlight = await waitFor(`${label}: complete private exchange flight`, async () => {
      const state = await inspectExchangeTransfer(session);
      return state.state === 'active'
        && state.transfers === 2
        && state.faces === 0
        && state.backs === 2
        && state.knownCards.length === 1
        && state.materialSlots.length === 1
        && state.hiddenMaterialTargets === 1
        && state.receivingAnchors === 2
        && state.hiddenRecipientBacks === 1
        ? state
        : false;
    }, 5_000);
    if (privateFlight.state !== 'active' || privateFlight.transfers !== 2 || privateFlight.faces !== 0 || privateFlight.backs !== 2) {
      throw new Error(`${label}: defender saw exchange card faces ${JSON.stringify(privateFlight)}`);
    }
    if (privateFlight.knownCards.length !== 1 || privateFlight.materialSlots.length !== 1 || privateFlight.hiddenMaterialTargets !== 1) {
      throw new Error(`${label}: defender should know and materialize only its own received identity ${JSON.stringify(privateFlight)}`);
    }
    if (privateFlight.knownCards[0] !== privateFlight.materialSlots[0]) {
      throw new Error(`${label}: private received identity does not match exact hidden target ${JSON.stringify(privateFlight)}`);
    }
    if (privateFlight.receivingAnchors !== 2 || privateFlight.hiddenRecipientBacks !== 1) {
      throw new Error(`${label}: defender destination materiality is inconsistent ${JSON.stringify(privateFlight)}`);
    }
    await screenshot(session, `${label}-private-exchange-transfer-flight`);

    await waitFor(`${label}: private exchange settles`, async () => {
      const state = await inspectExchangeTransfer(session);
      return state.transfers === 0 && state.materialSlots.length === 0 && state.receivingAnchors === 0 && state.handCards === 8;
    }, 2_000);

    return { label, opponentTalon, privateFlight };
  } finally {
    await closeSession(session);
  }
}

await mkdir(OUTPUT, { recursive: true });
const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4197']);
const driver = startProcess('chromedriver', ['--port=9537']);

try {
  await waitFor('Vite material transfer server', async () => (await fetch(BASE_URL).catch(() => null))?.ok);
  await waitFor('ChromeDriver', async () => (await fetch(`${WEBDRIVER}/status`).catch(() => null))?.ok);
  const evidence = {
    desktop: {
      declarer: await runDeclarerViewport('desktop', 1440, 1000, false),
      defender: await runDefenderPrivacyViewport('desktop-defender', 1440, 1000, false),
    },
    mobile: {
      declarer: await runDeclarerViewport('mobile', 390, 844, true),
      defender: await runDefenderPrivacyViewport('mobile-defender', 390, 844, true),
    },
  };
  console.log('material transfer browser smoke: PASS');
  console.log(JSON.stringify(evidence, null, 2));
} catch (error) {
  console.error('material transfer browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  stopProcess(driver.child);
  stopProcess(vite.child);
}