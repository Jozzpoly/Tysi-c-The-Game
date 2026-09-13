# Internal control bench design

Status: design for an INTERNAL research instrument. Not Owner-facing.

## Purpose

Build the smallest apparatus capable of rejecting mechanically poor Card Embodiment control laws before spending Owner attention.

The bench is not a product prototype and should look deliberately neutral.

## 1. Two lanes

### Lane I — synthetic/mechanical

Feeds known time-stamped trajectories into P0–P3 and records response.

Purpose:

- frame/time-step stability;
- divergence bounds;
- oscillation/recovery;
- derivative-estimator quality;
- comparable observable signatures.

No human judgement is required.

### Lane II — internal manual bridge

Allows ordinary pointer/touch manipulation in a minimal environment.

Purpose:

- catch implementation artifacts synthetic probes miss;
- verify acquisition/release/cancel;
- verify the controller remains understandable when driven by irregular human motion;
- later host a minimal hand-context bridge.

Lane II remains internal until Owner-test gate is explicitly advanced.

## 2. Coordinate normalization

Use card width `W = 1.0` as the primary spatial unit.

Card aspect ratio can use a conventional playing-card-like ratio, but exact final Tysiac art is irrelevant.

All synthetic trajectories are expressed in normalized coordinates, then mapped to viewport geometry.

Advantages:

- comparable across desktop/mobile viewport sizes;
- logs are interpretable without CSS pixels;
- transfer to other object sizes is easier.

## 3. Synthetic trajectory set

The exact numbers below are **test-fixture probes**, not product targets.

### S — slow trace

- start at `(0,0)`;
- move to `(2W,0)` over `1200 ms`;
- smooth ease-in/ease-out over short boundary regions or constant velocity after ramp;
- hold `250 ms`.

Purpose: expose low-speed jitter, permanent gain error and unwanted material response.

### F — fast sweep

- start `(0,0)`;
- move to `(3W,0)` over `300 ms`;
- controlled acceleration/deceleration;
- hold `250 ms`.

Purpose: excite material response without a direction reversal.

### R — hard reversal

- move from `(0,0)` to `(2W,0)` over `250 ms`;
- reverse immediately to `(-1W,0)` over `300 ms`;
- hold.

Purpose: expose lag, overshoot and intent-change resistance.

### Z — zig-zag

- alternate between `+1.5W` and `-1.5W` horizontally;
- four cycles;
- approximately `220–300 ms` half-cycle;
- no long rest until end.

Purpose: expose cumulative oscillation and phase lag.

### D — diagonal cross

- `(0,0)` to `(1.5W,-1.5W)` to `(-1.5W,1.5W)`;
- controlled speed.

Purpose: detect axis asymmetry and rotation-direction artifacts.

### P — transport + precision

- fast move over `2.5W` for first ~70% of path;
- slow final `0.5W` into a target center;
- small deliberate final correction of opposite direction.

Purpose: model ballistic/transport followed by corrective placement.

### C — cancellation

- move `1.5W` outward;
- pause very briefly;
- retrace toward origin before any release event.

Purpose: ensure dynamic state does not fight changed intent.

## 4. Grab locations

Control law must be exercised at multiple local acquisition points because P1 intentionally makes grab location meaningful.

Minimum internal set:

- card center;
- near top-left corner but inside safe content margin;
- near lower-right edge;
- mid-right edge.

This is important for fairness:

- P0 also preserves the same local grab point, even though it does not rotate;
- P2/P3 calculate direct target using the same local point before applying their distortion;
- no candidate may silently recenter the card.

## 5. Time sources

Use monotonic high-resolution timestamps (`performance.now()` family / event timestamps where appropriate).

Never derive physics from frame count.

Record:

- input sample timestamp;
- simulation/update timestamp;
- rendered-frame timestamp;
- source type (`raw`, `coalesced`, synthetic, manual).

## 6. Sampling policy

For manual Pointer Events:

- store the primary event sample;
- where supported, expand `getCoalescedEvents()` into time-stamped samples;
- `pointerrawupdate` may be explored internally but must not be required for correctness;
- predicted events, if later examined, are logged separately and never treated as actual input.

The benchmark must still work correctly when only normal `pointermove` is available.

## 7. Simulation policy

The experiment should prefer control-law formulations whose behavior is stable under variable `dt`.

Avoid tuning per-frame magic constants.

Candidate implementation strategies:

- closed-form / stable discrete-time update for second-order systems where practical;
- bounded semi-implicit integration with strict `dt` handling for research-only dynamics;
- derivative estimates based on actual timestamped history rather than frame cadence.

