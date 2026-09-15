import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4207';
const WEBDRIVER = 'http://127.0.0.1:9547';
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
  const capture = (chunk) => { output = `${output}${chunk.toString()}`.slice(-16_000); };
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

async function clickButtonByText(session, text) {
  const clicked = await execute(session, `
    const button = [...document.querySelectorAll('button')].find((node) => node.textContent?.trim() === ${JSON.stringify(text)} && !node.disabled);
    if (!button) return false;
    button.click();
    return true;
  `);
  if (!clicked) throw new Error(`enabled button not found: ${text}`);
}

async function clickNumericDecision(session, highest) {
  const value = await execute(session, `
    const candidates = [...document.querySelectorAll('.decision-card button:not(:disabled)')]
      .map((button) => ({ button, value: Number(button.textContent?.trim()) }))
      .filter((entry) => Number.isFinite(entry.value))
      .sort((a, b) => a.value - b.value);
    const chosen = ${highest ? 'candidates.at(-1)' : 'candidates[0]'};
    if (!chosen) return null;
    chosen.button.click();
    return chosen.value;
  `);
  if (value === null) throw new Error(`numeric decision missing (${highest ? 'highest' : 'lowest'})`);
  return value;
}

async function clickFirstUnselectedHandCard(session) {
  const clicked = await execute(session, `
    const card = [...document.querySelectorAll('.hand .card:not(:disabled)')].find((node) => !node.classList.contains('selected'));
    if (!card) return false;
    card.click();
    return true;
  `);
  if (!clicked) throw new Error('no unselected enabled hand card');
}

async function decisionHeading(session) {
  return execute(session, `return document.querySelector('.decision-card h2')?.textContent?.trim() ?? '';`);
}

async function driveToExchange(session, label) {
  for (let round = 0; round < 10; round += 1) {
    const heading = await waitFor(`${label}: auction/exchange decision`, async () => {
      const value = await decisionHeading(session);
      return value === 'Twoja licytacja' || value === 'Oddaj po jednej karcie' ? value : false;
    });
    if (heading === 'Oddaj po jednej karcie') return;
    await clickNumericDecision(session, true);
  }
  throw new Error(`${label}: exchange not reached in bounded auction loop`);
}

async function driveToMarriageLead(session, label) {
  await driveToExchange(session, label);
  await clickFirstUnselectedHandCard(session);
  await waitFor(`${label}: first exchange selection`, () => execute(session, `return document.querySelectorAll('.hand .card.selected').length === 1;`));
  await clickFirstUnselectedHandCard(session);
  await waitFor(`${label}: second exchange selection`, () => execute(session, `return document.querySelectorAll('.hand .card.selected').length === 2;`));
  await clickButtonByText(session, 'Potwierdź wymianę');
  await waitFor(`${label}: contract`, async () => (await decisionHeading(session)) === 'Ile ostatecznie grasz?');
  await clickNumericDecision(session, false);
  return waitFor(`${label}: marriage lead`, () => execute(session, `
    const buttons = [...document.querySelectorAll('.decision-card button:not(:disabled)')];
    const marriage = buttons.find((node) => node.textContent?.trim().startsWith('Melduj '));
    if (!marriage) return '';
    return marriage.textContent?.trim() ?? '';
  `));
}

async function inspectBefore(session) {
  return execute(session, `
    const labels = [...document.querySelectorAll('.decision-card button:not(:disabled)')]
      .map((node) => node.textContent?.trim() ?? '')
      .filter((text) => text.startsWith('Melduj '));
    return {
      labels,
      handCards: document.querySelectorAll('.hand .card').length,
      trump: document.querySelector('.status-strip > span:nth-child(3) strong')?.textContent?.trim() ?? '',
      materialLayer: document.querySelectorAll('.marriage-material-layer').length,
      state: document.querySelector('.material-marriage-state')?.getAttribute('data-marriage-material-state') ?? 'missing',
    };
  `);
}

