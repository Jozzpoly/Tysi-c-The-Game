# AGENTS.md — Tysiąc The Game

## Project intent

Build a professional browser-first Tysiąc table that works naturally on desktop and mobile, supports private multiplayer and bots, and can represent several real rule families without becoming a generic card-game framework.

Read `docs/EXECUTION_STATE.md` before substantial work. It is the live reconstruction after the 2026-09-12 critical restart.

## Owner / agent model

The Owner does **not** know Tysiąc rules well and must not be used as the primary rules oracle.

Agent responsibilities:

- lead domain research and technical judgement;
- distinguish documented fact, observed reference behavior, deliberate project choice and open uncertainty;
- turn material rule uncertainty into a concrete scenario/probe/test;
- keep the project playable and product-focused;
- protect only rule variability supported by real evidence;
- carry implementation/testing work without requiring the Owner to program.

Owner responsibilities:

- product direction, taste, priorities and acceptance;
- gameplay/UX feedback and whether the game feels worth using;
- access to the intended friend/domain oracle when available.

Friend feedback is valuable but must not block progress.

## Current engineering principles

These survived the fresh audit, but runtime evidence may still overturn them:

- Browser-first; one product across desktop and mobile, with responsive compositions rather than forced identical layouts.
- TypeScript current-best across pure core, client and Cloudflare adapters.
- Deterministic domain core independent of React/network/Cloudflare.
- Online multiplayer is server-authoritative.
- Full online hidden state stays inside the authority; each human/bot seat gets only its allowed observation.
- Human and bot controllers submit the same domain commands.
- One canonical legality evaluator generates legal actions and rejection reasons.
- Named rules profiles are versioned tested bundles.
- Active matches pin an immutable effective rules snapshot/fingerprint.
- Introduce a variant field only because real evidence or an explicit unresolved scenario requires it.

Do **not** treat the old seven policy-domain classes as mandatory architecture. Start with concrete rule data grouped for readability and phase-specific evaluators. Avoid inheritance, DSLs and arbitrary scripting.

## First reference profile

The old `POLISH_3P_800_CANDIDATE` label was too broad.

The initial concrete target is provisionally:

`PLAYOK_3P_800_CANDIDATE`

This means "candidate compatible with the documented Kurnik/PlayOK-style 3P game", not "canonical Polish rules".

Where Kurnik text is ambiguous, do not silently guess. Preserve the scenario as open, compare Pagat/Mizerca/other evidence, and use PlayOK black-box behavior later when feasible.

## Evidence language

For rule claims prefer explicit statuses:

- `documented` — stated by a source;
- `reference-observed` — reproduced in an existing implementation;
- `pinned` — deliberately chosen where real sources differ;
- `executable` — our scenario test proves implementation behavior.

For profiles prefer `candidate`, `scenario-tested`, `reference-tested`, `shipping`.

Do not use **certified** as a casual synonym for "tests passed".

## Testing

The pure core should have:

- focused scenario fixtures for material rules;
- invariants checked through transitions;
- deterministic seeded full-hand/full-match simulations;
- property/generative tests where they materially improve coverage.

Useful invariants include card conservation/uniqueness, legal-action closure, legal phase progression, score-accounting consistency, no hidden-state leakage in projections, and deterministic replay from the same explicit inputs.

Cloudflare adapters should be tested separately in the Workers runtime. Do not make Cloudflare integration a dependency of pure rules tests.

## Scope discipline

Current mode: **3-player auction Tysiąc**.

Do not prematurely build:

- 2P/4P modes;
- accounts, matchmaking or ranked play;
- generic rules marketplace/DSL;
- advanced search/ML bots;
- social systems;
- event-sourcing infrastructure;
- heavy observability.

Bots are not a non-goal: a minimal heuristic bot belongs in the early playable product, while `RandomLegal`/scripted controllers serve testing.

## Current execution order

Foundation Run 01:

1. project scaffold + pure core/testing shell;
2. 3P rules kernel and explicit reference scenarios;
3. deterministic complete hand/match under test controllers;
4. minimal playable heuristic bot boundary;
5. thin responsive Human + Bot + Bot browser table;
6. small independent Cloudflare Durable Object/WebSocket deployment canary.

Then bind the same core commands/projections to online MatchDO multiplayer, followed by reconnect/mobile resilience and friend/domain validation.

## Working style

Prefer small reversible steps and evidence-producing vertical progress. Keep durable docs short and current. Running behavior/tests outrank plans. Stop broad research once the next uncertainty is better answered by implementation, a reference probe or Owner gameplay.