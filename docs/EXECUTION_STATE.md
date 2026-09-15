# Execution state — live truth

Date: 2026-09-15
Status: **Run 05 recovery. Local exact-invite composition PASS; stable external origin + real friend test remain FAIL / P0.**

## Strategic intent

Tysiąc is not an infrastructure exercise. The target is a high-quality browser card-table product for desktop and mobile that can be trusted enough to use naturally with real people.

The project must preserve three distinct truth tracks:

- **game truth** — correct rules, legality, scoring and bot behaviour;
- **experience truth** — card/table physicality, visual hierarchy, motion, feedback, UI/UX and overall feel;
- **external/operations truth** — what exact build is live, whether the share link really works, whether the origin persists, and whether a real second human can use it.

The Owner is the primary authority for experience truth, not the exact-rules oracle and not a substitute for operational evidence. Broad visual polishing should be driven by Owner testing once the current external P0 is resolved, not by blind screenshot iteration.

## Current authority order

1. this file for compact live state;
2. `docs/INCIDENT_2026-09-15_FRIEND_LINK.md` for the open friend-link incident;
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

**Status: FAIL / BLOCKED**

The previous external-readiness claim remains invalidated. A temporary Cloudflare URL passing bounded smoke was not evidence of a durable friend origin.

### Frozen external candidate

The product candidate remains immutable:

- ref: `friend-candidate/run05-2026-09-15`;
- SHA: `52450baa04f22646474bf4676f70b2df5ba6812f`;
- Foundation #672: PASS on that exact SHA.

Later harness/docs/cleanup work on `main` does not silently move the product candidate.

### Local exact-invite evidence — now closed at this layer

PR #43 merged as `d5887e12e4981a55ce2182995ce106358cbf1fca` and Foundation #718 passed on `main`.

The current validation harness now carries the **same exact copied invite session** through:

- clean second-browser join;
- distinct private seat credentials;
- disjoint private hands;
- one legal human action;
- both clients advancing to the same newer revision;
- friend reopen/reconnect through the same room-only copied URL;
- restoration of the same private friend credential from local browser state;
- restored revision at least as new as the synchronized post-action revision.

Expected evidence fields are present: `friendJoined`, `privateHandsDisjoint`, `actionSynced`, `friendReconnected`, `restoredRevision`.

**Evidence boundary:** Foundation #718 exercised this composition on local loopback HTTP. It proves the harness/session contract. It does **not** prove Cloudflare deployment, HTTPS public behaviour, long-horizon availability, or real-human friend readiness.

Further local rehearsal is not the active P0 unless a concrete new gap is discovered.

### Stable deployment blocker

Latest real stable attempt:

- Stable Multiplayer Deploy run `34980093207`;
- request source `main` commit `29923513c39cb59bf9ba08945c3ca81e464bf440`;
- frozen candidate correctly resolved and checked out as `52450baa04f22646474bf4676f70b2df5ba6812f`;
- dependency installation succeeded;
- execution stopped before product validation/deploy because permanent credentials were absent.

Direct blocker:

- GitHub Actions secret `CLOUDFLARE_ACCOUNT_ID`: **missing**;
- GitHub Actions secret `CLOUDFLARE_API_TOKEN`: **missing**.

No account-owned stable origin therefore exists yet. Do not substitute temporary Cloudflare deployments or move the product to another hosting architecture merely to bypass this boundary.

The frozen candidate uses Cloudflare Worker + SQLite Durable Object `MatchRoom`; switching platforms before the friend test would be a product/authority migration, not a deployment shortcut.

## Mandatory external evidence ladder

1. configure the two permanent Cloudflare GitHub Actions secrets outside chat/source/logs;
2. retrigger the exact frozen candidate;
3. authenticated account-owned normal deployment succeeds;
4. canonical `tysiac-the-game.<account>.workers.dev` root origin is established;
5. exact public product SHA + deploy-class provenance passes;
6. public runtime/multiplayer smoke passes;
7. the exact in-game copied invite passes the same-session join/private-state/action/reconnect contract over HTTPS;
8. the **same origin and same SHA** later pass `Stable Origin Recheck (NO REDEPLOY)`;
9. Owner + real friend perform create → copy → open → join → shared action → reconnect in real use;
10. only real-human success closes this P0 milestone.

Automation cannot complete step 9 by itself.

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

## Work discipline while P0 is blocked

Do **not** manufacture momentum by polishing unrelated areas.

Allowed before external access is restored:

- fix a concrete defect that threatens the frozen deployment/test path;
- maintain evidence/documentation when live truth materially changes;
- bounded cleanup only when it removes a demonstrated risk without changing the frozen candidate.

Default pause:

- broad CSS consolidation;
- blind visual redesign;
- speculative new features;
- architecture migration;
- additional local deployment harness layers with no identified missing claim.

The reason is product strategy: the next high-value information should come from real external use and then from Owner visual/UI/UX judgement.

## Preserved deferred debts — not current P0 work

Keep these visible without letting them manufacture scope before the external gate is closed:

- active CSS ownership is still distributed across visual-language, Run04 and Run05 layers; obvious dead selectors were already removed, so future consolidation is an ownership/refactor problem and should follow fresh Owner/browser evidence rather than filename-driven deletion;
- Durable Object rooms still have no explicit expiry/cleanup policy and can persist indefinitely; this is acceptable for the bounded friend test but must be resolved before broader/public usage, with room-invite longevity treated as product behaviour rather than an implementation afterthought;
- stale historical docs/PR branches must not compete with current authority, but archival cleanup is lower value than restoring the real product loop.

These debts are intentionally deferred, not forgotten.

## After P0 closes

The project immediately shifts back from recovery infrastructure to product development.

Primary next evidence source becomes a broad Owner test on desktop and mobile, focused on:

- physicality/materiality of cards and table;
- visual hierarchy and readability;
- animation/motion/pacing;
- feedback for dealing, bidding, playing, taking tricks, marriage and scoring;
- mouse/touch ergonomics and manipulation;
- onboarding and clarity without excessive explanatory text;
- overall professional feel.

The Owner is not expected to play through the entire game or validate exact Tysiąc rules. The purpose is to expose experience problems automation cannot judge. Larger visual/product changes should then be prioritized from that evidence.

## Immediate direction

1. keep `52450baa04f22646474bf4676f70b2df5ba6812f` frozen;
2. obtain/configure the one-time account-owned Cloudflare credentials;
3. rerun Stable Multiplayer Deploy on that exact SHA and classify each resulting claim separately;
4. if public gates pass, preserve the same origin/SHA for elapsed-time no-redeploy recheck;
5. only then ask the Owner to spend attention on the real friend session;
6. after that real-human gate, move decisively into broad Owner-led experience testing rather than extending recovery infrastructure.

The recovery is successful only when it returns the project to trustworthy product iteration. The deployment system is a means to that end, not the project direction.
