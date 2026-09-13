import { spawnSync } from 'node:child_process';

const run = spawnSync(process.execPath, ['scripts/experience-hand-field-bench.mjs'], {
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
  console.error('experience hand-field bench check: invalid JSON output');
  console.error(error);
  process.exit(1);
}

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};
const nearZero = (value, epsilon = 1e-9) => Math.abs(value) <= epsilon;

assert(report.version === 2, `unexpected bench version ${report.version}`);
assert(Array.isArray(report.baseline) && report.baseline.length === 3, 'expected H0/H1/H2 baseline');
assert(Array.isArray(report.densitySweep) && report.densitySweep.length > 0, 'missing density sweep');

for (const row of [...report.baseline, ...report.densitySweep]) {
  for (const key of [
    'maxStepW',
    'inactiveDriftW',
    'jitterTotalVariationW',
    'returnWhileHeldErrorW',
    'cancelReleaseErrorW',
    'totalDisturbanceW',
  ]) {
    assert(Number.isFinite(row[key]), `${row.model}/${row.n}/${row.spacingW}: invalid ${key}`);
  }

  assert(row.inversions === 0, `${row.model}/${row.n}/${row.spacingW}: neighbor order inversion`);
  assert(
    row.cancelReleaseErrorW <= 1e-8,
    `${row.model}/${row.n}/${row.spacingW}: cancel/release failed to restore resting topology (${row.cancelReleaseErrorW})`,
  );
}

const byModel = Object.fromEntries(report.baseline.map((row) => [row.model, row]));
const h0 = byModel.H0;
const h1 = byModel.H1;
const h2 = byModel.H2;

assert(h0 && h1 && h2, 'missing baseline model');
if (h0 && h1 && h2) {
  assert(h0.maxStepW > 0.30, `H0 no longer represents a discrete threshold baseline (${h0.maxStepW})`);

  assert(h1.maxStepW < 0.02, `H1 local field is mechanically discontinuous (${h1.maxStepW})`);
  assert(nearZero(h1.inactiveDriftW, 1e-8), `H1 moved opposite inactive region (${h1.inactiveDriftW})`);
  assert(
    nearZero(h1.returnWhileHeldErrorW, 1e-8),
    `H1 should restore local resting topology when the held card returns to origin (${h1.returnWhileHeldErrorW})`,
  );

  assert(h2.maxStepW < 0.03, `H2 broad field is mechanically discontinuous (${h2.maxStepW})`);
  assert(h2.inactiveDriftW > 0.005, `H2 no longer expresses broad/global coupling (${h2.inactiveDriftW})`);
  assert(h2.inactiveDriftW < 0.15, `H2 global coupling escaped its intended bounded region (${h2.inactiveDriftW})`);
  assert(
    h2.returnWhileHeldErrorW > 0.005,
    `H2 no longer distinguishes returned-while-held from disengaged resting state (${h2.returnWhileHeldErrorW})`,
  );

  assert(
    h1.jitterTotalVariationW < h0.jitterTotalVariationW * 0.25,
    `H1 did not materially reduce threshold chatter (${h1.jitterTotalVariationW} vs ${h0.jitterTotalVariationW})`,
  );
}

if (failures.length) {
  console.error(`experience hand-field bench check: FAIL (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('experience hand-field bench check: PASS');
console.log(`H0 max step=${h0.maxStepW.toFixed(4)}W, boundary jitter TV=${h0.jitterTotalVariationW.toFixed(4)}W`);
console.log(`H1 max step=${h1.maxStepW.toFixed(4)}W, inactive drift=${h1.inactiveDriftW.toFixed(4)}W, jitter TV=${h1.jitterTotalVariationW.toFixed(4)}W`);
console.log(`H2 max step=${h2.maxStepW.toFixed(4)}W, inactive drift=${h2.inactiveDriftW.toFixed(4)}W, held-return residue=${h2.returnWhileHeldErrorW.toFixed(4)}W`);
console.log('Reminder: this validates mechanical field properties and state semantics only; it does not validate workspace cognition, feel, attention, or product preference.');
