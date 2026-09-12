import { appendFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import {
  findWorkersDevUrl,
  sanitizeTemporaryDeployOutput,
} from './temporary-deploy-output.mjs';

function temporaryEnvironment() {
  const env = { ...process.env };
  for (const name of [
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_API_KEY',
    'CLOUDFLARE_EMAIL',
  ]) {
    delete env[name];
  }
  return env;
}

function deployTemporary() {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['wrangler', 'deploy', '--temporary'], {
      env: temporaryEnvironment(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';
    const collect = (chunk) => {
      output += chunk.toString();
      if (output.length > 120_000) output = output.slice(-120_000);
    };

    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, output }));
  });
}

const { code, output } = await deployTemporary();
const clean = sanitizeTemporaryDeployOutput(output);

if (code !== 0) {
  console.error('Temporary Cloudflare deployment failed. Sanitized Wrangler output follows:');
  console.error(clean);
  process.exit(code || 1);
}

const deploymentUrl = findWorkersDevUrl(output);
if (!deploymentUrl) {
  console.error('Temporary Cloudflare deployment succeeded but no public workers.dev URL was found.');
  console.error(clean);
  process.exit(1);
}

if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, `deployment_url=${deploymentUrl}\n`, 'utf8');
}

if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(
    process.env.GITHUB_STEP_SUMMARY,
    `### Temporary Cloudflare Foundation preview\n${deploymentUrl}\n\nThis preview is intentionally unclaimed and should expire automatically.\n`,
    'utf8',
  );
}

console.log(`temporary Cloudflare deploy: PASS ${deploymentUrl}`);
