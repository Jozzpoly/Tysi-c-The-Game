# Experience Research Charter

Status: exploratory, presentation-track authority only.

This project is now also an R&D laboratory for high-fidelity, truthful, embodied interface design. Tysiąc remains the local product, but several methods developed here are intentionally transferable to other projects where live feedback, direct manipulation, causal clarity and non-deceptive presentation matter.

## Owner / evidence model

The Owner does not need to be a Tysiąc strategy expert to be a strong experience judge.

Owner experience authority includes:
- tactile / visual feel of touching, holding, dragging, reordering and committing cards;
- readability of cause and consequence;
- perceived responsiveness and latency;
- opponent presence and table rhythm;
- visual hierarchy, composition, motion, audio and haptic feel;
- whether interaction is intuitive without being led by banners, arrows or modal tutorials;
- whether a frequent interaction remains enjoyable after repetition;
- whether UI feels alive, truthful, coherent and worth using.

Owner experience evidence does not certify:
- Tysiąc rule authenticity;
- strategic quality of a move or bot;
- scoring correctness;
- domain-specific balance.

Those remain separate game-truth questions.

## Core research thesis

The UI should not merely display gameplay state. Interaction should make the game's rules and consequences perceptible through the behavior of game objects themselves.

The strongest target is:

> The player can probe the world, feel what is possible, act directly on visible objects, and understand the consequence largely from spatial, material and temporal feedback. Text explains edge cases; it is not the primary teacher.

## Non-negotiable principles

### 1. Direct manipulation before command surfaces

When practical, the player acts on the card itself rather than on a detached button that represents the card action.

The manipulated object should preserve identity continuously under the pointer/finger. It should not teleport, duplicate ambiguously or become a disconnected cursor proxy without a strong reason.

### 2. Immediate reversible response; delayed irreversible claim

Local presentation may respond immediately to contact, drag, lift, hover and pre-commit movement.

It must not visually claim that an authoritative gameplay consequence occurred before authority accepts it.

Therefore:
- touch response may be immediate;
- card lift / tilt / gap opening / target attraction may be immediate;
- irreversible ownership transfer, trick result, score transfer and public consequences wait for authoritative confirmation;
- rejection returns the same object coherently rather than pretending time reversed.

### 3. Physics as language, not decoration

Material behavior may communicate rules.

Examples to investigate:
- legal card: leaves the hand cleanly and attracts toward a valid destination;
- illegal card: remains graspable but encounters a soft elastic constraint before commit;
- reordering: neighboring cards physically make room and settle around the dragged card;
- new ownership: card movement and resting place change spatial territory;
- next lead: authority / attention naturally shifts to the winner's region.

The behavior must not fabricate rule information or leak hidden state.

### 4. Hand as first-person territory

The player's own hand is not a footer list. It is a private, high-fidelity interaction space.

It should have the richest tactile response in the game:
- local ordering controlled by the player;
- stable card identity across state updates;
- intentional insertion/removal behavior;
- strong contact feedback;
- clear but non-paternalistic legal affordance;
- safe exploratory manipulation;
- mobile thumb ergonomics and desktop pointer precision treated separately.

### 5. Self-teaching through affordance, constraint and consequence

The target is not zero text. The target is zero dependence on intrusive instruction for the normal loop.

Learning order:
1. object invites contact;
2. contact reveals manipulability;
3. motion reveals available direction / destination;
4. constraints reveal what cannot be committed;
5. consequence confirms what the action meant;
6. concise local explanation appears only when behavior alone is insufficient.

No giant tutorial banner should be required to understand routine play.

### 6. Calm state, strong response

A living UI is not a permanently animated UI.

Strong contrast is required between:
- decision / observation calm;
- contact response;
- commit;
- consequence;
- escalation events;
- return to calm.

If everything glows, bounces or pulses, hierarchy collapses.

### 7. Repetition is a first-class test

A common action that feels impressive once but irritating after 30 repetitions fails.

Every high-frequency primitive must be tested for:
- novelty decay;
- temporal friction;
- sensory fatigue;
- accidental obstruction of future input;
- readability when the user is no longer paying full attention.

### 8. Platform embodiment, shared semantics

Mobile and desktop share gameplay meaning, not necessarily geometry or gesture details.

Mobile advantages:
- direct finger contact;
- thumb-scale spatial control;
- optional platform haptics;
- physical device movement/orientation only if justified.

Desktop advantages:
- hover / pre-contact feedback;
- precise pointer control;
- more spatial room;
- richer peripheral information.

Do not shrink desktop into mobile or enlarge mobile into desktop.

### 9. Accessibility is an alternate path, not a downgrade

No critical gameplay information may depend only on:
- color;
- sound;
- haptic feedback;
- a single gesture;
- high-amplitude motion.

Reduced-motion and non-drag alternatives should preserve causal clarity and agency.

### 10. Presentation must not become authority

Canonical gameplay remains:

`Command -> reducer -> state + GameEvent[] -> SeatProjection`

Experience may build temporary transition state over viewer-safe before/event/after data, but that state cannot decide legality, scoring, ownership or hidden information.

Reconnect may discard cosmetic history and snap to current authority.

## Research method

Each run should isolate one experiential question and produce:
- a falsifiable hypothesis;
- at least two materially different interaction languages where useful;
- a torture fixture rather than a polished mockup;
- explicit non-goals;
- repeat / interruption / rejection cases;
- Owner raw reaction capture;
- interpretation separated from raw Owner wording;
- a promotion decision: reject / retain primitive / continue research / integrate.

Static screenshots can judge composition. They cannot prove interaction feel.

## Transferable cross-project findings

A finding may be promoted as cross-project knowledge only if it is stated at the right abstraction level.

Good transferable form:
- immediate reversible contact feedback reduces perceived latency without lying about authority;
- consequence is easier to understand when it travels from source to destination;
- local constraint can teach legal action more naturally than global warning UI;
- frequent cosmetic tails should not block future input without a causal need.

Bad transferable form:
- cards should glow cyan;
- use a 260 ms spring;
- place the hand at 38% screen height.

Those are local implementations, not principles.

## Current status

The existing `GameEvent[] + SeatProjection` seam is a strong foundation. The current production UI is still a functional test instrument, not the target experience.

The next major research focus is Card Object + Hand embodiment, followed by self-teaching interaction language and opponent presence.

## External references used as research inputs

- Apple WWDC 2014, *Ingredients of Great Games*: direct interaction reinforced by instantaneous synchronized feedback.
- Apple Human Interface Guidelines: Gestures; Drag and Drop.
- Hearthstone development interviews / GDC material: physicality, card weight, drag yaw/pitch, tactile UI and UI-as-game.
- Marvel Snap UX portfolio / GDC material: cards as visual-hierarchy priority, mobile ergonomics and willingness to reject inherited card-game conventions.

References inform hypotheses; they are not templates to copy.