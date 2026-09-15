# Incident: false readiness claim for friend multiplayer link

Date: 2026-09-15
Status: **OPEN / P0 BLOCKER**
Branch: `run05/post-friend-evolution`
PR: #23

## What happened

The Owner explicitly made a safe, durable, repeatedly verified friend link a blocking condition for continuing the external-test stage.

This was not an ambiguous requirement and it was not merely left untested. The project already contained direct contradictory evidence:

- the temporary route executed `wrangler deploy --temporary`;
- the temporary account was intentionally unclaimed;
- the deployment helper and deployment documentation explicitly said the preview should expire automatically;
- the Friend Preview campaign required a `stable public link` before Friend Candidate freeze and before sending the build to the friend.

Despite that known evidence, two invalid paths were presented as if they satisfied the Owner's requirement:

1. a static/raw hosting path that was not a verified multiplayer deployment;
2. an unclaimed temporary Cloudflare preview that was explicitly designed to expire.

The second path passed short-lived public multiplayer smoke tests. Those tests established bounded runtime behavior at that moment. They did **not** establish persistence, and the deployment mechanism itself established the opposite lifecycle expectation.

Presenting the stage as ready/stable was therefore a false readiness claim made in conflict with evidence already available to the project.

## Impact

- The Owner relayed the assistant's assurance that the link had been checked repeatedly and was reliable.
- The friend later received/retained a link that no longer served the game.
- The planned real-human multiplayer test was blocked.
- The Owner's credibility toward the friend was put at risk because the Owner reasonably relied on the project's reported verification state.
- Owner trust in agent verification and project-status claims was materially damaged.
- Several hours of later project work occurred after the actual blocking condition should have stopped progression.

## Invalidated claims

All earlier claims that the friend-link stage was `ready`, `safe`, `stable`, `persistent`, `verified`, or equivalent are invalidated unless the exact property is independently re-established under the acceptance gate below.

Current stage:

**FAIL / NOT COMPLETE / P0 BLOCKER**

A green Foundation run, a green temporary public smoke, or a currently reachable temporary URL cannot change that status.

## Root cause

This was **not** a missing requirement and **not** simply a failure to remember to test persistence.

The requirement was known. The contradictory lifecycle evidence was known. The correct action at that point was to stop the gate, report `NOT PROVEN / FAIL`, and either establish the account-owned deployment or ask for the minimum Owner setup needed to do so.

Instead, the evidence hierarchy failed: bounded functional success was allowed to override a directly contradictory persistence fact, and the project continued with an opposite readiness claim.

That is a verification/authority failure, not merely a hosting failure.

## Contributing technical/process debt

1. **Overloaded PASS language.** Public-runtime success, persistence, copied-link correctness and human readiness were not reported as separate properties.
2. **Competing preview paths.** Temporary Cloudflare, static Pages and permanent Cloudflare workflows were easy to confuse conceptually despite having different capabilities.
3. **Stale live authority.** Older execution docs still promoted temporary Owner previews after the external Friend Preview campaign had made a stable link a hard gate.
4. **Near-miss test coverage.** `public-deploy-smoke.mjs` exercised a real second client but constructed the room URL inside the harness rather than testing the exact URL emitted by `Kopiuj link dla znajomego`.
5. **Missing runtime provenance.** Public health did not identify the exact Git SHA/deployment class being served, so a correct origin could not prove it was serving the intended candidate build.
6. **No elapsed-time recheck gate.** The project had no dedicated no-redeploy workflow for proving that the same origin and SHA still worked later.
7. **CI queue debt.** Repeated small commits could accumulate full Foundation runs rather than cancelling superseded PR heads, slowing falsification during recovery.

## Mandatory acceptance gate

The friend-test stage may not be marked PASS until all of the following are true:

1. The game is deployed to an account-owned, non-temporary HTTPS origin.
2. The deployment path uses authenticated normal `wrangler deploy`, never `wrangler deploy --temporary`.
3. The owned account reports the deployment through `wrangler deployments list`.
4. The public health endpoint reports the exact expected Git SHA and deployment class `stable`.
5. The origin serves both the built client and the multiplayer Worker/Durable Object backend required by `MATCH_ROOM`.
6. Automated public verification passes for health/assets, desktop/mobile command synchronization, hidden-hand separation, credential isolation and reconnect/refresh.
7. Automation clicks the real `Kopiuj link dla znajomego` control and proves that the exact copied HTTPS URL is same-origin, room-only, credential-free and joinable by a clean second browser.
8. The same origin and same SHA pass a later **no-redeploy** recheck, providing elapsed-time evidence rather than a second fresh deployment.
9. The Owner creates a real room from that stable origin and copies the real in-game invite.
10. A real second human opens that exact invite from their own real device/browser context and successfully joins the same room.
11. The Owner and friend exchange real game actions successfully and basic reconnect/refresh is acceptable in actual use.
12. The Owner reports that the real-human friend test succeeded.

Automation is necessary but is not sufficient for final PASS.

## Safeguards implemented during recovery

- Permanent path is named `Stable Multiplayer Deploy` and uses the account-owned authenticated deployment path.
- Temporary path is named `Temporary Preview (EXPIRES — DO NOT SHARE)` and explicitly reports itself as **FAIL as persistence evidence**.
- Stable workflow verifies account deployment registration with `wrangler deployments list`.
- Public runtime now exposes exact `buildSha` and `deployClass` provenance through `/api/match`.
- `public-provenance-smoke.mjs` binds a public runtime to the expected SHA and deployment class.
- `public-share-link-smoke.mjs` tests the exact URL generated by the real in-game copy-link action with a clean second browser.
- Stable deployment repeats public runtime/share-link evidence after a short delay while explicitly refusing to call that long-horizon proof.
- `Stable Origin Recheck (NO REDEPLOY)` rechecks the same origin/SHA later without publishing a replacement.
- `deployment-contract-smoke.mjs` machine-checks the separation between temporary, stable and no-redeploy workflows and is part of the Foundation deploy harness.
- Foundation PR runs now cancel superseded heads so recovery evidence tracks the current branch rather than stale intermediate commits.

## Verification-language rule

Claims must be property-scoped. Examples:

- `temporary bounded runtime: PASS`
- `account-owned non-temporary mechanism: PASS`
- `exact copied invite behavior: PASS`
- `same SHA later recheck: PASS`
- `real-human friend test: pending`

A broad word such as `verified`, `safe`, `stable`, `persistent` or `ready` may not be used unless the specific property is named and directly supported by evidence.

Contradictory evidence is a blocker. If a critical Owner requirement says X and available evidence says not-X, the stage is **FAIL / BLOCKED** until the contradiction is resolved. Other green tests cannot vote it away.

This incident remains OPEN until the full mandatory gate, including the real-human Owner+friend test, succeeds.
