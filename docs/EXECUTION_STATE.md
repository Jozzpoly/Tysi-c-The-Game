# Execution state — live truth

Date: 2026-09-20
Status: **Regression recovery inside finalization. The stable Owner/Friend baseline is protected. Product development is frozen until the recent presentation regression is reproduced and causally localized.**

## Authority order

1. direct live evidence for the exact property being claimed;
2. this file — compact current execution truth;
3. `docs/DEPLOYMENT.md` — public/stable/friend-link evidence contract;
4. `docs/INCIDENT_2026-09-15_FRIEND_LINK.md` — still-open release safety contract;
5. `AGENTS.md` — project working/evidence laws;
6. `docs/PROJECT.md` — durable product/architecture model.

Historical run plans, stale PR descriptions and old handoffs are evidence/history only. A newer branch or green CI run does not become product authority by recency.

## Product / Owner intent that remains protected

Tysiąc is a browser-first digital table for real use, not a generic card-game framework.

Protected experience direction:

- desktop and mobile are equal-quality product targets;
- cards are material objects rather than buttons;
- the private hand remains a living, permissive workspace;
- manipulation is broader than authoritative play;
- positive affordance is preferred over dead/disabled-card UX;
- table actions should preserve causal/object continuity: source → carried card → shared table → winner → ownership/consequence;
- presentation quality, tactile feel, pacing, responsiveness and visual coherence are Owner-led experience truth;
- exact rules/legality/scoring/bot correctness are not inferred from Owner approval.

The project remains intended to finish. It is not an open-ended presentation R&D branch.

## Current repository / product identities

### Repository `main`

Current `main`:

`6ad4a618820b3b7e01fbadc100abb4786ff8e300`

The latest main commits are operational/deployment/recheck work. **Main is not the current product baseline.**

### Golden Owner/Friend baseline — B0

Exact product SHA:

`fddeafbe2ef9b416c52f98cc5c9814bb2fb84f89`

PR #61: `experiment/mobile-composition-v2-owner-hand-priority`

Why it is the Golden control specimen:

- it is the last build with rich direct Owner evaluation;
- experienced-friend feedback was gathered on this product state;
- Foundation #860 passed;
- Temporary Preview #24 served this exact SHA;
- this exact SHA was later promoted to the canonical account-owned stable origin;
- stable deploy provenance and copied-invite/multiplayer evidence passed;
- later no-redeploy rechecks continued to report this same SHA and `deployClass=stable`.

Canonical stable origin:

`https://tysiac-the-game.jozzpoly.workers.dev/`

Repository deployment selectors currently also point to `fddeafbe...`.

Golden does **not** mean perfect. It means: this is the last empirically evaluated control whose accepted qualities must not be silently lost.

### Experimental delta — B1 / PR #62

Exact SHA:

`4e01a29e483a7a3ebf7dfc55750ed5726e43739c`

PR #62: `refactor/card-presentation-coherence`

Status: **experiment / not Owner-promoted**.

Runtime delta from B0 is limited to:

- `src/presentation/TactileHand.tsx`;
- `src/presentation/ownerMagnetismBridge.ts`;
- `src/presentation/tactileInteraction.ts`.

Its main hypotheses are:

- coalesce drag publication to at most one React update per animation frame;
- make TactileHand the single owner of ordinary-table attraction;
- separate early visual assist from accepted-table magnet feedback;
- make a real desktop pointer tap activate the card directly rather than depending on the browser's synthesized click.

Important causal boundary: `TactileHand` is used for the human/private hand. This PR does not change opponent-card rendering, `RemoteRoom` playback, trick-presentation timers or bot scheduling.

### Experimental delta — B2 / PR #63

Exact SHA:

`5e348a3c9f85df16923ebccc606e8a42072c033f`

PR #63: `experiment/c2-a1-material-geometry`

Status: **machine-qualified, Owner experience FAIL as a whole**.

Its only product-runtime delta from B1 is:

`src/run06-mobile-composition.css`

The material-geometry changes are inside `@media (max-width: 760px)`. Other changed files in PR #63 are diagnostic/test harnesses.

Therefore a reproducible **desktop** automatic-table-flow regression cannot be causally assigned to C2 mobile geometry.

### Quarantined false-cause experiment — PR #64

PR #64 was created after an incorrect diagnosis that older global card-cadence values had returned.

That diagnosis is falsified: B0, B1 and B2 retain the same relevant product pacing/timer implementation. PR #64 may be mechanically green, but it has no causal authority and must not be treated as the current fix or roadmap.

Keep it quarantined unless later evidence independently justifies some part of it.

## Regression forensics — evidence as of 2026-09-20

### What is established

The relevant global table/pacing implementation did not change between B0 and B2 in the files previously suspected during the failed diagnosis.

Foundation remote-playback measurements from the three checkpoints were:

