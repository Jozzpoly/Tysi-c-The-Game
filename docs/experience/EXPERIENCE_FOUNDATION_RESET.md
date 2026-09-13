# Experience Foundation Reset

Status: research charter. This branch starts from clean `main`; it deliberately does not inherit implementation from the pre-reset experience lab.

## Why reset

The earlier visual-density experiment and the first living UX labs were useful because they exposed the real problem, but they are below the quality bar now expected from this project.

This project is no longer treated as a small card-game side project with some polished interaction. It is a laboratory for a transferable interaction standard that can later donate principles and implementation patterns to other Owner projects.

The target is not merely "good card-game UX". The target is a coherent interaction language with:

- tactile direct manipulation;
- strong object continuity;
- truthful feedback under latency and rejection;
- self-teaching constraints and affordances;
- a rich private workspace for the player's hand;
- clear causal feedback without banner/tutorial dependence;
- a high dynamic range between quiet decision states and consequential events;
- desktop/mobile embodiments that share semantics but not necessarily geometry;
- evidence-driven promotion from experiment to runtime.

## Epistemic split

Game truth and experience truth remain separate.

Rules, legality, scoring, bot quality and Tysiąc authenticity require domain/reference evidence. Owner judgement does not certify them.

The Owner is primary evidence for presentation and feel: tactile quality, visual hierarchy, attention routing, clarity, responsiveness, materiality, pacing, emotional weight, fatigue, mobile ergonomics and overall product character. Lack of Tysiąc expertise is not a weakness for this track.

## Core thesis

The player's hand is not a UI footer. It is the player's primary embodied workspace.

The card is not a button. It is a manipulable game object with identity, continuity, reversible local response, authoritative consequence and persistent relation to the rest of the game.

The interface should teach routine interaction chiefly through the behavior of objects and constraints, with text as local explanation rather than global instruction.

## Truthfulness rule

Use optimistic manipulation, authoritative consequence.

A card may react immediately to touch, lift, reorder, bend the hand around itself, preview a target, resist a constraint or begin a reversible transition without waiting for the server.

The presentation must not claim final gameplay consequences before authority confirms them. A rejected action returns coherently without pretending that scoring, ownership or trick resolution happened.

## Research method

Do not jump from a promising demo to a product candidate.

Every major dimension should be isolated and stress-tested before integration: pickup, grab-point behavior, finger occlusion, drag transfer function, inertia, reordering, insertion, cancellation, legal/illegal constraint feel, latency, rejection, hand expansion/compression, persistent ordering, target acquisition, opponent presence, attention routing, ordinary repetition fatigue and exceptional-event escalation.

Experiments should preserve failed variants and record what was learned. Promotion requires evidence that a primitive still works when repeated, interrupted, slowed, sped up, rejected, reconnected and used on both mobile and desktop.

## Anti-goals

Do not solve deadness with generic glows, particles, toasts or longer animation.

Do not make every legal action explicit with arrows or banners.

Do not confuse skeuomorphism with physicality.

Do not let animation become a second game state.

Do not auto-reorder the player's private hand merely because canonical state has a convenient order.

Do not force the Owner to review strategy/rules when the research question is experiential.

## Promotion gate

A primitive is not ready for runtime merely because it looks impressive once. It must remain legible and satisfying under repetition, preserve authority/privacy, degrade safely under reduced motion, remain understandable after interruption, and survive Owner criticism in real use.

The production `GameTable` stays untouched until at least the Card Object and Hand Workspace work produces primitives that clearly exceed the pre-reset lab rather than merely refine it.
