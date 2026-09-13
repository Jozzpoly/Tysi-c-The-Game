import { spawnSync } from 'node:child_process';

const run = spawnSync(process.execPath, ['scripts/experience-scene-plan-bench.mjs'], {
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
  console.error('scene plan check: invalid JSON output');
  console.error(error);
  process.exit(1);
}

const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(report.version === 1, `unexpected version ${report.version}`);

for (const { winner, plan } of report.closures ?? []) {
  check(plan.kind === 'trick-closure', `winner ${winner}: expected trick closure`);
  check(plan.winner === winner, `winner ${winner}: canonical winner drift`);

  const collect = plan.beats.find((beat) => beat.type === 'collect');
  const value = plan.beats.find((beat) => beat.type === 'captured-value');
  const initiative = plan.beats.find((beat) => beat.type === 'initiative');

  check(collect?.to === `captured:${winner}`, `winner ${winner}: wrong collection destination`);
  check(value?.to === `captured-value:${winner}`, `winner ${winner}: wrong captured-value destination`);
  check(value?.after - value?.before === plan.points, `winner ${winner}: captured-value delta does not match canonical trick points`);
  check(initiative?.to === `initiative:${winner}`, `winner ${winner}: wrong initiative destination`);
  check(
    !plan.beats.some((beat) => String(beat.to ?? '').startsWith('score:')),
    `winner ${winner}: ordinary trick incorrectly targets persistent match score`,
  );
}

check(report.playOnly?.kind === 'play-only', 'play-only event sequence should remain play-only');
check(
  !report.playOnly?.beats?.some((beat) => ['collect', 'captured-value', 'initiative'].includes(beat.type)),
  'play-only event sequence invented trick-completion consequences',
);

if (failures.length) {
  console.error(`scene plan check: FAIL (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('scene plan check: PASS');
console.log('All winner directions map collection/value/initiative to canonical winner anchors.');
console.log('Ordinary trick points target captured-value, never persistent match-score.');
console.log('Play-only events do not invent trick-completion consequences.');
console.log('Reminder: this validates semantic causality only; it does not validate choreography, timing, visual quality or comprehension.');
