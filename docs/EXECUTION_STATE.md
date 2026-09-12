# Execution state — live truth

Date: 2026-09-12
Status: **Foundation Run 01 complete. Run 02 has crossed from foundation hardening into full Owner-play readiness.**

This is the compact execution truth. Earlier plans/history are not authority where they conflict with executable evidence here.

## Product target

Build a small, high-quality browser Tysiąc table that is frictionless to open and good enough to use with real people.

- 3-player auction Tysiąc first.
- Desktop and mobile are equal product targets.
- Private table by link/code, without mandatory accounts.
- Solo = human + 2 bots; duo = 2 humans + bot; trio = 3 humans.
- Refresh/reconnect/mobile suspension are normal lifecycle requirements.
- Later support several real Tysiąc rule families without becoming a generic rules DSL.

Current visuals remain deliberately provisional. The immediate product question is now whether the game is understandable and enjoyable through complete real matches, not whether the foundation can support them.

## Rules — candidate, not canonical

First target: **`PLAYOK_3P_800_CANDIDATE` v3**. See `docs/rules/PLAYOK_3P_800_CANDIDATE.md`.

Executable behavior proves our candidate implementation, not exact PlayOK identity. Evidence labels remain: `documented` / `reference-observed` / `pinned` / `executable`.

### Defended Run 02 rule slices

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
- desktop/mobile privacy and interaction coverage is mandatory;
- persisted pre-four-nines snapshots do not retroactively gain the rule.

Kurnik documents the optional four-nines redeal. Timing/received-card/same-dealer details are corroborated by Pagat and remain PlayOK-reference-sensitive until directly observed.

**Trick legality — PASS as reversible candidate behavior**

Current PlayOK candidate remains strict:

`follow suit -> beat in led suit when possible -> trump when void -> overtrump when required and possible`.

This is still a project pin, not PlayOK black-box confirmation. The important Run 02 hardening is that these obligations are now genuine executable rule fields rather than hard-coded assumptions. Mandatory falsification coverage proves documented Polish variants such as no-compulsory-trump can be expressed without rewriting the legality engine.

### Material rule probes still open

- exact PlayOK confirmation of strict trump / overtrump behavior;
- post-musik final-contract ceiling (current conservative pin remains `120 + marriages still held`);
- transfer visibility;
- marriage scoring when a meld is declared but no trick is captured;
- Kurnik's unified musik/last-trick wording in 3P;
- remaining bomb/four-nines reference validation.

These remain explicit, but they no longer justify postponing real Owner gameplay. New evidence may change a pin; the architecture is now ready for that change without broad redesign.

## Core / authority foundation — PASS

Pure TypeScript core is independent of React and Cloudflare.

Proven:

- deterministic seeded shuffle and reproducible complete matches;
- complete `deal -> auction -> musik -> exchange -> contract -> 8 tricks -> score -> next hand -> match` state machine;
- one canonical legality/reducer implementation;
- card identity/conservation and score accounting invariants;
- humans, local bots and server bots use the same command model;
- bot policy sees only its seat observation, legal commands and public rules.

Latest mandatory 40-match product-bot survey remains terminating:

- average 32.5 hands;
- maximum 55;
- voluntary contract success 61.6%;
- forced-100 success 39.9%;
- no non-terminating match.

Bot quality is **ADEQUATE for Owner testing**, not declared final or fun.

## Projection / feedback — PASS

Canonical human-facing boundary:

`MatchState -> projectSeat(seat) -> SeatProjection`.

Executable privacy tests prove hidden opponent/talon identities do not leak. Accepted commands emit audience-filtered typed `GameEvent[]`; these are presentation/protocol facts, not event sourcing.

### Causal scoring — PASS

Completed normal hands now expose a derived public `scoreSummary` through `SeatProjection` rather than duplicating persisted scoring state.

It explains, per player:

- card points;
- marriage points;
- raw hand points;
- score delta;
- defender rounding;
- defender 800-lock;
- declarer contract and whether it was made.

Reconnect reconstructs the same explanation from canonical state. Bombs retain their separate bomb-specific semantics. Desktop and true 390 x 844 mobile Chrome evidence is mandatory; mobile presents one readable player row at a time rather than squeezing three explanations side-by-side.

## Remote MatchRoom / identity — PASS

One SQLite-backed Durable Object `MatchRoom` is authoritative online state.

It:

- persists canonical `MatchState` + bounded idempotency receipts;
- invokes the same reducer/invariants as local play;
- rejects stale revisions, command-id misuse and seat mismatch;
- sends only seat projections + audience-filtered events;
- survives eviction with hibernating WebSockets;
- settles bot-owned seats server-side until the next human decision.

Accountless room lifecycle:

- solo / duo / trio as described above;
- shareable 12-character room code is not seat authority;
- each human seat gets an opaque reconnect capability;
- only SHA-256 token hashes are persisted;
- share URLs contain only `?room=CODE`;
- same-origin WebSocket origin is enforced.

### Remote transition playback — PASS

