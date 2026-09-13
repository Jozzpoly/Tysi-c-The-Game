# Card Embodiment Phenomena Map

## Status

Research decomposition only. This document does not specify a final interaction model and does not authorize a prototype yet.

The objective is to stop treating "card feel" as a single animation parameter.

## Core question

What must be true for a digital card to become a coherent controllable object that a person can acquire, manipulate, organize, release, cancel and commit without continuously decoding the interface?

## 1. Acquisition

### 1.1 Perceptual target

The thing that looks touchable/clickable should correspond to the thing that can actually be acquired.

Questions:

- Is the full card an acquisition surface?
- Do overlapping cards create ambiguous hit ownership?
- Does the visible exposed region match activation priority?
- Can a partially obscured card still be intentionally acquired?

### 1.2 Contact confidence

Touch-down should answer immediately:

> which card did I get?

Potential channels:

- tiny lift;
- local depth change;
- neighbor relaxation;
- edge/shadow change;
- subtle sound/haptic where appropriate.

This acknowledgement is local and reversible. It is not commit.

### 1.3 Pickup threshold

Immediate movement on every micro-jitter may feel nervous and cause accidental reordering.

A threshold may be useful, but a threshold that feels like lag destroys directness.

Variables:

- distance threshold;
- time threshold;
- velocity threshold;
- direction confidence;
- touch vs mouse differences.

### 1.4 Grab point

The user does not conceptually grab a card only at its center.

The contact point can affect:

- rotation/pivot;
- perceived mass;
- visibility;
- path during drag;
- release orientation;
- occlusion strategy.

Hypothesis:

Preserving the actual grab point may create stronger object ownership than center-snapping, but may also introduce instability on mobile.

## 2. Finger / pointer relation

### 2.1 Co-location

1:1 co-location maximizes motor directness but on touch it causes occlusion.

### 2.2 Visual offset

The card can be offset from the physical finger to expose important content.

Risks:

- breaks the "under my finger" relation;
- creates jump at pickup;
- makes return/release ambiguous.

### 2.3 Adaptive offset

Possible hypothesis:

The object begins near co-located, then develops a controlled offset as the finger leaves the hand or approaches a precision/commit region.

This might preserve initial embodiment while reducing occlusion later.

### 2.4 Control/display ratio

A strict 1:1 physical-to-visual mapping is not mandatory.

Potential use:

- precision insertion between cards;
- long upward drag with a thumb;
- dense target acquisition.

Failure condition:

The correction becomes noticeable as system takeover rather than an extension of the user's movement.

## 3. Translation dynamics

### 3.1 Position ownership

Question:

Does the card follow the control point exactly, or does it have translational dynamics?

Extreme A: exact tracking
- maximally responsive;
- low material weight;
- high precision.

Extreme B: spring/inertial following
- possible mass;
- risk of sluggishness and control loss.

The useful design space is likely not a single global spring.

### 3.2 Velocity relationship

Possible variables:

- low-speed precision;
- high-speed lag/follow-through;
- direction-change resistance;
- release velocity carryover;
- speed-sensitive tilt/deformation.

### 3.3 Acceleration relationship

Mass may be communicated more effectively by resistance to acceleration than by constant positional delay.

Hypothesis to test later:

Immediate contact + small acceleration-dependent lag may feel heavier than global lag while preserving control.

## 4. Rotation and pivot

Rotation can communicate:

- grab point;
- velocity;
- material flexibility;
- directional intent;
- release.

But excessive yaw/pitch can make text/rank harder to read.

Questions:

- Does rotation derive from grab point?
- From velocity?
- From target relation?
- From all three with hierarchy?
- When should the card re-square for readability?

## 5. Depth / layer transition

Pickup is partly a topological transition:

`member of hand -> controlled object above hand`

The card needs to become visually independent without appearing to clone/teleport.

Potential cues:

- increased separation shadow;
- local scale change;
- fan neighbors yielding;
- overlap priority;
- slight perspective change.

Depth should communicate interaction state, not decorative 3D.

## 6. Occlusion

Mobile recording evidence and touch literature make this first-class.

Occlusion types:

