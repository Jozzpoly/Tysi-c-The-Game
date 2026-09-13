# Interaction clocks and cadence

Status: correction discovered during first private INTERNAL control-engine rehearsal.

## Why this exists

A first synthetic control-engine attempt accidentally coupled:

- trajectory sampling rate;
- controller update rate;
- render/evaluation rate.

That made a candidate appear cadence-sensitive when the experiment was also changing the sampled input stimulus.

This is an apparatus error, not useful evidence.

## Four distinct timelines

### 1. Intended / latent movement trajectory

For synthetic tests only, this is the known continuous reference motion.

A real human trajectory is not available continuously; only device/browser samples are observed.

### 2. Input sampling timeline

When the device/browser reports positions.

May include:

- ordinary pointer events;
- coalesced historical samples;
- raw-update events where available;
- irregular spacing;
- event bursts.

This timeline is part of the real interaction condition and can affect derivative estimation.

### 3. Controller evolution timeline

The internal dynamic state may need to evolve between input samples.

Examples:

- P3 spring continues moving toward the most recent known target;
- P1 angular state can decay/settle after acceleration input;
- P2 offset can recover toward zero.

Controller evolution must use elapsed time, not assume one update per input event or one update per rendered frame.

### 4. Render/evaluation timeline

When the current model state is displayed/measured.

This can differ from both input and controller cadence.

A 120 Hz screen must not change the physical/control law relative to 60 Hz merely because render frames are more frequent.

## Synthetic benchmark rule

When testing **controller numerical stability**, hold the underlying input samples constant and vary only controller/render evaluation cadence.

When testing **input-sampling robustness**, deliberately vary the input sample stream while keeping controller law and render conditions explicit.

These are different experiments.

## Recommended synthetic architecture

Generate a continuous reference path `p_ref(t)`.

Then create separate event schedules:

- input sample times;
- render times;
- optional controller sub-step times if required by implementation.

Merge them chronologically.

At each input event:

- sample `p_ref(t)`;
- update raw input history / derivative estimator;
- update the controller target/forcing signal.

Between input events:

- advance dynamic state analytically or with a stable time-based method.

At render events:

- read state only;
- do not alter the law merely because a frame occurred.

## Coalesced-event nuance

In a browser, coalesced events can arrive together with historical timestamps.

The implementation must decide whether they are used primarily for:

- trajectory/derivative reconstruction;
- controller force estimation;
- retrospective logging.

Do not naively `replay physics into the past` after the visual frame has already happened.

For live control, the latest known actual sample remains the current position evidence. Historical coalesced samples mainly improve trajectory/derivative estimation.

## Predicted-event nuance

Predicted events belong to a fifth conceptual timeline: **future estimate**.

They may eventually reduce perceived latency, but they are uncertain.

Rules:

- keep predicted samples explicitly tagged;
- never merge them indistinguishably with actual samples;
- never use them as gameplay authority;
- correction when prediction differs from actual input must be perceptually coherent;
- prediction research is out of scope for the first P0–P3 bench.

## Metrics consequence

Every recorded trial should identify:

- input cadence distribution;
- render cadence distribution;
- dropped/long-frame intervals;
- whether coalesced samples were available;
- controller evaluation strategy.

Otherwise a later difference may be falsely attributed to material parameters.

## Current implementation consequence

The first private local engine is **not yet commit-worthy** as an experiment because its initial probe runner tied input and control cadence.

Useful findings from that rehearsal remain:

- P0 exact grab-point law behaves as expected;
- P1 can preserve zero grab-point error while producing bounded rotation;
- P2 can hit normalized divergence bands cleanly;
- a naive explicit spring integrator can become unstable at high responsiveness;
- a continuous-time stable spring step fixes numerical blow-up;
- the benchmark scheduler now needs redesign before code is promoted to the research branch.

This is a successful internal failure: it prevented false cadence evidence from entering the project record as a result.
