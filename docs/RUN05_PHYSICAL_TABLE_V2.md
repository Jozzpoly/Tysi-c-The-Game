# Run 05 — Physical Table V2

Date updated: 2026-09-15
Status: **presentation implementation advanced; P0 external-readiness recovery currently takes precedence**

## Current hold

Run 05 produced substantial physical-table work, but its next Owner/friend evidence loop was contaminated by the 2026-09-15 friend-link incident.

Do not interpret the presentation work as failed. The failure is the external deployment/readiness gate: an intentionally temporary public preview was incorrectly treated as satisfying the Owner's hard requirement for a durable friend link.

Until `docs/INCIDENT_2026-09-15_FRIEND_LINK.md` is closed:

- preserve existing Run 05 presentation work;
- keep core/authority/browser gates green;
- do not resume broad blind visual polish;
- repair the stable public path, exact copied-invite evidence and live project authority first;
- after the real Owner+friend path works, resume Owner-led visual/interaction evaluation and bounded presentation debt cleanup.

## Why Run 05 exists

The earlier Friend Candidate proved that the rules/core, authoritative projection, remote room, reconnect, first-play flow and full-match completion could form a usable game foundation. Run 05 is not a polish pass over that historical candidate. It is an experimental replacement of the presentation language.

Owner intent is stronger than “more animation”: cards should become the main material and interaction language. Important state changes should increasingly be understood from where physical card objects are, where they move, what pile they join, and how the table reacts, with text acting as support rather than the primary explanation.

## Non-negotiable direction

- Desktop and mobile are both first-class targets; their compositions may differ.
- The player's hand is a major territory, not a footer strip.
- A card should retain identity and causal continuity while moving between meaningful spatial zones.
- Winning a trick means the cards visibly converge toward the actual winner/captured territory.
- Captured ownership should remain spatially legible rather than collapsing immediately into an abstract counter.
- Physicality is controlled, fast and legible; it does not require a generic rigid-body engine.
- Freedom must not create accidental plays. Manipulation, play intent and authoritative acceptance remain separate concepts.
- Core rules and authoritative projection remain source of truth. Presentation may be replaced aggressively without duplicating game truth.

## Presentation model

Important card presentation should be explainable as transitions between meaningful zones, for example:

`deck -> hand -> table -> captured pile`

`deck -> talon -> declarer hand`

`declarer hand -> opponent hand`

`hand -> marriage presentation -> trick`

Presentation may own geometry, rotation, scale, z-order, target zone, motion phase and motion provenance. It must not own legality, scoring or canonical ownership.

A useful conceptual card-presentation state remains:

- canonical card id;
- canonical owner/visibility from projection;
- presentation zone;
- current/target geometry;
- interaction phase such as resting / held / carried / target-ready / authoritative-handoff / collecting / settled;
- reason/provenance for motion such as deal, play, talon, exchange, marriage, trick capture or reset.

This remains a conceptual direction, not permission to build a generic scene graph without evidence.

## Implemented Run 05 slices

### Physical hand / tactile manipulation

Run 05 materially enlarged and animated the hand, while keeping card manipulation separate from authoritative command acceptance.

Browser evidence covers permissive handling, living hand geometry, mobile touch behavior and authoritative handoff.

### Spatial play target

Play intent is expressed spatially rather than only by distance. A card can be carried toward a receptive table target; release and authoritative acceptance remain distinct.

### Material talon and exchange

Talon/exchange flows gained visible card identity and directional transfer rather than instantaneous state replacement.

### Dealing / hand reset

New-hand presentation gained controlled material deal behavior rather than simple instantaneous appearance.

### Marriage / trump embodiment

Marriage presentation uses the actual card system and motion language rather than only another explanatory block.

### Living trick / captured ownership

Trick resolution now has observable lifecycle stages and persistent captured-pile consequence. Important sequence:

`arrival -> resolve -> collect -> consequence -> settled`

### Desktop composition

Desktop gained its own wider composition rather than simply scaling the mobile layout.

A real regression was discovered here: transform-based centering of `.hand-area` created a containing block that displaced viewport-fixed carried-card geometry. The repair removed that transform dependency, and authoritative-handoff browser coverage now protects the carry-center/target contract.

## Evidence standard

A physical interaction is not done because CSS or animation exists.

Use combinations of:

- deterministic browser rehearsal;
- geometry assertions;
- authoritative revision/identity assertions;
- screenshots at meaningful lifecycle stages;
- Owner visual/feel evidence when mature enough.

Automation should answer questions such as `did the exact card remain singular and reach the authoritative target?`, not `does this feel good?`.

## Owner evidence boundary

Current automation demonstrates significant mechanical presentation behavior. It does **not** establish that the Owner likes the current visual hierarchy, table density, card aesthetics, motion feel or overall product impression.

The next broad visual direction should come from real Owner evidence, not another speculative polish cycle.

## Technical debt discovered during Run 05

### Layered CSS cascade

`src/main.tsx` currently loads a long history of visual-language, Run04 and Run05 stylesheets. This has enabled fast experimentation but now creates real ownership/cascade debt:

- later patches can silently override earlier assumptions;
- fixed/absolute/transform containing-block behavior can cross concern boundaries;
- responsive rules are distributed across historical layers;
- it is harder to know whether a rule is current design or obsolete donor residue.

This debt is **real**, but the repair must be bounded. Do not replace all presentation CSS at once.

After the P0 friend/deployment path is mechanically healthy:

1. inventory duplicated/high-risk selectors and media queries;
2. identify which Run04 layers are genuinely still authoritative for Run05;
3. consolidate one concern at a time into current Run05-owned modules;
4. delete superseded rules only after browser/geometry equivalence or deliberate Owner-approved change;
5. rerun Foundation and inspect fresh desktop/mobile screenshots after each meaningful consolidation.

### Historical naming / donor layers

Run04 files that remain imported are implementation donors, not current roadmap authority. Their names should eventually stop being the primary organization mechanism once behavior is consolidated.

## What Run 05 still does not justify

- final visual identity/art direction;
- generic Box2D/rigid-body card simulation;
- arbitrary freeform card placement that can desynchronize canonical zones;
- broad rules/core rewrite;
- declaring Owner visual acceptance from screenshots/tests alone;
- declaring friend readiness from a temporary public preview;
- treating a successful public smoke as proof of persistence.

## Current next sequence

1. regain green Foundation on the complete recovery head;
2. establish and prove the account-owned stable multiplayer origin;
3. later recheck the same origin/SHA without redeploying;
4. complete the real Owner+friend test;
5. resume Owner visual/interaction testing on that stable surface;
6. turn Owner findings into bounded presentation changes;
7. begin controlled CSS/cascade consolidation while preserving/measuring behavior.

Run 05 remains the active presentation experiment, but external truth is now a hard gate rather than something presentation automation can imply.
