# Experience Foundation — Run 01: Card Object + Hand

Status: research definition. Do not treat as final interaction spec.

## Why this run comes first

The player touches their own cards more than any other object in the product. If cards feel inert and the hand behaves like a row of buttons, later animation, scoring feedback and visual polish will be compensation rather than foundation.

This run intentionally steps away from Tysiąc strategy and asks a lower-level question:

> What must a digital playing card and a private hand do so the player can almost feel them through glass or mouse input?

The goal is not to simulate paper perfectly. The goal is embodied continuity, responsiveness and expressive constraint.

## Research axes

### A. Contact

Question: does touching a card feel like acquiring an object?

Candidate variables:
- first-frame response latency;
- lift distance;
- shadow separation;
- scale / perspective shift;
- slight yaw/pitch based on pointer/finger offset;
- neighboring-card response;
- audio onset;
- optional haptic contact cue.

Failure modes:
- button hover disguised as physicality;
- delayed response;
- huge scale pop with no continuity;
- card jumps away from the finger;
- visual response stronger than the actual action.

### B. Hold / possession

Question: once acquired, does the card feel continuously held?

Candidate behavior:
- card follows pointer/finger with intentional lag characteristics, not arbitrary easing;
- rotation derives from movement vector / grab point;
- shadow and elevation communicate separation from hand;
- original slot remains spatially meaningful;
- hand responds around the held card;
- no duplicate card appears to be equally real.

Potential experiment: direct 1:1 tracking versus slightly inertial tracking. We should not assume more inertia always feels better.

### C. Hand deformation

Question: does the hand itself behave like a living container?

When a card is lifted:
- neighbors may open a gap;
- fan curvature may rebalance;
- overlap may reduce locally;
- card origins remain legible;
- movement should propagate with decreasing amplitude instead of every card moving identically.

The hand should feel connected, not like independent buttons in a flex row.

### D. Reordering

Owner requirement: manual ordering is first-class, not QoL garnish.

Research target:
- horizontal manipulation inside hand reorders;
- neighbors preview the insertion slot continuously;
- release settles cards with mass / spring;
- ordering remains the player's local presentation preference;
- gameplay authority does not care about visual order.

Open questions:
- free drag versus discrete slots;
- whether the fan itself reshapes around the insertion point;
- whether very fast flick-reorder should exist;
- whether sorting buttons coexist with manual order or undermine ownership;
- how newly received cards enter an intentionally ordered hand.

Architecture requirement:
`HandLayoutState` should be presentation-only and keyed by stable `CardId`, merged against each new `SeatProjection.ownHand`.

A state update should remove missing cards, preserve surviving order and insert genuinely new cards according to an explicit presentation policy rather than silently trusting canonical sort order.

### E. Probe without commit

A new player must be allowed to explore.

Touching / grabbing a card should reveal information about possibility before commitment.

Possible language:
- cards that can participate respond more freely;
- potential destinations become perceptible as the card approaches;
- impossible commit paths develop elastic resistance;
- releasing before a commit threshold returns the card naturally;
- failed exploration is cheap and safe.

This is a core anti-tutorial strategy: the player learns by probing the system.

### F. Play versus reorder disambiguation

On mobile, the same object needs at least two common manipulations:
- horizontal: organize my hand;
- outward/upward: attempt to play.

This needs a gesture field, not hidden mode switching.

Hypothesis to test:
- initial movement within a hand corridor remains reorder intent;
- leaving the corridor vertically transitions toward play intent;
- geometry and neighboring-card movement make the current interpretation visible;
- the transition remains reversible until release/commit;
- a direct tap alternative remains available if drag interaction is inaccessible.

Do not hard-code this as final behavior before testing.

### G. Legal constraint as material behavior

The UI should communicate legality without making the player read a rule banner for routine cases.

Candidate experiment:
- legal card separates cleanly from the hand and valid destination develops attraction;
- illegal card can still be touched and inspected, but leaving the hand creates increasing elastic resistance;
- release returns it to exactly its local position;
- if the player persists, a concise local reason can appear near the card or destination.

Important: constraint must correspond only to canonical legal commands. Presentation cannot infer hidden reasons.

### H. Commit threshold

The player must feel the difference between manipulation and an irreversible action.

Things to test:
- crossing a spatial boundary;
- destination snap / magnetism;
- release inside an acceptance region;
- short commit sound;
- haptic notch when available;
- brief pose while authoritative acceptance arrives.

