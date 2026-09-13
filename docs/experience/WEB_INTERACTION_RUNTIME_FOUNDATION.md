# Web Interaction Runtime Foundation

## Purpose

High-quality interaction research can be invalidated by a weak browser input/render pipeline.

This document defines technical constraints for future INTERNAL fixtures and later production interaction work. It is not a product architecture commitment yet.

The central rule is:

**Do not tune interaction character against accidental browser event cadence, frame rate or main-thread jank.**

## 1. Separate three layers

Future direct-manipulation code should conceptually separate:

### Input sampling

Collect pointer/touch/mouse information and preserve timestamps/trajectory detail.

### Control/material simulation

Transform the input trajectory according to the candidate control law using time-based integration rather than frame-count assumptions.

### Rendering

Present the latest material pose on the display cadence.

These layers can run on the same JavaScript thread initially, but their responsibilities must remain distinct.

## 2. Pointer Events as semantic input foundation

Use Pointer Events as the primary abstraction where platform support is adequate.

They provide a shared event model for mouse, touch and pen while preserving `pointerType` and pointer identity.

Do not erase input-body differences merely because the API is unified.

Shared event plumbing does not imply shared gesture mechanics.

## 3. Event coalescing is real

Browsers may coalesce multiple physical pointer samples into fewer `pointermove` events for performance/frame alignment.

For control-law research, this matters because velocity/acceleration inferred only from dispatched `pointermove` positions can depend on browser behavior.

`PointerEvent.getCoalescedEvents()` can expose the intermediate samples provided by the user agent.

Future research fixtures should therefore be capable of:

- consuming coalesced samples when available;
- falling back cleanly when unavailable/empty;
- retaining each sample timestamp/position for trajectory estimation;
- rendering only at the appropriate display cadence rather than rendering once per sample.

## 4. `pointerrawupdate` is optional, not baseline dependency

`pointerrawupdate` can be dispatched as quickly as the browser can produce pointer updates and can reduce visible tracking lag for applications that genuinely need high-frequency handling.

But it also increases event pressure.

A heavy `pointerrawupdate` handler can make responsiveness worse.

Therefore:

- no layout reads/writes in the raw listener;
- no expensive React state churn per raw sample;
- no logging serialization per sample on the hot path;
- treat support as progressive enhancement;
- measure whether it improves the actual target device/browser before enabling it broadly.

The research must remain valid with ordinary `pointermove + coalesced samples`.

## 5. Predicted events are not truth

`getPredictedEvents()` can provide estimated future pointer positions and may reduce perceived latency in suitable rendering contexts.

However prediction can be wrong, especially during reversal or sudden intent change.

For this project:

- never use predicted events as authoritative input;
- never feed predicted trajectory into gameplay command semantics;
- never include predicted samples in ground-truth instrumentation;
- if tested later, use them only as a visual/control-latency experiment;
- prediction must collapse/correct without implying a gameplay rollback.

This is a direct application of uncertainty/authority fidelity.

## 6. Render on `requestAnimationFrame`

Manipulation rendering should normally synchronize with `requestAnimationFrame`.

Use the callback timestamp or another monotonic time source for dynamics.

Do not implement movement as `x += constantPerFrame`.

High-refresh displays are common enough that frame-count-based dynamics would change feel across 60/90/120/144 Hz devices.

## 7. Time integration must be frame-rate robust

Candidate control laws must define behavior in time units/continuous terms and remain stable under variable `dt`.

Internal rehearsal should deliberately test at:

- common 60 Hz conditions;
- high-refresh conditions where available/simulatable;
- uneven frame pacing;
- occasional long-frame spikes.

A spring that feels heavy only at one refresh rate is not a material law; it is a bug.

## 8. Main-thread work is part of material quality

Input delay has three broad components in web interaction:

- waiting before the event handler runs;
- event processing work;
- presentation delay until the resulting frame appears.

Any unrelated long task can therefore masquerade as poor control feel.

Future fixture/product rules:

- keep hot-path pointer handlers extremely small;
- avoid expensive synchronous layout during manipulation;
- avoid unnecessary component-tree rerenders per pointer sample;
- separate debug instrumentation from hot-path logging/serialization;
- profile low-end/mobile devices, not only desktop development hardware;
- stress interaction while other application work is occurring.

