# Cross-Project Interaction Failure Model

## Why this exists

`UX is weak` is too coarse to guide research. A project can have excellent simulation, correct state and technically functional controls while still feeling dead, opaque or dishonest.

This model decomposes the human-to-system loop into capabilities that can fail independently.

It is intended to become portable audit language across projects, not a permanent numerical scoring system.

## Capability 1 — Embodiment

**Question:** does the user feel that they are acting on an object/system, or operating controls that indirectly manipulate it?

Failure symptoms:

- buttons substitute for direct manipulation without need;
- dragged objects feel like DOM elements rather than things;
- pointer/finger and represented object lose spatial relationship;
- objects do not respond before commit;
- contact has no material/sensory character.

## Capability 2 — Continuity

**Question:** do objects and states preserve perceptual identity across change?

Failure symptoms:

- teleportation caused by rerender/layout;
- one object disappears and another appears where a transition should exist;
- sorting destroys spatial memory;
- ownership changes without a transfer;
- reconnect or server update visually rewrites the world with no hierarchy between correction and normal change.

## Capability 3 — Agency

**Question:** can users explore, manipulate, revise and commit intentionally?

Failure symptoms:

- touch immediately commits when the user intended inspection;
- hidden modes change gesture meaning;
- cancellation is awkward or unavailable;
- system auto-corrects organization the user wanted to preserve;
- legal actions are technically available but do not feel available.

## Capability 4 — Constraint legibility

**Question:** can users perceive what the world permits and resists through interaction?

Failure symptoms:

- invalidity is revealed only after clicking;
- disabled controls are the primary teaching mechanism;
- rules live in prose instead of behavior;
- every constraint becomes a toast/banner/error;
- the system prevents exploration rather than making exploration informative.

## Capability 5 — Causal legibility

**Question:** can users perceive why the state changed?

Failure symptoms:

- numbers update far from their causes;
- scoring appears as bookkeeping;
- state changes happen between frames without a perceivable transfer;
- important consequences are explained only by logs;
- actions generate several independent UI notifications instead of one causal chain.

## Capability 6 — Authority honesty

**Question:** does presentation distinguish prediction, reversible local response and canonical outcome?

Failure symptoms:

- latency is hidden by pretending an action succeeded;
- optimistic state is indistinguishable from confirmed state;
- rejection looks like time reversal;
- reconnect silently replaces visible history;
- local UI owns facts that should belong to simulation/server authority.

## Capability 7 — Workspace respect

**Question:** does the system preserve user-created organization used for cognition?

Failure symptoms:

- auto-sorting after each update;
- camera/view resets after actions;
- selected/arranged objects lose their structure unnecessarily;
- machine-normalized ordering overrides personal grouping;
- temporary exploratory states are discarded without reason.

## Capability 8 — Attention routing

**Question:** does the interface naturally move attention along the causal path?

Failure symptoms:

- simultaneous highlights everywhere;
- permanent high-contrast chrome;
- central banners interrupt local events;
- user must scan several HUD regions after each action;
- animation calls attention to decoration instead of information.

## Capability 9 — Temporal integrity

**Question:** are response, consequence and recovery timed according to meaning rather than fixed animation budgets?

Failure symptoms:

- input remains locked through cosmetic tails;
- important consequences disappear before comprehension;
- repeated actions have cinematic delays;
- direct manipulation trails the finger so much that it stops feeling direct;
- network timing leaks into object behavior without a designed boundary.

## Capability 10 — Sensory coherence

**Question:** do visual motion, sound, haptics and state change describe the same event?

Failure symptoms:

- sound says `impact` while motion still says `in transit`;
- haptic feedback fires for low-value events until it becomes noise;
- material sound does not match apparent object behavior;
- particles add energy without communicating cause;
- sensory channels duplicate noise rather than reinforce one model.

## Capability 11 — Quiet-life quality

**Question:** is the system alive when no major event is firing?

Failure symptoms:

- completely inert waiting states;
- idle motion used as decorative screensaver rather than state expression;
- no sense of other actors/processes being present;
- player workspace loses responsiveness while waiting;
- the world only feels alive during canned animations.

The target is not constant motion. It is a responsive, inhabited state with room for silence.

## Capability 12 — Failure dignity

**Question:** do mistake, cancel, rejection, latency, interruption and reconnect remain coherent?

Failure symptoms:

- errors break the interaction metaphor;
- rejected actions snap harshly back with generic messaging;
- cancel paths feel second-class;
- disconnect/reconnect dumps users into unexplained state;
- edge cases fall back to raw technical UI.

## Capability 13 — Platform embodiment

**Question:** does the interaction exploit the actual body of the platform?

Mobile concerns:

- finger occlusion;
- thumb arcs;
- grip and reach;
- touch ambiguity;
- gesture cancellation;
- variable device aspect ratios;
- optional haptic capabilities.

Desktop concerns:

- hover as pre-contact information;
- precise pointer trajectories;
- larger spatial memory;
- multi-object inspection;
- keyboard modifiers/shortcuts where they add power without creating hidden dependency.

Failure is treating these as identical layouts at different scales.

## Capability 14 — Information embodiment

**Question:** does abstract state become spatially/sensory legible when useful?

Not every number should become an animation. But high-value state should have an embodied representation when that improves understanding.

Failure symptoms:

- all game state lives in HUD text;
- spatial state and numeric state disagree;
- persistent consequences have no persistent visual trace;
- users repeatedly re-read labels to recover context.

## Capability 15 — Character without deceit

**Question:** does the system have a recognizable interaction character without inventing fake physics or unnecessary theatrics?

Failure symptoms:

- generic premium styling mistaken for personality;
- arbitrary springiness everywhere;
- fake physical detail that conflicts with actual interaction;
- every project inheriting the same component-library feel;
- visual theme detached from behavior.

## Audit use

For a project or feature, do not produce a single UX score first.

Instead:

1. identify which capabilities are relevant;
2. gather concrete evidence for each;
3. mark `unknown`, `weak evidence`, `material failure`, `adequate`, or `strong`;
4. preserve raw Owner observations;
5. select the smallest high-leverage failure to research;
6. avoid polishing dimensions that are already adequate while fundamental ones remain broken.

## Important warning

This framework can itself become bureaucratic UI for research.

Do not fill matrices for their own sake. Use a capability only when it helps distinguish real causes, choose an experiment or preserve a transferable lesson.
