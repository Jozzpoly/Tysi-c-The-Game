# Execution state — live truth

Date: 2026-09-16
Status: **Run 05 recovery. Account-owned stable origin + automated public friend flow + elapsed-time no-redeploy recheck PASS; only the real-human Owner/friend gate remains open.**

## Strategic intent

Tysiąc is not an infrastructure exercise. The target is a high-quality browser card-table product for desktop and mobile that can be trusted enough to use naturally with real people.

The project must preserve three distinct truth tracks:

- **game truth** — correct rules, legality, scoring and bot behaviour;
- **experience truth** — card/table physicality, visual hierarchy, motion, feedback, UI/UX and overall feel;
- **Operations / external truth** — what exact build is live, whether the share link really works, whether the origin persists, and whether a real second human can use it.

The Owner is the primary authority for experience truth, not the exact-rules oracle and not a substitute for operational evidence. Broad visual polishing should be driven by Owner testing rather than blind screenshot iteration.

## Current authority order

1. this file for compact live state;
2. `docs/INCIDENT_2026-09-15_FRIEND_LINK.md` for the friend-link recovery history and evidence failure;
3. `docs/DEPLOYMENT.md` for deployment/evidence contracts;
4. `AGENTS.md` for claim discipline;
5. `docs/RUN05_PHYSICAL_TABLE_V2.md` for the integrated presentation direction.

Historical Run01–Run04 material remains useful donor/history only where it does not conflict with current live truth.

## Current product target

- 3-player auction Tysiąc first;
- solo = human + 2 bots;
- duo = 2 humans + bot;
- trio = 3 humans;
- private room by link/code without mandatory accounts;
- desktop and mobile are equal product targets;
- reconnect/background lifecycle is normal product behaviour;
- presentation may evolve aggressively after real Owner evidence while core authority/privacy boundaries remain protected.

## P0 — friend-link recovery

**Friend-link incident OPEN / P0 BLOCKER**

The original readiness claim remains invalidated: the old temporary Cloudflare preview never proved durable friend readiness. Recovery has now crossed the stable-public automation boundary **and** the elapsed-time persistence boundary. P0 remains open only because the required real-human Owner+friend session has not yet been demonstrated.

### Frozen external candidate

The product candidate remains immutable:

- ref: `friend-candidate/run05-2026-09-15`;
- SHA: `52450baa04f22646474bf4676f70b2df5ba6812f`;
- Foundation #672: PASS on that exact SHA.

Later presentation, harness, docs and operations work on `main` does not move the product candidate. Current `main` is presentation-wise ahead of the frozen stable candidate; do not mistake the stable friend-gate build for the latest UX state.

### Stable public deployment — PASS

Stable Multiplayer Deploy #6 (`35002263980`) completed successfully from validation-harness SHA `deb668081717effee5965a8e3423e051aed0d1c2` while deploying the unchanged frozen product SHA `52450baa04f22646474bf4676f70b2df5ba6812f`.

Canonical account-owned origin:

`https://tysiac-the-game.jozzpoly.workers.dev`

Demonstrated in that run:

- Cloudflare account token preflight: PASS / active account token;
- complete Foundation + deployment-contract gate on the exact frozen product SHA: PASS;
- authenticated normal Wrangler deployment: PASS;
- owned-account deployment registration: PASS;
- canonical non-versioned workers.dev root: PASS;
- public provenance reports exact frozen product SHA and `deployClass: stable`: PASS;
- public multiplayer join/sync/reconnect: PASS;
- exact real in-game copied friend invite over HTTPS: PASS;
- clean second-browser join: PASS;
- distinct/disjoint private human hands: PASS;
- legal shared human action synchronization: PASS;
- friend reconnect through the same room-only copied URL with private credential restored locally: PASS;
- second provenance/multiplayer/copied-invite pass after a 60-second wait without another deployment: PASS.

The successful Cloudflare deployment version was `757f437f-f3fd-4f01-8570-d4185193047b`.

### Elapsed-time stable-origin recheck — PASS

`Stable Origin Recheck (NO REDEPLOY)` run #1 (`35098811180`) completed successfully on 2026-09-16 from current-main validation-harness SHA `473137700d80a2d584f8ec82bbe8ad207ba0f269`.

It did **not** deploy a replacement. Against the existing canonical origin it demonstrated:

- exact served product SHA remained `52450baa04f22646474bf4676f70b2df5ba6812f`;
- `deployClass: stable` remained correct;
- public provenance smoke: PASS;
- public multiplayer join/sync/reconnect: PASS;
- exact copied friend invite over HTTPS: PASS;
- distinct private hands: PASS;
- synchronized legal action: PASS;
- friend reconnect and restored revision: PASS.

The evidence point was recorded at approximately `2026-09-16T12:57:27Z`, many hours after the stable deployment and without redeployment.

**Evidence boundary:** stable mechanism, canonical origin, exact-build provenance, public multiplayer, copied-invite composition, short-window repeatability and meaningful elapsed-time persistence are now defended by automation. None of this substitutes for a real second human using the product naturally.

