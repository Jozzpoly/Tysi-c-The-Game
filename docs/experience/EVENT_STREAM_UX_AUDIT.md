# Tysiąc The Game — GameEvent / UX Choreography Audit v0

Status: exploratory audit / Visual Foundation Run
Date: 2026-09-13

## Verdict

The existing typed event/projection model is unusually well positioned for a high-quality experience layer.

**No fundamental core rewrite is justified.** Most of the information required for causal animation already exists as viewer-safe gameplay facts.

The main missing capability is presentation infrastructure for rendering a transition between an authoritative `before` and `after` state without turning animation into gameplay authority.

## Existing strengths

### Typed semantic events already exist

The reducer emits facts rather than UI instructions:

- bid placed / pass / auction won;
- talon revealed;
- bomb resolved;
- exchange completed + private received card;
- four-nines option / redeal;
- contract set;
- marriage declared;
- card played;
- trick completed with full plays, winner and points;
- hand scored with deltas/totals/contract result;
- match completed;
- next hand started.

This is substantially better than trying to infer meaning from arbitrary state diffs.

### SeatProjection is already the presentation boundary

`SeatProjection` contains viewer-safe observation, legal commands and derived score explanation. Hidden information stays behind the same projection/privacy boundary used by current gameplay.

### Remote playback is already presentation-lagged, not authority-lagged

Remote updates arrive as `projection + events` and are queued for presentation. Reconnect/snapshot cancels playback and snaps to current authority. That is the correct behavioral contract to preserve.

## Core rendering problem: after-state teleportation

A semantic event alone is not enough if the UI immediately renders only the `after` projection.

Example:

`before`: A♥ exists in the player's hand.

Event: `card-played(seat=human, card=A♥)`.

`after`: A♥ no longer exists in hand and exists in the trick.

If React switches directly to `after`, a visual transition has no source object left to animate.

### Recommended presentation solution

Keep three concepts distinct:

1. **authoritative state** — server/core truth, already decided;
2. **presented stable state** — the projection currently shown as settled;
3. **transition overlay** — ephemeral visual objects representing the causal path from before to after.

A card flight may therefore be:

- base renders the stable before card/hand;
- accepted event creates a transition clone/overlay from source anchor;
- destination/after-state element is initially masked or staged;
- overlay travels;
- base commits to after stable state;
- overlay is removed.

Alternative sequences may commit base earlier and use a source ghost. The key invariant is the same: **the overlay is never game state.**

## Need for a presentation anchor system

Causal choreography needs stable semantic anchors rather than querying random CSS geometry.

Initial anchor vocabulary can stay very small:

- `seat:{n}`
- `hand:{n}`
- `hand-card:{card}` for viewer-visible cards
- `trick:{seat}`
- `bid`
- `contract:{seat}`
- `trump`
- `captured-points:{seat}`
- `match-score:{seat}`
- `bomb:{seat}`

Components can register their DOM geometry with an ExperienceLayer. The choreography says **what travels from which semantic place to which semantic place**; layout decides coordinates.

This is what lets desktop and mobile share causal language without sharing pixel paths.

## Event-by-event sufficiency audit

### `bid-placed`

**Sufficient.** Seat + value are explicit. After projection supplies new auction turn/high bidder.

Potential choreography requires source seat/command anchor and bid destination only.

### `player-passed`

**Sufficient.** Seat explicit; after projection shows auction-active/turn state.

### `auction-won` + `talon-revealed`

**Sufficient for current rules candidate.** Winner/value + exact talon cards are available to the intended audience under current core policy.

Treat as compound sentence when adjacent.

### `exchange-completed`

**Mostly sufficient.** Public fact contains declarer and recipients but intentionally not card identities.

For the declarer, own `before` and `after` projections safely reveal which two own cards left the hand. That diff is acceptable presentation detail because both states are visible to the same viewer.

For a recipient, private `card-received` explicitly carries received card identity.

Do not extend the public event with hidden card IDs merely to make animation easier.

### `card-received`

**Sufficient and privacy-aware.** It is seat-private and can drive the recipient's reveal/hand insertion.

### `four-nines-option`

**Sufficient for opening the private decision.** Seat-private.

### `continue-after-four-nines`

**Material semantic gap.** The reducer currently transitions to contract with no `GameEvent`.

