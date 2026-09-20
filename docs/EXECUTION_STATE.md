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

### B0/B1/B2 automatic-card cadence is now directly measured

The previously suspected global table/pacing implementation is identical across B0/B1/B2 in the relevant product files. A dedicated test-only forensic campaign then exposed the timestamps already collected by the deterministic `living-trick` MutationObserver.

Exact checkpoints:

- B0 / Golden: `fddeafbe2ef9b416c52f98cc5c9814bb2fb84f89`;
- B1 / #62: `4e01a29e483a7a3ebf7dfc55750ed5726e43739c`;
- B2 / #63: `5e348a3c9f85df16923ebccc606e8a42072c033f`.

The same seeded desktop scenario measured ordinary automatic-play spacing as:

- B0: **615.7 / 1055.7 / 332.6 ms**;
- B1: **612.7 / 1057.2 / 331.2 ms**;
- B2: **609.5 / 1059.8 / 331.5 ms**.

The trick-completion lifecycle measured `arrival → settled` as:

- desktop B0/B1/B2: **645.1 / 644.7 / 647.4 ms** in the final ordinary-play probe runs;
- earlier dedicated stage probe: **645.3 / 644.8 / 648.1 ms**;
- mobile dedicated stage probe: **645.2 / 645.0 / 646.8 ms**.

Sub-stage deltas likewise differ only by normal browser scheduling jitter. The semantic sequence is the same: `arrival → resolve → collect → consequence → settled`.

This is strong evidence that **B1/#62 and B2/#63 did not introduce the reported automatic-card cadence regression in the deterministic local trick flow that was tested**.

It does not invalidate the Owner observation. It changes the question from "which B1/B2 timing change caused this?" to "what runtime/client/scenario made the compared experiences differ?"

### Remote playback evidence

Foundation remote-playback measurements were:

- B0: ~292.2 ms revision spacing;
- B1: ~285.4 ms;
- B2: ~298.1 ms.

Scope remains important: this trace measures queued remote revision playback in an auction transition, not opponent trick-card dwell. It supports the absence of a broad remote-queue speed change but is not the primary automatic-card cadence measurement; the `living-trick` measurements above are stronger for the reported symptom.

### Product-code causal boundary

B1/#62 changes the human/private-hand interaction path:

- `TactileHand.tsx`;
- `ownerMagnetismBridge.ts`;
- `tactileInteraction.ts`.

It does not change opponent-card rendering, `App.tsx` bot scheduling, `RemoteRoom.tsx` playback or `trickPresentation.ts` cadence.

B2/#63 adds only mobile presentation CSS at product runtime, inside the <=760 px composition layer.

Therefore the current evidence strongly excludes B1/B2 as the source of a **desktop automatic-card scheduling/timeline** regression. B1 can still affect local human pickup/tap/drag/handoff feel and must be judged separately for that property.

### Previous stable client is materially different

A separate provenance check found that the earlier stable candidate served from the same canonical Worker lineage, commit:

`52450baa04f22646474bf4676f70b2df5ba6812f`

contains the genuinely slower cadence that the Owner remembered:

- ordinary presentation: **480 ms**;
- marriage presentation: **680 ms**;
- trick completion: **900 ms**;
- local trick bot delay: **520 ms**;
- completion thresholds: **220 / 390 / 620 / 820 ms**.

Golden B0 `fddeafbe...` contains the later faster cadence:

- ordinary presentation: **300 ms**;
- marriage presentation: **500 ms**;
- trick completion: **720 ms**;
- local trick bot delay: **320 ms**;
- completion thresholds: **175 / 310 / 500 / 650 ms**.

This yields a concrete new hypothesis for the apparent contradiction "friend link is slow while B0/B2 code is fast":

> an already-open SPA tab from the previous stable `52450baa...` deployment could continue executing its already-loaded slow JavaScript bundle after the canonical Worker origin was redeployed to `fddeafbe...`.

This is technically plausible because an already-loaded SPA does not hot-swap its JavaScript when the server is redeployed.

The recovered Owner chronology is consistent with this mechanism:

- on 2026-09-18 at ~14:43 UTC, the Owner tested a **fresh temporary preview of exact `fddeafbe...`** and reported that bots/cards advanced too quickly;
- later on 2026-09-18 the same `fddeafbe...` product was promoted to the canonical stable origin, which had previously served `52450baa...`;
- on 2026-09-19 at ~23:43 UTC the Owner explicitly stated that the **friend link had slower cards**.

