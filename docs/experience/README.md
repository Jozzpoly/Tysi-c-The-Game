# Experience Foundation — canonical research state

This directory is the current canonical entry point for the Tysiac Experience Foundation research track.

The track is no longer primarily a card-game redesign. Tysiac is being used as a compact laboratory for interaction knowledge that may later donate into Jozz Vehicle, JES, Multi World, LLM Live NPC and other Owner projects.

## Current live status

- production gameplay/rules/core: **unchanged**;
- production `GameTable`: **unchanged**;
- current branch: `run03/experience-foundation-reset`;
- current PR: #17, draft research PR;
- next Owner-facing Card Embodiment prototype: **NOT READY**;
- current activity: consolidate theory/evidence, deepen Card Embodiment, adversarially challenge assumptions, then define competing experimental hypotheses;
- previous Run 02 labs: historical evidence only, not implementation truth.

## Core working thesis

The project currently treats high-quality interaction as a causal relationship among:

`human intention -> contact -> manipulation/instrument -> constraint -> commit -> authority -> consequence -> perceivable feedback -> readable new state`

The important target is not literal physical simulation. It is **meaningful causal coupling**: the user can act, understand what the system did with that action, retain agency, distinguish reversible exploration from authoritative consequence and recover from failure without the interface inventing a false history.

`Interaction Physics` remains a useful working metaphor, not a universal ontology.

## Epistemic levels

### A. Demonstrated project evidence

Currently small by design.

- Owner Mobile Recording 001 shows repeated spontaneous manipulation/reordering of the private hand in the first embodiment lab.
- The first lab crossed the minimal threshold where direct card manipulation invited continued exploration.
- The recording also exposes visible weaknesses: slot-like reordering, shallow material presets, abstract commit destination, insufficient resting-hand structure and under-modelled finger occlusion.
- Existing code architecture separates canonical reducer/events/projections from presentation, providing a structurally useful future authority seam.

These observations do **not** prove a final hand geometry, material law, gesture model or final visual hierarchy.

See `evidence/OWNER_MOBILE_RECORDING_001.md`.

### B. Externally supported design knowledge

Research provides strong support for several lenses, without making them product truth:

- direct manipulation and semantic/articulatory distance;
- instrumental interaction and useful indirection;
- distributed cognition and epistemic action;
- spatial organization as possible cognitive work;
- tangible/embodied interaction;
- inherent feedback/feedforward and action-function coupling;
- ecological interface design for perceivable constraints;
- game-feel separation of physicality, amplification and support;
- reality-based interaction with explicit tradeoffs against literal realism;
- strong concepts as intermediate-level reusable design knowledge;
- touch occlusion and control/display mapping tradeoffs;
- pseudo-haptic effects from altered visual/control mappings;
- sense-of-agency sensitivity to action/outcome coupling and delay;
- attention/periphery work relevant to quiet but inhabited interfaces.

See `FOUNDATIONAL_INTERACTION_RESEARCH.md` and `THEORY_LANDSCAPE_AND_BOUNDARIES.md`.

### C. Current candidate frameworks

These are tools for reasoning, not mandatory scorecards.

- `UNIFIED_INTERACTION_PHYSICS.md` — causal-coupling thesis;
- `INTERACTION_FIDELITY_MODEL.md` — diagnostic truthfulness dimensions;
- `CROSS_PROJECT_INTERACTION_FAILURE_MODEL.md` — recurring interaction failure classes;
- `TEMPORAL_INTEGRITY_AND_AUTHORITY.md` — separates acknowledgement, manipulation, commit, pending authority, consequence, causal hold, action unlock and cosmetic tail;
- `ATTENTION_AND_QUIET_LIFE.md` — periphery/focus/interrupt/settle model;
- `INTERACTION_AESTHETICS_AND_SKILL.md` — action quality, character, rhythm, mastery and expressive headroom;
- `SPATIAL_COGNITION_AND_WORKSPACE.md` — user-created layout as possible external cognition.

All remain falsifiable and revisable.

### D. Anti-dogma / adversarial material

