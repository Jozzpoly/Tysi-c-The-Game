# Foundation public deployment

This document describes the first real Cloudflare deployment boundary for Tysiąc The Game.

The repository is already proven locally through core, workerd, desktop/mobile Chrome, remote room/reconnect Chrome, production build and Wrangler dry-run. A public deployment is a new evidence class and must not be inferred from those local results.

## Target

- Worker name: `tysiac-the-game`
- public route: `workers.dev`
- authoritative room storage: SQLite-backed `MatchRoom` Durable Object
- deployment workflow: `.github/workflows/deploy-foundation.yml`
- trigger: **manual only** (`workflow_dispatch`)

Normal pushes and pull requests do not deploy.

## One-time Owner setup

Do not paste Cloudflare credentials into chat or commit them to this repository.

1. In the target Cloudflare account, make sure a `workers.dev` account subdomain is configured.
2. Create a Cloudflare API token for Workers deployment, scoped as narrowly as practical to the target account. Cloudflare's current CI guidance uses the `Edit Cloudflare Workers` token flow.
3. In this GitHub repository, add these Actions repository secrets:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`

The API token is a deployment capability. It belongs in GitHub Secrets, not in `wrangler.jsonc`, source files, issues, logs or chat.

## Deploy

In GitHub:

1. Open **Actions**.
2. Open **Deploy Foundation**.
3. Choose **Run workflow** on `main`.
4. Enable the explicit publish confirmation.
5. Run it.

The workflow is intentionally ordered as a transaction-like evidence gate:

1. install the locked dependency graph;
2. verify both Cloudflare secrets exist;
3. run the complete `npm run check` Foundation gate;
4. deploy through Cloudflare's Wrangler Action using Wrangler `4.131.1`;
5. require a public deployment URL from Cloudflare;
6. run `scripts/public-deploy-smoke.mjs` against that real URL;
7. upload public desktop/mobile screenshots.

A successful upload without successful public browser verification is **not** a Foundation PASS.

## Public verification contract

The post-deploy smoke uses real headless Chrome sessions against the public HTTPS URL and must prove:

- Worker health endpoint is reachable;
- desktop browser creates a real duo room;
- mobile 390×844 browser opens the room share URL and initially owns no seat credential;
- joining issues a distinct private credential;
- both human hands are private/disjoint;
- one legal auction command crosses the public WebSocket path and both clients converge on the same revision;
- refresh restores the same room/credential and a non-stale projection;
- mobile page/hand do not horizontally overflow;
- reconnect tokens do not appear in ordinary URLs or rendered UI.

Only after this passes may the public MatchRoom/browser boundary be marked proven.

## Failure handling

Do not weaken local gates or public smoke to make a deployment green.

Classify failures first:

- missing secrets / invalid token / wrong account: authorization setup;
- missing `workers.dev` subdomain: one-time Cloudflare account setup;
- Wrangler upload/migration failure: deployment/configuration defect;
- public health failure after upload: routing/runtime/deployment propagation defect;
- browser create/join/reconnect failure: product/runtime defect;
- screenshot/layout failure: public presentation regression.

Cloudflare notes that a first `workers.dev` publication can transiently return 523 while the route propagates. The public smoke therefore retries health for a bounded period rather than treating the first request as authoritative.

## What this does not prove

Even a green first public deploy does not prove:

- long-duration production soak;
- arbitrary mobile suspension/resume conditions;
- all WAN/network transitions;
- gameplay quality with real humans;
- exact PlayOK rule identity.

Those remain later evidence, not reasons to keep Foundation Run 01 indefinitely open once the explicit public deployment criterion is satisfied.
