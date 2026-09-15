# Execution state — live truth

Date: 2026-09-15
Status: **Run 05 recovery. Friend-link incident OPEN / P0 BLOCKER.**

Current authority order:

1. this file for compact live state;
2. `docs/INCIDENT_2026-09-15_FRIEND_LINK.md` for the open P0 incident;
3. `docs/DEPLOYMENT.md` for public/stable/friend-link evidence;
4. `AGENTS.md` for agent/claim discipline;
5. `docs/RUN05_PHYSICAL_TABLE_V2.md` for the active presentation direction now integrated into `main`.

Earlier Run 01/Run 02/Run03/Run04 evidence remains useful history/donor material but is not current execution authority where it conflicts with this state.

## Current product target

Build a high-quality browser Tysiąc table for desktop and mobile that can be used naturally with real people.

- 3-player auction Tysiąc first;
- solo = human + 2 bots;
- duo = 2 humans + bot;
- trio = 3 humans;
- private room by link/code without mandatory accounts;
- desktop and mobile are equal product targets;
- refresh/reconnect/background lifecycle is normal;
- presentation may evolve aggressively while game/authority boundaries remain protected.

## P0 — friend-link recovery

**Status: FAIL / BLOCKED**

The previous external-readiness claim is invalidated. A temporary Cloudflare URL that passed bounded public smoke later disappeared, exactly as the temporary deployment lifecycle allowed.

The Owner had explicitly required a stable, safe, repeatedly verified link before proceeding. The project already contained evidence that the temporary route was unclaimed and expected to expire. Continuing past that contradiction was a verification/authority failure.

### Frozen external candidate

The current external-test candidate is immutable:

- ref: `friend-candidate/run05-2026-09-15`
- SHA: `52450baa04f22646474bf4676f70b2df5ba6812f`
- Foundation #672: PASS on that exact SHA.

Do not silently move the candidate because later cleanup work continues on `main`. A replacement requires a new exact SHA and fresh evidence.

### Stable deployment attempts

The repository-native stable deployment path now supports an immutable candidate file plus a separate retry request marker. Retrying does not alter candidate identity.

Two real stable-deployment attempts have exercised the account-owned path far enough to establish the same concrete blocker.

Latest attempt:

- Stable Multiplayer Deploy run `34980093207`;
- request source: `main` commit `29923513c39cb59bf9ba08945c3ca81e464bf440`;
- frozen candidate resolved to `52450baa04f22646474bf4676f70b2df5ba6812f`;
- exact candidate checkout succeeded;
- checkout identity verification succeeded;
- dependency installation succeeded;
- permanent credential gate failed;
- Foundation-on-candidate, Cloudflare upload, deployment registration and every public-runtime step were therefore skipped.

Current external blocker is direct evidence, not inference:

- GitHub Actions secret `CLOUDFLARE_ACCOUNT_ID`: **missing**;
- GitHub Actions secret `CLOUDFLARE_API_TOKEN`: **missing**.

Therefore no account-owned stable origin exists yet and no claim about stable public behavior has been established.

Do not substitute another temporary deployment for these missing credentials.

Current mandatory ladder:

1. frozen candidate Foundation remains green;
2. configure the two permanent Cloudflare GitHub Actions secrets without exposing them in chat/source/logs;
3. retrigger the same frozen candidate through the repo-native retry marker;
4. account-owned authenticated normal deployment must succeed;
5. canonical workers.dev origin + exact public SHA/class provenance must pass;
6. public runtime/multiplayer smoke must pass;
7. actual in-game copied invite must pass with a clean second browser;
8. same origin and SHA must pass a later `Stable Origin Recheck (NO REDEPLOY)`;
9. Owner and a real friend must complete real-human create/copy/open/join/action/reconnect use;
10. only the Owner's report of successful real-human use closes this P0 milestone.

Automation cannot complete the real-human gate by itself.

## Current recovery safeguards

- `Stable Multiplayer Deploy` — account-owned normal deploy only;
- manual or auditable declarative stable deployment request, both resolving one exact immutable candidate SHA;
- separate stable retry marker that cannot change candidate identity;
- `Temporary Preview (EXPIRES — DO NOT SHARE)` — bounded diagnostics only;
- exact public build provenance (`buildSha`, `deployClass`);
- `public-provenance-smoke.mjs`;
- `public-share-link-smoke.mjs`, which clicks the real copy-link UI and uses the exact emitted URL in a clean second browser;
- canonical friend origin restricted to the root `tysiac-the-game.<account>.workers.dev` target for the current recovery;
- `Stable Origin Recheck (NO REDEPLOY)` for later elapsed-time evidence;
- machine-gated stable retry and no-redeploy contracts in Foundation;
- cancellation of superseded Foundation PR runs;
- frozen external candidate ref separate from continuing technical-debt work.

These are safeguards, not proof that the stable deployment or real-human test has already succeeded.

## Game / authority foundation

Historical and current evidence remains strong for:

- deterministic pure TypeScript core;
- canonical legality/reducer path;
- per-seat projection/privacy boundary;
- scoped domain events;
- Worker + SQLite Durable Object `MatchRoom`;
- hibernating WebSockets and reconnect;
- private opaque seat capabilities separate from shareable room code;
- seat tokens generated from 32 random bytes and persisted only as hashes;
- public room snapshots excluding private seat credentials and hidden cards;
- same-origin browser WebSocket upgrade enforcement;
- same domain command model for humans and bots.

