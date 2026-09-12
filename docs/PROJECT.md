# Project model — Tysiąc The Game

## Product thesis

A modern digital table for the **Tysiąc family of games**.

The game should open from a link, work naturally on desktop and mobile, allow private multiplayer and bots, and represent real rule variants through explicit versioned profiles.

The product must stay simpler than the architecture underneath it.

## First success condition

A 3-player game that a normal person can open and play:

- Human + Bot + Bot locally;
- then Human + Human + Bot online;
- full match to the target score;
- reliable reconnect;
- clean desktop/mobile UX;
- one certified Polish 3P profile.

## Rules philosophy

There is no single universal Tysiąc ruleset. Real tables differ.

Therefore:
- the game core models the Tysiąc family;
- variability is introduced only where real variants are evidenced;
- official profiles are named, versioned and tested;
- custom profiles may later combine supported policies, but custom does not automatically mean certified;
- 2P and 4P are separate future game modes, not simple toggles.

## Evidence model

### Rules correctness

Source descriptions → reference scenarios → executable tests → simulations.

Human feedback is used to choose/validate a real table's profile, not to replace formal correctness testing.

### Product quality

Owner and target-player gameplay decides whether the game is understandable, pleasant and worth using.

## Current architecture direction

### Core

Pure deterministic TypeScript domain layer:

`State + Command + EffectiveRules -> NewState + DomainEvents + Reasons`

The core knows nothing about React, WebSockets or Cloudflare.

### Client

React + Vite, responsive browser-first UI.

### Server

Cloudflare Worker + one Durable Object per active match.

The MatchDO owns authoritative state, persistence, connection mapping and deadlines.

### Persistence

SQLite-backed Durable Object storage for live match truth.

D1 is reserved for future global data such as accounts, ratings or global history if/when those features exist.

## Rules architecture v0 direction

Separate:

- `GameMode`
- `RulesProfile`
- `EffectiveRulesSnapshot`

Likely policy domains:

- AuctionRules
- Deal/ExchangeRules
- TrickRules
- MarriageRules
- BombRules
- HandScoringRules
- MatchProgressRules

Do not split further unless evidence requires it.

## Development sequence

### A — Headless hand

Complete one legal 3P hand with test controllers.

Gate: repeated simulations finish without invariant failure.

### B — Headless match

Multiple hands, dealer rotation, cumulative score, lock/bomb/win condition.

### C — Local table

Human + Bot + Bot in browser.

### D — Online table

Human + Human + Bot through MatchDO/WebSockets.

### E — Resilience

Refresh, reconnect, mobile backgrounding, orientation/network changes, deployment compatibility.

### F — Friend build

A build worth sending as a game rather than as a technical prototype.

## Long-term possibilities, not commitments

- several certified Polish/house profiles;
- custom table rules;
- saved/shareable rule profiles;
- stronger search-based bots;
- Rules Lens / learning assistance;
- replay and match capsules;
- accounts, matchmaking or ranking only if product demand justifies them.

## Primary project risks

1. Building a rules framework instead of a good game.
2. Letting the first profile leak assumptions into the family core.
3. Claiming support for rule combinations that were never tested.
4. Hidden-information leakage to client/bot.
5. Delaying playability through excessive architecture work.

When uncertain, prefer the smallest reversible step that gives real evidence.
