import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4187';
const WEBDRIVER = 'http://127.0.0.1:9529';
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
    await sleep(100);
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
  try { process.kill(-child.pid, 'SIGTERM'); }
  catch { try { child.kill('SIGTERM'); } catch {} }
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
            args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--window-size=390,844'],
          },
        },
      },
    }),
  });
  return value.sessionId ?? value['sessionId'];
}

async function cdp(session, cmd, params = {}) {
  return webdriver(`/session/${session}/goog/cdp/execute`, {
    method: 'POST',
    body: JSON.stringify({ cmd, params }),
  });
}

async function execute(session, script) {
  return webdriver(`/session/${session}/execute/sync`, {
    method: 'POST',
    body: JSON.stringify({ script, args: [] }),
  });
}

async function navigate(session, url) {
  await webdriver(`/session/${session}/url`, { method: 'POST', body: JSON.stringify({ url }) });
}

async function closeSession(session) {
  if (!session) return;
  try { await webdriver(`/session/${session}`, { method: 'DELETE' }); } catch {}
}

const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4187']);
const driver = startProcess('chromedriver', ['--port=9529']);
let session;

try {
  await waitFor('Vite dev server', async () => (await fetch(BASE_URL).catch(() => null))?.ok);
  await waitFor('ChromeDriver', async () => (await fetch(`${WEBDRIVER}/status`).catch(() => null))?.ok);

  session = await createSession();
  await cdp(session, 'Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    screenWidth: 390,
    screenHeight: 844,
    deviceScaleFactor: 1,
    mobile: true,
    positionX: 0,
    positionY: 0,
    dontSetVisibleSize: false,
  });
  await cdp(session, 'Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

  await navigate(session, `${BASE_URL}?seed=1&perf=0`);
  await waitFor('normal page', () => execute(session, `return document.title === 'Tysiąc The Game';`));
  const normal = await execute(session, `return {
    panel: Boolean(document.querySelector('[data-performance-probe]')),
    report: typeof window.__tysiacPerfReport,
    reportText: typeof window.__tysiacPerfReportText,
  };`);
  if (normal.panel || normal.report !== 'undefined' || normal.reportText !== 'undefined') {
    throw new Error(`normal URL installed performance probe ${JSON.stringify(normal)}`);
  }

  await navigate(session, `${BASE_URL}?seed=1&perf=1`);
  await waitFor('performance probe enabled', () => execute(session, `return Boolean(
    document.querySelector('[data-performance-probe="enabled"]')
    && typeof window.__tysiacPerfReport === 'function'
    && typeof window.__tysiacPerfReportText === 'function'
  );`));

  await sleep(450);
  for (let index = 0; index < 5; index += 1) {
    await execute(session, `document.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true,
      pointerType: 'touch',
      clientX: ${60 + index * 12},
      clientY: ${700 - index * 8},
    })); return true;`);
    await sleep(35);
  }
  await sleep(450);

  const measured = await execute(session, `return {
    report: window.__tysiacPerfReport(),
    text: window.__tysiacPerfReportText(),
    copyButton: Boolean(document.querySelector('[data-performance-probe-copy]')),
    resetButton: Boolean(document.querySelector('[data-performance-probe-reset]')),
  };`);

  if (measured.report?.version !== 1) throw new Error(`unexpected probe report ${JSON.stringify(measured)}`);
  if (measured.report.frames.samples < 10) throw new Error(`probe did not collect frame samples ${JSON.stringify(measured.report.frames)}`);
  if (measured.report.inputToFrame.samples < 1) throw new Error(`probe did not collect input latency ${JSON.stringify(measured.report.inputToFrame)}`);
  if (measured.report.device.viewportWidth !== 390 || measured.report.device.viewportHeight !== 844) {
    throw new Error(`probe recorded wrong mobile viewport ${JSON.stringify(measured.report.device)}`);
  }
  if (Object.values(measured.report.scenarios).reduce((sum, count) => sum + count, 0) < 1) {
    throw new Error(`probe did not collect scenario samples ${JSON.stringify(measured.report.scenarios)}`);
  }
  if (!measured.text.startsWith('TYSIAC_PERF_V1\n') || !measured.copyButton || !measured.resetButton) {
    throw new Error(`probe report surface incomplete ${JSON.stringify(measured)}`);
  }

  await execute(session, `document.querySelector('[data-performance-probe-reset]')?.click(); return true;`);
  await sleep(80);
  const reset = await execute(session, `return window.__tysiacPerfReport();`);
  if (reset.elapsedMs > 500) throw new Error(`probe reset did not reset elapsed window ${JSON.stringify(reset)}`);

  await navigate(session, `${BASE_URL}?seed=1&perf=0`);
  await waitFor('performance probe disabled after explicit opt-out', () => execute(session, `return document.title === 'Tysiąc The Game' && !document.querySelector('[data-performance-probe]');`));
  const disabled = await execute(session, `return {
    report: typeof window.__tysiacPerfReport,
    sessionValue: sessionStorage.getItem('tysiac:performance-probe'),
  };`);
  if (disabled.report !== 'undefined' || disabled.sessionValue !== null) {
    throw new Error(`explicit perf opt-out did not disable probe ${JSON.stringify(disabled)}`);
  }

  console.log('performance probe browser smoke: PASS');
  console.log(JSON.stringify({ normal, measured: measured.report, reset }, null, 2));
} catch (error) {
  console.error('performance probe browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  await closeSession(session);
  stopProcess(driver.child);
  stopProcess(vite.child);
}
