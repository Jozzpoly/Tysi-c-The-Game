import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4176';
const WEBDRIVER = 'http://127.0.0.1:9518';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(label, probe, timeoutMs = 25_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await probe();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(100);
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError}` : ''}`);
}

function startProcess(command, args) {
  let output = '';
  const child = spawn(command, args, { detached: true, stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
  const capture = (chunk) => {
    output += chunk.toString();
    if (output.length > 24_000) output = output.slice(-24_000);
  };
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
  return value.sessionId ?? value['sessionId'];
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

async function emulateViewport(session, width, height) {
  await cdp(session, 'Emulation.setDeviceMetricsOverride', {
    width,
    height,
    screenWidth: width,
    screenHeight: height,
    deviceScaleFactor: 1,
    mobile: false,
    positionX: 0,
    positionY: 0,
    dontSetVisibleSize: false,
  });
}

async function navigate(session, url) {
  await webdriver(`/session/${session}/url`, { method: 'POST', body: JSON.stringify({ url }) });
}

async function closeSession(session) {
  if (!session) return;
  try { await webdriver(`/session/${session}`, { method: 'DELETE' }); } catch {}
}

async function clickButton(session, text) {
  const clicked = await execute(session, `
    const button = [...document.querySelectorAll('button')].find((node) => node.textContent?.trim().startsWith(${JSON.stringify(text)}) && !node.disabled);
    if (!button) return false;
    button.click();
    return true;
  `);
  if (!clicked) throw new Error(`Enabled button ${text} not found`);
}

async function currentView(session) {
  return execute(session, `
    const revText = [...document.querySelectorAll('.footer span')]
      .map((node) => node.textContent?.trim() ?? '')
      .find((text) => /^rev \\d+$/.test(text));
    return {
      revision: revText ? Number(revText.slice(4)) : null,
      connection: document.querySelector('.connection-banner')?.textContent?.trim() ?? '',
      decision: document.querySelector('.decision-card h2')?.textContent?.trim() ?? '',
      enabledActions: document.querySelectorAll('.decision-card button:not(:disabled), .hand .card:not(:disabled)').length,
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    };
  `);
}

async function installTrace(session) {
  return execute(session, `
    window.__tysiacPlaybackTrace = [];
    let lastSignature = '';
    const sample = () => {
      const revText = [...document.querySelectorAll('.footer span')]
        .map((node) => node.textContent?.trim() ?? '')
        .find((text) => /^rev \\d+$/.test(text));
      const entry = {
        t: performance.now(),
        revision: revText ? Number(revText.slice(4)) : null,
        connection: document.querySelector('.connection-banner')?.textContent?.trim() ?? '',
        decision: document.querySelector('.decision-card h2')?.textContent?.trim() ?? '',
        enabledActions: document.querySelectorAll('.decision-card button:not(:disabled), .hand .card:not(:disabled)').length,
      };
      const signature = JSON.stringify([entry.revision, entry.connection, entry.decision, entry.enabledActions]);
      if (signature !== lastSignature) {
        lastSignature = signature;
        window.__tysiacPlaybackTrace.push(entry);
      }
    };
    const observer = new MutationObserver(sample);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true });
    window.__tysiacPlaybackObserver = observer;
    sample();
    return true;
  `);
}

async function readTrace(session) {
  return execute(session, `return window.__tysiacPlaybackTrace ?? [];`);
}

function firstEntryForRevision(trace, revision) {
  return trace.find((entry) => entry.revision === revision) ?? null;
}

let session;
const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4176']);
const driver = startProcess('chromedriver', ['--port=9518']);

try {
  await waitFor('Vite remote playback server', async () => {
    const response = await fetch(BASE_URL).catch(() => null);
    return response?.ok;
  });
  await waitFor('ChromeDriver', async () => {
    const response = await fetch(`${WEBDRIVER}/status`).catch(() => null);
    return response?.ok;
  });

  session = await createSession();
  await emulateViewport(session, 1440, 1000);
  await navigate(session, BASE_URL);
  await waitFor('home', () => execute(session, `return document.body?.innerText.includes('Usiądź do stołu') ?? false;`));
  await clickButton(session, 'Zagraj sam');

  const initial = await waitFor('solo human auction decision', async () => {
    const view = await currentView(session);
    return view.connection.includes('online') && view.decision === 'Twoja licytacja' && view.revision !== null ? view : false;
  });
  if (initial.width !== 1440 || initial.scrollWidth > initial.width + 1) {
    throw new Error(`initial remote layout invalid width=${initial.width} scrollWidth=${initial.scrollWidth}`);
  }

  await installTrace(session);
  await clickButton(session, 'Pas');

  const playbackStarted = await waitFor('playback starts', async () => {
    const view = await currentView(session);
    return view.revision > initial.revision && view.connection.includes('ruchy przy stole') ? view : false;
  });
  if (playbackStarted.enabledActions !== 0) {
    throw new Error(`input remained interactive during playback (${playbackStarted.enabledActions} enabled actions)`);
  }

  const final = await waitFor('playback drains to next human decision', async () => {
    const view = await currentView(session);
    return view.revision > playbackStarted.revision
      && !view.connection.includes('ruchy przy stole')
      && view.enabledActions > 0
      ? view
      : false;
  }, 20_000);

  const trace = await readTrace(session);
  const distinctRevisions = [...new Set(trace.map((entry) => entry.revision).filter((value) => Number.isInteger(value) && value > initial.revision))];
  if (distinctRevisions.length < 2) {
    throw new Error(`expected at least human + bot authoritative revisions, got ${JSON.stringify(distinctRevisions)}\ntrace=${JSON.stringify(trace)}`);
  }

  const firstRevision = distinctRevisions[0];
  const secondRevision = distinctRevisions[1];
  const firstEntry = firstEntryForRevision(trace, firstRevision);
  const secondEntry = firstEntryForRevision(trace, secondRevision);
  if (!firstEntry || !secondEntry) throw new Error('missing timestamped revision entries');
  const spacingMs = secondEntry.t - firstEntry.t;
  if (spacingMs < 350) {
    throw new Error(`authoritative revisions collapsed too quickly: ${spacingMs.toFixed(1)}ms\ntrace=${JSON.stringify(trace)}`);
  }
  if (!firstEntry.connection.includes('ruchy przy stole') || firstEntry.enabledActions !== 0) {
    throw new Error(`first paced frame was not visibly locked: ${JSON.stringify(firstEntry)}`);
  }
  if (final.width !== 1440 || final.scrollWidth > final.width + 1) {
    throw new Error(`final remote layout invalid width=${final.width} scrollWidth=${final.scrollWidth}`);
  }

  console.log('remote playback smoke: PASS');
  console.log(JSON.stringify({
    initialRevision: initial.revision,
    firstRevision,
    secondRevision,
    spacingMs,
    finalRevision: final.revision,
    finalDecision: final.decision,
    trace,
  }, null, 2));
} catch (error) {
  console.error('remote playback smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  await closeSession(session);
  stopProcess(driver.child);
  stopProcess(vite.child);
}
