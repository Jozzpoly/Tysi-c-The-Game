# Experience Character and Sensory Composition

Status: priority research track created after Owner-alignment audit.

## Why this exists

Run 03 has become comparatively strong at interaction truth and low-level control.

That is not enough.

A system can be:

- causally honest;
- responsive;
- accessible;
- mechanically stable;
- semantically clear;

and still feel sterile, generic or emotionally empty.

The Owner's target is not `correct UX`. It is a living, meaty, recognizable experience whose interface and feedback feel like a continuation of the system itself.

This track asks how **visual composition, motion, sound, optional haptics, typography, spatial hierarchy, quiet and impact** combine into one interaction character.

It is not final art direction yet.

## Core principle

**Character should emerge from coherent relationships among causes and channels, not from a style adjective applied afterwards.**

Do not begin with:

- premium;
- cyber;
- elegant;
- tactile;
- arcade;
- casino;
- realistic;
- futuristic.

Those labels bias implementation before the experiential mechanics are understood.

Instead identify observable qualities and build a character from them.

## Known Owner taste boundaries

These are **evidence from prior exploration**, not a final style brief.

Current negative boundaries:

- avoid a felt-table / poker-room metaphor as the primary visual identity;
- avoid wood/leather/heavy skeuomorphism as the default route to `physicality`;
- avoid fantasy-CCG visual language by habit;
- avoid old-web / Kurnik-like product presentation;
- avoid sterile SaaS/dashboard composition;
- avoid generic `premium dark glass + glow` as a substitute for character;
- avoid treating digital-first as synonymous with neon or futuristic chrome.

Current positive directional evidence:

- modern, digital-first presentation is attractive when it serves the cards/actions rather than becoming a dashboard;
- the game should feel materially responsive without pretending to be a literal real-world table;
- cards and the private hand deserve unusually strong visual/interaction priority;
- feedback after actions should form part of the gameplay language, not merely decorate it;
- the final product should feel distinct enough to act as a reference/donor for future Owner projects.

These boundaries should constrain reference exploration without prematurely fixing a theme.

## Character is multi-channel

### Visual form

Potential carriers:

- card anatomy;
- edge/thickness treatment;
- depth;
- overlap;
- surface response;
- shadows/occlusion;
- semantic color;
- typography hierarchy;
- spatial ownership;
- negative space;
- persistent traces.

### Motion

Potential carriers:

- pickup threshold;
- acceleration;
- rotation;
- resistance;
- transfer;
- impact;
- settle;
- anticipation;
- continuity;
- interruption/rejection;
- quiet-life microresponse.

Motion is not an overlay. It is one channel through which the system exposes relationship and consequence.

### Sound

Potential semantic families:

- first contact;
- lift/separation;
- slide/reorder;
- insertion threshold;
- commit;
- accepted transfer;
- card-to-table / card-to-stack impact;
- trick/capture collection;
- score/consequence transfer;
- rejection/cancel;
- rare decisive resolution.

Do not use one generic click family for every action.

Sound should help communicate material/state distinctions without becoming required for correctness.

### Haptics

Potential uses where supported:

- contact confirmation;
- threshold crossing;
- commit boundary;
- compact impact;
- rare high-importance resolution.

Haptics are progressive enhancement. They must never become the only channel carrying important information.

### Typography

Typography is not just labels.

It can participate in:

- hierarchy;
- ownership;
- intensity;
- transition between quiet state and consequence;
- numeric before/delta/after communication;
- contract/risk emphasis;
- visual rhythm.

Avoid turning semantic information into a dashboard of equally weighted text blocks.

## Dynamic range

The interface needs sensory headroom.

If normal interaction is constantly loud, rare events cannot feel important.

Working intensity model:

- **rest / periphery** — quiet, inhabited, stable;
- **contact / affordance** — local acknowledgement;
- **ordinary manipulation** — responsive but restrained;
- **commit / transfer** — clearer directional consequence;
- **meaningful resolution** — stronger spatial/sensory emphasis;
- **rare decisive event** — allowed to temporarily reshape composition/rhythm.

This is a relational scale, not a fixed numeric score.

## Quiet does not mean dead

A living interface can remain mostly quiet.

At rest:

- objects retain clear identity and ownership;
- subtle spatial/material state is visible;
- no decorative animation competes for attention;
- the interface appears ready to respond rather than frozen.

Life should become visible when a meaningful relationship becomes active.

## Causal channel composition

For any event, ask:

