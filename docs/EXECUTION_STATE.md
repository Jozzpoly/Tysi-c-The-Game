# Execution state — live truth

Date: 2026-09-17
Status: **Finalization mode. Latest main is Owner-tested and close to acceptable; mobile performance/responsiveness is the remaining product-quality blocker before final stable promotion and the real friend session.**

## Current authority

1. this file — compact live project truth;
2. `docs/PERFORMANCE_CAMPAIGN.md` — bounded final performance campaign;
3. `docs/DEPLOYMENT.md` — deployment/evidence contract;
4. `docs/INCIDENT_2026-09-15_FRIEND_LINK.md` — historical friend-link recovery;
5. `AGENTS.md` — claim/evidence discipline;
6. `docs/RUN05_PHYSICAL_TABLE_V2.md` — presentation direction/history.

Historical Run01–Run04 material and old experiment branches are donor/history only unless explicitly reactivated.

## Truth tracks

Keep three different kinds of evidence separate:

1. **Game truth** — rules, legality, scoring and bot behavior.
2. **Experience truth** — visual, physical, motion, UI/UX and responsiveness quality.
3. **Operations / external truth** — the exact deployed build, copied-link behavior, multiplayer/privacy/reconnect behavior and real-world availability.

A PASS on one track does not silently promote another.

## Finalization target

The project is no longer in open-ended feature development. The temporary project is considered ready to close when:

- solo and duo + bot are usable on desktop and mobile;
- copied room invite, private hands, shared actions and reconnect work in real use;
- presentation is sufficiently clear and pleasant for casual play;
- mobile no longer feels materially laggy/under-responsive;
- one exact final SHA is promoted to the account-owned stable origin;
- Owner + real friend complete one bounded real session: create → copy link → join → shared action → reconnect;
- the final state/evidence is recorded and the project is frozen.

Non-blocking polish and speculative systems do not prevent closure.

## Current main / release candidate baseline

Current `main`:

`7c5d9d2b2e31d5e2ee5f8772e3d4664daac546ec`

This includes PR #55, `Release: tighten table cadence for final friend build`.

Evidence:

- PR #55 head `48228ea7f79b6195847b742cd96bbc243d5d15fe` — Foundation #799 FULL GREEN;
- post-merge main `7c5d9d2b...` — Foundation #800 FULL GREEN;
- ordinary remote playback spacing measured ~285.4–285.7 ms after the cadence pass, down from the prior ~480 ms class;
- full remote solo rehearsals desktop + mobile PASS;
- reconnect exercised in both full rehearsals;
- no open pull requests after #55 merge.

Cadence currently keeps the full physical deal duration at 620 ms because the 21-card deal animation still needs that envelope. Frequent table flow was shortened instead of blindly accelerating every transition.

## Final Owner Preview #16 — PASS at the automated boundary

Temporary Preview run:

- workflow run: `35229545651` / Preview #16;
- exact SHA: `7c5d9d2b2e31d5e2ee5f8772e3d4664daac546ec`;
- temporary URL used for Owner testing: `https://tysiac-the-game.similar-metal.workers.dev`;
- deploy class: `temporary`;
- complete Foundation before publishing: PASS;
- public provenance exact SHA: PASS;
- public desktop/mobile MatchRoom behavior: PASS;
- copied invite session: PASS;
- distinct/disjoint private hands: PASS;
- synchronized legal action: PASS;
- friend-browser reconnect in automation: PASS.

The temporary URL is bounded evidence only and may expire. It is not the final friend URL.

## Owner evidence — 2026-09-17

Owner tested real multiplayer using **desktop + mobile + bot** and recorded both perspectives.

Owner verdict:

> `w sumie jest już całkiem spoko`
>
> `najwiekszym problemem że na mobilce laguje, mohło by być też bardziej responsywnie`
>
> `ogolnie taki stan jest już bliski bycia okej i do zakonczenia tymczasowego projektu`

This changes project priority decisively:

- broad feature/presentation expansion: **STOP**;
- stabilization/documentation/cleanup: **NOW**;
- mobile performance + responsiveness campaign: **NEXT / primary engineering work**;
- final Owner confirmation: after performance candidate;
- stable promotion + real friend gate: only after that confirmation;
- project freeze: immediately after successful final friend gate and closeout evidence.

The Owner is not expected to validate exact Tysiąc rules. Automated game-truth evidence remains responsible for rules/legality/scoring regressions; Owner testing is primarily experience and real-use evidence.

