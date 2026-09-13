# Theory Landscape and Boundaries

## Purpose

This project is not trying to invent interaction design from first principles. It is trying to assemble, stress and extend several partially overlapping traditions into a donor-quality practice for the Owner's projects.

The important point is that no single existing tradition is sufficient.

## 1. Direct manipulation

Classic direct-manipulation work is valuable because it explains why visible objects, incremental actions, rapid reversible operations and immediate feedback often reduce the semantic/articulatory distance between intention and interface action.

Useful donor questions:

- Is the user's intended action represented directly or translated through unnecessary command language?
- Can the user observe intermediate state?
- Can the user act incrementally and reverse course?
- Does evaluation of the result stay close to the manipulated object?

Boundary:

Direct manipulation is not automatically superior. Some actions are too abstract, global, repetitive, precise or high-dimensional to represent well through literal object manipulation.

## 2. Instrumental interaction

Instrumental interaction extends direct manipulation by explicitly recognizing tools/instruments between user and domain object.

This is critical for our projects because not every good interaction should be hand-on-object. A gizmo, brush, torque tool, selection instrument, measurement probe, camera rig or filtering lens can be the right embodiment.

Useful donor questions:

- What is the domain object?
- What is the interaction instrument?
- Is the instrument reusable and learnable?
- Does the instrument expose the relevant dimension of control or bury it?

Boundary:

Do not confuse "direct" with "tool-less". Expert tools can decrease semantic distance even when they add an explicit instrument.

## 3. Embodied interaction

Embodied interaction emphasizes skilled, engaged practice in a world rather than disembodied command execution.

Useful donor questions:

- What skills can the user develop over repeated use?
- What does the environment remember or expose?
- What is learned through situated action rather than instruction?
- How does meaning emerge from practice over time?

Boundary:

Embodiment is not a requirement for literal realism, 3D interaction or motion-heavy UI. It concerns the relationship between action, environment and meaning.

## 4. Reality-Based Interaction

Reality-Based Interaction identifies four useful sources of prior human competence: naive physics, body awareness/skills, environment awareness/skills and social awareness/skills.

This is highly relevant to card handling, builders and world interaction.

But the most important RBI lesson for this project is the tradeoff rule: resemblance to reality is not the goal. Reality may be deliberately violated in exchange for expressive power, efficiency, ergonomics, accessibility, practicality or other justified advantages.

Therefore:

**use real-world intuition as prior knowledge, not as a simulation mandate.**

## 5. Distributed cognition

Distributed cognition treats cognition as distributed across the person, artifacts, representations and environment.

This strongly supports the hypothesis that a hand of cards can become part of the player's cognitive workspace.

Useful donor questions:

- What facts are held in the head versus in the world?
- What work does spatial arrangement perform?
- Which representation reduces memory or comparison burden?
- Does the system preserve external structures users create for themselves?

Boundary:

Not every persistent layout is useful cognition. User-created structure can also become clutter, stale state or accidental organization. Preservation must be balanced with comprehensibility and recovery.

## 6. Epistemic action

Epistemic action research shows that people may act on the world to make thinking easier, even when the action does not directly advance the task's external goal.

For Tysiac, repeated card rearrangement may be epistemic rather than decorative.

For builders and world editors, temporary movement, comparison, grouping, alignment and probing may likewise be thinking actions.

Design implication:

**do not optimize away apparently redundant manipulation before knowing what cognitive work it performs.**

## 7. Intelligent use of space / spatial workspaces

Spatial organization can simplify choice, perception and internal computation. Spatial hypertext research further shows that people use loose layout to express provisional, ambiguous or emerging structure.

This is particularly relevant to:

- custom hand ordering;
- grouping cards without formal metadata;
- builder staging areas;
- debug/research canvases;
- arranging alternative components or hypotheses;
- keeping partial work visible.

Boundary:

A good spatial workspace requires stability. If the system continuously auto-arranges objects, spatial memory and emergent structure collapse. But completely unconstrained spatial freedom can also become unmanageable.

## 8. Tangible / inherent feedback and feedforward

Interaction Frogger and related work provide a highly practical coupling lens. Action and information can be coupled along:

- time;
- location;
- direction;
- dynamics;
- modality;
- expression.

This is useful for decomposing "meaty feel" without reducing it to animation curves.

Example:

A card dragged upward and accepted into play can be coherent in:

- time: response begins with contact;
- location: feedback occurs at the card/target;
- direction: target response follows the drag relation;
- dynamics: resistance/release match the interaction state;
- modality: visual/audio/haptic cues describe the same event;
- expression: the event feels like commitment rather than generic decoration.

Boundary:

Perfect coupling in all dimensions is not always necessary. Augmented feedback is legitimate when inherent feedback cannot express an abstract fact safely.

## 9. Ecological Interface Design

EID is relevant because it focuses on making deep constraints and boundaries of a system perceptually available rather than forcing users to reconstruct them from disconnected indicators.

Potential donor value:

- expose constraints where they matter;
- support skill-based, rule-based and knowledge-based interaction without unnecessarily escalating cognitive effort;
- preserve underlying system structure in the display;
- make meaningful boundaries perceivable.

This may be especially important in JES, vehicle dynamics and debug/research tools.

Boundary:

EID is strongest in domains with meaningful structural constraints. Tysiac also contains arbitrary game rules, hidden information and opponent intention. We must not pretend every rule has a natural physical analogue.

## 10. Game feel research

Modern game-feel literature usefully separates at least three design intents:

- **physicality / tuning**: cohesion and predictability of virtual object behavior;
- **amplification / juicing**: clarity and affective emphasis of events;
- **support / streamlining**: helping the system execute the player's intention.

This separation is valuable because our previous work often collapsed all three into "feedback".

Boundary:

Juice cannot rescue poor control, and streamlining can become paternalistic automation if it guesses too much. Physicality can also become sluggish if "weight" is implemented as input lag.

## 11. Strong concepts as donor knowledge

The project's donor ambition should not aim immediately at universal laws.

A better target is intermediate-level knowledge: reusable interaction concepts that:

- are more abstract than one implementation;
- describe behavior over time, not merely appearance;
- connect artifact design with a use practice;
- can travel across domains while still requiring re-embodiment.

Examples of candidate strong concepts:

- reversible manipulation envelope;
- commit boundary;
- constraint-as-behavior;
- user-owned workspace;
- before/event/after causal choreography;
- failure dignity;
- quiet-life feedback.

These remain hypotheses until repeatedly demonstrated.

## 12. Tool embodiment and control loops

Research on tool embodiment suggests that tools can become integrated into action-oriented body representation under some conditions, but the evidence is nuanced. The strongest practical takeaway for this project is not "digital cards become body parts".

The useful question is simpler:

**does the mapping from the user's action to the tool/object response remain coherent enough that control becomes pre-reflective rather than continuously re-decoded?**

This aligns with game-feel work emphasizing the continuous perception-action loop.

## Anti-synthesis rule

Do not flatten these traditions into one grand theory.

They disagree in scope and purpose. The project should use them as lenses that expose different failure modes.

A design can be:

- direct but cognitively destructive;
- reality-based but inefficient;
- embodied but inaccessible;
- physically coherent but causally opaque;
- highly juiced but authority-dishonest;
- information-rich but interaction-poor.

The objective is not maximal score on every lens.

The objective is a justified configuration for the task, body, platform and world.

## References / starting points

- Hutchins, Hollan & Norman (1985), Direct Manipulation Interfaces.
- Beaudouin-Lafon (2000), Instrumental Interaction.
- Dourish (2001/2004), Where the Action Is.
- Jacob et al. (2008), Reality-Based Interaction.
- Hollan, Hutchins & Kirsh (2000), Distributed Cognition.
- Kirsh (1995), The Intelligent Use of Space.
- Maglio & Kirsh (1996), Epistemic Action Increases With Skill.
- Marshall & Shipman, spatial hypertext research.
- Wensveen, Djajadiningrat & Overbeeke (2004), Interaction Frogger.
- Vicente & Rasmussen, Ecological Interface Design.
- Pichlmair & Johansen (2021/2022), Designing Game Feel: A Survey.
- Höök & Löwgren (2012), Strong Concepts.