1. **where is the cause?**
2. **what object/state is affected?**
3. **where should attention move?**
4. **which channels are necessary?**
5. **what persists afterwards?**
6. **when can the scene become quiet again?**

Ordinary actions should often need only a small subset of channels.

Rare events may earn richer composition.

Avoid `visual + sound + haptic + particle + text` as a default recipe.

## First Living Slice sensory grammar

The selected internal synthesis target is the ordinary moment in which the local player closes a trick with the third card.

This is not yet a style specification. It is a **semantic channel allocation** meant to prevent later `add juice everywhere` design.

### Resting hand

Primary channels:

- stable visual topology;
- readable card identity/depth;
- quiet spatial ownership.

Usually silent:

- no repeating sound;
- no decorative haptic;
- no continuous idle animation that competes for attention.

Target quality:

`ready / inhabited`, not `animated`.

### Contact / pickup

Primary:

- immediate local depth/separation response;
- Card Control response around the actual grab point;
- small local neighbor response where useful.

Secondary candidates:

- very light contact/lift sound;
- optional compact haptic on supported mobile hardware.

Avoid:

- global highlight;
- text;
- a large bounce that implies commit.

### Reorder / private manipulation

Primary:

- relational hand deformation;
- insertion feedforward;
- persistent control ownership.

Secondary candidate:

- extremely restrained slide/insertion audio only where a discrete relation is crossed.

Haptic caution:

Do not vibrate continuously while dragging. If haptic is useful at all, candidate moments are discrete insertion/commit boundaries.

### Play-probe relation

Primary:

- spatial relationship between held card and shared trick;
- legal destination/relation becomes receptive;
- illegal relation remains non-receptive without killing the card's private capabilities.

Secondary:

- semantic color/depth or local geometry change;
- local explanation only after uncertainty/failed probe if the rule requires it.

Usually silent:

- no failure siren during mere exploration;
- no success sound before commit/authority.

### Commit

Primary:

- clear change in control relation: reversible manipulation becomes submitted action;
- directional motion toward the shared scene.

Secondary:

- compact commit sound;
- optional discrete haptic.

The commit cue should be stronger than pickup but weaker than trick resolution.

### Pending authority

Primary:

- continuity of intended relation without pretending success.

Secondary:

- only if latency becomes perceptible, a progressive pending treatment.

Usually silent:

- no repeated spinner-like audio;
- no score/winner cue.

### Accepted card arrival

Primary:

- visual identity reaches shared trick anchor;
- source ownership remains understandable.

Secondary:

- concise material impact/placement sound.

Haptic may be redundant here if commit already had a cue; do not double-pulse by default.

### Trick closure / winner resolution

Primary:

- composition/ownership change inside the shared scene;
- winner becomes spatially legible;
- attention moves from the arriving card to the whole trick relation.

Secondary:

- stronger but still ordinary resolution sound;
- semantic emphasis tied to winner/collection, not a generic celebratory burst.

Avoid:

- screen-wide celebration for a normal trick;
- detached `+points` toast as the primary explanation;
- one identical sound regardless of source/consequence if material differences later prove meaningful.

### Collection

Primary:

- directional motion of the three-card result toward winner ownership/captured region;
- cards retain enough identity during transfer to explain cause.

Secondary:

- grouped collection/stacking sound with compact temporal shape.

This is a strong candidate for perceived opponent/player presence because ownership has visible direction.

### Point consequence

Primary:

- before/delta/after relationship at the destination that owns the result;
- change emerges from the captured trick relation.

Secondary:

- restrained value accent if useful.

Text/numbers are valid here because the value itself is symbolic, but they should be causally attached to the source rather than appearing as unrelated HUD churn.

### Next initiative

Primary:

- newly active seat/hand becomes locally ready/salient;
- previous consequence begins to settle toward periphery.

Secondary:

- possibly a very subtle readiness cue.

Avoid routine `YOUR TURN` banner dependency once the spatial language is learnable.

### Settle

Primary:

- stable after-state;
- useful persistent consequences remain;
- transient emphasis fades.

Sound/haptic:

- normally nothing additional.

The scene earns silence again.

## Cross-channel rules for the Living Slice

