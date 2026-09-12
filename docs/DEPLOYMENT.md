# Foundation public deployment

This document describes the first real Cloudflare deployment boundary for Tysiąc The Game.

The repository is already proven locally through core, workerd, desktop/mobile Chrome, remote room/reconnect Chrome, production build and Wrangler dry-run. A public deployment is a new evidence class and must not be inferred from those local results.

## Target

- Worker name: `tysiac-the-game`
- public route: `workers.dev`
- authoritative room storage: SQLite-backed `MatchRoom` Durable Object
- permanent deployment workflow: `.github/workflows/deploy-foundation.yml`
- temporary preview workflow: `.github/workflows/temporary-foundation.yml`
- both triggers: **manual only** (`workflow_dispatch`)

Normal pushes and pull requests do not deploy.

## Preferred first evidence: temporary preview

Cloudflare Wrangler 4.102+ supports unauthenticated `wrangler deploy --temporary`. Cloudflare currently documents temporary accounts as supporting Workers Static Assets and Durable Objects with bindings/migrations, which matches this Foundation stack.

The temporary workflow intentionally avoids permanent account credentials and is useful for the first public-runtime proof.

In GitHub:

1. Open **Actions**.
2. Open **Temporary Foundation Preview**.
3. Choose **Run workflow** on `main`.
4. Explicitly enable both checkboxes:
   - acceptance of Cloudflare Terms of Service and Privacy Policy for this temporary deployment;
   - confirmation that an unclaimed public `workers.dev` preview should be created.
5. Run it.

Those confirmations are deliberately not inferred by automation.

The workflow:

1. installs the locked dependency graph;
2. runs the complete `npm run check` Foundation gate;
3. executes `scripts/temporary-deploy.mjs`;
4. deploys with `wrangler deploy --temporary` without permanent Cloudflare credentials;
5. exposes only the public `workers.dev` URL to later steps;
6. runs `scripts/public-deploy-smoke.mjs` against that URL;
7. uploads public desktop/mobile screenshots.

`temporary-deploy.mjs` captures Wrangler output rather than streaming it. The Cloudflare claim URL is treated as a bearer credential and is redacted rather than printed or stored as a CI artifact. The preview is intentionally left unclaimed and should expire automatically with the temporary account.

A successful temporary upload without successful public browser verification is **not** a Foundation PASS.

## Permanent deployment

Use this after temporary public evidence succeeds, or directly if the Owner prefers a permanent target.

### One-time Owner setup

Do not paste Cloudflare credentials into chat or commit them to this repository.

1. In the target Cloudflare account, make sure a `workers.dev` account subdomain is configured.
2. Create a Cloudflare API token for Workers deployment, scoped as narrowly as practical to the target account.
3. In this GitHub repository, add these Actions repository secrets:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`

The API token is a deployment capability. It belongs in GitHub Secrets, not in `wrangler.jsonc`, source files, issues, logs or chat.

### Deploy

In GitHub:

1. Open **Actions**.
2. Open **Deploy Foundation**.
3. Choose **Run workflow** on `main`.
4. Enable the explicit publish confirmation.
5. Run it.

The workflow is intentionally ordered as a transaction-like evidence gate:

1. install dependencies;
2. verify both Cloudflare secrets exist;
3. run the complete `npm run check` Foundation gate;
4. deploy through Cloudflare's Wrangler Action using Wrangler `4.131.1`;
5. require a public deployment URL;
6. run `scripts/public-deploy-smoke.mjs` against that real URL;
7. upload public desktop/mobile screenshots.

## Public verification contract

Both deployment paths use the same post-deploy smoke. Real headless Chrome sessions against the public HTTPS URL must prove:

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

- temporary provisioning rejected/rate-limited: Cloudflare temporary-account boundary, not a game defect;
- missing permanent secrets / invalid token / wrong account: authorization setup;
- missing permanent `workers.dev` subdomain: one-time Cloudflare account setup;
- Wrangler upload/migration failure: deployment/configuration defect;
- public health failure after upload: routing/runtime/deployment propagation defect;
- browser create/join/reconnect failure: product/runtime defect;
- screenshot/layout failure: public presentation regression.

The public smoke retries health for a bounded period rather than treating the first request as authoritative.

## What this does not prove

Even a green first public deploy does not prove:

- long-duration production soak;
- arbitrary mobile suspension/resume conditions;
- all WAN/network transitions;
- gameplay quality with real humans;
- exact PlayOK rule identity.

Those remain later evidence, not reasons to keep Foundation Run 01 indefinitely open once the explicit public deployment criterion is satisfied.
