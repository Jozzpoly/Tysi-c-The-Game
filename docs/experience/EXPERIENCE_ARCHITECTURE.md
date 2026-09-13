# Tysiąc The Game — Experience Architecture v0

Status: exploratory contract / Visual Foundation Run
Date: 2026-09-13

## Purpose

Create a presentation architecture capable of a highly responsive, tactile, modern card game **without creating a second gameplay authority**.

The canonical game already provides the two inputs presentation needs:

- a seat-safe authoritative `SeatProjection`;
- semantic `GameEvent[]` emitted by the reducer and filtered for the viewer.

The experience layer should choreograph those facts. It must not infer rules from DOM changes, duplicate legality, reconstruct hidden state, or persist an alternate match history.

## Existing authority seam

Current runtime already follows the correct high-level flow:

`Command -> reducer -> canonical MatchState + GameEvent[] -> projectSeat -> client presentation`

For remote play, an update already carries the new projection and the events that caused it. Presentation playback is intentionally behind authority and reconnect/snapshot can cancel playback and snap directly to current truth.

Preserve that property.

## Proposed presentation-only seam

Conceptual shape, not a final API:

`before SeatProjection + visible GameEvent[] + after SeatProjection -> ExperienceSequence`

An `ExperienceSequence` is **not game state**. It is an ephemeral instruction for how to reveal already-authoritative facts.

A minimal sequence may contain:

- semantic event family;
- causal source anchor(s);
- destination anchor(s);
- intensity tier;
- ordered presentation beats;
- whether common input may unlock before the entire cosmetic tail settles;
- persistent trace expectation;
- reduced-motion fallback;
- optional audio semantic;
- optional haptic semantic.

Do not add animation names, pixels, easing curves or sound file names to core `GameEvent` definitions.

## GameEvent stays a gameplay fact

Examples:

- `card-played` means a card was authoritatively played by a seat.
- `trick-completed` means three plays resolved to a winner and point value.
- `marriage-declared` means the suit/points event occurred.
- `hand-scored` means the canonical score delta and totals are known.

The experience layer can render these in radically different styles without changing their meaning.

## Initial event -> choreography map

### `bid-placed`

Source: bidder seat / human command surface.
Destination: current-bid anchor.
Persistent trace: bidder + value.
Default tier: 1.

### `player-passed`

Source: seat.
Destination: seat's auction state.
Persistent trace: quiet passed state.
Default tier: 1.

### `auction-won` + `talon-revealed`

These are naturally one compound sentence when adjacent in the same authoritative update.

Beat 1: winning bid ownership settles on declarer.
Beat 2: talon cards reveal/transfer into declarer's ownership.
Beat 3: next task (exchange) becomes actionable.
Default tier: 2.

### `exchange-completed` + viewer-private `card-received`

Public audience sees two ownership transfers without card identity for hidden recipients.
A recipient may additionally animate the private received card identity because their filtered event contains it.
Never leak the other recipient's card through animation assets, timing labels or accessibility text.
Default tier: 1–2.

### `contract-set`

Source: declarer's command surface.
Destination: persistent declarer/contract pressure anchor.
Persistent trace lasts through trick play and scoring.
Default tier: 2.

### `card-played`

Source: corresponding seat hand anchor.
Destination: seat-specific trick slot.
Persistent trace: card remains readable until trick resolution.
Default tier: 1.

### `marriage-declared` + `card-played`

When adjacent, choreography should understand one causal sentence rather than render two unrelated toasts.

Beat 1: pair/suit recognition at card source.
Beat 2: suit/trump state propagates from the cards into persistent arena state.
Beat 3: the actual lead card commits to the trick.
Beat 4: marriage points leave a persistent scored trace.
Default tier: 2.

### `trick-completed`

Source: the three visible trick cards.
Destination: winner seat / captured-points anchor.
Beat 1: hold readable comparison.
Beat 2: indicate winner.
Beat 3: collect cards toward winner.
Beat 4: point value travels from collection to winner points.
Beat 5: next-leader ownership emerges from same winner anchor.
Default tier: 2, but extremely frequent; it must remain fast.

### final `trick-completed` + `hand-scored`

Do not instantly replace the eighth trick with a results panel.
The final trick resolves first, then scoring continues causally from accumulated evidence.
Default tier: 2 -> 3 transition depending on contract consequence.

### `hand-scored`

Source: persistent hand evidence (captured points, marriages, contract).
Destination: match scores.
Reveal in causal order instead of spawning a detached unexplained delta.
Default tier: 2; tier 3 when it crosses meaningful thresholds or ends match.

### `hand-bombed`

Source: bomb confirmation / declarer state.
Destination: whole hand state closes, bomb count and affected scores.
Persistent trace: bomb number and resulting totals.
Default tier: 3.

### `match-completed`

Source: score threshold crossing.
Destination: winning seat/score takes compositional ownership.
Default tier: 3.

### `hand-started`

This is a reset/transition beat, not a celebration. Establish dealer/turn/new-hand identity quickly.

## Compound event sentences

A single server update can contain several events. Presentation should not blindly give each event its own full animation.

Instead create a small number of **compound semantic sentences**, initially by explicit mappings rather than a general DSL:

- `marriage-declared + card-played`
- `card-played + trick-completed`
- `card-played + trick-completed + hand-scored`
- `hand-scored + match-completed`
- `auction-won + talon-revealed`

This avoids the "animation queue as bureaucracy" problem and preserves causal rhythm.

## Before / after projection roles

Events tell presentation **what happened**. Projections tell it **what was and what is now true for this viewer**.