A controller that requires a specific refresh rate to feel correct fails the donor-quality bar.

## 8. Render policy

For the first bench:

- single DOM/canvas/SVG implementation path shared by all candidates;
- transform-only visual movement where practical;
- same card artwork, scale, shadow and elevation;
- no particles;
- no candidate-specific easing outside the control law;
- no candidate-specific sound/haptic;
- same pickup/release acknowledgement.

Neutral does not mean ugly/janky. It means visually controlled enough not to bias the mechanical comparison.

## 9. Instrumentation schema

Each sample/step should permit reconstruction of:

- trial id;
- candidate id;
- parameter-set id;
- probe/task id;
- input source;
- timestamp;
- input position;
- raw/coalesced position history as applicable;
- derived velocity/acceleration;
- filtered derivative values;
- rendered center;
- rendered angle;
- rendered grab-point position;
- grab-point error;
- dynamic-state variables relevant to candidate;
- frame interval;
- event-to-render delay estimate where measurable;
- release/cancel state.

Store data in memory during a trial and serialize after the run so logging itself does not perturb the hot path unnecessarily.

## 10. Derived automated metrics

For synthetic probes compute at least:

- RMS grab-point error;
- peak grab-point error;
- peak card-center divergence from P0 reference;
- peak angle / angular velocity;
- overshoot after reversal;
- time to return within normalized tolerance;
- path-length inflation;
- maximum orthogonal deviation;
- residual movement after input stops;
- sensitivity to simulated sample cadence / render cadence.

## 11. Cadence torture

Replay the same synthetic trajectory using several input/render timing patterns.

Examples:

- stable 60 Hz render;
- stable 120 Hz render;
- uneven 60 Hz-like sequence;
- periodic long frame;
- coalesced input burst;
- lower-rate pointer samples.

The purpose is not to simulate every device. It is to detect controllers that accidentally encode cadence into material character.

## 12. Latency separation probe

Because P2/P3 risk looking like lag, the bench should include a deliberately injected pipeline-latency condition on P0.

This gives a diagnostic comparison:

- true delayed direct motion;
- intended material distortion.

If a material candidate's trajectory/visual experience is indistinguishable from ordinary delayed P0, it is a weak material language.

Do not expose this as a user-facing `network simulation` yet.

## 13. Internal manual tasks

For the researcher/agent/manual rehearsal:

- slow outline/trace;
- free scribble;
- aggressive reversals;
- small circular movement;
- precise placement into several target sizes;
- repeated pickup/cancel;
- edge-of-screen motion;
- off-center grabs.

The purpose is bug detection and design self-audit, not final preference judgement.

## 14. Minimal Lane II hand context

Only after Lane I survivors exist.

A tiny hand contains perhaps 4–6 neutral cards.

One card can:

- be grabbed at any local point;
- lift slightly out of hand;
- move within a bounded free region;
- return to its original slot on cancel/release.

Neighbor cards may perform one **common fixed** minimal displacement only to maintain visibility; hand-field physics is not yet the variable.

The question is simply:

> Does the candidate still feel coherent when the card has an owned source and surrounding objects?

## 15. Mechanical rejection rules

A candidate/parameter region is rejected internally if it repeatedly shows:

- unstable oscillation;
- high precision-phase error;
- cadence-sensitive character;
- uncontrolled long tail;
- discontinuous grab-point jumps;
- direction-dependent bug not explained by the model;
- derivative chatter;
- mapping reversal/non-monotonicity;
- severe target correction burden under trivial geometry;
- inability to cancel without fighting residual dynamics.

Do not reject solely for being visually less exciting.

## 16. Internal-output format

For each parameter set generate a compact artifact:

- metrics JSON/CSV;
- path overlay image/plot if useful;
- brief mechanical verdict (`stable`, `suspect`, `reject`);
- reason;
- no product-quality judgement.

This makes later reasoning reproducible without dumping implementation code into Owner chat.

## 17. Stop condition before Owner test

INTERNAL work is complete enough when:

- P0–P3 each have at least one mechanically competent implementation, or a documented reason why a family was rejected;
- derivative/pipeline artifacts are controlled;
- obvious parameter extremes are eliminated;
- Lane II does not reverse the basic mechanical interpretation;
- remaining distinctions are genuinely perceptual/aesthetic/agency questions.

Only then may `PRE_TEST_RESEARCH_GATE` move toward OWNER READY.

## Current status

Design only. No fixture built yet.
