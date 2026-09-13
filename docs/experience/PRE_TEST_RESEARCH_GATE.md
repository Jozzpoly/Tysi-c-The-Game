# Pre-Test Research Gate

## Purpose

Owner testing is expensive attention and high-value evidence. Do not spend it on immature experiments merely because a prototype is easy to build.

The default in Run 03 is therefore **research before Owner testing**.

A test should be presented only when it can answer a question that prior analysis cannot answer reliably.

## What must happen before the next Owner-facing interaction prototype

### 1. Phenomenon decomposition

The target phenomenon must be decomposed below feature language.

For `card feel`, examples include:

- acquisition / pickup threshold;
- visual offset from the finger;
- grab-point preservation;
- translation directness;
- rotational response;
- acceleration response;
- damping;
- neighbor displacement;
- insertion pressure;
- cancellation trajectory;
- release interpretation;
- object continuity after authority update;
- sensory synchrony.

A prototype that simply offers named presets such as `heavy` or `magnetic` is too early unless those presets are themselves the research question.

### 2. Competing hypotheses

There should be at least two credible explanations or design models when the question admits alternatives.

Example:

Perceived weight might come primarily from pointer lag, from angular lag around the grab point, from neighbor resistance, from release behavior, or from sound. Those hypotheses should not be collapsed into one bundle before they are understood.

### 3. Failure prediction

Before testing, state what would make each hypothesis fail.

A design that cannot be falsified is a taste demo, not a research instrument.

### 4. Transfer question

State what knowledge would remain useful if the Tysiac-specific implementation were discarded.

If the answer is `none`, the experiment may still be worthwhile for the product, but it is not donor research.

### 5. Truth-boundary review

Verify that the prototype does not blur:

- reversible local manipulation;
- inferred intent;
- command commit;
- authoritative acceptance;
- canonical consequence.

### 6. Interaction-body review

Before mobile tests, reason explicitly about:

- finger occlusion;
- grip/thumb reach;
- touch target vs visual geometry;
- cancellation escape path;
- device-edge behavior.

Before desktop tests, reason explicitly about:

- hover;
- precise acquisition;
- pointer speed;
- spatial use of width;
- keyboard/mouse combinations if relevant.

### 7. Ordinary-use torture plan

The experiment must define how it will be stressed beyond first impression:

- repeated action;
- rapid reversal;
- slow deliberate manipulation;
- messy imprecise manipulation;
- cancel;
- invalid attempt;
- latency;
- interruption;
- reconnect/correction where relevant.

### 8. Evidence capture plan

Decide before testing what evidence matters:

- Owner raw language;
- screen recording;
- interaction sequence;
- ignored controls;
- repeated behaviors;
- mis-taps;
- hesitation;
- retries;
- abandonment;
- spontaneous play with the system beyond the requested task.

Do not infer unseen finger position from screen capture without acknowledging the limitation.

## Test readiness classes

### NOT READY

The idea is still being decomposed, or the experiment mainly demonstrates implementation enthusiasm.

### INTERNAL READY

The experiment is useful for technical/design self-audit but does not yet justify Owner attention.

### OWNER READY

The experiment isolates meaningful questions, has plausible alternatives, can fail, and Owner perception/behavior is the missing evidence.

### PROMOTION READY

Owner evidence plus torture evidence support integration into authentic runtime for a bounded trial.

## Stop condition

The research phase should not become endless avoidance of contact with reality.

Owner testing becomes mandatory when:

- analysis is cycling without producing new distinctions;
- competing hypotheses remain plausible and can only be separated by perception/use;
- the remaining uncertainty is specifically tactile, attentional, temporal or aesthetic;
- an isolated prototype can answer that uncertainty without forcing product commitment.

The gate exists to prevent **premature tests**, not testing itself.

## Current Run 03 status

The next Card Embodiment test is **NOT READY**.

Required work before it becomes Owner-ready:

1. deeper decomposition of perceived object physicality;
2. finger/card geometry and occlusion model;
3. directness-vs-mass analysis;
4. grab-point and pivot model;
5. hand-neighbor coupling model;
6. cancel/release semantics;
7. latency/authority behavior;
8. candidate sensory mappings;
9. cross-project transfer analysis;
10. adversarial review of the whole model.

No new Owner-facing card prototype should be produced merely to show progress before these questions have materially advanced.
