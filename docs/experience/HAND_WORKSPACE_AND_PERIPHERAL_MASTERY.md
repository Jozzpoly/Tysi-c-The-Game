# Hand Workspace and Peripheral Mastery

Status: research model. No production hand implementation is authorized by this document.

## Why this is a separate research object

The private hand is not merely a row of card buttons. It is simultaneously:

- the player's owned inventory;
- the most frequent direct-manipulation surface;
- a private spatial workspace;
- a possible external memory aid;
- a locus for legality/feedforward;
- the source of many committed actions;
- a repeated motor environment in which expertise may develop.

Owner Mobile Recording 001 already showed repeated spontaneous return to card manipulation and reordering. That is directional evidence, not proof of the final hand model.

External research makes the hypothesis worth taking seriously:

- distributed-cognition work treats spatial reorganization of artifacts as part of thinking rather than incidental presentation;
- epistemic-action studies show that changing the external representation can reduce internal reasoning burden;
- spatial-memory HCI research shows that stable locations and landmarks can support fast retrieval and expertise;
- recent playing-card research explicitly observes stable individual ordering habits, including meaningful individual differences in ascending versus descending arrangements;
- physical card manipulation has been shown to improve some reasoning tasks when users actively reorganize the material representation.

The correct claim is therefore not `manual sorting is good`.

The research hypothesis is:

> A card hand can become a user-owned cognitive topology. If the system preserves meaningful spatial relationships while still providing bounded assistance, manipulation may support memory, reasoning, expertise and embodied control rather than serving only as animation.

## Core distinction: order is not topology

A simple list order captures only one dimension.

A richer hand topology may eventually include:

- left-to-right sequence;
- local spacing;
- weak grouping/proximity;
- stable landmarks such as edges or suit clusters;
- a currently focused region;
- temporary insertion gaps;
- recent-change traces;
- possibly explicit separators only if later evidence justifies them.

Do not assume all of these should ship. The point is to avoid collapsing the research problem into `array.sort()` versus `drag-to-reorder`.

## Workspace truth principles

### 1. Stable identity

A card remains the same card through reorder, receive, play attempt, reject and return.

Presentation must not recreate the whole hand in a way that perceptually destroys object identity.

### 2. User organization is stateful presentation, not canonical rules state

Canonical game authority owns which cards the player possesses.

Presentation may own how those viewer-visible cards are arranged locally.

This prevents UI organization from contaminating rules while allowing the user's workspace to survive canonical refreshes.

### 3. System updates should preserve the maximum useful topology

When one card leaves, the hand should not gratuitously rebuild.

When one card arrives, existing relations should remain recognizable.

When legality changes, cards should not silently resort themselves merely because a new machine-defined order is convenient.

### 4. Machine assistance must be legible and defeatable

Automatic grouping or suggested order may eventually be useful, especially for novices.

It must not masquerade as the user's own arrangement.

A system may suggest structure; it should not repeatedly overwrite personal structure without an explicit semantic reason.

### 5. Spatial constancy is not absolute rigidity

A changing hand must move.

The research goal is **minimum necessary disturbance**, not freezing pixel coordinates.

Useful invariants may be relational:

- this card remains left of that group;
- this cluster remains near the left edge;
- the new card enters through a predictable region;
- removal closes space locally rather than globally re-sorting everything.

### 6. Landmarks matter

Spatial-memory research suggests users exploit corners, edges, regions and other landmarks.

The hand can intentionally provide stable anchors without drawing dashboard boxes around every group.

Potential anchors include:

- left/right hand edges;
- stable fan curvature;
- persistent local gaps created by the user;
- suit/value relationships when the user chooses them;
- the currently manipulated card's prior location.

## Proposed hand lifecycle

The hand should be studied as a stateful environment, not only a resting layout.

### Rest

Cards are stable, readable and quiet.

The hand should feel inhabited without continuous decorative motion.

### Contact / acquisition

The touched card acknowledges ownership immediately.

Its neighbors may react enough to expose local structure, but acquisition should not trigger full-hand spectacle.

### Inspect / reversible lift

The player may temporarily expose a card without committing anything.

The rest of the hand retains landmarks.

### Reorganize

Local relationships deform around the moved card.

