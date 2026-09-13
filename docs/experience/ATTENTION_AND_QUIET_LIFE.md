# Attention and Quiet Life

## Problem

The project wants interfaces that feel alive, responsive and inhabited.

A naive implementation of this goal produces constant motion, pulsing highlights, particles, breathing cards, animated chrome and attention fatigue.

That is not life. It is noise.

## Working thesis

A mature living interface should manage a dynamic relationship between:

- **periphery** — information the user can remain attuned to without actively inspecting;
- **focus** — the current object/action/decision;
- **interrupt** — information important enough to demand reorientation;
- **settle** — return of the system to a readable low-demand state.

The target is not calmness as mood.

The target is **appropriate engagement**.

## 1. Quiet state must still be informative

Between explicit actions, the interface can communicate:

- whose turn/initiative exists;
- what objects remain actionable;
- where ownership currently lies;
- what persistent consequence remains from previous actions;
- which opponent/state is active;
- what is pending;
- what has settled.

This can occur through stable spatial composition, posture, contrast and small peripheral cues rather than animation.

## 2. Peripheral presence vs central event

Candidate hierarchy:

### Peripheral

- turn ownership when it is not the user's immediate decision;
- opponent presence;
- persistent trump/contract state;
- accumulated score territory;
- pending but non-blocking network state;
- quiet availability of hand objects.

### Focus

- object currently touched/hovered;
- current decision;
- active manipulation;
- immediate legal/constraint response.

### Interrupt

- authoritative rejection;
- significant ownership transfer;
- decisive score/state change;
- match-ending condition;
- reconnect/correction that materially changes what the user believed.

Interrupts should be rare enough to retain meaning.

## 3. Attention should follow causality

When possible, route attention along the causal path:

`source -> transition -> consequence`

Rather than:

`source event + unrelated banner + distant score flash + toast`

The latter fragments attention and forces the user to reconstruct the event.

## 4. Motion is expensive attention

Motion is highly effective at capturing peripheral attention. Therefore every moving element spends part of a limited attention budget.

Questions for any animation:

- What semantic change justifies the motion?
- What should the user notice because of it?
- Is anything more important happening at the same time?
- Can the same information remain readable after the motion stops?
- Does the animation remain useful on repetition 50?

## 5. Quiet-life feedback

The desired "alive" state may come from readiness rather than motion.

Examples:

- a hand that subtly reorganizes only when touched;
- an opponent region that becomes active only as agency transfers there;
- a target whose affordance emerges as an object approaches;
- persistent captured-state geometry that records history without pulsing;
- hover/proximity response on desktop;
- touch-down response on mobile.

A system can feel alive because it **answers**, not because it fidgets.

## 6. Persistent traces reduce notification pressure

If meaningful outcomes leave stable visible consequences, the system needs fewer temporary alerts.

Examples:

- score ownership region changes and remains changed;
- the next leader is spatially apparent after trick collection;
- user hand order remains as the user left it;
- contract/trump modifies a persistent game field rather than appearing only in a transient message.

Persistent trace is a memory surface.

## 7. Attention recovery

A strong interface should survive the user looking away.

After a short interruption, the player should be able to answer quickly:

- what just happened?
- whose control is active now?
- what changed materially?
- what can I do next?

This is different from replaying every missed animation.

Recovery may rely on:

- settled spatial state;
- recent causal trace;
- restrained event history;
- local delta persistence;
- current action affordance.

## 8. Avoid attentional debt

Every forced focus change creates debt:

- modal dialog;
- toast that covers play area;
- full-screen celebration;
- camera jump;
- global shake;
- banner;
- sound that demands interpretation.

Debt is justified only when semantic importance warrants it.

The system should not repeatedly make the player re-establish where they were looking.

## 9. Quiet does not imply low emotional range

Calm peripheral operation can increase the power of rare large events.

If ordinary actions use a narrow restrained range, then:

- important trick;
- marriage/trump shift;
- bomb;
- contract result;
- match win

have real sensory headroom.

Dynamic range depends on quiet baseline.

## 10. Donor implications

### Jozz Vehicle

A builder can feel alive through objects responding when approached/manipulated rather than every gizmo glowing continuously.

### JES

World state should remain readable peripherally; debug overlays should intensify only around active contact/causal questions.

### Multi World

Entity/object presence can be persistent and spatial; important transfers or collisions earn focus.

### LLM Live NPC

NPC cognition/debug data should not constantly occupy foreground UI. Perception, memory and intent can remain inspectable/peripheral and surface when causal explanation is requested or anomalous behavior occurs.

## 11. Failure conditions

- constant ambient motion becomes invisible or irritating;
- every event asks for central attention;
- important events are not distinguishable from ordinary feedback;
- user must read transient text to recover state;
- looking away for one second makes the game incomprehensible;
- "alive" requires particles/pulses rather than responsive relations;
- UI interrupts more often than the gameplay itself warrants.

## 12. Research direction

Future prototypes should include two different tests:

1. **engaged interaction test** — does feedback feel rich while acting?
2. **quiet observation test** — does the system still feel located, readable and inhabited while nothing major happens?

Both are required.

A great interaction system should be capable of intensity without living permanently at intensity.
