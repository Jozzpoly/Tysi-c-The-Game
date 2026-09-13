# Experience Lab

This directory is a deliberately non-authoritative presentation laboratory for **Tysiąc The Game**.

It exists because speculative experience work should be cheap, repeatable and easy to reject. A visual/motion experiment should not need to mutate the production `GameTable` or pay the full match-runtime integration cost before the Owner can decide whether it has value.

## Ground rules

- Lab fixtures do **not** implement or redefine Tysiąc rules.
- Core state, legal commands and typed `GameEvent[]` remain gameplay authority.
- A lab may use fixed representative data while exploring feel, but promotion to runtime must use real `SeatProjection` + viewer-safe `GameEvent[]` contracts.
- Owner experience evidence can reject a lab even if its code is technically correct.
- Static screenshots are insufficient evidence for motion/feedback ideas.
- Haptics are progressive enhancement only.
- Reduced-motion alternatives are part of the experiment, not post-polish.

## Fixture A — repeated trick loop

`trick-loop-torture-lab.html`

Research question:

> How should the most frequent consequential loop feel when a human card completes a trick, the winner becomes legible, cards are collected, trick points land, and the winner receives the next lead?

The canonical outcome is intentionally fixed across all variants:

- player commits A♥ as the third card;
- player wins the trick;
- trick is worth 34 points;
- visible score changes 340 -> 374;
- player leads the next trick.

Only the presentation language changes.

### F1 Crisp Direct

Fast, low ceremony, hard ownership snaps. Tests how little animation is required before the loop becomes satisfying and legible.

### F2 Physical Elastic

More card weight, follow-through, spring and collection. Tests tactile pleasure and direct-manipulation character without assuming that a physical-table metaphor should own the whole product.

### F3 Graphic Pulse

More explicitly digital. Tests directional energy, contrast and number transfer with less simulated materiality.

The Owner does not need to choose one full variant. Useful evidence can be granular: e.g. "F1 commit + F2 collection + F3 score transfer".

Controls:

- tap `A♥` or `PLAY LOOP` to run the fixture;
- switch F1/F2/F3 between runs;
- cycle 1x / 2x / 0.5x;
- optionally enable synthetic sound cues;
- switch to reduced-motion presentation.

## Fixture B — mobile card input

`card-input-torture-lab.html`

Research question:

> What should "I play this card" physically mean under a thumb before and after server authority accepts the command?

The same legal A♥ play is exercised under three interaction contracts:

### M1 Tap Commit

One tap expresses intent immediately. Local press/lift feedback is reversible; the card becomes committed only after simulated authority acceptance.

Tests maximum speed against accidental-action risk.

### M2 Lift / Confirm

First tap selects and raises the card. A separate confirmation commits it.

Tests safety and inspectability against repeated-input fatigue.

### M3 Drag / Throw

The card follows the pointer/thumb. Releasing in the trick zone commits intent; releasing below cancels.

Tests physicality and spatial causality against occlusion, motor precision and slower repeated play.

`REJECT ONCE` deliberately simulates an authority rejection. The selected/dragged card must return rather than make a fake committed move and then rewind game state.

The likely final product can be a hybrid; the fixture exists to expose useful primitives, not force one entire interaction scheme.

## Evidence status

The standalone HTML fixtures have been syntax-checked and structurally inspected. Container Chromium could not provide reliable live capture in the research environment, so interactive feel is **not proven** until exercised in a real browser/Owner loop.

Do not promote a variant based on a static render.

## Promotion path

A useful primitive should eventually be reimplemented over the real presentation seam:

`before SeatProjection + viewer-visible GameEvent[] + after SeatProjection -> presentation choreography`

Promotion must preserve hidden-information boundaries, reconnect snap-to-authority behavior, mobile/desktop quality and the full Foundation gate.