These documents explicitly attack the project's own ideas:

- `INTERACTION_ANTI_DOGMA.md`;
- `INTERACTION_PHYSICS_SELF_CRITIQUE.md`;
- `CARD_EMBODIMENT_ADVERSARIAL_REVIEW.md`.

Important current corrections include:

- truth is not realism;
- direct manipulation is not always superior to instruments;
- more physicality can reduce perceived ownership/control;
- `weight` must not secretly mean input lag;
- 1:1 mapping can be worse on touch because of occlusion;
- constraint-as-behavior can become mysterious or coercive;
- less chrome is not universally better;
- continuity can lie when discontinuity is semantically real;
- custom spatial organization may help cognition but its Tysiac value is not yet proven;
- rich card embodiment may become too slow or distracting in full gameplay;
- the strongest final interaction may be much more restrained than the richest laboratory candidate.

### E. Card Embodiment research

`CARD_EMBODIMENT_PHENOMENA_MAP.md` decomposes the target below vague terms such as `weighty`, `physical` or `juicy`.

Current phenomena include:

- acquisition/hit ownership;
- contact acknowledgement;
- pickup threshold;
- grab point/pivot;
- finger/object co-location and occlusion;
- adaptive visual offset;
- control/display gain;
- translation and acceleration dynamics;
- rotation;
- depth/layer transition;
- neighbor coupling and insertion fields;
- intent inference;
- progressive commitment;
- release/cancel/reject;
- pending authority;
- material dimensions;
- pseudo-haptics;
- feedforward;
- object identity;
- attention;
- platform embodiment;
- accessibility;
- skill development.

The next test should not bundle these back into named presets.

## Three kinds of directness

A major current distinction is:

- **motor directness** — how directly body/input motion maps to represented motion;
- **semantic directness** — how directly the action expresses what the user intends to accomplish;
- **causal directness** — how clearly the user can perceive why the resulting change occurred.

These can conflict. A tool/gizmo can reduce motor directness while increasing semantic and causal directness.

## Interaction fidelity

`INTERACTION_FIDELITY_MODEL.md` currently distinguishes fidelity of:

- contact;
- control;
- intent;
- constraints;
- authority;
- observable state;
- causality;
- temporal ordering;
- identity;
- ownership;
- uncertainty/confidence;
- workspace;
- attention;
- sensory channels;
- recovery;
- privacy.

Use only the relevant dimensions for a problem. Do not turn this into a ritual checklist.

## Donor discipline

`DONOR_CONCEPT_REGISTRY.md` tracks intermediate-level candidate concepts using evidence statuses from `SEED` through `DONOR` or `REJECTED/NARROWED`.

No concept is currently a proven donor.

The intended donor unit is a **strong concept / semantic interaction pattern**, not a visual component, spring constant, gesture or card-game aesthetic.

Examples under investigation include:

- reversible manipulation envelope;
- progressive commitment;
- constraint-as-behavior;
- user-owned cognitive workspace;
- locally immediate / globally honest interaction;
- before-event-after causal choreography;
- failure dignity;
- quiet-life feedback;
- persistent causal traces;
- semantic parity with platform-specific embodiment.

## Owner collaboration contract

Owner testing is treated as expensive high-value perceptual evidence.

The Owner is especially authoritative for:

- feel;
- responsiveness;
- visual/tactile character;
- attention;
- perceived causality;
- liveliness/deadness;
- frustration/pleasure;
- repeated-use fatigue;
- overall product impression.

The Owner is not expected to certify Tysiac rule correctness or strategy.

Raw Owner wording is preserved before technical interpretation.

See `OWNER_COLLABORATION_PROTOCOL.md` and `PRE_TEST_RESEARCH_GATE.md`.

## Current test readiness

**NOT READY** remains correct.

However, several prerequisites listed in the original gate have now materially advanced:

- phenomenon decomposition — advanced;
- finger/card occlusion model — advanced conceptually;
- directness-vs-mass — advanced conceptually;
- grab point/pivot — decomposed;
- hand-neighbor coupling — decomposed;
- cancel/release/reject — separated semantically;
- latency/authority — substantially decomposed;
- cross-project transfer — mapped;
- adversarial review — completed at current conceptual level.

