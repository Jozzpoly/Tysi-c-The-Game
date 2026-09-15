import { readFile } from 'node:fs/promises';

const workflow = await readFile('.github/workflows/deploy-foundation.yml', 'utf8');
const deploymentDoc = await readFile('docs/DEPLOYMENT.md', 'utf8');
const candidate = (await readFile('.github/deploy/stable-candidate.txt', 'utf8')).trim();

function requireMatch(label, source, pattern) {
  if (!pattern.test(source)) throw new Error(`${label}: required pattern missing: ${pattern}`);
}

function forbidMatch(label, source, pattern) {
  if (pattern.test(source)) throw new Error(`${label}: forbidden pattern present: ${pattern}`);
}

if (!/^[0-9a-f]{40}$/u.test(candidate)) {
  throw new Error(`stable candidate file must contain exactly one full lowercase Git SHA; got: ${candidate}`);
}

requireMatch(
  'stable retry trigger',
  workflow,
  /paths:\s*\n\s*- \.github\/deploy\/stable-candidate\.txt\s*\n\s*- \.github\/deploy\/stable-deploy-request\.txt/u,
);
requireMatch(
  'stable candidate authority',
  workflow,
  /CANDIDATE_SHA="\$\(tr -d '\[:space:\]' < \.github\/deploy\/stable-candidate\.txt\)"/u,
);
requireMatch('stable candidate authority', workflow, /ref:\s*\$\{\{ steps\.candidate\.outputs\.sha \}\}/u);
requireMatch('stable candidate provenance', workflow, /TYSIAC_BUILD_SHA:\$\{\{ steps\.candidate\.outputs\.sha \}\}/u);
requireMatch('stable candidate provenance', workflow, /TYSIAC_EXPECTED_SHA:\s*\$\{\{ steps\.candidate\.outputs\.sha \}\}/u);

const retryMarkerMentions = workflow.match(/stable-deploy-request\.txt/gu) ?? [];
if (retryMarkerMentions.length !== 1) {
  throw new Error(`stable retry marker must appear exactly once in the workflow trigger paths and nowhere in candidate-resolution logic; found ${retryMarkerMentions.length}`);
}

forbidMatch('stable retry candidate isolation', workflow, /CANDIDATE_SHA[^\n]*stable-deploy-request\.txt/u);
forbidMatch('stable retry candidate isolation', workflow, /stable-deploy-request\.txt[^\n]*CANDIDATE_SHA/u);
forbidMatch('stable retry candidate isolation', workflow, /cat[^\n]*stable-deploy-request\.txt/u);
forbidMatch('stable retry candidate isolation', workflow, /tr[^\n]*stable-deploy-request\.txt/u);

requireMatch('deployment authority', deploymentDoc, /stable-deploy-request\.txt/u);
requireMatch('deployment authority', deploymentDoc, /retry[^\n]*same[^\n]*candidate/iu);
requireMatch('deployment authority', deploymentDoc, /retry marker[^\n]*(?:must not|does not|never)[^\n]*candidate/iu);

console.log(`stable retry contract smoke: PASS candidate=${candidate}`);
