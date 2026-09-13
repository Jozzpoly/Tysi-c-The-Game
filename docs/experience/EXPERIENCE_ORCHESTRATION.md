# Tysiąc The Game — Experience Orchestration v0

Status: exploratory / Visual Foundation Run
Date: 2026-09-13

## 1. The interface is an orchestra, not a dashboard

The old prototype primarily responded through text and updated UI values. The new system should orchestrate several feedback channels, with **game objects first and prose last**.

Feedback channels, in preferred causal order:

1. **Object** — card/button/seat physically acknowledges the input.
2. **Space** — ownership, turn, direction, trick and destination are shown spatially.
3. **State field** — persistent phase / trump / contract / pressure changes the arena subtly.
4. **Numbers** — causal deltas travel from source to destination.
5. **Audio** — material + semantic punctuation.
6. **Haptic** — short synchronized tactile punctuation on supported devices.
7. **Text** — explanation, rule learning, edge cases, accessibility; not proof that the action happened.

A common action usually needs only 2–3 channels. A rare decisive action can use 4–6. Using all channels all the time is a failure.

## 2. Temporal rhythm

A living card game needs temporal negative space.

- **Quiet state:** player is reading and deciding. Motion nearly stops except subtle actor/availability cues.
- **Input moment:** immediate 40–90 ms acknowledgement.
- **Action beat:** 150–500 ms movement / commit.
- **Consequence beat:** 250–900 ms depending on significance.
- **Rest:** visible settled evidence before next action becomes dominant.

The game should not begin the next visual sentence before the current sentence has a period.

At the same time, common sequences must not lock input just to show animation. Once players understand a sequence, presentation can overlap or accelerate without losing causal order.

## 3. Three states of an action: possible, selected, authoritative

This distinction is foundational for trust.

### Possible
The object advertises affordance. Legal cards have slightly more visual availability; bid values feel reachable. No dramatic glow.

### Selected / reversible
The player has touched/hovered/dragged but authority has not accepted the command. Object follows input or lifts. Cancellation is visually obvious and cheap.

### Authoritative / committed
The object leaves its reversible pose and travels into the shared game state. Motion should feel one-way: snap, lock, transfer, settle.

Presentation must never make a reversible preview look like a committed server action.

## 4. Persistent traces

Animations alone are insufficient because they disappear.

Each meaningful event should leave a short-lived or persistent trace:

- played card remains in trick until trick result is readable;
- won trick leaves hand-points delta / next-lead ownership;
- marriage leaves trump identity and scored-marriage evidence;
- bid leaves current bidder + bid value;
- final contract remains attached to declarer until resolution;
- bomb leaves bomb count and score consequences;
- score delta leaves resulting total and causal breakdown.

The player should be able to look away for one second and still reconstruct the important result.

## 5. Semantic motion vocabulary

Motion itself carries meaning.

| Meaning | Motion family | Avoid |
| --- | --- | --- |
| Available | tiny lift / breathe / contrast | constant pulsing |
| Selected | follows pointer or lifts toward player | giant glow |
| Committed | snap + purposeful transfer | dissolve/teleport |
| Ownership gained | pull inward toward seat | generic confetti |
| Ownership lost | release outward | red error shake |
| Score gained | source → destination | number appearing from nowhere |
| State locked | close/snap/ring settle | bouncy celebration |
| Rejected | resist + return | whole-screen shake |
| Escalation | larger spatial footprint / slower settle | simply more particles |

## 6. Semantic color jobs

Palette is still open, but color roles should be stable.

- **Neutral:** rest / readable game objects.
- **Action / current turn:** cool high-clarity accent.
- **Commit / wager / contract pressure:** warm accent.
- **Trump:** suit-driven accent that can tint arena traces without recoloring everything.
- **Positive score delta:** positive semantic signal.
- **Negative contract consequence:** negative semantic signal.
- **Dangerous/destructive action (bomb confirmation):** distinct warning state.

Do not use the same accent simultaneously for selected card, current turn, score gain, trump, and primary button.

## 7. Event response matrix

### Auction — opponent bid
Object: opponent seat pushes value toward central bid anchor.
Space: value has visible origin at that seat.
State: current winner ownership changes.
Audio: short clean bid tick; pitch may step with bid level.
Haptic: none for passive opponent action.
Text: optional compact "Bot 3 · 120" trace.

### Auction — human bid
Input: button/value compresses or selected value lifts.
Commit: bid token travels from action rail to central anchor.
Impact: previous bid is displaced; new value gains authority.
State: human becomes temporary bidder/leader.
Haptic: light/medium commit.
Persistent trace: value + bidder remain after motion.

### Pass
Controls contract inward / fade from the bidding orbit.
Seat gets quiet "passed" state.
No negative/red error feedback.

### Musik received
Cards should arrive as ownership transfer, not appear in hand instantly.
Hand expands/reflows after arrival.
The next task (give two cards) becomes visually staged only after arrival settles.

### Exchange selection
Tap/drag lifts selected cards from hand but keeps them visibly attached to player ownership.
Recipient assignment should be spatially legible before confirmation.

### Exchange commit
Two cards travel to two opponent seat anchors.
Opponent hidden-card counts update at destination.
Human hand reflows only after transfer begins.

