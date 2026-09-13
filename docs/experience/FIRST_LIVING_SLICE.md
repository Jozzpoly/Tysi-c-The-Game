# First Living Slice — INTERNAL synthesis target

Status: selected internal research target. **Not Owner-ready. Not a production GameTable redesign.**

## Selected situation

The local player closes a trick with the third card from a living private hand. The accepted play resolves the trick, transfers ownership/value and establishes the next initiative.

This is the first bounded situation intended to bring several Experience Foundation tracks into contact.

## Why this slice

It combines, in one ordinary and repeatable action:

- card embodiment;
- private hand/workspace behavior;
- inspect/reorder/play capability layering;
- contextual legality;
- progressive intent and commit;
- authoritative acceptance/rejection;
- opponent action source;
- `card-played + trick-completed` scene composition;
- ownership transfer;
- point/value consequence;
- persistent state change;
- next-turn initiative;
- sensory dynamic range;
- mobile/desktop semantic parity.

Other candidates remain useful later:

- reorder-only is too weak on shared consequence;
- auction is weak on card/hand embodiment;
- exchange is excellent for spatial self-teaching but less frequent and more domain-specific;
- marriage/trump introduces special-rule complexity and spectacle too early.

## Stable pre-state

The fixture should eventually begin with:

- two cards already in the current trick, attributable to two opponent/source seats;
- a local hand with stable personal topology;
- local initiative;
- canonical legal play relations;
- cards that are not legal to `play` still remaining inspectable/reorderable/owned.

## Capability layering requirement

Reject the binary foundation model:

`playable = interactive`

`not playable = disabled`

A card can simultaneously be:

- owned;
- inspectable;
- reorderable;
- groupable;
- reversibly manipulable;
- able to probe a possible play relation;
- but not currently eligible for authoritative `play` commit.

The object stays alive. Only the invalid semantic relation remains unavailable.

## Intent continuity

The same card may pass through several meanings without an explicit mode switch:

`rest -> inspect/reorder -> extraction -> play probe -> commit or cancel`

The system must not interpret every lift as a play, and it must not require a separate toolbar mode just to distinguish private manipulation from game action.

## Progressive play relation

As a held card leaves the private hand toward shared play:

- the hand may deform locally;
- a legal trick relation may become receptive;
- an illegal card may remain physically owned while the play relation fails to become commit-receptive;
- legality can become clearer contextually without globally greying/deadening the card;
- explicit local explanation may appear after an invalid probe when the rule is conventional rather than inferable.

## Commit boundary

Commit must represent semantic intent, not an accidental distance threshold.

Possible embodiments include release into a receptive relation, a short deliberate throw, click/select + destination or platform-specific equivalent.

Shared semantic contract:

`reversible local manipulation -> sufficiently clear play intent -> commit -> authority`

## Authority truth

Local contact/manipulation feedback may be immediate.

The fixture must keep distinct:

- reversible local response;
- submitted/pending command where applicable;
- accepted canonical play;
- rejected/corrected state.

Do not visually finish canonical consequence before authority exists.

## Scene composition

When the accepted card closes the trick, `card-played` and `trick-completed` are truth atoms within **one perceptual scene**.

Desired causal sentence:

`hand source -> committed card -> shared trick closure -> winner/ownership -> collection -> point consequence -> next initiative -> settle`

The user should not need detached text messages to stitch those steps together.

## Identity and collection

The three cards must retain identity long enough for the player to understand that these specific objects produced the trick result.

Collection should have spatial direction toward the winner/owned result region.

This is a primary place to investigate opponent/player presence through action ownership rather than avatar theatre.

## Point consequence

Trick points should emerge perceptually from the completed trick/capture relation rather than appearing as an unrelated HUD number change.

After transient feedback ends, the stable state may retain useful consequences such as captured value, score and initiative.

Persistent trace should remain decision-relevant, not decorative history.

## Next initiative

The trick winner becomes the next leader.

Routine initiative should ideally become apparent from settled hierarchy/source readiness rather than requiring a large central turn banner.

## Settle and timing

After causal meaning is established:

- transient emphasis falls away;
- unrelated regions become quiet;
- the new stable state is readable;
- the next legal action may become available after the minimum causal hold rather than waiting for every cosmetic tail.

## Sensory composition target

This slice is the first place where Character/Sensory work should meet control research.

