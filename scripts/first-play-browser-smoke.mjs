import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4178';
const WEBDRIVER = 'http://127.0.0.1:9520';
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

async function emulateViewport(session, width, height, mobile) {
  await cdp(session, 'Emulation.setDeviceMetricsOverride', {
    width, height, screenWidth: width, screenHeight: height, deviceScaleFactor: 1, mobile,
    positionX: 0, positionY: 0, dontSetVisibleSize: false,
  });
  await cdp(session, 'Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 });
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

async function clickButton(session, text) {
  return execute(session, `
    const button = [...document.querySelectorAll('button')]
      .find((node) => node.textContent?.trim() === ${JSON.stringify(text)} && !node.disabled);
    if (!button) return false;
    button.click();
    return true;
  `);
}

async function inspectGuide(session) {
  return execute(session, `
    const dialog = document.querySelector('.rules-dialog');
    const rect = dialog?.getBoundingClientRect();
    const contentRight = dialog ? dialog.getBoundingClientRect().left + dialog.clientWidth : 0;
    const overflowing = dialog
      ? [...dialog.querySelectorAll('*')]
          .map((node) => {
            const box = node.getBoundingClientRect();
            return {
              tag: node.tagName.toLowerCase(),
              className: typeof node.className === 'string' ? node.className : '',
              text: (node.textContent ?? '').trim().replace(/\\s+/g, ' ').slice(0, 80),
              left: Math.round(box.left * 10) / 10,
              right: Math.round(box.right * 10) / 10,
              width: Math.round(box.width * 10) / 10,
              scrollWidth: node.scrollWidth,
              clientWidth: node.clientWidth,
            };
          })
          .filter((entry) => entry.right > contentRight + 1 || entry.scrollWidth > entry.clientWidth + 1)
          .slice(0, 12)
      : [];
    return {
      exists: Boolean(dialog),
      text: dialog?.innerText ?? '',
      width: document.documentElement.clientWidth,
      innerWidth: window.innerWidth,
      visualWidth: window.visualViewport?.width ?? null,
      documentScrollWidth: document.documentElement.scrollWidth,
      dialogClientWidth: dialog?.clientWidth ?? 0,
      dialogScrollWidth: dialog?.scrollWidth ?? 0,
      dialogClientHeight: dialog?.clientHeight ?? 0,
      dialogScrollHeight: dialog?.scrollHeight ?? 0,
      top: rect?.top ?? null,
      bottom: rect?.bottom ?? null,
      overflowing,
    };
  `);
}

function assertGuide(label, guide, width, height) {
  if (!guide.exists) throw new Error(`${label}: rules dialog missing`);
  if (guide.width !== width || guide.innerWidth !== width || Math.round(guide.visualWidth ?? -1) !== width) {
    throw new Error(`${label}: viewport mismatch document=${guide.width} inner=${guide.innerWidth} visual=${guide.visualWidth}`);
  }
  if (guide.documentScrollWidth > width + 1) throw new Error(`${label}: page horizontal overflow ${guide.documentScrollWidth} > ${width}; descendants=${JSON.stringify(guide.overflowing)}`);
  if (guide.dialogScrollWidth > guide.dialogClientWidth + 1) throw new Error(`${label}: guide horizontal overflow ${guide.dialogScrollWidth} > ${guide.dialogClientWidth}; descendants=${JSON.stringify(guide.overflowing)}`);
  if (guide.top === null || guide.bottom === null || guide.top < -1 || guide.bottom > height + 1) {
    throw new Error(`${label}: guide bounds outside viewport top=${guide.top} bottom=${guide.bottom} height=${height}`);
  }
  for (const knowledge of [
    '1000 punktów',
    'A > 10 > K > Q > J > 9',
    'A=11 · 10=10 · K=4 · Q=3 · J=2 · 9=0',
    'Licytacja i musik',
    'Kontrakt i lewy',
    'Meldunek = punkty + atut',
    '♠ 40',
    '♥ 100',
    'Od 800 punktów',
  ]) {
    if (!guide.text.includes(knowledge)) throw new Error(`${label}: missing guide knowledge ${JSON.stringify(knowledge)}`);
  }
}

async function revision(session) {
  return execute(session, `
    const text = [...document.querySelectorAll('.footer span')]
      .map((node) => node.textContent?.trim() ?? '')
      .find((value) => /^rev \\d+$/.test(value));
    return text ? Number(text.slice(4)) : null;
  `);
}

async function runViewport(label, width, height, mobile) {
  const session = await createSession();
  try {
    await emulateViewport(session, width, height, mobile);

    await navigate(session, BASE_URL);
    await waitFor(`${label}: home help trigger`, () => execute(session, `return [...document.querySelectorAll('button')].some((node) => node.textContent?.trim() === 'Zasady w 60 sekund');`));
    const homeText = await execute(session, `return document.body?.innerText ?? '';`);
    for (const internalText of ['candidate slice', 'PLAYOK_3P_800_CANDIDATE', 'jawnym pinem profilu', 'unresolved rule probes']) {
      if (homeText.includes(internalText)) throw new Error(`${label}: internal research text leaked on home: ${internalText}`);
    }
    if (!await clickButton(session, 'Zasady w 60 sekund')) throw new Error(`${label}: cannot open home rules guide`);
    const homeGuide = await waitFor(`${label}: home guide`, async () => {
      const guide = await inspectGuide(session);
      return guide.exists ? guide : false;
    });
    assertGuide(`${label}: home guide`, homeGuide, width, height);
    await screenshot(session, `${label}-first-play-home-guide`);
    if (!await clickButton(session, 'Wracam do stołu')) throw new Error(`${label}: cannot close home rules guide`);
    await waitFor(`${label}: home guide closes`, () => execute(session, `return !document.querySelector('.rules-dialog');`));

    await navigate(session, `${BASE_URL}/?local=1&seed=2&seat=2`);
    const before = await waitFor(`${label}: actionable auction`, async () => {
      const state = await execute(session, `
        const heading = document.querySelector('.decision-card h2')?.textContent?.trim() ?? '';
        const context = document.querySelector('.decision-help')?.textContent?.trim() ?? '';
        const button = [...document.querySelectorAll('.topbar button')].find((node) => node.textContent?.trim() === 'Jak grać');
        return { heading, context, hasGuide: Boolean(button) };
      `);
      return state.heading === 'Twoja licytacja' && state.hasGuide ? state : false;
    }, 30_000);
    if (!before.context.includes('zobowiązanie punktowe') && !before.context.includes('obowiązkową stawkę 100')) {
      throw new Error(`${label}: auction context does not explain the decision: ${JSON.stringify(before.context)}`);
    }
    const revisionBefore = await revision(session);
    if (revisionBefore === null) throw new Error(`${label}: revision missing before guide`);
    if (!await clickButton(session, 'Jak grać')) throw new Error(`${label}: cannot open table rules guide`);
    const tableGuide = await waitFor(`${label}: table guide`, async () => {
      const guide = await inspectGuide(session);
      return guide.exists ? guide : false;
    });
    assertGuide(`${label}: table guide`, tableGuide, width, height);
    await sleep(650);
    const revisionDuring = await revision(session);
    if (revisionDuring !== revisionBefore) throw new Error(`${label}: opening guide mutated game revision ${revisionBefore} -> ${revisionDuring}`);
    await screenshot(session, `${label}-first-play-table-guide`);
    if (!await clickButton(session, 'Wracam do stołu')) throw new Error(`${label}: cannot close table rules guide`);
    await waitFor(`${label}: table guide closes`, () => execute(session, `return !document.querySelector('.rules-dialog');`));
    const after = await execute(session, `
      return {
        heading: document.querySelector('.decision-card h2')?.textContent?.trim() ?? '',
        enabled: document.querySelectorAll('.decision-card button:not(:disabled)').length,
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      };
    `);
    const revisionAfter = await revision(session);
    if (revisionAfter !== revisionBefore) throw new Error(`${label}: closing guide mutated game revision ${revisionBefore} -> ${revisionAfter}`);
    if (after.heading !== 'Twoja licytacja' || after.enabled < 1) throw new Error(`${label}: legal human decision did not survive guide close`);
    if (after.scrollWidth > after.width + 1) throw new Error(`${label}: table horizontal overflow ${after.scrollWidth} > ${after.width}`);

    return {
      homeGuideScrolls: homeGuide.dialogScrollHeight > homeGuide.dialogClientHeight,
      tableGuideScrolls: tableGuide.dialogScrollHeight > tableGuide.dialogClientHeight,
      revisionBefore,
      revisionAfter,
      auctionContext: before.context,
      enabledAfterClose: after.enabled,
    };
  } finally {
    await closeSession(session);
  }
}

await mkdir(OUTPUT, { recursive: true });
const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4178']);
const driver = startProcess('chromedriver', ['--port=9520']);

try {
  await waitFor('Vite first-play server', async () => {
    const response = await fetch(BASE_URL).catch(() => null);
    return response?.ok;
  });
  await waitFor('ChromeDriver', async () => {
    const response = await fetch(`${WEBDRIVER}/status`).catch(() => null);
    return response?.ok;
  });

  const evidence = {
    desktop: await runViewport('desktop', 1440, 1000, false),
    mobile: await runViewport('mobile', 390, 844, true),
  };
  console.log('first-play browser smoke: PASS');
  console.log(JSON.stringify(evidence, null, 2));
} catch (error) {
  console.error('first-play browser smoke: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  console.error('\n--- chromedriver output ---\n', driver.getOutput());
  throw error;
} finally {
  stopProcess(driver.child);
  stopProcess(vite.child);
}
