# Living Slice V3 — Internal Review

Status: **mechanical/browser PASS; source-establish mechanism promoted internally; integrated experience not Owner-ready**.

## Why V3 existed

V2 exposed two distinct failures in opponent-source presentation:

1. the source ghost was literally invisible because it inherited inline `opacity: 0` from the hidden destination card;
2. after the opacity bug was fixed, the card technically began at the actor but moved immediately enough that the evidence probe first observed it hundreds of pixels away from the source.

V3 therefore introduced an explicit perceptual sentence:

`source establish -> flight -> arrival`

rather than relying on a trajectory whose mathematical start happened to coincide with the actor.

## Internal version sequence

### V3 initial

FAIL.

`establish not owned by source 13.84px`

The threshold remained `< 12px`; it was not loosened to obtain green CI.

Root cause: source position was inferred from destination-card dimensions while the ghost itself was rendered under scale.

### V3.1

The ghost is appended, its actual rendered rect is measured, and its rendered center is aligned to the source center before the establish beat.

Result: **PASS**.

Measured source/flight evidence:

| Body | Origin error | Origin -> target | Mid -> target |
| --- | ---: | ---: | ---: |
| Desktop 1440×900 | ~0.000008 px | 463.60 px | 4.39 px |
| Mobile 390×844 | ~0.016 px | 328.38 px | 31.55 px |

The same full browser run also retained:

- local reorder without accidental commit;
- illegal play probe returning the owned card;
- authority reject restoring the card without state corruption;
- accepted play removing the card;
- trick collection;
- captured value `40 -> 65`;
- persistent match score remaining `340`;
- next initiative returning to the local hand locus;
- desktop and emulated-touch mobile execution.

## Artifact review

Eight screenshots were reviewed:

- desktop ready;
- desktop source-establish;
- desktop source-mid;
- desktop settled;
- mobile equivalents of the same four states.

### Demonstrated improvement

The opponent source is now perceptually available before transfer.

The card appears at the actor/source region first, then traverses toward the shared action space. This is materially stronger evidence of agency than the prior implementation where only the final state/trace proved that an opponent had acted.

**Internal decision:** preserve/promote the `establish -> transfer -> arrival` principle for public actor actions where source identity matters.

This does not fix a universal duration. The beat must remain repetition-tested and may be shorter or encoded through another sensory channel later.

### Remaining desktop weakness

Geometry C is stronger than the earlier header-like topology, but the 1440×900 composition still contains too much perceptually inactive space.

The actor/action relationship is now legible; the whole scene is not yet convincingly inhabited.

Do not create Geometry D merely to fill space. The next research question should move to a different high-value axis unless later integration proves desktop topology still blocks comprehension.

### Remaining mobile weakness

The compact mobile geography makes actor -> action relation stronger, but the source-establish card sits close to actor/header information and still reads as an early research composition rather than resolved product staging.

Do not solve this with labels, glow or more chrome before the hand/body relationship is stronger.

### Settled-state weakness

Captured-value and next-initiative residue are semantically better than V1, but the fixture still reads as a clean research instrument rather than a living product.

That is acceptable for current evidence. It is not an Owner-ready quality bar.

## Promotion / rejection decision

### Promote internally

- actor actions need a perceptually available source when source identity matters;
- `source establish -> transfer -> arrival` is a credible causal primitive;
- semantic actor anchors plus platform-specific geometry are viable;
- a browser test should validate perceivable geometry, not merely event completion.

### Do not promote yet

- exact timings;
- exact source-card scale;
- current visual styling;
- Geometry C as final desktop layout;
- current captured-value styling;
- current whole Living Slice as a product candidate.

## Next tactic

**Change axis rather than continue table-geometry microiteration.**

The next Living Slice version should focus on the Owner's highest-value original requirement: the local hand/card relationship under a real input body.

Primary V4 questions:

- can touch contact preserve visible card identity under finger occlusion?
- does a card remain physically owned from contact through reorder/play-intent transition?
- can local neighboring cards create continuous workspace response without destroying landmarks?
- can reorder, inspect and play intent remain distinguishable without explicit modes?
- can desktop express the same semantic capabilities through its own pointer body rather than copying touch?

V4 should inherit the now-defended scene causality instead of reopening it by default.
