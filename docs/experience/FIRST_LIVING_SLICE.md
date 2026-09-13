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

Possible later embodiments include release into a receptive relation, a short deliberate throw, click/select + destination or other platform-specific equivalents.

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

They may differ in:

- acquisition;
- travel amount;
- finger-offset behavior;
- hover feedforward;
- release gesture;
- pointer precision;
- keyboard alternative;
- visual density;
- haptic capability.

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

**INTERNAL DESIGN TARGET SELECTED.**

No rendered Living Slice fixture is authorized yet.

Before implementation, the next work should specify:

1. Hand Workspace geometry/capability state model for this situation;
2. semantic scene anchors and before/after staging without presentation becoming authority;
3. minimum visual/sensory material language needed to avoid debug-toy bias;
4. desktop and mobile embodiments of the same semantic contract;
5. internal torture/repetition plan;
6. which remaining questions can still be killed analytically before building.
