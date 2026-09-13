# Execution state — live truth

Date: 2026-09-13
Status: **Foundation Run 01 complete. Run 02 now uses two parallel evidence tracks: game truth and Owner-led experience truth.**

This is the compact execution authority. Earlier plans/handoffs are historical where they conflict with this file or executable evidence.

## Product target

Build a small, high-quality browser Tysiąc table that is frictionless to open and good enough to use with real people.

- 3-player auction Tysiąc first.
- Desktop and mobile are equal product targets.
- Private table by link/code, without mandatory accounts.
- Solo = human + 2 bots; duo = 2 humans + bot; trio = 3 humans.
- Refresh/reconnect/mobile suspension are normal lifecycle requirements.
- Later support several real Tysiąc rule families without becoming a generic rules DSL.

The presentation is still provisional, but experience work is **not deferred** until every gameplay/rule uncertainty is solved.

## Evidence model — live contract

The project no longer uses the linear model:

`automation -> Owner validates gameplay -> visual polish`

That model was invalid because the Owner does not know Tysiąc well enough to judge rule identity, strategic bot quality or authentic gameplay.

### Track A — game truth

Questions:

- are rules, legality and scoring right for the named profile?
- does authority preserve hidden information and lifecycle invariants?
- are bots strategically credible enough?
- does the game feel authentic to knowledgeable Tysiąc players?

Evidence:

- documented sources;
- reference implementation probes;
- explicit reversible project pins;
- executable scenarios/invariants/simulations;
- knowledgeable Tysiąc-player/domain sessions.

Owner approval, silence or enjoyment does **not** certify this track.

### Track B — experience truth

Questions:

- is information visually clear and well composed?
- do mouse/touch interactions feel reliable and intentional?
- are actions and consequences perceptible?
- does pacing/motion/feedback feel right?
- do desktop and mobile each feel natural?
- does onboarding communicate enough?
- does the product progressively feel professional?

The Owner is the primary judgement source here. Natural reactions, recordings and screenshots are first-class evidence.

Owner confusion is UX evidence, but first classify whether it is domain unfamiliarity, communication failure, interaction failure or presentation judgement.

Automation may defend measurable UX mechanics; it cannot certify taste, clarity or feel.

Both tracks may advance concurrently as long as presentation remains downstream of canonical game projections/events and does not duplicate authority or hard-code uncertain rule semantics irreversibly.

## Rules — candidate, not canonical

First target remains **`PLAYOK_3P_800_CANDIDATE` v3**. See `docs/rules/PLAYOK_3P_800_CANDIDATE.md`.

Executable behavior proves our candidate implementation, not exact PlayOK identity. Evidence labels remain `documented` / `reference-observed` / `pinned` / `executable`.

### Defended candidate slices

**Bomb — PASS as candidate implementation**

- pinned post-talon / pre-exchange window;
- first bomb per player free; later bombs award +60 to eligible opponents;
- ordinary 800-lock currently applies to those awards;
- bomb count persists across hands;
- causal completion/event/UI path exists.

Exact reference timing/counter/800 details remain evidence-sensitive.

**Four nines — PASS as candidate implementation**

- evaluated after exchange and before final contract;
- a fourth nine received from the declarer counts;
- eligible seat privately chooses redeal or continue;
- continuing does not explicitly reveal the hand/choice;
- redeal preserves score, bomb counters, hand number and same dealer;
- historical snapshots remain compatible.

Several details remain reference-sensitive.

**Trick legality — PASS as reversible candidate behavior**

Current pin:

`follow suit -> beat in led suit when possible -> trump when void -> overtrump when required and possible`.

This is executable and explicitly configurable where documented variants differ; it is not yet black-box PlayOK confirmation.

### Material game-truth probes still open

- exact PlayOK confirmation of strict trump / overtrump behavior;
- post-musik final-contract ceiling (current pin: `120 + marriages still held`);
- transfer visibility;
- marriage scoring when a meld is declared but no trick is captured;
- Kurnik's unified musik/last-trick wording in 3P;
- remaining bomb/four-nines reference validation.

These do not block Owner-led experience work.

## Core / authority foundation — PASS

Pure TypeScript core remains independent of React and Cloudflare.

Defended:

- deterministic seeded shuffle and reproducible complete matches;
- complete `deal -> auction -> musik -> exchange -> contract -> 8 tricks -> score -> next hand -> match` state machine;
- one canonical legality/reducer implementation;
- card identity/conservation and score accounting invariants;
- humans, local bots and server bots use the same command model;
- bot policy sees only its seat observation, legal commands and public rules.

The 40-match product-bot survey remains terminating and useful as automation evidence. It proves legality/termination characteristics, **not** strategic credibility or fun.

## Projection / feedback boundary — PASS

Canonical human-facing boundary:

`MatchState -> projectSeat(seat) -> SeatProjection`

Accepted commands emit audience-filtered typed `GameEvent[]`. These are presentation/protocol facts, not event sourcing.

Causal scoring summaries, first-play guidance and authoritative transition playback remain downstream of this boundary and reconnect-safe.

Preserve this separation while the presentation becomes more sophisticated.

## Remote MatchRoom / identity — PASS

One SQLite-backed Durable Object `MatchRoom` is authoritative online state.

It persists canonical state + bounded idempotency receipts, invokes the same reducer/invariants, rejects stale/misbound commands, sends only seat projections + scoped events, survives eviction with hibernating WebSockets and settles bot-owned seats server-side.

