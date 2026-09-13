# Human-in-the-loop control and measurement

Status: research synthesis for Run 03. Not an implementation spec and not an Owner-test request.

## Why this exists

The current Card Embodiment problem cannot be evaluated with one scalar called `feel`.

At least four outcomes can diverge:

1. **motor performance** — speed, accuracy, correction cost, stability;
2. **sense of agency / ownership of action** — whether the user feels `I did that`;
3. **perceived materiality** — whether the represented object feels substantial/coherent rather than cursor-like;
4. **interaction aesthetics** — whether performing the action is pleasurable, expressive, tiring, annoying or worth mastering.

A candidate can improve one and damage another.

This is especially important for assisted or transformed control. Research on shared autonomy and computer-assisted pointing shows that stronger assistance may improve objective performance while reducing sense of agency. Visuomotor research also shows that people adapt to altered control/display mappings; therefore later task performance does not prove that the mapping was initially direct, intuitive or desirable.

## 1. Do not collapse performance into agency

A user can become skilled at a mapping they dislike.

Adaptation means that repeated exposure can teach the motor system to compensate for gain changes, rotations, delays or other transformations. Therefore:

- low error after repeated trials can hide a poor first-contact mapping;
- apparent improvement over time can be learning rather than interface quality;
- preference and task efficiency may disagree;
- after switching mappings, aftereffects may expose adaptation that was invisible in steady-state performance.

### Consequence for future experiments

Separate at least:

- **first-contact behavior**;
- **early adaptation**;
- **steady repeated use**;
- **switch cost / aftereffect**;
- **fatigue**.

Do not average all trials into one score.

## 2. Do not collapse agency into literal 1:1 mapping

Strict visual congruence is not the only route to agency.

Research includes cases where modified visual feedback improved reported agency when it better supported the task goal, despite imperfect correspondence with physical movement. Mild assistance can also preserve agency while stronger automation reduces it.

Therefore the target is not mathematically perfect 1:1 mapping. It is a mapping where:

- the system response remains attributable to the user's intention;
- transformations are predictable enough to be learned without feeling stolen;
- assistance does not replace meaningful user variation;
- corrective behavior remains owned rather than dominated by automation;
- the user can anticipate what the object will do next.

## 3. Preserve useful human variability

Human movement contains noise, but not all variability is useless noise.

Recent shared-control research suggests that assistance preserving task-relevant natural movement structure can produce better subjective agency than conventional variability-suppressing assistance at comparable performance.

This matters for our future card control law.

Potential mistake:

`raw input looks slightly irregular -> smooth everything -> interaction feels premium`

The result may look cleaner while reducing the user's motor signature and sense of authorship.

### Working principle

**Stabilize what impairs intention; do not automatically normalize what merely differs from machine-perfect motion.**

This principle remains a hypothesis until tested in our domain.

## 4. Movement has phases

Dragging is not one homogeneous action.

Motor-control work often separates an initial ballistic/transport phase from later online correction. Touch-drag studies report that corrective movement can account for a large portion of total drag time.

This matters because assistance/material dynamics may need different behavior in different phases.

Examples of hypotheses:

- fast transport can tolerate expressive secondary dynamics;
- final placement should become more direct/stable;
- material lag that is pleasant during a sweep may be disastrous during correction;
- occlusion relief may become important mainly in the corrective phase;
- target assistance should probably be weak or absent until intent becomes sufficiently clear.

Do not hard-code phase switching yet. First use the distinction analytically.

## 5. Fitts and Steering are diagnostic lenses, not design laws

Fitts' Law can model aimed movement difficulty, but dragging differs from simple pointing and is sensitive to movement sequence, target geometry and direction.

The Steering Law models constrained-path movement and becomes relevant if later card interaction includes corridors, insertion channels, forbidden regions or deforming paths.

These models can help normalize task difficulty across candidates, but they do not tell us:

- which mapping feels physical;
- which mapping preserves agency;
- whether a target should exist at all;
- whether full drag is the correct semantic action.

### Experiment implication

When comparing control laws, keep task geometry controlled enough that a candidate does not win merely because its target/path is easier.

## 6. Correction behavior is evidence

Raw success/failure is too weak.

Potentially useful behavioral signals include:

- number and magnitude of direction reversals;
- overshoot near target;
- corrective submovements;
- time from peak velocity to release;
- dwell before release;
- abort/cancel frequency;
- re-grab frequency;
- oscillation around an insertion boundary;
- path efficiency;
- divergence between control point and rendered object;
- whether the user slows unnaturally to keep the system stable.

Interpretation must remain cautious. More correction can mean poor mapping, deliberate exploration or a difficult task.

## 7. Agency-aware assistance

Assistance is not simply `good` or `bad`.

Candidate assistance can vary by:

- strength;
- timing;
- predictability;
- reversibility;
- whether it acts on trajectory or only on final goal;
- whether the user can perceive that assistance is active;
- whether it preserves personal movement variability;
- whether it changes the outcome or only makes intent easier to express.

### High-risk assistance patterns

- strong auto-aim before intent is clear;
- snap that changes destination late in the gesture;
- hidden gain changes that vary by context without feedforward;
- trajectory steering that the user must fight;
- smoothing that removes useful corrective motion;
- assistance that improves success rate while making ownership ambiguous.

### Lower-risk hypotheses

- larger semantic target than visible geometry, when truthful;
- local target reaction/feedforward before capture;
- weak attraction only after intent is highly probable;
- assistance strongest in the final corrective phase rather than throughout movement;
- post-commit choreography that no longer competes with motor control.