A commit should not be a surprise.

### I. Network latency as physical state

Do not hide latency by falsely completing the action.

Possible honest state:
1. user releases at a valid commit target;
2. card enters a held/latched presentation pose;
3. local hand has already acknowledged the intended removal but does not show public consequence as final;
4. authoritative acceptance seamlessly continues the trajectory;
5. rejection releases the latch and returns the object with a local reason.

This may feel better than a spinner because it keeps latency attached to the object whose action is pending.

### J. Receive / draw / exchange

Incoming cards deserve a coherent entrance.

Research questions:
- should a new card land at an edge, a temporary staging gap or a deterministic sort destination?
- if the player manually ordered the hand, should automatic insertion ever reorder existing cards? Default hypothesis: no.
- how long should a newly received card remain visually identifiable?
- should the hand physically make room before the card enters?

### K. Remove / play

When a card leaves:
- its old neighbors should close the gap causally;
- the card should preserve identity from hand to destination;
- hand reflow must not happen before the player's eye can understand which card left;
- the reflow should not create enough motion to distract from the played card.

### L. Idle tactility

Physical card players often fidget: fan, reorder, slide, tap, inspect.

We should explore safe non-gameplay manipulation while waiting:
- reorder own cards;
- lightly lift / fan / inspect;
- possibly micro-fidget interactions that never change authority.

This can create life during opponent turns without fake activity or decorative board toys.

## First-person asymmetry

The player's own cards should have much higher interaction fidelity than opponent cards.

This is desirable, not inconsistent:
- own hand: detailed, close, responsive, manipulable;
- opponent hand: distant, information-limited, card backs / counts / motion only;
- played public cards: high fidelity once public.

The product does not need to pretend all three players share a symmetric camera.

## Mobile-specific investigation

Questions:
- one-thumb reach versus two-hand use;
- avoiding finger occlusion of rank/suit while dragging;
- grab offset so the card can rise slightly above the finger;
- whether hand fan geometry should adapt to current touch position;
- bottom safe-area behavior;
- accidental browser gestures / selection suppression;
- optional vibration only as reinforcement, never information.

## Desktop-specific investigation

Questions:
- hover as pre-contact information without turning every card into a glowing button;
- mouse-down acquisition versus click selection;
- wheel / keyboard alternatives for ordering and selection;
- pointer precision allowing smaller gaps without losing tactility;
- richer parallax / tilt without visual noise.

## Required torture cases

A candidate system should be tested under:
- reorder 20 times quickly;
- repeatedly swap two adjacent cards;
- drag a card out and cancel 20 times;
- legal / illegal / legal card sequence;
- receive two cards into a manually ordered hand;
- play from first, middle and last hand positions;
- server accept with 30 ms, 250 ms, 800 ms simulated latency;
- one forced rejection;
- resize / mobile rotation / reconnect while no drag is active;
- reduced motion;
- sound off;
- haptics unavailable;
- touch and mouse.

## Owner test language

Useful raw Owner reactions include:
- `karta klei się do palca`;
- `czuję jakbym ją podnosił`;
- `plastik`;
- `pływa`;
- `za lekka`;
- `za ciężka`;
- `gubię kartę pod palcem`;
- `zajebiście się je przekłada`;
- `nie wiem czy właśnie zagrałem czy tylko przesunąłem`;
- `ręka żyje`;
- `wszystko mi skacze`;
- `nie potrzebuję instrukcji, to było oczywiste`.

Do not rewrite the raw reaction before recording it.

## Promotion criteria

Run 01 is not complete because one animation looks good.

A primitive becomes a candidate for runtime only when:
- direct manipulation feels materially better than the current button-like interaction;
- the player can safely explore without accidental commit;
- reorder feels satisfying and remains stable across state changes;
- legality is more understandable without global tutorial chrome;
- common actions remain pleasant after repetition;
- feedback remains truthful under latency/rejection;
- mobile and desktop each exploit their input strengths;
- reduced-motion / alternate input retains clarity.

## Explicit non-goals

Not in this run:
- final card art;
- Tysiąc strategy evaluation;
- final table layout;
- scoring celebration;
- final audio asset production;
- full runtime rewrite;
- broad animation system.

The purpose is to discover the behavioral material from which the rest of the experience can later be built.