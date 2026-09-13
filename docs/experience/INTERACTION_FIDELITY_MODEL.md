# Interaction Fidelity Model

## Thesis

A truthful interactive system needs more than correct internal state.

The human-facing representation and control loop must preserve relevant properties of that state and of the causal transition that produced it.

This document decomposes "the interface must not lie" into falsifiable fidelity dimensions.

## 1. Contact fidelity

Does the perceived contact surface match the actual activation surface?

Failure examples:

- visible card edge cannot be selected although it appears exposed;
- invisible oversized region steals a neighboring card;
- mobile finger lands on one visual object but hit-testing chooses another without clear correction.

Desired property:

**what looks touchable behaves touchably, with any helpful correction remaining perceptually plausible.**

## 2. Control fidelity

Does the object's response preserve a stable relationship to the user's action?

This does not require strict 1:1 motion.

It requires that assistance, inertia, snapping, magnetism or precision scaling remain learnable and predictable.

Failure examples:

- varying unexplained drag gain;
- snapping that changes targets unpredictably;
- auto-correction that fights intentional unusual motion.

## 3. Intent fidelity

Does the presentation represent what the user has actually decided, rather than what the system guesses too early?

Important distinctions:

- touching;
- exploring;
- reorganizing;
- aiming;
- committing;
- cancelling.

Failure:

A provisional gesture is visually represented as an irreversible decision.

## 4. Constraint fidelity

Does the interface expose the real constraints of the system rather than decorative or approximate substitutes?

Examples:

- legal cards acquire the play target while illegal cards remain manipulable but cannot cross the same commit relation;
- a builder gizmo shows an actual locked degree of freedom;
- a physics editor exposes a collision constraint where the simulation actually enforces it.

Failure:

A visual rule says "not allowed" while the underlying system permits it, or vice versa.

## 5. Authority fidelity

Does presentation distinguish local intent from authoritative shared fact?

Candidate authority phases:

1. local acknowledgement;
2. reversible local manipulation;
3. committed request/pending;
4. authoritative accept/reject;
5. downstream consequence.

Failure:

Showing canonical success before the authority that owns that fact has confirmed it.

## 6. State fidelity

Does the visible stable state correspond to the state the user is entitled to observe?

This includes privacy.

Failure examples:

- stale score after authoritative update;
- hidden card identity leaking through animation;
- reconnect UI displaying an obsolete turn;
- diagnostic overlay showing data the player should not know.

## 7. Causal fidelity

Can the user connect consequence to cause?

Causal fidelity may be carried through:

- spatial path;
- timing;
- object identity;
- source-local delta;
- state trace;
- sound/haptic synchronization;
- explicit explanation where necessary.

Failure:

A score changes far away with no perceptual relation to the trick that caused it.

## 8. Temporal fidelity

Does the ordering of presentation preserve the ordering that matters to understanding?

Failure examples:

- consequence appears before the cause;
- multiple changes animate simultaneously even though one causally depends on another;
- cosmetic tail blocks a new action after causal meaning is already clear;
- batching makes two distinct events appear to be one event.

Temporal fidelity does not require literal real-time playback. Staging may improve comprehension if it preserves causal structure.

## 9. Identity fidelity

Does the user perceive a persistent object as the same object across state transitions?

Failure:

A card disappears from hand and independently respawns in the trick, making the relation implementation-shaped rather than event-shaped.

Presentation overlays may be required to bridge canonical before/after render states.

## 10. Ownership fidelity

When an object/resource changes domain or owner, is that transfer legible?

Examples:

- card leaves the player's workspace and becomes part of the shared trick;
- completed trick becomes captured/score consequence;
- builder component becomes attached to a structure;
- world object becomes held by a player/entity.

Failure:

Ownership is represented only by a distant label changing.

## 11. Uncertainty fidelity

Does the UI represent uncertainty, pending state or incomplete knowledge honestly?

Failure examples:

- pending network action styled identically to confirmed action;
- inferred NPC intention displayed as fact;
- physics prediction displayed as measured state;
- probable target shown as locked target.

This is critical for AI-heavy and networked projects.

## 12. Confidence fidelity

Related but distinct: if the system has varying confidence, does presentation overstate precision?

Potential future relevance:

- NPC perception;
- inferred user intent;
- automatic snapping;
- diagnostics;
- predictive tools.

Do not add confidence displays where confidence is irrelevant. The principle is to avoid false certainty, not to visualize probabilities everywhere.

## 13. Workspace fidelity

Does the system preserve user-created external structure when that structure is part of the user's cognitive work?

Failure:

Canonical state refresh replaces a personally ordered hand with system sort order.

This fidelity is presentation-specific; it may deliberately diverge from canonical data ordering while preserving gameplay truth.

## 14. Attention fidelity

Does attention demand correspond to semantic importance and causality?

Failure examples:

- decorative motion captures attention while an opponent commits an important action;
- every event gets the same intensity;
- a modal steals focus for a fact already visible in the world.

The interface can be "correct" and still misrepresent what matters by allocating attention dishonestly.

## 15. Sensory fidelity

Do visual, audio and haptic channels describe the same event properties?

Failure examples:

- soft visual settle paired with explosive sound;
- haptic confirmation on local request instead of authoritative commit;
- repeated generic click sound for contact, reject, accept and score.

Sensory coherence matters more than sensory quantity.

## 16. Recovery fidelity

After rejection, interruption, reconnect, tab restore or authority correction, does the system recover to truth without fabricating a false history?

Desired pattern:

- cancel obsolete cosmetic sequence;
- establish current authoritative state;
- preserve user-owned presentation state only where still compatible;
- provide a short local correction/settle cue if needed;
- restore actionable state quickly.

Do not replay stale spectacle merely to explain how the server reached the present.

## 17. Privacy fidelity

A viewer should perceive only information allowed by the viewer-safe model.

Leaks can happen through:

- text;
- shape;
- animation duration;
- source path;
- audio cue;
- target response;
- ordering;
- timing.

Privacy review must include motion and sensory behavior, not only serialized data.

## Fidelity conflicts

Fidelities can conflict.

Examples:

### Contact vs occlusion

Strict co-location may improve contact fidelity but reduce perceptual control because the finger hides the target.

### Identity vs speed

A fully legible transfer animation may preserve identity but harm temporal flow if repeated constantly.

### Authority vs immediacy

Waiting for the network before any response preserves authority but destroys control feel. Showing the final outcome instantly preserves feel but may lie.

Correct solution:

separate the layers rather than maximizing one.

### Workspace vs cross-device layout

Exact preservation of a mobile hand layout may be nonsensical on desktop. Preserve semantic/personal organization, not necessarily raw pixel positions.

## Evaluation use

For any interaction, ask only the fidelity dimensions that matter.

Do not create a mandatory 17-axis scorecard.

The model is diagnostic.

A useful test report might say:

> Contact fidelity is high, control fidelity becomes unstable at fast direction changes, authority fidelity is correct, identity fidelity breaks on accepted play, and attention fidelity is poor because the score pulse competes with the card transfer.

That is more actionable than:

> UX feels prototype-y.

## Cross-project value

This model is potentially more transferable than any card-specific primitive.

It can describe:

- card play;
- vehicle component editing;
- physics manipulation;
- terrain tools;
- multiplayer object ownership;
- NPC perception/debugging;
- AI-generated/inferred state;
- asynchronous workflows.

It remains a candidate donor framework until used successfully outside Tysiac.