These are research hypotheses, not product decisions.

## 8. Materiality must be decomposed

A report such as `this feels heavier` may arise from several independent sources:

- temporal lag;
- control/display gain;
- rotational inertia;
- preserved off-center grab point;
- depth/parallax;
- neighbor displacement;
- deformation;
- release follow-through;
- settle dynamics;
- sound;
- haptics;
- expectation created by visuals.

Therefore future internal experiments should never use `heavy` as a primitive variable.

Use explicit dimensions and isolate them when practical.

## 9. Interaction aesthetics is not a performance metric

A highly efficient interaction can still be sterile.

Conversely, a materially expressive interaction can be enjoyable but too tiring or slow for repeated use.

Future evidence should separately record:

- desire to keep manipulating the object without task necessity;
- spontaneous experimentation;
- perceived character;
- frustration;
- fatigue;
- whether repeated use becomes automatic in a good way or merely tolerated;
- whether users develop a personal movement style;
- whether expressive variation remains compatible with precision.

## 10. First-contact and mastery may need different qualities

A mapping can be immediately obvious but shallow, or initially unusual but rewarding to master.

Do not automatically optimize for zero learning cost.

However, learning cost must buy something real:

- more expressive range;
- better precision after adaptation;
- stronger materiality;
- lower fatigue;
- richer semantic control;
- transferable skill.

If a mapping requires adaptation only to compensate for arbitrary distortion, reject it.

## 11. Candidate evidence vector

For internal research, think in a vector rather than a winner score:

`candidate = {`

- `acquisition clarity`
- `motor precision`
- `transport speed`
- `correction burden`
- `agency`
- `predictability`
- `material character`
- `expressive range`
- `fatigue`
- `error recovery`
- `adaptation cost`
- `repetition endurance`

`}`

Do not turn this into mandatory bureaucracy. Use only dimensions relevant to the current experiment.

## 12. Minimal future task family

Before implementation, the first control-law fixture should be able to exercise at least these classes without game rules:

### T1 — slow trace

Tests precision, low-speed stability and whether the system fights deliberate movement.

### T2 — fast sweep

Tests expressive dynamics at high velocity/acceleration.

### T3 — hard reversal

Tests lag, overshoot, damping and ownership when intention changes abruptly.

### T4 — precision placement

Tests corrective phase, final acquisition and whether materiality disappears or interferes near the goal.

### T5 — aborted movement

Tests cancel dignity and whether the control law lets the user reverse intent without a fight.

### T6 — repeated alternation

Tests adaptation, fatigue and whether a mapping remains pleasant after novelty dies.

### T7 — mapping switch

Tests adaptation/aftereffect and whether candidate differences are being learned rather than naturally understood.

No Owner-facing fixture is authorized by this list.

## 13. Order effects are a serious confound

If a user experiences a transformed mapping first, later direct control may feel unusually light/fast. The reverse order can make transformed control feel unusually sluggish/heavy.

Therefore future comparisons should use neutral labels and deliberate ordering/counterbalancing where feasible.

For one-Owner research, perfect experimental balance is impossible, but order must at least be recorded and interpretations kept modest.

## 14. Device/body effects cannot be averaged away

Mouse, trackpad and touch are different control loops.

Touch adds:

- direct contact;
- finger occlusion;
- skin friction and physical device stabilization;
- thumb-reach geometry;
- no hover;
- possible platform haptics.

Desktop pointer adds:

- greater visual separation between body and cursor;
- higher precision;
- hover;
- large movement ranges;
- different gain/acceleration supplied by OS/device.

A candidate may legitimately have different control laws across platforms while sharing semantic interaction contracts.

## 15. Current implications for P0–P3

### P0 — direct baseline

Necessary as a reference, but `direct` must be measured in terms of grab-point correspondence and total pipeline behavior, not merely absence of an explicit spring.

### P1 — direct position + secondary dynamics

Still the strongest low-risk hypothesis.

Internal design should initially place materiality in a **single secondary channel**, likely off-center rotational response, before combining multiple channels.

### P2 — bounded acceleration-sensitive distortion

Research-value remains high, but it is especially vulnerable to adaptation and agency confounds.

The important question is not whether users eventually perform well. It is whether the distortion adds material character without creating correction burden or loss of authorship.

### P3 — lag-heavy positional spring

Keep as a real contrast condition.

Do not caricature it. A tuned spring may still be preferred aesthetically. But if its value depends on users learning to compensate for lag, that must be visible in the evidence.

## 16. Current decision

Run 03 remains **NOT READY for Owner testing**.

The next work before INTERNAL implementation should define:

1. the exact control variable and transfer function for P0/P1/P2/P3;
2. which task(s) can distinguish them with the least confounding context;
3. the instrumentation required to detect corrections, divergence and adaptation;
4. which metrics are descriptive only and which can reject a candidate;
5. a two-lane validity plan: stripped control bench plus minimal card/hand context;
6. mobile and desktop separation;
7. experimental ordering and reset/washout strategy;
8. what human perceptual question remains after mechanical rejection.

Only then should an INTERNAL fixture be built.

## External research touchpoints

- altered display gain and visuomotor adaptation literature;
- Fitts/dragging and corrective-submovement literature;
- Steering Law for constrained trajectory tasks;
- sense-of-agency literature for delayed/altered feedback;
- shared-control and assistance research showing performance/agency tradeoffs;
- recent variability-preserving shared-control work suggesting that natural movement structure may itself contribute to agency.

These sources constrain our hypotheses. They do not provide final product parameters.