This is materially stronger than a generic cache theory because the fresh `fddeafbe...` observation itself was "too fast", while the canonical-origin observation was "slower". However no recovered evidence yet proves whether the later friend-link observation came from a full fresh navigation/reload or from an already-running SPA tab.

**Status: strongest current causal hypothesis, still unproven.**

Do not rewrite history and claim the Owner actually tested `52450baa...` unless direct evidence establishes that client identity. The stable server currently reports `fddeafbe...` and `deployClass=stable`, but server provenance alone cannot retroactively identify the bundle that was already loaded in a historical browser tab.

### Temporary C2 origin

The old `tysiac-the-game.secret-crater.workers.dev` C2 temporary origin now returns NXDOMAIN. This is expected temporary-preview lifecycle, not loss of the B2 source/evidence. Exact B2 Git SHA, CI logs and browser artifacts remain available.

Do not recreate B2 by redeploy merely to keep an old temporary URL alive.

### Forensic harness provenance

The three forensic branches were based exactly on B0/B1/B2 and contain only changes to `scripts/living-trick-browser-smoke.mjs`.

Each branch currently has three test-only commits:

1. `Forensic: expose living-trick stage timings`;
2. `Forensic: expose ordinary opponent-play spacing`;
3. `Forensic: expose consecutive card-play timing`.

The middle commit was added concurrently by another active Tysiąc conversation while this investigation was running. It was applied equivalently to B0/B1/B2 and changes only diagnostic output, not product runtime. The resulting measurements are therefore useful, but the concurrency itself is recorded here so the branch history is not later mistaken for a single linear execution thread.

The first full B0/B1 stage-probe Foundations later failed on the already-known `authoritative handoff completion timed out` flake after the `living-trick` probe had passed. The final ordinary-play probe Foundations for B0/B1/B2 all completed successfully. Do not treat the earlier unrelated handoff timeout as cadence evidence.

### Screenshot evidence

Preserved original Foundation browser artifacts provide an independent visual check. Deterministic desktop living-trick scenes remain extremely close across B0/B1/B2; the B0↔B2 desktop collect frame differs only at a tiny pixel fraction consistent with raster/timing noise. The large B2 differences are on mobile, where C2 intentionally changes hand/material geometry.

Screenshot evidence supports the causal boundary above but does not replace timing traces.

### Still unresolved

The Owner-observed experience difference remains real evidence, but its exact historical client/runtime condition is still unproven.

Do not currently claim as fact that the cause was:

- PR #55 / the fast cadence commit;
- PR #62;
- PR #63;
- PR #64;
- Cloudflare;
- browser performance;
- or the stale `52450baa...` SPA hypothesis.

The old-client hypothesis is now the strongest concrete explanation for the specific contradiction between a visibly slower friend-link tab and identical B0/B1/B2 timing behavior, but it still needs direct or reconstructed evidence before becoming causal truth.

Full remote solo rehearsal total elapsed times remain unsuitable as cadence benchmarks because they traverse different game paths and intentionally cap browser timeouts.

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

1. automatic table flow — opponent arrival, consecutive opponent actions, third-card dwell, resolution, collection, next initiative; B0/B1/B2 deterministic timing is now measured and equivalent;
2. local interaction — pointer/touch down, carry, assist/magnet, release, command acceptance, authoritative handoff;
3. geometry/object identity — hand → carried card → table, exchange, 7→10→8 transitions;
4. frame/input behavior — only where actual runtime evidence implicates performance.

Do not mix these clocks under one word such as "timing".

### F2 — client/runtime identity reconstruction

B0/B1/B2 automatic cadence has been localized and is equivalent in the deterministic tested path.

The next causal question is therefore historical client identity and scenario identity:

- determine whether the slower friend-link observation could have come from an already-open `52450baa...` SPA client;
- distinguish server deployment SHA from the JavaScript bundle already loaded in a browser tab;
- recover any remaining evidence about reload/navigation timing around the stable promotion;
- if necessary, reproduce the stale-client mechanism in a bounded diagnostic setup without changing the stable product.

Only if direct evidence later points back to local human interaction should #62 be split into its rAF / magnet-owner / pointer-tap hypotheses.

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