1. **Visual-only must remain semantically sufficient.** Sound/haptic improve feel and attention but do not carry exclusive rule information.
2. **One cause should not emit unrelated feedback from multiple distant places.** Prefer source/destination continuity.
3. **Do not spend maximum intensity on common trick closure.** Marriage, hand resolution and match resolution need headroom later.
4. **Do not encode domain illegality as physical pain.** Illegal relation may fail to become receptive; the card itself remains alive in private workspace.
5. **Authority status has its own language.** Network uncertainty must not sound/feel like card mass or rule failure.
6. **Reduced-motion mode preserves semantic staging.** It may use shorter spatial transitions, crossfades, local state changes and persistent consequence rather than removing causal order.
7. **Sound-off and no-haptic remain first-class states.** The game cannot become dead or incomprehensible when those channels are unavailable.

## Character must survive repetition

The first-use `wow` is not sufficient.

A strong sensory language should become:

- more readable with familiarity;
- less consciously noticed when routine;
- still satisfying under repetition;
- capable of stronger emphasis when state importance increases.

Reject interaction character that relies on novelty, long tails or constant spectacle.

## Character must preserve truth

Never use sensory richness to fabricate authority or outcome.

Examples:

- local touch acknowledgement may be immediate;
- an unconfirmed authoritative action may remain pending;
- final score transfer should not visually complete before the game state has actually accepted it;
- reconnect should not replay fictional historical choreography.

## Digital materiality

The product does not need to imitate paper literally.

Useful question:

> Which physical intuitions help the user understand/control the object, and which digital behaviors can extend those intuitions without breaking trust?

Possible digital-only properties:

- adaptive separation under finger occlusion;
- relational deformation of the hand;
- semantic attraction/repulsion;
- state-dependent depth;
- persistent causal traces;
- local visual/sound changes tied to ownership/authority.

Do not use `digital-first` as an excuse for neon/dashboard aesthetics.

## Product identity research

Identity should eventually emerge from a coherent choice across:

- material behavior;
- card proportions/anatomy;
- spatial composition;
- type system;
- semantic palette;
- opponent representation;
- motion timing/rhythm;
- sound material family;
- use of depth;
- rare-event staging.

Reference research may be broad, but the goal is not to copy another card game's skin.

Useful questions when studying references:

- what does the product prioritize visually?
- what is allowed to move?
- what remains quiet?
- what creates material identity?
- how are important state changes staged?
- what information is encoded spatially instead of textually?
- how does the product remain readable after familiarity?

## Research sequence

### C1 — sensory inventory

Map current Tysiac interaction families to possible sensory roles without styling them yet.

**First pass now exists for the selected Living Slice.**

### C2 — material primitives

Explore isolated contact/slide/insertion/commit/impact/settle visual+audio relationships.

Do not bundle entire product themes.

### C3 — card/hand character

Combine only the primitives that survive control/workspace research.

### C4 — scene character

Apply the same language to trick, auction, transfer and score consequence.

### C5 — repetition torture

Verify that ordinary actions remain tolerable/fast and sensory hierarchy does not collapse.

### C6 — identity synthesis

Only after multiple scales work should the project choose a stronger integrated visual/sensory direction.

## Evidence targets

This track eventually needs evidence for:

- first-contact attractiveness/quality;
- causal readability;
- desire to keep interacting;
- sensory coherence;
- repetition endurance;
- distinction between ordinary and important events;
- quiet-life quality;
- recognizability without generic visual gimmicks;
- reduced-sound / sound-off viability;
- reduced-motion semantic preservation;
- mobile/desktop character parity without identical embodiment.

## Failure modes

Reject/narrow character work when:

- visual richness masks weak interaction;
- sound is doing work the visual system should do;
- haptics become mandatory for understanding;
- every event uses the same intensity;
- subtle events become invisible without particles/glow;
- identity depends mainly on generic premium materials;
- motion feels beautiful but contradicts actual state;
- card/hand spectacle steals attention from decisions;
- desktop/mobile character diverges into two unrelated products;
- repeated play becomes exhausting.

## Cross-project donor value

Potential donor knowledge is not a card skin.

Candidate transferable principles include:

- causal channel composition;
- quiet-life / impact dynamic range;
- object-first material identity;
- sensory distinction by constraint/state cause;
- persistent consequence;
- semantic parity across sensory capability levels;
- character emerging from action laws rather than decorative theme.

These remain hypotheses until demonstrated beyond Tysiac.

## Current state

**RESEARCH ACTIVE / priority gap narrowing.**

The first Living Slice now has a semantic sensory inventory, but no final material palette, sound family, visual direction or Owner evidence.

Future Owner-facing Card/Hand fixtures need enough real visual/sensory character that judgement is not dominated by debug-tool aesthetics, while remaining narrow enough to reveal which interaction mechanisms actually matter.
