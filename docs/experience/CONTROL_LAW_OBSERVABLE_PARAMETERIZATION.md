# Control-law observable parameterization

Status: INTERNAL research design. Not product tuning and not Owner-ready.

## Purpose

Avoid encoding research knowledge as arbitrary implementation constants such as `spring = 0.82` or `damping = 0.7`.

The first control-law experiment should be specified primarily through **observable behavior** that remains interpretable across implementations, devices and later donor contexts.

## 1. Parameterize the consequence, not only the coefficient

Implementation coefficients are useful internally, but the research should describe candidates through quantities such as:

- maximum grab-point divergence;
- time to recover after an abrupt reversal;
- peak card rotation for a defined movement;
- settling time after input stops;
- overshoot after a reversal;
- low-speed tracking error;
- path distortion during a standard sweep;
- correction burden during placement.

Whenever possible normalize spatial quantities to card geometry or task geometry rather than CSS pixels.

Example:

`peak divergence = 0.03 card widths`

is more transferable than:

`spring offset = 4.2 px`

## 2. Canonical motion probes

Internal probes should use synthetic/reference trajectories in addition to real human input.

These probes are not intended to imitate the Owner perfectly. They make control laws mechanically comparable.

### Probe S — slow linear trace

Constant low velocity over a fixed normalized distance.

Measures:

- low-speed divergence;
- jitter amplification;
- derivative-estimator stability;
- whether material effects improperly leak into precision mode.

### Probe F — fast linear sweep

High velocity with smooth acceleration/deceleration.

Measures:

- peak material response;
- divergence;
- angular excursion;
- transport-phase behavior.

### Probe R — abrupt reversal

Movement accelerates in one direction, then strongly reverses.

Measures:

- overshoot;
- recovery time;
- oscillation;
- whether the object appears to resist a changed intention.

### Probe Z — repeated zig-zag

Alternating directional movement over several cycles.

Measures:

- cumulative instability;
- phase lag;
- chatter;
- whether a controller becomes progressively detached.

### Probe P — precision settle

Fast transport followed by slow final approach into a target region.

Measures:

- transition from transport to correction;
- low-speed ownership after high-speed dynamics;
- final acquisition error;
- settle tail.

### Probe C — cancel reversal

Move away from origin then return before release.

Measures:

- reversibility;
- whether dynamic state fights cancellation;
- how rapidly the object becomes direct again.

## 3. Normalized observables

### Grab-point error

`E_g = |p - G| / W_card`

where `W_card` is rendered card width.

Record:

- RMS error;
- peak error;
- error near final precision phase;
- error immediately after reversal.

### Rotation

Record:

- peak absolute angle;
- angular velocity;
- time from peak input acceleration to peak rotation;
- time to return near rest.

### Path distortion

Compare rendered center/grab path against the direct-reference path.

Useful outputs:

- normalized path-length increase;
- maximum orthogonal deviation;
- temporal lag/cross-correlation estimate.

### Recovery time

Time after a reversal/input stop until the candidate returns to a small bounded error region.

Use a normalized tolerance rather than exact pixel equality.

### Correction burden

For human trials later, descriptive proxies can include:

- number of velocity reversals near target;
- number of re-accelerations after initial deceleration;
- time spent in final correction;
- overshoot crossings;
- re-grabs after release/cancel.

These are evidence, not direct measures of subjective quality.

## 4. P0 observable target

P0 should approximate the reference floor:

- near-zero grab-point error subject to browser/render timing;
- zero candidate-specific rotational material response;
- no dynamic settle while held;
- immediate reversal response.

Any substantial observed lag in P0 is pipeline noise and must be investigated before comparing material candidates.

## 5. P1 observable exploration axes

P1 should preserve effectively zero grab-point divergence while varying **rotational response**.

Do not tune using arbitrary torque constants alone.

Explore observable bands such as:

- very small rotational response — likely imperceptible/control condition;
- moderate bounded response — candidate material band;
- deliberately strong response — stress boundary.

For each band record:

- peak angle under Probe F/R;
- recovery time;
- angle dependence on grab location;
- visual readability impact.

The actual degree values remain INTERNAL exploration variables until perception is tested.

## 6. P2 observable exploration axes

P2 intentionally creates grab-point discrepancy.

Primary independent observable:

`peak bounded divergence / card width`

Secondary observable:

`recovery time to near-direct tracking`

Initial INTERNAL sweep should include:

- effectively zero discrepancy;
- barely visible discrepancy;
- moderate clearly visible discrepancy;
- deliberately intrusive boundary.

Do not treat these words as final categories; use them to find stable regions mechanically before perceptual calibration.

Critical rule:

At slow movement, the candidate must converge toward the direct baseline so precision is not permanently taxed.

## 7. P3 observable exploration axes

Parameterize the second-order spring by interpretable dynamic properties:

- damping ratio `zeta`;
- natural frequency / equivalent settling-time target;
- maximum divergence under canonical probes.

Prefer near-critical regimes for serious candidates.

Use an underdamped condition only if intentionally testing expressive bounce, not as the representative `heavy` condition.

P3 should include at least one configuration that a competent interaction designer could plausibly choose for production; otherwise the comparison is biased.

## 8. Do not overfit to synthetic probes

Synthetic trajectories are for mechanical comparability and stability rejection.

A law that performs cleanly on S/F/R/Z/P/C may still feel bad because human motion is adaptive, noisy and intentional.

Therefore the sequence is:

`synthetic mechanical probes -> internal manual rehearsal -> minimal context -> eventual Owner perception`

not:

`synthetic score winner -> product`.

## 9. Human adaptation as a confound

When a person practices a transformed control law, their trajectory changes.

Therefore a candidate can appear mechanically better in late trials because the human learned to compensate.

Later instrumentation should preserve:

- trial order;
- variant identity;
- early vs late trial segment;
- switch points between mappings;
- immediate post-switch trajectories.

Do not aggregate them into one mean.

## 10. Interaction quality regions, not single optimum

The likely output is not one perfect value.

A more useful model is a set of regions:

### Invisible region

Transformation is too small to produce reliable perceptual/material benefit.

### Useful material region

Transformation is perceptible and adds desired character while maintaining ownership/precision.

### Intrusive region

Transformation begins to cause correction, distrust, fatigue or `system fighting me` perception.

### Broken region

Control becomes unstable, ambiguous or plainly lag-like.

The boundaries may differ by:

- input device;
- screen size;
- task phase;
- grab location;
- user;
- movement speed;
- final product context.

The research should seek robust regions, not false universal constants.

## 11. Multi-object transfer

A future donor claim should avoid preserving card-specific units.

Equivalent observables in other projects might be:

- JV component: grab-point divergence relative to component size;
- world object: rotational/positional recovery after direction change;
- brush/tool: distance between intended and rendered tool locus;
- node/editor object: correction burden during snap/insertion.

This makes observable parameterization more donor-friendly than copying implementation constants.

## Current readiness

Still **NOT READY for Owner testing**.

This document reduces arbitrary parameter tuning but INTERNAL implementation still needs:

1. actual synthetic trajectory definitions in normalized time/distance;
2. derivative-estimation choice;
3. integration stability strategy;
4. logging schema;
5. neutral visual geometry;
6. adversarial validity review;
7. technical bench implementation and automated probe runner;
8. manual internal rehearsal before any Owner exposure.
