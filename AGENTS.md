# AGENTS.md — Tysiąc The Game

## Project intent

Build a professional browser-first Tysiąc table that works naturally on desktop and mobile, supports private multiplayer and bots, and can represent several real rule families without becoming a generic card-game framework.

Read `docs/EXECUTION_STATE.md` before substantial work. Running behavior and executable evidence outrank plans and historical handoffs.

## Owner / agent model

The Owner does **not** know Tysiąc rules well enough to validate rule identity, strategic bot quality or authentic Tysiąc gameplay. Never treat Owner approval, silence or enjoyment as evidence that those things are correct.

The Owner **is the primary product oracle for the experience layer**:

- visual hierarchy, composition and taste;
- input/touch feel and ergonomics;
- feedback, causality and comprehensibility;
- motion/pacing as perceived by a player;
- desktop/mobile presentation quality;
- onboarding and whether the product communicates what just happened;
- whether the table feels coherent, polished and worth using.

Owner confusion is real UX evidence, but it does not by itself prove a rule is wrong.

Agent responsibilities:

- lead domain research and technical judgement;
- distinguish documented fact, observed reference behavior, deliberate project choice and open uncertainty;
- turn material rule uncertainty into a concrete scenario/probe/test;
- obtain gameplay/rule evidence independently of Owner taste;
- seek experienced Tysiąc-player/domain feedback when human gameplay judgement is required;
- carry implementation/testing work without requiring the Owner to program;
- translate loose Owner reactions into bounded experience hypotheses and testable changes;
- protect the boundary between game truth and presentation truth.

Experienced-player/friend feedback is valuable for rule authenticity, strategy and real-human play, but must be weighed as evidence rather than treated as an infallible oracle.

## Two evidence tracks

Run the project as two parallel loops rather than one blocking validation chain.

### Game truth

Questions:

- are rules, legality and scoring correct for the named profile?
- does authority preserve hidden information and lifecycle invariants?
- are bots strategically credible enough?
- does the game feel authentic to people who actually know Tysiąc?

Evidence:

- source documentation;
- reference implementation probes;
- explicit reversible project pins;
- executable scenarios, invariants and simulations;
- experienced Tysiąc-player sessions.

### Experience truth

Questions:

- can the player see and understand what matters?
- do interactions feel reliable and intentional?
- are actions and consequences perceptible?
- does desktop/mobile composition work naturally?
- does the product look and feel progressively more professional?

Evidence:

- Owner play/reaction;
- real-device observation and recordings;
- browser interaction/layout tests;
- screenshots and visual review;
- accessibility/touch measurements where useful.

Automation can defend measurable mechanics of UX, but it cannot certify taste, clarity or feel.

Neither track should unnecessarily block the other. Presentation may mature while rule evidence remains open, provided it does not duplicate authority or bake uncertain rule semantics into irreversible UI architecture.

## Current engineering principles

- Browser-first; desktop and mobile are equal product targets, with responsive compositions rather than forced identical layouts.
- TypeScript across pure core, client and Cloudflare adapters is current-best.
- Deterministic domain core independent of React/network/Cloudflare.
- Online multiplayer is server-authoritative.
- Full online hidden state stays inside authority; each human/bot seat gets only its allowed observation.
- Human and bot controllers submit the same domain commands.
- One canonical legality evaluator generates legal actions and rejection reasons.
- Named rules profiles are versioned tested bundles.
- Active matches pin an immutable effective rules snapshot/fingerprint.
- Introduce a variant field only because real evidence or an explicit unresolved scenario requires it.
- Keep presentation downstream of `SeatProjection + scoped GameEvents`; professional visuals, animation, audio and haptics must not require a second game engine.

Avoid inheritance-heavy rule architecture, generic DSLs, arbitrary scripting, event sourcing and client prediction unless demonstrated need overturns this baseline.

## First reference profile

Initial target remains provisionally:

`PLAYOK_3P_800_CANDIDATE`

This means "candidate compatible with the documented Kurnik/PlayOK-style 3P game", not "canonical Polish rules".

Where source/reference behavior is ambiguous, preserve the uncertainty explicitly instead of asking the Owner to choose what is supposedly correct.

## Evidence language

For rule claims:

- `documented` — stated by a source;
- `reference-observed` — reproduced in an existing implementation;
- `pinned` — deliberately chosen where legitimate variants differ or direct evidence is incomplete;
- `executable` — our tests prove implementation behavior.

For profiles prefer `candidate`, `scenario-tested`, `reference-tested`, `shipping`.

Do not use **certified** as a casual synonym for "tests passed".

For experience claims distinguish measurable evidence (for example hit target geometry or overflow) from Owner judgement (for example hierarchy, visual quality or perceived pacing).

## Testing

The pure core should keep focused rule scenarios, transition invariants, deterministic full matches and broader simulation/property tests where signal justifies cost.

Useful invariants include card conservation/uniqueness, legal-action closure, legal phase progression, score-accounting consistency, no hidden-state leakage and deterministic behavior from the same explicit inputs.

Presentation tests should defend regressions that can actually be measured: viewport safety, touch hit-testing, interaction availability, hidden-state separation, transition visibility and reconnect behavior. Do not turn subjective visual taste into brittle pixel tests.

Cloudflare adapters are tested separately from pure rules.

## Scope discipline

Current mode: **3-player auction Tysiąc**.

Do not prematurely build 2P/4P modes, accounts/matchmaking/rankings, a generic rules marketplace/DSL, advanced ML/search bots, social systems, event-sourcing infrastructure or heavy observability.

A minimal heuristic bot remains part of the playable product. Its legality can be automated; its strategic credibility requires stronger evidence than Owner approval.

## Current execution model

Foundation Run 01 established the deterministic game/authority/browser foundation.

Run 02 now advances two parallel tracks:

1. **game truth** — close or bound high-risk profile uncertainties, strengthen rule/reference evidence, and eventually validate strategy/authenticity with knowledgeable players;
2. **experience truth** — iterate interaction, feedback, responsive composition and visual language with the Owner as primary judge.

Integrate them continuously through the same core/projection/command boundaries. Real-human duo/trio play becomes especially valuable once the session can test both authentic gameplay and mature enough presentation without infrastructure dominating the feedback.

## Working style

Prefer small reversible evidence-producing slices. Keep durable docs short and current. Do not make the Owner fill structured QA forms unless genuinely useful; natural reactions, screenshots and recordings are valid experience input.

Stop broad research once the next uncertainty is better answered by a reference probe, executable experiment or knowledgeable-player test. Stop speculative polish when the next useful question is better answered by putting the current build in front of the Owner.