## 9. Input state vs rendered state

Maintain distinct concepts:

- latest physical/control samples;
- current target pose implied by control;
- current material pose;
- last rendered pose.

This makes it possible to diagnose whether perceived lag comes from:

- browser/input delivery;
- control law;
- rendering/frame pacing;
- unrelated main-thread work.

Without this separation, `the card feels slow` is technically ambiguous.

## 10. Pointer capture and cancellation

Future drag/manipulation should use an explicit pointer-ownership strategy so moving outside the initial card region does not silently transfer interaction to another element.

The design must also handle:

- pointer cancellation;
- lost capture;
- browser/system gesture interruption;
- tab/background transitions;
- multi-pointer interference where relevant.

These are not exceptional bugs. They are part of failure dignity.

## 11. Browser gesture negotiation

Touch interaction must intentionally negotiate native browser behaviors.

`touch-action` and surrounding layout/scroll behavior should be designed so that:

- card manipulation does not accidentally trigger page panning/zooming;
- normal page/app navigation remains possible where intended;
- platform edge gestures are respected or clearly avoided;
- disabling browser gestures is scoped to the true manipulation surface, not globally by habit.

## 12. Velocity and acceleration estimation

Raw finite differences between two dispatched pointer events are too noisy and cadence-dependent for material dynamics.

Future control-law research should consider:

- multiple recent timestamped coalesced samples;
- a small causal smoothing/filtering window;
- robust velocity estimate;
- acceleration derived from filtered velocity rather than raw position differences;
- strict latency budget for any filter.

Filtering itself changes the control loop and must therefore be treated as part of the candidate law, not an invisible implementation detail.

## 13. Do not confuse event rate with display rate

Input devices may sample more frequently than the display can refresh.

The system can use extra samples to estimate trajectory better without attempting DOM/render work for each one.

Conceptually:

`many input samples -> one updated control/material state -> one rendered frame`

where appropriate.

## 14. Instrumentation requirements

A future INTERNAL fixture should timestamp at least:

- received pointer sample(s);
- processed target-pose update;
- material-state update;
- render-loop frame timestamp;
- commit/release transition;
- authority response in later stages.

Optional internal metrics:

- event interval distribution;
- coalesced sample count;
- dropped/long frames;
- card-target divergence;
- settle duration;
- reversal error;
- main-thread long tasks.

Instrumentation must be buffered/lightweight during active manipulation and serialized/displayed after the gesture where possible.

## 15. INP is useful but insufficient

Interaction to Next Paint is valuable as a broad product responsiveness metric for discrete interactions.

It is not by itself a measurement of continuous manipulation quality.

A drag can feel poor because of trajectory/frame pacing while still producing acceptable high-level interaction metrics.

Therefore use web-vitals/INP as a system-health signal, not as the Card Embodiment research metric.

## 16. Prediction as future research axis

Browser-provided predicted events are interesting because they expose a deep conflict:

- prediction can visually tighten control;
- wrong prediction can visibly violate intent/trajectory truth.

This may later become a bounded donor study in its own right: **latency compensation vs uncertainty fidelity**.

It is explicitly out of scope for the first Card Control-Law fixture.

## 17. Cross-project donor value

This runtime separation is likely useful across browser projects:

### Jozz Vehicle

Gizmos/component editing need high-rate input separated from expensive rebuild/simulation work.

### JES

World-edit manipulation should remain locally responsive while heavier validation/generation trails behind.

### Multi World

Local manipulation/control and remote authority must not be collapsed into one frame loop.

### Live NPC

Less pointer-centric, but the same principle applies to separating local continuous behavior, asynchronous cognition and rendered explanation.

## 18. Anti-overengineering rule

Do not build a custom game engine input stack merely because these APIs exist.

Start with the simplest architecture that:

- captures enough trajectory information;
- remains frame-rate robust;
- profiles cleanly;
- preserves semantic separation.

Escalate to raw/predicted input or lower-level rendering only when measured evidence justifies it.

## Current conclusion

The future Card Embodiment instrument must treat browser input/render timing as part of the experimental apparatus.

Otherwise we risk interpreting browser jank, coalescing or frame dependence as human preference about materiality.
