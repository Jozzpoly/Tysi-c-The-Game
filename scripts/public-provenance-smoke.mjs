const RAW_BASE_URL = process.env.TYSIAC_PUBLIC_URL ?? '';
const BASE_URL = RAW_BASE_URL.replace(/\/+$/u, '');
const EXPECTED_SHA = process.env.TYSIAC_EXPECTED_SHA ?? '';
const EXPECTED_CLASS = process.env.TYSIAC_EXPECTED_DEPLOY_CLASS ?? '';

if (!/^https:\/\//u.test(BASE_URL)) throw new Error('TYSIAC_PUBLIC_URL must be an https:// deployment URL');
if (!/^[0-9a-f]{40}$/u.test(EXPECTED_SHA)) throw new Error('TYSIAC_EXPECTED_SHA must be a full 40-character git SHA');
if (EXPECTED_CLASS !== 'stable' && EXPECTED_CLASS !== 'temporary') {
  throw new Error('TYSIAC_EXPECTED_DEPLOY_CLASS must be stable or temporary');
}

const response = await fetch(`${BASE_URL}/api/match?__provenance=${Date.now()}`, {
  cache: 'no-store',
  headers: { 'cache-control': 'no-cache' },
});
if (!response.ok) throw new Error(`public provenance health failed: HTTP ${response.status}`);

const body = await response.json();
if (body?.service !== 'match-room') throw new Error(`unexpected public service: ${JSON.stringify(body)}`);
if (body?.buildSha !== EXPECTED_SHA) {
  throw new Error(`public build SHA mismatch: expected ${EXPECTED_SHA}, got ${String(body?.buildSha)}`);
}
if (body?.deployClass !== EXPECTED_CLASS) {
  throw new Error(`public deploy class mismatch: expected ${EXPECTED_CLASS}, got ${String(body?.deployClass)}`);
}

console.log('public provenance smoke: PASS');
console.log(JSON.stringify({
  baseUrl: BASE_URL,
  buildSha: body.buildSha,
  deployClass: body.deployClass,
}, null, 2));
