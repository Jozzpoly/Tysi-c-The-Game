# Tysiąc The Game

**Codename:** `Tysiąc The Game`

Browser-first Tysiąc for desktop and mobile: private friend tables, first-class bots and a small set of explicitly tested real rule profiles.

## Product thesis

Najpierw dobra gra i dobry stół. Elastyczność zasad ma chronić realne odmiany Tysiąca, a nie zamienić projektu w generic card-game framework.

Current target:

- 3-player auction Tysiąc;
- open link / private table without mandatory accounts;
- `solo`: Human + Bot + Bot;
- `duo`: Human + Human + Bot;
- `trio`: Human + Human + Human;
- desktop and mobile treated as equal product targets;
- reconnect/background/refresh treated as normal browser lifecycle.

## Current technical direction

Validated during Foundation Run 01 on 2026-09-12:

- deterministic TypeScript domain core;
- React + Vite client;
- one projection-driven `GameTable` for local and online play;
- Cloudflare Worker + one SQLite-backed Durable Object per table;
- hibernating WebSockets;
- server-authoritative hidden state with per-seat projections;
- anonymous room codes + private reconnect capabilities;
- scenario/invariant/simulation tests plus real Chrome desktop/mobile gates.

Cloudflare remains **current-best**, not an eternal requirement.

## Public-edge evidence

Foundation Run 01 crossed the actual Cloudflare boundary successfully using an unclaimed temporary account:

- Worker/DO/assets deployment: PASS;
- public `workers.dev` health: PASS;
- desktop host + 390 px mobile joiner: PASS;
- private/disjoint hands: PASS;
- public WebSocket revision sync: PASS;
- refresh/reconnect: PASS.

The temporary endpoint is ephemeral and is not the permanent product deployment. See [`docs/EXECUTION_STATE.md`](docs/EXECUTION_STATE.md) for exact evidence.

## Rules stance

There is no single defensible "Polish Tysiąc" ruleset.

The old `POLISH_3P_800_CANDIDATE` label was too broad. The first concrete reference target is provisionally source-scoped as `PLAYOK_3P_800_CANDIDATE` (Kurnik/PlayOK family), with unresolved edge cases kept explicit and reference probes added when necessary.

Named profiles are tested bundles of supported behavior. We do not promise that every arbitrary combination of internal rule fields is valid.

## Current execution

**Foundation Run 01 is complete.** It established the rules/game kernel, responsive presentation boundary, bot baseline, private room lifecycle, reconnect identity, real MatchRoom authority and public Cloudflare/browser feasibility.

**Run 02** moves the project from infrastructure proof toward gameplay/product truth:

- resolve the highest-risk rule ambiguities;
- implement missing target-profile rule paths;
- improve explanation/feedback where gameplay needs it;
- prepare a coherent solo build for serious Owner play on desktop and mobile;
- use real-human multiplayer and real-device resilience as evidence rather than assumptions.

Live truth:

- [`docs/EXECUTION_STATE.md`](docs/EXECUTION_STATE.md)

Other useful context:

- [`docs/PROJECT.md`](docs/PROJECT.md)
- [`AGENTS.md`](AGENTS.md)
- [`docs/rules/PLAYOK_3P_800_CANDIDATE.md`](docs/rules/PLAYOK_3P_800_CANDIDATE.md)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

## Source of truth

In descending practical authority:

1. running code + executable tests/invariants;
2. explicit profile definitions and scenario fixtures;
3. current repository execution/product docs;
4. external documented/reference evidence for rule claims;
5. historical chat/handoff material.

Product feel and whether the game is worth using remain Owner judgement.