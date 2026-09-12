# Execution state — live truth

Date: 2026-09-12
Status: **Foundation Run 01 is strongly proven end-to-end locally; real Cloudflare deployment remains the main unproven boundary**

This is the compact execution truth. Earlier plans/history are not authority where they conflict with executable evidence here.

## Product target

Build a small, high-quality browser Tysiąc table that is frictionless to open and good enough to use with real people.

- 3-player auction Tysiąc first.
- Desktop and mobile are equal product targets.
- Private table by link/code, without mandatory accounts.
- Solo = human + 2 bots; duo = 2 humans + bot; trio = 3 humans.
- Refresh/reconnect/mobile suspension are normal lifecycle requirements.
- Later support several real Tysiąc rule families without becoming a generic rules DSL.

Visuals are still foundation quality. Architecture must remain friendly to later professional card art, animation, audio/haptics and richer feedback.

## Rules — candidate, not canonical

First target: **`PLAYOK_3P_800_CANDIDATE`**. See `docs/rules/PLAYOK_3P_800_CANDIDATE.md`.

Material PlayOK-sensitive questions remain explicit: transfer visibility, four-nines timing, post-musik contract ceiling, bomb semantics, strict trump/overtrump interpretation, zero-trick marriage scoring and Kurnik's unified musik wording.

Executable behavior proves our candidate implementation, not exact PlayOK identity.

## Core — PASS

Pure TypeScript domain core is independent of React and Cloudflare.

Proven:

- deterministic seeded shuffle and reproducible complete matches;
- complete `deal -> auction -> musik -> exchange -> contract -> 8 tricks -> score -> next hand -> match` state machine;
- one canonical legality path and rejection reasons;
- candidate rule scenarios and invariants;
- card identity/conservation and score accounting;
- explicit seat actor on every client command, including `next-hand`;
- humans, local bots and server bots use the same command model.

## Projection / feedback boundary — PASS

Canonical human client boundary:

`MatchState -> projectSeat(seat) -> SeatProjection { profile, observation, legalCommands }`

Executable privacy tests prove that hidden opponent/talon identities do not leak through the projection, including legal commands.

Accepted commands emit transient typed `GameEvent[]`, filtered through `eventsForSeat()`. These events are presentation/protocol feedback, **not event sourcing**. Canonical authority remains `MatchState`; reconnect uses a fresh projection.

## GameTable / responsive presentation — PASS as foundation

`GameTable` consumes only a seat projection + presentation labels/message and emits commands. It does not know whether authority is local or remote and does not assume human seat 0.

Chrome CI enforces:

- desktop **1440 x 1000**;
- mobile **390 x 844**;
- defender, declarer and non-zero-seat local paths;
- 7/8/10-card hands without page or hand horizontal overflow;
- distinct marriage actions such as `Melduj Q♦` and `Melduj K♦`;
- forced-auction UI even when `Pas` is unavailable.

Current art/layout is intentionally provisional.

## Bot — ADEQUATE foundation

Product bot sees only its seat observation, legal commands and public rules.

Fixed 40-match survey:

- average 32.4 hands;
- maximum 49;
- voluntary contract success 61.3%;
- forced-100 success 39.4%;
- no non-terminating match.

Further tuning should be driven by human gameplay, not self-play overfitting.

## MatchRoom authority / identity — PASS locally

There is one room authority: **`MatchRoom`** backed by a SQLite Durable Object.

It:

- persists canonical `MatchState` and bounded idempotency receipts;
- invokes the same reducer/invariants as local play;
- uses `{ clientCommandId, expectedRevision, command }`;
- rejects stale revisions, command-id misuse and seat mismatches;
- sends only seat projections + audience-filtered events;
- survives Durable Object eviction with hibernating WebSockets;
- runs bot-owned seats server-side until the next human decision.

Accountless room lifecycle is implemented:

- `solo`: human + 2 server bots, immediate start;
- `duo`: 2 humans + server bot;
- `trio`: 3 humans;
- 12-character shareable room code is **not** seat authority;
- each human receives an opaque ~256-bit reconnect token;
- only SHA-256 token hashes are persisted;
- HTTP uses Bearer capability;
- browser WebSocket uses `tysiac.v1` plus a credential subprotocol and the server echoes only `tysiac.v1`;
- share URLs contain only `?room=CODE`;
- old `?seat=` authority is removed;
- same-origin WebSocket origin is enforced.

Worker/workerd suite: **14/14 PASS** across lifecycle, privacy, server bots, concurrency, idempotency, eviction/hibernation and router HTTP/WS behavior.

## Real browser -> MatchRoom path — PASS locally

Normal `/` now enters the real room flow. Deterministic `?seed=`, `?seat=` or `?local=1` remain QA-only local paths.

`RemoteRoom` recovers the seat from its locally stored room credential, obtains an authenticated snapshot, opens the hibernating WebSocket and feeds the same `GameTable` used locally.

Mandatory Chrome remote smoke proves:

### Solo desktop

- create room through UI;
- token exists only in browser local storage, not URL/DOM;
- real WebSocket command advances revision **1 -> 6** after server bot settling;
- refresh restores the same room/credential at revision **6**.

### Solo mobile

Same path at 390 x 844: revision **1 -> 6 -> reconnect 6**, no horizontal overflow.

### Duo cross-device

- desktop host creates duo room;
- mobile 390 x 844 browser opens the share URL and initially owns no credential;
- join issues an independent seat credential;
- host sees `Ty / Gracz 2 / Bot 3`, joiner sees `Gracz 1 / Ty / Bot 3`;
- own hands are disjoint/private;
- one human UI command is received by both browser sessions on the shared revision stream.

This is local Vite/workerd + real Chrome evidence, not a production-network claim.

## Build/deployability — PASS / remote execution NOT PROVEN

Full Foundation CI currently gates:

`core -> worker -> local browser -> remote browser -> production build -> wrangler deploy --dry-run`

All are green on main after the remote-room work.

`wrangler deploy --dry-run` packages client assets, Worker and only the `MATCH_ROOM` Durable Object binding successfully.

### NOT YET PROVEN

- actual Cloudflare account deployment / public `workers.dev` execution;
- WAN/mobile-network behavior outside local workerd;
- real mobile suspension duration and reconnect under production networking;
- gameplay quality with Owner/real humans;
- unresolved PlayOK-specific reference probes.

## Small product debt now visible

Not architectural blockers:

- connection-status pill overlaps the mobile heading slightly;
- remote in-match flow needs an explicit safe route back to the start screen;
- browser Back/Forward should synchronize App route state (`popstate`);
- remote feedback naming should avoid a stale room-state closure over a long-lived socket;
- room/session lifecycle still needs real production soak/reconnect evidence after deployment.

## Architecture to preserve

Keep:

- pure domain core;
- one legality/reducer implementation;
- `SeatProjection` as human client game-state boundary;
- typed scoped feedback events;
- one `GameTable` for local and remote authority;
- server-authoritative hidden state;
- one Durable Object per table;
- snapshot/revision reconnect model;
- accountless capability identity unless product needs force accounts later.

Avoid for now:

- generic rules DSL/policy framework;
- event sourcing;
- D1/accounts/ranking without product need;
- client prediction;
- separate mobile game-state model;
- duplicated server rules.

## Immediate next work

1. Clean up the small remote-navigation/presentation debts without changing authority semantics.
2. Keep local + remote browser evidence mandatory.
3. Prepare the smallest safe real Cloudflare deployment path.
4. Do **not** call Foundation remotely proven until a real deployment and public-room/browser check exist.
5. Keep rule research demand-driven by concrete unresolved scenarios or failing gameplay/reference evidence.