## Magnetic takeover experiment — intentionally closed

PR #54 (`Run05: make magnetic card takeover visible and reversible`) was closed without merge after repeated executable failure in the table-takeover reversal contract.

The experiment produced useful harness fixes and diagnosis but was not allowed to block release. Current main therefore retains the already-qualified spatial/magnetic affordance behavior, not the stronger reversible visual takeover experiment.

Do not reopen this before project closure unless Owner evidence shows it is genuinely release-blocking.

## Stable origin / historical recovery candidate

Canonical account-owned origin remains:

`https://tysiac-the-game.jozzpoly.workers.dev`

It currently preserves the historical recovery candidate:

`52450baa04f22646474bf4676f70b2df5ba6812f`

That build remains valuable persistence/recovery evidence but is **not the final product candidate anymore**. Do not spend Owner/friend attention testing that old presentation build now.

The real-human friend gate is intentionally deferred until the post-performance final candidate is selected and deployed to the same stable origin. Stable deployment must still use exact immutable product SHA + current validation-harness evidence per `docs/DEPLOYMENT.md`.

### Friend-link incident OPEN / P0 BLOCKER

This incident status remains open **only because the required real-human Owner + friend evidence has not yet happened**. Automated recovery/persistence evidence is strong; this heading is retained as an explicit release safety contract, not as a claim that copied links are currently known broken.

The bounded real-human gate is deliberately deferred until after the final mobile-performance candidate is Owner-approved and promoted to the canonical stable origin. The final session must still demonstrate create → exact copied invite → friend join → at least one shared legal action → refresh/reconnect. Until that happens, automation cannot close the incident or the final release gate.

## Protected foundation

Strong current evidence exists for:

- deterministic pure TypeScript core;
- canonical legality/reducer path;
- scoped events and scoring tests;
- per-seat projection/privacy;
- Worker + SQLite Durable Object `MatchRoom`;
- hibernating WebSockets and reconnect;
- opaque private seat credentials separate from room code;
- same-origin WebSocket path;
- shared human/bot command model;
- exact copied-invite flow;
- desktop/mobile browser scenarios;
- physical deal/talon/exchange/marriage/trick presentation;
- viewer-relative opponent seat topology;
- causal opponent-card motion;
- tactile/permissive hand and authoritative handoff behavior.

Final performance work may change implementation details, but must not silently weaken these boundaries.

## Active blocker

### P0 experience blocker — mobile performance / responsiveness

Owner reports real mobile lag and insufficient responsiveness even after the cadence improvement.

Two Owner recordings exist from the same real multiplayer session:

- desktop recording: ~176.7 s, 1918×906, fixed 30 FPS capture;
- mobile recording: ~174.4 s, 576×1280, variable-frame-rate capture.

The mobile recording contains highly variable frame timestamps, but many of the largest timestamp gaps occur while the image is effectively static. Therefore **screen-recording timestamps are not valid browser-FPS proof**. They justify investigation but do not identify the runtime bottleneck.

The performance campaign must instrument the running game on the actual phone before making broad visual compromises.

## Deferred / non-blocking debts

These do not block temporary project closure unless new evidence promotes them:

- distributed CSS ownership across historical visual layers;
- many stale historical/experiment branches;
- explicit Durable Object room expiry/cleanup policy;
- Node action-version deprecation warnings;
- Wrangler minor update availability;
- stronger reversible magnetic takeover;
- additional presentation polish beyond Owner's finish threshold.

Branch cleanup should be conservative before freeze: delete only branches proven merged/obsolete; preserve historical branches when ancestry/value has not been checked.

## Immediate direction

1. finish this short stabilization/documentation pass;
2. execute `docs/PERFORMANCE_CAMPAIGN.md` as the last substantial engineering campaign;
3. publish one new temporary preview of the exact optimized candidate;
4. Owner performs a short desktop/mobile feel test, with mobile primary;
5. if Owner says the result is sufficiently good, select that exact SHA as the final candidate;
6. deploy it through `Stable Multiplayer Deploy` to the canonical account-owned origin;
7. Owner + real friend perform one bounded create → copied invite → join → shared action → refresh/reconnect session;
8. record final PASS/known limitations, freeze project, and stop development.

The governing principle now is **finishability**: fix measured blockers, preserve defended foundations, and refuse nonessential scope expansion.
