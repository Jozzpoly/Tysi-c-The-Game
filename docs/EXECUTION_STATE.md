# Execution state — live truth

Date: 2026-09-15
Status: **Run 05 recovery. Friend-link incident OPEN / P0 BLOCKER.**

Current authority order:

1. this file for compact live state;
2. `docs/INCIDENT_2026-09-15_FRIEND_LINK.md` for the open P0 incident;
3. `docs/DEPLOYMENT.md` for public/stable/friend-link evidence;
4. `AGENTS.md` for agent/claim discipline;
5. active Run 05 presentation documentation on the experimental branch.

Earlier Run 01/Run 02 evidence remains useful history but is not current execution authority where it conflicts with this state.

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

Current mandatory ladder:

1. Foundation on the recovery infrastructure and active candidate head must be green;
2. `Stable Multiplayer Deploy` must publish through the account-owned authenticated non-temporary Cloudflare path;
3. public provenance must report exact expected SHA and deploy class `stable`;
4. public runtime/multiplayer smoke must pass;
5. actual in-game copied invite must pass with a clean second browser;
6. same origin and SHA must pass a later `Stable Origin Recheck (NO REDEPLOY)`;
7. Owner and a real friend must complete real-human create/copy/open/join/action/reconnect use;
8. only the Owner's report of successful real-human use closes this P0 milestone.

Automation cannot complete the real-human gate by itself.

## Current recovery safeguards

- `Stable Multiplayer Deploy` — account-owned normal deploy only;
- `Temporary Preview (EXPIRES — DO NOT SHARE)` — bounded diagnostics only;
- exact public build provenance (`buildSha`, `deployClass`);
- `public-provenance-smoke.mjs`;
- `public-share-link-smoke.mjs`, which clicks the real copy-link UI and uses the exact emitted URL in a clean second browser;
- `Stable Origin Recheck (NO REDEPLOY)` for later elapsed-time evidence;
- `deployment-contract-smoke.mjs` in Foundation;
- cancellation of superseded Foundation PR runs.

These are safeguards, not proof that the stable deployment or real-human test has already succeeded.

## Game / authority foundation

Historical evidence remains strong for:

- deterministic pure TypeScript core;
- canonical legality/reducer path;
- per-seat projection/privacy boundary;
- scoped domain events;
- Worker + SQLite Durable Object `MatchRoom`;
- hibernating WebSockets and reconnect;
- private opaque seat capabilities separate from shareable room code;
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

Run 05 on `run05/post-friend-evolution` has materially evolved the physical table: larger tactile/living hand, permissive manipulation separated from commit, spatial play target, material deal/talon/exchange/marriage flows, living trick/capture presentation and a distinct desktop composition.

Mechanical browser evidence is substantial, but broad Owner visual approval remains pending. Blind visual polish is paused while the P0 external trust boundary is repaired.

## Technical debt priority

### P0

- stable non-temporary friend origin not yet proven;
- later no-redeploy evidence pending;
- real-human friend test pending.

### P1

- keep stale historical docs from competing with current authority;
- keep deployment paths unambiguous and machine-gated;
- on Run 05, audit the long layered CSS cascade after P0 rather than performing a blind visual rewrite.

## Claim discipline

Good:

- `Foundation current head: PASS`;
- `temporary bounded runtime: PASS`;
- `account-owned non-temporary deploy: pending/PASS`;
- `exact copied invite: pending/PASS`;
- `same origin later recheck: pending/PASS`;
- `real-human friend test: pending/PASS`.

Bad:

- `everything verified`;
- `stable` because a URL responds now;
- `friend-ready` because automation is green;
- `safe` without naming the security/privacy property actually checked.

Contradictory evidence is an automatic blocker. A critical Owner requirement cannot be outvoted by unrelated green checks.

## Immediate direction

1. land the bounded recovery infrastructure independently of the large presentation PR;
2. restore/confirm green Foundation;
3. deploy the active Run 05 candidate through the account-owned stable workflow and bind it to exact SHA;
4. later recheck the same origin/SHA without redeploying;
5. complete the real Owner+friend multiplayer test;
6. only then resume broad Owner-led visual iteration and controlled presentation debt cleanup.
