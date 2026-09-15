# Run 05 — Physical Table V2

Date updated: 2026-09-15
Status: **presentation implementation integrated into `main`; P0 external-readiness recovery still blocks friend-ready PASS**

## Current state

Run 05 produced substantial physical-table work and its clean continuation has now been mechanically validated and integrated into `main`.

The old PR #23 is closed as superseded integration history. It is not the live implementation authority.

The presentation work itself is not failed. The failed milestone is external readiness: an intentionally temporary public preview was previously treated as satisfying the Owner's hard requirement for a durable friend link even though repository evidence said it should expire.

Until `docs/INCIDENT_2026-09-15_FRIEND_LINK.md` is closed:

- preserve the integrated Run 05 presentation work on `main`;
- keep core/authority/browser gates green;
- keep the frozen external candidate immutable unless a replacement is explicitly cut and re-evidenced;
- do not resume broad blind visual redesign;
- finish the account-owned stable public path, public provenance, exact copied-invite evidence, later no-redeploy check and real Owner+friend test;
- continue only bounded technical-debt work that does not silently redefine the external candidate.

## Frozen external candidate

The current friend-test candidate remains exactly:

`52450baa04f22646474bf4676f70b2df5ba6812f`

Later cleanup on `main` is not automatically a new friend candidate.

## Why Run 05 exists

The earlier Friend Candidate established that the rules/core, authoritative projection, remote room, reconnect, first-play flow and full-match completion could form a usable game foundation. Run 05 is not a polish pass over that historical candidate. It is an experimental replacement of the presentation language.

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

Trick resolution now has observable lifecycle stages and persistent captured-pile consequence:

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

The real `Kopiuj link dla znajomego` path is now also rehearsed locally in Foundation: the exact UI-emitted invite is captured, checked for room-only/capability-free semantics and opened by a clean second browser. This protects the product path before deployment, but it does **not** prove public/stable availability.

## Owner evidence boundary

Current automation demonstrates significant mechanical presentation behavior. It does **not** establish that the Owner likes the current visual hierarchy, table density, card aesthetics, motion feel or overall product impression.

The next broad visual direction should come from real Owner evidence, not another speculative polish cycle.

## Technical debt discovered during Run 05

### Layered CSS cascade

`src/main.tsx` still loads a history of visual-language, Run04 and Run05 stylesheets. This enabled fast experimentation but created real ownership/cascade debt:

- later layers can silently override earlier assumptions;
- fixed/absolute/transform containing-block behavior can cross concern boundaries;
- responsive rules are distributed across several historical layers;
- naming does not always match present ownership.

A bounded cleanup campaign has already removed the easy, demonstrably dead or patch-on-patch debt with full Foundation evidence:

- the old tactile corrective patch was folded into the actual tactile owner;
- obsolete `run04-mobile-hand.css` direct-card layout was removed;
- the 44px mobile interaction minimum was moved into `touch.css` and strengthened so later visual compression cannot undercut the interaction contract;
- unreachable old direct-child hand rules were removed from `touch.css`;
- unreachable direct-card rules were removed from `visual-language-02.css`;
- current code no longer contains the old `.hand > .card` production assumption.

The easy deletion phase is largely over. Remaining overlap is live architecture:

- `run04-tactile-hand.css` is a real mechanics owner for slots, drag ghost, interaction states, 10-card behavior and handoff;
- `run04-scene-compression.css` still owns live intermediate-viewport composition;
- Run05 layers intentionally override those concerns in bounded mobile/desktop regions.

Do not delete historical-looking Run04 files merely because of their names. Further consolidation is an ownership refactor and requires a specific target architecture, bounded slices and fresh browser evidence; visual changes additionally require Owner judgement.

### Room retention / Durable Object lifecycle

`MatchRoom` currently stores a persistent room under one Durable Object storage key with no explicit expiry policy.

There is no safe cleanup point that can be chosen as a purely technical optimization: lobby invites, reconnect and completed-room persistence are observable product behavior. An arbitrary TTL could invalidate a link or reconnect promise.

Therefore room expiry is a **P1 retention-design problem**, not a cleanup to slip into the frozen candidate. Before broader/public use, define the intended lifetime of lobby, active and completed rooms, then implement/test retention deliberately.

## What Run 05 still does not justify

- final visual identity/art direction;
- generic Box2D/rigid-body card simulation;
- arbitrary freeform card placement that can desynchronize canonical zones;
- broad rules/core rewrite;
- declaring Owner visual acceptance from screenshots/tests alone;
- declaring friend readiness from a temporary public preview;
- treating local exact-invite rehearsal as proof of public deployment;
- treating a successful public smoke as proof of long-horizon persistence;
- deleting live Run04 mechanics/composition layers without an ownership migration plan.

## Current next sequence

1. keep the frozen friend candidate unchanged;
2. complete the one-time permanent Cloudflare account setup by adding the two required GitHub Actions secrets outside chat;
3. retry the exact frozen candidate through the stable deployment path;
4. require canonical stable origin, exact SHA/deploy-class provenance, public multiplayer and exact copied-invite PASS;
5. later recheck the same origin/SHA without redeploying;
6. complete the real Owner+friend session;
7. then resume broad Owner visual/interaction evaluation on a trustworthy surface;
8. use that evidence to guide presentation changes and the next phase of CSS ownership consolidation;
9. separately design room-retention semantics before wider/public usage.

Run 05 is now integrated product work on `main`, while external truth remains a hard independent gate that presentation automation cannot imply.
