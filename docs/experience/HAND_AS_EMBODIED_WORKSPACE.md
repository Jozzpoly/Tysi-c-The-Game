# Hand as Embodied Workspace

Status: high-value hypothesis for Run 01, not final UI specification.

## Reframe

The player's hand should not be treated as a card list or footer widget.

It is simultaneously:
- the player's private territory;
- the primary manipulation surface;
- an external memory / thinking aid;
- a staging area for intent;
- a source of most routine actions;
- the place where canonical legality becomes perceptible;
- the closest thing this interface has to a first-person body.

This makes hand behavior foundational product design rather than polish.

## Manual order is cognition

Physical card players commonly reorder cards while thinking. Digital manual ordering can serve the same purpose.

Therefore:
- player ordering should be stable;
- state refresh must not silently undo it;
- new cards should be inserted without arbitrarily scrambling surviving cards;
- automatic sort should be explicit / optional if it exists;
- the game should not treat canonical sort order as presentation authority.

Potential presentation state:

`HandLayoutState = ordered CardId[] + transient manipulation state`

Merge against each new viewer-safe `ownHand`:
1. retain surviving CardIds in their local order;
2. remove absent CardIds;
3. identify genuinely new CardIds;
4. insert new cards according to an explicit presentation policy;
5. never mutate gameplay state or legality from this ordering.

## Own hand can be asymmetrically rich

There is no requirement for visual symmetry between the player's own hand and opponent hands.

Own hand may have:
- high-resolution card surfaces;
- tactile lift / tilt / drag response;
- local deformation and reordering;
- contextual legality feedback;
- inspection and fidget interaction.

Opponent hand should remain information-safe and may be represented more abstractly.

Public cards can regain full fidelity once revealed.

## The hand should answer touch

A good manipulation loop is continuous:

`contact -> acquire -> lift -> move -> environment responds -> intent becomes clear -> commit/cancel -> settle`

The card should remain the same perceptual object across the sequence.

Avoid:
- click card -> separate overlay appears with unrelated motion;
- pointer moves while card lags unpredictably;
- reorder occurs only after release with no insertion preview;
- state refresh visibly re-sorts everything.

## Hand deformation matters

When one card moves, the hand should acknowledge it.

Candidate behaviors:
- neighboring cards open a gap;
- the fan rebalances locally;
- insertion slot follows pointer position;
- nearby cards react more than distant cards;
- release causes a coherent settle, not simultaneous unrelated tweens.

This creates a sense that the hand is one physical system rather than independent buttons.

## Reorder and play should share one world

Avoid detached modes like `REORDER MODE` versus `PLAY MODE` if the gesture itself can remain intelligible.

Hypothesis:
- lateral movement inside the hand primarily expresses organization;
- movement out of the hand expresses play intent;
- the hand and destination visually reveal which interpretation is active;
- the player can reverse intent before commit;
- alternative non-drag input remains available.

This must be tested for accidental commits and mobile thumb ergonomics.

## Safe fidget is valuable

Waiting for another player should not make the interface inert.

Safe actions may include:
- reorder own cards;
- lift and inspect;
- fan / close the hand slightly;
- move a card and return it without game consequence.

These interactions must remain purely local and must not be faked into opponent-visible activity.

Truthfulness matters: do not invent opponent fidget / hesitation just to make bots or remote players appear human.

## Learning through hand behavior

The hand can teach routine rules without permanent labels.

Example research pattern:
- at rest, cards remain visually calm;
- grabbing a card reveals how freely it can leave the hand;
- valid destination reacts as the card approaches;
- illegal commit develops material resistance;
- repeated insistence yields a short local reason;
- release returns the card to the player's own arrangement.

This preserves dignity and agency: the player is allowed to probe rather than being pre-emptively blocked by tutorial chrome.

## Latency and truth

The hand is also where perceived network latency can be handled honestly.

Before authority:
- contact and manipulation are immediate;
- the card can latch into a pending commit pose;
- surrounding hand may acknowledge the pending removal cautiously.

After acceptance:
- ownership transfer / public consequence completes.

After rejection:
- the same card returns to its local hand position;
- concise local reason may appear;
- no fake trick/score consequence is shown then reversed.

This yields a broader cross-project principle:

> **Optimistic manipulation; authoritative consequence.**

The interface may be physically responsive before the network answers, but facts remain truthful.

## What must be tortured

- reorder adjacent cards repeatedly;
- drag from one end of a full hand to the other;
- cancel repeatedly;
- play a middle card and observe gap closure;
- receive new cards without destroying order;
- use one hand on phone;
- use mouse on desktop;
- simulate slow authority;
- force rejection;
- switch sound off;
- reduced motion;
- perform 50 interactions and judge fatigue.

## Cross-project transfer hypothesis

This concept may generalize beyond card games:

- user-owned spatial arrangement can be part of cognition;
- local manipulation state should often be decoupled from canonical domain ordering;
- continuous object identity improves causal understanding;
- responsive local manipulation can coexist with strict authoritative state;
- systems can teach constraints through behavior instead of instruction overlays.

Transfer only after evidence; do not copy card-specific geometry into unrelated projects.