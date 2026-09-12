# Execution state — live truth

Date: 2026-09-12
Status: **Foundation Run 01 complete. Run 02 is now at human Owner-play readiness.**

This is the compact execution truth. Earlier plans/history are not authority where they conflict with executable evidence here.

## Product target

Build a small, high-quality browser Tysiąc table that is frictionless to open and good enough to use with real people.

- 3-player auction Tysiąc first.
- Desktop and mobile are equal product targets.
- Private table by link/code, without mandatory accounts.
- Solo = human + 2 bots; duo = 2 humans + bot; trio = 3 humans.
- Refresh/reconnect/mobile suspension are normal lifecycle requirements.
- Later support several real Tysiąc rule families without becoming a generic rules DSL.

Current visuals remain deliberately provisional. The main product question is now whether the game is understandable and enjoyable to a real human through complete matches.

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

Exact PlayOK timing, counter scope and 800 interaction remain reference-sensitive pins.

**Four nines — PASS as candidate implementation**

- evaluated after exchange and before final contract;
- a fourth nine received from the declarer counts;
- eligible seat privately chooses redeal or continue;
- continuing does not explicitly reveal the four nines or choice to other seats;
- redeal preserves score, bomb counters, hand number and same dealer;
- desktop/mobile privacy and interaction coverage is mandatory;
- persisted pre-four-nines snapshots do not retroactively gain the rule.

Timing/received-card/same-dealer details remain PlayOK-reference-sensitive until directly observed.

**Trick legality — PASS as reversible candidate behavior**

Current candidate remains strict:

`follow suit -> beat in led suit when possible -> trump when void -> overtrump when required and possible`.

This is still a project pin, not PlayOK black-box confirmation. These obligations are explicit executable rule fields; falsification coverage proves looser documented variants can be represented without rewriting the legality engine.

### Material rule probes still open

- exact PlayOK confirmation of strict trump / overtrump behavior;
- post-musik final-contract ceiling (current pin: `120 + marriages still held`);
- transfer visibility;
- marriage scoring when a meld is declared but no trick is captured;
- Kurnik's unified musik/last-trick wording in 3P;
- remaining bomb/four-nines reference validation.

These no longer justify postponing human gameplay. New evidence may change a pin; the architecture is ready for that without broad redesign.

## Core / authority foundation — PASS

Pure TypeScript core is independent of React and Cloudflare.

Proven:

- deterministic seeded shuffle and reproducible complete matches;
- complete `deal -> auction -> musik -> exchange -> contract -> 8 tricks -> score -> next hand -> match` state machine;
- one canonical legality/reducer implementation;
- card identity/conservation and score accounting invariants;
- humans, local bots and server bots use the same command model;
- bot policy sees only its seat observation, legal commands and public rules.

Mandatory 40-match bot survey remains terminating: average 32.5 hands, maximum 55, voluntary contract success 61.6%, forced-100 success 39.9%, no non-terminating match.

Bot quality is **ADEQUATE for Owner testing**, not declared final or fun.

## Projection / feedback — PASS

Canonical human-facing boundary:

`MatchState -> projectSeat(seat) -> SeatProjection`.

Executable privacy tests prove hidden opponent/talon identities do not leak. Accepted commands emit audience-filtered typed `GameEvent[]`; these are presentation/protocol facts, not event sourcing.

### Causal scoring — PASS

Completed normal hands expose a derived public `scoreSummary` through `SeatProjection` rather than duplicating persisted scoring state.

It explains card/marriage points, raw hand points, score delta, defender rounding, 800-lock, declarer contract and success/failure. Reconnect reconstructs the same explanation. Bombs retain separate bomb-specific semantics. Desktop and true 390 x 844 mobile Chrome coverage is mandatory.

## Remote MatchRoom / identity — PASS

One SQLite-backed Durable Object `MatchRoom` is authoritative online state.

It persists canonical state + bounded idempotency receipts, invokes the same reducer/invariants, rejects stale/misbound commands, sends only seat projections + scoped events, survives eviction with hibernating WebSockets and settles bot-owned seats server-side.

Accountless room lifecycle is defended for solo / duo / trio. Room code is not seat authority; human seats use opaque reconnect capabilities whose hashes are persisted. Share URLs contain only the room code and same-origin WebSocket origin is enforced.

### Remote transition playback — PASS

Server bot settling remains immediate. The client queues already-authoritative projection/event frames so bot moves remain visible at human speed.

Current first-pass pacing: ordinary transition ~480 ms, marriage ~680 ms, completed trick ~900 ms. Input is locked while rendered state trails authority. Reconnect/snapshot cancels historical playback and snaps to current authority.

Chrome timing evidence proves separately visible revisions and no stale-input window. No server-side sleeps, client prediction or reconstructed state diffs were introduced.

