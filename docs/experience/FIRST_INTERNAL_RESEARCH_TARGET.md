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

## Evidence boundary — latency is not a free material channel

Direct-touch research is an important warning against using ordinary temporal delay as the default way to express weight. Controlled dragging studies found performance costs as latency increased even within low-latency conditions, and work on very-low-latency touch systems suggests that the perceptual/performance opportunity continues well below typical commodity-device delay.

Therefore the research prior is:

**acknowledge contact and preserve the primary control loop as quickly as practical; treat deliberate temporal lag as a hostile variable that must earn its existence.**

This does not establish a universal millisecond threshold for Tysiac. Device/browser/render pipelines and task geometry differ.

Pseudo-haptic control/display research provides a different kind of evidence: spatial/kinematic mismatch can evoke weight/resistance while retaining ownership in some visuomotor contexts. Most strong quantitative evidence comes from VR or indirect visuomotor setups, so their numeric C/D ratios must **not** be transplanted into touchscreen card control.

The only safe transfer is the hypothesis that predictable bounded sensorimotor transformation can carry material information.

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

P3 is particularly useful because current external evidence gives us reason to expect it to hurt direct-touch precision. A surprising win would therefore carry high information value.

## Variables to hold constant initially

The first mechanical comparison should keep card geometry/art, visual depth/shadow, background, acquisition hitbox, target-free movement space, release destination and frame/time-step behavior approximately constant. It should start without sound or haptics, and without neighbor cards unless a later subtest explicitly adds them.

This makes the instrument less product-like than a final Tysiac hand. That is desirable for causal clarity — **but only as the first lens, not as sufficient evidence**.

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

Desktop is an **analytical lens**, not the reference body.

## Why Hand Field is second, not first

Hand-field coupling is likely one of the most important product questions, but it depends on what the controlled card itself does. Once a stable primary relationship exists, research can ask whether materiality should shift from the card into relational behavior among neighbors.

This ordering avoids using whole-hand animation to compensate for a weak held-object control law.

## Why intent/commit and assistance come later

Reorder/play interpretation and target assistance require a real hand geometry, departure zones, target topology and at least representative gameplay context. Testing them now would import too many hidden assumptions.

## Adversarial review of this research target

### Attack 1 — ecological validity

A card in empty space may not have meaningful perceived mass at all. In real play, material character may be dominated by leaving the hand, neighbor pressure, target contact and ownership transfer.

**Correction:** a mechanically viable result from the isolated lane must later survive a minimal-context lane before it can justify Owner testing.

### Attack 2 — mouse bias

Mouse/pointer control may reward different mappings than direct touch.

**Correction:** desktop can reject unstable control laws but cannot select the final mobile candidate. Touch-specific internal rehearsal remains mandatory before Owner exposure.

### Attack 3 — pseudo-haptics domain mismatch

Strong C/D-ratio findings often come from VR/indirect settings with different proprioceptive information.

**Correction:** P2 is a hypothesis generator, not evidence that touchscreen C/D manipulation will feel like weight.

### Attack 4 — secondary dynamics are still a bundle

P1 can easily become `rotation + tilt + settle + shadow`, making causal attribution impossible.

**Correction:** P1 must begin with one secondary carrier or a theoretically necessary minimal pair. Additional channels require later evidence.

### Attack 5 — P3 can become a straw man

If the lag-heavy condition is deliberately awful, beating it proves nothing.

**Correction:** P3 should be stable and plausible enough to represent a genuine alternative inspired by the old positive directional response, not a caricature.

### Attack 6 — metrics can optimize the wrong thing

Low error, low overshoot and short movement time do not prove good interaction aesthetics. A candidate can be objectively efficient and experientially dead.

**Correction:** internal metrics are rejection filters only. They cannot promote a candidate.

### Attack 7 — removing sound/haptics may alter material perception

Multisensory coupling can materially change weight/contact impression.

**Correction:** the first mechanical isolation deliberately excludes them, then surviving control laws later need a controlled sensory-orchestration stage. Absence of early material richness cannot by itself reject a precise control law.

### Attack 8 — neutral visuals are not truly neutral

Card thickness, shadow, scale and perspective already bias perceived physicality.

**Correction:** use restrained constant visuals and record them as part of the experimental apparatus, not as `neutral truth`.

## Revised internal sequence

A future internal instrument should conceptually contain two validation contexts rather than one:

### Lane I — stripped coupling bench

One controlled object, minimal context. Purpose: reject unstable/unpredictable control laws and compare basic coupling.

### Lane II — minimal contextual check

Same surviving control law placed into a small hand-like source with a simple departure/return relation, but without real gameplay. Purpose: detect whether the isolated result reverses once relational context exists.

Only candidates that remain mechanically credible across both lanes are worth considering for later mobile-occlusion and Owner studies.

This two-lane model is still a research plan, not authorization to implement now.

## Research value test

The transferable question is not `what spring feels good on a card`.

It is:

> How can an interactive system add material/supportive transformation around a user's action while preserving motor ownership, precision, predictability and honest causality?

If the instrument cannot answer that, it should be redesigned before implementation.

## Current readiness

Still **NOT READY for implementation**.

Before INTERNAL READY design work must still define exact minimal P0/P1/P2/P3 control laws conceptually, plausible bounded parameter ranges, how grab point/rotation are handled without introducing another major variable, restrained constant visual treatment, internal tasks (slow trace, fast sweep, reversal, precision placement, cancel), low-overhead logging, the Lane I -> Lane II transition, desktop versus mobile internal boundaries, and one further review of whether the proposed apparatus is measuring control ownership or merely preference among motion styles.
