# Interaction Physics — Self-Critique

Status: adversarial critique of the project's current thesis.

The phrase `Unified Interaction Physics` is useful only if it sharpens design. It becomes dangerous if it encourages literalism, physicality fetishism or false universality.

This document exists to attack the framework before implementation hardens around it.

## 1. Physics is a metaphor, not the ontology of all interaction

Human-computer interaction also contains:

- symbols;
- conventions;
- language;
- strategy;
- history;
- social meaning;
- abstraction;
- tools that intentionally mediate rather than disappear.

A score, contract, timeline, search query or debug filter does not become better merely by being converted into a physical object.

**Correction:** use `interaction physics` for the continuity/coupling of action and consequence, not as a command to make everything simulate matter.

## 2. Truth is not literal implementation exposure

The interface should not expose internal networking, reducers, database commits or server hops merely because they are technically true.

The useful target is **actionable/perceptual truth**:

- do not show a consequence that has not occurred;
- do not hide a constraint that materially affects action;
- do not imply certainty when the system is uncertain;
- preserve the causal relation users need to understand and control the domain.

Internal implementation detail may be compressed or omitted if doing so does not distort actionable semantics.

## 3. Direct manipulation is not universally superior

Directness can fail because of:

- finger occlusion;
- precision limits;
- fatigue;
- inaccessible gesture requirements;
- high-dimensional properties;
- batch operations;
- abstract/global actions;
- limited screen real estate;
- need for history, comparison or exact numeric control.

Instrumental interaction shows that a degree of indirection can be beneficial.

**Correction:** seek the appropriate coupling, not minimum indirection at all costs.

## 4. Physical plausibility can conflict with control ownership

A physically simulated object can feel less embodied if inertia, collision or spring behavior causes it to escape the user's intended motion.

Literal physicality can therefore reduce perceived physicality.

Example hypothesis:

- primary translation under a finger may need very high directness;
- mass may be better expressed in secondary channels such as rotation, neighbor response, release dynamics, sound and settle.

This is only a hypothesis. It must be tested rather than canonized.

## 5. Self-teaching constraints can become coercive

`Constraint as behavior` sounds elegant, but can hide rules or create a patronizing system if overused.

Problems:

- resistance may be interpreted as lag or broken input;
- magnetism can feel like aim assist that steals agency;
- preventing exploration can block epistemic action;
- the same constraint may need different expression for novice and expert use;
- in permissive creative tools, hard resistance may be directly contrary to product intent.

**Correction:** distinguish at least:

- discoverable possibility;
- soft guidance;
- reversible resistance;
- canonical hard prohibition;
- explanatory fallback;
- optional expert bypass where the domain permits it.

In Tysiac, illegal gameplay commands are canonical prohibitions. In JV, absurd constructions may be intentionally allowed. The donor is the language of constraint, not one enforcement policy.

## 6. Object-first can become hostile to global information

A strict dislike of HUD/chrome can make abstract information harder to understand.

Some facts are genuinely:

- global;
- historical;
- comparative;
- non-spatial;
- aggregate;
- future/planning-oriented.

These may deserve a stable symbolic representation.

**Correction:** use semantic locality:

- local causal facts should live near causes/objects when possible;
- global abstractions should have coherent global instruments;
- transitions should connect local causes to global consequences when both matter.

Do not force all information onto the object surface.

## 7. Continuity is not always desirable

Perceptual continuity is valuable when identity persists. But real events can involve:

- destruction;
- replacement;
- phase transitions;
- categorical reclassification;
- teleportation as an actual game/world mechanic;
- abrupt system failure.

In those cases, smooth continuity can lie.

**Correction:** preserve continuity of *meaning*, not animation continuity at any cost.

## 8. Reversibility has domain limits

Direct-manipulation traditions value reversible exploration. But some actions are intentionally consequential.

If every high-stakes action feels trivially reversible, the interaction can undermine stakes and semantics.

**Correction:** maximize reversible exploration before the commit boundary; make the boundary legible; respect genuine irreversibility after it.

## 9. User-owned organization can conflict with system assistance

Preserving personal layout is powerful, but absolute preservation can become friction when:

- the user explicitly requests sorting;
- new information changes priority;
- space becomes insufficient;
- accessibility requires alternative grouping;
- synchronization across devices requires reconciliation.

**Correction:** organization should be user-owned by default, with explicit and predictable system transformations rather than invisible automatic destruction.

## 10. More sensory channels do not imply more embodiment

Audio, haptics, motion, particles and depth can create contradiction or saturation.

A coherent interaction may be stronger with fewer channels if those channels agree in timing, location, direction, dynamics and expression.

**Correction:** optimize coupling coherence, not feedback count.

## 11. "Quiet life" can turn into decorative idle animation

A living interface is not one where everything subtly wiggles.

Background life should communicate:

- persistent state;
- readiness;
- latent tension;
- environmental process;
- other-agent presence;
- relevant change.

Decorative motion that communicates nothing taxes attention and destroys the contrast needed for real events.

## 12. Donor extraction can become cargo cult

A principle that works for cards can fail in 3D builders, physics worlds or NPC systems.

Transfer must happen at the semantic level and be revalidated in the target domain.

Before calling a finding universal, ask:

- which domain constraints made it work?
- which body/input assumptions made it work?
- which information was local vs global?
- which timing assumptions existed?
- which authority model existed?
- which failure modes were absent?

## 13. The Owner is not an objective sensor

Owner evidence is extremely valuable for taste, feel, salience and friction, but can be affected by:

- novelty;
- expectation;
- fatigue;
- prototype framing;
- knowing what the experiment is testing;
- device recording overhead;
- comparison order.

**Correction:** preserve raw reactions, but design experiments that attempt to separate preference from mechanism.

## 14. The framework can become bureaucracy

The greatest process risk is turning interaction research into scorecards and terminology maintenance.

A framework is useful only when it does one of the following:

- separates competing explanations;
- predicts a failure;
- identifies an experiment;
- explains Owner evidence;
- transfers a result safely;
- prevents a known class of regression.

If it does none of these, delete or simplify it.

## 15. Revised thesis

A better statement than "UX is physics" is:

> **High-quality interaction preserves meaningful causal coupling between human intention, system constraints, authoritative state and perceivable consequence, using the right mixture of direct manipulation, instruments, representation and sensory feedback for the domain and platform.**

Physicality is one powerful means of achieving this, not the final goal.

## 16. Consequence for Stage 1

Card Embodiment research must not ask:

> How do we make the card maximally physical?

It should ask:

> Which mappings make the card feel most owned, coherent, expressive and trustworthy while preserving precise control, low fatigue, exploration and semantic clarity?

This is a wider and harder target.
