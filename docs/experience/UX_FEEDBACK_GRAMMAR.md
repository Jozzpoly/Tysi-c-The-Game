# Tysiąc The Game — UX Feedback Grammar v0

Status: exploratory / Visual Foundation Run
Date: 2026-09-13

## Core thesis

The product must not merely *display* a legal state. It must make cause and effect physically legible.

Every meaningful player action should pass through a consistent five-part feedback sequence:

1. **Anticipation** — the interface shows what can be acted on and where the action will land.
2. **Commit** — input visibly depresses/lifts/snaps so the player knows the input was accepted.
3. **Impact** — the affected game object reacts at the causal location.
4. **Consequence** — resulting state travels to the place where it matters: score, contract, trump, next leader, etc.
5. **Settle** — the board becomes quiet again and makes the next decision obvious.

Text can explain a rule, but text must not be the primary proof that an action happened.

## Feedback intensity ladder

### Tier 0 — affordance
Frequent and nearly silent.

Examples: hover, touch-down, selectable card lift, disabled-state attenuation, current-seat breathing marker.

Target feel: immediate, crisp, almost unconscious.

### Tier 1 — ordinary action
Bid, pass, play a card, confirm exchange.

Use: object motion + small sound + optional light haptic + local state reaction.

No screen shake. No celebratory burst.

### Tier 2 — meaningful event
Winning a trick, declaring a marriage, completing an exchange, making/setting final contract.

Use: spatial collection or transfer, semantic color, clear audio punctuation, stronger but short haptic, status transformation.

### Tier 3 — rare / decisive event
Bomb, contract success/failure, crossing 800, match win.

Use: temporary composition change, larger timing budget, layered audio/haptic/visual response. Still preserve input clarity and avoid long unskippable spectacle.

## Spatial causality rules

- **Cards move as cards.** Do not replace a card action with a floating toast.
- **Points originate from their source.** Trick points start at the trick. Marriage points start at the pair. Contract delta resolves from the contract state.
- **Ownership changes have direction.** Won trick collapses toward the winner; exchange cards travel toward recipients.
- **Trump changes the arena.** The active suit should influence a persistent but restrained arena accent, not just a label.
- **Turn ownership is spatial.** The next active seat should become visually available while previous seat settles.
- **Score changes preserve before→delta→after.** Never teleport a number without showing direction/significance for meaningful changes.

## Motion grammar

The same kinds of meaning should share motion vocabulary.

- **Select / candidate:** 4–8 px lift, slight scale, sharper outline.
- **Commit:** short compression then release; direct manipulation should follow pointer/touch when practical.
- **Transfer:** purposeful arc or straight-line travel between ownership anchors.
- **Acquire:** destination pulls object/energy inward and briefly gains weight.
- **Reject / illegal:** do not shake the whole screen; object resists, returns, and gives concise negative cue.
- **Lock / become authoritative:** snap, settle, small ring/line close, lower-frequency audio punctuation.
- **Escalate:** increase scale/contrast/tempo only when event rarity justifies it.

## Timing grammar (initial hypotheses, to be tuned by feel)

- touch/press acknowledgement: ~40–90 ms
- common card/bid commit: ~160–260 ms
- ownership transfer: ~280–500 ms
- trick collection: ~420–700 ms
- marriage/trump transformation: ~550–900 ms
- hand scoring causal sequence: ~700–1400 ms, interruptible/acceleratable
- bomb / match resolution: ~900–1600 ms, rare enough to earn it

These are not contracts yet. User feel wins over arbitrary timing numbers.

## Audio grammar

Audio should encode material and consequence rather than play generic UI bleeps.

Potential families:

- **card material:** dry soft snap / slide / stack;
- **bid/contract:** clean, pitch-stepped confirmation tones; escalation can rise but never become slot-machine audio;
- **trick acquisition:** compact gather/stack sound with point punctuation;
- **marriage:** paired two-note identity + suit resonance;
- **trump:** persistent one-time tonal shift, not looping ambience spam;
- **negative/failed contract:** lower, shorter closure rather than error buzzer;
- **match win:** derived from existing game motif so climax feels earned, not pasted on.

