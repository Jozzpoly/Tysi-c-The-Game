# Desktop Body Interaction Model

Status: parity track opened after Owner-alignment audit.

## Why this exists

Mobile embodiment is currently better researched than desktop embodiment.

That is not acceptable for the long-term product target: desktop and mobile are equally important.

The semantic interaction system should be shared where appropriate, but desktop must not become `mobile enlarged onto a wide screen`.

Desktop has its own body:

- mouse/trackpad;
- pointer acceleration and speed;
- hover/proximity;
- high acquisition precision;
- larger travel distances;
- wheel/scroll;
- keyboard modifiers/shortcuts;
- larger and more variable viewport geometry;
- possibility of dense simultaneous information;
- hand/arm posture different from direct touch.

## Core principle

**Semantic parity does not require motor parity.**

If the semantic operation is `reorder this card`, mobile may use direct touch while desktop may exploit hover feedforward, high-precision drag, wheel/keyboard support or other shortcuts.

Correctness must never depend on hover because touch/keyboard alternatives exist, but hover can be an exceptionally useful desktop feedforward channel.

## Desktop interaction questions

### Acquisition

- how large should the motor target be relative to visible card overlap?
- can overlapped cards expose precise hit regions without making the visual fan sparse?
- how should hover reveal which card would be acquired?
- how do rapid pointer crossings avoid flickering focus?

### Grab point

Mouse acquisition is precise enough that grab location may carry more deliberate information than on touch.

Questions:

- should edge/corner grab location influence rotation/lever response?
- is preserving exact grab point useful or merely theatrical on desktop?
- should double-click / click-drag thresholds differ from touch pickup thresholds?

### Pointer speed and travel

Desktop users can move the pointer across large distances very quickly.

A material law that works under thumb velocities may become unstable or exaggerated under mouse acceleration.

Research should include:

- slow precision;
- rapid flick across the hand;
- large cross-screen movement;
- abrupt reversal;
- trackpad vs mouse where possible;
- high-DPI pointer behavior.

### Hover as feedforward

Hover can communicate:

- acquisition target;
- legal possibility;
- local relationship/group;
- likely insertion point;
- semantic destination;
- additional inspection detail.

But hover should remain:

- quiet;
- local;
- optional for correctness;
- fast enough not to feel like tooltip UI.

### Reorder

Desktop can support finer insertion control than touch.

Questions:

- does pointer precision justify tighter card spacing?
- can insertion be indicated through neighbor deformation rather than a discrete slot marker?
- should wheel/modifier input help move a held card through a large hand?
- can expert users reorder quickly without waiting for decorative settle?

### Inspect vs manipulate

Mouse makes multiple interaction vocabularies tempting:

- hover = inspect;
- click = select;
- drag = manipulate;
- double click = commit;
- right click = context;
- wheel = alternate dimension.

Do not add mappings merely because the hardware supports them.

Each mapping needs semantic value and low ambiguity.

The preferred interaction should remain discoverable without memorizing desktop-only command grammar.

### Keyboard

Keyboard support can add semantic directness for expert play and accessibility.

Potential roles:

- focus navigation;
- explicit selection;
- cancel/escape;
- confirm/commit;
- quick bid/contract choice where safe;
- move selected card through hand order;
- non-drag alternative for relevant operations.

Do not turn the game into a hotkey tool by default.

## Wide-screen composition

More space is not permission to add more panels.

Desktop can instead use width for:

- stronger spatial ownership between seats;
- clearer causal travel/relationships;
- persistent secondary information at the periphery;
- less overlap where useful;
- richer hand organization;
- simultaneous comparison without modal transitions.

Questions:

- what should remain near the user's pointer/body locus?
- what can live peripherally because desktop gaze travel is cheap?
- which information benefits from persistent presence instead of popovers?
- how does the game avoid a dashboard look on a large screen?

## Pointer vs direct touch

Desktop has weaker literal body/object co-location than touch but stronger precision and lower occlusion.

This means `more physical` cannot be defined as `copy touch drag`.

Possible desktop strengths:

- exact local acquisition;
- high-speed expressive motion;
- hover feedforward;
- fine insertion;
- richer multi-object inspection;
- optional keyboard chords;
- broader scene context.

Possible desktop weaknesses:

- object may feel cursor-driven rather than touched;
- long pointer travel can detach action from spatial consequence;
- hover can create visual noise;
- excessive precision requirements can become tiring;
- drag-heavy interaction can feel like desktop productivity software.

## Desktop materiality hypotheses

Do not assume mobile Card Control parameters transfer.

Research questions:

- should P1-style rotational materiality scale with normalized card-space acceleration rather than raw pointer velocity?
- should desktop use less positional discrepancy than touch because precision expectations are higher?
- can hover/contact transition create material pickup without adding delay?
- can sound/depth do more work than trailing motion on desktop?
- does faster release/flick behavior create useful expressive headroom?

## Desktop hand/workspace hypotheses

The larger viewport may allow stronger user-owned topology:

- wider stable groups;
- meaningful spacing landmarks;
- partial gaps;
- more visible insertion paths;
- less need for automatic compression.

But desktop should not create a different game model from mobile.

A player's conceptual ordering/grouping should remain portable across platforms even if geometry changes.

## Platform parity contract

Shared semantic truths should include:

- card identity;
- ownership;
- personal ordering intention;
- legal possibilities;
- commit boundary;
- authoritative consequence;
- cancel/reject meaning;
- action source/destination;
- persistent state consequence.

Platform-specific embodiment may differ in:

- gesture shape;
- hover;
- amount of physical travel;
- layout density;
- visual offset;
- haptic availability;
- keyboard/wheel support;
- timing/detail of feedforward.

## Internal desktop test families

Before Owner-facing integrated testing, internal fixtures should eventually include:

### D1 — acquisition stress

Overlapping cards at multiple densities, rapid pointer crossings and precise edge acquisition.

### D2 — high-speed control

Slow precision vs high-speed mouse/trackpad sweeps under Card Control candidates.

### D3 — insertion/reorder

Hand-field H0/H1/H2 or later survivors under precise pointer manipulation.

### D4 — hover feedforward

Compare no hover, minimal local hover and richer relationship preview without changing semantic legality.

### D5 — alternate input

Keyboard selection/cancel/confirm or other non-drag equivalents for relevant semantic operations.

### D6 — wide composition

Check whether desktop space improves causal/spatial readability or simply attracts unnecessary UI chrome.

## Failure conditions

Reject/narrow desktop interaction when:

- it is only a scaled mobile layout;
- hover becomes necessary for correctness;
- pointer materiality introduces visible lag during precision work;
- the interface becomes dashboard-dense because space is available;
- desktop adds separate semantic rules users must relearn;
- drag behavior resembles generic file-management/productivity UI more than game interaction;
- keyboard shortcuts become mandatory rather than expert/accessible alternatives;
- mouse and trackpad differ so much that one becomes second-class without justification.

## Donor relevance

Desktop embodiment is especially important for:

- Jozz Vehicle builder/editor;
- JES world/matter authoring;
- Multi World object/world interaction tooling;
- Live NPC inspection/debugging.

Potential donor knowledge includes:

- hover as optional feedforward;
- semantic parity across input bodies;
- precision vs materiality tradeoffs;
- stable spatial workspace under wide-screen layouts;
- expert fluency without mode-heavy tooling.

## Current state

**RESEARCH EARLY / PRIORITY GAP.**

Desktop receives equal long-term product importance from this point onward. It should not wait until mobile interaction is considered finished.
