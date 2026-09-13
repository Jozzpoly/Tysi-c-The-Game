# Internal parameter bands and signal estimation

Status: final design work before considering INTERNAL control-bench implementation. Values here are exploration bands, not product recommendations.

## Purpose

Define broad, normalized search regions for P0–P3 and a signal-estimation strategy that does not accidentally turn input noise/filter lag into the phenomenon being tested.

## 1. General rule

Do not tune hidden coefficients directly against subjective intuition.

Instead:

1. choose desired observable response bands under canonical probes;
2. solve/search underlying controller coefficients that produce those responses;
3. reject unstable regions mechanically;
4. later expose only mechanically competent observable bands to human perception.

This keeps research knowledge attached to behavior rather than implementation constants.

## 2. P0

P0 has no material parameter sweep.

Its role is to establish the actual pipeline floor:

- measured event/render latency;
- subpixel/render quantization;
- grab-point error caused by our implementation;
- cadence variance.

If P0 itself has substantial path error/jitter, the bench is not valid enough to judge P1–P3.

## 3. P1 rotational observable bands

Use target **peak rotational response under canonical high-excitation probes** rather than exposing raw `m_eff`, `I`, `k`, `c`.

Initial mechanical exploration targets can span approximately:

- R0: effectively no rotation;
- R1: very subtle response (~1–2° peak on reference sweep);
- R2: moderate response (~3–5°);
- R3: strong but still card-like (~7–10°);
- R4: deliberately expressive/stress boundary (~12–16°).

These angles are not evidence-based product limits. They are broad test-fixture regions chosen to span nearly invisible to obviously expressive behavior.

Additional constraints:

- center grab should strongly reduce torque response;
- corner/edge grab may increase response but remains capped;
- low-speed Probe S should remain close to rest orientation;
- hard reversal must recover without multi-cycle oscillation.

### Damping exploration

Prefer non-oscillatory or minimally oscillatory serious candidates.

Explore:

- near-critical response;
- slightly overdamped response;
- one deliberately underdamped boundary only for diagnostics.

Do not let `bouncy` become synonymous with `physical`.

## 4. P2 divergence observable bands

Primary unit:

`D = peak grab-point divergence / card width`.

Initial mechanical sweep:

- D0: 0;
- D1: ~0.5% card width;
- D2: ~1.5%;
- D3: ~3%;
- D4: ~6%;
- optional D5 stress boundary: ~10%.

These are exploration anchors, not final acceptable values.

Why broad:

- very small values establish whether the effect is functionally invisible;
- middle values look for a possible material band;
- high values reveal the point where the mapping is plainly detached/broken.

### Recovery targets

The discrepancy should decay toward near-direct tracking quickly once acceleration falls.

Internal search should include at least:

- fast recovery;
- moderate recovery;
- deliberately slow/bad boundary.

Observable recovery time is more important than the hidden smoothing constant.

## 5. P3 spring observable bands

Use damping ratio plus approximate response/settling times rather than raw spring coefficients.

### Damping-ratio family

- `zeta ~ 0.8` — mildly underdamped but potentially production-plausible;
- `zeta ~ 1.0` — critical reference;
- `zeta ~ 1.2` — slightly overdamped.

A more oscillatory condition may exist only as a stress boundary.

### Dynamic-speed family

Explore broad response bands approximately equivalent to:

- very fast / almost direct;
- fast but visibly trailing;
- moderate heavy response;
- deliberately slow boundary.

Prefer calibrating these by measured peak divergence and recovery under Probe F/R rather than naming exact milliseconds as product truth.

The bench may use approximate settling-time targets such as ~60, ~100, ~160 and ~240 ms purely to generate a broad mechanical search family. These values are not endorsed interaction timings.

## 6. Automatic coefficient calibration

Where a controller's hidden coefficients do not map intuitively to observables, the bench should calibrate them offline/internal.

Example:

- choose desired peak P1 angle under Probe R;
- search `m_eff/k/c` region until the synthetic response reaches the requested observable while satisfying stability constraints;
- store both the resulting coefficients and observable signature.