async function inspectActive(session) {
  return execute(session, `
    const visible = (node) => {
      if (!node) return false;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > .02 && rect.width > 1 && rect.height > 1;
    };
    const layer = document.querySelector('.marriage-material-layer');
    const cards = [...document.querySelectorAll('.marriage-material-card')];
    const cue = document.querySelector('.marriage-trump-cue');
    const played = document.querySelector('.played.is-marriage-materializing');
    const playedCard = played?.querySelector(':scope > .card');
    const partnerSlot = document.querySelector('.hand-slot.is-marriage-materializing');
    const partnerCard = partnerSlot?.querySelector(':scope > .card');
    const trumpStatus = document.querySelector('.status-strip > span:nth-child(3)');
    const trumpValue = trumpStatus?.querySelector('strong');
    const sourceSeat = layer?.getAttribute('data-marriage-source-seat') ?? '';
    const source = sourceSeat ? document.querySelector('[data-seat-anchor="' + sourceSeat + '"]') : null;
    return {
      state: document.querySelector('.material-marriage-state')?.getAttribute('data-marriage-material-state') ?? 'missing',
      stateMode: document.querySelector('.material-marriage-state')?.getAttribute('data-marriage-material-mode') ?? '',
      stateSeat: document.querySelector('.material-marriage-state')?.getAttribute('data-marriage-material-seat') ?? '',
      layer: Boolean(layer),
      mode: layer?.getAttribute('data-marriage-mode') ?? '',
      sourceSeat,
      originActive: source?.classList.contains('is-marriage-origin') ?? false,
      sourceBacks: source?.querySelectorAll('.card-backs i').length ?? 0,
      materialCount: cards.length,
      visibleMaterialCards: cards.filter(visible).length,
      roles: cards.map((node) => node.getAttribute('data-marriage-role')),
      identities: cards.map((node) => node.getAttribute('data-marriage-card')),
      playedIdentity: layer?.getAttribute('data-marriage-played') ?? '',
      partnerIdentity: layer?.getAttribute('data-marriage-partner') ?? '',
      suit: layer?.getAttribute('data-marriage-suit') ?? '',
      cuePresent: Boolean(cue),
      cueSuit: cue?.getAttribute('data-marriage-trump') ?? '',
      cueVisible: visible(cue),
      playedTargetHidden: Boolean(playedCard) && getComputedStyle(playedCard).visibility === 'hidden',
      partnerTargetHidden: Boolean(partnerCard) && getComputedStyle(partnerCard).visibility === 'hidden',
      localMaterializingSlots: document.querySelectorAll('.hand-slot.is-marriage-materializing').length,
      trumpTargetReceiving: trumpStatus?.classList.contains('is-marriage-receiving') ?? false,
      trumpValueHidden: Boolean(trumpValue) && getComputedStyle(trumpValue).visibility === 'hidden',
      enabledDecisionButtons: document.querySelectorAll('.decision-card button:not(:disabled)').length,
      handCards: document.querySelectorAll('.hand .card').length,
      scrollWidth: document.documentElement.scrollWidth,
      width: document.documentElement.clientWidth,
    };
  `);
}

async function inspectSettled(session, playedIdentity, partnerIdentity, sourceSeat = '') {
  return execute(session, `
    const playedIdentity = ${JSON.stringify(playedIdentity)};
    const partnerIdentity = ${JSON.stringify(partnerIdentity)};
    const sourceSeat = ${JSON.stringify(sourceSeat)};
    const played = document.querySelector('.played[data-card="' + playedIdentity + '"] > .card');
    const partner = document.querySelector('.hand-slot[data-card="' + partnerIdentity + '"] > .card');
    const source = sourceSeat ? document.querySelector('[data-seat-anchor="' + sourceSeat + '"]') : null;
    return {
      state: document.querySelector('.material-marriage-state')?.getAttribute('data-marriage-material-state') ?? 'missing',
      mode: document.querySelector('.material-marriage-state')?.getAttribute('data-marriage-material-mode') ?? '',
      materialLayer: document.querySelectorAll('.marriage-material-layer').length,
      materialCards: document.querySelectorAll('.marriage-material-card').length,
      materializingTargets: document.querySelectorAll('.is-marriage-materializing').length,
      receivingTargets: document.querySelectorAll('.is-marriage-receiving').length,
      originActive: source?.classList.contains('is-marriage-origin') ?? false,
      handCards: document.querySelectorAll('.hand .card').length,
      playedVisible: Boolean(played) && getComputedStyle(played).visibility !== 'hidden',
      partnerVisible: Boolean(partner) && getComputedStyle(partner).visibility !== 'hidden',
      trump: document.querySelector('.status-strip > span:nth-child(3) strong')?.textContent?.trim() ?? '',
      scrollWidth: document.documentElement.scrollWidth,
      width: document.documentElement.clientWidth,
    };
  `);
}