Examples:

- `card-played` event names card + seat; before projection contains source hand/count, after projection contains destination trick and updated count.
- `trick-completed` contains the full trick/winner/points; after projection contains new captured points and next leader.
- `hand-scored` contains delta/totals; `scoreSummary` provides causal scoring detail without inventing a parallel calculator.

Use explicit event data first. Use before/after projections only for visual anchors, persistent traces and safe viewer-specific detail.

## Remote authority and optimistic feel

Do not fake an authoritative play before the server accepts it.

Three presentation states are allowed:

1. **possible** — legal affordance from current projection;
2. **selected/reversible** — local tactile response while user is pointing/dragging/pressing;
3. **committed/authoritative** — only after accepted update/events arrive.

The local selected state can be extremely responsive (<100 ms) without lying about server acceptance. On acceptance it transitions into the one-way committed motion. On rejection it resists/returns and explains the reason.

Future evidence may justify narrow optimistic techniques, but they are not needed to achieve tactile input acknowledgement.

## Input lock policy

Current remote playback globally locks input while queued frames render. That is safe but may become too blunt for a polished game.

Do not remove it blindly.

Evolve toward two concepts:

- **authority lock**: player genuinely cannot act because canonical state does not permit an action;
- **presentation lock**: presentation temporarily withholds input only where interacting would destroy causal legibility.

Common non-conflicting cosmetic tails should eventually be able to finish after the next valid decision is already available. Measure this; do not guess.

## Reconnect / refresh / background resume

Hard rule:

- cancel active choreography;
- discard queued cosmetic history;
- render current authoritative projection;
- run at most a short `caught-up`/settle transition;
- expose current legal action.

Never replay a backlog of historic card flights after reconnect.

## Experience Lab contract

The lab is event-driven, not screen-driven.

A fixture should capture:

- named research question;
- viewer seat;
- `before` projection;
- visible events;
- `after` projection;
- current legal commands before/after;
- source/destination semantic anchors;
- intensity tier;
- expected persistent trace;
- reduced-motion expectation.

The lab should support:

- play / pause;
- scrub or pause at arbitrary beats;
- 0.5x / 1x / 2x playback;
- desktop and mobile layouts;
- mute / sound-on;
- haptic capability indicator rather than assumption;
- reduced-motion mode;
- repeated loop playback for frequent actions;
- side-by-side feel variants for the same canonical fixture.

## First torture fixture

Start with the highest-frequency consequential loop:

`human/seat card play -> third card completes trick -> winner readable -> cards collected -> points transferred -> next leader becomes actionable`

Why first:

- it occurs many times per hand;
- it combines direct input, opponent response, object motion, scoring feedback and turn transfer;
- if this loop feels dead, rare bomb/marriage spectacle cannot save the game;
- if this loop feels good, the product already has a heartbeat.

Build at least three presentation variants over the **same** fixture:

### F1 Crisp Direct
Very fast, low travel, strong snap/ownership. Optimize clarity and repeated-play speed.

### F2 Physical Elastic
More direct manipulation, card weight, follow-through and collection. Test tactile pleasure without slowing the game.

### F3 Graphic Pulse
Less simulated physicality; stronger graphic compression, directional energy and point transfer. Test a more distinctively digital language.

Owner judgement selects useful primitives, not necessarily one entire variant.

## Gradual GameTable decomposition

Do not rewrite the frontend into a design system before the language is proven.

When promotion begins, extract semantic regions only as needed, likely along lines such as:

- `SeatAnchor`
- `HandRail`
- `TrickStage`
- `Auction/ContractState`
- `CommandSurface`
- `ScoreState`
- `ExperienceLayer`

Names are provisional. Component boundaries should follow causal ownership discovered in the lab, not today's CSS containers.

## Audio / haptic integration

Audio and haptics should consume semantic experience cues, not inspect DOM classes.

Example semantics:

- `card.commit`
- `trick.acquire`
- `marriage.resolve`
- `contract.lock`
- `score.positive`
- `score.negative`
- `bomb.resolve`
- `match.win`

Actual samples, gain, pitch, haptic pattern and platform fallback remain presentation policy.

Haptics are progressive enhancement on the web and must never carry correctness-critical information.

## Reduced motion

Reduced-motion is a semantic alternate choreography, not simply `animation-duration: 0` everywhere.

Preserve ordering and cause/effect with:

- short position snaps;
- crossfades;
- local highlight changes;
- before/delta/after numbers;
- persistent traces.

Remove sweeping travel, elastic overshoot, large scale changes and nonessential parallax.

## Promotion gates from lab to runtime

An experience idea is not promoted because it is attractive in isolation.

Require:

1. Owner experience evidence that it materially improves feel/clarity;
2. same canonical gameplay meaning before/after;
3. mobile and desktop proof;
4. no hidden-information leak;
5. reconnect/snap behavior defined;
6. reduced-motion fallback defined;
7. common-loop timing does not create unacceptable input friction;
8. Foundation suite still passes after runtime integration.

## Non-goals

- no final visual identity yet;
- no generic animation DSL;
- no event-sourced rewrite;
- no core animation metadata;
- no forced particles/glows everywhere;
- no duplicate score calculation;
- no assumption that one mobile interaction method (tap, two-step, drag) has already won.

## Current architectural conclusion

The repo does **not** need a fundamental gameplay rewrite to support a premium experience. It needs a deliberately designed presentation choreography layer over seams that already exist.

The highest-value next work is therefore not another static mockup. It is repeated empirical comparison of the same frequent canonical loop under substantially different motion/direct-manipulation languages.
