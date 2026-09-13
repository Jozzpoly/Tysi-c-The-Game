# Spatial Cognition and User-Owned Workspace

## Thesis

Spatial layout can be part of thinking.

The project should therefore treat some presentation geometry as user-owned cognitive state rather than disposable rendering detail.

This is a stronger claim than "let players sort cards manually".

## 1. Space can reduce cognition

Research on the intelligent use of space identifies at least three broad functions of spatial arrangement:

- simplify choice;
- simplify perception;
- simplify internal computation.

A hand of cards can potentially do all three.

Examples:

- keeping a marriage pair adjacent reduces search;
- separating suits creates perceptual chunks;
- moving a questionable card to an edge externalizes uncertainty/prioritization;
- preserving a personal order reduces repeated reconstruction.

## 2. Epistemic action

Some actions are performed not to directly advance the external task, but to make thinking easier.

Potential card examples:

- temporary reorder;
- spreading cards apart;
- comparing two cards side by side;
- moving a card out and back;
- creating a gap/group without changing gameplay state.

These actions should not be automatically dismissed as inefficiency.

A user repeatedly manipulating the hand without committing gameplay may be using the interface to think.

## 3. Emergent structure

Spatial-hypertext research is especially relevant because people often create provisional structure before they can or want to formalize it.

Important property:

**meaning may exist in placement without being encoded as metadata.**

For a card hand this might include:

- proximity;
- spacing;
- local ordering;
- edge placement;
- temporary grouping.

For future builders/workspaces this can be much richer.

## 4. Constructive ambiguity

A system may be tempted to infer every spatial pattern:

> these three cards are a formal group.

That can be destructive.

Sometimes the value of space is that the relation remains intentionally vague.

Design principle candidate:

**allow user-created spatial meaning to exist before forcing it into system semantics.**

## 5. Stable landmarks

Spatial memory requires sufficient stability.

Failure examples:

- auto-sort after every state update;
- fan width changes causing all cards to jump unpredictably;
- viewport changes fully reshuffling relationships;
- device rotation destroying the user's organization with no mapping.

Stability does not require pixel permanence.

It requires preserving meaningful relationships.

## 6. Presentation state vs gameplay state

This creates an explicit architectural need.

Canonical gameplay may store the player's cards as a sorted or otherwise deterministic set/list.

Presentation may need separate user-owned state such as:

- preferred order of visible CardIds;
- optional group gaps;
- local expansion/focus;
- recent insertion location;
- per-device adaptation.

This state must not affect rules or leak hidden information.

## 7. Reconciliation algorithm concept

When a new authoritative hand arrives, presentation should not simply replace user order.

A future reconciliation strategy could:

1. retain surviving known cards in existing user order;
2. remove cards no longer present;
3. identify genuinely new visible cards;
4. insert new cards using a conservative policy;
5. preserve explicit/implicit user groups where possible;
6. allow the user to reposition immediately.

The exact insertion policy is not yet chosen.

Potential options:

- edge insertion;
- canonical-neighbor insertion;
- temporary "new card" staging;
- context-dependent insertion.

## 8. Automatic sort as a tool, not authority

Auto-sort can remain valuable.

Possible model:

- user order is primary persistent workspace state;
- sort is an explicit instrument/action;
- multiple sort lenses may exist;
- applying sort should be deliberate and potentially undoable;
- system should not silently reapply sort after the user changes arrangement unless the user explicitly chooses a persistent automatic mode.

## 9. Dynamic layout under constraints

The hand must still fit different screen widths and card counts.

The challenge is to preserve semantic relationships while layout compresses.

Potential invariants:

- relative order;
- group adjacency;
- user-created gaps expressed proportionally;
- focused card prominence;
- selected/held card continuity.

Raw coordinates are not sacred.

## 10. New-card arrival

New information entering a cognitive workspace deserves special treatment.

Failure:

A new card appears already sorted in the middle, moving everything and making the user search for what changed.

Candidate approaches:

- enter at a stable edge;
- enter near related group but visibly travel there;
- temporary "new" separation that resolves after acknowledgement;
- user-controlled placement if the event permits time.

The important property is **change legibility without workspace destruction**.

## 11. Card removal

When a card leaves the hand:

- the gap can communicate departure;
- neighbors should close coherently;
- the hand should avoid total re-layout unless necessary;
- user groups should survive.

A played card should feel removed from *my workspace*, not simply deleted from a list.

## 12. Rejected/cancelled action

Returning a card should restore its prior cognitive relation.

Cancel:

- restore exact/near-exact previous place.

Reject after commit:

- return to a legible position;
- preserve group/order where possible;
- avoid arbitrary resort.

This makes recovery part of workspace fidelity.

## 13. Workspace history and undo

For Tysiac, full layout undo may be unnecessary.

But donor implications are large.

In builders/research canvases, user spatial organization may benefit from:

- undoable auto-layout;
- snapshots;
- named workspaces;
- loose staging areas;
- pin/lock of important objects;
- semantic groups that emerge from repeated spatial use.

Tysiac can test the simplest version first.

## 14. System inference should be humble

The system may detect patterns to assist, but should not prematurely formalize them.

Example:

If the user repeatedly keeps two cards together, the UI could make maintaining adjacency easier without declaring a permanent group.

This is a future possibility, not a current requirement.

## 15. Workspace and self-teaching

Spatial organization can help rules become legible.

Example possibilities:

- legal cards subtly gain room to move toward target;
- currently related cards can become perceptually connected without auto-reordering;
- suit/role relationships may be readable through card design and optional user grouping.

Important:

Do not manipulate the user's workspace to "teach" in a way that destroys ownership.

## 16. Cross-project transfer

### Jozz Vehicle

Potentially high value:

- staging components before attachment;
- keeping alternative parts near each other;
- personal spatial organization of tools/components;
- preserving partially explored topology;
- explicit auto-layout as an instrument, not constant authority.

### JES

Research/debug workspace could let the Owner arrange probes, evidence, overlays or local world-edit tools spatially instead of forcing all reasoning into panels.

### LLM Live NPC

Debugging perception/memory/decision might benefit from spatially stable, inspectable causal artifacts rather than ephemeral logs.

### Multi World

Inventory/object layouts may become player-owned cognition, but only where that serves play rather than adding inventory micromanagement.

## 17. Failure conditions

- system silently destroys personal order;
- workspace meaning is inferred too aggressively;
- spatial freedom creates clutter with no recovery tools;
- cross-device adaptation loses all landmarks;
- new objects shift everything without a legible entry event;
- auto-sort is treated as canonical truth;
- user has to fight layout engine to maintain a useful grouping;
- positional semantics exist visually but are inaccessible to alternative input/screen readers.

## 18. Evidence we need

Future tests should observe:

- whether the Owner spontaneously creates stable recurring groupings;
- whether order differs from obvious suit/rank sorting;
- whether hand organization persists across multiple game decisions;
- whether a forced sort harms comprehension or evokes immediate correction;
- whether new-card insertion is noticed without disrupting existing structure;
- whether repeated play increases use of spatial organization.

Only then should we decide how much presentation-state infrastructure the final game deserves.
