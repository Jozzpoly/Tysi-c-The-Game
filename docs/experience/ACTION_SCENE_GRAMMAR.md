# Action Scene Grammar

Status: multiscale experience research. No production choreography is authorized by this document.

## Purpose

Low-level object feel is necessary but insufficient. A game becomes understandable and alive when individual state changes compose into coherent perceptual scenes.

The key distinction is:

> `GameEvent` is a truth atom. **Scene is a perceptual unit.**

Presentation should preserve event truth without forcing the player to consume one detached UI message per event.

## Working scene model

`stable situation -> possibility -> commit -> visible action -> response -> resolution -> persistent consequence -> next stable possibility`

Not every scene uses every beat.

The model covers:

- spatial source;
- timing;
- ownership;
- initiative;
- authority;
- attention;
- state transition;
- persistent traces;
- when control becomes available again.

## Scene composition

Several canonical events may belong to one experience sentence.

Candidate examples for later mapping:

- card play + trick completion;
- marriage declaration + card play + trump transition;
- hand score + match completion;
- auction win + talon reveal;
- exchange completion + next contract decision.

Typed events remain useful provenance. They do not require one animation/toast each.

## Action source

A visible action should normally have an identifiable origin.

For a card action, source may be an actor-owned hand/seat region.

For a point/state consequence, source should be the event that actually produced it.

Avoid results that appear in detached HUD areas with no perceptual bridge from their cause.

## Initiative as state

Turn-taking should be considered a semantic transfer of initiative, not merely a global input lock.

Working model:

1. current actor/state owns the active possibility;
2. commit resolves or transfers that possibility;
3. attention follows the causal action;
4. the next legal actor/state becomes locally salient;
5. previous focus settles back toward the periphery.

The long-term target is that routine turn ownership can be understood without a large central banner.

## Waiting is not one state

At minimum distinguish:

### Another actor owns initiative

The game is healthy; the player is observing/responding socially or strategically.

### Remote authority is pending

A command has crossed commit but canonical acceptance/consequence is not yet known.

### Presentation causal hold

Authority already resolved, but a short perceptual transition is still necessary for comprehension.

### System health problem

Network/runtime is actually stalled.

These should not collapse into the same visual freeze/spinner semantics.

## Causal attention routing

A primary research target is to route attention through the event itself.

Weak pattern:

1. object moves;
2. separate toast explains it;
3. score flashes elsewhere;
4. next-turn indicator changes somewhere else.

Stronger candidate:

1. action visibly originates from its source;
2. transfer/impact carries attention to the affected region;
3. resolution changes ownership/state;
4. resulting value/state change emerges from that consequence;
5. next initiative is apparent in the settled composition.

Text remains useful for exceptional explanation, but should not be the glue required to join disconnected visual systems.

## Attention cycle

Working cycle:

`periphery -> emerging focus -> causal action -> consequence focus -> settle -> periphery`

### Rest

Public state and actor regions remain legible but quiet.

### Action source

Attention first rises locally at the causal origin.

### Transfer

Movement/state relationship carries attention toward the affected shared space or destination.

### Consequence

The meaningful result receives brief priority.

### Settle

Hierarchy becomes quiet and the next actionable locus is clear.

This creates life without permanent stimulation.

## Persistent consequence

Important scenes should not always evaporate back to an identical board.

Possible useful traces include:

- changed score/stake;
- captured value/ownership;
- trump state;
- contract/obligation;
- current leader/initiative;
- reduced hand size;
- other public state that remains strategically relevant.

Persistent trace is not decorative history. Retain only what supports the current situation.

## Trick as a research scene

A trick is useful because it combines multiple actors, unresolved shared state and a clear consequence.

Generic perceptual structure:

### Lead

One actor establishes the first card and transfers initiative.

### Responses

Further cards arrive from identifiable actor regions. Shared state remains unresolved.

### Closure

The final required response closes the local possibility space.

### Resolution

Winner/ownership becomes apparent.

### Collection/consequence

Cards/value transition toward the winner/result while preserving causal identity.

### New initiative

The next active locus emerges from the resolution.

UX consumes canonical rules; it does not decide who actually wins.

## Dynamic range

Common scenes must remain compact enough for repetition.

Rare scenes can consume more attention/time.

Qualitative hierarchy to investigate later:

- card contact/play: local/tactile;
- ordinary trick resolution: shared consequence;
- marriage/trump change: stronger persistent-state transformation;
- hand-ending event: larger composition break;
- match completion: maximum available headroom.

Do not encode this as one global animation-duration ladder before real use evidence.

## Repetition budget

A scene that is enjoyable once may be exhausting after twenty repetitions.

Future validation needs separate modes:

- first-contact comprehension;
- repeated normal pace;
- faster expert pace;
- interruption/resumption;
- rare-event escalation.

## Minimum causal hold vs cosmetic tail

### Minimum causal hold

The portion required before the result and next possibility are understandable.

### Cosmetic tail

Residual settling, sound or secondary response that can continue after the next legal action becomes available.

A mature runtime should avoid globally locking input through the entire cosmetic tail.

## Actor consistency

Equivalent canonical actions should share the same semantic causal grammar regardless of whether the actor is local human, remote human or bot.

Timing may differ because real authority/network/computation differs, but the world should not use incompatible ownership laws for different actor types without a semantic reason.

## Privacy / hidden-state boundary

Animation and timing must depend only on viewer-safe information.

Do not accidentally encode hidden state through:

- different timing based on private choice count;
- animation variants selected from hidden card categories;
- visible opponent-hand organization;
- computational timing that correlates with private search/state.

## Interruption and reconnect

Current authority beats historical spectacle.

On recovery:

- cancel stale transient choreography;
- present current canonical state;
- preserve only compact context needed to understand meaningful changed consequences;
- expose current initiative/legal possibility;
- do not replay old object flights merely to finish a queue.

## Research questions

### S1 — source attribution

How little treatment is needed for an action to read as originating from the correct actor/object?

### S2 — initiative transfer

Can routine turn ownership emerge from spatial/action hierarchy without a central banner?

### S3 — causal chain

Can cause -> transfer -> consequence remain understandable with minimal explanatory prose?

### S4 — persistent trace

Which consequences should remain visible and which should disappear after comprehension?

### S5 — timing

What portion of common choreography is minimum causal hold versus optional tail?

### S6 — interruption

Can the player look away briefly and return knowing what changed and what is actionable now?

## Failure conditions

Narrow or reject scene candidates if they:

- slow common play without comprehension benefit;
- still require detached text recap;
- make source/ownership ambiguous;
- hide the next legal action;
- leak viewer-private information;
- accumulate clutter as persistent history;
- require stale animation replay after reconnect;
- feel impressive once but fatigue under repetition.

## Donor candidates

If supported, candidate cross-project concepts include:

- **action-origin presence** — consequence visibly originates from the acting object/agent;
- **initiative as perceptual state** — who/what can act next is embodied in hierarchy rather than detached status;
- **causal attention routing** — attention follows cause -> impact -> consequence;
- **scene compression over event spam** — several truth events form one perceptual sentence while retaining provenance;
- **minimum causal hold / cosmetic tail** — comprehension timing separated from decorative completion;
- **authority-first interruption recovery**.

Potential targets include JV mechanism feedback, JES physical/world events, Multi World actor/object interactions and Live NPC action causality.

## Current conclusion

Scene grammar is the bridge between embodied objects and match/session rhythm.

It should develop in parallel with Hand Workspace after the low-level Card Object bench reaches mechanical maturity.

No Owner-facing scene prototype is ready yet.
