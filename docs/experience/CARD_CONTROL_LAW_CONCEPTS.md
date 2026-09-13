# Card Control-Law Concepts

## Status

Conceptual mechanics only. No implementation authorization.

This document refines P0–P3 from `FIRST_INTERNAL_RESEARCH_TARGET.md` into separable control-law ideas. The purpose is to remove vague labels such as `weighty` before parameter work begins.

## Shared coordinate model

Any future implementation should explicitly distinguish at least:

- **control point** — finger/pointer position supplied by input;
- **grab point** — location on the card acquired at pickup, expressed in card-local coordinates;
- **card pose** — visual position and orientation;
- **target pose** — pose implied by direct control before material dynamics;
- **visual/material pose** — final rendered pose after bounded material transformation.

This separation is important because `card follows pointer` is otherwise ambiguous: center-following destroys grab-point meaning, while exact grab-point preservation supports a stronger contact relation.

## Shared invariant I — immediate acquisition acknowledgement

All conditions should acknowledge acquisition on the first available rendered frame after input is received.

Material character must not be implemented by delaying recognition that contact occurred.

## Shared invariant II — bounded divergence

Any deliberate difference between target pose and visual/material pose must be bounded and convergent.

The user must not accumulate unbounded separation merely by dragging farther or faster.

## Shared invariant III — stable slow precision

At sufficiently slow deliberate motion, every serious candidate should converge toward a predictable precise mapping.

This creates a common precision regime even if fast motion has character.

## Shared invariant IV — release has a defined contract

Material state cannot remain a hidden spring after control is released.

Each candidate must specify:

- whether release velocity is inherited;
- what pose becomes the settle target;
- maximum settle duration;
- how cancellation differs from commit;
- whether a card can be reacquired during settle.

These details should not be left to generic CSS easing.

---

# P0 — kinematic grab-point baseline

## Semantic contract

The acquired point on the card remains attached to the control point during manipulation.

The card has no deliberate translational inertia.

## Why this baseline is stronger than `center follows pointer`

If the user touches near the right edge, that location remains the held point. The object therefore preserves where it was acquired rather than teleporting its center under the finger.

This gives P0 meaningful object identity while remaining maximally direct.

## Allowed secondary response

Only state legibility that does not materially transform motion, such as a fixed pickup depth/shadow change.

No acceleration-derived rotation in the strict baseline.

## Research role

P0 tests the experience of precise ownership with almost no material transformation.

It is not intended to be visually dead; it is intended to be mechanically simple.

---

# P1 — grab-point-preserving rotational materiality

## Core idea

Primary translation remains kinematically direct at the acquired grab point.

Materiality is introduced first through **bounded orientation response**, not positional trailing.

The card can rotate around or relative to the held point according to a small motion-derived signal while the contact relation remains intact.

## Candidate signal families

These are alternatives, not additive requirements.

### P1a — velocity-direction orientation

Orientation responds to lateral movement direction/speed.

Potential quality:

- readable motion character;
- low model complexity.

Risk:

- reads as decorative banking rather than mass.

### P1b — acceleration / direction-change torque

Orientation responds mainly when the control point accelerates or reverses.

Potential quality:

- slow precise movement remains quiet;
- fast change produces an apparent inertial moment;
- material response becomes contingent on how the user moves.

Risk:

- noisy raw acceleration;
- jitter if filtering is poor;
- excessive angle can reduce card readability.

### P1c — grab-offset torque

The influence of motion depends on the distance/direction between grab point and card center.

Touching near an edge therefore creates a different rotational response than touching the center.

Potential quality:

- point of contact gains physical meaning;
- material character emerges from geometry rather than arbitrary animation.

Risk:

- edge grabs may become overly unstable;
- user may not want grab location to alter behavior this much.

## First conceptual preference

If later implemented internally, P1b + a restrained form of P1c is a plausible hypothesis because it preserves direct slow control and makes grab position meaningful.

However, combining them already creates a pair of variables. A strict first fixture may need P1b alone, with centered grab, followed by grab-point variation separately.

## Saturation requirement

Orientation must have a strict perceptual/readability bound. The research target is material response, not free card tumbling.

## Settle

When acceleration drops, orientation should converge toward a readable stable pose without causing translational correction.

The settle law itself can influence perceived material and therefore must be held constant during the first comparison.

---

# P2 — bounded acceleration-sensitive positional distortion

