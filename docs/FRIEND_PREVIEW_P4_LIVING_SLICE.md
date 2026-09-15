# Run 04 — P4 First Living Slice

Status: ACTIVE / bounded implementation contract after project-history and evidence audit.

## Why P4 now

P3 has reached a mechanically defended minimum on the Run 04 composition: cards remain physically alive outside legality, free throw/reorder do not mutate authority, continuous insertion/reversal work in a real mobile browser, and legal throws retain a positive commit boundary.

Do not continue low-level drag tuning by inertia. Run 03 already established that card handling is only one organ of the experience. Fresh Run 04 screenshots still show the larger failure more clearly: the shared field is mostly empty, opponents remain weak action sources, completed tricks become static cards plus a text capsule, and consequence/initiative arrive as state changes rather than one causal scene.

The next highest-leverage target is therefore the ordinary trick lifecycle.

## Selected slice

Build one common, repeatable sequence around a trick closed by the third card:

`source -> card arrival -> three-card trick -> resolution -> winner/ownership -> collection -> point consequence -> next initiative -> settled scene`

The same semantics must hold when the third card comes from the local player or an opponent.

This slice is deliberately narrower than a complete visual overhaul. If it works, later phases can reuse its causal grammar for ordinary plays, marriages, exchange, scoring and rarer states.

## Existing truth to use

Do not add game rules or duplicate authority.

The current core already emits the authoritative evidence needed by this slice:

- `card-played { seat, card }`;
- `trick-completed { trick: { plays, winner, points, index } }`;
- the post-command projection already contains `lastCompletedTrick`, `capturedCardPoints`, `capturedCards`, `capturedTricks`, `trickLeader` and scores.

`RemoteRoom` already queues `{ projection, events }` frames and keeps server authority ahead of client presentation. Extend that presentation boundary instead of inventing a second game-state machine.

## Non-negotiable architecture boundary

Authority remains immediate and canonical.

Presentation may delay, stage or spatially interpret already-authoritative truth, but it must not:

- predict acceptance;
- decide a trick winner;
- calculate card points independently of the core;
- mutate canonical order/state;
- synthesize a successful play before `card-played` arrives;
- sleep the server;
- create a second reducer or event-sourced game model.

Reconnect/snapshot without fresh events must settle directly into a truthful stable scene rather than replaying historical spectacle.

## Perceptual contract

### 1. Source

A played card must read as originating from its owner.

- local play: private hand is the source;
- opponent play: that opponent's seat/card territory is the source.

Opponent seats therefore become causal anchors, not score labels floating above the table.

### 2. Arrival

A card arriving on the shared field remains the same perceived object.

For a local accepted throw, the hand interaction must hand off into authoritative arrival rather than fade a ghost to nowhere while a different copy materializes on the table.

For an opponent card, arrival should travel from the opponent's source direction after the authoritative event arrives.

### 3. Resolution

When the third card arrives, all three cards remain readable long enough to understand the completed trick. Resolution should emphasize the authoritative winner without immediately deleting the scene.

### 4. Collection / ownership

The completed trick must visibly become the winner's property. Cards should collect toward the winner/source direction rather than vanish in place.

This is presentation continuity over authoritative `trick-completed`; it does not change captured-card truth.

### 5. Consequence

`trick.points` should emerge from the captured trick and attach to the winner. A persistent low-noise indication of current-hand captured value/tricks should survive after the transient collection feedback so the consequence does not disappear as a toast.

### 6. Next initiative

The authoritative `trickLeader` / winner should become the next source of attention through settled spatial hierarchy. Avoid a large generic "your turn" banner where the scene itself can communicate initiative.

### 7. Settle

After collection, the shared field becomes available for the next trick without retaining stale completed cards. A reconnect snapshot should enter this settled truth directly.

## Platform embodiment

Desktop and mobile share semantics, not identical geometry.

Desktop can use longer source-to-center vectors and more spatial separation.

Mobile must protect card readability, finger visibility and the lower private-hand territory. Collection vectors and point feedback may be shorter/clearer rather than miniaturized desktop motion.

No interaction-critical meaning may depend on hover.

## Implementation slices

### P4-A — authoritative presentation plumbing

- thread the currently presented `GameEvent[]` alongside `SeatProjection` into `GameTable`;
- give local QA the same event-aware presentation path as remote play;
- centralize presentation duration/classification instead of scattered magic delays;
- distinguish fresh event frames from reconnect/static snapshots;
- add pure tests for event-to-presentation planning.

Exit: presentation can identify a fresh ordinary play vs fresh trick completion without changing core truth.

### P4-B — source-aware card arrival

- ordinary `card-played` enters from the owning seat direction;
- preserve existing cards already in the current trick;
- local accepted hand play hands off to authoritative arrival instead of a disconnected disappearance/reappearance;
- cancelled/illegal/free gestures remain local and never enter the authoritative scene.

Exit: three sequential plays read as three objects arriving from three owners.

### P4-C — closure and collection

- on `trick-completed`, third-card arrival precedes resolution;
- winner becomes perceptually dominant;
- all three cards collect toward the winner;
- completed cards retire from the shared field after collection.

Exit: a viewer can tell who won the trick without relying on the text result capsule.

### P4-D — consequence and next initiative

- point value travels/appears with the winner's collection;
- quiet persistent captured-value/trick evidence remains at the owner;
- next initiative emerges from winner/source hierarchy;
- remove or strongly demote redundant `trick-result` prose once the visual language is demonstrated.

Exit: `winner -> ownership -> value -> next initiative` is readable as one causal chain.

### P4-E — mobile/desktop torture

Rehearse at minimum:

- local player closes and wins;
- local player closes and loses;
- opponent closes/wins;
- slow and rapid consecutive bot actions;
- remote queued updates;
- reconnect during/after a completed trick;
- reduced motion;
- mobile 390x844 and desktop 1440x1000;
- repeated common tricks, not only one hero animation.

Automation may verify ordering, identity, authority boundaries, timing bounds and stable layout. It cannot certify pleasure or materiality.

## Evidence gates

Mechanical PASS requires:

- core/worker/full remote regressions remain green;
- same authoritative card IDs are used through presentation;
- presentation does not advance revision;
- queued remote frames never overtake the visual lifecycle;
- reconnect does not replay stale trick completion;
- reduced-motion path remains semantically complete;
- desktop/mobile have no clipping or dead interaction regions.

Experience PASS remains Owner evidence. Do not claim P4 is "fun", "professional" or friend-ready from CI.

## Stop / anti-rabbit-hole rule

P4 is not a physics-engine project and not a motion-preset project.

Stop tuning one transition when additional changes no longer improve the causal reading of:

`where did this card come from -> what happened -> who owns the trick -> what changed -> who acts next`.

If the scene still feels dead after that chain is mechanically coherent, move upward into composition, opponent presence, graphics and sensory identity rather than endlessly adjusting easing curves.

## Relationship to P2/P3

P2 is treated as a useful structural composition pass, not a final taste pass. Current screenshots still do not fully satisfy the campaign's intended product-designed first-impression bar.

P3 is mechanically adequate to support P4 but not Owner-certified as final feel.

P4 is expected to resolve part of the current dead-field problem by making the shared field carry action, ownership and consequence. P5/P6 will then polish a living causal scene rather than decorate an empty one.
