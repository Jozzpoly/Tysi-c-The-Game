# Deployment authority — multiplayer and friend-link contract

Date: 2026-09-15
Status: **P0 authority**

This document defines what each public deployment proves and what may be presented to the Owner or a friend.

The 2026-09-15 friend-link incident showed that correct technical facts existed in the repository but were not treated as blocking authority. A functional temporary preview and a durable friend surface are different products and different evidence classes.

## Current P0 truth

The friend-test stage is **FAIL / NOT COMPLETE** until an account-owned non-temporary origin is deployed and the real-human Owner+friend gate passes.

A temporary URL must never be described as `stable`, `persistent`, `friend-ready`, `safe to keep`, or equivalent merely because it works now.

## Deployment classes

### 1. Temporary Preview — bounded diagnostics only

Workflow: `.github/workflows/temporary-foundation.yml`

Visible name: `Temporary Preview (EXPIRES — DO NOT SHARE)`

Mechanism: `scripts/temporary-deploy.mjs` -> `wrangler deploy --temporary`

Properties:

- unauthenticated temporary Cloudflare account;
- intentionally unclaimed;
- expected to expire automatically;
- useful for bounded public-runtime verification;
- **not acceptable as the Owner/friend candidate origin**;
- **not persistence evidence**.

A green temporary workflow means only that the exact runtime behavior exercised by its smoke tests worked during that run. It must never be promoted into a statement about future availability.

### 2. Stable Multiplayer Deploy — candidate friend origin

Workflow: `.github/workflows/deploy-foundation.yml`

Visible name: `Stable Multiplayer Deploy`

Mechanism:

- the workflow definition lives on the default branch so it can be manually dispatched reliably;
- the operator supplies one **exact candidate SHA** (`candidate_sha`), not merely a branch name;
- the workflow validates that SHA, checks out exactly that commit and verifies `git rev-parse HEAD` matches it before testing or publishing;
- authenticated Cloudflare account;
- repository secrets `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`;
- normal `wrangler deploy`, never `--temporary`;
- public provenance is stamped with the supplied candidate SHA and deployment class `stable`;
- Worker name `tysiac-the-game` from `wrangler.jsonc`;
- `workers_dev: true` unless a deliberate custom-domain migration replaces it;
- SQLite-backed `MATCH_ROOM` Durable Object remains the authoritative room backend.

This distinction matters: the SHA of the workflow definition and the SHA of the game candidate can be different. Readiness evidence attaches to `candidate_sha`, not to whichever branch/ref happened to be selected in the GitHub UI.

## Stable-deploy evidence ladder

A single word such as `verified` is not sufficient. Evidence must be reported by property.

### A. Candidate identity + deployment mechanism

PASS only when all are true:

1. `candidate_sha` is a full immutable 40-character Git SHA;
2. checkout HEAD equals that exact candidate SHA;
3. Cloudflare account credentials are present in GitHub Secrets;
4. the workflow uses normal authenticated `wrangler deploy`;
5. `wrangler deployments list` succeeds against the owned account after deployment;
6. the returned public URL is HTTPS;
7. the stable workflow contains no `--temporary` path.

This proves which exact commit was published and that it used the account-owned non-temporary mechanism. It does not by itself prove gameplay, copied-link correctness, long-horizon availability or human usability.

### B. Immediate public runtime

PASS only when `scripts/public-deploy-smoke.mjs` proves against the deployed public HTTPS origin:

- Worker health;
- built SPA assets;
- real duo room creation;
- independent desktop/mobile clients;
- private/disjoint human hands;
- distinct private reconnect credentials;
- command synchronization through the public WebSocket path;
- refresh/reconnect recovery;
- viewport/overflow safety;
- no seat-token leakage in normal URL/UI.

The stable workflow repeats this smoke after a short delay. That is repeatability evidence, not a substitute for long-horizon persistence.

### C. Exact copied friend invite

PASS only when `scripts/public-share-link-smoke.mjs` uses the real `Kopiuj link dla znajomego` control and proves that the exact URL produced by the UI:

- is HTTPS;
- remains on the stable deployment origin;
- contains only the room identifier;
- contains no reconnect/seat credential;
- opens in a clean second browser;
- allows that second browser to join the same room and receive a distinct private seat credential.