A future insertion site should become perceptible before release.

The key question is whether the hand behaves like a connected local field or like a sortable list.

### Depart

As a card leaves the hand, the workspace should communicate that its role is changing.

This transition must eventually connect to progressive play intent, but that semantic problem is not solved here.

### Return / cancel

A reversible manipulation should return coherently to its prior or newly negotiated workspace relation.

Cancel is not an error.

### Reject

If an attempted commit is rejected by authority, the card returns with a different semantic meaning from cancel: an attempted state transition did not become canonical.

The hand should recover without losing unrelated user organization.

### Receive

A newly received card creates a serious design question.

Bad default:

`new canonical hand -> global auto-sort -> every remembered relation moves`

Research candidates:

- enter at a stable intake edge;
- enter near a system-suggested region while visibly remaining new;
- create a temporary insertion candidate that the user can accept or change;
- use a configurable explicit sort command rather than implicit resorting.

No candidate is selected yet.

## Peripheral mastery hypothesis

A mature hand interaction should not require the same level of focal attention forever.

Potential expertise progression:

1. **focused novice interaction** — user looks directly at the hand and reads explicit local cues;
2. **predictable spatial interaction** — stable topology enables rapid visual localization;
3. **peripheral manipulation** — common movements can be performed with reduced focal attention while strategic attention remains elsewhere;
4. **motor/spatial expertise** — repeated relations become familiar enough that the UI itself recedes during routine operations.

This is not an argument for eyes-free card play.

It is an argument that a good interface can become more transparent through learning instead of forcing permanent visual search.

## Important implication for animation

Animation that improves first-contact legibility can damage spatial memory if it continuously relocates landmarks.

Therefore every hand animation should be judged against two questions:

- does it explain the current change?
- does it preserve enough spatial continuity for the learned hand to remain recognizable?

`More fluid` is not automatically better.

## Local-field hypothesis

The first Owner lab made reordering read too much like index replacement.

A stronger hypothesis is that local displacement should decay spatially from the manipulated card.

Conceptually:

- nearest neighbors yield most;
- farther cards retain stronger landmark stability;
- a future insertion gap emerges continuously;
- outer regions should not oscillate because one card crosses a local boundary;
- release settles to a stable topology quickly.

This can create `meatiness` relationally, reducing the need to make the held card itself theatrical.

## But do not over-physicalize the hand

A literal simulated fan of colliding rigid bodies may be worse than a designed relational field.

Risks:

- jitter;
- loss of exact insertion control;
- accidental whole-hand movement;
- excessive peripheral motion;
- unpredictable card overlap;
- computational complexity with no cognitive value;
- difficult accessibility alternatives.

The target is not physically correct cards.

The target is a **coherent spatial workspace whose response communicates relationships**.

## Attention budget

The private hand is important enough to deserve rich response, but not important enough to dominate every moment.

### At rest

Mostly peripheral.

The user should be able to know `my hand is here and stable` without attention capture.

### During contact

Local region moves toward focal attention.

### During commit negotiation

The card plus destination relationship becomes primary.

### After action

The hand should settle back toward the periphery quickly enough that table/opponent consequence can take focus.

This suggests a general cycle:

`periphery -> local focus -> causal bridge -> consequence focus -> settled periphery`

The cycle may become a donor pattern if later evidence supports it.

## Novice guidance without destroying mastery

The Owner wants a novice to understand how to act through visual language and feedback rather than banners and arrows.

The hand can contribute through:

- local feedforward;
- responsive legal possibilities;
- progressive resistance or destination behavior when semantically honest;
- local explanations after exploratory failure;
- stable relationships that become learnable.

But novice assistance must not continually move expert landmarks.

Possible long-term principle:

> Add information around stable objects before moving the objects themselves.

This is currently a hypothesis, not doctrine.

## Mobile embodiment

Mobile should not be treated as a compressed desktop hand.

Research constraints include:

- finger occlusion;
- one-hand versus two-hand grip;
- thumb reach and direction;
- device-edge escape paths;
- card readability under partial cover;
- how much of the hand can remain spatially constant across narrower widths;
- whether long drags are ergonomically worse than shorter semantic commits.

The workspace may need a different geometry on mobile while preserving semantic topology.

