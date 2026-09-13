const CARD = { w: 60, h: 85.2 };
const FINGER = { rx: 20, ry: 24 };
const IDENTITY = { x: 0, y: 0, w: 23, h: 31 };
const FIXED = { x: CARD.w * 0.5, y: CARD.h * 0.62 };
const CONTACTS = [
  [0.18, 0.20], [0.50, 0.20], [0.82, 0.20],
  [0.18, 0.55], [0.50, 0.55], [0.82, 0.55],
  [0.18, 0.82], [0.50, 0.82], [0.82, 0.82],
].map(([x, y]) => ({ x: x * CARD.w, y: y * CARD.h }));

const hypot = (x, y) => Math.hypot(x, y);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function ellipseContains(px, py, cx, cy) {
  const dx = (px - cx) / FINGER.rx;
  const dy = (py - cy) / FINGER.ry;
  return dx * dx + dy * dy <= 1;
}

function identityOcclusion(contact, renderOffsetY = 0) {
  // Finger is centered at the physical contact point. The rendered card may
  // be shifted vertically for visibility assistance; its identity zone moves
  // with the rendered card while the finger/body remains at contact.
  const fingerX = contact.x;
  const fingerY = contact.y;
  let hidden = 0;
  let total = 0;
  const step = 1;
  for (let y = IDENTITY.y; y < IDENTITY.y + IDENTITY.h; y += step) {
    for (let x = IDENTITY.x; x < IDENTITY.x + IDENTITY.w; x += step) {
      total += 1;
      const screenX = x;
      const screenY = y + renderOffsetY;
      if (ellipseContains(screenX, screenY, fingerX, fingerY)) hidden += 1;
    }
  }
  return hidden / total;
}

function b0Fixed(contact) {
  const jumpX = contact.x - FIXED.x;
  const jumpY = contact.y - FIXED.y;
  // After recenter, the finger lies at the fixed anchor in card-local space.
  return {
    pickupJump: hypot(jumpX, jumpY),
    displayLift: 0,
    identityOcclusion: identityOcclusion(FIXED, 0),
    assisted: false,
  };
}

function b1Exact(contact) {
  return {
    pickupJump: 0,
    displayLift: 0,
    identityOcclusion: identityOcclusion(contact, 0),
    assisted: false,
  };
}

function b2Adaptive(contact) {
  const baseline = identityOcclusion(contact, 0);
  // Escalate only when the finger materially covers the identity corner.
  if (baseline <= 0.22) {
    return { pickupJump: 0, displayLift: 0, identityOcclusion: baseline, assisted: false };
  }

  // Choose the smallest upward visual lift that reduces identity occlusion
  // below 12%, bounded so the display proxy never detaches arbitrarily far.
  let lift = 0;
  let occlusion = baseline;
  for (let candidate = 4; candidate <= 36; candidate += 2) {
    const next = identityOcclusion(contact, -candidate);
    lift = candidate;
    occlusion = next;
    if (next <= 0.12) break;
  }
  return {
    pickupJump: 0,
    displayLift: lift,
    identityOcclusion: occlusion,
    assisted: true,
    baselineOcclusion: baseline,
  };
}

function summarize(policy) {
  const rows = CONTACTS.map((contact) => ({ contact, ...policy(contact) }));
  const assisted = rows.filter((row) => row.assisted);
  return {
    rows,
    maxPickupJump: Math.max(...rows.map((row) => row.pickupJump)),
    meanPickupJump: rows.reduce((sum, row) => sum + row.pickupJump, 0) / rows.length,
    meanOcclusion: rows.reduce((sum, row) => sum + row.identityOcclusion, 0) / rows.length,
    maxOcclusion: Math.max(...rows.map((row) => row.identityOcclusion)),
    maxDisplayLift: Math.max(...rows.map((row) => row.displayLift)),
    assistedCount: assisted.length,
    engagedMeanReduction: assisted.length
      ? assisted.reduce((sum, row) => sum + (row.baselineOcclusion - row.identityOcclusion), 0) / assisted.length
      : 0,
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const B0 = summarize(b0Fixed);
const B1 = summarize(b1Exact);
const B2 = summarize(b2Adaptive);

// The current fixed-anchor implementation is retained as a negative baseline:
// arbitrary acquisition positions should demonstrate measurable pickup jump.
assert(B0.maxPickupJump > 25, `B0 no longer exposes meaningful pickup jump (${B0.maxPickupJump})`);

// Exact grab must never jump on acquisition in this model.
assert(B1.maxPickupJump < 0.001, `B1 exact grab jumps (${B1.maxPickupJump})`);
assert(B2.maxPickupJump < 0.001, `B2 adaptive exact grab jumps (${B2.maxPickupJump})`);

// Adaptive visibility must remain conditional, not become a permanent offset cursor.
assert(B2.assistedCount > 0 && B2.assistedCount < CONTACTS.length,
  `B2 must assist only occluded contacts (${B2.assistedCount}/${CONTACTS.length})`);
assert(B2.maxDisplayLift <= 36, `B2 visual proxy detached too far (${B2.maxDisplayLift}px)`);

// When assistance engages, it must materially improve visibility rather than add motion decoratively.
assert(B2.engagedMeanReduction > 0.20,
  `B2 assistance does not materially reduce identity occlusion (${B2.engagedMeanReduction})`);
assert(B2.meanOcclusion < B1.meanOcclusion,
  `B2 does not improve mean identity visibility (${B2.meanOcclusion} vs ${B1.meanOcclusion})`);

const compact = (summary) => ({
  maxPickupJump: +summary.maxPickupJump.toFixed(2),
  meanPickupJump: +summary.meanPickupJump.toFixed(2),
  meanIdentityOcclusion: +summary.meanOcclusion.toFixed(3),
  maxIdentityOcclusion: +summary.maxOcclusion.toFixed(3),
  maxDisplayLift: +summary.maxDisplayLift.toFixed(1),
  assistedContacts: summary.assistedCount,
  engagedMeanOcclusionReduction: +summary.engagedMeanReduction.toFixed(3),
});

console.log('experience hand-body bench check: PASS');
console.log(JSON.stringify({ B0_fixed_recenter: compact(B0), B1_exact_grab: compact(B1), B2_adaptive_visibility: compact(B2) }, null, 2));
console.log('Reminder: this bench models pickup discontinuity and a simplified thumb-occlusion field only. It does not certify feel, preferred offset, real finger geometry, or Owner preference.');
