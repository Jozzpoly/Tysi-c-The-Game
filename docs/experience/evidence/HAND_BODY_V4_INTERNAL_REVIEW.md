# Hand Body V4 — Internal Review

Status: **synthetic/browser PASS; perceptual FAIL-to-promote; proceed to V4.1**.

## Why V4 existed

Living Slice V3.1 defended scene causality strongly enough that further table-geometry iteration had diminishing value.

The next high-value Owner requirement was the direct hand/card relationship:

- card must remember where it was grabbed;
- private reordering should feel continuous rather than slot-like;
- touch occlusion must not force permanent indirect control;
- reorder/inspect/play-intent should remain capabilities of the same object rather than explicit modes.

## Pre-fixture Hand Body bench

Three policies were compared under a deliberately simplified 60×85 px card + thumb-occlusion model.

### B0 — fixed/recenter baseline

- mean pickup jump: `25.73 px`;
- maximum pickup jump: `40.61 px`;
- identity visibility looked good only because the system stole the original grab point.

**Decision: reject B0 as current hand mechanism.**

### B1 — exact grab

- pickup jump: `0 px`;
- mean modeled identity occlusion: `0.190`;
- worst contact: full identity-zone occlusion.

Exact grab protects motor ownership but does not solve every touch-visibility problem.

### B2 — exact grab + conditional visibility assist

- pickup jump: `0 px`;
- assistance engaged in only `2/9` sampled contacts;
- mean modeled identity occlusion: `0.046`;
- engaged-contact mean occlusion reduction: `0.649`;
- maximum visual lift in the model: `34 px`.

Decision: worth browser testing, **not certified as preferred feel**.

## V4 browser result

PASS on desktop and emulated-touch mobile.

Observed mechanical evidence:

- desktop pickup error ≈ `0.000002 px`;
- mobile occluded-contact pickup error ≈ `0.000016 px`;
- mobile clear-contact pickup error ≈ `0.000020 px`;
- mobile adaptive assist target: `32 px`;
- assisted modeled identity occlusion ≈ `0.098`;
- desktop local field had 3 responding neighbors;
- mobile reorder changed private topology without commit;
- legal play intent produced a reversible `would-commit` event in the isolated fixture;
- illegal play probe returned the still-owned card.

This is strong evidence that exact grab can replace the old fixed/recenter pickup without mechanical regressions.

## Perceptual artifact review

Screenshots reviewed:

- mobile ready;
- exact contact;
- adaptive assist;
- reorder mid-state;
- play-intent state;
- desktop exact-grab state.

### Finding 1 — exact contact is materially better

The card does not jump to a designer-chosen anchor on acquisition.

Promote exact-grab as the current internal baseline.

This does not yet certify the final rotation/weight law.

### Finding 2 — B2 improves visibility but lacks edge safety

At the right edge, an assisted card can become easier to read under the modeled finger while part of the card leaves the viewport.

The occlusion metric therefore improved while overall perceptual availability remained imperfect.

**V4.1 requirement:** when visibility assistance is already active, any additional edge correction must be the minimum necessary inward correction. It must not become a permanent offset cursor.

### Finding 3 — reorder remains too slot-like

The held card's full-size placeholder creates a card-sized hole in the hand.

Although neighboring cards respond continuously, the large vacancy visually dominates and makes the hand resemble a sortable list.

**V4.1 requirement:** use an elastic insertion seam / compressed provenance marker during private reorder rather than a full-card empty slot.

### Finding 4 — play-origin residue is not the same problem as reorder vacancy

During play intent, preserving some visible origin/provenance can help communicate reversibility and where the card returns.

Do not delete the origin trace simply because the reorder hole is bad.

V4.1 should distinguish:

- `reorder seam` — compact and continuously integrated;
- `play-origin residue` — slightly stronger but still insufficient to split the whole hand into two disconnected groups.

## V4.1 falsification targets

V4.1 should fail if:

- exact pickup error regresses;
- unoccluded touch receives unnecessary assist;
- assisted representation clips outside the viewport beyond a small tolerance;
- edge correction appears when assistance is inactive;
- reorder creates a card-sized vacant slot;
- the insertion seam becomes invisible/unreadable;
- play intent loses a readable reversible origin;
- local field response disappears;
- legal/illegal play-intent semantics blur.

## Current decision

**Promote internally:** exact grab-point ownership.

**Continue testing:** conditional visibility assistance.

**Reject:** full-card reorder vacancy.

**Next:** V4.1, not V5. Scene causality remains inherited from defended V3.1 and is not reopened by default.