## Desktop embodiment

Desktop provides:

- precise pointer acquisition;
- hover/feedforward;
- larger persistent spatial field;
- more opportunity for stable landmarks and intentional gaps;
- possibly modifier-assisted organization later.

Desktop should not merely enlarge mobile geometry.

## Persistence scope

Potential layers of persistence must be separated:

### Within one hand

Strong candidate. User organization should normally survive ordinary state updates.

### Across hands in one match

Unclear. New hands may need a clean state or may benefit from retained ordering preference.

### Across matches/devices

Much stronger claim. Could preserve preferences or sorting conventions without preserving literal transient card positions.

Do not conflate `persistent personal ordering rule` with `persist every gap forever`.

## Research metrics beyond task speed

When this becomes testable, evidence should include:

- spontaneous reordering frequency;
- whether user-created patterns recur;
- time spent visually searching the hand;
- correction after system insert/remove;
- whether users rebuild the same organization after disruption;
- accidental commits during reorder;
- ability to resume after attention interruption;
- subjective ownership and `this is my hand` language;
- fatigue under repeated manipulation;
- whether experts start manipulating with less focal attention.

Do not optimize all of these into one score.

## High-value experiments later

### H1 — local-field versus slot reorder

Same held-card control law, different neighbor response.

Question: does a continuous local field improve workspace embodiment without reducing insertion precision?

### H2 — spatial-constancy disruption

Compare minimal local closure after card removal versus automatic whole-hand resort.

Question: does preserving topology improve resumption/localization over repeated play?

### H3 — new-card intake

Compare stable-edge intake, suggested-region intake and immediate auto-sort.

Question: which behavior minimizes cognitive/workspace disruption while keeping new information noticeable?

### H4 — personal order over repeated sessions

Observe whether stable individual arrangements emerge without asking the user to invent a sorting system.

This is important because recent playing-card research reports stable individual ordering habits in physical card use.

### H5 — focused versus peripheral proficiency

After familiarity develops, test whether routine card localization/manipulation requires less focal visual attention.

This is later-stage research, not an early prototype target.

## Failure conditions

Narrow or reject the strong workspace claim if repeated authentic play shows that:

- users rarely create stable personal organization;
- preserved order does not help resumption or comprehension;
- free arrangement creates more search than it saves;
- automatic game-relevant sorting consistently outperforms personal topology without harming ownership;
- local-field motion distracts from strategic/table information;
- cross-device geometry makes persistence confusing rather than helpful.

## Donor candidates

If supported, the useful donor concepts are not card fans.

They would be:

- **user-owned cognitive topology**;
- **minimum necessary disturbance** under authoritative/system updates;
- **stable landmarks with local adaptive deformation**;
- **novice assistance around, not through destruction of, learned spatial structure**;
- **periphery-to-focus-to-periphery interaction cycle**;
- **presentation persistence separated from canonical domain state**.

Possible targets include JV builder assemblies/palettes, JES world-edit tooling, Multi World inventory/object workspaces and research/debug environments.

## Current conclusion

The hand should be treated as a serious cognitive/embodied subsystem.

However, no final topology, sorting behavior, local-field law or persistence scope is proven.

Current priority remains:

1. finish enough internal Card Object falsification to establish a defensible held-object relationship;
2. then build Hand Workspace research around spatial constancy and local relational response;
3. keep Trick/Scene and higher-scale experience in parallel scope so the hand does not become a local optimum.

## Research references informing this document

- Hollan, Hutchins & Kirsh (2000), distributed cognition and intelligent use of space.
- Fjeld & Barendregt (2009), epistemic action as an independent measure for tangible-interface cognitive support.
- Scarr, Cockburn & Gutwin (2013), supporting/exploiting spatial memory in interfaces.
- Uddin & Gutwin (CHI 2021), interface landmarks and spatial memory.
- Tak et al. (INTERACT 2009), spatial constancy and revisitation.
- Vallée-Tourangeau et al. (2015), physical manipulability of playing-card problem information and reasoning.
- Mingolo et al. (Psychological Research 2026), stable individual order of playing-card disposition and experience-related spatial associations.
- Bakker, van den Hoven & Eggen (2012), hand-based peripheral interaction.
