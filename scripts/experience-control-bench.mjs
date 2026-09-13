const CARD_W = 90;
const EPS = 1e-9;
const TASK_END = { slow: 2, fast: 1, reversal: 1.2, zigzag: 1.4, precision: 1.3 };

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const s5 = (u) => { u = clamp(u, 0, 1); return 10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5; };
const V = (x = 0, y = 0) => ({ x, y });
const add = (a, b) => V(a.x + b.x, a.y + b.y);
const sub = (a, b) => V(a.x - b.x, a.y - b.y);
const mul = (a, s) => V(a.x * s, a.y * s);
const mag = (a) => Math.hypot(a.x, a.y);

function latent(name, t) {
  if (name === 'slow') {
    const q = s5(t / 1.5);
    return V(300 * q, 0);
  }
  if (name === 'fast') {
    const q = s5(t / 0.35);
    return V(360 * q, 80 * q);
  }
  if (name === 'reversal') {
    const T = 0.28;
    if (t <= T) return V(320 * s5(t / T), 0);
    return V(320 * (1 - s5((t - T) / T)), 0);
  }
  if (name === 'zigzag') {
    const u = clamp(t / 0.9, 0, 1);
    return V(320 * s5(u), 70 * Math.sin(5 * Math.PI * u) * Math.sin(Math.PI * u) ** 2);
  }
  if (name === 'precision') {
    const q = s5(t / 0.55);
    return V(280 * q, 40 * q);
  }
  throw new Error(`Unknown task: ${name}`);
}

const alphaHz = (hz, dt) => 1 - Math.exp(-2 * Math.PI * hz * dt);

// Exact critically-damped step for a piecewise-constant target.
function criticalStep(pos, vel, target, hz, dt) {
  const w = 2 * Math.PI * hz;
  const y = pos - target;
  const e = Math.exp(-w * dt);
  const c = vel + w * y;
  return {
    pos: target + (y + c * dt) * e,
    vel: (vel - w * c * dt) * e,
  };
}

const firstOrderStep = (pos, target, hz, dt) => pos + (target - pos) * alphaHz(hz, dt);

function schedule(rate, end) {
  const out = [];
  for (let i = 0; ; i += 1) {
    const t = i / rate;
    if (t > end + EPS) break;
    out.push(t);
  }
  return out;
}

function simulate({
  task,
  law,
  inputHz = 120,
  renderHz = 60,
  analysisHz = 1000,
  p1Gain = 0.0006,
  p1Hz = 4.8,
  p1MaxDeg = 10,
  p2Gain = 0.0005,
  p2CapFrac = 0.12,
  p2Hz = 18,
  p3Hz = 18,
  derivHz = 5.5,
}) {
  const end = TASK_END[task];
  const inputs = schedule(inputHz, end);
  const renders = schedule(renderHz, end);
  const analyses = schedule(analysisHz, end);

  let ii = 0;
  let ri = 0;
  let ai = 0;
  let t = 0;

  let p = latent(task, 0);
  let lastInput = { ...p };
  let lastVel = V();
  let filteredAccel = V();
  let inputT = 0;

  let x = { ...p };
  let vx = V();
  let theta = 0;
  let thetaV = 0;
  let d = V();
  let thetaTarget = 0;
  let dTarget = V();

  const rows = [];
  let renderCount = 0;

  function advance(to) {
    const dt = to - t;
    if (dt <= 0) {
      t = to;
      return;
    }

    if (law === 'P1') {
      const r = criticalStep(theta, thetaV, thetaTarget, p1Hz, dt);
      theta = r.pos;
      thetaV = r.vel;
      x = { ...p };
    } else if (law === 'P2') {
      d = V(
        firstOrderStep(d.x, dTarget.x, p2Hz, dt),
        firstOrderStep(d.y, dTarget.y, p2Hz, dt),
      );
      x = add(p, d);
    } else if (law === 'P3') {
      const rx = criticalStep(x.x, vx.x, p.x, p3Hz, dt);
      const ry = criticalStep(x.y, vx.y, p.y, p3Hz, dt);
      x = V(rx.pos, ry.pos);
      vx = V(rx.vel, ry.vel);
    } else if (law === 'P0') {
      x = { ...p };
      theta = 0;
    }

    t = to;
  }

  while (ii < inputs.length || ri < renders.length || ai < analyses.length) {
    const ti = ii < inputs.length ? inputs[ii] : Infinity;
    const tr = ri < renders.length ? renders[ri] : Infinity;
    const ta = ai < analyses.length ? analyses[ai] : Infinity;
    const next = Math.min(ti, tr, ta);

    advance(next);

    // Input first at equal timestamps, then measurement/render.
    if (Math.abs(ti - next) < EPS) {
      const np = latent(task, ti);

      if (ii > 0) {
        const dtIn = ti - inputT;
        const vel = mul(sub(np, lastInput), 1 / dtIn);
        const accel = mul(sub(vel, lastVel), 1 / dtIn);
        filteredAccel = add(
          filteredAccel,
          mul(sub(accel, filteredAccel), alphaHz(derivHz, dtIn)),
        );
        lastVel = vel;
      }

      p = np;
      lastInput = np;
      inputT = ti;

      if (law === 'P0') x = { ...p };

      if (law === 'P1') {
        const limit = p1MaxDeg * Math.PI / 180;
        thetaTarget = clamp(-p1Gain * (filteredAccel.x / CARD_W), -limit, limit);
        x = { ...p };
      }

      if (law === 'P2') {
        const cap = p2CapFrac * CARD_W;
        dTarget = V(
          clamp(-p2Gain * (filteredAccel.x / CARD_W) * CARD_W, -cap, cap),
          clamp(-p2Gain * (filteredAccel.y / CARD_W) * CARD_W, -cap, cap),
        );
        x = add(p, d);
      }

      // P3 changes only its target p. Its rendered body remains continuous.
      ii += 1;
    }

    if (Math.abs(ta - next) < EPS) {
      rows.push({
        t: ta,
        inputErrW: mag(sub(x, p)) / CARD_W,
        thetaDeg: Math.abs(theta) * 180 / Math.PI,
        trueErrW: mag(sub(x, latent(task, ta))) / CARD_W,
      });
      ai += 1;
    }

    if (Math.abs(tr - next) < EPS) {
      renderCount += 1;
      ri += 1;
    }
  }

  const errors = rows.map((row) => row.inputErrW);
  const angles = rows.map((row) => row.thetaDeg);

  return {
    task,
    law,
    inputHz,
    renderHz,
    analysisHz,
    peakErrW: Math.max(...errors),
    rmsErrW: Math.sqrt(errors.reduce((sum, value) => sum + value * value, 0) / errors.length),
    meanErrW: errors.reduce((sum, value) => sum + value, 0) / errors.length,
    peakDeg: Math.max(...angles),
    finite: rows.every((row) => Number.isFinite(row.inputErrW) && Number.isFinite(row.thetaDeg)),
    renderCount,
  };
}