The initiating player gets an authoritative projection change but no semantic acceptance fact. A presentation layer can infer the phase transition, but that weakens the rule "events say what happened; projections say what is true."

Candidate future fix: a **seat-private** `four-nines-continued` event. Do not make it public, because continuing must not reveal that the player had four nines.

This is a small targeted event-model improvement, not a reason to redesign the event system now.

### `four-nines-redeal`

**Sufficient.** Public because the redeal itself is observable.

### `contract-set`

**Sufficient.** Seat + value explicit.

### `marriage-declared`

**Sufficient.** Seat + suit + points explicit. When immediately followed by `card-played`, treat as one compound presentation sentence.

### `card-played`

**Sufficient.** Seat + card explicit. Before projection supplies source geometry if viewer can see the card; opponent cards can originate from hidden-hand anchor.

### `trick-completed`

**Excellent for UX.** Full three plays, winner, points and index are carried in the event. This enables deterministic collection/points/next-lead choreography without recalculating trick rules in presentation.

### `hand-scored`

**Sufficient when combined with `scoreSummary`.** Event gives deltas/totals/declarer/contract result; derived projection gives card points, marriage points, raw points, before/after scores and lock explanation.

Do not duplicate scoring calculation in presentation.

### `hand-bombed`

**Sufficient.** Seat, bomb number, delta and totals explicit.

### `match-completed`

**Sufficient.** Winner/draw/totals explicit. Pair with immediately preceding scoring/bomb event for causal climax.

### `hand-started`

**Sufficient.** Hand number/dealer explicit; after projection establishes new auction state.

## Transport-level rejection feedback

Rejected commands arrive through the remote protocol as `rejected`, not as canonical `GameEvent`.

That is correct: a rejected command did not happen in game state.

The experience layer should still map protocol rejection into a local presentation cue:

- reversible object resists/returns;
- reason is translated into concise player language;
- current authoritative projection is restored;
- no fake gameplay event is appended.

## Compound events should be explicit presentation policy

Initial useful combinations:

- `auction-won + talon-revealed`
- `marriage-declared + card-played`
- `card-played + trick-completed`
- `card-played + trick-completed + hand-scored`
- `trick-completed + hand-scored + match-completed`
- `hand-scored + match-completed`
- `hand-bombed + match-completed`

Do not create a generic rules engine for grouping events. Start with a small explicit table and add only evidence-backed combinations.

## Current playback timing audit

Remote playback currently reduces each update frame to one of three fixed delays:

- ordinary: 480 ms;
- marriage: 680 ms;
- trick completion: 900 ms.

This proved paced authoritative transitions and prevented instant bot cascades, but it is too coarse for a mature experience layer.

A future sequence needs internal beats and a distinction between:

- **minimum causal hold** — time needed before the next meaning is legible;
- **cosmetic tail** — motion/audio that may finish without blocking a newly available action;
- **rare climax budget** — deliberately longer because event rarity earns it.

Do not replace three constants with dozens of magic constants in `RemoteRoom`. Move timing policy into presentation choreography once the lab provides evidence.

## Queue / before-state requirement

Current queued frame shape is roughly:

`{ projection: after, events }`

For choreography, presentation needs a reliable `before` state. It can be captured from the previously settled/presented projection at sequence start.

Implementation should likely maintain refs for:

- latest authoritative projection received;
- currently settled presented projection;
- active sequence;
- queued authoritative frames.

Exact React shape is deferred until the first promoted sequence. Do not refactor ahead of evidence.

## Hidden-information audit rule

Every visual asset, accessibility label, animation path and timing branch must be derived only from information visible to that seat.

A privacy bug can occur even without text leakage. Examples:

- different card-back animation based on hidden card identity;
- recipient-specific sound audible to another local observer;
- duration/particle style that encodes hidden value;
- preloading/revealing DOM text for another seat.

The lab can fake public fixtures, but promotion must re-run seat-projection/privacy tests.

## Recommendation

Keep the existing event model.

Add new gameplay events only when an actual presentation/reconnect/observability need exposes a missing **game fact**, and keep audience scope minimal.

The only currently identified likely event addition is a private `four-nines-continued` acknowledgement; even that should wait until we promote that sequence.

The immediate engineering target remains the frequent trick loop and a presentation transition/anchor mechanism, not more core events.
