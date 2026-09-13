# Card Embodiment — competing hypothesis matrix

## Status

Research stage: hypothesis formation.

This file narrows the broad phenomenon map into a few competing explanations that could eventually justify isolated experiments. It does **not** make the next Owner test ready.

The purpose is to avoid building one rich prototype that bundles every promising idea and then leaves us unable to explain why it felt good or bad.

---

# Research family A — where should perceived mass live?

## A0 — question

How can a digital card feel substantial without making primary control feel delayed or stolen?

The old WEIGHT prototype mostly expressed weight through trailing movement. That is insufficient evidence because global lag may be interpreted as latency rather than material.

## A1 — positional-lag mass

### Model

The card's main position follows the pointer/finger through a damped spring or similar lag.

### Predicted benefit

- obvious visual inertia;
- easy to perceive in isolation;
- potentially strong first-contact "heaviness".

### Predicted failure

- user performs corrective movements against the lag;
- card feels slow/networked rather than heavy;
- precise insertion becomes worse;
- high-speed direction reversals reduce ownership.

### Falsifying evidence

If people describe the interaction primarily as delayed/sluggish and make more correction movements without a compensating increase in desired material character, positional lag is a poor primary mass carrier.

## A2 — secondary-dynamics mass

### Model

Primary card translation remains highly direct. Mass is carried mainly by secondary responses:

- rotation around preserved/stabilized grab point;
- acceleration-dependent tilt;
- neighbor displacement;
- release follow-through;
- settle time;
- contact sound/haptic where appropriate.

### Predicted benefit

- maintains positional ownership and precision;
- materiality can remain rich;
- network latency remains easier to distinguish from object dynamics.

### Predicted failure

- feels visually decorative rather than material;
- insufficient weight impression;
- too many secondary motions create noise/readability loss.

### Falsifying evidence

If direct translation consistently reads as weightless regardless of coherent secondary dynamics, primary position may need some controlled decoupling.

## A3 — acceleration-sensitive control/display mass

### Model

The card remains close to direct control during slow precision movement, but fast acceleration or direction changes produce a small temporary control/display discrepancy.

This is conceptually related to pseudo-haptic control/display manipulation, not literal inertial simulation.

### Predicted benefit

- precise slow movement remains direct;
- fast movement can imply resistance/mass;
- material response depends on how the user moves, creating expressive feedback.

### Predicted failure

- mapping feels inconsistent or "sticky";
- user cannot predict card location;
- discrepancy becomes visible as input error;
- adaptation cost outweighs material benefit.

### Falsifying evidence

If users repeatedly overshoot/correct or explicitly notice the gain law as system interference, the range is too large or the approach is wrong.

## Current assessment

A2 is currently the safest conceptual baseline, not because it is proven, but because it preserves control fidelity while allowing multiple material channels. A3 is the highest-information experimental challenger. A1 remains useful as a deliberately strong contrast/control condition rather than a likely final model.

No promotion is justified yet.

---

# Research family B — how should touch occlusion be resolved?

## B0 — question

How do we preserve the feeling of touching *this exact card* while letting the user see the card, insertion relation and destination under a real finger?

## B1 — strict co-location

### Model

Card stays under the contact point with preserved grab position.

### Strength

- maximal motor/direct-contact correspondence;
- no mysterious offset transition.

### Failure prediction

- rank/suit and insertion target become occluded;
- player raises finger/hand awkwardly or makes unnecessary corrections;
- target feedback must escape to unrelated screen regions.

## B2 — fixed visual lift/offset

### Model

On acquisition the card shifts a fixed amount away from the finger, usually upward.

### Strength

- simple;
- content visible;
- familiar mobile pattern.

### Failure prediction

- acquisition contains a visible jump;
- exact grab point loses meaning;
- feels like controlling a proxy rather than the card;
- fixed offset may be wrong near screen edges or for different grips.

## B3 — adaptive occlusion relief

### Model

Initial contact remains close to co-located. Offset/expansion emerges progressively only when occlusion becomes functionally relevant — for example when the card leaves the hand, approaches a dense insertion relation or needs precise target negotiation.

Possible forms include:

- controlled card lift above the contact point;
- hand fan opening around the manipulated card;
- exposed informational corner;
- target reaction extending beyond the finger footprint;
- reduced control/display gain during fine placement;
- temporary local magnification/proxy only in extreme precision cases.

### Predicted benefit

- preserves initial contact ownership;
- pays complexity only when needed;
- adapts to interaction phase.

### Predicted failure

- phase transition itself becomes surprising;
- user visually reorients when mapping changes;
- different contexts produce inconsistent card/finger relation.

### Falsifying evidence

If adaptive relief causes more reorientation/correction than strict or fixed mappings, it is not worth its complexity.

## Current assessment

B3 is the strongest research hypothesis because it treats occlusion as a situational problem rather than a permanent reason to detach the object. It must be tested against B1/B2 rather than assumed superior.

---

# Research family C — is "meatiness" primarily in the card or in the hand field?

## C0 — question

What creates the stronger sense that the player's hand is a living, owned workspace?

## C1 — rich individual card / simple neighbors

### Model

Held card receives most physical character. Other cards shift through clean but relatively discrete layout transitions.

### Benefit

- focus remains obvious;
- easier implementation and precision;
- lower peripheral motion.

### Failure prediction

- hand still feels like a sortable list;
- insertion feels index-based rather than spatial;
- moving one card does not make the workspace feel materially connected.

## C2 — moderate card / continuous local hand field

### Model

Held card itself is relatively restrained, while its movement creates a continuous local deformation among nearby cards:

- local gap pressure;
- decaying neighbor displacement;
- fan angle/spacing response;
- clear future settle position;
- stable outer landmarks.

### Benefit

- the hand behaves as one object/system;
- insertion can be felt before release;
- materiality emerges from relations rather than card theatrics.

### Failure prediction

- excessive peripheral motion;
- insertion target becomes elastic/imprecise;
- the hand steals attention from the card and table.

## C3 — strongly coupled field

### Model

A more physically expressive hand where displacement propagates broadly and the whole fan noticeably compresses/expands.

### Purpose

Not current favorite. Useful as an experimental upper bound to learn when collective response becomes distracting.

## Current assessment

C2 is currently more aligned with Owner evidence and the list-vs-workspace distinction than C1, but that inference is not yet demonstrated. C3 could be valuable as a stress/control condition.

---

# Research family D — how should reorder and play intent diverge?

## D0 — question

Can one continuous manipulation language support both personal hand organization and card play without hidden modes or accidental commitment?

## D1 — geometric progressive intent

### Model

Intent emerges from trajectory/context:

- lateral movement inside hand strengthens reorder interpretation;
- movement away from the hand strengthens play interpretation;
- target relation and displacement contribute progressively;
- release commits only if play relation is sufficiently established.

### Benefit

- no explicit mode;
- highly embodied;
- same object can move fluidly from organization into gameplay.

### Failure prediction

- diagonal movement ambiguous;
- small-screen hand geometry makes thresholds fragile;
- user discovers invisible gesture boundaries by failure rather than feedforward.

## D2 — semantic gesture separation

### Model

Different explicit gestures express the two intentions, e.g. one interaction for reorder and another for play.

Possible examples are deliberately unspecified; the point is separation, not a particular gesture.

### Benefit

- lower ambiguity;
- clear commit contract.

### Failure prediction

- larger learning burden;
- interaction feels modal or mechanical;
- one common action becomes unnecessarily slow.

## D3 — progressive interaction with explicit escape/confirmation only at ambiguity

### Model

Use D1 normally, but introduce an explicit micro-confirm/target-lock state only when movement evidence remains ambiguous or consequence is high.

### Benefit

- keeps common flow embodied;
- ambiguity gets a visible resolution mechanism rather than a hidden threshold.

### Failure prediction

- inconsistent interaction cost;
- user cannot predict when confirmation appears;
- "smart" system feels paternalistic.

## Current assessment

No favorite yet. This family should remain open longer than A/B/C because it depends on real hand geometry and actual gameplay frequency. It may also legitimately diverge between mobile and desktop.

---

# Research family E — how much assistance preserves agency?

## E0 — question

When do magnetism, snapping, target attraction, automatic gap opening or inferred intention support the user, and when do they become system takeover?

Sense-of-agency research and automation studies suggest that action/outcome delay and machine intervention can affect perceived control. That does not yield a direct UI rule, but it makes this a first-class research question.

## E1 — no assistance

### Model

User position/trajectory determines everything until hard legality boundary.

### Strength

- maximal visible ownership;
- predictable causal mapping.

### Failure

- unnecessary precision burden;
- motor noise becomes gameplay/UI difficulty.

## E2 — transparent local assistance

### Model

Assistance modifies relations the user can see:

- gap opens before release;
- target attraction increases only when clearly approached;
- snap field is spatially legible;
- user can pull away easily.

### Strength

- supports intent without pretending to know it too early;
- assistance itself becomes feedforward.

### Failure

- magnetism feels sticky;
- snap steals unusual but intentional placements;
- support becomes stronger than user movement.

## E3 — hidden predictive assistance

### Model

System predicts likely intention and corrects trajectory/target with minimal visible representation.

### Current role

Adversarial control condition / probable anti-pattern for core manipulation, not banned universally.

### Risk

High intent-fidelity and agency risk.

## Current assessment

E2 is the strongest conceptual candidate. The essential property is not weak assistance; it is **legible and escapable assistance**.

---

# Cross-family confounds

These hypothesis families cannot eventually be tested carelessly because the following can dominate judgement:

- card art/readability;
- shadow/depth treatment;
- sound material;
- haptics;
- frame rate;
- browser/device latency;
- target size;
- number of cards;
- hand curvature;
- animation easing unrelated to control law;
- novelty/order effects;
- naming of variants;
- actual Tysiac rule constraints;
- recording overhead;
- one-handed vs two-handed grip.

A research fixture should control these unless the confound itself is the variable under study.

# What can be reasoned further before testing

Still worth doing without Owner attention:

- derive plausible parameter ranges from motor-control/touch literature and internal technical constraints;
- decide which families can share one INTERNAL fixture without contaminating each other;
- simulate extreme cases and inspect stability/performance;
- map mobile and desktop hypothesis differences;
- define instrumentation that records behavior without affecting feel;
- work out authority/reconnect semantics independently of tactile style;
- decide which stable visual treatment is neutral enough not to dominate control-law comparisons;
- adversarially challenge the current provisional preferences A2/A3, B3, C2 and E2.

# What will eventually require human evidence

No amount of analysis can establish reliably:

- when decoupling stops feeling owned;
- whether secondary dynamics actually produce convincing mass;
- whether hand-field deformation feels organic or distracting;
- whether assistance feels supportive or invasive;
- whether a gesture boundary feels discoverable;
- whether an interaction remains pleasurable after repetition.

These are future Owner-test questions, not current assumptions.

# Current test readiness

Still **NOT READY**.

The project has moved from broad decomposition toward competing hypotheses, but must now narrow variables, control confounds and perform internal/adversarial design work before consuming Owner attention.
