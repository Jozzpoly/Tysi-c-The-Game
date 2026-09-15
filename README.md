# Tysiąc The Game

**Codename:** `Tysiąc The Game`

Browser-first Tysiąc for desktop and mobile: private friend tables, bots, explicit rule profiles, and a presentation layer being rebuilt around a more physical digital-card language.

## Current live state

Active work is **Run 05 / PR #23** on `run05/post-friend-evolution`.

The project is currently in a **P0 recovery** after a false friend-link readiness claim. A temporary Cloudflare preview was incorrectly treated as if it satisfied the Owner's requirement for a durable friend link even though the repository explicitly identified that preview as unclaimed and expected to expire.

Therefore:

- old friend-link `ready/stable/verified` claims are invalidated;
- the external friend-test milestone is **FAIL / NOT COMPLETE**;
- temporary previews are diagnostics only;
- a real account-owned non-temporary origin, later no-redeploy recheck, and real Owner+friend session are required before PASS.

Do not infer current project readiness from an old green workflow or an old public URL.

## Read current authority first

1. [`docs/EXECUTION_STATE.md`](docs/EXECUTION_STATE.md) — compact live project state.
2. [`docs/INCIDENT_2026-09-15_FRIEND_LINK.md`](docs/INCIDENT_2026-09-15_FRIEND_LINK.md) — open P0 incident and acceptance gate.
3. [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deployment classes and exact evidence contract.
4. [`AGENTS.md`](AGENTS.md) — Owner/agent and claim-discipline rules.
5. [`docs/RUN05_PHYSICAL_TABLE_V2.md`](docs/RUN05_PHYSICAL_TABLE_V2.md) — active presentation direction.
6. [`docs/PROJECT.md`](docs/PROJECT.md) — durable product/architecture model.

## Product thesis

Najpierw dobra gra i dobry stół. Elastyczność zasad ma chronić realne odmiany Tysiąca, a nie zamienić projektu w generic card-game framework.

Current target:

- 3-player auction Tysiąc;
- open link / private table without mandatory accounts;
- `solo`: Human + Bot + Bot;
- `duo`: Human + Human + Bot;
- `trio`: Human + Human + Human;
- desktop and mobile as equal product targets;
- reconnect/background/refresh as normal browser lifecycle;
- one stable public multiplayer surface that a real friend can use without developer intervention.

## Technical direction

Defended architecture, subject to current-head CI:

- deterministic TypeScript domain core;
- React + Vite client;
- canonical legality/reducer path;
- `SeatProjection + scoped GameEvents` presentation boundary;
- Cloudflare Worker + one SQLite-backed Durable Object `MatchRoom` per table;
- hibernating WebSockets;
- server-authoritative hidden state with per-seat projections;
- anonymous room codes + private reconnect capabilities;
- browser evidence on desktop and mobile.

Cloudflare remains current-best infrastructure, not an eternal architectural requirement.

## Evidence model

Use the evidence source that matches the claim.

### Game truth

Rules, legality, scoring, bot strategy and authentic Tysiąc gameplay require sources/reference behavior, executable scenarios and knowledgeable-player evidence. The Owner is not the rules oracle.

### Experience truth

Visual hierarchy, interaction/touch feel, feedback, pacing, responsive composition and presentation quality are iterated with the Owner as primary product judge. Automation protects measurable mechanics but cannot certify taste or fun.

### Operations / external truth

Deployment class, public SHA, exact copied invite, elapsed-time availability and real second-human usability require direct operational evidence. A green game/browser test does not automatically prove any of these.

## Public deployment distinction

There are two intentionally different Cloudflare paths:

- **Temporary Preview (EXPIRES — DO NOT SHARE)** — bounded diagnostics; uses `wrangler deploy --temporary`; not a durable friend link.
- **Stable Multiplayer Deploy** — authenticated account-owned normal deployment candidate; still requires provenance, public behavior, exact copied-link checks, later no-redeploy recheck and real-human acceptance.

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). Never collapse these two evidence classes into a generic `public preview PASS` claim.

## Rules stance

There is no single defensible universal "Polish Tysiąc" ruleset.

The first concrete reference target remains provisionally `PLAYOK_3P_800_CANDIDATE`. Named profiles are tested bundles of supported behavior, not a promise that every arbitrary combination of internal rule fields is valid.

## Run 05 presentation direction

Run 05 explores a more physical table language while preserving canonical game authority:

- larger living/tactile hand;
- permissive card manipulation separated from authoritative play;
- spatial trick/capture ownership;
- materialized deal/talon/exchange/marriage flows;
- distinct desktop and mobile compositions.

Mechanical browser evidence exists for these slices, but broad Owner visual approval remains pending. The current P0 deployment/friend recovery takes precedence over further blind aesthetic polishing.

## Source-of-truth rule

For critical claims, name the property and the evidence.

A status such as `PASS`, `stable`, `safe`, `persistent`, `verified` or `ready` is invalid if it silently upgrades evidence from a different property.

When a critical Owner requirement conflicts with available evidence, the correct project state is **BLOCKED / FAIL** until the contradiction is resolved.
