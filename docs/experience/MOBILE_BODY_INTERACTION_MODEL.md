# Mobile Body Interaction Model

## Status

Research foundation only. No gesture or layout is selected by this document.

## Thesis

`Mobile` is not a viewport size. It is a family of body-device configurations.

A card interaction that works at 390×844 in a desktop emulator can still fail on a real phone because the human body introduces:

- thumb reach limits;
- grip changes;
- finger occlusion;
- contact-area ambiguity;
- device motion;
- handedness;
- posture;
- one-hand vs two-hand support;
- thumb/index choice;
- edge-gesture interference;
- fatigue under repetition.

Therefore mobile embodiment must eventually be validated against physical use conditions, not only browser layout.

## 1. Interaction-body conditions

At minimum, later mobile research should distinguish several common bodies.

### M1 — one-handed holding-hand thumb

The phone is held and controlled primarily by the same hand/thumb.

Characteristics:

- strongest reach constraints;
- substantial finger occlusion;
- device stability changes as the thumb stretches;
- large upward/cross-screen drags may require grip shift;
- cancellation must remain possible without dangerous hand repositioning.

This is the most demanding condition and should be supported, but should not automatically define every geometry choice.

### M2 — two-handed support, active thumb

The device is supported by both hands while one thumb performs a manipulation.

Characteristics:

- greater stability;
- different reachable region;
- potentially better precision;
- less need to compromise grip during longer motion.

This can support richer manipulation without proving that the same interaction is good one-handed.

### M3 — two-handed / index-finger direct touch

The device is supported in one or both hands while an index finger performs interaction.

Characteristics:

- different occlusion footprint and direction;
- different reach geometry;
- potentially longer/cleaner drags;
- weaker assumption that controls must remain in the lower thumb zone.

### M4 — transient posture / changing grip

Real users may shift between one- and two-handed use or adjust grip during play.

The interface should not require a persistent declared `hand mode` unless evidence later justifies such a feature.

## 2. Evidence boundary

Existing ergonomics research demonstrates that reach, precision, comfort and device stability vary with thumb distance/direction, phone size, hand size and grip configuration.

This supports the general claim that body configuration matters.

It does **not** give us one universal `safe thumb zone` to hardcode for all users and phones.

The future design should therefore use ergonomic research as a prior and real-device Owner/player evidence as calibration.

## 3. Hand placement should influence topology decisions

A player-owned hand near the lower screen has a natural ergonomic advantage for thumb interaction, but placement should be judged by more than reach.

Questions:

- Can the thumb acquire individual cards without excessive stretch?
- Does pulling a card into play require the thumb to travel through its least comfortable region?
- Is the important card information hidden under the finger during the stretch?
- Does the user need to regrip the phone to reach a commit target?
- Can cancel/return be executed safely when the thumb is near its range limit?
- Does the lower screen become overcrowded because we over-prioritize reach?

The interaction path matters, not only endpoint target placement.

## 4. Occlusion is body-relative

Screen recordings hide the real finger.

Future mobile apparatus should model at least an approximate finger footprint around the physical touch point for internal visualization.

This footprint is not a hitbox and should not be presented to the user. It is a research overlay that helps answer:

- what card information is physically covered?
- what neighboring cards become invisible?
- is the insertion gap visible?
- can the target response be seen without moving attention away from the contact?

The approximate footprint must be treated as a model, not measurement of the Owner's actual finger.

## 5. Reach and occlusion interact

At extreme thumb reach, the angle of the thumb/finger changes. The occlusion shape and contact posture therefore change too.

A future adaptive occlusion strategy should not assume a fixed circular finger mask or fixed upward offset.

Potentially useful principles:

- maintain strong contact relation near acquisition;
- reveal information outside the occluded region as precision needs rise;
- allow the workspace itself to deform/open rather than always moving the card away from the finger;
- avoid requiring the thumb to cross a large distance only to reveal what it already covers.

## 6. Grip change is an interaction cost

A motion can be technically reachable but still force the user to loosen or shift grip.

That cost matters because repeated card manipulation occurs many times per match.

Future testing should watch for:

- visible hand repositioning when an external camera is used;
- pauses before long reaches;
- repeated misses at distant regions;
- comments about strain or awkwardness;
- preference for two-handed posture after several repetitions.

Do not force external-camera recording for every session. Use it selectively when body geometry is the actual research question.

## 7. One-handed support must not reduce the game to the bottom third

Ergonomic reachability can tempt the design toward putting every important control near the thumb.

That would flatten spatial semantics and make the screen feel like a control panel.

Better goal:

- keep high-frequency acquisition/manipulation locally reachable;
- allow distant game state to remain readable without frequent direct touch;
- use object movement/semantic relationships to bridge the lower personal workspace and shared play space;
- reserve occasional far targets for actions whose semantic importance justifies the reach, or provide equivalent nearer commitment mechanics.

## 8. Direct-touch travel is not free

Dragging from the bottom hand to a distant central/top play region has several costs:

- thumb extension;
- finger/card occlusion over a longer path;
- increased opportunity for grip shift;
- longer time under active control;
- possible browser/edge gesture conflict;
- more visual travel than the gameplay semantics may require.

Therefore the final product should not assume that `physically drag card all the way to the center` is inherently more embodied than a shorter meaningful gesture.

This is a direct example of motor directness potentially conflicting with semantic/ergonomic directness.

## 9. Future candidate strategies for long semantic transfers

Keep several families open:

### Full direct transfer

The card is carried continuously from hand to destination.

Benefit: strong object continuity.
Risk: reach/occlusion/fatigue.

### Commit-threshold transfer

The player directly manipulates through a local departure/commit region; after commit the authoritative/presentation choreography completes the longer shared-space transfer.

Benefit: short body motion with preserved causal continuity.
Risk: commit threshold must be legible and not feel like the system stole the card.

### Local throw/flick

Velocity/direction expresses intent and the card continues after release.

Benefit: expressive and short physical range.
Risk: motor precision, accidental action, accessibility and novelty/fatigue concerns.

### Tap/select + embodied confirmation

Acquisition/inspection is tactile, but final play uses a second simple semantic action.

Benefit: robust and accessible.
Risk: may feel more modal/less embodied.

None is currently preferred. The final solution can differ across mobile and desktop if semantic truth is preserved.

## 10. Body state should not be over-inferred

It may eventually be possible to infer handedness/posture from touch positions or interaction history.

Do not begin there.

Hidden adaptation can itself reduce control fidelity when the interface moves or changes behavior unexpectedly.

Prefer initially:

- layouts tolerant of multiple grips;
- stable interaction laws;
- explicit optional settings only if strong evidence shows need;
- adaptation that changes subtly and reversibly rather than rearranging the whole interface.

## 11. Haptics and physical device feedback

Mobile uniquely offers device vibration/haptic channels on some platforms, but support differs substantially by browser/OS.

Haptic research belongs later in sensory orchestration. It should reinforce a semantic event such as contact/commit, not be required for understanding.

Do not let stronger native-platform haptics become a hidden reason to make the web experience semantically incomplete.

## 12. Accessibility/body diversity

Hand size, motor range, tremor, dexterity and grip ability vary.

The donor lesson should not be `design for average thumb`.

It should be:

**design a semantic interaction with multiple viable bodily expressions and avoid making motor difficulty part of the game unless it is intentionally valuable.**

Equivalent actions may later require:

- tap/select paths;
- keyboard or switch input;
- reduced motion;
- larger target spacing;
- adjustable interaction assistance.

## 13. Internal research overlays

A future INTERNAL fixture may optionally display after a gesture:

- touch/control path;
- approximate occlusion envelope;
- distance from starting natural hand region;
- card path;
- card-control divergence;
- commit/cancel location;
- correction movements.

Keep these overlays out of the active interaction itself unless the overlay is the research variable. They must not change how the gesture feels.

## 14. Owner-test protocol later

When mobile embodiment becomes OWNER READY, a minimal body-condition test should eventually include:

- natural one-handed use without instruction about ideal grip;
- deliberate two-handed use;
- repeated manipulation, not one demo;
- explicit note when the Owner changes grip spontaneously;
- one or more long-reach/precision/cancel tasks;
- raw comments on strain, occlusion and confidence;
- screen recording plus optional short external-camera evidence only for a body-specific question.

Do not ask the Owner to perform ergonomic measurements or fill forms.

## 15. Cross-project donor value

### Jozz Vehicle browser/mobile future

Direct manipulation cannot assume mouse geometry when eventually adapted to touch. The same semantic component edit may need a shorter bodily gesture or different control instrument.

### Multi World

Object pickup/use/throw interactions need to account for device grip, camera control and thumb competition for screen space.

### JES

Mobile world editing, if ever important, should not be a desktop gizmo shrunk onto a phone.

## Current conclusion

The mobile body is part of the interaction system.

Future Card Embodiment research must distinguish:

`screen geometry` from `reachable body geometry` from `visible geometry under the finger`.

The final interaction should be robust across several common postures rather than optimized around one idealized thumb heatmap.
