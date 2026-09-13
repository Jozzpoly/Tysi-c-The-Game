# Trajectory Signal and Filtering

## Status

Technical research guidance only. No filter or estimator is selected yet.

## Problem

Several promising Card Control-Law concepts depend on motion derivatives:

- velocity;
- acceleration;
- direction change;
- release velocity;
- possibly jerk/impulse-like events.

Raw derivatives from pointer positions are noisy and depend on event cadence. Naive smoothing can reduce noise but also add exactly the lag we are trying to avoid.

Therefore signal processing is part of interaction design, not an invisible implementation detail.

## 1. Preserve primary position separately from derived signals

The strongest current architectural prior is:

- **primary direct target position** should use the latest trustworthy input sample with minimal smoothing;
- **secondary material signals** may use filtered estimates of velocity/acceleration;
- the filter state must not silently move the direct target itself unless that transformation is the explicit research variable.

This preserves the ability to study `direct position + rotational/secondary mass` without contaminating it with hidden low-pass lag.

## 2. Coalesced samples should feed estimation

When the browser provides coalesced pointer samples, derivative estimation should use their timestamps and positions rather than pretending the outer `pointermove` cadence is the physical sampling cadence.

Possible internal pipeline:

`coalesced/raw samples -> trajectory history -> derivative estimator -> bounded material signal -> rAF material update`

The latest position sample can update the direct target independently.

## 3. Why naive two-sample derivatives are weak

Using:

`v = (x_now - x_prev) / dt`

and differentiating again for acceleration makes the material signal extremely sensitive to:

- touch sensor noise;
- event coalescing;
- uneven event intervals;
- small hand tremor;
- quantization;
- frame/event scheduling.

This can create rotation jitter that the user reads as nervous material rather than responsive mass.

## 4. Filtering tradeoff is itself perceptual

Interactive-filter literature such as the 1€ filter explicitly frames the core tradeoff:

- stronger smoothing reduces jitter;
- stronger smoothing adds lag;
- speed-adaptive filtering can preserve low-speed stability while reducing high-speed lag.

Important boundary:

This does not mean `use 1€ filter everywhere`.

Our direct-touch card path may already contain device/browser filtering, and primary position has unusually strong co-location requirements.

The donor lesson is the tradeoff model, not one algorithm.

## 5. Candidate estimator families for internal comparison

These should be evaluated on recorded trajectories before any user-facing manipulation experiment.

### S0 — short timestamped finite difference

Use the newest and one/more recent samples over a bounded time window.

Strength:
- simple;
- low computational cost;
- easy to understand.

Risk:
- noisy acceleration;
- sensitive to sample spacing/window choice.

### S1 — local weighted regression

Fit a simple local motion model over a short recent time window and evaluate velocity (and possibly acceleration) from that fit.

Strength:
- uses irregular timestamps naturally;
- can reduce random jitter without directly filtering primary position;
- explicit causal window.

Risk:
- larger window increases temporal smearing;
- more implementation complexity;
- acceleration estimate may still be fragile.

### S2 — speed-adaptive filter for derivative/material signal

Apply a 1€-like adaptive low-pass relationship to an already-derived velocity/orientation driver rather than to primary card position.

Strength:
- directly addresses slow jitter vs fast responsiveness;
- conceptually tunable.

Risk:
- still adds phase delay to material response;
- may turn quick direction change into mushy rotation;
- parameter units/ranges depend on signal definition.

### S3 — state estimator/predictor

A model estimates current/future motion state.

Current status:
- out of scope for the first instrument;
- potentially useful later for latency compensation;
- higher uncertainty/agency risk.

Do not jump here merely because browser predicted events exist.

## 6. Separate estimation from expression

Even a perfect velocity estimate should not map linearly and without bounds to visual angle/displacement.

The pipeline should distinguish:

- estimated physical/control signal;
- material response function;
- saturation/dead-zone/hysteresis if justified;
- rendered pose.

This makes it possible to diagnose whether jitter comes from measurement or an over-sensitive material mapping.

## 7. Slow-motion dead zone may be legitimate

Tiny estimated acceleration from sensor jitter or tremor may not deserve visible material response.

A small perceptual dead zone/hysteresis could keep a resting/slow card quiet.

Risk:

If the threshold is too strong, material suddenly `turns on`, producing a mode-like discontinuity.

Future research should prefer smooth onset or carefully test threshold visibility.

## 8. Saturation is mandatory for derivative-driven visual motion

Raw acceleration can spike dramatically on reversal or event irregularity.

Any acceleration-to-angle or acceleration-to-offset law needs a bounded maximum effect.

The bound should be expressed relative to perceptual/card geometry where possible, for example:

- maximum readable card angle;
- maximum divergence as a fraction of card width/height;

rather than an arbitrary uncontextualized pixel value.

Exact bounds remain future research variables.

## 9. Release velocity needs its own estimate

If future material allows follow-through or throw-like behavior, release velocity should not automatically equal the last two-sample derivative.

A robust short-window release estimate can reduce accidental extreme impulses caused by the last noisy touch sample.

Release estimation must remain causally recent enough that the card does not continue in a direction the user stopped moving before lift-up.

## 10. Measurement should use recorded trajectories first

Before an INTERNAL interaction fixture, estimator candidates can be exercised offline on synthetic and recorded trajectories such as:

- stationary jitter;
- slow straight trace;
- sinusoidal sweep;
- rapid reversal;
- sharp corner;
- accelerating flick;
- stop-and-hold;
- irregular sample cadence;
- dropped sample/long gap.

The goal is not to simulate human feel. It is to reject estimators that are obviously noisy, laggy or unstable before they contaminate interaction testing.

## 11. Parameter strategy

Do not tune one estimator to one perfect trace.

Identify regimes:

- under-filtered/noisy;
- responsive/stable;
- over-filtered/laggy.

Then choose a conservative internal range rather than claiming an optimal parameter.

## 12. Frame-rate and event-rate independence

Estimator state should be updated from sample timestamps.

Material simulation/rendering should consume the latest estimator state using its own time basis.

This avoids treating `number of pointer events per frame` as a material property.

## 13. Prediction boundary

Prediction is qualitatively different from filtering.

Filtering estimates recent/current state from past data.

Prediction invents a probable future state.

If future latency-compensation research uses predicted events or a custom predictor:

- predictive pose must never become gameplay authority;
- prediction error/correction must remain visually dignified;
- instrumentation must preserve unpredicted ground truth;
- the user should not lose agency during sudden reversal because prediction `wins` over actual input.

This belongs to a later donor study: latency compensation vs uncertainty/intent fidelity.

## 14. Cross-project transfer

This separation is highly relevant outside cards.

### Jozz Vehicle

Builder gizmos may use direct primary manipulation while velocity/acceleration signals add contextual material/constraint feedback.

### Multi World

Held-object physics and throwing require robust release velocity without injecting lag into the held-object target.

### JES

World-edit brushes can remain tightly attached to input while filtered secondary signals control pressure/deformation/feedback visualization.

## Current research prior

For first control-law work:

1. keep primary grab-point target as direct as the browser/device allows;
2. estimate trajectory derivatives separately from timestamped samples;
3. start with the simplest estimator that survives offline stability tests;
4. use derivative signals only for bounded secondary material response;
5. treat any primary-position filtering/decoupling as an explicit candidate (P2/P3), never an accidental implementation detail.

This structure lets us know where perceived lag actually comes from.