async function openScenario(width, height, mobile, seed = 2) {
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

async function runLocalViewport(label, width, height, mobile) {
  const session = await openScenario(width, height, mobile, 2);
  try {
    const marriageLabel = await driveToMarriageLead(session, label);
    const before = await inspectBefore(session);
    if (before.handCards !== 8 || before.labels.length < 2 || before.trump !== '—' || before.materialLayer !== 0) {
      throw new Error(`${label}: deterministic marriage lead precondition failed ${JSON.stringify(before)}`);
    }

    await clickButtonByText(session, marriageLabel);
    await waitFor(`${label}: marriage material active`, () => execute(session, `
      return document.querySelector('.material-marriage-state')?.getAttribute('data-marriage-material-state') === 'active'
        && document.querySelector('.material-marriage-state')?.getAttribute('data-marriage-material-mode') === 'local'
        && document.querySelectorAll('.marriage-material-card').length === 2;
    `), 1_500);
    await sleep(120);

    const pair = await inspectActive(session);
    if (pair.state !== 'active' || pair.mode !== 'local' || !pair.layer || pair.materialCount !== 2 || pair.visibleMaterialCards !== 2 || !pair.cuePresent || pair.cueSuit !== pair.suit) {
      throw new Error(`${label}: marriage pair did not materialize ${JSON.stringify(pair)}`);
    }
    if (new Set(pair.roles).size !== 2 || !pair.roles.includes('played') || !pair.roles.includes('partner')) {
      throw new Error(`${label}: material pair roles are incomplete ${JSON.stringify(pair)}`);
    }
    if (new Set(pair.identities).size !== 2 || !pair.identities.includes(pair.playedIdentity) || !pair.identities.includes(pair.partnerIdentity)) {
      throw new Error(`${label}: material pair lost exact card identity ${JSON.stringify(pair)}`);
    }
    if (!pair.playedTargetHidden || !pair.partnerTargetHidden || !pair.trumpTargetReceiving || !pair.trumpValueHidden) {
      throw new Error(`${label}: canonical duplicates or early trump remain visible ${JSON.stringify(pair)}`);
    }
    if (pair.enabledDecisionButtons !== 0 || pair.handCards !== 7) {
      throw new Error(`${label}: input/hand truth is wrong during marriage materialization ${JSON.stringify(pair)}`);
    }
    if (pair.scrollWidth > pair.width + 1) throw new Error(`${label}: marriage introduced horizontal overflow ${JSON.stringify(pair)}`);
    await screenshot(session, `${label}-marriage-pair`);

    const settled = await waitFor(`${label}: marriage material settled`, async () => {
      const state = await inspectSettled(session, pair.playedIdentity, pair.partnerIdentity);
      return state.materialLayer === 0
        && state.materialCards === 0
        && state.materializingTargets === 0
        && state.receivingTargets === 0
        && state.handCards === 7
        && state.playedVisible
        && state.partnerVisible
        && state.trump !== '—'
        ? state
        : false;
    }, 1_500);
    if (settled.scrollWidth > settled.width + 1) throw new Error(`${label}: settled marriage introduced overflow ${JSON.stringify(settled)}`);
    await screenshot(session, `${label}-marriage-settled`);

    const completed = await waitFor(`${label}: trick continues after marriage`, () => execute(session, `
      return document.querySelector('.trick-result')?.textContent?.includes('Lewa 1:') ?? false;
    `), 5_000);
    if (!completed) throw new Error(`${label}: table did not continue after marriage`);

    return { marriageLabel, before, pair, settled };
  } finally {
    await closeSession(session);
  }
}

async function runOpponentViewport(label, width, height, mobile) {
  const session = await openScenario(width, height, mobile, 1);
  try {
    await waitFor(`${label}: defender auction`, async () => (await decisionHeading(session)) === 'Twoja licytacja');
    await clickButtonByText(session, 'Pas');
    await waitFor(`${label}: opponent marriage material active`, () => execute(session, `
      const state = document.querySelector('.material-marriage-state');
      const layer = document.querySelector('.marriage-material-layer');
      return state?.getAttribute('data-marriage-material-state') === 'active'
        && state?.getAttribute('data-marriage-material-mode') === 'opponent'
        && layer?.getAttribute('data-marriage-mode') === 'opponent'
        && document.querySelectorAll('.marriage-material-card').length === 2;
    `), 20_000);
    await sleep(120);

    const pair = await inspectActive(session);
    if (pair.state !== 'active' || pair.stateMode !== 'opponent' || pair.mode !== 'opponent' || !pair.layer || pair.materialCount !== 2 || pair.visibleMaterialCards !== 2) {
      throw new Error(`${label}: opponent marriage did not materialize ${JSON.stringify(pair)}`);
    }
    if (pair.sourceSeat === '0' || pair.sourceSeat === '' || pair.stateSeat !== pair.sourceSeat || !pair.originActive || pair.sourceBacks < 1) {
      throw new Error(`${label}: opponent marriage lost truthful seat provenance ${JSON.stringify(pair)}`);
    }
    if (pair.suit !== 'diamonds' || pair.playedIdentity !== 'diamonds:Q' || pair.partnerIdentity !== 'diamonds:K') {
      throw new Error(`${label}: deterministic public marriage identity changed ${JSON.stringify(pair)}`);
    }
    if (!pair.cuePresent || pair.cueSuit !== pair.suit || !pair.playedTargetHidden || !pair.trumpTargetReceiving || !pair.trumpValueHidden) {
      throw new Error(`${label}: opponent marriage lost card/trump continuity ${JSON.stringify(pair)}`);
    }
    if (pair.localMaterializingSlots !== 0 || pair.handCards !== 8) {
      throw new Error(`${label}: opponent marriage touched private viewer hand geometry ${JSON.stringify(pair)}`);
    }
    if (pair.scrollWidth > pair.width + 1) throw new Error(`${label}: opponent marriage introduced horizontal overflow ${JSON.stringify(pair)}`);
    await screenshot(session, `${label}-opponent-marriage-pair`);

    const settled = await waitFor(`${label}: opponent marriage material settled`, async () => {
      const state = await inspectSettled(session, pair.playedIdentity, pair.partnerIdentity, pair.sourceSeat);
      return state.materialLayer === 0
        && state.materialCards === 0
        && state.materializingTargets === 0
        && state.receivingTargets === 0
        && !state.originActive
        && state.handCards === 8
        && state.playedVisible
        && state.trump === '♦'
        ? state
        : false;
    }, 1_500);
    if (settled.scrollWidth > settled.width + 1) throw new Error(`${label}: settled opponent marriage introduced overflow ${JSON.stringify(settled)}`);
    await waitFor(`${label}: human turn after opponent marriage`, async () => (await decisionHeading(session)) === 'Twój ruch', 3_000);
    await screenshot(session, `${label}-opponent-marriage-settled`);

    return { pair, settled };
  } finally {
    await closeSession(session);
  }
}

await mkdir(OUTPUT, { recursive: true });
const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4207']);
const driver = startProcess('chromedriver', ['--port=9547']);

try {
  await waitFor('Vite server', async () => {
    const response = await fetch(BASE_URL).catch(() => null);
    return response?.ok;
  }, 20_000);
  await waitFor('ChromeDriver', async () => {
    const response = await fetch(`${WEBDRIVER}/status`).catch(() => null);
    return response?.ok;
  }, 20_000);

  const evidence = {
    local: {
      desktop: await runLocalViewport('desktop-marriage', 1440, 1000, false),
      mobile: await runLocalViewport('mobile-marriage', 390, 844, true),
    },
    opponent: {
      desktop: await runOpponentViewport('desktop-opponent-marriage', 1440, 1000, false),
      mobile: await runOpponentViewport('mobile-opponent-marriage', 390, 844, true),
    },
  };
  console.log('material marriage browser smoke: PASS');
  console.log(JSON.stringify(evidence, null, 2));
} catch (error) {
  console.error('material marriage browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  stopProcess(driver.child);
  stopProcess(vite.child);
}
