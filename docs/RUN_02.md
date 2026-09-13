# Run 02 — dual-track game truth + experience hardening

Date: 2026-09-13

Foundation Run 01 is complete. Run 02 no longer assumes the Owner can validate Tysiąc gameplay correctness by playing it.

The run now asks two independent questions in parallel:

> **Game truth:** is this Tysiąc implementation correct, credible and authentic enough for knowledgeable play?

> **Experience truth:** is the table clear, responsive, satisfying and progressively professional on desktop and mobile?

Neither question should be falsely answered by evidence from the other.

## Track A — game truth

Primary evidence:

- fresh rule/source research;
- reference implementation probes where feasible;
- explicit reversible project pins when evidence remains incomplete;
- executable scenarios, invariants and deterministic simulations;
- knowledgeable Tysiąc-player/domain sessions for strategy/authenticity questions.

Current high-risk rule queue remains:

- exact PlayOK strict trick obligations (follow / beat / trump / overtrump);
- post-musik final-contract ceiling / marriage capacity;
- transfer visibility;
- marriage scoring when a meld is declared but no trick is captured;
- Kurnik musik/last-trick wording in 3P;
- remaining bomb/four-nines reference-sensitive details.

Bot legality and termination are already automated. Bot **strategic credibility/fun** remains unproven until stronger domain or knowledgeable-player evidence exists.

Owner feedback must not be used to certify this track.

## Track B — experience truth

The Owner is the primary oracle for:

- visual hierarchy and composition;
- desktop/mobile ergonomics;
- mouse/touch feel;
- whether actions appear responsive and intentional;
- whether state changes and consequences are perceivable;
- perceived pacing, motion and feedback;
- onboarding/comprehension;
- visual direction and professional quality.

Owner confusion is useful evidence. Classify it before acting:

- **domain confusion** — player does not know the underlying Tysiąc rule;
- **communication failure** — product fails to show what happened or what can be done;
- **interaction failure** — intended input is hard/unreliable;
- **presentation judgement** — hierarchy, timing, style or feel is weak.

Only the first category belongs primarily to game truth; the others can be acted on directly in the experience track.

## Current experience baseline

Already defended before this reframe:

- one responsive `GameTable` for desktop/mobile;
- causal scoring summary;
- visible authoritative transition pacing;
- compact `Tysiąc w 60 sekund` help and contextual decision explanations;
- guarded 1440×1000 desktop and 390×844 mobile browser coverage.

First direct Owner-derived experience slice:

**Mobile touch hardening — PASS**

Owner play exposed unreliable/unintuitive taps and accidental browser text selection.

PR #11 converted that into an executable presentation contract without changing game rules or authority:

- coarse-pointer interactions do not select/call out text;
- mobile controls are at least finger-sized;
- dense auction/contract controls remain directly accessible;
- the 10-card exchange hand uses a 5×2 composition instead of tiny overlapping targets;
- all ten exchange-card centers are directly hit-testable;
- real CDP touch drives auction -> exchange -> contract -> card play.

Foundation #200 on head `85cd128…` passed the entire gate, including `mobile touch browser smoke: PASS` with minimum card geometry `52 × 76.47 px`, minimum same-row center spacing `60 px`, and `exchangeCentersHitCorrectCard=true`.

Squash merged to `main` as `5cf323b673ae4f8c2586645c3501ddd2bc1c58c4`.

One parallel rehearsal (#199) failed once because Chrome reported a 1425 px desktop inner viewport instead of the harness's exact 1440 px expectation. The same head passed the complete long rehearsal in #200. Treat the strict viewport equality as possible harness/flakiness debt if it recurs; do not currently reinterpret it as a product regression.

## Evidence rules

For rule claims use:

- **documented** — source states the behavior;
- **reference-observed** — behavior observed in a target/reference implementation;
- **pinned** — deliberate reversible project choice where variants/evidence differ;
- **executable** — our tests prove what our implementation does.

For experience claims separate:

- **mechanically defended** — measurable browser/device property is tested;
- **Owner-observed** — direct qualitative Owner judgement/recording;
- **target-player observed** — feedback from intended/knowledgeable users;
- **unproven** — plausible design intent without real judgement/evidence yet.

Do not use automation to pretend subjective quality is proven.

## Working priorities

1. Continue closing/bounding material game-truth uncertainties without waiting for Owner gameplay judgement.
2. Run repeated Owner experience passes on desktop and real phone; translate loose reactions into small bounded slices.
3. Keep desktop and mobile equal-quality targets while allowing different compositions.
4. Build professional-ready presentation seams now: clear state/feedback boundaries, reversible visual composition, animation/audio/haptic hooks where evidence justifies them.
5. Do **not** postpone all visual/experience improvement until rule research is complete.
6. Also do not lock expensive final art or deeply rule-specific presentation while the underlying semantic truth remains uncertain.
7. Move knowledgeable human players into the loop specifically for Tysiąc authenticity, strategy and rule feel.
8. Exercise real-human duo/trio once infrastructure is quiet enough that the session produces product/game evidence rather than setup noise.
9. Test actual phone suspension/backgrounding and weak-network transitions before claiming operational resilience.

## Run 02 maturity direction

Run 02 becomes mature when both tracks are independently credible enough:

### Game-truth gate

- high-risk target-profile ambiguities are resolved or explicitly bounded;
- candidate rule-sensitive paths are executable;
- knowledgeable-player/reference evidence has tested the material gameplay assumptions that Owner feedback cannot validate;
- bot quality is at least adequate for intended sessions, based on stronger evidence than self-play legality metrics.

### Experience-truth gate

- Owner can repeatedly use desktop and phone without material input/feedback/composition friction;
- major state transitions and consequences are visible and understandable as product behavior;
- presentation architecture demonstrably supports continued professional visual/motion/audio refinement;
- visual direction is sufficiently coherent to justify higher-cost polish.

### Integration gate

- at least one real-human duo/trio session runs through the real product path without infrastructure dominating feedback;
- findings can be cleanly classified as game-truth, experience-truth or integration/lifecycle issues.

Do not require one track to reach finality before the other can advance.