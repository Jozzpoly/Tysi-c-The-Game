# Multiscale Experience Model

Status: scope-control model for Experience Foundation. Not an implementation roadmap.

## Why this exists

Run 03 has deliberately gone deep into Card Embodiment because low-level control quality is a foundational weakness in current projects.

That depth creates a new risk: **microinteraction tunnel vision**.

A game can have an exceptional drag interaction and still fail because the hand, turn rhythm, opponent presence, scoring, match tension, information architecture or recovery state is weak.

Likewise a world editor can have perfect object grabbing and still be a poor tool if the build-observe-correct loop is fragmented.

Therefore the research must preserve multiple experience scales.

## Scale 0 — sensing / contact

Timescale: milliseconds to hundreds of milliseconds.

Questions:

- did the system detect the intended contact?
- is the hit area truthful?
- is acknowledgement immediate enough?
- what does the finger/pointer occlude?
- does the input pipeline preserve timing and location?

Failure examples:

- dead click;
- hover says yes but click says no;
- contact lands on the wrong object;
- touch is hidden under the finger;
- browser cadence feels like material behavior.

Current Run 03 control-law research heavily covers this scale.

## Scale 1 — object embodiment

Timescale: tens of milliseconds to seconds.

Questions:

- does the object preserve identity and grab location?
- does it feel owned, coherent and predictable?
- how does it express materiality?
- can it be cancelled/released cleanly?
- is assistance supporting or stealing agency?

Failure examples:

- floaty cursor-object;
- lag sold as weight;
- arbitrary snapping;
- object rotates/moves in ways unrelated to action;
- polished animation but poor motor ownership.

Card Object research lives here.

## Scale 2 — local workspace / relations

Timescale: seconds to minutes.

Questions:

- how do objects affect neighbors?
- does personal arrangement support thinking?
- how is insertion/grouping expressed?
- does the system preserve user organization?
- what stays focused and what yields space?

Tysiac example:

The private hand as an owned cognitive workspace.

JV example:

A local assembly of components where geometry, snap and intent are legible without destroying Owner-created structure.

## Scale 3 — action sentence

Timescale: roughly fractions of a second to a few seconds.

Model:

`possibility -> intention -> commit -> impact -> consequence -> settle -> next possibility`

Questions:

- did I know what could happen?
- when did the action become committed?
- where did the consequence originate?
- what remains true afterwards?
- when is control available again?

This is where authority and causal choreography become visible.

## Scale 4 — encounter / scene

Timescale: several seconds to tens of seconds.

Tysiac examples:

- a trick;
- an auction exchange;
- marriage/trump event;
- bomb confirmation/resolution.

Questions:

- is there anticipation?
- is attention routed naturally?
- do multiple actors feel spatially present?
- is the outcome readable without a recap banner?
- does the scene end in a stable comprehensible state?

A scene is not merely a sequence of microanimations.

## Scale 5 — repeated loop / rhythm

Timescale: tens of seconds to minutes.

Questions:

- does repeated play have rhythm?
- does the interface know when to be quiet?
- do common actions remain fast enough?
- does feedback retain meaning after repetition?
- does action unlock happen as soon as causality permits?

Failure examples:

- every trick pauses for spectacle;
- constant glowing destroys hierarchy;
- polished first use becomes torture by the twentieth repetition.

## Scale 6 — round / hand arc

Timescale: minutes.

Questions:

- can the player feel that the situation has evolved?
- does tension/advantage/risk accumulate perceptually?
- are prior events leaving useful persistent traces?
- is the hand/board more than a resettable frame for isolated events?

Tysiac-specific emotional structures must be derived from rule/gameplay research, not invented by UX alone.

## Scale 7 — match / session arc

Timescale: many minutes.

Questions:

- does a match have escalation and relief?
- can the player recover context after interruption?
- are score, stakes and progress legible without dominating play?
- do rare events have enough sensory headroom because normal play stayed restrained?

