# Final performance campaign

Date: 2026-09-17
Status: **Last substantial engineering campaign before final stable promotion / friend test.**

## Why this campaign exists

Owner's real desktop × mobile × bot test of Preview #16 judged the game close to acceptable, but mobile still feels laggy and could be more responsive.

This campaign is intentionally bounded. Its job is **not** to redesign Tysiąc, remove visual character, or chase synthetic benchmark scores. It should make the existing game feel materially better on the real phone while preserving the defended gameplay/multiplayer/presentation foundation.

## Evidence boundary from Owner recordings

Owner supplied two recordings from the same real multiplayer session:

- desktop: ~176.7 s, 1918×906, constant 30 FPS video capture;
- mobile: ~174.4 s, 576×1280, variable-frame-rate capture.

The mobile file contains many large timestamp gaps, but the largest gaps are commonly paired with almost no visual change. Therefore recording-frame timing cannot be treated as browser rendering timing. It is supporting qualitative evidence only.

**Consequence:** first add runtime measurement on the actual phone; do not infer a GPU/React/network bottleneck from the MP4 container.

## Success condition

The campaign succeeds when all of the following are true:

1. the Owner can run one temporary preview on the actual phone and obtain a compact performance report;
2. measurement identifies whether remaining poor feel is dominated by frame jank, input latency, deliberate presentation cadence, or some combination;
3. at least the dominant measured bottleneck is materially improved without degrading core interaction/presentation quality;
4. full Foundation remains green, including desktop/mobile full-match and multiplayer/reconnect evidence;
5. Owner reports that mobile is sufficiently responsive for this temporary project to close.

No arbitrary 60 FPS requirement is imposed. The finish threshold is real interaction quality plus evidence that we removed obvious pathological stalls.

## Phase P0 — owner-visible runtime instrumentation

Instrumentation must be **off by default** and cheap when disabled.

Preferred activation: a deliberate debug query such as `?perf=1` or equivalent local-only control that does not alter room/session semantics.

Capture at minimum:

- `requestAnimationFrame` delta distribution: p50 / p95 / p99 / max;
- counts of frame gaps >32 ms, >50 ms, >100 ms;
- `PerformanceObserver` long tasks where available: count, total time, max duration;
- pointer/touch input → next animation frame latency: p50 / p95 / max;
- current scenario tag, at least: `idle`, `drag`, `exchange`, `deal`, `trick`, `remote-playback`;
- viewport/device pixel ratio and user agent summary sufficient for comparison;
- a copyable compact JSON/text report so the Owner only needs to play normally on the phone.

Do not transmit telemetry externally. Keep it in page memory / local UI unless a later explicit need appears.

### Owner measurement protocol

One short phone run should include:

1. idle table for several seconds;
2. pick up / reorder / return cards repeatedly;
3. drag legal cards toward and away from the table;
4. complete one exchange if available;
5. let bots/opponent playback execute several ordinary plays and one trick collection;
6. include at least one deal or next-hand transition;
7. copy the resulting report.

Desktop can provide a control report using the same build.

## Phase P1 — highest-probability hot path: drag/input work

Current code has duplicate per-pointer work.

`TactileHand.moveDrag` currently, for each pointer move:

- resolves the play-zone element;
- calls `getBoundingClientRect()` on the trick zone;
- computes magnetic capture/offset;
- may compute insertion preview;
- performs React state update for drag.

At the same time `ownerMagnetismBridge` has a global capture-phase `pointermove` listener which again:

- queries `.app-shell` and the floating card;
- queries exchange/table targets;
- reads one or more `getBoundingClientRect()` values;
- writes CSS custom properties / datasets.

This is a prime mobile candidate for layout pressure and excessive update frequency.

### First bounded experiment

A/B against the measured baseline:

- coalesce pointer processing to at most one update per animation frame;
- cache drag-stable geometry at drag start where valid;
- invalidate cached geometry only on explicit reasons such as resize/orientation/layout transition;
- avoid multiple independent DOM target searches for the same pointer sample;
- preserve current interaction authority and exact magnetic capture semantics.

Do **not** reintroduce the abandoned PR #54 reversible-takeover feature while optimizing this path.

## Phase P2 — global observers / DOM synchronization

`seatPresentationBridge` installs a subtree-wide `MutationObserver` on `document.body` and synchronizes seat presentation on relevant class/data mutations. Synchronization performs multiple DOM queries and may perform geometry reads when a fresh opponent card is animated.

Measure observer invocation count/cost during:

- ordinary remote play;
- trick lifecycle;
- hand drag;
- exchange/deal transitions.

If materially hot:

- rAF-coalesce repeated observer callbacks;
- narrow observed subtree/attributes where safe;
- skip synchronization when viewer/seat state is unchanged;
- preserve viewer-relative topology and causal opponent play origin.

## Phase P3 — layout/compositor candidates

Only after P0–P2 evidence.

Candidates to A/B:

- floating-card movement via compositor-friendly transforms rather than repeated `left/top` layout positioning;
- CSS selector/layout costs in the layered Run04/Run05 styles, including expensive dynamic selectors if profiling shows them hot;
- repeated geometry reads after DOM writes (forced synchronous layout);
- large painted regions / shadows / filters only if paint evidence points there;
- avoid running hidden/non-visible material layers longer than necessary.

Visual quality has veto: do not remove tactile motion, causal card continuity, or useful feedback merely because a synthetic test becomes cheaper.

## Phase P4 — cadence only if measurement still shows perceived waiting

PR #55 already reduced ordinary remote cadence to roughly 285 ms observed spacing while preserving full-match behavior. Do not blindly shorten it again.

If runtime frames are healthy but Owner still reports sluggishness, separate deliberate wait from rendering delay and only then A/B specific cadence stages.

The 620 ms full deal envelope is currently intentional because the 21-card material deal needs roughly that duration. Preserve it unless the deal animation itself is redesigned coherently.

## Verification after every performance tranche

For each change:

1. record exact SHA;
2. compare the same phone scenario/report against baseline;
3. run the focused browser smoke for the changed interaction;
4. run full Foundation before merge;
5. reject optimizations that merely move cost while worsening input feel or presentation;
6. keep desktop/mobile behavior aligned.

No optimization is considered real without either measured improvement or clear Owner feel improvement on the exact tested build.

## Release sequence after campaign

1. merge only defended performance improvements;
2. Foundation FULL GREEN on final `main`;
3. launch one exact-SHA temporary Owner preview;
4. Owner performs short phone-first feel test;
5. if acceptable, select exact SHA as final stable candidate;
6. deploy to `https://tysiac-the-game.jozzpoly.workers.dev` through the existing stable workflow;
7. perform one real Owner+friend create → copied invite → join → shared action → reconnect session;
8. record final state / known limitations and freeze the project.

## Explicit anti-goals

Do not use this campaign to:

- add new gameplay features;
- reopen reversible magnetic takeover unless it becomes release-blocking;
- redesign rules/bots;
- rewrite the entire CSS architecture;
- migrate hosting;
- optimize based only on MP4 frame timestamps;
- chase perfect benchmark numbers after the Owner finish threshold is met.

The campaign exists to remove the last material obstacle to **finishing Tysiąc**.
