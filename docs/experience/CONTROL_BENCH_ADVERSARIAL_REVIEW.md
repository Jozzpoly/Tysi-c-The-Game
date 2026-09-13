# Control bench — adversarial review

Status: challenge to the proposed INTERNAL Card Embodiment bench before implementation.

## Purpose

A precise experiment can still answer the wrong question.

This document attacks the current control-law bench so we do not mistake measurement cleanliness for interaction truth.

## 1. Performance metrics structurally favor P0

If the benchmark optimizes:

- tracking error;
- placement time;
- path efficiency;
- immediate reversal;

a rigid direct mapping is likely to dominate by construction.

But P1–P3 exist to test whether some controlled transformation creates material/expressive value.

### Correction

Use performance metrics mainly as **cost / failure measures**, not a universal score.

Example:

- P2 may be allowed a small measurable tracking cost if it produces strong material value without intrusive correction/fatigue;
- P3 should be rejected if its cost becomes excessive, not simply because it is nonzero.

There is no scalar `best control law` metric.

## 2. P1 changes a different perceptual dimension than P2/P3

P1 adds rotation while P2/P3 alter position.

Therefore this is not a perfectly controlled single-variable experiment.

### Correction

Treat P0–P3 as **competing mechanism families**, not levels of one independent variable.

If P1 is promising, later studies can isolate angular magnitude within P1.

If P2 is promising, later studies can calibrate positional discrepancy within P2.

The first family comparison answers `which mechanism deserves deeper research?`, not `which parameter is optimal?`.

## 3. P1 may get free expressive value from grab location

An off-center grab naturally changes P1 response, while P0 may visually remain identical except for translation.

This could make P1 seem richer partly because it has more state, not because inertial rotation is better.

### Correction

This is acceptable only if explicitly interpreted as part of the hypothesis:

> preserving grab location may become materially meaningful through dynamics.

Do not claim a clean comparison of `mass amount`.

Also test center grabs where P1 should become much quieter. If P1 remains equally dramatic at center, the mechanism is likely decorative rather than physically coherent.

## 4. Synthetic trajectories can privilege the mechanism we designed for

P1/P2 are acceleration-sensitive. If we choose probes with strong acceleration/reversal, they will naturally appear more expressive.

### Correction

Include both:

- low-excitation trajectories where a good material system should stay quiet;
- high-excitation trajectories where response is expected;
- irregular human-like/manual movement.

A mechanism that only looks good under its showcase probe is suspect.

## 5. Mechanical neutrality can destroy material perception

Materiality is multisensory and contextual.

Removing sound, depth, neighbor response and release behavior may leave too little information for a subtle secondary dynamic to read as `mass` at all.

### Correction

Use staged validity:

1. stripped bench for mechanical isolation;
2. minimal common visual depth treatment;
3. Lane II context;
4. only later, controlled sensory augmentation.

If P1 is undetectable in Lane I, do not immediately reject it as a product mechanism. First distinguish `mechanically weak` from `requires coherent multimodal support`.

## 6. Conversely, sensory polish can rescue a bad controller

A satisfying sound, shadow or haptic pulse could make a poor motor mapping subjectively appealing for a short session.

### Correction

Never introduce candidate-specific sensory augmentation before the control law survives the basic motor/agency test.

Later sensory layers should be tested as additions, not hidden compensation.

## 7. Lane I may have weak ecological validity

Moving one card in empty space does not contain:

- ownership relation to the hand;
- insertion pressure;
- destination meaning;
- opponent/table context;
- actual repeated gameplay cadence.

### Correction

Lane I can reject instability but cannot promote a control law.

Lane II is mandatory before any Owner-facing comparison.

Later integrated gameplay can still reverse the ranking.

## 8. Lane II may import hand physics too early

Even minimal neighbor movement can interact strongly with perceived mass.

### Correction

Lane II neighbor behavior must initially be identical across candidates and deliberately low-expression.

If card-law differences disappear only when richer neighbor coupling is added, that becomes a new research question rather than silently altering the original experiment.

## 9. Touch and mouse cannot be treated as interchangeable

A desktop pointer has no finger occlusion and different proprioceptive/control relationships.

### Correction

