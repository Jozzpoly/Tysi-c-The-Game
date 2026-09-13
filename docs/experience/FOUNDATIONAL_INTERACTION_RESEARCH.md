# Foundational Interaction Research

Status: research synthesis, not implementation guidance.

## Purpose

This document maps external interaction-design traditions that materially intersect the project's donor-level UX research. The goal is not to adopt one school or vocabulary. It is to identify what each tradition explains well, what it misses, and which questions remain ours to answer experimentally.

## 1. Direct manipulation

### Core contribution

Shneiderman's direct-manipulation tradition emphasizes:

- continuous visible representation of domain objects;
- physical actions rather than abstract command syntax;
- rapid, incremental operations;
- immediate visible effects;
- reversibility and safe exploration.

Hutchins, Hollan and Norman sharpened the model by distinguishing **semantic distance** and **articulatory distance**. An interaction can be mechanically responsive yet still feel indirect if the interface vocabulary does not match the user's conception of the domain.

### Relevance here

For a card, `grab card -> move card` can have both low semantic and articulatory distance. `select card -> press Move -> choose slot -> confirm` expresses the same operation with much greater distance.

This supports the project's preference for object-first interaction, but it does not prove that direct manipulation is always optimal.

### Limit

Some operations are abstract, global, historical or high-dimensional. Directly touching the affected object can be imprecise, occluded, fatiguing or conceptually wrong. Directness is a design variable, not a religion.

## 2. Instrumental interaction

Michel Beaudouin-Lafon's instrumental interaction extends direct manipulation by treating tools/instruments as first-class interaction objects.

Three properties are especially useful:

- **degree of indirection** — spatial and temporal offset between instrument and affected object;
- **degree of integration** — relation between the degrees of freedom captured by the input and those controlled in the interaction;
- **degree of compatibility** — similarity between physical user action and virtual response.

### Relevance here

This gives us a way to discuss directness more precisely.

A mobile card drag may have:

- low temporal indirection but problematic spatial indirection because the finger occludes the card;
- high compatibility in translation;
- poor integration if rotation/tilt are inferred opaquely rather than controlled coherently.

A deliberately indirect desktop instrument can be better than direct touch when it increases precision, reduces occlusion or exposes otherwise intangible properties.

### Donor consequence

For JV/JES/Multi World, the target is not "always touch the thing." The target is to choose the right coupling between user, instrument and domain object.

## 3. Epistemic action and external cognition

Kirsh and Maglio distinguished:

- **pragmatic actions** — actions that directly advance the world toward a goal;
- **epistemic actions** — actions performed to make thinking/perception easier.

Their Tetris work demonstrates that apparently unnecessary rotations/translations can improve cognition by transforming the external problem.

### Relevance here

Manual card ordering, grouping, spacing and temporary rearrangement can be epistemic action.

Therefore:

- reordering is not automatically "cosmetic";
- an efficiency metric that counts extra moves as waste can misdiagnose useful behavior;
- auto-sorting can destroy externalized thought;
- reversible manipulation should support thinking even when no gameplay command is produced.

### Donor consequence

User-created spatial structure can be cognition in builders, world editors, inventories, node systems and debugging tools. Preserve it unless there is a stronger reason not to.

## 4. Tangible and embodied interaction

Ishii/Ullmer's Tangible Bits and later embodied-interaction work emphasize using human physical and spatial skill to manipulate digital information. Dourish broadens embodiment beyond literal physicality: meaning emerges through situated, practiced interaction rather than only abstract command execution.

Hornecker/Buur's tangible-interaction framework highlights:

- haptic direct manipulation;
- spatial interaction;
- embodied facilitation;
- expressive representation.

### Relevance here

The interesting target is not simply "make a card look like paper." It is to let spatial behavior, material behavior and expressive behavior become carriers of meaning.

The hand can be a place that the user inhabits and reorganizes, not only a collection rendered on screen.

### Limit

Embodiment does not require skeuomorphism. A digital object can have coherent non-real-world material laws if those laws remain learnable and meaningful.

## 5. Feedforward, inherent feedback and coupling

Wensveen, Djajadiningrat and Overbeeke argue for stronger coupling between action and function through **feedforward** and **inherent feedback**.

Useful coupling characteristics include:

- time;
- location;
- direction;
- dynamics;
- modality;
- expression.

### Relevance here

These dimensions are stronger research variables than vague labels such as `weighty` or `juicy`.

For example, when a card is moved:

- **time**: how soon and how continuously does response occur?
- **location**: does feedback occur at the grabbed card, target, HUD or elsewhere?
- **direction**: does response preserve the direction of intended action?
- **dynamics**: does acceleration/resistance/settling correspond to the manipulation?
- **modality**: which visual/audio/haptic channels participate?
- **expression**: what character does the response communicate?

This can be used as a coupling profile for every repeated interaction.

### Important distinction

Inherent feedback is not the same as no augmented feedback. Sound, haptics or graphics can amplify meaning. The question is whether they reinforce the causal event or merely decorate it.

## 6. Ecological Interface Design (EID)

