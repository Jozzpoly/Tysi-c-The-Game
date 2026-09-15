import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:4175';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function startProcess(command, args, options = {}) {
  const child = spawn(command, args, {
    detached: true,
    stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
    env: options.env ?? process.env,
  });
  let output = '';
  if (child.stdout) {
    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
      if (output.length > 24_000) output = output.slice(-24_000);
    });
  }
  if (child.stderr) {
    child.stderr.on('data', (chunk) => {
      output += chunk.toString();
      if (output.length > 24_000) output = output.slice(-24_000);
    });
  }
  return { child, getOutput: () => output };
}

function stopProcess(child) {
  if (!child?.pid || child.exitCode !== null) return;
  try { process.kill(-child.pid, 'SIGTERM'); }
  catch { try { child.kill('SIGTERM'); } catch {} }
}

async function waitForServer(timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const response = await fetch(BASE_URL).catch(() => null);
    if (response?.ok) return;
    await sleep(150);
  }
  throw new Error('local share-link Vite/Worker server did not become ready');
}

function runShareLinkSmoke() {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['scripts/public-share-link-smoke.mjs'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        TYSIAC_PUBLIC_URL: BASE_URL,
        TYSIAC_ALLOW_LOCAL_HTTP: '1',
      },
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`local exact share-link smoke exited with code ${code}`));
    });
  });
}

const vite = startProcess('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4175']);

try {
  await waitForServer();
  await runShareLinkSmoke();
  console.log('local exact share-link rehearsal: PASS');
} catch (error) {
  console.error('local exact share-link rehearsal: FAIL');
  console.error(error);
  console.error('\n--- vite output ---\n', vite.getOutput());
  throw error;
} finally {
  stopProcess(vite.child);
}