- B0 / #61: ~292.2 ms observed revision spacing;
- B1 / #62: ~285.4 ms;
- B2 / #63: ~298.1 ms.

These values do not establish a material authoritative-playback speed regression.

PR #62 affects local human-card interaction/presentation ownership. It does not own automatic opponent-card playback.

PR #63 adds only mobile presentation CSS at runtime, scoped below 760 px.

Full remote solo rehearsal total elapsed times are **not** an apples-to-apples cadence benchmark: the rehearsal traverses different game paths and deliberately caps browser timeouts for fast automation. Do not use its total duration as feel evidence.

### What is not established

The Owner-observed regression is real experience evidence, but its exact technical cause is still **unproven**.

In particular, do not currently claim that the cause is:

- PR #55 cadence constants;
- PR #63 mobile material geometry;
- PR #62 as a whole;
- Cloudflare/stable deployment;
- browser performance;
- bot scheduling.

Those remain candidates only if direct evidence connects them to the same reproduced scenario.

If the observed regression is specifically automatic `bot → bot → collect → next trick` flow on desktop, current code-delta evidence says the cause is not explained by B1/B2 product changes. The next comparison must therefore first rule out scenario/mode/state/environment mismatch before editing timing again.

If the regression is specifically local human card pickup/tap/drag/handoff feel, B1 is a plausible causal boundary and its three interaction changes should be isolated separately.

## Current gate

**STOP broad product development.**

Do not:

- continue C2 merely because it is newer;
- merge #62/#63/#64;
- tune cadence by intuition;
- clean up presentation architecture while the control boundary is unresolved;
- redeploy the stable friend origin;
- replace the Golden stable candidate.

Machine-green experiments remain experiments until the relevant experience evidence promotes them.

## Active forensic campaign

### F0 — preserve the control

Keep `fddeafbe...` frozen and stable. No product mutation is required to preserve it.

### F1 — exact scenario reconstruction

Reconstruct the Owner-observed regression as an apples-to-apples comparison using the same:

- mode / human-seat arrangement;
- browser and device class;
- viewport/fullscreen state;
- game phase and action sequence;
- network/local-vs-remote path where relevant.

Capture separately:

1. automatic table flow — opponent arrival, consecutive opponent actions, third-card dwell, resolution, collection, next initiative;
2. local interaction — pointer/touch down, carry, assist/magnet, release, command acceptance, authoritative handoff;
3. geometry/object identity — hand → carried card → table, exchange, 7→10→8 transitions;
4. frame/input behavior — only where actual runtime evidence implicates performance.

Do not mix these clocks under one word such as "timing".

### F2 — B0/B1/B2 causal localization

Compare:

- B0 = `fddeafbe...`;
- B1 = `4e01a29e...`;
- B2 = `5e348a3c...`.

If B0 and B1 differ only in local interaction feel, split #62 into independently testable hypotheses:

- rAF drag coalescing;
- magnet/assist ownership;
- physical pointer-tap activation / handoff path.

If automatic table flow differs despite identical relevant product code, investigate runtime/scenario/provenance first rather than inventing another timing patch.

### F3 — reconstruct the next candidate from Golden

Do not continue linearly from B2.

The next candidate is:

**Golden B0 + only individually qualified deltas that demonstrate a concrete improvement without losing accepted qualities.**

Rejected or ambiguous deltas remain donors, not inherited state.

## After regression recovery

Only after the candidate is at least as good as Golden in the properties the Owner values, resume the remaining real feedback:

- improve readability/dwell of fast opponent actions where evidence still says it is needed;
- consider deliberate tap-to-accelerate/skip rather than globally rushing automatic flow;
- preserve/extend the pleasant mobile tap-to-table interaction on desktop;
- eliminate unnatural scale/aspect changes during transfers;
- improve card object continuity and "mięsistość";
- preserve material opacity;
- address mobile jank only from measured runtime evidence;
- clean presentation ownership/CSS debt only where it lowers actual regression or iteration risk.

Then:

1. focused Owner desktop/mobile test;
2. select one exact final product SHA;
3. promote that exact SHA through the stable deployment contract;
4. perform the bounded real-human stable-origin friend gate;
5. record known limitations and freeze the temporary project.

## Friend-link incident status

Operational recovery is strong: account-owned origin, exact SHA provenance, real copied-invite automation and no-redeploy rechecks exist.

The incident/release gate remains formally open until the required real-human session is explicitly evidenced on the final stable candidate. Prior friend feedback on Golden is valuable experience/domain evidence but must not be silently promoted into a different operational claim.

## Working rule for future `kontynuuj`

A short `kontynuuj` means:

1. recover this execution state and verify any mutable live facts that matter;
2. identify the highest-value unresolved gate;
3. take the safest reversible evidence-producing next action;
4. do not advance an experiment merely because it is the newest branch;
5. stop and update authority when new evidence falsifies the current model.

Current next action: **finish F1/F2 regression forensics before any new product change.**
