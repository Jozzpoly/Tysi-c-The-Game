# Semantic Contract and Alternate Embodiment

Status: cross-cutting interaction research. This is not a final accessibility implementation plan.

## Thesis

A strong interaction primitive has two layers:

1. **semantic contract** — what the user is trying to do and what state transition is possible;
2. **embodiment** — how a particular body/input/display expresses that contract.

A drag gesture is therefore not the domain action itself.

Example:

`reorder card A between B and C`

may be embodied as:

- direct drag;
- tap/select A, then tap an insertion location;
- keyboard focus + move-left/move-right commands;
- an accessible contextual move control;
- another future input method.

These embodiments should share the same truth/authority semantics even if their feel differs.

## Why this matters beyond accessibility

If the design cannot explain the operation without naming the gesture, the gesture may have leaked into the domain model.

Separating semantics from embodiment improves:

- mobile/desktop parity;
- alternate-input support;
- reduced-motion behavior;
- testability;
- multiplayer authority handling;
- donor transfer into other projects.

## Current web accessibility boundary

WCAG 2.2 Success Criterion 2.5.7 requires functionality that uses dragging movements to be achievable through a single-pointer method that does not require dragging, unless dragging is essential.

WCAG also separately requires keyboard access and supports concurrent input modalities.

This should be treated as a design constraint early, not as a late compliance patch.

## Card-hand semantic candidates

### Acquire / focus

Semantic intent:

`make this card the current object of interaction`

Possible embodiments:

- pointer/touch contact;
- click/tap selection;
- keyboard focus.

### Inspect

Semantic intent:

`expose/read this card without committing game state`

Possible embodiments:

- reversible lift/drag;
- tap-to-expand;
- keyboard detail state.

### Reorder

Semantic intent:

`change local presentation topology of owned cards`

This is presentation state, not canonical game state.

### Play attempt

Semantic intent:

`propose this card as the next canonical play command`

This is distinct from simply moving the representation out of the hand.

### Cancel

Semantic intent:

`end reversible manipulation without attempting canonical commit`

### Commit

Semantic intent:

`cross the local intent boundary and submit the command`

### Reject

Semantic result:

`authority did not accept attempted commit`

These semantics must survive input method changes.

## Direct drag remains valuable

Providing an alternative does not mean flattening the rich embodied path.

Direct manipulation can remain the premium/default interaction because it may offer:

- motor ownership;
- material response;
- spatial feedforward;
- expressive control;
- rapid expert interaction.

The alternate path exists because not every body/context can perform the same gesture reliably.

The design target is **semantic parity, not sensory identity**.

## Reduced-motion implication

Motion may carry several different kinds of information:

- object identity continuity;
- direction/source;
- ownership transfer;
- decoration/amplification.

Reduced motion should preserve the first three meanings through alternate cues where needed while removing or compressing nonessential motion.

Possible substitutions later:

- instant state placement + transient source/destination emphasis;
- short opacity/scale transition rather than travel;
- persistent ownership trace;
- local textual clarification only when necessary.

Reduced motion is therefore a test of whether motion semantics are actually specified.

## Target size versus visual geometry

Interactive hit geometry may be larger than visible card detail, especially on touch.

This is acceptable only if contact fidelity remains understandable.

A large invisible target that steals neighboring interactions is not accessibility; it is a contact-truth failure.

The target model must consider:

- minimum operable size;
- spacing;
- overlap arbitration;
- card fan occlusion;
- z-order;
- which visible object appears to own the hit.

## Progressive commitment across embodiments

The same commitment boundary can be expressed differently.

### Drag embodiment

`reversible movement -> departure/target relation -> release/commit`

### Tap embodiment

`select -> show possible destination/operation -> second activation commits`

### Keyboard embodiment

`focus -> invoke play/reorder command -> confirm where ambiguity/risk requires`

The canonical command should not care which embodiment produced it.

## Feedforward parity

Each embodiment needs a way to answer before commit:

- what can I do?
- what am I currently doing?
- what will happen if I finish this action?
- how do I cancel?

The answer does not have to look identical.

## Failure dignity parity

Cancel/reject/authority correction must remain semantically consistent across inputs.

Avoid:

- rich drag cancel but generic modal error for keyboard;
- tap mode that commits earlier than drag mode without warning;
- alternate input that bypasses important confirmation semantics;
- reduced-motion path that makes authority transitions ambiguous.

## Donor implication

This distinction is highly transferable.

### Jozz Vehicle

`stretch component`, `connect node`, `change parameter` are semantic operations that may have gizmo, direct-drag, numeric and keyboard embodiments.

### JES

`apply tool/material operation here` should survive pointer, touch and potentially precision/assistive inputs.

### Multi World

`pick up`, `attach`, `use`, `move` should not be defined only by one controller gesture.

## Research gate

A future interaction candidate should answer:

- what is the semantic operation?
- what is reversible presentation-only state?
- where is commit?
- what canonical command is emitted?
- what are at least two plausible embodiments?
- what meaning is carried only by motion and how is it preserved under reduced motion?

Do not turn this into a mandatory form for every trivial button. Use it where embodied interaction is structurally important.

## Current conclusion

Accessibility and alternate input are not downstream polish.

They are useful adversarial tests of whether the project has separated **meaning from gesture**.

Rich direct manipulation remains a central goal, but no essential game function should become conceptually inseparable from one motor technique without a strong reason.

## Current standards references

- W3C WCAG 2.2, SC 2.5.7 Dragging Movements.
- W3C WCAG 2.2, Guideline 2.5 Input Modalities.
- W3C techniques for `prefers-reduced-motion` / Animation from Interactions.
