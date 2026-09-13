# Card control law — minimal research specification

Status: conceptual mechanics specification for future INTERNAL research. No fixture is authorized by this document alone.

## Purpose

Define P0–P3 below style labels so future comparison can attribute differences to specific control-law mechanisms.

The first research family is deliberately narrow:

> How can a represented card gain material character while preserving motor ownership, precision and predictable control?

This document concerns only pointer/touch-to-card motion during reversible manipulation. It does not define play commit, game legality, hand layout, target assistance, sound, haptics or production visuals.

## Shared coordinate model

For every candidate track separately:

- `p(t)` — latest input/control point in screen coordinates;
- `g_local` — point on the card acquired at pickup, represented in card-local coordinates;
- `x(t)` — rendered card center position;
- `theta(t)` — rendered card in-plane rotation;
- `G(x, theta, g_local)` — rendered world/screen position of the acquired local grab point;
- `e_g = p - G(...)` — grab-point error;
- `v_p`, `a_p` — estimated input velocity/acceleration, used only where explicitly stated.

Primary research invariant where possible:

**The acquired local point remains the user's point of ownership.**

A candidate that silently snaps the card center under the pointer destroys the information contained in where the card was grabbed and should be treated as a different interaction family.

## Sampling and rendering separation

Input samples, control-law state update and rendering are separate layers.

Input layer:

- capture raw/coalesced pointer samples where supported;
- timestamp samples;
- never use predicted samples as canonical evidence of actual input;
- preserve raw trajectory for later analysis.

Control layer:

- consume time-stamped samples;
- estimate only the derivatives required by the active law;
- avoid filtering the primary position unless the candidate explicitly studies positional distortion;
- use time-based integration rather than frame-count constants.

Render layer:

- render latest model state at animation-frame cadence;
- visual polish must not alter the underlying control path during the first comparison.

## Shared pickup law

At acquisition:

1. determine the card-local point under the input;
2. store it as `g_local`;
3. do not teleport the card;
4. acknowledge contact visually through a common fixed treatment across candidates;
5. initialize candidate dynamic state without a discontinuity.

The exact acquisition threshold is held constant across the first comparison.

---

# P0 — rigid grab-point baseline

## Intent

Establish maximum simple motor ownership against which transformed candidates are compared.

## Law

Keep card orientation fixed at its pickup orientation for the first isolated bench.

Solve translation each update so:

`G(x, theta0, g_local) = p`

Thus the exact acquired point follows the actual control point.

Equivalent conceptual result:

- no positional spring;
- no velocity-dependent gain;
- no angular material response;
- no settle tail while held.

## What P0 is not

P0 is not `cheap/plain` and must not be visually presented that way.

It is the control-fidelity reference.

## Expected strengths

- minimal correction caused by the system;
- stable precision;
- predictable reversal;
- maximal attribution of position to user motion.

## Expected weaknesses

- cursor-like / weightless character;
- off-center grab point may have little felt meaning beyond acquisition;
- little expressive difference between slow and aggressive movement.

---

# P1 — rigid grab point + inertial rotational body

## Intent

Add materiality without introducing primary positional lag.

## Core invariant

At every render/control update, solve translation so the grabbed local point remains on the actual input point:

`G(x, theta, g_local) = p`

Therefore rotation may change card-center position, but the specific point held by the user does not visually detach.

## Angular model

Treat the card as a planar body held at `g_local`.

User acceleration creates an inertial pseudo-force at the card center. Relative to the grab point this produces a torque tendency.

Conceptually:

`tau_inertial = r_world × (-m_eff * a_filtered)`

where:

- `r_world` is vector from grab point to card center under current orientation;
- `m_eff` is an effective material coefficient, not literal kilograms;
- `a_filtered` is a derivative signal filtered only for the secondary angular response.

Angular dynamics:

`I_eff * theta'' + c_theta * theta' + k_theta * (theta - theta_rest) = tau_inertial`

with bounded angular displacement and velocity.

## Why this is promising

- primary contact remains exact;
- grabbing near the center naturally produces less rotational response;
- grabbing near an edge/corner produces more leverage;
- abrupt acceleration/reversal can communicate mass;
- slow precise translation can remain nearly rigid/direct;
- grab location gains semantic/material significance.

## Key risks

- exaggerated rotation can become theatrical rather than material;
- edge grabs may rotate too strongly;
- noisy acceleration estimates can cause chatter;
- rotation may obstruct rank/suit readability;
- an inertial law that persists too long after user intent changes can feel possessed rather than owned.

## First isolation rule

P1 initially gets **rotation only** as its material channel.

No positional lag, neighbor response, sound, shadow exaggeration, release follow-through or haptic difference in the first mechanical comparison.

Those can be layered only after the rotational mechanism is understood.

---

# P2 — bounded acceleration-sensitive positional distortion

## Intent

Test whether a small pseudo-haptic positional discrepancy can add resistance/materiality while preserving precision.

## Baseline target

`x_direct` is the card-center position that would keep the acquired point exactly on input given current orientation.

## Distortion state

Introduce a bounded offset `d(t)` that depends primarily on higher-speed acceleration/reversal rather than static position.

Conceptual target:

`d_target = clamp(-K_a * a_filtered, |d| <= d_max)`

with a fast return toward zero when acceleration falls.

Rendered center:

`x = x_direct + d`

## Required properties