Audio must support mute and reduced sensory modes.

## Haptic grammar

Follow platform guidance: short, causal, optional, synchronized with visual/audio, never constant vibration.

Potential semantic mapping:

- selection snap: tiny selection haptic;
- card/bid commit: light impact;
- trick won / contract locked: medium impact;
- marriage / bomb confirm / match win: richer discrete pattern, used rarely;
- invalid move: restrained negative notification only if the player actually attempted something invalid.

Do not use vibration for every bot action or passive event.

## Action-specific sequences

### Bid
Anticipation: legal values become physically available; strongest next increment is closest to thumb/hand.
Commit: chosen value compresses under input, then detaches from button.
Impact: value travels to central/current bid anchor; previous bid is displaced, not instantly replaced.
Consequence: active-turn ownership moves to next seat; bidding ladder subtly advances.
Settle: player's action rail quiets; current winning bidder stays visually legible.

### Pass
Commit should feel final but not dramatic. The player's bidding controls collapse/withdraw from the bidding orbit and their seat receives a quiet passed state. Avoid red "error" language.

### Play card
Anticipation: legal cards are slightly more physically available; illegal cards remain readable but inert.
Commit: card follows touch/drag or rises on tap.
Impact: card lands in a real seat-specific trick slot with material snap.
Consequence: hand closes the gap; turn ownership transfers. If this completes the trick, do not immediately erase the played cards.
Settle: next legal action becomes obvious.

### Win trick
Impact starts only after all three cards have been readable for a short beat.
Cards compress into a small stack and travel toward the winner's seat/score vector.
Trick value appears at the stack, then moves/feeds into the winner's hand-points indicator.
Next-lead marker emerges from the same winner anchor.

### Marriage
The two involved cards briefly recognize each other before the event fires — pair relation should be visible.
Suit identity blooms from the pair, then propagates to the persistent trump state.
Marriage value originates at the pair and travels to the appropriate score component.
Rare enough for stronger audio/haptic than an ordinary card play, but must not obscure the next action.

### Final contract
The value becomes a persistent pressure object, not a transient toast. It should remain visually related to declarer and scoring until resolved.

### Bomb
Bomb is a deliberate destructive/abortive action, not a normal button. Confirmation should change the composition so accidental activation feels impossible.
On commit, active play-space should visibly close/void; unresolved cards should not pretend the hand played normally.
Score consequences should fan out to affected seats and the bomb count should become persistent evidence.
The first free bomb should still *feel* consequential even when score delta is zero.

### Scoring
Avoid one giant results modal as the sole feedback.
Reveal causal components in place first: cards → marriage → raw points → rounding / contract → delta.
Then consolidate into final score. The player should be able to answer "why did I get +100 / -120?" visually.

### Match win
Use the score crossing threshold as the causal trigger. The winning seat/state expands into ownership of the whole composition; do not cut immediately to an unrelated victory screen.

## Mobile-first interaction principles

- Primary direct actions remain near the hand / lower thumb zone.
- Frequent actions should be direct manipulation of game objects where possible, not secondary buttons.
- The finger must never hide the only feedback proving a press registered; use surrounding glow/motion/haptic.
- Upper screen is better for opponents, match status and consequences than for frequent controls.
- Gameplay can temporarily reclaim UI chrome when nothing actionable is happening.

## Desktop principles

Desktop is not stretched mobile. It can use pointer hover, broader spatial paths, peripheral score/status anchors, and larger card staging. The causal language should remain the same even if layout differs.

## Accessibility / restraint

- Every important visual event needs a non-color-only cue.
- `prefers-reduced-motion` should replace long transfers with short fades/snaps while preserving causal ordering.
- Feedback cannot block gameplay longer than its communicative value.
- Players should be able to accelerate common sequences once learned where doing so doesn't break synchronization.
- Sound/haptics are complementary, not required for correctness.

## Primary evaluation question

Not "is this animation pretty?"

Ask instead: **after an action, did the player immediately feel that the game heard them, understand what changed, and know where to look next?**