Still missing before an Owner test is justified:

1. prioritize which uncertainties actually require human perception rather than more analysis;
2. define competing hypotheses for a **small number of variables**;
3. define confounds and failure predictions for those hypotheses;
4. decide whether Card Object or Hand-as-field should be tested first;
5. specify enough sensory treatment to avoid false conclusions without bundling aesthetics into the control-law experiment;
6. define mobile body/occlusion measurement strategy without making the test cumbersome;
7. internally rehearse the fixture and remove obvious implementation-shaped artifacts;
8. explicitly state which donor concepts the test could advance, narrow or reject.

Do not build the fixture until these are done.

## Current high-value unknowns

### Card/object control

- How much positional decoupling can reduce finger occlusion before ownership feels weaker?
- Can perceived mass come from acceleration/rotation/neighbor response rather than global lag?
- Which degrees of freedom increase expressive control and which create noise?
- What acquisition/pickup threshold prevents jitter without feeling delayed?

### Hand as collective field

- Is individual-card materiality or collective hand deformation more important to perceived meatiness?
- Does persistent personal ordering materially support actual cognition over a full match?
- How should a new card enter without destroying spatial memory?
- Can an insertion gap feel continuous rather than list-like while remaining precise?

### Intent and agency

- Can reorder and play coexist in one progressive gesture without ambiguous diagonal movement?
- When does assistance/magnetism feel supportive, and when does it reduce agency?
- How should pending authority look so that latency is honest without feeling broken?

### Attention and aesthetics

- How alive can the hand feel at rest without becoming a fidget toy that steals strategic attention?
- How much action character survives repetition?
- Which parts of `meatiness` come from control law versus visual depth, sound or haptic augmentation?

### Cross-project transfer

- Which Tysiac findings remain meaningful when the manipulated object is a vehicle component, world object, terrain tool or AI/debug artifact?
- Which findings are only consequences of a flat touchscreen card domain?

## Next research movement

The next phase is **hypothesis formation, not implementation**.

Choose a very small set of Card Embodiment questions, formulate credible competing models, attack them theoretically, decide what can be rejected without Owner attention, and only then consider an INTERNAL READY fixture.

The research branch is successful even if this phase ends with no production code and no Owner-facing prototype.

## Document map

### Evidence
- `evidence/OWNER_MOBILE_RECORDING_001.md`

### Program / quality / process
- `EXPERIENCE_FOUNDATION_RESET.md`
- `EXPERIENCE_RESEARCH_PROGRAM.md`
- `DONOR_QUALITY_BAR.md`
- `PRE_TEST_RESEARCH_GATE.md`
- `OWNER_COLLABORATION_PROTOCOL.md`
- `DONOR_CONCEPT_REGISTRY.md`

### External theory and synthesis
- `FOUNDATIONAL_INTERACTION_RESEARCH.md`
- `THEORY_LANDSCAPE_AND_BOUNDARIES.md`

### General interaction frameworks
- `UNIFIED_INTERACTION_PHYSICS.md`
- `INTERACTION_FIDELITY_MODEL.md`
- `CROSS_PROJECT_INTERACTION_FAILURE_MODEL.md`
- `INTERACTION_AESTHETICS_AND_SKILL.md`
- `ATTENTION_AND_QUIET_LIFE.md`
- `TEMPORAL_INTEGRITY_AND_AUTHORITY.md`
- `SPATIAL_COGNITION_AND_WORKSPACE.md`

### Adversarial safeguards
- `INTERACTION_ANTI_DOGMA.md`
- `INTERACTION_PHYSICS_SELF_CRITIQUE.md`
- `CARD_EMBODIMENT_ADVERSARIAL_REVIEW.md`

### Current domain research
- `CARD_EMBODIMENT_PHENOMENA_MAP.md`

### Cross-project bridge
- `CROSS_PROJECT_DONOR_BRIDGE.md`
