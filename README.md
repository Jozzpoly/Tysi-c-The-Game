# Tysiąc The Game

**Codename:** `Tysiąc The Game`

Browser-first Tysiąc for desktop and mobile: private friend tables, first-class bots and a small set of explicitly tested real rule profiles.

## Product thesis

Najpierw dobra gra i dobry stół. Elastyczność zasad ma chronić realne odmiany Tysiąca, a nie zamienić projektu w generic card-game framework.

Initial target:

- 3-player auction Tysiąc;
- open link / private table without mandatory account creation;
- Human + Bot + Bot worth playing;
- later Human + Human + Bot and Human + Human + Human online;
- clean responsive UX rather than desktop UI merely shrunk onto phone;
- reconnect/background/refresh treated as normal browser lifecycle.

## Current technical direction

Freshly re-audited on 2026-09-12:

- TypeScript deterministic domain core;
- React + Vite client;
- Cloudflare Worker + one Durable Object per online table;
- SQLite-backed Durable Object storage, initially used simply;
- hibernating WebSockets;
- authoritative online state with per-seat projections;
- Vitest + scenario/invariant/simulation testing.

Cloudflare remains **current-best**, not a permanent requirement.

## Rules stance

There is no single defensible "Polish Tysiąc" ruleset.

The old `POLISH_3P_800_CANDIDATE` label was too broad. The first concrete reference target is now provisionally source-scoped as `PLAYOK_3P_800_CANDIDATE` (Kurnik/PlayOK family), with unresolved edge cases kept explicit and black-box/reference probes added when necessary.

Named profiles are tested bundles of supported behavior. We do not promise that every arbitrary combination of internal rule fields is valid.

## Current execution

**Foundation Run 01:** rules kernel → deterministic headless hands/matches → thin playable local Human + Bot + Bot table, plus a small Cloudflare Durable Object deployment canary.

The live reconstruction and decision record is:

- [`docs/EXECUTION_STATE.md`](docs/EXECUTION_STATE.md)

Other useful context:

- [`docs/PROJECT.md`](docs/PROJECT.md)
- [`AGENTS.md`](AGENTS.md)
- [`docs/rules/PLAYOK_3P_800_CANDIDATE.md`](docs/rules/PLAYOK_3P_800_CANDIDATE.md)

## Source of truth

In descending practical authority:

1. running code + executable tests/invariants;
2. explicit profile definitions and scenario fixtures;
3. current repository execution/product docs;
4. external documented/reference evidence for rule claims;
5. historical chat/handoff material.

Product feel and whether the game is worth using remain Owner judgement.