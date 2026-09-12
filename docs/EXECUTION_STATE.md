# Execution state — live truth

Date: 2026-09-12
Status: **Foundation Run 01 is substantially proven locally; online MatchRoom integration is next**

This file is the compact execution truth. Earlier planning/history remains useful but is not authority where it conflicts with executable evidence here.

## 1. Product target

Build a small, high-quality browser Tysiąc table that is frictionless to open and good enough to use with real people.

Current target:

- 3-player auction Tysiąc;
- desktop and mobile are **equal long-term product targets**;
- private friend table by link/code, no mandatory account first;
- bots are first-class seats;
- Human + Bot + Bot must already be worth playing;
- refresh, reconnect and mobile suspension must become normal lifecycle;
- later support several real Tysiąc rule families without becoming a generic card-game engine or arbitrary rules DSL.

Visual polish is deliberately not the current focus. The foundation must instead let a later professional presentation layer consume clear state, legal choices and domain feedback without coupling to hidden authority/network internals.

## 2. First rules target

First profile: **`PLAYOK_3P_800_CANDIDATE`**.

It is source-scoped and intentionally not called canonical "Polish Tysiąc". Real Polish implementations/tables differ materially.

Primary profile document:

- `docs/rules/PLAYOK_3P_800_CANDIDATE.md`

Primary references:

- Kurnik / PlayOK: https://www.kurnik.pl/tysiac/zasady.phtml
- Pagat: https://www.pagat.com/marriage/1000.html
- Mizerca: https://mizerca.com/en/thousand-rules

Material unresolved/reference-sensitive items remain explicit:

- 3P musik / Kurnik last-trick wording;
- transfer visibility;
- four-nines timing;
- post-musik contract ceiling;
- bomb timing/count/800 interaction;
- strict trump/overtrump interpretation;
- marriage scoring with no captured trick.

Important correction: Kurnik really does state that points for cards "from the musiks" go to the last-trick winner. Naively applying that sentence to 3P would double-count cards because all 24 cards enter the eight tricks after exchange. `no-extra-3p-musik-score` is therefore the current project pin/current-best interpretation, **not a PlayOK-observed fact**.

## 3. Domain/core — PASS

The implemented core is pure TypeScript and independent of React/Cloudflare.

Current properties:

- deterministic seeded shuffle;
- full 3P hand/match state machine;
- one canonical legality evaluator;
- auction / musik / exchange / final contract / tricks / marriages / scoring / 800 lock / match end;
- all actors submit the same domain commands;
- invariants enforce card identity/conservation/accounting;
- complete seeded hands and matches execute headlessly;
- candidate-sensitive scenarios are executable.

Core smoke currently covers, among other things:

- compulsory 100;
- bid ceiling from held marriages;
- follow-and-beat;
- trump when void;
- overtrump;
- lead-suit precedence;
- marriage establishes trump and score;
- 800 lock;
- simultaneous >=1000 declarer precedence;
- hidden-card observation boundary;
- transfer privacy under the current recipient-private pin;
- full seeded match completion.

## 4. Presentation/network boundary — PASS

Human-facing presentation no longer needs authoritative `MatchState`.

Canonical boundary:

`MatchState -> projectSeat(seat) -> { profile, observation, legalCommands }`

`SeatProjection` is the intended contract for both local and future online clients.

Executable privacy tests serialize the complete projection — including `legalCommands` — and prove that opponent hand identities and hidden talon identities do not leak.

### Domain feedback events

Accepted commands now emit transient typed `GameEvent[]` such as:

- bid/pass/auction win;
- talon reveal;
- exchange;
- private received card;
- contract;
- marriage;
- card play;
- completed trick;
- hand score;
- match completion.

These events are **not event sourcing**. Canonical state remains `MatchState`; reconnect can use a fresh seat projection.

Events carry an audience (`public` or one seat). `eventsForSeat()` is the visibility filter. Executable tests prove that private transferred-card identities cannot leak through the feedback channel.

This boundary is deliberately suitable for later animation, richer graphics, audio, haptics, history and online synchronization without reverse-engineering state diffs.

## 5. Bot — ADEQUATE foundation, not final skill

The first product bot is deterministic and only receives a seat observation + legal commands + public rules.

A pathological first calibration caused matches to spiral into hundreds of hands and very large negative scores. The test limit was not relaxed; the policy was recalibrated.

Current 40-match survey:

- average match: **32.4 hands**;
- maximum: **49 hands**;
- worst observed minimum score: **-630**;
- average contract: **113.6**;
- voluntary contract success: **61.3%**;
- forced-100 success: **39.4%**;
- winner seats: **16 / 15 / 9** in the current fixed survey;
- no non-terminating match in the survey.