Do not begin with a theme bundle.

Investigate a small causal family:

- contact / pickup;
- slide/reorder;
- play commit;
- card arrival/impact;
- trick resolution/collection;
- point transfer;
- settle / next initiative.

Visual, motion, sound and optional haptic channels should be selected by semantic need. Ordinary beats should not all use every channel.

## Platform contract

Mobile and desktop preserve:

- object identity;
- private topology intention;
- capability layering;
- progressive play intent;
- legality relation;
- commit boundary;
- authority truth;
- causal scene;
- persistent consequence;
- next initiative.

They may differ in acquisition, travel amount, offset handling, hover, release gesture, pointer precision, keyboard alternative, visual density and haptic capability.

## Mobile embodiment candidates

These are competing research families, not product choices.

### M0 — full direct carry

The card remains under the finger for the entire trip from hand to shared trick relation.

Potential strength:

- maximum visible object continuity;
- direct spatial ownership.

Risks:

- finger occlusion;
- long thumb travel;
- grip change;
- lower comfort on wide/tall devices;
- excessive visual travel for a frequent action.

### M1 — local physical extraction + semantic transfer

The player physically extracts the card far enough to make play intent clear; after commit, the system completes the travel into the shared scene.

Potential strength:

- rich tactile hand interaction without forcing the thumb across the whole screen;
- clear distinction between reversible manipulation and committed public action.

Risks:

- commit boundary could feel like the system steals the card;
- object continuity must remain strong through the autonomous leg.

### M2 — controlled throw/flick

Release velocity/direction contributes to commit while the system still resolves toward the semantic trick destination.

Potential strength:

- expressive, fast repeated play;
- potentially satisfying skill/gesture headroom.

Risks:

- accidental commits;
- motor accessibility;
- harder cancellation;
- style may dominate correctness;
- may become arcade-like rather than fitting eventual product character.

### Mobile research constraint

Do not decide between M0/M1/M2 from abstract preference. The eventual comparison must account for actual thumb reach, occlusion and repetition.

## Desktop embodiment candidates

### D0 — precise direct drag

Pointer acquisition and drag preserve the card's grab relation through the entire transfer.

Potential strength:

- low occlusion;
- excellent precision;
- strong continuity.

Risk:

- can feel like generic file dragging if staging/material response is weak.

### D1 — hover feedforward + direct commit drag

Hover reveals acquisition/legality/insertion relationships before pointer-down; drag remains the primary embodied action.

Potential strength:

- desktop-specific feedforward without changing semantic rules;
- lower ambiguity between inspect/reorder/play.

Risk:

- hover noise/flicker;
- must never be required for correctness.

### D2 — select + semantic destination as alternate path

Click/keyboard selection followed by destination/confirm expresses the same semantic play operation without sustained drag.

Potential strength:

- accessibility;
- trackpad/precision alternative;
- explicit expert path where useful.

Risk:

- may become modal/sterile if elevated over direct manipulation.

### Desktop research constraint

Desktop may end with richer pointer/hover support than mobile, but it must not introduce a different game ontology.

## Viewer-local workspace state

Canonical authority owns **membership**: which cards the player actually has.

Presentation may own **viewer-local topology**: the order/grouping/spatial relations in which those visible cards are arranged.

Working reconciliation contract:

`previous local topology + new canonical membership -> next local topology`

Rules:

- removed cards must disappear because authority wins;
- surviving cards should not be reordered merely because projection refreshed;
- legality-only updates should not rewrite topology;
- reconnect with compatible local memory should preserve surviving topology where safe;
- new-card placement remains an open design question rather than an excuse for whole-hand auto-sort;
- local topology must not leak to opponents/authority as hidden gameplay information.

Current INTERNAL workspace bench compares:

- W0 canonical reset baseline;
- W1 stable survivors + explicit intake edge;
- W2 stable survivors + suggested insertion without reordering survivors.

The bench already demonstrates that canonical-reset policy can destroy personal ordering even when membership has not changed. It does **not** establish whether W1 or W2 feels/cognitively performs better.

## Before/after presentation staging

A Living Slice must not turn authoritative truth into visible teleportation.

Conceptual presentation inputs:

`presented before + viewer-safe events + authoritative after`

The experience layer may use transient visual objects to preserve identity through the transition, but those objects are never canonical state.

Relevant semantic anchors include:

- local hand/card;
- opponent/source seat;
- trick position;
- captured-value/winner region;
- score/value region;
- next initiative locus.

Mobile and desktop provide different geometry for the same anchor meanings.

## Internal torture plan

The Living Slice should not be judged only in one clean successful pass.

Before Owner readiness, internal rehearsal should include:

### T1 — reorder without play

Repeatedly move a card within the hand and return/cancel. No accidental commit should occur.

### T2 — play-probe then cancel

Extract a legal card toward shared play, then return it. Workspace should remain coherent.

### T3 — illegal play probe

Manipulate an illegal-to-play card toward the trick. The card remains owned/alive while the commit relation stays unavailable.

### T4 — rapid local reordering

Cross insertion relationships quickly enough to expose chatter, oscillation and accidental index changes.

### T5 — slow precision

Move/reorder/play deliberately at low speed. Materiality must not steal precision.

### T6 — authority latency

Inject short, medium and noticeable response latency. Pending must not look like accepted success or object mass.

### T7 — authoritative rejection

Commit, then reject/correct. Recovery must preserve unrelated hand topology and explain the failed relation without magical rewind.

### T8 — trick winner variants

Repeat closure where local player wins and where either opponent wins. Collection/source presence must remain coherent in all directions.

### T9 — repetition

Run ordinary trick closure many times. Timing/sound/motion should not become exhausting.

### T10 — interruption

Look away/background/resume or simulate presentation cancellation. Current authority should recover without stale animation backlog.

### T11 — reduced channels

Test sound off, no haptics and reduced motion. Semantic meaning must survive.

### T12 — platform body

Exercise mobile-like touch geometry and desktop pointer/hover geometry separately rather than validating only one input path.

## Questions still worth killing analytically before rendering

1. Which hand geometry is necessary to test topology without preselecting final art direction?
2. What minimum visual card anatomy is needed for readable identity under overlap and finger occlusion?
3. Which semantic anchors must exist for the scene; which can remain derived geometry?
4. How much authority latency simulation is enough for research without building network theatre into the fixture?
5. Which sensory beats need real sound assets versus placeholder physically plausible impulses for internal study?
6. How should reduced-motion staging preserve causal order without becoming a separate design?
7. What is the minimum opponent representation required to establish action-source presence without avatar theatre?

## Internal research questions

### LS1 — intent continuity

Can a card move from private manipulation toward public action without hidden-mode confusion?

### LS2 — legality without dead ownership

Can illegal-to-play cards stay useful/alive in the hand while commit remains clearly unavailable?

### LS3 — hand/world continuity

Does the card retain identity from hand through authoritative play into shared trick?

### LS4 — action-source presence

Do opponent cards and winner collection read as actions/ownership belonging to specific seats?

### LS5 — scene compression

Can play + closure + collection + points + initiative read as one causal scene without text recap?

### LS6 — dynamic range

Can card contact feel rich while ordinary trick resolution remains compact enough for heavy repetition?

### LS7 — persistent consequence

Does the settled board retain enough changed truth to explain the current situation after motion stops?

### LS8 — platform parity

Can touch and desktop pointer interactions feel native while expressing the same semantic operation?

## Internal failure conditions

Do not progress this slice toward Owner perception if:

- reorder and play intent collide frequently;
- legality requires globally disabling cards;
- the hand rebuilds/destroys personal topology on every play;
- authority correction requires unexplained teleportation;
- trick resolution still requires detached prose to make sense;
- points/collection have no causal spatial relation;
- opponent source/ownership remains anonymous;
- cosmetic tail blocks the next action;
- the fixture is so debug-like that aesthetics dominate judgement;
- styling is so bundled that we cannot tell what produced improvement;
- mobile and desktop require incompatible semantic models.

## Current readiness

**INTERNAL DESIGN TARGET SELECTED; prerequisite model substantially advanced.**

A rendered Living Slice fixture is still not authorized yet.

Before implementation, remaining high-value work is now narrower:

1. choose a deliberately neutral-but-quality hand/scene geometry for internal use;
2. specify the minimal semantic anchor registry and transition-plan shape;
3. choose a minimal sensory material palette that is good enough not to read as debug tooling but weak enough not to hide mechanism differences;
4. perform one more adversarial review asking whether the fixture will produce information unavailable from analysis;
5. only then implement the internal Living Slice and torture it before any Owner exposure.
