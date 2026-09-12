# AGENTS.md — Tysiąc The Game

## Project intent

Build a professional browser-first Tysiąc card game that works across desktop and mobile, supports multiplayer and bots, and can represent real rule variants without turning into a generic card-game framework.

## Owner / agent model

The Owner does **not** know Tysiąc rules well and should not be used as the primary rules oracle.

Agent responsibilities:
- lead rules research and technical decisions;
- separate evidence from assumptions;
- never infer an uncertain rule silently;
- turn uncertainty into a concrete scenario/test;
- keep the project playable and product-focused instead of overengineering abstractions;
- protect future rules flexibility where real variants are evidenced.

Owner responsibilities:
- product direction, taste, priorities and real-world acceptance;
- feedback on UX and whether the game feels worth using;
- access to the intended friend/domain oracle when available.

The friend's rules feedback is valuable but must never block progress.

## Non-negotiable architecture principles

- Browser-first, one client for desktop/mobile.
- TypeScript current-best across core/client/server.
- Deterministic game core independent of React, Cloudflare and networking.
- Server-authoritative multiplayer.
- Full hidden game state never leaves server authority.
- Human and bot controllers submit the same commands.
- Bots receive only allowed observations; no hidden-information shortcuts.
- One canonical `legalActions` authority.
- Rules are versioned profiles over a limited set of evidenced policy domains.
- Do not expose arbitrary scriptable rules.
- Active matches pin an immutable effective-rules snapshot.
- Explanations/reason codes must come from the same evaluation that decides legality.

## Evidence standard

Use, in order of purpose:
1. documented rule sources;
2. reference-behavior scenarios against existing games when text is ambiguous;
3. executable scenario tests and invariants;
4. large bot simulations;
5. human gameplay evidence for UX/feel.

Do not call a rules profile certified unless its required scenarios and invariants pass.

## Scope discipline

First mode: **3-player auction Tysiąc**.

Do not prematurely build:
- 2P/4P modes;
- matchmaking/ranked/accounts;
- rules marketplace/DSL;
- advanced AI search;
- social systems;
- heavy observability infrastructure.

First prove the game core, then local play, then real multiplayer/mobile resilience.

## Working style

Prefer small, reversible steps. Keep durable documentation short and current. Runtime behavior and executable tests outrank historical plans.