### Four nines
This is an exceptional decision state, not an error dialog.
The four cards become the evidence; UI frames the choice around them.
Continuing should not advertise hidden information to opponents.

### Final contract
Chosen value snaps into a persistent declarer-pressure object.
It remains present through play and becomes the anchor for success/failure scoring.

### Human card play
Legal cards: subtle availability.
Touch: card lifts/follows input.
Commit: card travels into seat-specific trick slot.
Hand closes gap.
Turn ownership moves only after commit is visually accepted.

### Opponent card play
Card emerges from opponent hidden hand anchor and lands in their trick slot.
Back-count decrements at origin; face becomes readable at destination.

### Illegal attempted play
Card resists / returns. A concise reason can appear near hand or trick obligation.
No full-screen alert.
Haptic: optional restrained negative cue.

### Trick complete
All three cards hold briefly so comparison is readable.
Winning card/seat gains a directional cue.
Cards compress into a stack.
Stack travels toward winner.

### Trick points
Points originate from collected trick stack.
They flow to hand-points component associated with winner.
Next-lead marker emerges from same winner anchor.

### Marriage
Q+K acknowledge each other as a pair.
Suit energy originates at the pair.
Marriage value originates at pair and travels to score component.
Trump field changes from the same event.
Audio/haptic stronger than ordinary play, shorter than match climax.

### Trump follow-through
Do not repeat a full meld animation every turn.
Use a persistent subtle suit signature in trick/arena state and card legality/priority cues where useful.

### Bomb confirmation
Composition changes before commit: ordinary action rail recedes, consequence preview becomes dominant.
Confirmation should be difficult to tap accidentally.

### Bomb resolution
Play-space visibly closes rather than simulating unplayed tricks.
Bomb count persists.
Score deltas travel to affected seats, including explicit +0 for first-free bomb only long enough to explain consequence.

### Hand scoring
Do not begin with a detached results modal.
Resolve in causal order:
1. trick card points,
2. marriages,
3. raw hand points,
4. defender rounding / contract test,
5. score delta,
6. new persistent totals.
Allow learned players to accelerate the sequence.

### Contract success
Contract pressure object resolves positively into declarer score.
The visual should communicate "obligation met", not generic victory.

### Contract failure
Contract object closes downward/negative and transfers loss to score.
No arcade failure buzzer.

### 800 lock / threshold state
Crossing the threshold deserves a persistent state transformation because it changes future scoring behavior. It should not be a one-time toast the player can miss.

### Match win
Threshold crossing is the causal trigger.
Winning seat/score takes compositional ownership gradually.
Ordinary table UI yields instead of hard-cutting immediately to a disconnected victory page.

### Reconnect / catch-up
Never replay every historical animation after reconnect.
Snap to authoritative current state with a brief "caught up" transition, then make the next actionable state clear.

### Waiting for remote human
Arena stays alive but calm. Current remote seat ownership is obvious; player input affordances disappear. Avoid spinner-centric UI unless network state actually needs attention.

## 8. Mobile interaction candidates to test

Do not choose yet. Build and compare.

### M1 — Direct Tap Commit
Tap a legal card and it commits immediately.
Pros: fastest, one-handed, low friction.
Risk: accidental card play; feedback must acknowledge touch under the finger instantly.

### M2 — Lift then Commit
First tap lifts/selects; second tap or clear play zone commits.
Pros: safe, inspectable, tactile.
Risk: doubles input count across many tricks; can become laborious.

### M3 — Drag / Throw
Card follows thumb into trick zone and commits past a threshold.
Pros: strongest physicality and causal direction.
Risk: occlusion, motor/accessibility burden, slower repeated play.

Likely product answer may be hybrid: tap for fast normal play + optional drag/direct manipulation, provided both have the same authoritative feedback grammar.

## 9. Audio and haptic restraint budget

Frequent actions cannot consume climax vocabulary.

- hover/availability: visual only
- selection: optional tiny haptic, minimal sound
- ordinary commit: short material sound + light haptic
- trick win: material gather + medium punctuation
- marriage: unique paired motif + medium/rich discrete haptic
- bomb: rare unique event signature
- match win: full motif derived from game language

Passive bot moves generally should not vibrate the user's phone.

## 10. Lab architecture implications

The Experience Lab should be event-driven rather than screen-driven.

A fixture needs:

- `before` projection/state;
- triggering user/bot command or event;
- authoritative `after` projection/state;
- semantic event identity;
- presentation intensity tier;
- optional source/destination anchors;
- reduced-motion fallback expectation.

The lab should support pausing at arbitrary milliseconds and replaying at 0.5× / 1× / 2× so timing can be judged, not guessed.

## 11. Current hypothesis

The direction that marginally reached the Owner on mobile (former D / Card Stage) is useful mainly because it **left room for cards and action to become the UI**. Its static visual style is not yet valuable enough to preserve.

Next evolution should keep that freedom but add:

- stronger direct manipulation;
- visible cause→effect paths;
- persistent state traces;
- meaningful event hierarchy;
- stronger audiovisual/tactile punctuation;
- temporal rhythm and quietness between events.
