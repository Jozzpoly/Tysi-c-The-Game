import { spawnSync } from 'node:child_process';

const run = spawnSync(process.execPath, ['scripts/experience-control-bench.mjs'], {
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
  console.error('experience control bench check: invalid JSON output');
  console.error(error);
  process.exit(1);
}

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};
const approxZero = (value, epsilon = 1e-9) => Math.abs(value) <= epsilon;

assert(report.version === 2, `unexpected bench version ${report.version}`);
assert(Array.isArray(report.baseline) && report.baseline.length > 0, 'missing baseline runs');
assert(report.baseline.every((run) => run.finite), 'non-finite baseline state');

for (const run of report.baseline) {
  assert(Number.isFinite(run.peakErrW), `${run.law}/${run.task}: invalid peakErrW`);
  assert(Number.isFinite(run.rmsErrW), `${run.law}/${run.task}: invalid rmsErrW`);
  assert(Number.isFinite(run.peakDeg), `${run.law}/${run.task}: invalid peakDeg`);

  if (run.law === 'P0' || run.law === 'P1') {
    assert(approxZero(run.peakErrW, 1e-8), `${run.law}/${run.task}: grab-point fidelity drift ${run.peakErrW}`);
  }

  if (run.law === 'P2') {
    assert(run.peakErrW <= 0.120001, `P2/${run.task}: bounded discrepancy exceeded ${run.peakErrW}`);
  }
}

const p1Angles = report.baseline.filter((run) => run.law === 'P1').map((run) => run.peakDeg);
assert(Math.max(...p1Angles) > 1, 'P1 secondary response is effectively absent');
assert(Math.max(...p1Angles) <= 10.001, `P1 exceeded angular bound ${Math.max(...p1Angles)}`);

for (const probe of report.renderInvariant ?? []) {
  assert(probe.errorSpread <= 1e-7, `${probe.law}/${probe.task}: render cadence changed positional result (${probe.errorSpread})`);
  assert(probe.angleSpread <= 1e-7, `${probe.law}/${probe.task}: render cadence changed angular result (${probe.angleSpread})`);
}

for (const probe of report.analysisInvariant ?? []) {
  assert(probe.errorSpread <= 0.015, `${probe.law}/${probe.task}: analysis cadence spread too large (${probe.errorSpread})`);
  assert(probe.angleSpread <= 0.015, `${probe.law}/${probe.task}: analysis cadence angular spread too large (${probe.angleSpread})`);
}

for (const family of report.inputSensitivity ?? []) {
  assert(Array.isArray(family.values) && family.values.length >= 3, `${family.law}/${family.task}: insufficient input-rate probes`);
  assert(family.values.every((value) => value.finite), `${family.law}/${family.task}: non-finite input-rate probe`);
}

assert((report.p3Band ?? []).every((row) => Number.isFinite(row.peakErrW) && row.peakErrW >= 0), 'invalid P3 sweep');
assert((report.p2Band ?? []).every((row) => Number.isFinite(row.peakErrW) && row.peakErrW >= 0), 'invalid P2 sweep');
assert((report.p1Band ?? []).every((row) => Number.isFinite(row.peakDeg) && row.peakDeg >= 0), 'invalid P1 sweep');

if (failures.length > 0) {
  console.error(`experience control bench check: FAIL (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const summarize = (law, task) => report.baseline.find((run) => run.law === law && run.task === task);
const p1 = summarize('P1', 'reversal');
const p2 = summarize('P2', 'reversal');
const p3 = summarize('P3', 'reversal');

console.log('experience control bench check: PASS');
console.log(`P1 reversal peak=${p1.peakDeg.toFixed(2)}deg, grab error=${p1.peakErrW.toFixed(4)}W`);
console.log(`P2 reversal peak discrepancy=${p2.peakErrW.toFixed(4)}W`);
console.log(`P3 reversal peak discrepancy=${p3.peakErrW.toFixed(4)}W`);
console.log('Reminder: this validates mechanical apparatus invariants only; it does not validate feel, agency, materiality, or product quality.');