### Local exact-invite evidence — closed at this layer

PR #43 / Foundation #718 remains useful supporting evidence for the exact copied-invite session contract on loopback, but it is no longer the strongest external evidence. Stable run #6 and no-redeploy recheck #1 exercised that contract publicly over HTTPS against the account-owned origin.

Further local rehearsal is not active P0 work unless a concrete new gap appears.

## Remaining mandatory external evidence

Already PASS:

1. permanent account-owned Cloudflare credentials;
2. exact frozen candidate identity;
3. authenticated account-owned stable deployment;
4. canonical `tysiac-the-game.jozzpoly.workers.dev` origin;
5. exact public product SHA + stable deploy-class provenance;
6. public runtime/multiplayer smoke;
7. exact in-game copied invite carrying join/private-state/action/reconnect over HTTPS;
8. short-window no-redeploy repeatability after 60 seconds;
9. meaningful elapsed-time `Stable Origin Recheck (NO REDEPLOY)` against the same canonical origin and frozen product SHA.

Still open:

10. Owner + real friend perform create → copy → open → join → shared action → reconnect in real use;
11. that real-human success closes this P0 milestone while the automated evidence above remains preserved.

Automation cannot complete the real-human gate by itself. Keep the frozen stable candidate untouched until that session is complete; replacing it first would change the thing being tested.

## Protected foundation

Current evidence is strong for:

- deterministic pure TypeScript core;
- canonical legality/reducer path;
- scoped domain events;
- per-seat projection/privacy;
- Worker + SQLite Durable Object `MatchRoom`;
- hibernating WebSockets and reconnect;
- private opaque seat capabilities separate from room code;
- seat-token hashing/persistence boundaries;
- public snapshots excluding private credentials and hidden cards;
- same-origin browser WebSocket upgrade enforcement;
- shared command model for humans and bots;
- Run05 tactile/living-hand, spatial handoff, deal/talon/exchange/marriage/trick presentation mechanics.

This is protected evidence, not a ban on later redesign. After Owner testing, presentation and even broader implementation choices may change aggressively when evidence justifies it.

## Work discipline while P0 remains open

The infrastructure recovery is no longer the main workstream. Do not manufacture further deployment machinery now that the intended stable path and its elapsed-time persistence work.

Allowed / high-value now:

- preserve the frozen stable candidate until the real-human gate is complete;
- run the bounded real Owner+friend session through the actual UI;
- use current-main browser evidence to catch objective pre-test breakage, but leave qualitative presentation judgement for Owner evidence;
- use a temporary current-main preview for the latest visual/UX Owner pass when explicitly launched with its required public-preview/Cloudflare confirmations;
- record concrete product/experience defects exposed by real use;
- maintain evidence/documentation when live truth materially changes.

Default defer:

- more local deployment harness layers without an identified missing claim;
- hosting migration;
- speculative infrastructure work;
- blind broad CSS redesign before Owner evidence.

## Preserved deferred debts — not current P0 work

- active CSS ownership is still distributed across visual-language, Run04 and Run05 layers; consolidate only from evidence rather than filename-driven cleanup;
- Durable Object rooms still have no explicit expiry/cleanup policy; acceptable for this bounded friend test, but must be resolved before broader/public usage;
- stale historical docs/branches remain lower value than the live product loop.

These debts are intentionally deferred, not forgotten.

## Owner test direction

The stable base URL is valid for the bounded real-human friend gate, but it intentionally serves the frozen candidate rather than the latest presentation work. The Owner does not need to validate exact Tysiąc rules or finish a match.

Primary experience evidence for the latest presentation build:

- physicality/materiality of cards and table;
- visual hierarchy and readability;
- animation/motion/pacing;
- feedback for dealing, bidding, playing, taking tricks, marriage and scoring;
- mouse/touch ergonomics and manipulation;
- onboarding and clarity without excessive explanatory text;
- overall professional feel.

For the real-human friend gate specifically: open the stable root, create a duo room, use the real `Kopiuj link dla znajomego`, let the friend open that exact URL in their own browser/device context, exchange at least one real legal action, and exercise refresh/reconnect.

## Immediate direction

1. keep product SHA `52450baa04f22646474bf4676f70b2df5ba6812f` frozen on `https://tysiac-the-game.jozzpoly.workers.dev` until the real-human friend gate completes;
2. perform the real-human Owner+friend session when convenient and capture only concrete failures/experience feedback;
3. do not spend more project attention proving persistence unless new evidence contradicts the successful no-redeploy recheck;
4. for latest visual/UX Owner testing, prefer the existing temporary-preview path from current `main` rather than replacing the frozen stable candidate;
5. after the human gate passes, close friend-link P0 and move decisively into broad Owner-led desktop/mobile experience iteration on the latest product state.

The deployment system has now done its job. The project direction returns to the actual game.
