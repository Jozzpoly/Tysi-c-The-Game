import assert from 'node:assert/strict';
import {
  findWorkersDevUrl,
  sanitizeTemporaryDeployOutput,
} from './temporary-deploy-output.mjs';

const claimSecret = 'super-secret-claim-token';
const publicUrl = 'https://tysiac-the-game.preview-account.workers.dev';
const fixture = [
  '\u001b[32mTemporary account ready:\u001b[0m',
  `Claim URL: https://dash.cloudflare.com/claim-preview?claimToken=${claimSecret}&source=wrangler`,
  `diagnostic claimToken=${claimSecret}`,
  'Uploaded tysiac-the-game',
  'Deployed tysiac-the-game triggers',
  `  ${publicUrl}`,
].join('\n');

const clean = sanitizeTemporaryDeployOutput(fixture);
assert.equal(clean.includes(claimSecret), false, 'claim token must not survive sanitization');
assert.equal(clean.includes('dash.cloudflare.com/claim-preview?'), false, 'claim URL must not survive sanitization');
assert.equal(clean.includes('[REDACTED_CLAIM_URL]'), true, 'claim URL should be visibly redacted');
assert.equal(clean.includes(publicUrl), true, 'public workers.dev URL must remain visible');
assert.equal(findWorkersDevUrl(fixture), publicUrl, 'public workers.dev URL should be extracted exactly');

console.log('temporary deploy output smoke: PASS');
