import { access, readFile } from 'node:fs/promises';

async function text(path) {
  return readFile(path, 'utf8');
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function requireMatch(label, source, pattern) {
  if (!pattern.test(source)) throw new Error(`${label}: required pattern missing: ${pattern}`);
}

function forbidMatch(label, source, pattern) {
  if (pattern.test(source)) throw new Error(`${label}: forbidden pattern present: ${pattern}`);
}

const [
  stable,
  temporary,
  recheck,
  coreWorkflow,
  temporaryDeploy,
  wrangler,
  worker,
  deploymentDoc,
  incident,
  executionState,
  legacyStaticPreviewExists,
] = await Promise.all([
  text('.github/workflows/deploy-foundation.yml'),
  text('.github/workflows/temporary-foundation.yml'),
  text('.github/workflows/stable-origin-recheck.yml'),
  text('.github/workflows/core.yml'),
  text('scripts/temporary-deploy.mjs'),
  text('wrangler.jsonc'),
  text('worker/index.ts'),
  text('docs/DEPLOYMENT.md'),
  text('docs/INCIDENT_2026-09-15_FRIEND_LINK.md'),
  text('docs/EXECUTION_STATE.md'),
  exists('.github/workflows/friend-preview-pages.yml'),
]);

requireMatch('stable workflow', stable, /^name: Stable Multiplayer Deploy$/mu);
requireMatch('stable workflow', stable, /CLOUDFLARE_ACCOUNT_ID/u);
requireMatch('stable workflow', stable, /CLOUDFLARE_API_TOKEN/u);
requireMatch('stable workflow', stable, /command:\s*deploy/u);
requireMatch('stable workflow', stable, /TYSIAC_BUILD_SHA:\$\{\{ github\.sha \}\}/u);
requireMatch('stable workflow', stable, /TYSIAC_DEPLOY_CLASS:stable/u);
requireMatch('stable workflow', stable, /wrangler deployments list/u);
requireMatch('stable workflow', stable, /public-provenance-smoke\.mjs/u);
requireMatch('stable workflow', stable, /public-deploy-smoke\.mjs/u);
requireMatch('stable workflow', stable, /public-share-link-smoke\.mjs/u);
requireMatch('stable workflow', stable, /NOT YET PROVEN BY THIS RUN/u);
requireMatch('stable workflow', stable, /account-owned/u);
forbidMatch('stable workflow', stable, /deploy\s+--temporary/u);
forbidMatch('stable workflow', stable, /temporary-deploy\.mjs/u);

requireMatch('temporary workflow', temporary, /^name: Temporary Preview \(EXPIRES — DO NOT SHARE\)$/mu);
requireMatch('temporary workflow', temporary, /temporary-deploy\.mjs/u);
requireMatch('temporary workflow', temporary, /TYSIAC_EXPECTED_DEPLOY_CLASS:\s*temporary/u);
requireMatch('temporary workflow', temporary, /public-provenance-smoke\.mjs/u);
requireMatch('temporary workflow', temporary, /public-share-link-smoke\.mjs/u);
requireMatch('temporary workflow', temporary, /DO NOT SHARE AS THE FRIEND CANDIDATE/u);
forbidMatch('temporary workflow', temporary, /secrets\.CLOUDFLARE_API_TOKEN/u);
forbidMatch('temporary workflow', temporary, /secrets\.CLOUDFLARE_ACCOUNT_ID/u);

requireMatch('temporary deploy helper', temporaryDeploy, /'--temporary'/u);
requireMatch('temporary deploy helper', temporaryDeploy, /TYSIAC_BUILD_SHA/u);
requireMatch('temporary deploy helper', temporaryDeploy, /TYSIAC_DEPLOY_CLASS:temporary/u);
requireMatch('temporary deploy helper', temporaryDeploy, /should expire automatically/u);

requireMatch('stable recheck workflow', recheck, /^name: Stable Origin Recheck \(NO REDEPLOY\)$/mu);
requireMatch('stable recheck workflow', recheck, /ref:\s*\$\{\{ inputs\.expected_sha \}\}/u);
requireMatch('stable recheck workflow', recheck, /TYSIAC_EXPECTED_DEPLOY_CLASS:\s*stable/u);
requireMatch('stable recheck workflow', recheck, /public-provenance-smoke\.mjs/u);
requireMatch('stable recheck workflow', recheck, /public-deploy-smoke\.mjs/u);
requireMatch('stable recheck workflow', recheck, /public-share-link-smoke\.mjs/u);
forbidMatch('stable recheck workflow', recheck, /wrangler\s+deploy/u);
forbidMatch('stable recheck workflow', recheck, /cloudflare\/wrangler-action/u);

requireMatch('Foundation concurrency', coreWorkflow, /cancel-in-progress:\s*true/u);
requireMatch('Foundation concurrency', coreWorkflow, /github\.event\.pull_request\.number\s*\|\|\s*github\.ref/u);

if (legacyStaticPreviewExists) {
  throw new Error('legacy static friend-preview workflow must remain retired; it cannot provide multiplayer authority');
}

requireMatch('wrangler config', wrangler, /"workers_dev":\s*true/u);
requireMatch('wrangler config', wrangler, /"TYSIAC_BUILD_SHA":\s*"dev-unpinned"/u);
requireMatch('wrangler config', wrangler, /"TYSIAC_DEPLOY_CLASS":\s*"local"/u);
requireMatch('worker health provenance', worker, /buildSha:\s*env\.TYSIAC_BUILD_SHA/u);
requireMatch('worker health provenance', worker, /deployClass:\s*env\.TYSIAC_DEPLOY_CLASS/u);

requireMatch('deployment authority', deploymentDoc, /Temporary Preview — bounded diagnostics only/u);
requireMatch('deployment authority', deploymentDoc, /not acceptable as the Owner\/friend candidate origin/u);
requireMatch('deployment authority', deploymentDoc, /Stable Multiplayer Deploy/u);
requireMatch('deployment authority', deploymentDoc, /Exact copied friend invite/u);
requireMatch('deployment authority', deploymentDoc, /Long-horizon availability/u);
requireMatch('deployment authority', deploymentDoc, /Real-human friend gate/u);

requireMatch('incident authority', incident, /FAIL \/ NOT COMPLETE \/ P0 BLOCKER/u);
requireMatch('incident authority', incident, /Automation is necessary but is not sufficient/iu);
requireMatch('incident authority', incident, /contradictory lifecycle evidence was known/iu);
requireMatch('execution authority', executionState, /Friend-link incident OPEN \/ P0 BLOCKER/u);
requireMatch('execution authority', executionState, /Operations \/ external truth/u);

console.log('deployment contract smoke: PASS');
