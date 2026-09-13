# Temporal Integrity and Authority

## Thesis

Time is part of interaction truth.

A correct state transition presented at the wrong time can become misleading, sluggish, visually dishonest or cognitively expensive.

This document separates temporal phases that previous prototypes tended to collapse into one animation delay.

## 1. Contact acknowledgement

Question:

> did the system receive my touch/click/grab?

This should usually be extremely fast and local.

It does not require authority.

Possible responses:

- depth/lift;
- pointer capture;
- neighbor response;
- subtle sensory cue.

Failure:

Waiting for network authority before acknowledging physical contact.

## 2. Reversible control response

During exploration/manipulation, the object should respond continuously enough for a stable control loop.

This may include designed dynamics, but should not feel like discrete request/response transactions.

Failure:

A card moves in coarse state updates rather than remaining under continuous control.

## 3. Intent formation

The system may accumulate evidence about likely intention over time.

Examples:

- reorder;
- inspect;
- play;
- cancel.

Important:

Predicted intent is not committed intent.

Visual feedforward may strengthen as confidence rises without claiming completion.

## 4. Commit boundary

The moment the user crosses from reversible exploration into an authoritative command should be perceptually meaningful.

It may be triggered by:

- release into a target;
- threshold crossing;
- tap after selection;
- explicit confirm for high-consequence cases.

The boundary should not be hidden inside arbitrary timing.

## 5. Pending authority

After commit, the system may have no immediate authoritative answer.

This is a real state and should not be treated as either:

- success;
- frozen UI.

Potential presentation properties:

- card remains connected to intended destination;
- control ownership changes clearly;
- downstream consequences remain withheld;
- short latency may require almost no explicit indicator;
- longer latency progressively exposes pending state.

This suggests **progressive latency disclosure** rather than immediate spinner spam.

## 6. Authoritative acceptance

Acceptance can unlock canonical downstream consequences.

The acceptance cue should be coupled to the committed action, not emitted as a detached generic success notification.

## 7. Authoritative rejection

Rejection is not reverse success.

Presentation should not first fully stage success and then rewind unless the product is deliberately representing an authority correction.

A truthful rejection sequence can be:

`commit -> pending relation -> refusal signal -> coherent return/settle -> local explanation if needed`

## 8. Authoritative state versus presented state

The current remote runtime already has a good truth seam: server updates arrive as viewer-safe `SeatProjection + GameEvent[]`.

However, the current playback applies the new projection immediately and then waits a fixed presentation delay. That preserves server truth but can still create **perceptual teleportation**:

- a played card may already be gone from the hand before its visual travel can be understood;
- a completed trick may already be represented as post-resolution state before collection has been perceived;
- score/initiative may already have changed while presentation is merely holding input.

The mature experience layer therefore needs three concepts, not two competing authorities.

### Authoritative projection

The latest canonical viewer-safe truth received from core/server.

This is never rewritten by animation.

### Presented stable projection

The stable situation the player has currently perceptually reached.

Usually this converges quickly to authoritative projection, but it may temporarily remain at `before` while a required causal transition is shown.

### Ephemeral transition layer

Transient presentation objects/relationships that carry identity and causality between stable situations.

Examples:

- a card clone/representation travelling from hand source to trick destination;
- trick cards collecting toward winner ownership;
- score/value consequence travelling from trick result toward a persistent score/captured region.

The transition layer is **not game state** and must never become gameplay authority.

## 9. Before + events + after as experience input

A useful presentation seam is conceptually:

`presented before + visible GameEvent[] + authoritative after -> Experience Transition`

The transition system may decide:

- which truth events compose into one perceptual scene;
- which stable elements remain at `before` temporarily;
- which transient overlays carry object identity;
- when the stable presentation can commit to `after`;
- which cosmetic tail may continue after action unlock.

It must not decide:

- which card is legal;
- who won the trick;
- how many points exist;
- whether authority accepted the action;
- hidden/private state.

Those remain canonical inputs.

## 10. Semantic anchors, not pixel choreography

Transition planning should refer to semantic locations such as:

- local hand / specific visible card;
- trick seat source;
- shared trick area;
- captured-value region for a seat;
- score region;
- initiative/active actor locus;

Components/layouts can provide geometry for those anchors on mobile and desktop.

This allows shared causal meaning without requiring identical pixel paths across platforms.

## 11. Stable commit point

The presentation should switch its stable base from `before` to `after` at the earliest point where:

- canonical truth is already known;
- object identity/cause will not be lost;
- the user can understand the resulting stable situation;
- subsequent action will not collide semantically with transitional presentation.

Do not mechanically wait for every animation to finish.

## 12. Causal hold

Some event information must remain perceivable long enough for cause/consequence to be understood.

Define:

**minimum causal hold** — the minimum presentation interval before the relevant meaning is apprehensible.

This is different from total animation length.

## 13. Cosmetic tail

Visual/audio settle may continue after meaning is already clear.

