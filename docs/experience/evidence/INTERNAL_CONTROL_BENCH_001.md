# Internal Control Bench 001

Date: 2026-09-13

Status: **mechanical apparatus PASS / perceptual conclusions NOT AUTHORIZED**

## Scope

This evidence records the first successful self-check of the event-driven Card Embodiment control-law bench after rejecting earlier flawed apparatus versions.

It is not Owner evidence and it does not establish which control law feels better.

## Apparatus

Scripts:

- `scripts/experience-control-bench.mjs`
- `scripts/experience-control-bench-check.mjs`

Research command:

- `npm run research:experience-control`
- `npm run research:experience-control:check`

The bench separates:

- latent synthetic trajectory;
- input sampling cadence;
- continuous control-state evolution;
- render sampling cadence;
- analysis sampling cadence.

This corrects an earlier rejected scheduler that coupled input and simulation cadence and produced false refresh-rate evidence.

## Self-check result

`experience control bench check: PASS`

Representative `reversal` values with the current research defaults:

- P1 peak secondary rotation: ~6.67 degrees;
- P1 grab-point positional error: 0.0000 card widths;
- P2 peak bounded positional discrepancy: ~0.1137 card widths;
- P3 peak positional discrepancy: ~0.5119 card widths.

These are normalized mechanical observables, not product targets.

## What the checker currently protects

- report/version structure exists;
- all baseline trajectories remain finite;
- P0/P1 preserve positional grab-point fidelity in the stripped bench;
- P2 does not exceed the declared 0.12-card-width research bound;
- P1 generates a nontrivial but bounded angular response;
- render cadence variation does not materially alter control-law results;
- analysis cadence does not materially alter measured results beyond a small measurement tolerance;
- input-rate probes remain finite;
- parameter sweeps produce valid observables.

## What this PASS does NOT mean

It does not show that:

- P1 feels like mass;
- P2 feels like resistance rather than broken input;
- P3 feels bad;
- 0.12 card widths is acceptable to a human;
- 6.67 degrees is visually/materially appropriate;
- current derivative filtering is perceptually optimal;
- any candidate survives real touch occlusion;
- any candidate works in a real hand;
- any candidate is accessible, enjoyable or donor-quality.

## Current mechanical interpretation

### P1

The current formulation demonstrates that strong secondary angular response can coexist with exact primary grab-point positioning in the stripped 2D model.

This makes P1 mechanically credible enough to survive into later internal comparison.

### P2

The current formulation demonstrates a bounded pseudo-haptic positional discrepancy that remains far smaller than the representative P3 trailing error while still being measurable.

Whether that discrepancy is perceived as material support or loss of ownership remains human-only evidence.

### P3

The spring family remains stable after switching from naive explicit integration to an exact critically damped continuous-time step.

It also exposes a substantial control cost under aggressive trajectories. That cost is real mechanical evidence but not sufficient reason to reject P3: perceptual material benefit may or may not justify it.

## Input cadence finding

Render-rate invariance is now strong.

Input sampling cadence remains a meaningful variable, especially for P3 because a trailing body follows sampled target updates. That is a property to characterize rather than normalize away.

Future browser instrumentation should record actual Pointer Event/coalesced sample cadence so a perceptual comparison can distinguish controller character from platform sampling behavior.

## Evidence classification

This is **INTERNAL / pre-E1 mechanical evidence** for the apparatus and candidate feasibility.

It is stronger than intuition but weaker than an isolated perceptual phenomenon demonstration.

No donor concept or production primitive is promoted by this run.

## Next internal use

The bench may now be used to:

1. reject unstable or obviously intrusive parameter regions;
2. characterize input-cadence sensitivity;
3. choose a deliberately small set of mechanically distinct candidates;
4. carry those candidates into a minimal hand-context Lane II;
5. only then decide whether Owner perception is the remaining evidence needed.
