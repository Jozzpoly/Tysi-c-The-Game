const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const smoothstep = (u) => {
  u = clamp(u, 0, 1);
  return u * u * (3 - 2 * u);
};

function basePositions(n, spacing) {
  const center = (n - 1) / 2;
  return Array.from({ length: n }, (_, i) => (i - center) * spacing);
}

function positions(model, heldX, { n = 8, heldIndex = 3, spacing = 0.58, globalAmp = 0.12, engaged = true } = {}) {
  const base = basePositions(n, spacing);
  const origin = base[heldIndex];
  const out = base.slice();

  if (!engaged) return { base, out };

  if (heldX >= origin) {
    for (let j = heldIndex + 1; j < n; j += 1) {
      const progress = model === 'H0'
        ? (heldX >= base[j] ? 1 : 0)
        : smoothstep((heldX - (base[j] - 0.5 * spacing)) / spacing);
      out[j] = base[j] - spacing * progress;
    }
  } else {
    for (let j = 0; j < heldIndex; j += 1) {
      const progress = model === 'H0'
        ? (heldX <= base[j] ? 1 : 0)
        : smoothstep(((base[j] + 0.5 * spacing) - heldX) / spacing);
      out[j] = base[j] + spacing * progress;
    }
  }

  if (model === 'H2') {
    const sigma = 3 * spacing;
    const core = 0.30 * spacing;
    for (let j = 0; j < n; j += 1) {
      if (j === heldIndex) continue;
      const delta = base[j] - heldX;
      const shape = Math.tanh(delta / core) * Math.exp(-Math.abs(delta) / sigma);
      out[j] += globalAmp * spacing * shape;
    }
  }

  return { base, out };
}

function linspace(a, b, count) {
  return Array.from({ length: count }, (_, i) => a + (b - a) * (i / (count - 1)));
}

function max(values) {
  return Math.max(...values);
}

function sum(values) {
  return values.reduce((acc, value) => acc + value, 0);
}

function sweep(model, { n = 8, heldIndex = 3, spacing = 0.58 } = {}) {
  const base = basePositions(n, spacing);
  const start = base[heldIndex];
  const end = base[Math.min(n - 1, heldIndex + 3)];
  const forward = linspace(start, end, 501);
  const back = linspace(end, start, 501).slice(1);
  const heldPath = [...forward, ...back];
  const rows = heldPath.map((heldX) => positions(model, heldX, { n, heldIndex, spacing, engaged: true }).out);
  const neighbors = Array.from({ length: n }, (_, i) => i).filter((i) => i !== heldIndex);

  let maxStepW = 0;
  let inversions = 0;

  for (let k = 1; k < rows.length; k += 1) {
    for (const i of neighbors) {
      maxStepW = Math.max(maxStepW, Math.abs(rows[k][i] - rows[k - 1][i]));
    }
  }

  for (const row of rows) {
    const ordered = neighbors.map((i) => row[i]);
    for (let i = 1; i < ordered.length; i += 1) {
      if (!(ordered[i] > ordered[i - 1])) {
        inversions += 1;
        break;
      }
    }
  }

  const outwardRows = rows.slice(0, forward.length);
  const inactiveIndices = Array.from({ length: heldIndex }, (_, i) => i);
  const inactiveDriftW = inactiveIndices.length === 0
    ? 0
    : max(outwardRows.flatMap((row) => inactiveIndices.map((i) => Math.abs(row[i] - base[i]))));

  const threshold = base[Math.min(n - 1, heldIndex + 1)];
  const jitterPath = Array.from({ length: 400 }, (_, i) =>
    threshold + 0.02 * spacing * Math.sin((i / 399) * 16 * Math.PI));
  const jitterRows = jitterPath.map((heldX) => positions(model, heldX, { n, heldIndex, spacing, engaged: true }).out);
  const watchedIndex = Math.min(n - 1, heldIndex + 1);
  const jitterTotalVariationW = sum(
    jitterRows.slice(1).map((row, i) => Math.abs(row[watchedIndex] - jitterRows[i][watchedIndex])),
  );

  // Returning the held card to its origin is not yet cancellation: while the
  // card remains actively held, a collective model may legitimately remain
  // deformed. Measure that separately from the actual release/cancel state.
  const returnedWhileHeld = rows.at(-1);
  const returnWhileHeldErrorW = max(neighbors.map((i) => Math.abs(returnedWhileHeld[i] - base[i])));

  const cancelled = positions(model, start, { n, heldIndex, spacing, engaged: false }).out;
  const cancelReleaseErrorW = max(neighbors.map((i) => Math.abs(cancelled[i] - base[i])));

  const endState = rows[forward.length - 1];
  const totalDisturbanceW = sum(neighbors.map((i) => Math.abs(endState[i] - base[i])));

  return {
    model,
    n,
    heldIndex,
    spacingW: spacing,
    maxStepW,
    inversions,
    inactiveDriftW,
    jitterTotalVariationW,
    returnWhileHeldErrorW,
    cancelReleaseErrorW,
    totalDisturbanceW,
  };
}

const models = ['H0', 'H1', 'H2'];
const spacings = [0.38, 0.48, 0.58, 0.70];
const counts = [7, 8, 10];

const baseline = models.map((model) => sweep(model));
const densitySweep = [];
for (const model of models) {
  for (const n of counts) {
    const heldIndex = Math.floor((n - 1) / 2);
    for (const spacing of spacings) {
      densitySweep.push(sweep(model, { n, heldIndex, spacing }));
    }
  }
}

console.log(JSON.stringify({
  version: 2,
  status: 'INTERNAL hand-field mechanical falsification instrument',
  warning: 'This instrument tests continuity, order and disturbance. It cannot establish cognition, pleasure, ownership or the preferred product hand.',
  models: {
    H0: 'discrete slot/index threshold baseline',
    H1: 'continuous local neighbor swap field',
    H2: 'H1 plus smooth broad elastic response as global-coupling upper bound',
  },
  baseline,
  densitySweep,
}, null, 2));
