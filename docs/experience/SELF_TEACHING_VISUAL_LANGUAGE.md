# Self-Teaching Visual / Interaction Language

Status: research contract. This document does not define Tysiąc rules; it defines how presentation should help a non-expert discover legal interaction without intrusive instruction.

## Problem

The Owner should be able to sit down without knowing Tysiąc and quickly form correct local expectations about what can be touched, moved, committed and what changed after an action.

The target is not magically teaching full strategy without words. The target is:

> Normal interaction should teach itself through object behavior, spatial affordance, reversible probing and causal consequence. Text should answer questions the player naturally reaches, not precede every action with instructions.

## Distinguish three things

### Mechanical discoverability
Can I tell what object is interactable and what action is available?

### Rule legibility
Can I understand why a particular action is accepted or constrained?

### Strategy knowledge
Do I know whether the legal action is smart?

Presentation can and should solve much of the first two. It must not pretend to solve the third for a novice unless an explicit coaching mode exists.

## The teaching stack

Prefer this order:

1. **shape / position** — the object looks and sits like something manipulable;
2. **pre-contact signal** — hover, touch-down or neighboring response confirms acquisition;
3. **direct movement** — the object follows the player and reveals possible intent;
4. **environment response** — destinations / neighbors / territories react;
5. **constraint** — impossible commit becomes perceptible before failure;
6. **commit signal** — the irreversible threshold is obvious;
7. **consequence path** — the result visibly follows from the source action;
8. **residue** — the stable post-state preserves the important consequence;
9. **local explanation** — concise text appears only if the player probes something they cannot infer.

Global banners, arrows and modal tutorials are lower-priority fallback tools.

## Language should answer local questions without prose

### `Can I touch this?`
The object should respond at contact / hover with depth, separation or local deformation rather than a generic glowing outline alone.

### `Can I move this?`
The acquired object should begin following motion immediately and surrounding objects should acknowledge that movement.

### `Where can it go?`
Valid destinations should become stronger as the object approaches them. Avoid illuminating every target globally before the player has expressed intent.

### `Why can't I do this?`
Prefer local physical constraint plus concise contextual reason after attempted probing.

Example concept:
- player grabs an illegal card;
- it lifts normally because it is still a real owned object;
- as it tries to leave the hand, motion becomes elastically constrained;
- nearby microcopy can say `Musisz dołożyć ♥` only after the attempt;
- releasing returns the card to its prior local order.

This teaches a rule without a pre-emptive tutorial panel.

### `Did I commit?`
Commit needs its own sensory boundary: target snap / drop acceptance / brief sound / optional haptic notch / source gap closing.

### `What happened because of it?`
Consequences should emerge from the action source and travel toward their destination where practical.

A score change that simply updates in a remote HUD is weaker than a consequence visibly originating from the trick or scoring source.

### `What do I do now?`
The next interactive territory should become naturally available and responsive. Avoid a giant `YOUR TURN` banner as the primary mechanism.

## Progressive revelation rather than permanent guidance

The UI should not show all possible teaching signals simultaneously.

Example sequence:
- idle: calm hand;
- pointer/finger contacts card: that card and nearest neighbors respond;
- card lifts: legal / target information becomes locally relevant;
- card approaches destination: destination responds strongly;
- illegal path: resistance and reason appear;
- release: world resolves and returns to calm.

This keeps the screen quiet while preserving rich guidance at the moment of need.

## Constraint without paternalism

The game rules may forbid an action. The presentation should not make the player feel punished for exploring it.

Desired distinction:
- **exploration** can be permissive;
- **commit** can be strict.

A player may grab, inspect and test the movement of a card even when that card cannot legally be played. The commit boundary is where canonical legality matters.

This allows the UI to teach by safe experimentation.

## Avoid deceptive affordances

Do not:
- make an illegal card look fully accepted then snap it back after a fake consequence;
- show a target as magnetic when the server could never accept it;
- dim objects in a way that suggests hidden information;
- animate predicted score / ownership as final before authority;
- use timing differences that leak private opponent state.

Immediate local response is welcome. False public consequence is not.

## Make the player's hand a teaching surface

The hand is an unusually powerful place to encode rules because it is where the player naturally looks before acting.

Research ideas:
- playable cards have slightly greater physical freedom when touched;
- constrained cards remain visually normal at rest to avoid noisy `enabled/disabled` button language;
- when one card is acquired, other relevant cards can subtly change posture if that helps explain the current rule;
- a card that can declare a marriage may carry a relationship cue to its pair only when selected / relevant, rather than a permanent badge;
- manual ordering can help the player build their own mental model rather than forcing system sorting.

All of these are hypotheses requiring domain-safe validation.

## Opponent actions must teach too

A novice learns not only from their own permitted actions but from seeing other players act.

Therefore opponent action presentation should preserve:
- clear source seat;
- clear moved object;
- clear destination;
- clear consequence;
- enough hold time to understand the event;
- no dependence on text log.

A well-presented opponent move can function as an implicit demonstration without becoming a scripted tutorial.

## Stable world grammar

The same semantic relationship should use the same spatial / sensory language repeatedly.

Potential examples:
- **ownership**: motion toward / resting inside a player's territory;
- **commit**: object crosses a clear acceptance boundary and source closes behind it;
- **constraint**: elastic resistance, not arbitrary red toast;
- **temporary attention**: local scale / contrast / motion;
- **persistent consequence**: stable score/territory/state residue;
- **pending authority**: latched object state, not final consequence;
- **rejection**: release / return plus local reason;
- **next actor**: their interactive region becomes materially available.

Exact visuals remain open. Consistency of meaning is the goal.

## Text policy

Text is not banned. Text should be used where it has high information density and low interruption cost.

Good uses:
- first failed probe reason;
- uncommon rule nuance;
- score breakdown on demand;
- accessible alternative to motion/color/audio;
- rules reference;
- explicit confirmation for unusually destructive / high-consequence action.

Weak uses:
- permanent `YOUR TURN` banner when interaction state can show it;
- `YOU PLAYED A♥` after the card visibly left the player's hand;
- global warning for every constrained card;
- modal tutorial for gestures the objects could demonstrate naturally.

## Learning metrics for Owner sessions

We should observe / ask indirectly:
- what did the Owner try first without instruction?
- did they touch the cards themselves or search for buttons?
- did they discover reordering naturally?
- did they accidentally commit while trying to inspect?
- after an illegal probe, could they predict the next legal attempt?
- after an opponent action, could they identify who acted and what changed?
- did the Owner need to read text to know their turn?
- when confused, where did their gaze / cursor go?
- did the UI answer that probe locally?

Do not lead the Owner by explaining the intended interaction immediately before the test.

## Known hard boundary

No presentation language can make a complete novice infer all strategy or every uncommon rule of a nontrivial card game from pure animation.

The ambition is therefore not `zero documentation`.

It is:

> routine play feels self-evident; exceptional rules are explained locally and on demand; deeper strategy remains something the player learns through play, reference material or optional coaching.

## Research references

- Apple HIG, Gestures: familiar gestures, immediate feedback and predictability during direct manipulation.
- Apple HIG, Drag and Drop: continuous feedback throughout acquisition, movement and destination prediction.
- Apple WWDC 2014, *Ingredients of Great Games*: direct interactions reinforced by instantaneous synchronized feedback.
- Marvel Snap UI/UX portfolio: explicit focus on approachability for non-card-game players and fresh solutions instead of inheriting genre conventions.
- Ben Brode, GDC 2023: mobile targeting failure as evidence that desktop card-game interaction conventions do not automatically transfer to touch.

These references support principles, not visual imitation.