Desktop is suitable for mechanical debugging, but cannot certify mobile perception.

Any candidate entering OWNER READY must have actual touch implementation and a mobile-body test plan.

## 10. `Grab-point error` is incomplete on touch

Browser input exposes a coordinate, but a real finger has an area and occludes the card.

Exact coordinate co-location does not guarantee perceptual co-location.

### Correction

Later mobile work must model:

- approximate contact footprint;
- content occlusion;
- card orientation relative to finger;
- where critical rank/suit/insertion information remains visible.

Do not call P0 `perfectly direct` merely because mathematical error is zero.

## 11. Adaptation contaminates repeated comparisons

A transformed mapping may initially feel wrong and later become easy because the motor system adapts.

Alternatively, returning to P0 after adaptation can make P0 feel abnormally fast/light.

### Correction

Record early and late trials separately.

Use randomized/alternating order for future Owner calibration.

Include switch-cost observations.

Do not interpret late performance as evidence of initial intuitiveness.

## 12. Novelty can make transformed candidates attractive

P1/P2/P3 may feel more interesting simply because they do something visible while P0 is intentionally quiet.

### Correction

First-contact `wow` is evidence of salience, not proof of quality.

Repetition/fatigue is mandatory before promotion.

Use occasional neutral/identical comparisons later if subtle preference claims become important.

## 13. The experiment may overvalue conscious detectability

A good control law does not necessarily need the Owner to articulate `this one rotates 3 degrees more`.

Some differences may matter through comfort, correction burden or long-term character without conscious discrimination.

### Correction

Do not make `I can tell A from B` the only success criterion.

Observe behavior and repeated-use preference.

## 14. Agency is not fully measurable through trajectory

Low correction error does not prove strong agency.

Conversely a person may deliberately make expressive inefficient movements because the object feels owned.

### Correction

Mechanical logs remain diagnostic only.

Agency remains partly subjective/behavioral evidence requiring future human interaction.

## 15. Materiality is not necessarily desirable everywhere

Even if P1 creates a strong material sensation, a card game may benefit from a more restrained interaction to preserve pace and strategic attention.

### Correction

The research goal is to identify a **usable expressive range**, not maximize materiality.

Later product integration decides how much of that range normal play uses.

## 16. The benchmark can create false precision

Logging high-resolution trajectories may tempt us to optimize metrics to several decimal places despite noisy browsers, devices and human behavior.

### Correction

Use broad regions and effect direction first.

Do not interpret tiny metric differences without repeated evidence and practical meaning.

## 17. P2 may simply reproduce hidden lag

Acceleration-sensitive discrepancy may produce a trajectory perceptually indistinguishable from delayed rendering.

### Correction

Include explicit delayed-P0 diagnostic comparison internally.

If P2 cannot be distinguished mechanistically from ordinary pipeline latency, its donor value is weak unless later sensory/contextual coupling changes the interpretation.

## 18. P3 can be accidentally straw-manned

If P3 uses a sloppy spring with long settle and P1 uses a carefully bounded rotational system, the comparison is invalid.

### Correction

Implement at least one critically/near-critically damped, production-plausible P3.

Strongly laggy P3 can exist as a boundary condition, not the only instance.

## 19. The bench may become engineering theater

We can spend weeks perfecting measurement infrastructure while the product-level uncertainty remains obvious.

### Stop rule

The bench is justified only while it helps:

- reject unstable mechanisms;
- separate competing explanations;
- locate useful parameter regions;
- expose adaptation/correction costs;
- prepare a sharper human perceptual question.

If additional instrumentation does not change a design decision, stop adding it.

## 20. Revised role of the bench

The correct claim is:

> The internal bench is a **falsification and calibration tool** for low-level control behavior. It is not a simulator of game feel and not an automatic ranking system.

Its output should be:

- which mechanisms are mechanically defensible;
- which parameter regions are obviously broken;
- which confounds remain;
- exactly which questions now require human perception.

That is enough.

## Readiness consequence

After this adversarial review, the bench design remains worthwhile.

However implementation should preserve these safeguards explicitly rather than treating the synthetic metrics as optimization objectives.

Current status stays **NOT READY for Owner testing**.
