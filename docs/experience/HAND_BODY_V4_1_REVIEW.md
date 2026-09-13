# Hand Body V4.1 — promotion review

Status: **primitive promotion / fixture not product-ready**

## Why V4.1 existed

V4 passed its mechanical/browser gate but failed agent-side perceptual review in two material ways:

1. touch visibility assistance could reveal the card identity while pushing the rendered card beyond a viewport edge;
2. reorder used a full-card placeholder that read like a sortable-list slot and split the hand too aggressively.

V4.1 was intentionally bounded to those two failures. It did not tune palette, motion character, card art, scene layout or production polish.

## Evidence

V4.1 browser torture passed on desktop and 390x844 mobile emulation while the frozen V4 and V3.1 gates continued to pass.

Measured V4.1 mobile results:

- right-edge pickup error: effectively zero;
- right edge assistance: `assistX = -12px`, `assistY = -32px`;
- assisted right edge settled near `382.72px` in a `390px` viewport;
- left-edge pickup error: effectively zero;
- left edge assistance: `assistX = +12px`;
- assisted left edge settled near `7.28px`;
- clear contact retained zero assistance;
- reorder seam width was about `0.378` of the held card width;
- play-origin residue was about `0.449` of the held card width.

The browser gate also retained:

- exact grab-point continuity;
- desktop no-touch-assist behavior;
- local neighbor field response;
- reorder without accidental commit;
- legal play-intent relation;
- reversible illegal probe.

## Perceptual review

Full-resolution artifacts were inspected after the automated PASS.

### Promoted primitives

- exact grab point is the baseline ownership model;
- touch visibility help is conditional, not permanent;
- edge safety may add the minimum horizontal correction only after visibility assistance is already active;
- clear contacts remain direct and unshifted;
- private reorder uses a compressed insertion seam rather than a full empty card slot;
- play intent may preserve a slightly stronger origin residue because provenance/reversibility has semantic value there.

### Not promoted as final product behavior

- exact assist distances (`32px`, `12px`) are research outcomes, not product constants;
- the simplified finger/occlusion model is not human anatomy evidence;
- current card visuals and debug contact indicators are research instrumentation;
- current motion timing and hand field magnitude are not final feel certification;
- V4.1 is not an integrated game experience.

## Decision

Do **not** produce V4.2 merely to continue local polishing. The two demonstrated V4 failures are materially resolved and further uncertainty has moved to integration.

Next candidate: **Living Slice V5**, combining the promoted V3.1 scene-causality primitives with the promoted V4.1 Hand Body primitives. V5 must have its own integration gate. Separate subsystem PASSes do not imply integrated PASS.
