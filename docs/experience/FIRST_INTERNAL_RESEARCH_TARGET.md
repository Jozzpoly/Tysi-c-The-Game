# First Internal Research Target — coupling before card-game context

## Status

Decision about research priority only.

No fixture is implemented by this document. Owner test status remains **NOT READY**.

## Decision

The first INTERNAL research instrument, when the design is ready enough to build, should target **control ownership under material/assistive distortion** before hand-wide reordering, play intent or target magnetism.

The key question is:

> How much and what kind of transformation can occur between human motion and card response before the interaction stops feeling owned, precise and trustworthy — and which transformations add useful material character instead of merely adding lag?

## Why this question comes first

Every later card interaction depends on a stable perception-action relationship. If pickup/motion itself is wrong, neighbor-field studies are contaminated, reorder/play thresholds are harder to judge, magnetism can mask poor control, latency can be confused with material dynamics and hand aesthetics can hide a broken motor relationship.

The same problem also appears in JV component manipulation, Multi World object handling and JES world-edit tools. The card is a clean 2D body for studying it.

The old `WEIGHT` mode showed that visible lag can create a distinct feel, but did not tell us whether the desired quality came from primary positional lag, angular dynamics, visual depth, neighbor response, release behavior or novelty.

External research gives us a real tension rather than a simple rule: temporal/spatial mismatch can reduce sense of agency, while controlled control/display mismatch can also evoke useful pseudo-haptic weight or resistance.

## Explicit non-goals

The first internal study should not yet answer final hand layout, card art, Tysiac legality, reorder-vs-play gesture, target attraction, opponent presence, final audio/haptics, production architecture or whether mobile and desktop should use identical mechanics.

## Candidate comparison family

### P0 — direct-control baseline

Primary translation follows the control point closely with minimal secondary dynamics.

Purpose: establish the control-ownership baseline and detect how much material quality is absent when mapping is intentionally simple.

### P1 — direct primary translation + secondary material dynamics

Keep primary position highly coupled while expressing material through a minimal selected set such as grab-point rotation, acceleration-derived tilt, release follow-through or controlled settle.

Do not activate every available channel; the internal design must choose the smallest combination needed to answer the question.

### P2 — small acceleration-sensitive control/display distortion

Allow a bounded discrepancy during high acceleration/direction changes while returning toward direct control for slow precision.

Purpose: investigate whether pseudo-haptic resistance can add materiality without continuous sluggishness.

### P3 — deliberately lag-heavy contrast

A strong positional-spring model similar in spirit to old WEIGHT.

Purpose: act as an upper/control boundary, not as a preferred product candidate. If it later wins under repeated precision tasks, that would materially challenge the current theory.

## Variables to hold constant initially

The first mechanical comparison should keep card geometry/art, visual depth/shadow, background, acquisition hitbox, target-free movement space, release destination and frame/time-step behavior approximately constant. It should start without sound or haptics, and without neighbor cards unless a later subtest explicitly adds them.

This makes the instrument less product-like than a final Tysiac hand. That is desirable for causal clarity.

## What internal rehearsal can measure without Owner attention

Before any perceptual judgement the system can inspect pointer/touch trajectory, rendered-card trajectory, positional difference, angular response, velocity/acceleration response, reversals, overshoot, settle duration, frame-rate sensitivity, deterministic repeatability, rapid-zig-zag stability and edge/cancel behavior.

These metrics cannot tell us which interaction feels best. They can eliminate mechanically bad candidates before Owner attention is involved.

## Stability rejection criteria

Reject an internal candidate before Owner testing if response changes materially with frame rate, rapid reversal creates runaway oscillation, the card detaches so far that contact becomes implausible, slow precision movement is dominated by system dynamics, release creates uncontrolled long settle, the mapping becomes unpredictably non-monotonic, intended material dynamics become indistinguishable from simulated network lag, or the candidate cannot cancel/recenter coherently.

## Mobile complication — do not ignore, do not mix yet

Touch occlusion is a separate high-value variable. The first pure control-law investigation should not silently solve occlusion by moving the card upward, because that would mix material/control and visibility.

After mechanically viable control laws exist, a second INTERNAL sub-study can cross a surviving control law with the occlusion family: strict co-location, fixed offset and adaptive occlusion relief.

This staged order is about research isolation, not product priority. Mobile remains equal long-term priority.

## Desktop complication

Pointer control has far lower occlusion and higher spatial precision, making desktop useful as a clean environment for isolating control-law dynamics. A mouse result is not allowed to certify mobile embodiment; it only narrows the mechanical family.

## Why Hand Field is second, not first

Hand-field coupling is likely one of the most important product questions, but it depends on what the controlled card itself does. Once a stable primary relationship exists, research can ask whether materiality should shift from the card into relational behavior among neighbors.

This ordering avoids using whole-hand animation to compensate for a weak held-object control law.

## Why intent/commit and assistance come later

Reorder/play interpretation and target assistance require a real hand geometry, departure zones, target topology and at least representative gameplay context. Testing them now would import too many hidden assumptions.

## Research value test

The transferable question is not `what spring feels good on a card`.

It is:

> How can an interactive system add material/supportive transformation around a user's action while preserving motor ownership, precision, predictability and honest causality?

If the instrument cannot answer that, it should be redesigned before implementation.

## Current readiness

Still **NOT READY for implementation**.

Before INTERNAL READY design work must still define exact minimal P0/P1/P2/P3 control laws conceptually, plausible bounded parameter ranges, how grab point/rotation are handled without introducing another major variable, neutral visual treatment, internal tasks (slow trace, fast sweep, reversal, precision placement, cancel), low-overhead logging, desktop-first mechanical rehearsal versus mobile simulation boundaries, and an adversarial review of whether isolation strips away too much context for mass perception to remain meaningful.
