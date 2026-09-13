# Donor Quality Bar for Living UX

## Purpose

This project is not merely trying to make a card game pleasant. It is being used to develop interaction knowledge that can be donated into the Owner's major projects.

Therefore a locally acceptable Tysiac UI is insufficient. A promoted interaction must demonstrate qualities worth reusing elsewhere.

## Donor-level criteria

A candidate is not donor-quality merely because it is attractive, smooth or liked once.

It should demonstrate most of the following.

### 1. Embodied directness

The user acts on the represented object itself whenever practical. Input and visual response feel spatially coupled, including grab point, movement, release and cancellation.

### 2. Honest causality

Presentation distinguishes provisional manipulation from authoritative consequence. It does not fabricate outcomes to hide latency.

### 3. Behavioral legibility

Routine constraints and opportunities can be learned partly by interacting with the system, not exclusively by reading instructions.

### 4. Persistent consequence

Important actions leave the world in a perceptibly changed state. Feedback is not only a temporary animation layered over an otherwise unchanged interface.

### 5. User-owned organization

Where spatial organization helps cognition, the system preserves it instead of repeatedly normalizing the user's workspace back to machine defaults.

### 6. Attention economy

The interface routes attention through causal motion, state and hierarchy rather than multiplying panels, alerts and competing highlights.

### 7. Temporal integrity

The system responds immediately where response is reversible, waits only where truth requires waiting, and separates minimum causal hold from cosmetic tail.

### 8. Failure dignity

Cancellation, rejection, reconnect, latency and invalid attempts remain understandable and physically coherent. The interaction does not only feel good on the happy path.

### 9. Repetition endurance

The interaction survives dozens or hundreds of repetitions. Novel spectacle is not mistaken for quality.

### 10. Platform embodiment

Mobile and desktop share semantic rules but exploit different bodies: touch, thumb reach, occlusion and gesture on mobile; hover, pointer precision, width and multi-object inspection on desktop.

### 11. Accessibility without flattening

Reduced motion, alternate input and visual clarity are designed as alternate expressions of the same semantic contract, not as degraded afterthoughts.

### 12. Architectural transferability

The useful idea can be described independently of Tysiac-specific rules and can map onto other interactive objects without importing card-game assumptions.

## Anti-criteria

Reject promotion when the main value is any of the following:

- visual novelty with weak causal value;
- generic glass/neon/premium styling;
- animation added after the interaction model is already fixed;
- tutorial arrows compensating for weak affordances;
- haptics or sound carrying information unavailable visually;
- server-latency concealment that lies about authority;
- auto-layout that repeatedly destroys user-created organization;
- a polished happy path with incoherent rejection/cancel behavior;
- a mobile layout that is only a compressed desktop layout;
- a desktop layout that is only an enlarged mobile layout;
- a component that can be transplanted visually but not conceptually.

## Evidence ladder

### E0 — intuition

A design idea or Owner instinct. Valuable but unproven.

### E1 — isolated phenomenon

A small experiment demonstrates one behavior, such as grab-point continuity or neighbor displacement.

### E2 — comparative evidence

Competing implementations are exercised under the same task and state.

### E3 — Owner behavioral evidence

Screen recording / direct use shows what is naturally touched, ignored, repeated, misunderstood or abandoned. Verbal reaction is retained verbatim alongside interpretation.

### E4 — torture evidence

The interaction survives repetition, cancellation, rapid reversal, latency, rejection, interruption, small screens and awkward input.

### E5 — integrated evidence

The primitive still works once embedded in a real gameplay/system loop with authentic data and authority.

### E6 — donor evidence

The principle has been successfully expressed in a second context or can be specified with sufficiently little domain-specific baggage that reuse is credible.

No lab should be called a donor on E0-E2 evidence alone.

## Owner role

Owner evidence is strongest for:

- tactile/visual feel;
- attention and comprehension;
- perceived causality;
- spatial organization;
- repetition fatigue;
- taste and product character;
- whether interaction feels alive, plastic, dead, heavy, floaty, intrusive or natural.

Owner evidence is not used to certify Tysiac rule correctness or strategic quality.

The collaboration should preserve the Owner's natural language first, then classify it. Do not rewrite `"martwe"` into a technical diagnosis and discard the original statement. The raw judgment is evidence; the technical category is a hypothesis about its cause.

## Promotion rule

An implementation enters production only when it has earned promotion for a specific reason.

Do not promote entire prototypes because one part felt good. Promote primitives and contracts:

- grab behavior;
- workspace ordering behavior;
- cancellation semantics;
- authority boundary;
- attention transition;
- object transfer language;
- timing rule;
- sensory mapping;
- layout invariant.

A good research branch may finish with zero production code changes and still be a successful run.
