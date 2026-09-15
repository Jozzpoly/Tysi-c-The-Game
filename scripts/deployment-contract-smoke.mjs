import { access, readFile } from 'node:fs/promises';

async function text(path) {
  return readFile(path, 'utf8');
}

async function exists(path) {
  try { await access(path); return true; }
  catch { return false; }
}

function requireMatch(label, source, pattern) {
  if (!pattern.test(source)) throw new Error(`${label}: required pattern missing: ${pattern}`);
}

function forbidMatch(label, source, pattern) {
  if (pattern.test(source)) throw new Error(`${label}: forbidden pattern present: ${pattern}`);
}

function requirePinnedUses(label, source) {
  const uses = [...source.matchAll(/^\s*(?:-\s*)?uses:\s+([^\s#]+)/gmu)];
  if (uses.length === 0) throw new Error(`${label}: expected at least one GitHub Action use`);
  for (const match of uses) {
    const action = match[1];
    const at = action.lastIndexOf('@');
    const revision = at >= 0 ? action.slice(at + 1) : '';
    if (!/^[0-9a-f]{40}$/u.test(revision)) {
      throw new Error(`${label}: action must be pinned to an immutable 40-character commit SHA: ${action}`);
    }
  }
}

const ACTION_PINS = Object.freeze({
  checkout: 'actions/checkout@11d5960a326750d5838078e36cf38b85af677262',
  setupNode: 'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020',
  uploadArtifact: 'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
  wrangler: 'cloudflare/wrangler-action@ebbaa1584979971c8614a24965b4405ff95890e0',
});

const [
  stable,
  temporary,
  recheck,
  coreWorkflow,
  temporaryDeploy,
  publicShareLink,
  localShareLink,
  packageJson,
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
  text('scripts/public-share-link-smoke.mjs'),
  text('scripts/local-share-link-browser-smoke.mjs'),
  text('package.json'),
  text('wrangler.jsonc'),
  text('worker/index.ts'),
  text('docs/DEPLOYMENT.md'),
  text('docs/INCIDENT_2026-09-15_FRIEND_LINK.md'),
  text('docs/EXECUTION_STATE.md'),
  exists('.github/workflows/friend-preview-pages.yml'),
]);

for (const [label, source] of [
  ['Foundation workflow', coreWorkflow],
  ['stable workflow', stable],
  ['stable recheck workflow', recheck],
  ['temporary workflow', temporary],
]) {
  requirePinnedUses(label, source);
}

for (const pin of [ACTION_PINS.checkout, ACTION_PINS.setupNode, ACTION_PINS.uploadArtifact]) {
  requireMatch('Foundation workflow action pins', coreWorkflow, new RegExp(pin.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
  requireMatch('temporary workflow action pins', temporary, new RegExp(pin.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
  requireMatch('stable recheck workflow action pins', recheck, new RegExp(pin.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
}
for (const pin of [ACTION_PINS.checkout, ACTION_PINS.setupNode, ACTION_PINS.uploadArtifact, ACTION_PINS.wrangler]) {
  requireMatch('stable workflow action pins', stable, new RegExp(pin.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
}

requireMatch('stable workflow', stable, /^name: Stable Multiplayer Deploy$/mu);
requireMatch('stable workflow', stable, /candidate_sha:/u);
requireMatch('stable workflow', stable, /push:\s*\n\s*branches:\s*\[main\][\s\S]*\.github\/deploy\/stable-candidate\.txt/u);
requireMatch('stable workflow', stable, /github\.event_name == 'push' \|\| inputs\.confirm/u);
requireMatch('stable workflow', stable, /Resolve exact candidate SHA/u);
requireMatch('stable workflow', stable, /stable-candidate\.txt/u);
requireMatch('stable workflow', stable, /TRIGGER_SOURCE="declarative-file"/u);
requireMatch('stable workflow', stable, /TRIGGER_SOURCE="workflow-dispatch"/u);
requireMatch('stable workflow', stable, /full 40-character lowercase git SHA/u);
requireMatch('stable workflow', stable, /ref:\s*\$\{\{ steps\.candidate\.outputs\.sha \}\}/u);
requireMatch('stable workflow', stable, /git rev-parse HEAD/u);
requireMatch('stable workflow', stable, /CLOUDFLARE_ACCOUNT_ID/u);
requireMatch('stable workflow', stable, /CLOUDFLARE_API_TOKEN/u);
requireMatch('stable workflow', stable, /command:\s*deploy/u);
requireMatch('stable workflow', stable, /TYSIAC_BUILD_SHA:\$\{\{ steps\.candidate\.outputs\.sha \}\}/u);
requireMatch('stable workflow', stable, /TYSIAC_EXPECTED_SHA:\s*\$\{\{ steps\.candidate\.outputs\.sha \}\}/u);
requireMatch('stable workflow', stable, /TYSIAC_DEPLOY_CLASS:stable/u);
requireMatch('stable workflow', stable, /wrangler deployments list/u);
requireMatch('stable workflow', stable, /Expected canonical account-owned workers\.dev root for tysiac-the-game/u);
requireMatch('stable workflow', stable, /Versioned preview URLs, foreign hosts, paths, query strings and fragments are not accepted/u);
requireMatch('stable workflow', stable, /public-provenance-smoke\.mjs/u);
requireMatch('stable workflow', stable, /public-deploy-smoke\.mjs/u);
requireMatch('stable workflow', stable, /public-share-link-smoke\.mjs/u);
requireMatch('stable workflow', stable, /NOT YET PROVEN BY THIS RUN/u);
requireMatch('stable workflow', stable, /account-owned/u);
forbidMatch('stable workflow', stable, /TYSIAC_BUILD_SHA:\$\{\{ github\.sha \}\}/u);
forbidMatch('stable workflow', stable, /deploy\s+--temporary/u);
forbidMatch('stable workflow', stable, /temporary-deploy\.mjs/u);
forbidMatch('stable workflow', stable, /TYSIAC_ALLOW_LOCAL_HTTP/u);

requireMatch('temporary workflow', temporary, /^name: Temporary Preview \(EXPIRES — DO NOT SHARE\)$/mu);
requireMatch('temporary workflow', temporary, /temporary-deploy\.mjs/u);
requireMatch('temporary workflow', temporary, /TYSIAC_EXPECTED_DEPLOY_CLASS:\s*temporary/u);
requireMatch('temporary workflow', temporary, /public-provenance-smoke\.mjs/u);
requireMatch('temporary workflow', temporary, /public-share-link-smoke\.mjs/u);
requireMatch('temporary workflow', temporary, /DO NOT SHARE AS THE FRIEND CANDIDATE/u);
forbidMatch('temporary workflow', temporary, /secrets\.CLOUDFLARE_API_TOKEN/u);
forbidMatch('temporary workflow', temporary, /secrets\.CLOUDFLARE_ACCOUNT_ID/u);
forbidMatch('temporary workflow', temporary, /TYSIAC_ALLOW_LOCAL_HTTP/u);

requireMatch('temporary deploy helper', temporaryDeploy, /'--temporary'/u);
requireMatch('temporary deploy helper', temporaryDeploy, /TYSIAC_BUILD_SHA/u);
requireMatch('temporary deploy helper', temporaryDeploy, /TYSIAC_DEPLOY_CLASS:temporary/u);
requireMatch('temporary deploy helper', temporaryDeploy, /should expire automatically/u);

requireMatch('stable recheck workflow', recheck, /^name: Stable Origin Recheck \(NO REDEPLOY\)$/mu);
requireMatch('stable recheck workflow', recheck, /push:\s*\n\s*branches:\s*\[main\][\s\S]*\.github\/deploy\/stable-recheck\.json/u);
requireMatch('stable recheck workflow', recheck, /github\.event_name == 'push' \|\| inputs\.confirm_no_redeploy/u);
requireMatch('stable recheck workflow', recheck, /Resolve canonical origin and exact candidate SHA/u);
requireMatch('stable recheck workflow', recheck, /stable-recheck\.json/u);
requireMatch('stable recheck workflow', recheck, /TRIGGER_SOURCE="declarative-file"/u);
requireMatch('stable recheck workflow', recheck, /TRIGGER_SOURCE="workflow-dispatch"/u);
requireMatch('stable recheck workflow', recheck, /origin must be the canonical tysiac-the-game\.<account>\.workers\.dev root/u);
requireMatch('stable recheck workflow', recheck, /full 40-character lowercase git SHA/u);
requireMatch('stable recheck workflow', recheck, /ref:\s*\$\{\{ steps\.target\.outputs\.sha \}\}/u);
requireMatch('stable recheck workflow', recheck, /git rev-parse HEAD/u);
requireMatch('stable recheck workflow', recheck, /TYSIAC_PUBLIC_URL:\s*\$\{\{ steps\.target\.outputs\.origin \}\}/u);
requireMatch('stable recheck workflow', recheck, /TYSIAC_EXPECTED_SHA:\s*\$\{\{ steps\.target\.outputs\.sha \}\}/u);
requireMatch('stable recheck workflow', recheck, /TYSIAC_EXPECTED_DEPLOY_CLASS:\s*stable/u);
requireMatch('stable recheck workflow', recheck, /public-provenance-smoke\.mjs/u);
requireMatch('stable recheck workflow', recheck, /public-deploy-smoke\.mjs/u);
requireMatch('stable recheck workflow', recheck, /public-share-link-smoke\.mjs/u);
requireMatch('stable recheck workflow', recheck, /without redeploying/u);
forbidMatch('stable recheck workflow', recheck, /wrangler\s+deploy/u);
forbidMatch('stable recheck workflow', recheck, /cloudflare\/wrangler-action/u);
forbidMatch('stable recheck workflow', recheck, /temporary-deploy\.mjs/u);
forbidMatch('stable recheck workflow', recheck, /TYSIAC_ALLOW_LOCAL_HTTP/u);

requireMatch('public share-link harness', publicShareLink, /TYSIAC_ALLOW_LOCAL_HTTP/u);
requireMatch('public share-link harness', publicShareLink, /BASE\.hostname === '127\.0\.0\.1'/u);
requireMatch('public share-link harness', publicShareLink, /HTTP is allowed only for explicit 127\.0\.0\.1 Foundation rehearsal/u);
requireMatch('public share-link harness', publicShareLink, /url\.origin !== base\.origin/u);
requireMatch('public share-link harness', publicShareLink, /friend invite must contain only room query parameter/u);
requireMatch('public share-link harness', publicShareLink, /friend invite leaked a seat credential/u);

requireMatch('local share-link wrapper', localShareLink, /http:\/\/127\.0\.0\.1:4175/u);
requireMatch('local share-link wrapper', localShareLink, /TYSIAC_PUBLIC_URL:\s*BASE_URL/u);
requireMatch('local share-link wrapper', localShareLink, /TYSIAC_ALLOW_LOCAL_HTTP:\s*'1'/u);
requireMatch('local share-link wrapper', localShareLink, /public-share-link-smoke\.mjs/u);
requireMatch('Foundation browser suite', packageJson, /test:browser[\s\S]*local-share-link-browser-smoke\.mjs/u);

requireMatch('Foundation concurrency', coreWorkflow, /cancel-in-progress:\s*true/u);
requireMatch('Foundation concurrency', coreWorkflow, /github\.event\.pull_request\.number\s*\|\|\s*github\.ref/u);

if (legacyStaticPreviewExists) throw new Error('legacy static friend-preview workflow must remain retired; it cannot provide multiplayer authority');

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
requireMatch('deployment authority', deploymentDoc, /exact.*candidate.*SHA/isu);
requireMatch('deployment authority', deploymentDoc, /canonical.*workers\.dev/isu);
requireMatch('deployment authority', deploymentDoc, /stable-candidate\.txt/u);
requireMatch('deployment authority', deploymentDoc, /stable-recheck\.json/u);
requireMatch('incident authority', incident, /FAIL \/ NOT COMPLETE \/ P0 BLOCKER/u);
requireMatch('incident authority', incident, /Automation is necessary but is not sufficient/iu);
requireMatch('incident authority', incident, /contradictory lifecycle evidence was known/iu);
requireMatch('execution authority', executionState, /Friend-link incident OPEN \/ P0 BLOCKER/u);
requireMatch('execution authority', executionState, /Operations \/ external truth/u);

console.log('deployment contract smoke: PASS');