## Persisted historical matches — PASS compatibility boundary

Profile snapshots remain pinned to the rules version with which a match started. Pre-bomb / pre-four-nines states can still project, reconnect and accept normal commands without retroactively gaining newer rules. Missing later structural fields normalize to neutral defaults.

This is structural compatibility, not migration of old matches to current rules.

## Browser / Cloudflare evidence

### Local real browser -> MatchRoom — PASS

Normal `/` uses the real remote room flow; deterministic local authority remains QA-only.

Mandatory browser CI covers desktop 1440 x 1000 and true mobile 390 x 844, solo/duo identity paths, hidden hands, authoritative revisions, auction/exchange/contract/trick, bomb, four nines, causal scoring, transition pacing, navigation/reconnect and guarded horizontal layout safety.

### Complete remote solo rehearsal — PASS

PR #8 added a production-shaped long-path browser gate using only currently enabled human UI actions. It does not call the core directly or inspect hidden state. Presentation timers are accelerated only inside this harness; real pacing remains independently tested.

Defending Foundation #180 (`34717657974`) completed both full matches:

- **desktop 1440 x 1000:** revision 1061, 35 completed hands, 369 human decisions, 288 card plays, 6 marriages, 1 mid-match reconnect, final `480 / 1060 / 810`;
- **mobile 390 x 844:** revision 1120, 37 completed hands, 384 human decisions, 304 card plays, 5 marriages, 1 mid-match reconnect, final `870 / 840 / 1020`.

Both reached genuine match-complete UI at >=1000, preserved monotonic visible authority, survived reconnect and stayed within guarded horizontal layout bounds.

This proves **long-path executable play**, not human comprehension, strategy quality or fun.

### Cloudflare public edge — PASS as feasibility proof

Temporary Foundation Preview run `34701391964` tested commit `6420423870e2905b63673c656a755ee3363f8cee` on the real Cloudflare edge with desktop + mobile Chrome, duo room, private credentials, command synchronization and refresh/reconnect.

The deployment was intentionally temporary/unclaimed. This proves the Worker + Durable Object + assets + WebSocket boundary outside local workerd, not long-duration production operations.

## CI / latest defended main

Normal Foundation gate now includes:

`core -> worker -> local browser -> remote browser -> real playback timing -> full remote solo desktop+mobile rehearsal -> navigation -> bomb/four-nines/scoring browser -> deploy-helper smoke -> production build -> wrangler deploy --dry-run`.

The long-path rehearsal currently adds about 70 seconds for two complete matches. Keep it mandatory while regression value exceeds iteration cost; split it deliberately later if it becomes a material drag.

No automatic push-to-production path exists.

Latest defended `main`:

- squash commit: **`43d1de17b8af0fe6f143ee63d6ef281c732d42c1`**;
- post-merge Foundation run: **`34717851621` / #181**;
- result: **PASS**.

## Still NOT proven

- real Owner/human gameplay quality through complete matches;
- whether current transition delays feel right rather than merely being observable;
- whether current bot is enjoyable/credible under human play;
- whether a player unfamiliar with Tysiąc has enough in-product explanation to understand decisions;
- exact PlayOK identity for remaining reference-sensitive pins;
- real-human full duo/trio gameplay quality;
- long-duration room soak;
- actual physical phone suspension/backgrounding and weak/mobile-network transitions;
- permanent Cloudflare deployment/operational lifecycle;
- final visual quality, animation, audio/haptics and accessibility polish.

## Architecture to preserve

Keep the pure deterministic core, one legality/reducer, `SeatProjection` human boundary, scoped feedback events, one `GameTable` for local/remote authority, server-authoritative hidden state, one Durable Object per table, pinned rule snapshots, snapshot/revision reconnect, accountless capability identity, equal desktop/mobile targets and fast server authority with client-side presentation pacing.

Avoid generic rules DSL, event sourcing, accounts/rankings without need, client prediction, server sleeps for visuals, separate mobile state and duplicated server rules.

## Run 02 — immediate direction

**Automated full-match readiness is defended. The next bounded stage is first human Owner play.**

1. Remove only obvious comprehension blockers for a player who does not already know Tysiąc: compact always-available rules help plus minimal context at the moment of a decision.
2. Do not redesign the table; current desktop/mobile composition is adequate for the first serious play pass.
3. Put the same remote product path in front of the Owner on desktop and mobile and play complete matches.
4. Treat observed confusion, pacing, bot behavior and scoring comprehension as primary evidence; tune from that rather than from additional speculative architecture work.
5. Preserve unresolved rule pins explicitly and change them only from stronger reference or gameplay evidence.
6. Move to real-human duo/trio once solo feedback is about the game rather than missing explanation/basic UX.

The project no longer needs proof that a full match can run. It needs proof that a human can **understand it, make intentional decisions and want to keep playing**.