Further tuning should wait for real human gameplay; self-play optimization now risks overfitting.

## 6. Browser/mobile/desktop evidence — PASS as foundation

Real Chrome/ChromeDriver tests run against the Vite/workerd dev app.

The harness uses Chrome DevTools emulation and asserts the actual document width, `window.innerWidth` and `visualViewport`. Earlier false "mobile" evidence at 500 px was detected and withdrawn.

Current tested viewports:

- desktop: **1440 x 1000**;
- mobile: **390 x 844**.

Both run these real interaction paths:

### Defender path

`auction -> pass -> wait for human trick turn -> click legal card -> completed trick`

### Declarer path

Using deterministic QA seed 2:

`win auction at 200 -> musik -> 10-card exchange -> select two cards -> confirm -> 8-card final contract -> first lead -> completed trick`

The browser test asserts no page-level horizontal overflow at every checked phase and stores screenshots as CI artifacts.

### Presentation debt deliberately left open

The temporary hand presenter horizontally scrolls when the row no longer fits. On the current 390 px viewport:

- available hand width: ~372 px;
- 7-card row: ~391 px;
- 8-card row: ~447 px;
- 10-card exchange row: ~559 px.

This is **not** a long-term mobile design decision. Future card presentation should support adaptive fit/fan/overlap/hit areas while preserving full interaction quality. Do not polish the placeholder into an architectural constraint.

Another small semantic UX debt: a marriage currently offers two visually identical meld buttons when both K and Q can legally be led; future UI must distinguish the card choice.

Normal product startup is random. `?seed=N` exists only as a reproducible QA hook.

## 7. Cloudflare infrastructure — local/runtime PASS, remote NOT YET PROVEN

Current canary uses:

- Worker + Vite integration;
- one SQLite-backed Durable Object per named room;
- persisted revision;
- transaction-based expected-revision gate;
- hibernating WebSockets;
- HTTP and WebSocket routing.

Current workerd/Vitest evidence: **5/5 PASS**, covering:

- room isolation;
- persistence after Durable Object eviction;
- optimistic revision race (one stale command rejected);
- routing;
- an existing WebSocket remaining usable across DO eviction/hibernation.

Production build is green.

`wrangler deploy --dry-run` is green and uses the Vite-generated deployment config, client assets and Durable Object binding.

**Not yet proven:** an actual remote `workers.dev` deployment. No Cloudflare account connector is available in the current agent environment; do not claim remote evidence before it exists.

## 8. Toolchain — PASS / reproducible

- Node 24 in CI;
- npm 11.19.0;
- committed `package-lock.json`;
- CI uses `npm ci` + cache;
- workflow token is read-only;
- install-script approvals are pinned only for the current `esbuild` and `workerd` versions;
- generated Vite/Wrangler artifacts are ignored.

A Node 22/npm 10 install failure was traced to the npm/Arborist `edgesOut` crash rather than hidden dependency conflict; the same graph installs correctly under the current toolchain.

## 9. Current architecture

### Keep

- pure TypeScript core;
- React + Vite presentation;
- DOM/CSS/SVG-first cards rather than a game engine/canvas requirement;
- `SeatProjection` as client data boundary;
- typed scoped domain feedback events;
- same commands for human and bot actors;
- server-authoritative hidden state online;
- one Durable Object per table;
- SQLite-backed DO + hibernating WebSockets;
- snapshot/revision reconnect model.

### Avoid for now

- generic rules DSL;
- fixed polymorphic policy hierarchy;
- event sourcing;
- D1/accounts/ranking before product need;
- client prediction;
- separate mobile rules/UI data model;
- separate server implementation of game rules.

## 10. Immediate next work

Evolve the proven infrastructure canary into a real **local MatchRoom** before any remote deployment.

Hard requirement:

`MatchRoom` must store/use the same canonical `MatchState`, call the same core reducer, and send each seat the same `SeatProjection + eventsForSeat` contract already used locally.

First protocol must include:

- `clientCommandId`;
- `expectedRevision`;
- idempotent duplicate handling;
- seat-bound command authorization;
- persistent accepted state;
- per-seat projections/events;
- reconnect snapshot;
- WebSocket hibernation.

Do not let `next-hand` accidentally become arbitrary client authority. The current domain command has no seat; online hand advancement needs an explicit server/system policy before exposing it remotely.

After MatchRoom passes local workerd tests, reassess the smallest safe route to a real Cloudflare deployment. Further rule research remains demand-driven by concrete unresolved scenarios or failing tests.
