import { readFile } from 'node:fs/promises';

async function text(path) {
  return readFile(path, 'utf8');
}

function requireMatch(label, source, pattern) {
  if (!pattern.test(source)) throw new Error(`${label}: required pattern missing: ${pattern}`);
}

function forbidMatch(label, source, pattern) {
  if (pattern.test(source)) throw new Error(`${label}: forbidden pattern present: ${pattern}`);
}

const [stable, temporary, temporaryDeploy, deploymentDoc, incident] = await Promise.all([
  text('.github/workflows/deploy-foundation.yml'),
  text('.github/workflows/temporary-foundation.yml'),
  text('scripts/temporary-deploy.mjs'),
  text('docs/DEPLOYMENT.md'),
  text('docs/INCIDENT_2026-09-15_FRIEND_LINK.md'),
]);

requireMatch('stable workflow', stable, /^name: Stable Multiplayer Deploy$/mu);
requireMatch('stable workflow', stable, /CLOUDFLARE_ACCOUNT_ID/u);
requireMatch('stable workflow', stable, /CLOUDFLARE_API_TOKEN/u);
requireMatch('stable workflow', stable, /command:\s*deploy/u);
requireMatch('stable workflow', stable, /public-deploy-smoke\.mjs/u);
requireMatch('stable workflow', stable, /public-share-link-smoke\.mjs/u);
requireMatch('stable workflow', stable, /account-owned/u);
forbidMatch('stable workflow', stable, /deploy\s+--temporary/u);
forbidMatch('stable workflow', stable, /temporary-deploy\.mjs/u);

requireMatch('temporary workflow', temporary, /^name: Temporary Preview \(EXPIRES — DO NOT SHARE\)$/mu);
requireMatch('temporary workflow', temporary, /temporary-deploy\.mjs/u);
requireMatch('temporary workflow', temporary, /DO NOT send this URL to a friend/u);
forbidMatch('temporary workflow', temporary, /secrets\.CLOUDFLARE_API_TOKEN/u);
forbidMatch('temporary workflow', temporary, /secrets\.CLOUDFLARE_ACCOUNT_ID/u);

requireMatch('temporary deploy helper', temporaryDeploy, /'--temporary'/u);
requireMatch('temporary deploy helper', temporaryDeploy, /should expire automatically/u);

requireMatch('deployment authority', deploymentDoc, /temporary.*not.*friend/isu);
requireMatch('deployment authority', deploymentDoc, /Stable Multiplayer Deploy/u);
requireMatch('deployment authority', deploymentDoc, /real second human/iu);
requireMatch('incident authority', incident, /FAIL \/ NOT COMPLETE \/ P0 BLOCKER/u);
requireMatch('incident authority', incident, /Automated smoke tests are necessary but are not sufficient for PASS/u);

console.log('deployment contract smoke: PASS');