- `d -> 0` during slow deliberate movement;
- bounded magnitude;
- monotonic response to intended manipulation;
- rapid recovery after reversal;
- no accumulating drift;
- no dependence on network/authority latency;
- obvious internal instrumentation of actual divergence.

## Why P2 is dangerous

Unlike P1, P2 intentionally violates exact grab-point co-location.

The distortion may be read as:

- mass/resistance;
- sticky input;
- browser lag;
- network lag;
- broken touch tracking;
- assistance fighting the user.

Its research value comes from locating whether a useful region exists, not from assuming it does.

## Initial parameter policy

Do not choose a final `d_max` from intuition.

Internal mechanical runs should sweep broad but bounded regions, reject unstable/obviously intrusive values and leave perceptual boundary calibration for later.

---

# P3 — damped positional spring

## Intent

Provide an honest strong contrast representing classic `weight by trailing position`.

## Model

Card target is the direct pose, but rendered translation follows a second-order system:

`m_p * x'' + c_p * x' + k_p * (x - x_direct) = 0`

or an equivalent stable analytic/time-step formulation.

## Requirements

- critically/near-critically damped region is included;
- underdamped oscillatory toy behavior is not the only P3 instance;
- no frame-rate-dependent constants;
- actual divergence is logged;
- settle/cancel is bounded.

## Why P3 remains necessary

The earlier WEIGHT lab showed this family has strong perceptual character.

It would be intellectually dishonest to remove it because theory currently disfavors it.

P3 must receive a competent implementation so it can genuinely falsify the preference for P1/P2.

---

# Derivative estimation

Velocity/acceleration are potentially useful only for P1/P2.

## Rule

**Do not smooth the primary controlled position merely to obtain cleaner derivatives.**

Instead:

1. preserve raw/coalesced position samples;
2. derive `v` / `a` from a short time-domain history;
3. filter the derivative signal separately;
4. use filtered derivatives only in secondary/material channels;
5. log both raw and filtered estimates.

Candidate filters can include a simple low-pass or One-Euro-style adaptive filter, but filter choice itself must be held constant across candidates being compared on another variable.

## Risk

Bad acceleration estimation can make P1/P2 look bad for reasons unrelated to their perceptual model.

Therefore derivative stability is an INTERNAL technical gate, not an Owner judgement.

---

# Release behavior for the first experiment

Release can easily become another material variable.

Therefore the first stripped comparison uses a common release law:

- release ends reversible control;
- card immediately enters the same neutral settle/return treatment in all variants;
- no candidate-specific throw/follow-through in the first family comparison.

Later studies may explicitly investigate release materiality.

---

# Lane I — stripped control bench

Purpose: mechanical rejection and low-level perception isolation.

Environment:

- one card;
- neutral background;
- no game rules;
- no neighbor cards;
- no sound/haptics;
- common shadow/depth;
- identical card size;
- no target assistance;
- common pickup/release visuals.

Tasks:

- slow trace;
- fast horizontal/diagonal sweep;
- abrupt reversal;
- precision placement;
- cancellation/return;
- repeated alternation.

Instrument:

- raw input path;
- rendered card path;
- grab-point error;
- rotational response;
- peak divergence;
- overshoot;
- reversals/corrective submovements;
- settle time;
- sample/frame timing.

Lane I may reject candidates. It may not certify product quality.

---

# Lane II — minimal ecological bridge

Purpose: verify that a surviving control law remains meaningful when the object has a source/context.

Environment:

- small representative card hand;
- no full Tysiac rules;
- one card can be picked, locally moved above the hand and returned;
- enough neighbor geometry to expose occlusion/relational context;
- no full reorder/play semantic split yet.

Key question:

Does the control-law effect survive once the card is perceived as **one member of an owned hand**, or was it only a cursor illusion in empty space?

Lane II still cannot certify production integration.

---

# Mechanical rejection gates

Reject before Owner test if a candidate exhibits any of the following in its intended parameter region:

- frame-rate-dependent feel/trajectory;
- unbounded or long-lived oscillation;
- non-monotonic mapping during basic movement;
- slow-precision instability;
- large unpredictable grab-point error;
- acceleration estimator chatter visible as card vibration;
- release/cancel that cannot recover rapidly;
- behavior strongly dependent on pointer event cadence rather than elapsed time;
- a supposedly material response that is visually indistinguishable from injected network latency;
- excessive correction burden caused by the controller under simple geometry.

---

# Perceptual questions that remain human-only

After mechanical rejection, instrumentation still cannot decide:

- whether P1 rotation feels like mass or decoration;
- whether P2 resistance feels material or broken;
- whether P3 lag feels satisfyingly heavy or merely sluggish;
- whether exact P0 feels responsive or lifeless;
- which candidate invites expressive manipulation;
- which candidate remains enjoyable after adaptation;
- how much discrepancy is tolerable before ownership drops;
- whether minimal context changes the ranking.

Those are legitimate future Owner-test questions — but only after INTERNAL rehearsal.

## Current readiness

This document materially advances exact control-law definition, but the project remains **NOT READY for Owner testing**.

Before INTERNAL implementation:

1. choose stable numerical exploration bands rather than product parameters;
2. specify derivative estimator and integration strategy;
3. define neutral card geometry and grab-point visualization policy;
4. define instrumentation schema;
5. define exact Lane I task geometry;
6. adversarially test whether P1 unfairly receives grab-location expressiveness unavailable to P0/P3;
7. decide how to make P3 competent without turning it into a deliberately bad strawman;
8. define a minimal Lane II that does not prematurely import hand-field dynamics.
