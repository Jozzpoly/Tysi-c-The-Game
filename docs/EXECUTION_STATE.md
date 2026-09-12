# Execution state — live truth

Date: 2026-09-12
Status: **Foundation Run 01 complete; local and public MatchRoom/browser boundaries are proven. Run 02 is gameplay/rules/product hardening.**

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

## Foundation Run 01 — COMPLETE

### Core — PASS

Pure TypeScript domain core is independent of React and Cloudflare.

Proven:

- deterministic seeded shuffle and reproducible complete matches;
- complete `deal -> auction -> musik -> exchange -> contract -> 8 tricks -> score -> next hand -> match` state machine;
- one canonical legality path and rejection reasons;
- candidate rule scenarios and invariants;
- card identity/conservation and score accounting;
- explicit seat actor on every client command;
- humans, local bots and server bots use the same command model.

### Projection / feedback — PASS

Canonical client game-state boundary:

`MatchState -> projectSeat(seat) -> SeatProjection { profile, observation, legalCommands }`

Executable privacy tests serialize projections/legal commands and prove hidden opponent/talon identities do not leak.

Accepted commands emit transient typed `GameEvent[]`, audience-filtered through `eventsForSeat()`. These are presentation/protocol facts, not event sourcing.

### Desktop/mobile presentation — PASS as foundation

One `GameTable` consumes a `SeatProjection` and emits commands. It does not know whether authority is local or remote and does not assume human seat 0.

Mandatory Chrome CI covers:

- desktop **1440 x 1000**;
- mobile **390 x 844**;
- defender/declarer/non-zero-seat paths;
- forced auction;
- musik/exchange/contract/trick phases;
- 7/8/10-card hands without horizontal overflow;
- Back/Forward navigation and explicit leave/reconnect path.

Current visual design remains intentionally provisional.

### Bot — ADEQUATE foundation

The product bot only sees its seat observation, legal commands and public rules.

Fixed 40-match survey:

- average 32.4 hands;
- maximum 49;
- voluntary contract success 61.3%;
- forced-100 success 39.4%;
- no non-terminating match.

Further tuning should be driven primarily by human gameplay evidence.

### MatchRoom authority / identity — PASS

One SQLite-backed Durable Object `MatchRoom` is authoritative online state.

It:

- persists canonical `MatchState` and bounded idempotency receipts;
- invokes the same reducer/invariants as local play;
- uses `{ clientCommandId, expectedRevision, command }`;
- rejects stale revisions, command-id misuse and seat mismatches;
- sends only seat projections + audience-filtered events;
- survives Durable Object eviction with hibernating WebSockets;
- runs bot-owned seats server-side until the next human decision.

Accountless room lifecycle:

- `solo`: human + 2 bots;
- `duo`: 2 humans + bot;
- `trio`: 3 humans;
- 12-character room code is shareable but is not seat authority;
- each human seat receives an opaque ~256-bit reconnect token;
- only SHA-256 token hashes are persisted;
- HTTP uses Bearer capability;
- browser WS uses `tysiac.v1` plus a credential subprotocol; server echoes only `tysiac.v1`;
- share URLs contain only `?room=CODE`;
- same-origin WebSocket origin is enforced.

Worker/workerd suite: **14/14 PASS** across lifecycle, privacy, concurrency, idempotency, bots, eviction/hibernation and HTTP/WS routing.

### Real browser -> MatchRoom — LOCAL PASS

Normal `/` uses the real room flow; deterministic local authority remains QA-only.

Mandatory remote Chrome smoke proves:

- solo desktop and mobile create/command/reconnect;
- server bot settling;
- duo desktop host + mobile joiner with independent credentials and disjoint private hands;
- synchronized revision stream;
- tokens remain out of ordinary URLs/DOM;
- mobile/desktop presentation remains within layout contracts.

### Cloudflare public edge — PASS

**Temporary Foundation Preview run #1**

- GitHub Actions run: `34701391964`
- tested commit: `6420423870e2905b63673c656a755ee3363f8cee`
- temporary public endpoint used for the proof: `https://tysiac-the-game.intriguing-popcorn.workers.dev`
- deployment itself: PASS
- public Chrome smoke: PASS
- evidence artifact: `temporary-public-smoke-34701391964`

The public test used two real Chrome sessions against the Cloudflare `workers.dev` edge:

- desktop host created a real `duo` room;
- 390 x 844 mobile joiner entered through the share URL and received a distinct private credential;
- both hands remained private/disjoint;
- one legal auction command crossed the public WebSocket path and both sessions converged on revision **2**;
- refresh/reconnect restored revision **2** with the same room/credential;
- public desktop/mobile screenshots were captured.

The deployment was deliberately **temporary and unclaimed**. Its URL is ephemeral and is not the permanent product deployment.

This is sufficient evidence that the actual Cloudflare Worker + Durable Object + assets + WebSocket/browser boundary works outside local workerd. It does **not** prove long-duration production reliability or real physical mobile-network behavior.

## CI / deployment gates — PASS

Normal Foundation CI gates:

`core -> worker -> local browser -> remote browser -> navigation browser -> deploy-helper security smoke -> production build -> wrangler deploy --dry-run`

Deployment helpers also include:

- manual credentialed permanent deploy workflow;
- manual temporary-preview workflow;
- post-deploy public Chrome verifier;
- executable redaction test proving Cloudflare claim credentials are not emitted by the temporary helper.

No automatic push-to-production path exists.

## Still NOT proven

These move into Run 02+ rather than keeping Foundation Run 01 open:

- exact PlayOK identity for unresolved rule probes;
- bomb / four-nines behavior and other not-yet-implemented rule-sensitive paths;
- real Owner/target-player gameplay quality;
- long-duration room soak;
- actual phone suspension/backgrounding and weak/mobile-network transitions;
- permanent Cloudflare account deployment/operational lifecycle;
- final visual quality, animation, audio/haptics and accessibility polish.

## Architecture to preserve

Keep:

- pure deterministic domain core;
- one legality/reducer implementation;
- `SeatProjection` as the human client state boundary;
- typed scoped feedback events;
- one `GameTable` for local and remote authority;
- server-authoritative hidden state;
- one Durable Object per table;
- snapshot/revision reconnect model;
- accountless capability identity until product need justifies accounts;
- desktop and mobile as equal product targets.

Avoid for now:

- generic rules DSL/policy framework;
- event sourcing;
- D1/accounts/rankings without product need;
- client prediction;
- separate mobile game-state model;
- duplicated server rules.

## Run 02 — immediate direction

Move from infrastructure proof to **game/product truth**:

1. perform a broader critical rules audit and resolve the highest-risk PlayOK-sensitive probes with evidence;
2. implement missing rule paths only when the target profile actually requires them;
3. make complete solo matches comfortable enough for Owner gameplay, without premature visual finalization;
4. deepen feedback/history/explanation where it materially helps understand what happened;
5. run real Owner gameplay on desktop and mobile and treat findings as the primary product signal;
6. use duo/trio with real humans once the rules/gameplay loop is coherent enough to make their feedback meaningful;
7. test reconnect/background/network resilience on real devices before permanent deployment is treated as operationally ready.

Foundation architecture is no longer the main research question. The next question is whether the game is **correct enough, understandable enough and enjoyable enough** to deserve deeper polish.