- finger hides rank/suit;
- finger hides insertion gap;
- finger hides target response;
- finger hides neighboring cards;
- hand/palm hides lower-screen content.

Candidate strategies to study separately:

- object offset;
- local proxy/lens;
- exposed corner information;
- target response outside finger footprint;
- dynamic hand expansion;
- temporary scale/fan shift;
- indirect fine-control phase.

No strategy is preselected.

## 7. Hand coupling

A card inside a hand is not an isolated draggable rectangle.

### 7.1 Neighbor displacement

A moving card may push, compress, rotate or open gaps among neighbors.

The important distinction is:

`list reindex animation` vs `continuous multi-object response`.

### 7.2 Propagation

Displacement need not affect all neighbors equally.

Potential model:

- local strong displacement;
- decaying propagation through the fan;
- outer cards constrained by screen/workspace boundaries.

### 7.3 Insertion field

The user should feel where the card would settle before release.

This can emerge from:

- gap opening;
- local attraction;
- neighbor orientation;
- path resistance;
- subtle depth change.

Avoid detached insertion markers if the hand itself can express the slot.

### 7.4 User-created grouping

Future hypothesis:

Spacing and local grouping may encode cognition. The hand should not assume that a perfectly uniform fan is always desirable.

## 8. State continuum

Avoid treating interaction as only `idle/dragging`.

Candidate perceptual states:

1. resting;
2. available;
3. contacted;
4. acquired;
5. exploring inside hand;
6. reorganizing;
7. leaving hand / possible play intent;
8. aiming / target negotiation;
9. commit threshold crossed;
10. pending authority;
11. accepted;
12. rejected;
13. cancelling;
14. returning;
15. settling.

Important:

These are research states, not a required implementation state machine. Several may collapse if perceptually unnecessary.

## 9. Intent inference

The same initial gesture can mean:

- inspect;
- reorder;
- group;
- play;
- cancel.

The system should not decide too early.

Useful evidence sources:

- direction;
- displacement from hand;
- velocity;
- dwell;
- target proximity;
- gesture history;
- platform-specific conventions.

Design target:

**progressive commitment** rather than hidden mode switching.

## 10. Release

Release is a major material event.

Possible meanings:

- settle into new hand location;
- cancel and return;
- enter provisional commit;
- throw with velocity;
- snap into a target.

A release should be interpreted by context, but the interpretation must be legible before/at release where possible.

## 11. Cancel

Cancel is not failure.

It is successful completion of reversible exploration.

Good cancel should preserve dignity:

- no error styling;
- no punishment animation;
- clear return path;
- hand restores coherently;
- user organization remains intact.

## 12. Reject

Reject differs fundamentally from cancel.

The user attempted commit; authority or legality refused it.

Feedback should answer:

- the attempt was heard;
- it did not become canonical;
- why, if explanation is needed;
- what state remains true;
- what can be tried next.

Do not visually pretend the card was accepted and then "time travel" it back unless rollback itself is clearly represented as correction.

## 13. Pending authority

A networked game introduces a state absent from physical cards:

> I have committed locally, but shared reality has not yet confirmed the consequence.

Potential properties:

- control over the card may be reduced;
- the card should remain causally connected to its source/target;
- the UI must not award downstream consequence early;
- latency should not look like a frozen bug.

Need to separate:

- acknowledgement;
- commit intent;
- canonical acceptance;
- consequence.

## 14. Materiality

Do not start from named presets such as PAPER / WEIGHT / MAGNETIC.

Describe materiality as dimensions:

- bending/deformation;
- translational inertia;
- rotational inertia;
- damping;
- spring stiffness;
- surface friction metaphor;
- collision softness;
- neighbor coupling;
- target attraction;
- release follow-through;
- settle behavior;
- acoustic material;
- visual thickness/depth.

A coherent "material" is a relationship among dimensions, not a style toggle.

## 15. Pseudo-haptics

Visual control/display distortion can evoke resistance, friction, stiffness or mass.

This is especially interesting on ordinary touchscreens where real force feedback is absent.

Risks:

- breaking co-location;
- feeling like input lag;
- accessibility/motion issues;
- conflict with authority latency;
- inconsistent response across frame rates/devices.

