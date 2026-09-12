# Execution state — live truth

Date: 2026-09-12
Status: **Foundation Run 01 is strongly proven locally; remote deployment and real room lifecycle remain open**

This is the compact execution truth. Earlier planning/history is not authority where it conflicts with executable evidence here.

## Product target

Build a small, high-quality browser Tysiąc table that is frictionless to open and good enough to use with real people.

- 3-player auction Tysiąc first.
- Desktop and mobile are **equal long-term product targets**.
- Private table by link/code; no mandatory account first.
- Bots are first-class seats.
- Human + Bot + Bot must already be worth playing.
- Refresh, reconnect and mobile suspension are normal lifecycle requirements.
- Later support several real Tysiąc rule families without becoming a generic rules DSL.

Visual polish is deliberately later. The foundation must support professional card art, animation, sound/haptics and feedback without coupling presentation to hidden state or network internals.

## Rules — candidate, not canonical

First target: **`PLAYOK_3P_800_CANDIDATE`**.

See `docs/rules/PLAYOK_3P_800_CANDIDATE.md`.

Material PlayOK-sensitive questions remain explicit: transfer visibility, four-nines timing, post-musik contract ceiling, bomb semantics, strict trump/overtrump interpretation, zero-trick marriage scoring and the unified Kurnik musik wording.

Current executable behavior is evidence for **our candidate implementation**, not proof that every pin matches PlayOK.

## Core — PASS

Pure TypeScript domain core is independent of React and Cloudflare.

Proven locally:

- deterministic seeded shuffle and reproducible matches;
- complete `deal -> auction -> musik -> exchange -> contract -> 8 tricks -> score -> next hand -> match` state machine;
- one canonical legality path and rejection reasons;
- candidate rule scenarios and invariants;
- card identity/conservation and score accounting;
- seeded complete hands/matches terminate;
- every client command now has an explicit `seat`, including `next-hand`;
- humans and bots use the same commands.

## Projection / feedback boundary — PASS

Human-facing presentation does not need authoritative `MatchState`.

Canonical client boundary:

`MatchState -> projectSeat(seat) -> SeatProjection { profile, observation, legalCommands }`

Executable privacy tests serialize the complete projection, including legal commands, and verify that hidden opponent/talon identities do not leak.

Accepted commands also emit transient typed `GameEvent[]`. Events have `public` or seat-specific audience and are filtered through `eventsForSeat()` before presentation/network delivery.

These are **presentation/protocol facts, not event sourcing**. Canonical authority remains `MatchState`; reconnect uses a fresh projection.

## Local presentation — PASS as foundation

`src/presentation/GameTable.tsx` is now a pure projection-driven table renderer/controller surface:

- input: `SeatProjection`, names, message;
- output: `onCommand(command)`;
- no authoritative state, bot logic or Cloudflare knowledge;
- does not assume the human occupies seat 0.

`src/App.tsx` is currently only the local Human + Bot + Bot authority adapter around that same table surface.

Browser CI proves GameTable with the human on both the ordinary seat 0 path and a non-zero absolute seat (`seat=2`). This is enforced on both desktop and mobile.

## Desktop/mobile browser evidence — PASS as foundation

Real headless Chrome tests use DevTools device metrics, not a guessed window size.

Enforced viewports:

- desktop: **1440 x 1000**;
- mobile: **390 x 844**.

Both execute real interaction flows:

- defender: auction -> pass -> legal trick play -> completed trick;
- declarer: win auction -> musik -> 10-card exchange -> 8-card contract -> lead -> completed trick;
- non-zero human seat composition.

The hand presenter now uses adaptive overlap instead of horizontal scrolling. CI asserts the hand itself has no horizontal overflow. At 390 px, 7-, 8- and 10-card hands all fit within the ~372 px hand container.

The current card art/layout is still a foundation placeholder. The important result is that all cards remain visible/interactable and the presentation contract does not constrain later professional graphics.

Marriage actions are explicit (`Melduj Q♦` vs `Melduj K♦`) so distinct legal plays are not visually collapsed.

## Bot — ADEQUATE foundation

The product heuristic only receives its seat observation, legal commands and public rules.

Current fixed 40-match survey:

- average 32.4 hands;
- maximum 49;
- voluntary contract success 61.3%;
- forced-100 success 39.4%;
- no non-terminating match.

Further tuning should be driven by human gameplay, not self-play overfitting.

## MatchRoom / Worker — LOCAL PASS

There is now exactly one room authority model: **`MatchRoom`**. The temporary `MatchCanary` implementation, tests, routes and binding have been removed.

`MatchRoom`:

- stores canonical `MatchState` in SQLite-backed Durable Object storage;
- calls the same core `applyCommand()` and invariants used locally;
- accepts `{ clientCommandId, expectedRevision, command }`;
- persists bounded command receipts for retry idempotency;
- detects command-id reuse;
- enforces seat context for every command;
- sends only per-seat `SeatProjection + eventsForSeat()`;
- survives DO eviction;
- uses hibernating WebSockets with serialized seat attachment;
- resyncs from current projection rather than requiring packet replay.

Worker routes are executable under workerd/Vitest:

- `GET /api/match/:room?seat=N` -> seat projection;
- `POST /api/match/:room?seat=N` -> same core command path;
- `/api/match/:room/ws?seat=N` -> WebSocket to the named MatchRoom.

Tests cover hidden-state privacy, persistence after eviction, duplicate retry behavior, command-id misuse, seat authorization, stale/concurrent revision races, per-seat WebSocket updates across eviction, router validation and HTTP/WS forwarding.

`wrangler deploy --dry-run` is green with only `MATCH_ROOM` bound.

### NOT YET PROVEN

- real Cloudflare deployment / `workers.dev` execution;
- production seat identity/authentication;
- create/join/invite lifecycle;
- reconnect credential lifecycle;
- online bot-seat orchestration;
- a real browser client connected to MatchRoom rather than the local adapter.

Current `?seat=` transport context is explicitly **test/foundation identity**, not shipping authentication.

## Architecture to preserve

Keep:

- pure domain core;
- React/Vite + DOM/CSS/SVG-first presentation;
- `SeatProjection` as the only human client game-state boundary;
- typed scoped feedback events;
- `GameTable` independent of local/remote authority;
- same command model for humans/bots;
- server-authoritative hidden state online;
- one Durable Object per table;
- snapshot/revision reconnect model.

Avoid for now:

- generic rules DSL/policy framework;
- event sourcing;
- D1/accounts/ranking without product need;
- client prediction;
- separate mobile game-state model;
- duplicated server rules implementation.

## Immediate next work

Design and implement **room lifecycle + seat identity + reconnect as one bounded subsystem**, rather than attaching a token to the current `?seat=` canary semantics.

Required product properties:

- frictionless create/share/join;
- no account required;
- explicit human/bot seat ownership;
- opaque unguessable reconnect credential for a human seat;
- no long-lived seat secret in a shareable room URL;
- credentials survive refresh/mobile suspension naturally;
- MatchRoom remains the only match authority;
- GameTable remains unaware of authentication/network details.

Then build a remote client adapter using exactly the existing `SeatProjection + onCommand` interface and perform the first real deployment when credentials/tooling permit.

Further rule research stays demand-driven by a concrete scenario or failing test.