Current heads must keep those gates green. Historical PASS does not automatically certify new commits.

## Evidence tracks

### Game truth

Rules, legality, scoring, strategic bot credibility and authentic Tysiąc gameplay use source/reference evidence, explicit reversible pins, executable scenarios/invariants/simulations and knowledgeable-player feedback.

The Owner is not the exact-rules oracle.

### Experience truth

The Owner is primary judge for visual hierarchy/composition, mouse/touch feel, card materiality/feedback, perceived motion/pacing, desktop/mobile ergonomics, onboarding and professional presentation quality.

Automation may protect measurable mechanics. It cannot certify taste or fun.

### Operations / external truth

Questions such as `temporary or stable?`, `what SHA is live?`, `does the exact copied invite work?`, `did the same origin survive without redeploy?`, and `did a real friend actually join?` require direct operational evidence.

A PASS in game truth or experience mechanics cannot substitute for an operations/external FAIL.

## Run 05 presentation state

Run 05 is no longer an isolated experimental integration branch.

The old PR #23 is closed as historical/superseded integration history. A clean continuation was reconstructed from recovered `main`, mechanically validated, and merged through PR #26. The active Run 05 presentation implementation now lives on `main`.

Current Run 05 presentation includes:

- larger tactile/living hand;
- permissive manipulation separated from authoritative commit;
- spatial play target/handoff;
- material deal/talon/exchange/marriage flows;
- living trick/capture presentation;
- distinct desktop composition;
- browser/geometry coverage for tactile, handoff, mobile touch and material-transfer mechanics.

Mechanical browser evidence is substantial, but broad Owner visual approval remains pending. Blind visual redesign remains paused while the P0 external trust boundary is unresolved.

### CSS debt cleanup completed so far

The recovery campaign has already removed several concrete patch-on-patch or unreachable layers without moving the frozen candidate:

- folded the old tactile corrective patch back into the actual tactile owner;
- removed obsolete `run04-mobile-hand.css` direct-card layout;
- moved the persistent 44px mobile interaction minimum into `touch.css` with sufficient specificity to survive later visual compression;
- removed unreachable old direct-child hand rules from `touch.css`;
- removed unreachable direct-card blocks from `visual-language-02.css`;
- repeatedly defended mobile 10-card exchange geometry, touch hit centres, permissive/living hand and authoritative handoff through full Foundation runs.

The easy dead-selector phase is now largely exhausted. Current active cascade contains real overlapping ownership rather than obviously unreachable rules. In particular:

- `run04-tactile-hand.css` remains a live mechanics owner for hand slots, drag ghost, commit zone and 10-card interaction behavior;
- `run04-scene-compression.css` still affects live intermediate viewport composition;
- Run05 intentionally overrides those layers in bounded mobile/desktop presentation regions.

Do not continue deleting Run04 files merely because their names are historical. Further consolidation requires an explicit ownership design plus fresh browser/Owner evidence.

## Technical debt priority

### P0

- permanent Cloudflare account credentials are not yet configured in GitHub Actions;
- stable non-temporary friend origin therefore does not yet exist;
- public stable provenance/runtime/copied-invite evidence pending;
- later no-redeploy evidence pending;
- real-human friend test pending.

### P1

- active CSS ownership is still distributed across visual-language, Run04 and Run05 layers. Obvious dead selectors have been removed; remaining consolidation is architectural and must be bounded rather than treated as deletion cleanup;
- Durable Object rooms currently have no explicit expiry/cleanup policy and can remain in persistent storage indefinitely. This does not block the bounded friend test, but must be resolved before broader/public usage. Do not introduce room expiry into the frozen candidate without an explicit lifecycle contract because room-invite longevity is a product behavior;
- historical/donor PRs from Run02/Run03/Run04 should be closed as superseded while preserving their branches/history;
- keep stale historical docs from competing with current authority;
- keep deployment paths unambiguous and machine-gated.

## Claim discipline

Good:

- `Foundation frozen candidate: PASS`;
- `stable candidate identity checkout: PASS`;
- `permanent Cloudflare credentials: missing / blocker`;
- `account-owned non-temporary deploy: not yet performed`;
- `exact copied invite on stable origin: pending`;
- `same origin later recheck: pending`;
- `real-human friend test: pending`.

Bad:

- `everything verified`;
- `stable` because a temporary URL responds now;
- `friend-ready` because automation is green;
- `safe` without naming the security/privacy property actually checked;
- `deployed` when execution stopped before upload.

Contradictory evidence is an automatic blocker. A critical Owner requirement cannot be outvoted by unrelated green checks.

## Immediate direction

1. keep frozen candidate `52450baa04f22646474bf4676f70b2df5ba6812f` unchanged;
2. complete the one-time permanent Cloudflare account setup by configuring the two required GitHub Actions secrets outside chat;
3. retrigger the exact same frozen candidate through the stable retry marker and continue through canonical-origin/provenance/public/copied-invite gates;
4. perform later same-origin/same-SHA no-redeploy evidence;
5. complete the real Owner+friend multiplayer test;
6. meanwhile archive superseded donor PRs and continue only bounded technical-debt work that does not alter the frozen candidate;
7. treat further CSS consolidation as a real ownership/refactor problem, not dead-code deletion;
8. after external trust is restored, resume broad Owner-led visual iteration and controlled presentation consolidation.
