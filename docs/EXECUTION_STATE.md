# Execution state — live truth

Date: 2026-09-15
Status: **Run 05 recovery. Friend-link incident OPEN / P0 BLOCKER.**
Authority: this file is the compact current state. For deployment claims, `docs/DEPLOYMENT.md` is the dedicated authority. For the current failure, read `docs/INCIDENT_2026-09-15_FRIEND_LINK.md`.

Earlier Run 01/Run 02 evidence remains useful historical foundation but is not current execution authority where it conflicts with this state.

## Product target

Build a high-quality browser Tysiąc table for desktop and mobile that is frictionless to open and can be used with real people.

Current product contract:

- 3-player auction Tysiąc first;
- solo = human + 2 bots;
- duo = 2 humans + bot;
- trio = 3 humans;
- private room by link/code without mandatory accounts;
- desktop and mobile are equal product targets;
- refresh/reconnect/background lifecycle is normal;
- the presentation may evolve aggressively while canonical game/authority boundaries remain protected.

## Current branch

- branch: `run05/post-friend-evolution`
- draft PR: #23, `Run 05: physical table v2`
- base: `main`
- Run 05 is the active experimental presentation line.

Do not treat an old Friend Candidate, an old temporary preview URL, or a green historical workflow as the current playable candidate.

## P0 — friend-link recovery

**Status: FAIL / BLOCKED**

The previous external-readiness claim is invalidated. A temporary Cloudflare URL that passed bounded public smoke was later unavailable, exactly as the temporary deployment lifecycle allowed.

The Owner had explicitly required a stable, safe, repeatedly verified link before proceeding. The project already contained evidence that the temporary route was unclaimed and expected to expire. Continuing past that contradiction was a verification/authority failure.

Current mandatory ladder:

1. Foundation on the current recovery head must be green.
2. `Stable Multiplayer Deploy` must publish through the account-owned authenticated non-temporary Cloudflare path.
3. public provenance must report the exact expected SHA and deploy class `stable`;
4. public runtime/multiplayer smoke must pass;
5. the actual in-game copied friend invite must pass with a clean second browser;
6. the same origin and SHA must pass a later `Stable Origin Recheck (NO REDEPLOY)`;
7. the Owner and a real friend must complete the real-human create/copy/open/join/action/reconnect test;
8. only the Owner's report of successful real-human use closes this P0 milestone.

Automation cannot complete item 7/8 by itself.

### Current safeguards

The recovery branch now contains:

- `Stable Multiplayer Deploy` — account-owned normal deploy only;
- `Temporary Preview (EXPIRES — DO NOT SHARE)` — bounded diagnostics only;
- exact public build provenance (`buildSha`, `deployClass`);
- `public-provenance-smoke.mjs`;
- `public-share-link-smoke.mjs`, which clicks the real copy-link UI and sends that exact URL to a clean second browser;
- `Stable Origin Recheck (NO REDEPLOY)` for elapsed-time evidence;
- `deployment-contract-smoke.mjs` in the Foundation deploy harness;
- cancellation of superseded Foundation PR runs.

These safeguards are implementation, not proof that the stable deployment has already succeeded. Their current head still requires a green Foundation run and then the real stable deployment campaign.

## Game / authority foundation

**Historical evidence: strong. Current recovery head: must remain CI-green.**

The protected architecture remains:

- deterministic pure TypeScript game core;
- one canonical legality/reducer path;
- immutable/effective rules snapshot for a match;
- `MatchState -> SeatProjection` human boundary;
- audience-scoped typed game events;
- humans and bots submit the same domain commands;
- authoritative online hidden state inside one SQLite-backed Durable Object `MatchRoom` per table;
- private opaque reconnect capabilities separate from shareable room code;
- hibernating WebSockets + snapshot/revision reconnect;
- no client-side duplicate rules authority;
- no server sleeps for presentation timing.

Run 05 must not weaken these boundaries while visual/interaction code is refactored.

## Evidence tracks