Server bot settling remains immediate and authoritative. `MatchRoom` already emits every real transition separately; `RemoteRoom` now queues those received projection/event frames for human-readable playback instead of collapsing several bot moves into milliseconds.

Current first-pass pacing:

- ordinary transition: about 480 ms;
- marriage: about 680 ms;
- completed trick: about 900 ms.

Input is locked while the rendered client is behind authority, preventing stale-revision double input. Reconnect/snapshot cancels historical playback and jumps directly to current authority rather than replaying stale history.

Mandatory Chrome timing evidence on the defended PR observed:

- first visible post-command revisions `2 -> 3`: **479.2 ms** apart;
- successive authoritative revisions remained separately visible through revision 6;
- `enabledActions = 0` throughout playback;
- after the queue drained at revision 6, `Twój ruch` returned with legal controls;
- existing reconnect smoke refreshed during playback and restored server revision 6 directly.

No server-side sleeps, client prediction or state reconstruction were introduced.

## Persisted historical matches — PASS compatibility boundary

Profile snapshots remain pinned to the rules version with which a match started.

Executable legacy coverage verifies pre-bomb / pre-four-nines persisted states can still project, reconnect and accept normal commands without retroactively gaining newer rules. Missing later structural fields normalize to neutral defaults.

This is structural compatibility, **not** migration of old matches to current rules.

## Browser / Cloudflare evidence

### Local real browser -> MatchRoom — PASS

Normal `/` uses the real remote room flow; deterministic local authority remains QA-only.

Mandatory browser CI covers:

- desktop 1440 x 1000;
- true mobile 390 x 844;
- solo command/reconnect;
- duo desktop host + mobile joiner;
- independent credentials and hidden hands;
- synchronized authoritative revisions;
- auction / exchange / contract / trick / bomb / four-nines / scoring paths;
- remote transition pacing;
- navigation and reconnect;
- no horizontal overflow in guarded layouts.

### Cloudflare public edge — PASS as feasibility proof

Temporary Foundation Preview run `34701391964` tested commit `6420423870e2905b63673c656a755ee3363f8cee` on the real Cloudflare edge with desktop + mobile Chrome, duo room, private credentials, command synchronization and refresh/reconnect.

The deployment was intentionally temporary/unclaimed. This proves the Worker + Durable Object + assets + WebSocket boundary outside local workerd, not long-duration production operations.

## CI / latest defended main

Normal Foundation gate now includes:

`core -> worker -> local browser -> remote browser -> remote playback timing -> navigation -> bomb/four-nines/scoring desktop+mobile browser -> deploy-helper security smoke -> production build -> wrangler deploy --dry-run`.

No automatic push-to-production path exists.

Latest defended `main`:

- squash commit: **`7f17a8adc53e3acdaba9a5b90eaae6adf1612534`**;
- post-merge Foundation run: **`34715872223` / #175**;
- result: **PASS**.

## Still NOT proven

- real Owner gameplay quality through complete matches;
- whether current transition delays actually *feel* right rather than merely being observable;
- whether current bot is enjoyable/credible under human play;
- whether a player unfamiliar with Tysiąc has enough in-product explanation to learn what decisions mean;
- exact PlayOK identity for remaining reference-sensitive pins;
- real-human full duo/trio gameplay quality;
- long-duration room soak;
- actual physical phone suspension/backgrounding and weak/mobile-network transitions;
- permanent Cloudflare deployment/operational lifecycle;
- final visual quality, animation, audio/haptics and accessibility polish.

## Architecture to preserve

Keep:

- pure deterministic domain core;
- one legality/reducer implementation;
- `SeatProjection` as human client boundary;
- typed scoped feedback events;
- one `GameTable` for local and remote authority;
- server-authoritative hidden state;
- one Durable Object per table;
- pinned rules snapshots + backward structural compatibility;
- snapshot/revision reconnect;
- accountless capability identity until product need justifies accounts;
- desktop and mobile as equal product targets;
- fast server authority with client-side presentation pacing.

Avoid for now:

- generic rules DSL/policy framework;
- event sourcing;
- D1/accounts/rankings without product need;
- client prediction;
- server sleeps for visual pacing;
- separate mobile game-state model;
- duplicated server rules.

## Run 02 — immediate direction

The next bounded stage is **complete remote solo gameplay rehearsal and Owner-play preparation**.

1. Drive real remote solo matches through the production-shaped browser/MatchRoom path rather than isolated phase fixtures.
2. Verify that complete matches terminate, scoring/next-hand transitions survive many hands, playback does not backlog or deadlock, and reconnect remains safe during long play.
3. Record interaction/pacing findings instead of prematurely redesigning visuals.
4. Fix only material blockers that would make Owner feedback noisy or misleading.
5. Then put the game in front of the Owner on desktop and mobile; treat that play as the primary signal for bot tuning, pacing, explanations and UX.
6. Use real-human duo/trio once solo play is coherent enough that multiplayer feedback is about the game rather than obvious foundation defects.

Foundation architecture is no longer the main research question. The project now needs evidence that the game is **actually understandable, playable and worth continuing to polish**.