Define:

**cosmetic tail** — non-essential continuation that should often overlap with restored control.

Example:

A trick can begin settling into captured territory while the next player's legal action becomes available once leadership is unambiguous.

Do not hold input hostage to every finishing easing curve.

## 14. Action unlock

The next action should become available when:

- authority allows it;
- current causal relation is sufficiently clear;
- accepting input would not create ambiguity/collision with transitional presentation.

This should not be tied mechanically to `animationend`.

## 15. Current runtime debt: global playback lock

Current `RemoteRoom` uses fixed playback delays and removes legal commands while playback is active.

That was a strong foundation safety mechanism, but it is deliberately too blunt for the target experience.

Future work should distinguish:

### Authority lock

The canonical state genuinely does not allow the local player to act yet.

### Presentation hold

The next action is temporarily withheld because the causal transition would become unreadable if another action began immediately.

### Cosmetic continuation

Presentation can keep settling while the next action is already available.

Do not replace three current constants with dozens of arbitrary duration constants. First model semantic beats; tune timings later from evidence.

## 16. Temporal compression

Repeated familiar sequences may be compressible.

Potential approaches:

- shorter hold after skill/familiarity;
- batch low-significance transitions;
- accelerate cosmetic tails;
- preserve key causal landmarks while removing dead time.

Do not dynamically speed critical rules so much that novices lose comprehension.

## 17. Temporal expansion

Rare high-significance events may earn more time.

Examples:

- decisive contract result;
- bomb;
- match win.

Expansion should communicate semantic importance, not exist because animation is expensive/fancy.

## 18. Interruption

The user may:

- look away;
- switch tab;
- background the phone;
- lose connection;
- return after several events.

The system must decide whether to:

- complete current presentation;
- skip cosmetic tail;
- discard stale sequence;
- settle directly to current authority;
- provide a compact recent trace.

Current project principle:

**current authority beats historical spectacle.**

## 19. Reconnect

Reconnect should normally:

1. cancel obsolete transient choreography;
2. load authoritative viewer-safe projection;
3. reconcile compatible user-owned presentation state;
4. establish current action ownership;
5. optionally provide a short settle/correction cue;
6. resume action quickly.

Do not replay a backlog of card flights just because events existed.

## 20. Workspace reconciliation during authoritative updates

Canonical projection owns card membership.

Viewer-local presentation may own personal order/grouping/topology.

Therefore an authoritative update should conceptually reconcile:

`previous local topology + new canonical membership -> new local topology`

rather than replacing local topology with canonical sort on every revision.

Membership removal/addition must follow authority.

Surviving viewer-owned organization should remain stable where possible.

This state is presentation-local and must not leak private organization to other viewers unless an explicit product feature later requires sharing it.

## 21. Latency budget is semantic

Different stages tolerate different delay.

- contact acknowledgement: extremely low tolerance;
- continuous manipulation: low tolerance;
- authoritative confirmation: network-limited but can be represented honestly;
- rare resolution: can tolerate longer expressive treatment;
- cosmetic tail: should rarely block future control.

Therefore one global `feedback duration` is structurally wrong.

## 22. Latency and perceived material

Be careful not to confuse network delay with object weight.

Material dynamics should be locally deterministic and stable.

Authority latency is uncertainty about shared state.

If the same visual sluggishness represents both, the user cannot tell whether the card is heavy or the network is slow.

## 23. Cross-project implications

### Multi World

Locally controlled physical object motion and server ownership/correction need distinct timing layers.

### Jozz Vehicle

Builder manipulation should be continuous locally while expensive rebuild/simulation operations can trail, expose pending status or commit at boundaries.

### LLM Live NPC

LLM cognition has substantial variable latency. NPC/world behavior must distinguish ongoing local brain/routine control from pending LLM deliberation without freezing the embodied agent.

### JES

World edits may have local preview followed by authoritative expensive generation/validation, requiring honest preview/commit separation.

## 24. Failure criteria

- first feedback waits for server;
- pending looks identical to accepted;
- rejection appears as magical rewind;
- stable after-state replaces before-state before identity/cause can be followed;
- transition overlay becomes a second game-state authority;
- next input stays locked because decorative tail is unfinished;
- important causal events are compressed below comprehensibility;
- familiar routine events remain slow forever;
- reconnect replays obsolete history;
- temporal spectacle changes gameplay truth;
- network latency is visually conflated with material inertia;
- canonical projection refresh destroys unrelated viewer-local workspace organization.

## 25. Future evidence

When prototypes eventually exist, record timestamps separately for:

- pointer/touch down;
- first visible response;
- object acquisition;
- commit threshold;
- request sent;
- authority response;
- stable presentation commit to after-state;
- minimum causal meaning reached;
- next action available;
- cosmetic tail end.

The goal is not optimizing every number downward.

The goal is understanding which time belongs to **control**, which to **truth**, which to **comprehension**, and which is merely **presentation**.
