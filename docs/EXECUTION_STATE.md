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

The full remote rehearsal now distinguishes requested viewport width (`window.innerWidth`) from scrollbar-reduced content width and tests horizontal overflow against the content box. Its former global `120 s` whole-match cutoff was removed after the same head produced a valid **117.1 s / 549-decision / 53-hand** desktop PASS and a separate valid match crossed the old bound. Failure remains bounded by per-stage watchdogs, revision/progress checks, layout assertions, reconnect checks and the 1400-decision logical ceiling. This fixes harness flakiness without weakening game/progress assertions.

## Experience track — defended slices, Owner judgement still open

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

The former `1425 vs 1440` failure is no longer open debt: repeated evidence traced it to scrollbar gutter semantics, and the viewport/overflow assertions were corrected in PR #19.

### Visual table language + spatial trick feedback

Two bounded presentation slices now form the visual candidate baseline without moving game authority.

**PR #18 — table-language baseline**

- reduced dashboard/form-panel dominance;
- strengthened table/hand hierarchy and playable/selected/disabled card states;
- brought the hand composition closer to the table;
- preserved core, projection and authority boundaries.

Defending Foundation **#396: PASS**. Squash merged to `main` as **`ad92d9a0ae20093e22283a94a5df2d4b9fc63fb2`**.

**PR #19 — spatial trick + card-face feedback**

- played cards now map to stable human-relative positions: self / left opponent / right opponent;
- card arrival motion originates from the corresponding table side, with reduced-motion fallback;
- existing card faces gained secondary corner information and a subtle inner frame without committing to final artwork;
- viewport/overflow rehearsal semantics were corrected;
- the redundant whole-match wall-clock cutoff was removed after direct flakiness evidence.

Final PR head **`4a472c8bbca4e29c42bdcadccacd96f61eff951a`**: Foundation **#400 PASS**.
Squash merged to current baseline `main` **`2590002e07e96eae3a9aa3b8ba2a87f939009d42`**.
Post-merge Foundation **#401 PASS**.

Desktop 1440×1000 and mobile 390×844 screenshots from the exact post-merge run show no mechanical layout regression or horizontal overflow. This is **mechanically defended presentation evidence, not Owner approval**. Art direction, visual hierarchy, motion feel and card/table taste remain Owner-unproven until the next preview session.

## What remains unproven

### Game truth

- exact PlayOK identity for remaining reference-sensitive pins;
- strategic credibility/enjoyment of the bot to knowledgeable Tysiąc players;
- authentic complete-match gameplay quality;
- real-human knowledgeable duo/trio gameplay quality.

### Experience truth

- whether the new table/spatial-trick visual hierarchy is actually good to the Owner rather than merely mechanically sound;
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

Run 02 is explicitly dual-track, but the immediate experience move is now constrained by evidence rather than more speculative polish.

### Experience loop

1. **Publish current defended `main` (`2590002e…`) to a fresh temporary Owner Preview.** Do not add another broad visual layer first.
2. Let the Owner use desktop and real phone naturally and judge **visuals, interaction, feedback, hierarchy, motion/pacing and overall feel**.
3. Do not ask the Owner to certify Tysiąc rules or bot strategy.
4. Translate high-signal reactions into small reversible experience slices with mechanical tests where appropriate.
5. Keep the current visual baseline provisional; no final-art commitment follows merely from CI/screenshots.
6. Avoid expensive/final art commitments where open game semantics could make them premature.

The repository's proven preview route is `Temporary Foundation Preview`. It requires an explicit per-run acceptance of Cloudflare Terms/Privacy plus confirmation of a public unclaimed preview; do not bypass that consent boundary. The current chat GitHub connector cannot dispatch `workflow_dispatch`, so starting that preview requires the minimal manual Owner action in GitHub Actions. Once started, monitoring, verification and extraction of the resulting URL can return to the agent.

### Game-truth loop

1. Continue resolving or bounding the material reference-sensitive rule probes independently of Owner play.
2. Design stronger bot/gameplay evaluation that does not mistake self-play legality for strategic quality.
3. Bring knowledgeable Tysiąc players/domain feedback into the questions that genuinely require human game expertise.
4. Use real-human duo/trio sessions when they can evaluate gameplay rather than infrastructure.

The next major experience evidence should therefore come from the **Owner Preview**, while game-truth work can continue independently rather than pretending that Owner play validates the rules.