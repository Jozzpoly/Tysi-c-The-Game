# Experience Foundation — canonical research state

This directory is the canonical entry point for the Tysiac Experience Foundation track.

The track is no longer primarily a card-game redesign. Tysiac is being used as a compact laboratory for **embodied, truthful interaction** that may later donate into Jozz Vehicle, JES, Multi World, LLM Live NPC and other Owner projects.

## Live status

- production gameplay/rules/core: **unchanged**;
- production `GameTable`: **unchanged**;
- branch: `run03/experience-foundation-reset`;
- PR: #17, draft research PR;
- latest confirmed Foundation before this README update: **PASS** on `f845100676a64acbe40bfb9f959a471f98ecebc7` (#255);
- next Owner-facing Card Embodiment prototype: **NOT READY**;
- current phase: low-level control-law research + research-method design + multiscale scope protection;
- previous Run 02 labs: historical evidence only, not product truth.

## Core thesis

The working causal chain is:

`human intention -> contact -> manipulation/instrument -> constraint -> commit -> authority -> consequence -> perceivable feedback -> readable new state`

The target is not literal realism. It is **meaningful causal coupling**: the user can act, understand what the system did with that action, retain agency, distinguish reversible exploration from authoritative consequence and recover from failure without the interface fabricating history.

`Interaction Physics` remains a working metaphor, not a universal ontology.

## Demonstrated project evidence

Direct project evidence remains intentionally small.

Owner Mobile Recording 001 demonstrated that:

- the private hand attracted repeated spontaneous card manipulation/reordering;
- direct manipulation crossed the minimum threshold where the Owner wanted to keep touching the cards;
- the first lab was still far below target quality;
- reordering remained slot-like;
- PAPER/WEIGHT/MAGNETIC were shallow bundles rather than understood mechanisms;
- finger occlusion was under-modelled;
- accepted cards moved into an abstract central target;
- the resting hand did not yet function as a living cognitive workspace.

This supports the direction. It does not prove final mechanics.

See `evidence/OWNER_MOBILE_RECORDING_001.md`.

## Current external knowledge base

Research currently draws from, without treating any school as doctrine:

- direct manipulation and semantic/articulatory distance;
- instrumental interaction and useful indirection;
- distributed cognition / epistemic action;
- spatial organization as external cognition;
- tangible and embodied interaction;
- inherent feedback/feedforward and action-function coupling;
- Ecological Interface Design;
- game-feel research separating physicality, support and amplification;
- Reality-Based Interaction and realism tradeoffs;
- sense-of-agency research;
- shared-control / automation-agency tradeoffs;
- touch occlusion and thumb/body ergonomics;
- control/display gain and visuomotor adaptation;
- pseudo-haptics;
- Fitts/Steering and corrective-submovement research;
- calm/peripheral attention;
- psychophysical paired comparison / staircase / JND-style methods;
- strong concepts as intermediate-level donor knowledge.

See `FOUNDATIONAL_INTERACTION_RESEARCH.md` and `THEORY_LANDSCAPE_AND_BOUNDARIES.md`.

## Current major distinctions

### Three directnesses

- **motor directness** — how body/input maps to represented movement;
- **semantic directness** — how directly the action expresses intended operation;
- **causal directness** — how clearly consequence follows from cause.

More direct motor control is not always more semantically direct.

### Four outcomes previously collapsed into `feel`

`HUMAN_IN_LOOP_CONTROL_AND_MEASUREMENT.md` now separates:

1. motor performance;
2. sense of agency/action ownership;
3. perceived materiality;
4. interaction aesthetics / pleasure / expressive value.

These can disagree.

A system can improve task performance while reducing agency. A user can also adapt to a poor mapping, so late performance does not prove good first-contact design.

### User variability is not automatically noise

Current research explicitly warns against machine-perfect smoothing as a default. Natural variation may carry agency and personal control. Stabilize what harms intent; do not automatically erase individual movement structure.

## Current Card Embodiment target

The first low-level research question is now:

> How much and what kind of transformation can occur between human motion and card response before the interaction stops feeling owned, precise and trustworthy — and which transformations add useful material character rather than mere lag?

This comes before hand-wide physics, reorder/play intent and target magnetism because all of those depend on a defensible user↔object control relationship.

See `FIRST_INTERNAL_RESEARCH_TARGET.md`.

## P0–P3 control-law families

`CARD_CONTROL_LAW_MINIMAL_SPEC.md` now defines actual mechanism families rather than named feel presets:

- **P0 — rigid grab-point baseline:** exact acquired point follows the input;
- **P1 — rigid grab point + inertial rotational body:** primary contact remains exact, mass appears through rotation around the grab point;
- **P2 — bounded acceleration-sensitive positional distortion:** small pseudo-haptic displacement under strong acceleration/reversal, returning toward direct control during precision;
- **P3 — competent damped positional spring:** classic trailing `weight`, retained as a real falsification candidate rather than strawman.

The first comparison intentionally excludes target assistance, game rules, sound, haptics and hand-field physics.

## Observable parameterization

`CONTROL_LAW_OBSERVABLE_PARAMETERIZATION.md` avoids donor knowledge such as `spring = 0.82`.

Research should describe control laws using observable consequences such as:

- grab-point error normalized by object size;
- peak rotation under a canonical movement;
- recovery time after reversal;
- path distortion;
- overshoot;
- precision-phase correction burden;
- settle duration.

Expected result is a **useful operating region**, not a false universal optimum.

## Internal research bench

`INTERNAL_CONTROL_BENCH_DESIGN.md` defines a future internal-only two-lane apparatus.

### Lane I — stripped synthetic/mechanical

Canonical slow/fast/reversal/zig-zag/precision/cancel trajectories reject unstable laws and cadence-dependent artifacts.

### Lane II — minimal ecological bridge

A surviving law is driven manually in a tiny hand context to verify it remains coherent when the card is an owned object among neighbors.

Lane I can reject mechanisms. It cannot certify experience.

`CONTROL_BENCH_ADVERSARIAL_REVIEW.md` explicitly attacks the bench to prevent synthetic metrics from becoming an automatic winner score.

## Browser runtime research

`WEB_INTERACTION_RUNTIME_FOUNDATION.md` treats web input/rendering as part of the apparatus.

Key principle:

`input samples -> control/material model -> rendering`

not:

`pointermove -> component state -> CSS magic`.

Coalesced/raw/predicted Pointer Events are distinguished. Predicted input can never become gameplay authority.

`TRAJECTORY_SIGNAL_AND_FILTERING.md` adds another constraint: do not smooth the primary position merely because derivative signals are noisy. Filter the secondary velocity/acceleration signal separately where possible.

## Mobile embodiment

`MOBILE_BODY_INTERACTION_MODEL.md` rejects `mobile = 390×844` as the interaction model.

Mobile includes:

- hand size;
- one/two-handed grip;
- thumb reach;
- direction/distance;
- finger contact/occlusion;
- device stabilization;
- touch-specific precision and optional haptics.

A full long drag is not automatically more embodied than a shorter semantic commit. Motor, semantic and causal directness may disagree.

## Owner evidence method

`OWNER_PERCEPTUAL_CALIBRATION_PROTOCOL.md` treats Owner attention as a measurement resource without pretending one person is a population study.

Two modes are separated:

- **natural first contact** for spontaneous behavior, discoverability and product character;
- **perceptual calibration** for already-isolated variables.

Potential future tools include:

- anonymous pairwise comparisons;
- order randomization;
- occasional identical/sham comparisons to detect expectation noise;
- lightweight adaptive staircase for one-dimensional boundaries;
- distinction between detection, tolerance, preference and repeated-use thresholds.

Raw Owner language is preserved before interpretation.

## Multiscale scope guard

`MULTISCALE_EXPERIENCE_MODEL.md` prevents low-level Card Object research from consuming the whole Experience Foundation.

Current scale map runs from:

- sensing/contact;
- object embodiment;
- local workspace;
- action sentence;
- scene/encounter;
- repeated-loop rhythm;
- hand/round arc;
- match/session arc;
- social/agent presence;
- system truth/recovery;
- learning/mastery;
- product identity;
- accessibility/alternate embodiment.

Lower scales enable higher ones but do not determine them. Macro rhythm can also force restraint on rich microinteractions.

Once low-level Card/Hand primitives become meaningful, research must deliberately reopen Trick Scene, opponent presence, rhythm, persistent consequence and product identity.

## Interaction fidelity

`INTERACTION_FIDELITY_MODEL.md` remains a diagnostic framework covering relevant combinations of:

- contact;
- control;
- intent;
- constraint;
- authority;
- state;
- causality;
- temporal ordering;
- identity;
- ownership;
- uncertainty;
- workspace;
- attention;
- sensory coherence;
- recovery;
- privacy.

Use only dimensions that clarify the current problem. Never as ritual checklist.

## Donor discipline

`DONOR_CONCEPT_REGISTRY.md` tracks candidate strong concepts. No concept is currently a proven DONOR.

Current examples include:

- reversible manipulation envelope;
- progressive commitment;
- constraint-as-behavior;
- user-owned cognitive workspace;
- locally immediate / globally honest interaction;
- before/event/after causal choreography;
- semantic/motor/causal directness;
- failure dignity;
- quiet-life feedback;
- persistent causal traces;
- semantic parity with platform-specific embodiment.

A principle becomes donor-worthy only after surviving evidence and re-embodiment in a materially different domain.

## Anti-dogma safeguards

Current explicit corrections:

- truth is not realism;
- physicality is a tool, not the goal;
- direct manipulation is not universally superior to instruments;
- stronger automation can improve performance while reducing agency;
- weight must not secretly mean input lag;
- 1:1 touch mapping can be poor when occlusion dominates;
- constraint-as-behavior can become coercive or mysterious;
- less chrome is not always better;
- continuity can lie when discontinuity is semantically real;
- rich embodiment can become too slow/distracting in full gameplay;
- synthetic bench quality is not game feel;
- research frameworks are disposable if they stop predicting useful distinctions.

See `INTERACTION_ANTI_DOGMA.md`, `INTERACTION_PHYSICS_SELF_CRITIQUE.md`, `CARD_EMBODIMENT_ADVERSARIAL_REVIEW.md`, and `CONTROL_BENCH_ADVERSARIAL_REVIEW.md`.

## Current readiness

### Owner-facing test

**NOT READY.**

### Internal implementation

Closer, but not automatically authorized by document count.

The conceptual prerequisites have substantially advanced:

- phenomenon decomposition: advanced;
- competing mechanism families: explicit;
- exact conceptual control laws: explicit;
- observable metrics: explicit;
- two-lane bench design: explicit;
- browser pipeline constraints: explicit;
- mobile-body constraints: explicit;
- adaptation/agency confounds: explicit;
- Owner perceptual calibration strategy: explicit;
- adversarial review: performed at theory and experiment-design levels.

Still required before INTERNAL fixture implementation is considered grounded:

1. choose numerical **exploration bands** rather than final parameters;
2. specify derivative estimator/integration implementation details;
3. define logging schema concretely enough for reproducible probe output;
4. ensure neutral visuals do not create a candidate-specific bias;
5. define how delayed-P0 is used as a diagnostic against fake materiality;
6. decide internal progression criteria from Lane I to Lane II;
7. run one final adversarial review asking whether the apparatus is now adding information or becoming engineering theater.

## Current high-value unknowns

### Low-level control

- Can P1 rotational response create materiality without stealing contact ownership?
- Is there any useful P2 discrepancy band, or is it merely stylized lag?
- Can a well-designed P3 spring survive precision/reversal without excessive correction?
- How much later performance is adaptation rather than genuinely good mapping?

### Touch/body

- How should real finger occlusion alter visual card position without breaking ownership?
- Does one-hand versus two-hand use require meaningfully different movement semantics?
- Is full-card transport physically appropriate on mobile at all?

### Hand/workspace

- Is `meatiness` primarily in the card or relational deformation of the hand?
- Does personal ordering become actual cognitive structure over a match?
- How should new/removed cards alter layout without erasing spatial memory?

### Macro experience

- What should remain after actions so the board carries history/consequence?
- How should opponent presence emerge spatially and temporally?
- How much microinteraction richness survives repeated game rhythm?
- What is the eventual recognizable interaction character of this product?

## Next movement

Continue narrowing the INTERNAL control bench until implementation is justified, but do not let the microtrack consume the whole campaign.

The next meaningful transition is:

`research model -> internally falsifiable instrument -> internal mechanical evidence -> minimal ecological bridge -> only then Owner perception`.

No production UI promotion is currently justified.

## Document map

### Canonical evidence
- `evidence/OWNER_MOBILE_RECORDING_001.md`

### Program / quality / process
- `EXPERIENCE_FOUNDATION_RESET.md`
- `EXPERIENCE_RESEARCH_PROGRAM.md`
- `DONOR_QUALITY_BAR.md`
- `PRE_TEST_RESEARCH_GATE.md`
- `OWNER_COLLABORATION_PROTOCOL.md`
- `OWNER_PERCEPTUAL_CALIBRATION_PROTOCOL.md`
- `DONOR_CONCEPT_REGISTRY.md`

### Theory and synthesis
- `FOUNDATIONAL_INTERACTION_RESEARCH.md`
- `THEORY_LANDSCAPE_AND_BOUNDARIES.md`
- `UNIFIED_INTERACTION_PHYSICS.md`
- `INTERACTION_FIDELITY_MODEL.md`
- `CROSS_PROJECT_INTERACTION_FAILURE_MODEL.md`
- `INTERACTION_AESTHETICS_AND_SKILL.md`
- `ATTENTION_AND_QUIET_LIFE.md`
- `TEMPORAL_INTEGRITY_AND_AUTHORITY.md`
- `SPATIAL_COGNITION_AND_WORKSPACE.md`
- `HUMAN_IN_LOOP_CONTROL_AND_MEASUREMENT.md`
- `MULTISCALE_EXPERIENCE_MODEL.md`

### Current Card Embodiment track
- `CARD_EMBODIMENT_PHENOMENA_MAP.md`
- `CARD_EMBODIMENT_HYPOTHESIS_MATRIX.md`
- `FIRST_INTERNAL_RESEARCH_TARGET.md`
- `CARD_CONTROL_LAW_CONCEPTS.md`
- `CARD_CONTROL_LAW_MINIMAL_SPEC.md`
- `CONTROL_LAW_OBSERVABLE_PARAMETERIZATION.md`
- `INTERNAL_CONTROL_BENCH_DESIGN.md`
- `WEB_INTERACTION_RUNTIME_FOUNDATION.md`
- `TRAJECTORY_SIGNAL_AND_FILTERING.md`
- `MOBILE_BODY_INTERACTION_MODEL.md`

### Adversarial safeguards
- `INTERACTION_ANTI_DOGMA.md`
- `INTERACTION_PHYSICS_SELF_CRITIQUE.md`
- `CARD_EMBODIMENT_ADVERSARIAL_REVIEW.md`
- `CONTROL_BENCH_ADVERSARIAL_REVIEW.md`

### Cross-project bridge
- `CROSS_PROJECT_DONOR_BRIDGE.md`
