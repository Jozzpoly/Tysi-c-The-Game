# Project model — Tysiąc The Game

Date: 2026-09-12

For the current implementation state and decision audit, read `docs/EXECUTION_STATE.md` first.

## Product thesis

A modern digital table for the Tysiąc family, beginning with a very good 3-player auction game rather than a broad framework.

The useful first product is simple:

- open a link;
- play immediately on desktop or phone;
- play alone with two competent-enough bots;
- create a private table and send the link to friends;
- recover naturally from refresh, reconnect and mobile backgrounding;
- know which concrete rules the table uses.

No mandatory account system is required for this first product.

## First success condition

A complete 3-player game that a normal person can actually enjoy:

- Human + Bot + Bot in the browser;
- clean desktop and mobile interaction;
- full match to the target score;
- one explicit source-scoped candidate rules profile with material uncertainties documented/tested;
- deterministic rules core that survives seeded simulation and invariant checks;
- a proven deployable Cloudflare room skeleton;
- then Human + Human + Bot / Human + Human + Human private multiplayer with reconnect.

## Rules philosophy

There is no single universal or even single clearly canonical "Polish Tysiąc" ruleset.

Therefore:

- first implement one explicit reference target, not an invented national canonical profile;
- initial target: `PLAYOK_3P_800_CANDIDATE`;
- model a variant field only when real evidence or a concrete unresolved scenario justifies it;
- named profiles are supported bundles, not arbitrary combinations guaranteed to work;
- a friend/domain expert can later validate or define another profile without mutating the meaning of the PlayOK-targeted one;
- 2P and 4P remain separate future modes because their deal/talon/active-seat structures materially differ.

## Architecture

### Pure domain core

TypeScript, deterministic from explicit inputs.

Conceptually:

`State + Command + Rules + explicit randomness -> Result`

The domain layer contains no React, WebSocket or Cloudflare dependencies.

Key contracts:

- phase/state;
- command;
- canonical legality evaluation + reason;
- state transition;
- seat observation/projection;
- domain facts/events only where useful to UI/adapters/tests.

Avoid a large event-sourcing architecture initially.

### Rules representation

Use a concrete rules object grouped by evidenced concerns such as auction, exchange, trick, marriage, scoring, match and redeal/abort behavior.

These groupings are organizational, not seven mandatory strategy classes.

Named rules profiles carry:

- stable id;
- version;
- normalized effective rules;
- deterministic fingerprint;
- provenance/status outside the runtime-critical evaluator as needed.

An active match pins its effective rules snapshot.

### Client

React + Vite SPA, responsive DOM/CSS/SVG UI.

Desktop and mobile share product semantics and components but may compose the table differently. Core requirements:

- current trick and required decision are visually dominant;
- own hand is always easy to scan/tap;
- no required hover interactions;
- bidding/exchange decisions use explicit controls, not fragile gesture-only UX;
- legal cards/actions can be highlighted/explained;
- score/context remains available without burying the play surface.

### Bots

Bots operate from the same seat observation and legal commands as humans.

Early split:

- `RandomLegal` / scripted bots for testing;
- minimal heuristic playable bot for product evaluation.

Advanced imperfect-information search is later research, not a blocker for the first good game.

### Online server

Current-best: Cloudflare Worker + one SQLite-backed Durable Object per table.

The MatchDO owns:

- authoritative hidden match state;
- pinned rules snapshot;
- seat/session tokens and connection mapping;
- accepted command revision;
- persistence needed for reconnect;
- per-seat projection broadcasts.

Use hibernating WebSockets. Treat socket death as normal; reconnect resynchronizes from authoritative state.

Initial persistence should stay simple. SQLite-backed DO is the storage backend, but this does not require designing a relational event store.

D1/global persistence is not part of the first product. It can be introduced later for accounts, ratings, discovery or global history if those features earn their way in.

## Evidence model

Different evidence answers different questions.

### Rules

- source-documented behavior;
- observed behavior in an existing implementation when useful;
- explicit project pin where legitimate variants disagree;
- executable scenarios proving our profile behavior.

### Core correctness

- scenario tests;
- invariants after transitions;
- deterministic seeded hand/match simulations;
- property/generative testing for broad invariants.

### Platform

- local Workers-runtime tests;
- small deployed Durable Object/WebSocket canary;
- later browser E2E and reconnect/background tests.

### Product

Owner and target-player gameplay determine whether the table is understandable, pleasant and worth using. That judgement does not replace rule evidence.

## Development sequence

### Foundation Run 01

1. Scaffold TypeScript + React/Vite + Vitest + Cloudflare-compatible shell.
2. Build deterministic card/deal/auction/exchange/trick/scoring kernel for 3P.
3. Add only evidenced variant fields needed for the first candidate and known conflicting sources.
4. Build focused reference scenarios and invariants.
5. Complete seeded headless hands and matches with legal controllers.
6. Add minimal heuristic product bot boundary.
7. Build thin responsive Human + Bot + Bot table.
8. Prove a tiny deployed MatchDO/WebSocket canary separately.

Gate: a complete local match is genuinely playable and repeatable; tests/simulations hold; infrastructure feasibility is demonstrated rather than assumed.

### Run 02 — private online table

Bind the same commands and seat projections to the MatchDO. Support anonymous private room creation/join by link/code and bot-filled seats.

### Run 03 — resilience / friend build

Refresh/reconnect, mobile background, weak networks, responsive polish, rule-reference probes, friend/domain feedback, and product-level iteration.

## Long-term possibilities, not commitments

- several reference-tested Polish/house profiles;
- restrained custom-table presets;
- stronger bots / imperfect-information search;
- rules learning/explanation tools;
- replay/debug capsules if real debugging need justifies them;
- accounts, matchmaking/rankings only if product demand justifies global identity/state.

## Primary project risks

1. Treating one implementation's rules as canonical Polish Tysiąc.
2. Silently turning ambiguous edge cases into core invariants.
3. Building a rule framework instead of a good table.
4. Bots being legal but unpleasantly stupid.
5. Hidden-state leakage through client/bot projections.
6. Mobile UX becoming a scaled desktop afterthought.
7. Overengineering persistence/replay before it solves a real failure mode.
8. Delaying deployment until Cloudflare assumptions become expensive to change.

When uncertain, prefer the smallest reversible action that produces concrete rule, runtime or gameplay evidence.