Likewise P3 can search natural frequency for a target response/recovery band at fixed damping ratio.

This reduces hand-tuning bias.

## 7. Input derivative problem

Finite differences of raw pointer positions are noisy.

Acceleration is especially fragile because it amplifies sampling jitter twice.

A bad estimator can create:

- false P1 torque;
- P2 micro-jitter;
- inconsistent response across browsers;
- apparent materiality that is actually event-cadence noise.

## 8. Estimator design goals

The estimator must:

- operate in real elapsed time, not sample index;
- handle irregular/coalesced sample spacing;
- be causal;
- have bounded memory;
- expose its own lag;
- avoid modifying the primary position path;
- reproduce reasonably under recorded-trajectory replay.

## 9. Candidate estimator: short-window weighted polynomial fit

For INTERNAL research, prefer a time-aware local polynomial estimate over naive second differences.

Concept:

Maintain recent `(t, x, y)` samples over a short rolling time window.

Fit a quadratic locally:

`x(tau) = ax*tau^2 + bx*tau + cx`

`y(tau) = ay*tau^2 + by*tau + cy`

with `tau = 0` at the newest sample.

Then estimate:

- velocity = `(bx, by)`;
- acceleration = `(2ax, 2ay)`.

Use recency weighting so older samples influence the estimate less.

Advantages:

- handles irregular timestamps;
- estimates derivatives directly rather than differentiating a filtered position twice;
- preserves raw primary position;
- window length becomes an explicit latency/noise tradeoff.

Risks:

- too-short window = noisy acceleration;
- too-long window = delayed material response;
- sharp intention reversal may be smeared.

Therefore estimator window is itself mechanically calibrated before Owner exposure.

## 10. Estimator validation probes

Feed known analytic trajectories where true velocity/acceleration are available:

- constant velocity;
- constant acceleration;
- smooth sinusoid;
- abrupt reversal with known transition;
- sampled jitter/noise;
- irregular timestamp sequence;
- coalesced-event burst simulation.

Measure:

- velocity error;
- acceleration error;
- phase delay;
- overshoot;
- recovery after reversal.

Reject estimator settings that create visible secondary response during constant-velocity/near-static probes where the intended acceleration signal should be small.

## 11. Window exploration

Do not commit to one magic millisecond value from theory.

Explore a small range of short windows internally, for example from a few tens of milliseconds up toward roughly one-tenth of a second, while measuring phase error and noise rejection.

The acceptable window must be short enough that material response follows intention rather than history.

If acceleration cannot be estimated robustly without unacceptable lag on actual touch input, that is evidence **against acceleration-driven P1/P2**, not a reason to filter more aggressively until the demo looks smooth.

## 12. Alternative fallback

If quadratic acceleration estimation proves fragile, consider narrowing the model rather than escalating estimator complexity.

Possible fallbacks:

- velocity-driven secondary rotation;
- displacement/velocity relative to a short-lived inertial state;
- event-phase trigger rather than continuous acceleration;
- abandon P2 positional pseudo-haptics entirely.

Research should prefer a simpler truthful mechanism over a complicated signal pipeline built to rescue a favored hypothesis.

## 13. Delayed-P0 diagnostic

Generate a control condition that adds explicit known temporal delay to P0 without other material behavior.

Purpose:

- compare trajectory signatures against P2/P3;
- ensure `weight` does not merely resemble ordinary lag;
- calibrate our own sensitivity to pipeline delay.

This diagnostic is INTERNAL only until a specific human research question justifies exposure.

## 14. Progression to implementation

After this specification the conceptual ingredients for an INTERNAL bench are largely present.

Before writing it, perform one final readiness decision:

- Are P0–P3 sufficiently specified to implement without hidden stylistic choices?
- Can the estimator be mechanically validated independently?
- Are the synthetic probes sufficient to reject instability without pretending to measure feel?
- Is the output schema compact enough to aid decisions rather than create measurement theater?

If yes, implement the INTERNAL bench.

Owner-test status remains **NOT READY** regardless.
