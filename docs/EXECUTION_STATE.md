# Execution state — live truth

Date: 2026-09-12
Status: **Foundation Run 01 complete. Run 02 is active: rules truth + Owner-playable gameplay.**

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

First target: **`PLAYOK_3P_800_CANDIDATE` v3**. See `docs/rules/PLAYOK_3P_800_CANDIDATE.md`.

Executable behavior proves our candidate implementation, not exact PlayOK identity. Evidence labels remain: `documented` / `reference-observed` / `pinned` / `executable`.

### Run 02 slices already defended

**Bomb — PASS as candidate implementation**

- declarer may bomb in the pinned post-talon / pre-exchange window;
- first bomb per player is free; later bombs award +60 to eligible opponents;
- ordinary 800-lock currently applies to those awards;
- bomb count persists across hands;
- causal completion/event/UI path exists;
- desktop and 390 px mobile Chrome coverage is mandatory.

Kurnik documents bomb existence and first-free/later-60 scoring. Exact timing, counter scope and 800 interaction remain PlayOK-reference-sensitive pins.

**Four nines — PASS as candidate implementation**

- evaluated after exchange and before final contract;
- a fourth nine received from the declarer counts;
- eligible seat privately chooses redeal or continue;
- continuing does not explicitly reveal the four nines or choice to other seats;
- redeal preserves score, bomb counters, hand number and same dealer;
- bots take the neutral redeal when eligible;
- desktop and 390 px mobile privacy/interaction coverage is mandatory.

Kurnik documents the optional four-nines redeal. Post-exchange timing, received-fourth-nine eligibility and same-dealer behavior are corroborated by Pagat and remain PlayOK-reference-sensitive until directly observed.

### Material rules still open

- strict trick obligation reference check: follow / beat / trump / overtrump;
- post-musik final-contract ceiling (current conservative pin remains `120 + marriages still held`);
- transfer visibility;
- marriage scoring when the declarer melds but captures no trick;
- Kurnik's unified musik/last-trick wording in 3P;
- remaining bomb/four-nines reference validation.

Current priority is **strict trick legality**, because it affects normal play continuously rather than only rare edge cases.

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

Executable privacy tests serialize projections/legal commands and prove hidden opponent/talon identities do not leak. Four-nines adds an asymmetric private decision without exposing the reason through another seat's projection/legal commands.

Accepted commands emit transient typed `GameEvent[]`, audience-filtered through `eventsForSeat()`. These are presentation/protocol facts, not event sourcing.

### Desktop/mobile presentation — PASS as foundation

One `GameTable` consumes a `SeatProjection` and emits commands. It does not know whether authority is local or remote and does not assume human seat 0.

Mandatory Chrome CI covers desktop **1440 x 1000** and mobile **390 x 844**, including defender/declarer/non-zero-seat paths, forced auction, musik/exchange/contract/trick, bomb, four-nines private decision/waiting/redeal, 7/8/10-card hands, navigation and reconnect without horizontal overflow.

Current visual design remains intentionally provisional.

### Bot — ADEQUATE foundation

The product bot only sees its seat observation, legal commands and public rules.

Fixed 40-match survey baseline:

- average 32.4 hands;
- maximum 49;
- voluntary contract success 61.3%;
- forced-100 success 39.4%;
- no non-terminating match.

Further tuning should be driven primarily by human gameplay evidence.

### MatchRoom authority / identity — PASS

One SQLite-backed Durable Object `MatchRoom` is authoritative online state.

It persists canonical state + bounded idempotency receipts, invokes the same reducer/invariants, rejects stale/misbound commands, sends only seat projections + audience-filtered events, survives eviction with hibernating WebSockets and settles bot-owned seats server-side.

Accountless room lifecycle:

- `solo`: human + 2 bots;
- `duo`: 2 humans + bot;
- `trio`: 3 humans;
- shareable 12-character room code is not seat authority;
- each human seat receives an opaque reconnect capability;
- only SHA-256 token hashes are persisted;
- share URLs contain only `?room=CODE`;
- same-origin WebSocket origin is enforced.

### Persisted historical matches — PASS compatibility boundary

Profile snapshots remain pinned to the rules version with which a match started.

Executable legacy-snapshot coverage verifies:

- a v1-style persisted state lacking bomb-era structural fields can still project/reconnect and accept a normal command;
- a v1 match does not retroactively gain bomb behavior;
- a v2 match does not retroactively gain four-nines behavior;
- missing later structural fields are normalized to neutral defaults without changing the historical profile version.

This is structural compatibility, **not** migration of old matches to current rules.

### Real browser -> MatchRoom — LOCAL PASS

Normal `/` uses the real room flow; deterministic local authority remains QA-only.

Mandatory remote Chrome smoke proves solo desktop/mobile command/reconnect and duo desktop host + mobile joiner with independent credentials, hidden hands and synchronized revisions.

### Cloudflare public edge — PASS

Temporary Foundation Preview run:

- GitHub Actions run: `34701391964`;
- tested commit: `6420423870e2905b63673c656a755ee3363f8cee`;
- deployment + public desktop/mobile Chrome MatchRoom smoke: PASS;
- refresh/reconnect restored the same room/revision.

The temporary deployment was deliberately unclaimed. This proves the Worker + Durable Object + assets + WebSocket/browser boundary outside local workerd, not long-duration production reliability.

## CI / deployment gates — PASS

Normal Foundation CI now gates:

`core (including bomb/four-nines/legacy snapshots) -> worker -> local browser -> remote browser -> navigation browser -> bomb/four-nines desktop+mobile browser -> deploy-helper security smoke -> production build -> wrangler deploy --dry-run`

No automatic push-to-production path exists.

Latest defended `main` after four-nines merge:

- squash commit: `9a06567468efc0f9d70ec6d2e8d66e42e6142eb7`;
- post-merge Foundation run: `34711285197` / run #159;
- result: **PASS**.

## Still NOT proven

- exact PlayOK identity for remaining reference-sensitive rule probes;
- real Owner/target-player gameplay quality;
- whether the current bot is enjoyable/credible enough under human play;
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
- pinned rules snapshots + backward structural compatibility;
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

1. attack strict trick legality first: independently research and try to reference-probe the PlayOK/Kurnik behavior before changing the current pin;
2. keep unresolved source ambiguity explicit rather than silently averaging Polish variants;
3. once high-frequency rule truth is sufficiently bounded, shift quickly toward complete solo Owner gameplay on desktop and mobile;
4. fix causal-feedback/interaction blockers found by play, not by premature visual redesign;
5. use real-human duo/trio once the rules/gameplay loop is coherent enough for useful feedback;
6. test physical phone suspension/background/network resilience before permanent deployment is treated as operationally ready.

Foundation architecture is no longer the main research question. The current question is whether the game is **correct enough, understandable enough and enjoyable enough** for serious play.