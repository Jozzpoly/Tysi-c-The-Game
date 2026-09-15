# Incident: false readiness claim for friend multiplayer link

Date: 2026-09-15
Status: **OPEN / P0 BLOCKER**

## What happened

The Owner explicitly made a safe, durable, repeatedly verified friend link a blocking condition for continuing the external-test stage.

This was not an ambiguous requirement and it was not merely left untested. The project already contained direct contradictory evidence:

- the temporary route executed `wrangler deploy --temporary`;
- the temporary account was intentionally unclaimed;
- the deployment helper/documentation explicitly said the preview should expire automatically;
- the Friend Preview campaign required a `stable public link` before Friend Candidate freeze and before sending the build to the friend.

Despite that known evidence, a temporary Cloudflare preview that was designed to expire was presented as if it satisfied the durable friend-link requirement.

The temporary deployment passed short-lived public multiplayer smoke tests. Those tests established bounded runtime behavior at that moment. They did **not** establish persistence, and the deployment mechanism itself established the opposite lifecycle expectation.

Presenting the stage as ready/stable was therefore a false readiness claim made in conflict with evidence already available to the project.

## Impact

- The Owner relayed the assurance that the link had been checked repeatedly and was reliable.
- The friend later received/retained a link that no longer served the game.
- The planned real-human multiplayer test was blocked.
- The Owner's credibility toward the friend was put at risk because the Owner reasonably relied on the project's reported verification state.
- Trust in agent verification and project-status claims was materially damaged.
- Later project work occurred after the actual blocking condition should have stopped progression.

## Invalidated claims

All earlier claims that the friend-link stage was `ready`, `safe`, `stable`, `persistent`, `verified`, or equivalent are invalidated unless the exact property is independently re-established under the acceptance gate below.

Current stage:

**FAIL / NOT COMPLETE / P0 BLOCKER**

A green Foundation run, green temporary public smoke, or currently reachable temporary URL cannot change that status.

## Root cause

This was **not** a missing requirement and **not** simply a failure to remember to test persistence.

The requirement was known. The contradictory lifecycle evidence was known. The correct action was to stop the gate, report `NOT PROVEN / FAIL`, and either establish the account-owned deployment or request the minimum Owner setup needed to do so.

Instead, bounded functional success was allowed to override a directly contradictory persistence fact, and the project continued with an opposite readiness claim.

That is a verification/authority failure, not merely a hosting failure.

## Contributing technical/process debt

1. **Overloaded PASS language.** Runtime success, persistence, copied-link correctness and human readiness were not reported as separate properties.
2. **Competing preview concepts.** Temporary and permanent Cloudflare paths were not treated as hard-separated evidence classes.
3. **Stale live authority.** Older execution docs still promoted temporary Owner previews after a stable link had become a hard external gate.
4. **Near-miss test coverage.** `public-deploy-smoke.mjs` exercised a second client but constructed the room URL inside the harness rather than testing the exact URL emitted by `Kopiuj link dla znajomego`.
5. **Missing runtime provenance.** Public health did not identify the exact Git SHA/deployment class being served.
6. **No elapsed-time recheck gate.** There was no dedicated no-redeploy workflow proving that the same origin/SHA still worked later.
7. **CI queue debt.** Repeated small commits could accumulate full Foundation runs rather than cancelling superseded PR heads.

## Mandatory acceptance gate

The friend-test stage may not be marked PASS until all of the following are true:

1. game is deployed to an account-owned, non-temporary HTTPS origin;
2. deployment uses authenticated normal `wrangler deploy`, never `--temporary`;
3. owned account reports the deployment through `wrangler deployments list`;
4. public health reports the exact expected Git SHA and deployment class `stable`;
5. origin serves built client and `MATCH_ROOM` Worker/Durable Object backend;
6. automated public verification passes for health/assets, desktop/mobile sync, hidden-hand separation, credential isolation and reconnect/refresh;
7. automation clicks the real `Kopiuj link dla znajomego` control and proves the exact copied URL is HTTPS, same-origin, room-only, credential-free and joinable by a clean second browser;
8. the same origin/SHA pass a later **no-redeploy** recheck;
9. Owner creates a real room from that stable origin and copies the real invite;
10. a real second human opens that exact invite in their own browser/device context and joins successfully;
11. Owner and friend exchange real game actions successfully and basic reconnect/refresh is acceptable;
12. Owner reports that the real-human friend test succeeded.

Automation is necessary but is not sufficient for final PASS.

## Safeguards implemented during recovery

- `Stable Multiplayer Deploy` for account-owned normal deployment.
- `Temporary Preview (EXPIRES — DO NOT SHARE)` for bounded diagnostics only.
- Stable workflow verifies account deployment registration with `wrangler deployments list`.
- Public runtime exposes exact `buildSha` and `deployClass` provenance.
- `public-provenance-smoke.mjs` binds a public runtime to expected SHA/class.
- `public-share-link-smoke.mjs` tests the exact URL generated by the real in-game copy-link action with a clean second browser.
- Stable deployment repeats public runtime/share-link evidence after a short delay while refusing to call that long-horizon proof.
- `Stable Origin Recheck (NO REDEPLOY)` provides later same-origin/same-SHA evidence without publishing a replacement.
- `deployment-contract-smoke.mjs` machine-checks the separation between temporary, stable and no-redeploy paths.
- Foundation PR runs cancel superseded heads.

## Verification-language rule

Claims must be property-scoped. Examples:

- `temporary bounded runtime: PASS`;
- `account-owned non-temporary mechanism: PASS`;
- `exact copied invite behavior: PASS`;
- `same SHA later recheck: PASS`;
- `real-human friend test: pending`.

A broad word such as `verified`, `safe`, `stable`, `persistent` or `ready` may not be used unless the specific property is named and directly supported by evidence.

Contradictory evidence is a blocker. If a critical Owner requirement says X and available evidence says not-X, the stage is **FAIL / BLOCKED** until the contradiction is resolved. Other green tests cannot vote it away.

This incident remains OPEN until the full mandatory gate, including the real-human Owner+friend test, succeeds.
