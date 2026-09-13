# Unified Interaction Physics

## Thesis

For this project, UX/UI is not a decorative layer over gameplay. It is part of the same causal system that makes gameplay believable.

A simulation is trustworthy when forces, contacts, constraints and state transitions produce consistent consequences. An interface should meet the same standard for human intention, manipulation, constraints, authority and feedback.

The working model is therefore not `game -> UI`, but a continuous causal chain:

`human intention -> contact -> manipulation -> constraint -> commit -> authority -> consequence -> sensory feedback -> new readable state`

A break anywhere in that chain is an interaction-physics failure.

## Why this matters beyond Tysiac

Tysiac is the laboratory because cards give us unusually clean interactive objects: they can be touched, moved, ordered, constrained, committed and transferred. The donor value is broader.

The same questions recur in other projects:

- a vehicle builder component being grabbed and repositioned;
- a Multi World object being selected, moved, used or transferred;
- a world-editing brush contacting terrain;
- a physics/debug control changing a live system;
- any direct manipulation where the user must distinguish reversible exploration from authoritative consequence.

The transferable target is a language of **embodied, truthful interaction**.

## Four truth layers

### 1. Physical truth

The presented object must obey its own interaction laws consistently.

If an object has apparent mass, pivot, spring or resistance, those properties cannot disappear opportunistically. If neighboring objects react to displacement, their reaction must follow a coherent spatial model rather than arbitrary layout snapping.

This does not require literal real-world physics. It requires internally legible physics.

### 2. Intent truth

Presentation must not claim the user has decided something before the user has actually crossed a commit boundary.

Exploration, touching, lifting, inspecting, reordering, aiming and cancelling are distinct from committing an action.

The system may infer provisional intent, but provisional intent must remain reversible and visually distinguishable from authoritative outcome.

### 3. Authority truth

Local response may be immediate. Authoritative consequence may not be fabricated.

A card can lift under the finger before a server round trip. It may not become an accepted played card, win a trick, mutate score or transfer ownership until authority confirms those facts.

The desired property is:

**locally immediate, globally honest.**

### 4. Causal truth

After an outcome, the user should be able to perceive where it came from.

Consequences should preserve spatial, temporal or semantic continuity with their causes whenever possible. A score delta born from a trick should read as the consequence of that trick, not as an unrelated number mutation in a distant HUD.

## Interaction conservation laws

The research program should treat the following as provisional conservation laws to test, falsify and refine.

### Continuity of object identity

An object should not appear to die and respawn merely because a state update occurred. When presentation transitions from before to after, identity should remain perceptually continuous unless destruction/replacement is the actual event.

### Continuity of ownership

When an object changes owner or domain, the transfer should be visible or otherwise causally legible. Ownership should not silently teleport between regions of the interface.

### Continuity of control

While the user is manipulating something reversibly, the system should avoid unexpectedly stealing control, resorting the workspace, snapping to a hidden mode or reinterpreting the gesture without sufficient evidence.

### Conservation of user organization

If users spatially organize objects to think, a canonical data ordering must not casually erase that organization.

Presentation order may therefore be user-owned state even when gameplay order is canonical elsewhere.

### Conservation of attention

The interface should not demand attention in more places than the causal structure requires. Important change should route attention from cause to consequence rather than spawning independent alerts.

## Feedback as physics

Feedback is not an after-effect. It is the perceivable half of the causal system.

Good feedback should answer, mostly without prose:

- what did I touch?
- did the system feel my contact?
- am I still exploring or have I committed?
- what constraint am I encountering?
- did authority accept the action?
- what changed because of it?
- what remains true now?
- what can I do next?

The sensory channels are cooperative, not additive decorations:

- geometry and motion communicate object continuity and direction;
- timing communicates weight, confidence, uncertainty and consequence;
- sound communicates material, contact, completion and scale;
- haptics may reinforce contact or commit where the platform supports them;
- typography and numbers explain semantic facts that cannot be inferred safely;
- text is a fallback/explanation layer, not the primary carrier for ordinary repeated interaction.

## Self-teaching constraints

Rules that affect routine manipulation should, where possible, be discoverable through the behavior of objects and spaces.

This does not mean hiding rules. It means ordering communication:

`affordance -> attempted manipulation -> behavioral constraint -> local explanation -> deeper help on demand`

The user should be allowed to probe the world safely.

A non-legal card can remain inspectable and movable inside the hand while resisting or failing to acquire the play target. If the user persists, a concise local explanation can appear. The world teaches before the manual lectures.

## UI chrome is suspect by default

A dedicated panel, banner, toast, arrow or modal should not be the first solution to a causality problem.

Before adding chrome, ask whether the objects, spaces, timing or persistent state can communicate the same fact more directly.

Chrome is justified when information is genuinely abstract, global, historical, exceptional or impossible to embody reliably.

## Failure classes

The old project interfaces frequently collapse several failures into a vague impression of "prototype UI". For research, classify them precisely.

- **contact failure** — touch/click does not feel directly coupled to the object;
- **identity failure** — the object appears to teleport, respawn or lose continuity;
- **intent failure** — reversible exploration is confused with commit;
- **constraint failure** — legality/rules are only reported after failure instead of being felt or anticipated;
- **authority lie** — presentation claims an outcome before canonical confirmation;
- **causal fracture** — consequence appears disconnected from cause;
- **ownership fracture** — transfer between player/world/opponent is not perceptually legible;
- **workspace violation** — the system destroys user-created organization;
- **attention scatter** — multiple independent surfaces compete for attention;
- **temporal friction** — feedback blocks control longer than causality requires;
- **sensory saturation** — everything is emphasized, so nothing has hierarchy;
- **dead-state failure** — between actions, the interface feels inert rather than quietly alive;
- **instruction substitution** — banners/arrows/text compensate for weak interactive language;
- **platform flattening** — mobile and desktop are treated as the same interaction body at different sizes.

## Research discipline

This document is not a style guide and does not authorize implementation.

Before promotion into runtime:

1. decompose the phenomenon;
2. state competing hypotheses;
3. build the smallest experiment that isolates them;
4. gather Owner behavioral/perceptual evidence;
5. torture repeated use, cancellation, mistakes, latency and interruption;
6. attempt to falsify the preferred interpretation;
7. synthesize transferable principles;
8. only then design an integrated candidate.

The central standard is not whether an interaction looks polished once.

It is whether the system remains **direct, embodied, truthful, legible and satisfying under repetition and failure**.