### Game truth

The Owner is not the oracle for exact Tysiąc rule identity or strategic bot quality.

Use source/reference evidence, explicit reversible pins, executable scenarios/invariants/simulations and knowledgeable Tysiąc-player feedback.

`PLAYOK_3P_800_CANDIDATE` remains a candidate profile, not a claim of universal Polish Tysiąc rules.

### Experience truth

The Owner is the primary judgement source for visual hierarchy/composition, mouse/touch feel, card materiality/feedback, perceived pacing/motion, desktop/mobile ergonomics, onboarding/comprehensibility and whether the product looks coherent and worth using.

Automation may protect measurable mechanics. It cannot certify taste or fun.

### Operations / external truth

This is now a first-class evidence track rather than an afterthought.

Questions such as `is the link temporary?`, `what SHA is live?`, `does the exact copied invite work?`, `did the same origin survive without redeploy?`, and `did a real friend actually join?` require their own direct evidence.

A PASS in game truth or experience mechanics cannot substitute for an operations/external FAIL.

## Run 05 presentation state

Run 05 has materially evolved the physical table language:

- larger tactile/living hand;
- permissive manipulation separated from authoritative commit;
- spatial play target and handoff;
- materialized deal/talon/exchange/marriage motion;
- persistent trick/capture presentation;
- desktop composition distinct from mobile.

A real desktop regression caused by a transformed `.hand-area` ancestor conflicting with viewport-fixed carried-card geometry was found and repaired; dedicated authoritative-handoff browser coverage now protects that class of failure.

This mechanical evidence does **not** mean the visual experience is Owner-approved. Broad blind polish is paused while P0 external readiness is repaired.

## Technical debt — current priority map

### P0 / blocking

- stable non-temporary friend origin not yet proven;
- real-human friend test not yet completed;
- current recovery head must regain green Foundation evidence.

### P1 / authority and workflow debt

- stale Run02-era live documents must no longer compete with the current P0 state;
- legacy static preview path should be retired rather than remain a misleading executable alternative;
- claim language must remain property-scoped and evidence-backed.

### P1 / presentation structure debt

`src/main.tsx` currently imports a long cascade of visual-language, Run04 and Run05 CSS patch layers. This makes selector ownership and containing-block/layout effects difficult to reason about and has already contributed to cross-layer regression risk.

Do **not** replace it with a blind large CSS rewrite. After the P0 deployment/evidence path is green, perform a measured cascade audit, identify superseded rules, consolidate ownership by concern, preserve responsive geometry tests, and require fresh visual/mechanical evidence after each bounded cleanup.

### P2 / later

- broader art-direction polish;
- sound/haptics depth;
- rule-reference uncertainties that do not block experience work;
- stronger bot authenticity evidence;
- longer operational soak and real phone network/background transitions.

## Claim discipline

For any critical status, report the property and its evidence separately.

Good:

- `Foundation current head: PASS`
- `temporary bounded public runtime: PASS`
- `account-owned non-temporary deploy: not yet proven`
- `exact copied invite: PASS on stable origin`
- `same origin later recheck: pending`
- `real-human friend test: pending`

Bad:

- `everything verified`
- `stable` because a URL responds now;
- `friend-ready` because automation is green;
- `safe` without naming what security/privacy property was checked.

Contradictory evidence is an automatic blocker. A critical Owner requirement cannot be outvoted by unrelated green checks.

## Immediate direction

1. Finish P0 recovery hardening and restore a green Foundation on the exact current branch head.
2. Remove stale/competing deployment authority and misleading static preview infrastructure.
3. Establish the account-owned stable deployment and bind it to an exact SHA.
4. Recheck the same origin later without redeploying.
5. Conduct the real Owner+friend multiplayer test.
6. Only after that evidence is healthy resume broad Owner-led visual iteration and the controlled CSS/cascade debt campaign.

The project is not dead, but the external-readiness milestone is currently failed and must be re-earned rather than narrated as complete.