## Core idea

The visual card position may deviate slightly from the direct target under fast acceleration or direction changes, but converges toward it during slow/steady motion.

This is not ordinary fixed latency and not an unbounded static C/D ratio.

## Why use acceleration rather than raw distance

A fixed gain different from 1 creates separation that grows with drag distance on a co-located touchscreen.

A transient acceleration-linked displacement can instead:

- appear mainly when mass would be perceptually relevant;
- return toward direct control during precision movement;
- remain bounded.

## Candidate conceptual relationship

When control acceleration rises, visual pose develops a small displacement opposite the acceleration vector. The displacement is filtered, saturated and decays rapidly when acceleration falls.

Do not interpret this as a final physical simulation. It is a pseudo-haptic mapping hypothesis.

## Main danger

This can feel exactly like lag if:

- amplitude is too large;
- decay is too slow;
- filtering creates obvious delay;
- the user changes direction quickly;
- touch co-location makes separation visually salient.

## Strong requirement

P2 must always be compared against P0/P1 under slow precision and rapid reversal. If it only feels heavier during theatrical sweeps but harms ordinary placement, it fails.

---

# P3 — stable positional spring contrast

## Core idea

Card pose follows direct target through a conventional stable damped second-order relationship.

## Research role

P3 represents the traditional `weight = trailing object` approach in a technically competent form.

It exists to test whether our skepticism is justified, not to serve as a deliberately bad straw man.

## Requirements

- stable across supported frame rates;
- bounded maximum separation;
- no persistent oscillation;
- defined critical/near-critical damping family;
- quick recovery at low movement speed;
- release/cancel semantics separate from drag spring.

## Expected risk

Even a well-tuned P3 may create correction behavior and reduce sense of direct possession because the primary object itself trails the controlling body.

That remains a hypothesis until tested.

---

# Grab point as a separate research axis

Grab point is important enough that it should not be accidentally varied across P0–P3.

Potential later conditions:

### G0 — normalized center grab

Every acquisition controls the card from its center.

Advantages:

- mechanical simplicity;
- removes torque variability.

Disadvantage:

- card visibly jumps when touched away from center;
- contact location loses meaning.

### G1 — exact local grab point

The touched location remains the controlled local point.

Advantages:

- strong contact continuity;
- useful for rotational materiality.

Risks:

- large edge-dependent motion;
- finger occlusion interacts strongly with content.

### G2 — stabilized local grab point

Preserve the acquired point but gently constrain extreme leverage/rotation influence.

Potential donor idea:

Preserve semantic contact while regularizing mechanically awkward extremes.

This is an assistance mechanism and therefore must remain legible.

## Current preference

Use G1 for the conceptual truth model, but do not assume the final mobile interaction can tolerate its full mechanical consequences. G2 is a serious alternative, not a compromise by default.

---

# What must not be hidden inside easing

Generic UI animation vocabulary such as:

- `ease-out`;
- `spring(0.7)`;
- `duration: 220ms`

is not enough to define manipulation behavior.

During active control, dynamics should be described in terms of the user/system relationship:

- what remains directly controlled;
- what can diverge;
- what signal drives divergence;
- how large divergence can become;
- how it converges;
- what changes on release.

Easing remains useful for non-controlled transitions, but cannot substitute for a control law.

# Parameter philosophy

Do not begin by searching for a globally `best` numeric setting.

Future internal parameter work should identify **qualitatively distinct regions**:

- effectively direct;
- perceptibly material but controllable;
- strongly transformed;
- unstable/ownership-breaking.

The purpose is to locate behavioral regimes before fine tuning.

# Cross-platform implication

The semantic law can be shared while parameterization differs.

For example:

- mouse may tolerate or need less offset because no finger occlusion exists;
- touch may require adaptive visual relief;
- pointer velocity distributions differ;
- screen/device dimensions change perceived angular and spatial response.

Do not hardcode one numerical law as platform identity.

# Current conclusion

P1 is now a clearer hypothesis than the vague phrase `secondary dynamics`: **keep the acquired point under direct ownership and put the first material transformation into bounded rotational response**.

P2 remains a higher-risk challenger using bounded acceleration-linked positional distortion.

P3 remains a competent conventional lag/spring contrast.

P0 remains the direct baseline.

This conceptual sharpening advances the project, but still does not justify building the fixture until parameter-regime, task and confound design are further worked through.