function relativeSpread(values) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (Math.abs(mean) < 1e-12) return 0;
  return (Math.max(...values) - Math.min(...values)) / Math.abs(mean);
}

const tasks = ['slow', 'fast', 'reversal', 'zigzag', 'precision'];
const laws = ['P0', 'P1', 'P2', 'P3'];

const baseline = [];
for (const law of laws) {
  for (const task of tasks) baseline.push(simulate({ law, task }));
}

const renderInvariant = [];
for (const law of laws) {
  for (const task of ['fast', 'reversal', 'precision']) {
    const runs = [30, 60, 90, 120, 144, 240].map((renderHz) => simulate({ law, task, renderHz }));
    renderInvariant.push({
      law,
      task,
      errorSpread: relativeSpread(runs.map((run) => run.peakErrW)),
      angleSpread: relativeSpread(runs.map((run) => run.peakDeg)),
    });
  }
}

const analysisInvariant = [];
for (const law of laws) {
  for (const task of ['fast', 'reversal']) {
    const runs = [240, 500, 1000, 2000].map((analysisHz) => simulate({ law, task, analysisHz }));
    analysisInvariant.push({
      law,
      task,
      errorSpread: relativeSpread(runs.map((run) => run.peakErrW)),
      angleSpread: relativeSpread(runs.map((run) => run.peakDeg)),
    });
  }
}

const inputSensitivity = [];
for (const law of laws) {
  for (const task of ['fast', 'reversal', 'precision']) {
    inputSensitivity.push({
      law,
      task,
      values: [60, 90, 120, 180, 240].map((inputHz) => simulate({ law, task, inputHz })),
    });
  }
}

const p3Band = [8, 12, 18, 25, 35, 50].map((hz) => {
  const run = simulate({ law: 'P3', task: 'reversal', p3Hz: hz });
  return { hz, peakErrW: run.peakErrW, rmsErrW: run.rmsErrW };
});

const p2Band = [0.015, 0.03, 0.06, 0.09, 0.12].map((capFrac) => {
  const run = simulate({ law: 'P2', task: 'reversal', p2CapFrac: capFrac });
  return { capFrac, peakErrW: run.peakErrW, rmsErrW: run.rmsErrW };
});

const p1Band = [2, 4, 6, 8, 10].map((maxDeg) => {
  const run = simulate({ law: 'P1', task: 'reversal', p1MaxDeg: maxDeg });
  return { maxDeg, peakDeg: run.peakDeg };
});

console.log(JSON.stringify({
  version: 2,
  status: 'INTERNAL mechanical falsification instrument',
  warning: 'Metrics can reject mechanically bad candidates. They cannot declare good feel, agency, materiality, or product preference.',
  cardWidthPx: CARD_W,
  baseline,
  renderInvariant,
  analysisInvariant,
  inputSensitivity,
  p1Band,
  p2Band,
  p3Band,
}, null, 2));
