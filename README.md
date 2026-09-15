# Tysiąc The Game

**Codename:** `Tysiąc The Game`

Browser-first Tysiąc for desktop and mobile: private friend tables, bots, explicit rule profiles, and a presentation layer rebuilt around a more physical digital-card language.

## Current live state

The project is currently under **P0 external-readiness recovery** after the 2026-09-15 friend-link incident.

A temporary Cloudflare preview was incorrectly treated as if it satisfied the Owner's explicit requirement for a durable friend link even though the repository already identified that preview as unclaimed and expected to expire.

Therefore:

- old broad friend-link `ready/stable/verified` claims are invalidated;
- external friend-test status is **FAIL / NOT COMPLETE**;
- temporary previews are diagnostics only;
- stable deployment must use an account-owned non-temporary origin and one exact immutable candidate SHA;
- later no-redeploy evidence and a real Owner+friend session are required before PASS.

Do not infer current readiness from an old green workflow or an old public URL.

## Read current authority first

1. [`docs/EXECUTION_STATE.md`](docs/EXECUTION_STATE.md) — compact live state.
2. [`docs/INCIDENT_2026-09-15_FRIEND_LINK.md`](docs/INCIDENT_2026-09-15_FRIEND_LINK.md) — open P0 incident and acceptance gate.
3. [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deployment classes and exact evidence contract.
4. [`AGENTS.md`](AGENTS.md) — Owner/agent and verification rules.
5. [`docs/RUN05_PHYSICAL_TABLE_V2.md`](docs/RUN05_PHYSICAL_TABLE_V2.md) — current presentation direction now integrated into `main`.
6. [`docs/PROJECT.md`](docs/PROJECT.md) — durable product/architecture model.

Historical run/handoff documents and closed donor PRs are context, not current authority.

## Product thesis

Najpierw dobra gra i dobry stół. Elastyczność zasad ma chronić realne odmiany Tysiąca, a nie zamienić projektu w generic card-game framework.

Current target:

- 3-player auction Tysiąc;
- open stable link / private table without mandatory accounts;
- `solo`: Human + Bot + Bot;
- `duo`: Human + Human + Bot;
- `trio`: Human + Human + Human;
- desktop and mobile as equal product targets;
- reconnect/background/refresh as normal browser lifecycle;
- one public multiplayer surface that a real friend can use without developer intervention.

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

### Game truth

Rules, legality/scoring, bot strategy and authentic Tysiąc gameplay require source/reference evidence, executable scenarios and knowledgeable-player evidence. The Owner is not the rules oracle.

### Experience truth

Visual hierarchy, interaction/touch feel, feedback, pacing, responsive composition and presentation quality are iterated with the Owner as primary product judge. Automation protects measurable mechanics but cannot certify taste or fun.

### Operations / external truth

Deployment class, exact public candidate SHA, exact copied invite, elapsed-time availability and real second-human usability require direct operational evidence. A green game/browser test does not automatically prove any of these.

The exact `Kopiuj link dla znajomego` path is now also rehearsed locally in every Foundation: the UI-generated URL is captured, checked for room-only/capability-free semantics and opened in a clean second browser. That is pre-deploy product evidence, **not** public/stable-origin evidence.

## Public deployment distinction

- **Temporary Preview (EXPIRES — DO NOT SHARE)** — bounded diagnostics; uses `wrangler deploy --temporary`; not a durable friend link.
- **Stable Multiplayer Deploy** — account-owned normal deployment; takes one exact candidate SHA, checks out exactly that commit, stamps public provenance, then runs public runtime and real copied-invite evidence.
- **Stable Origin Recheck (NO REDEPLOY)** — later rechecks the same origin and same candidate SHA without publishing a replacement.

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

Current frozen external candidate remains:

`52450baa04f22646474bf4676f70b2df5ba6812f`

Later `main` cleanup does not silently replace that candidate.

## Rules stance

There is no single defensible universal "Polish Tysiąc" ruleset.

The first concrete reference target remains provisionally `PLAYOK_3P_800_CANDIDATE`. Named profiles are tested bundles of supported behavior, not a promise that every arbitrary combination of internal rule fields is valid.

## Active presentation work

The clean Run 05 physical-table continuation has been validated and integrated into `main`. The old PR #23 is closed as superseded integration history, not an active product line.

Current `main` contains the evolved tactile hand, spatial play, material card transfers, trick collection and desktop/mobile composition. Several bounded dead/patch-on-patch CSS layers have already been removed with full browser regression evidence.

Mechanical browser evidence does not equal Owner visual approval. Broad blind polish remains paused while the P0 friend/deployment trust boundary is recovered. Further CSS consolidation is no longer simple dead-code deletion: the remaining Run04/Run05 overlap contains live ownership and must be redesigned in bounded evidence-backed slices.

## Source-of-truth rule

For critical claims, name the property and the evidence.

A status such as `PASS`, `stable`, `safe`, `persistent`, `verified` or `ready` is invalid if it silently upgrades evidence from a different property.

When a critical Owner requirement conflicts with available evidence, the correct project state is **BLOCKED / FAIL** until the contradiction is resolved.