## Scale 8 — social / agent presence

Timescale: continuous across encounter/session.

Questions:

- do opponents/agents feel like sources of action rather than API events?
- is turn ownership spatially/socially legible?
- does latency read as another actor thinking/networking rather than the game freezing?
- can AI/NPC activity be perceived without avatar theater or fake personality?

This scale will matter strongly in Multi World and Live NPC.

## Scale 9 — system truth / recovery

Timescale: cross-cutting.

Questions:

- what is local speculation vs authority?
- what happens under reject/reconnect?
- does the interface preserve privacy?
- can it snap to authority without fabricating a false causal history?
- how are uncertainty and pending states represented?

This scale is architectural and perceptual simultaneously.

## Scale 10 — learning / mastery / memory

Timescale: sessions to weeks/months.

Questions:

- does the user build durable spatial/motor knowledge?
- does the interface reward mastery?
- can experts become faster without disabling the language that helped novices learn?
- does user organization persist enough to become meaningful?
- do system changes destroy learned mappings?

A good interface can become more transparent through skill rather than simply removing feedback.

## Scale 11 — product identity / emotional character

Timescale: holistic.

Questions:

- does the interaction have a recognizable character?
- is that character coherent across motion, typography, sound, layout and pacing?
- does the product feel like this project rather than generic premium UI?
- is visual identity carrying semantic structure, not only decoration?

This is where art direction and interaction aesthetics eventually converge.

## Scale 12 — accessibility / alternate embodiment

Cross-cutting.

Questions:

- what changes under reduced motion?
- what if touch/drag is difficult?
- can keyboard/pointer alternatives express the same semantic contract?
- can color-independent cues preserve legality/ownership?
- does scaling text/layout destroy spatial language?

Accessibility is not a late alternate skin. It tests whether the underlying semantics are actually well specified.

## Important dependency rule

Lower scales constrain higher scales, but do not determine them.

Example:

A great Card Object law can support a great trick scene, but cannot create social tension or scoring clarity by itself.

Conversely, macro UX can reveal that a rich microinteraction needs to be reduced because it consumes too much timing/attention budget.

Therefore feedback flows both directions:

`micro -> enables macro`

and

`macro -> sets budget/constraints for micro`.

## Research portfolio rule

Do not spend the entire Experience Foundation budget at one scale.

Current emphasis on Scales 0–2 is justified only until we have enough primitive understanding to stop compensating for dead object interaction.

After the first internal Card/Hand evidence, research must deliberately reopen:

- opponent presence;
- scene grammar;
- repeated-loop rhythm;
- persistent consequence;
- information architecture;
- match-scale escalation;
- product character.

## Donor relevance

### Jozz Vehicle

- Scale 0–2: component manipulation;
- Scale 3: parameter/topology commit;
- Scale 5: build -> run -> observe -> correct loop;
- Scale 9: simulation/edit authority and recovery;
- Scale 10: learned builder skill.

### JES

- Scale 0–2: matter/tool contact;
- Scale 3–4: causal world edits and physical response;
- Scale 6–9: persistent world consequence and truthful diagnostics.

### Multi World

- Scale 0–4: object/action feel;
- Scale 5–8: world rhythm and multiplayer/agent presence;
- Scale 9: network authority and correction.

### LLM Live NPC

- Scale 4–8: agent presence and action causality;
- Scale 9: perception/decision/action truth;
- Scale 10: memory/continuity across sessions.

## Anti-pattern

Do not call an interaction system donor-quality because it solves only low-level tactility.

A donor-quality project should eventually demonstrate coherence across multiple scales while preserving the truth chain between them.

## Current Run 03 implication

Continue Card Object research deeply enough to establish a defensible low-level foundation, but maintain an explicit stop condition.

Once low-level candidates become mechanically/perceptually meaningful, the next major expansion should be **Hand Workspace + Trick/Action Scene**, not endless Card Object micro-tuning.
