# Run 05 — Physical Table V2

## Why this exists

Friend Candidate 1 proved that the rules/core, authoritative projection, remote room, reconnect, first-play flow and full-match completion can form a usable game. Run 05 is not a polish pass over FC1. It is an experimental replacement of the presentation language while FC1 remains frozen at `snapshot/friend-candidate-01`.

Owner intent is stronger than “more animation”: cards should become the main material and interaction language of the game. Important state changes should increasingly be understood from where physical card objects are, where they move, what pile they join, and how the table reacts — with text acting as support rather than the primary explanation.

## Non-negotiable direction

- Mobile first for the next discovery cycle. Desktop remains first-class long-term but may use a different composition.
- The player's hand is a major territory, not a footer strip.
- A card should retain identity and causal continuity while moving between meaningful spatial zones.
- Winning a trick means the three cards visibly converge and join the winner's persistent captured pile.
- Captured cards remain spatially represented at their owner instead of collapsing into a tiny abstract counter.
- Physicality is controlled, fast and legible. It does not require a generic rigid-body physics engine.
- More freedom must not create accidental plays. Manipulation, play intent and authoritative acceptance remain separate concepts.
- Core rules and authoritative projection remain the source of truth. Presentation can be replaced aggressively without duplicating game truth.

## Presentation model we are moving toward

Every important card presentation should be explainable as a transition between spatial zones:

`deck -> hand -> table -> captured pile`

and later:

`deck -> talon -> declarer hand`

`declarer hand -> opponent hand`

`hand -> marriage presentation -> trick`

The presentation layer may know visual position, rotation, scale, z-order, target zone and motion state. It must not own legality, scoring or canonical ownership.

A useful conceptual card state is:

- canonical card id
- canonical owner/visibility from projection
- presentation zone
- current geometry
- target geometry
- interaction phase (resting / held / carried / target-ready / authoritative-handoff / collecting / settled)
- provenance/reason for motion (deal, local play, remote play, talon pickup, exchange, trick capture, reset)

This is a direction, not a final data model. Do not prematurely build a generic scene graph before bounded experiments prove the need.

## Run 05 bounded sequence

### P0 — preserve the evidence boundary

- FC1 stays frozen.
- Run05 uses its own branch and draft PR.
- Existing Foundation gates must continue protecting core/remote/full-match behavior.
- New presentation tests defend measurable continuity and geometry, not subjective “fun”.

### P1 — Physical Table proof

Prove on a 390×844 mobile viewport that:

1. the hand occupies materially more of the usable screen and cards are substantially easier to read/touch/manipulate;
2. the three cards of a completed trick converge toward the actual winner pile, not a hard-coded generic direction;
3. each seat has a persistent visible captured pile whose growth matches authoritative consequence timing;
4. initiative remains attached to the winning seat/pile;
5. no card escapes the viewport and no canonical consequence appears before the consequence stage.

This is the first implementation target.

### P2 — Spatial play target

Replace the current distance-only throw acceptance with a real table drop region:

- lifting a card away from the hand expresses play intent;
- entering the table target provides feed-forward;
- releasing outside the accepted target returns the card;
- only an authoritative legal command completes the handoff;
- reorder remains possible without accidental play.

### P3 — Materialized talon and exchange

- revealed talon exists as three physical cards on the table;
- auction winner receives those exact visible cards into the hand;
- two exchange cards leave the declarer's hand separately and travel to the correct opponent territories;
- opponent hand/card-count presentation reacts to receipt.

### P4 — Dealing and hand reset

- new-hand start is represented by a fast controlled deal rather than an instantaneous spawned hand;
- the deal may compress/batch for speed but preserves direction and ownership;
- hand-to-hand reset never replays incorrectly on reconnect/static snapshots.

### P5 — Marriage and trump embodiment

Explore a spatial K+Q marriage cue that uses the real cards and table state rather than another explanatory panel. Preserve fast play and accessibility.

### P6 — desktop composition

After mobile physical language is credible, design desktop as its own composition rather than simply enlarging the mobile table.

## What we explicitly do not do yet

- generic Box2D/rigid-body simulation for all cards;
- arbitrary freeform card placement that can desynchronize from canonical zones;
- final visual identity/art pass;
- large rewrite of rules/core/worker;
- optimization for every rare rule before the common physical language works;
- automation that tries to judge taste, delight or realism.

## Evidence standard

A physical interaction is not “done” because CSS exists.

For each bounded slice we want some combination of:

- deterministic browser rehearsal;
- geometry assertions (viewport containment, destination convergence, hit regions);
- authoritative revision/identity assertions;
- screenshots at meaningful lifecycle stages;
- Owner visual/feel test when the slice is mature enough.

Automation should answer questions such as “did the exact card remain singular and end at the authoritative target?” — not “does this feel good?”.

## P1 exit criteria

P1 is successful only if Owner evidence shows an obvious qualitative step over FC1 in the following sense:

- hand reads as a primary game surface;
- trick capture is understandable without reading the consequence text;
- captured ownership persists spatially;
- the result still feels fast enough to play repeatedly;
- mobile interaction remains stable and no gameplay gate regresses.

If those conditions are not met, revise or discard the P1 presentation without touching the frozen FC1 baseline.