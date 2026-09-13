# Living Slice V5 — integration review

Status: **integration primitives promoted / integrated fixture not product-ready**

## Purpose

V5 tested whether two independently defended research lines can coexist in one interaction state machine:

- V3.1 scene causality: opponent source establish -> flight -> arrival, authority, trick resolution, captured-value consequence and next initiative;
- V4.1 Hand Body: exact grab, conditional touch visibility assistance, edge safety, compact reorder seam and stronger play-origin residue.

V5 intentionally avoided two overlapping pointer systems. Hand manipulation, play intent, authority pending/reject/accept, trick resolution and source replay live in one fixture state machine.

## Automated evidence

The V5 integrated browser torture passed on desktop 1440x900 and mobile 390x844 while all previously defended gates continued to pass.

### Desktop

- source origin distance: effectively zero;
- source-to-target initial distance: ~463.60px;
- material mid-flight progress: target distance ~44.59px;
- exact pickup error: effectively zero;
- touch assistance: none;
- reorder seam ratio: ~0.349 card width;
- play-origin residue ratio: ~0.501 card width;
- trick captured value: 65;
- persistent match score: 340;
- next initiative: `Prowadzisz`.

### Mobile

- source origin distance: ~0.016px;
- source-to-target initial distance: ~328.38px;
- material mid-flight progress: target distance ~42.59px;
- exact pickup error: effectively zero;
- right-edge touch correction: ~-10.38px;
- vertical visibility assist: -32px;
- rendered card remains within the 390px viewport;
- reorder seam ratio: ~0.346 card width;
- play-origin residue ratio: ~0.495 card width;
- trick captured value: 65;
- persistent match score: 340;
- next initiative: `Prowadzisz`.

The integrated gate also demonstrated:

- input is presentation-locked during opponent source replay;
- source establish/flight/arrival ordering survives integration;
- exact grab still survives after scene playback;
- private reorder does not become commit;
- illegal relation remains reversible and authority-free;
- authority rejection crosses `hand -> legal intent -> pending -> reject -> restored hand` without corrupting truth;
- authority acceptance crosses `hand -> intent -> accept -> trick -> collect -> captured value -> initiative`;
- ordinary trick points do not mutate persistent match score.

## Agent-side perceptual review

Full-resolution desktop and mobile artifacts were reviewed after the automated PASS.

### Promoted integration findings

- Hand Body and scene causality no longer read as mechanically incompatible subsystems.
- A card can remain materially owned under pointer/thumb, become a play relation, cross an authority boundary and resolve into public consequence without losing causal continuity.
- Compact reorder seam remains legible in the integrated scene.
- Edge-safe touch assistance remains local rather than becoming a global cursor-offset model.
- The settled state preserves the two important truths: `+25 -> 65` belongs to the hand/capture domain, while match score remains 340; next initiative is visible.

### Material experience failures still present

1. **Authority boundary is under-materialized.**
   `play intent -> pending` is currently expressed mainly through opacity and explanatory text. It is semantically correct but feels closer to a disabled/awaiting UI state than to a card action being handed from player agency to game authority.

2. **Consequence has insufficient spatial memory.**
   Once a trick is collected, the center becomes visually empty. The captured-value pulse and `Prowadzisz` are correct, but the scene does not retain enough short-lived causal residue to make the completed action feel materially consequential.

3. **Desktop composition remains under-occupied.**
   The current geometry solved actor/source causality but still leaves large inactive regions. This is no longer a card-geometry bug; it is a scene dramaturgy / attention / composition problem.

4. **The experience is still text-assisted.**
   `Puść, aby zagrać kartę`, `Ruch oczekuje na potwierdzenie...` and the settled sentence help explain what the visual system should increasingly communicate through object, space and persistent state.

5. **Dynamic range is weak.**
   Ready, intent, pending and consequence are distinguishable, but the transition lacks a strong quiet -> commit -> impact -> consequence -> settle rhythm. It is readable before it is satisfying.

## Decision

Do not produce V5.1 as another Hand Body or geometry tuning pass.

The integration question is sufficiently answered: defended V3.1 and V4.1 primitives can coexist.

Change research axis to **V6 Experience Character / Action Sentence**.

V6 should preserve the V5 interaction contract while explicitly researching:

`intent -> commit ownership transfer -> authority response -> impact -> consequence propagation -> short-lived spatial memory -> quiet`

Priority is not more spectacle. Priority is stronger causal materiality and dynamic range with less dependence on explanatory text.

Desktop and mobile remain equal targets, but their spatial composition may differ while sharing the same semantic sentence.