Ecological Interface Design attempts to expose deep work-domain constraints and relationships perceptually, reducing the need for users to mentally reconstruct them from isolated indicators.

Relevant ideas:

- represent domain constraints, not only raw values;
- preserve correspondence between domain structure and interface representation;
- support direct perception/manipulation where appropriate;
- externalize relationships that would otherwise require mental computation;
- let users adapt to unanticipated situations rather than only follow prescribed procedures.

### Relevance here

This strongly supports the project's desire for self-teaching constraints and world-first diagnostics.

Examples:

- card legality can affect local manipulation/target acquisition rather than exist only as an error string;
- vehicle-builder constraints can be expressed through the geometry/behavior of components;
- JES can expose causal or physical invariants in the world instead of forcing users to integrate disconnected metrics.

### Limit

EID has its strongest evidence in law/constraint-driven dynamic work domains. Games and creative tools contain intent, convention, strategy, deception and culturally learned semantics. Use EID as a lens, not a universal law.

## 7. Game feel research

The game-feel literature separates several intents that are often collapsed into "juice." Pichlmair and Johansen's survey groups the space around:

- **physicality** — tuning object/control behavior for cohesion and predictability;
- **amplification** — emphasizing important events;
- **support** — streamlining execution of player intention.

### Relevance here

The current project should deliberately work on physicality and support before chasing amplification.

A card that tracks badly cannot be repaired by particles.
A commit boundary that is ambiguous cannot be repaired by louder sound.
A hand that destroys user organization cannot be repaired by a prettier fan.

Amplification becomes valuable after the causal interaction is already good.

## 8. Platform-specific interaction

Current Apple guidance for games explicitly distinguishes touch, pointer/keyboard and other platform-default interaction bodies; it also recommends direct interaction with game elements where appropriate. Haptics guidance from Apple and Android emphasizes causal, consistent and restrained use.

### Relevance here

Mobile and desktop should share semantic interaction contracts but may use different physical mappings.

A mobile finger creates:

- occlusion;
- limited precision;
- direct contact;
- embodied thumb reach;
- optional device haptics.

A desktop pointer provides:

- high precision;
- hover;
- no physical occlusion at the pointer site;
- larger working space;
- different opportunities for instruments and shortcuts.

The goal is not pixel parity or gesture parity.

## 9. Where the existing theories do not fully solve our problem

The project combines concerns that are usually studied separately:

- direct manipulation;
- user-owned workspace as cognition;
- game feel;
- constraint legibility;
- authoritative multiplayer state;
- optimistic local response;
- rejection/reconnect/correction;
- sensory orchestration;
- device-specific embodiment;
- donor transfer across radically different worlds.

Therefore we should not attempt to rename an existing framework as our answer.

The research contribution we need is likely a **synthesis and operational discipline** for maintaining causal and perceptual integrity across the whole human-system loop.

## 10. Provisional synthesis

A high-quality interaction should be evaluated along at least these independent questions:

1. **Semantic distance** — does the interaction vocabulary match what the user means to do?
2. **Articulatory distance** — does physical input resemble/control the intended action effectively?
3. **Temporal coupling** — is response timely and continuous enough?
4. **Spatial coupling** — does response occur where the cause/meaning lives?
5. **Directional coupling** — do cause and effect preserve directional logic?
6. **Dynamic coupling** — do velocity, resistance, acceleration and settling form a coherent behavioral material?
7. **Modal coupling** — do visual/audio/haptic signals describe the same event?
8. **Expressive coupling** — does the character of response match the event's meaning?
9. **Epistemic support** — can users manipulate the world to think?
10. **Constraint legibility** — can users perceive boundaries/possibilities without reconstructing them mentally?
11. **Authority integrity** — does presentation distinguish provisional local response from canonical outcome?
12. **Recovery integrity** — do reject/cancel/reconnect preserve causal history and user understanding?

This list is a research map, not a final scorecard.

## Sources

- Shneiderman, B. (1983), *Direct Manipulation: A Step Beyond Programming Languages*.
- Hutchins, E., Hollan, J., Norman, D. (1985), *Direct Manipulation Interfaces*.
- Beaudouin-Lafon, M. (2000), *Instrumental Interaction: An Interaction Model for Designing Post-WIMP User Interfaces*.
- Kirsh, D., Maglio, P. (1994), *On Distinguishing Epistemic from Pragmatic Action*.
- Ishii, H., Ullmer, B. (1997), *Tangible Bits*.
- Dourish, P. (2001), *Where the Action Is*.
- Djajadiningrat, J.P., Overbeeke, C.J., Wensveen, S.A.G. (2002), *But how, Donald, tell us how?*.
- Wensveen, S.A.G., Djajadiningrat, J.P., Overbeeke, C.J. (2004), *Interaction Frogger*.
- Vicente, K.J., Rasmussen, J. (1992), *Ecological Interface Design: Theoretical Foundations*.
- Pichlmair, M., Johansen, M. (2020), *Designing Game Feel. A Survey*.
- Apple Human Interface Guidelines: Games, Gestures, Haptics.
- Android Developers: Haptics design principles.