Treat pseudo-haptics as an experimental family, not a default solution.

## 16. Feedforward

Before action, the user needs evidence about what the object can do.

Feedforward can be inherent in:

- exposed edges;
- fan geometry;
- space opening;
- target posture;
- legal card responsiveness;
- affordance under proximity/contact.

It can also be augmented through text/iconography when the rule is too abstract.

## 17. Feedback coupling dimensions

For every candidate interaction evaluate coupling in:

- **time** — does response occur at the right moment?
- **location** — does it appear where the cause occurred?
- **direction** — does response respect movement/ownership direction?
- **dynamics** — do acceleration, resistance and settle match the event?
- **modality** — do visual/audio/haptic channels describe the same fact?
- **expression** — does the event feel like contact, exploration, rejection, commit, acquisition, etc. rather than generic animation?

## 18. Object identity

A card should remain perceptually the same card across:

- hand;
- held state;
- play transition;
- target placement;
- trick collection;
- ownership/state transition where visible.

If implementation requires DOM/component replacement, presentation must preserve identity through the transition layer.

## 19. Attention

Motion is strong peripheral attention capture.

Therefore:

- held card movement can route attention naturally;
- neighbor movement should remain subordinate;
- unrelated UI should not animate simultaneously;
- consequence should emerge from cause spatially/temporally when possible.

Risk:

rich hand dynamics may steal attention from opponent or table events if not quieted at the right times.

## 20. Platform embodiment

### Mobile

Primary challenges:

- finger occlusion;
- thumb reach;
- contact area ambiguity;
- absence of hover;
- one-hand posture;
- possible haptics;
- edge gestures / browser interference;
- limited workspace.

### Desktop

Primary opportunities:

- precise pointer;
- hover/proximity feedforward;
- larger workspace;
- wheel/modifiers/right-click if justified;
- lower occlusion;
- different natural drag distances.

Shared semantic contract does not imply identical motion parameters or gestures.

## 21. Accessibility embodiment

Card manipulation must eventually support equivalent semantic actions through alternatives such as keyboard/switch/screen reader pathways.

Do not make understanding depend solely on:

- motion;
- color;
- haptics;
- spatial position that has no semantic representation.

## 22. Skill development

A good object should allow skill to emerge.

Potential signs:

- faster reordering without errors;
- deliberate throw/release if supported;
- reliable grouping by feel;
- less visual checking over time;
- user develops personal organization practices.

Avoid over-assistance that caps mastery by constantly snapping/guessing.

## 23. Failure criteria for future prototypes

Reject or revise a Card Embodiment candidate if:

- weight is perceived mainly as lag;
- finger hides the information needed to control the card;
- reordering feels like dragging list items;
- user cannot predict where release will settle;
- accidental play/reorder boundary is common;
- the system steals or rewrites user order;
- rejection reads like rollback from a lie;
- rich dynamics reduce precision or confidence;
- repeated manipulation becomes tiring/annoying;
- desktop/mobile feel like the same implementation merely scaled;
- animation becomes the main source of interest rather than control quality.

## 24. Research axes for isolated experiments

Potential future fixtures should vary as few axes as possible.

A. Grab point
- center normalization;
- exact contact pivot;
- stabilized hybrid.

B. Finger/object relationship
- 1:1 co-located;
- fixed offset;
- adaptive offset.

C. Translation dynamics
- exact;
- acceleration-dependent mass;
- spring lag.

D. Rotation
- none;
- grab-point pivot;
- velocity-derived;
- hybrid.

E. Hand neighbor response
- discrete slot shift;
- continuous local gap;
- propagated elastic fan.

F. Release
- pure settle;
- velocity carry;
- target attraction.

G. Constraint response
- hard refusal;
- elastic resistance;
- target non-acquisition;
- augmented local explanation.

These are dimensions to investigate, not a plan to build every Cartesian combination.

## 25. Current conclusion

The next useful prototype should not be a prettier hand.

It should be an **instrument for measuring the perception-action relationship** of one or two dimensions at a time.

Only after those dimensions become grounded should we synthesize a coherent card material and then a coherent hand.
