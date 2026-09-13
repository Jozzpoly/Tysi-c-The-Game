import { spawnSync } from 'node:child_process';

const run = spawnSync(process.execPath, ['scripts/experience-workspace-reconcile-bench.mjs'], {
  cwd: process.cwd(),
  encoding: 'utf8',
  maxBuffer: 16 * 1024 * 1024,
});

if (run.status !== 0) {
  process.stderr.write(run.stderr || run.stdout);
  process.exit(run.status ?? 1);
}

let report;
try {
  report = JSON.parse(run.stdout);
} catch (error) {
  console.error('workspace reconcile bench check: invalid JSON output');
  console.error(error);
  process.exit(1);
}

const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
check(report.version === 1, `unexpected version ${report.version}`);

const rows = report.reports;
for (const row of rows.filter((candidate) => candidate.model === 'W1' || candidate.model === 'W2')) {
  check(row.survivorOrderBreaks === 0, `${row.model}/${row.transition}: survivor order broken`);
  check(row.survivorTopologyPreserved, `${row.model}/${row.transition}: survivor topology not preserved`);
}

for (const model of ['W1', 'W2']) {
  const legality = rows.find((row) => row.model === model && row.transition === 'legality-only revision');
  check(legality?.previous.join('|') === legality?.next.join('|'), `${model}: legality-only revision changed local topology`);
  const reconnect = rows.find((row) => row.model === model && row.transition === 'reconnect same membership');
  check(reconnect?.previous.join('|') === reconnect?.next.join('|'), `${model}: same-membership reconnect changed local topology`);
}

const w0Legality = rows.find((row) => row.model === 'W0' && row.transition === 'legality-only revision');
check(w0Legality && w0Legality.previous.join('|') !== w0Legality.next.join('|'), 'W0 baseline no longer demonstrates global reset disturbance');

const w1Receive = rows.find((row) => row.model === 'W1' && row.transition === 'received one card');
check(w1Receive?.newcomers?.[0]?.index === w1Receive.next.length - 1, 'W1 new card did not enter at intake edge');

const w2Receive = rows.find((row) => row.model === 'W2' && row.transition === 'received one card');
check(w2Receive?.newcomers?.[0]?.index !== w2Receive.next.length - 1, 'W2 new card did not exercise suggested insertion');

if (failures.length) {
  console.error(`workspace reconcile bench check: FAIL (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('workspace reconcile bench check: PASS');
console.log('W1/W2 preserve survivor topology across legality, remove, receive and same-membership reconnect probes.');
console.log('Reminder: preferred new-card intake policy and cognitive benefit still require later human evidence.');