Accountless solo / duo / trio room lifecycle is defended. Room code is not seat authority; human seats use opaque reconnect capabilities whose hashes are persisted. Share URLs contain only the room code and same-origin WebSocket origin is enforced.

Server authority stays fast; client presentation queues already-authoritative frames for observable bot actions. No server sleeps, client prediction or reconstructed state-diff authority.

## Browser / long-path foundation — PASS

Normal `/` uses the real remote room flow; deterministic local authority remains QA-only.

Mandatory Foundation CI covers:

- core/rule smoke + worker tests;
- desktop 1440×1000 and mobile 390×844 Chrome;
- solo/duo identity and hidden hands;
- auction/exchange/contract/trick;
- bomb/four-nines/scoring/first-play guidance;
- transition pacing;
- full remote solo matches on desktop and mobile;
- reconnect/navigation;
- build + Wrangler deploy dry-run.

Public Cloudflare edge feasibility is also proven through temporary preview workflows with desktop↔mobile room sync and reconnect smoke. Temporary previews are deliberately ephemeral; they are not a durable production surface.

## Experience track — first Owner-derived slice PASS

### Mobile touch hardening

Owner play exposed a high-signal experience defect: mobile taps felt unreliable/unintuitive and browser text selection could happen instead of the intended action.

PR #11 converted that reaction into a bounded presentation-only change:

- coarse-pointer buttons/cards disable accidental text selection/callout and use manipulation touch behavior;
- mobile controls defend >=44 px touch targets;
- dense auction/contract choices remain directly available;
- temporary 10-card exchange hand uses a 5×2 composition rather than tiny overlapping hit regions;
- the empty trick area compresses during exchange so both rows remain directly visible/hittable;
- real CDP touch exercises auction -> exchange -> contract -> card play;
- hit-testing verifies every exchange-card center addresses the intended card.

Defending PR run **Foundation #200** (`34730562259`) on head `85cd128…`:

- full Foundation gate: **PASS**;
- mobile touch browser smoke: **PASS**;
- 10 exchange cards;
- minimum card geometry: `52 × 76.47 px`;
- minimum same-row center spacing: `60 px`;
- `exchangeCentersHitCorrectCard = true`.

Squash merged as:

- `main`: **`5cf323b673ae4f8c2586645c3501ddd2bc1c58c4`**;
- post-merge Foundation run: **`34730732345` / #201**;
- result: **PASS**.

A parallel PR run #199 failed once because the long rehearsal observed a desktop `innerWidth` of 1425 instead of an exact expected 1440. The identical head passed the complete rehearsal in #200 and post-merge #201. Treat exact viewport equality as possible harness/flakiness debt if it recurs; there is no current product-regression finding from that event.

## What remains unproven

### Game truth

- exact PlayOK identity for remaining reference-sensitive pins;
- strategic credibility/enjoyment of the bot to knowledgeable Tysiąc players;
- authentic complete-match gameplay quality;
- real-human knowledgeable duo/trio gameplay quality.

### Experience truth

- whether current visual hierarchy/composition is good enough rather than merely functional;
- whether transition timing actually feels right to the Owner;
- whether causal explanations are useful in real use rather than merely present;
- professional card/table art direction;
- motion/animation/audio/haptics quality;
- broader accessibility quality;
- physical-device ergonomics beyond browser emulation.

### Operations/integration

- long-duration room soak;
- actual phone suspension/backgrounding and weak/mobile-network transitions;
- durable public deployment lifecycle;
- repeated real-human sessions through the public product path.

## Architecture to preserve

Keep:

- pure deterministic core;
- one legality/reducer;
- `SeatProjection` human boundary;
- scoped feedback events;
- one `GameTable` across local/remote authority;
- server-authoritative hidden state;
- one Durable Object per table;
- pinned rule snapshots;
- snapshot/revision reconnect;
- accountless capability identity;
- equal desktop/mobile product priority;
- fast authority + client-side presentation pacing.

Avoid generic rules DSL, event sourcing, duplicated server/client rules, client prediction, server sleeps for visuals and a separate mobile game state.

Professional presentation may become substantially richer without weakening these boundaries.

## Immediate direction

Run 02 is now explicitly dual-track.

### Experience loop

1. Publish the latest defended `main` to a fresh temporary Owner Preview when the next test is needed.
2. Let the Owner use desktop and real phone naturally and judge **visuals, interaction, feedback, hierarchy, motion/pacing and overall feel**.
3. Do not ask the Owner to certify Tysiąc rules or bot strategy.
4. Translate high-signal reactions into small reversible experience slices with mechanical tests where appropriate.
5. Begin raising presentation quality continuously; do not wait for complete rule certainty before improving the experience foundation.
6. Avoid expensive/final art commitments where open game semantics could make them premature.

### Game-truth loop

1. Continue resolving or bounding the material reference-sensitive rule probes independently of Owner play.
2. Design stronger bot/gameplay evaluation that does not mistake self-play legality for strategic quality.
3. Bring knowledgeable Tysiąc players/domain feedback into the questions that genuinely require human game expertise.
4. Use real-human duo/trio sessions when they can evaluate gameplay rather than infrastructure.

The next major evidence should therefore come from **both** loops, not from pretending one Owner play session can validate the entire game.