Constructing a `?room=...` URL inside the test harness is not sufficient evidence for this property.

### D. Public provenance

PASS only when `/api/match` reports:

- `buildSha` equal to the exact candidate SHA supplied to the stable deployment;
- `deployClass: stable`.

This prevents a correct-looking hostname from being mistaken for evidence that the intended build is actually serving.

### E. Long-horizon availability

Immediate deployment success cannot prove elapsed time.

The same stable origin must therefore be rechecked after the initial deployment without redeploying it. `Stable Origin Recheck (NO REDEPLOY)` checks out the exact candidate SHA, asserts that the public origin still reports that SHA and `stable` deployment class, then re-runs public multiplayer and copied-invite evidence without publishing a replacement.

Until such a later recheck exists, report `account-owned non-temporary origin: PASS` but do not report `long-horizon availability: PASS`.

### F. Real-human friend gate

Automation is necessary but cannot complete the project milestone.

The stage remains FAIL until:

1. the Owner opens the stable origin;
2. creates a real duo room;
3. uses the real in-game copy-link action;
4. sends that exact invite to the friend;
5. the friend opens it in their own real browser/device context;
6. joins the same room;
7. both players exchange real game actions successfully;
8. reconnect/refresh is acceptable in actual use;
9. the Owner reports that the real-human test succeeded.

Only then may the friend-link milestone be marked PASS.

## One-time Cloudflare setup

Secrets must never be pasted into chat, committed to source, written to issues, or printed into logs.

Required GitHub Actions repository secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

The API token should be scoped as narrowly as practical for Workers deployment to the intended account.

The account must have a `workers.dev` account subdomain configured unless the project deliberately moves to a custom domain.

## Workflow rules

Normal pushes and pull requests do not publish a stable deployment.

Stable deployment is manual because publishing a real account-owned public runtime is an operational action. The operator must paste the exact candidate SHA to be deployed; selecting or remembering a branch is not the evidence boundary.

Temporary preview is also manual because it requires explicit Cloudflare Terms/Privacy acceptance for each temporary deployment.

The workflows are intentionally named so that GitHub Actions itself communicates the evidence boundary.

## Claim language

Allowed examples:

- `Foundation CI: PASS`
- `temporary public runtime during run X: PASS`
- `exact candidate SHA checkout: PASS`
- `account-owned non-temporary deploy mechanism: PASS`
- `public provenance for SHA X: PASS`
- `actual copied invite behavior: PASS`
- `short-window repeatability: PASS`
- `long-horizon availability: not yet proven`
- `real-human friend test: FAIL / pending`

Forbidden promotion:

- temporary runtime PASS -> `stable link`;
- normal deploy PASS -> `friend-ready` without public runtime evidence;
- workflow-definition SHA -> candidate/game SHA;
- branch selection -> exact deployed candidate identity;
- automation PASS -> `real-human test passed`;
- current reachability -> `will remain available` without the non-temporary mechanism and later recheck.

## Failure classification

- expired temporary URL: expected temporary lifecycle;
- temporary provisioning failure: temporary Cloudflare boundary;
- malformed or missing `candidate_sha`: candidate identity blocker;
- checkout SHA mismatch: candidate identity failure;
- missing stable secrets: deployment setup blocker;
- stable authenticated deploy failure: deployment/configuration defect;
- owned deployment not listed after upload: stable-mechanism failure;
- public provenance mismatch: wrong build/deployment-class failure;
- public health/assets failure: routing/runtime/deployment defect;
- copied invite malformed/leaking credentials: product/security defect;
- second client cannot join: multiplayer product defect;
- reconnect/sync failure: runtime defect;
- stable origin later unreachable without intentional deletion/config change: operational availability defect;
- real friend cannot use an automation-green build: friend gate remains FAIL and must be investigated before any readiness claim.

## External references

Cloudflare Workers command reference: `https://developers.cloudflare.com/workers/wrangler/commands/workers/`

Cloudflare temporary/claim deployment model: `https://developers.cloudflare.com/workers/platform/claim-deployments/`

Cloudflare `workers.dev` routing model: `https://developers.cloudflare.com/workers/configuration/routing/workers-dev/`

These provider docs explain provider semantics. Repository workflows and executable public tests remain the project-specific evidence of how Tysiac actually uses them.
