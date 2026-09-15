# Project model — Tysiąc The Game

Date: 2026-09-15

For current implementation/evidence truth read `docs/EXECUTION_STATE.md` first. For public deployment/friend claims read `docs/DEPLOYMENT.md`. The open friend-link incident is documented in `docs/INCIDENT_2026-09-15_FRIEND_LINK.md`.

## Product thesis

A modern digital table for the Tysiąc family, beginning with a very good 3-player auction game rather than a broad framework.

The useful first product is simple:

- open a stable public link;
- play immediately on desktop or phone;
- play alone with two competent-enough bots;
- create a private table and send the exact in-game invite to friends;
- recover naturally from refresh/reconnect/mobile backgrounding;
- keep private seat authority out of share URLs;
- know which concrete rules profile the table uses.

No mandatory account system is required for the first product.

A durable external surface is now part of the first-product acceptance boundary, not a vague later operational improvement. Temporary previews remain useful diagnostics but cannot satisfy the friend-product contract.

## Product modes

Keep the first room model intentionally narrow:

- `solo`: 1 human + 2 bots;
- `duo`: 2 humans + 1 bot;
- `trio`: 3 humans.

Avoid a generic arbitrary seat-plan/configuration DSL unless product evidence later demands it.

## Rules philosophy

There is no single universal or clearly canonical "Polish Tysiąc" ruleset.

Therefore:

- first target one explicit reference family, not an invented national canonical profile;
- current target remains `PLAYOK_3P_800_CANDIDATE`;
- model a variant field only when evidence or a concrete unresolved scenario justifies it;
- named profiles are supported tested bundles, not arbitrary combinations guaranteed to work;
- knowledgeable-player/domain validation may define another profile without mutating the PlayOK-targeted one;
- 2P and 4P remain separate future modes because their structures materially differ.

The Owner is not a rules oracle. Owner acceptance must never silently promote candidate behavior into reference truth.

## Architecture — defended baseline

### Pure domain core

TypeScript, deterministic from explicit inputs.

Conceptually:

`State + Command + Rules + explicit randomness -> Result`

No React, WebSocket or Cloudflare dependencies in the domain layer.

Key contracts:

- phase/state;
- command;
- canonical legality evaluation + rejection reason;
- state transition;
- seat observation/projection;
- scoped transient domain facts/events for presentation/adapters/tests.

Do not turn this into event sourcing without demonstrated need.

### Rules representation

Use a concrete rules object grouped by evidenced concerns such as auction, exchange, trick, marriage, scoring, match and redeal/abort behavior.

Named profiles carry stable identity/version and normalized effective behavior. Variant fields must earn their existence through real rule-family conflicts or executable scenarios.

### Client / presentation

React + Vite SPA, responsive DOM/CSS/SVG-first UI.

Canonical human client boundary:

`SeatProjection + scoped GameEvents`

Desktop and mobile share product semantics but may compose the table differently. Both are equal-quality targets.

The presentation foundation must support professional:

- card/table art;
- spatial/tactile card manipulation;
- animation and motion feedback;
- sound/haptics;
- richer explanation/history;
- accessible interaction;
- responsive compositions with clear hit targets and hierarchy.

Run 05 may replace presentation aggressively but must not duplicate game authority or turn uncertain rule semantics into a second state machine.

The current layered CSS history is acknowledged technical debt. Consolidation should be evidence-driven and bounded rather than a cosmetic rewrite that risks interaction geometry.

### Bots

Bots operate from the same seat observation + legal-command boundary as humans.

The heuristic baseline may prove legality/termination but not strategic quality. Improve it using measurable failures, domain reasoning and knowledgeable-player feedback.

### Online authority

Current-best: Cloudflare Worker + one SQLite-backed Durable Object `MatchRoom` per table.

`MatchRoom` owns authoritative hidden match state, command revision, seat capability identity, reconnect persistence, server-owned bot turns and per-seat projection/event broadcasts.

Use hibernating WebSockets and snapshot/revision reconnect. Socket death is normal lifecycle.

Room code is shareable identity. Opaque seat reconnect token is private authority. Share URLs must contain room identity only.

### Deployment identity

A public runtime must expose enough provenance to answer which build is actually live. Current contract exposes:

- exact Git build SHA;
- deployment class (`local`, `temporary`, `stable`).

Stable deployment is an account-owned authenticated normal Cloudflare deployment. Temporary deployment is an intentionally expiring diagnostic path. See `docs/DEPLOYMENT.md` for the evidence ladder.

## Evidence model — three tracks

### Track A — game truth

Answers:

- profile rule identity and edge cases;
- legality/scoring correctness;
- authority/privacy/lifecycle correctness;
- strategic bot credibility;
- authentic gameplay quality for people who know Tysiąc.

Evidence includes sources, reference behavior, explicit reversible pins, executable scenarios/invariants/simulations and knowledgeable Tysiąc-player sessions.

### Track B — experience truth

Answers:

- information hierarchy and visual composition;
- touch/mouse interaction quality;
- card materiality and causal feedback;
- perceived pacing/motion;
- responsive desktop/mobile ergonomics;
- onboarding;
- professional visual quality.

The Owner is primary judgement source here. Natural reactions, recordings and screenshots are first-class evidence. Automation protects only measurable mechanics.

### Track C — operations / external truth

Answers:

- is the runtime temporary or account-owned/non-temporary?
- what exact SHA is serving publicly?
- does public Worker + SPA + Durable Object behavior work from the Internet?
- does the exact invite copied by the UI remain credential-free and joinable?
- does the same origin/SHA remain available later without redeploy?
- can a real second human actually use the flow?

Evidence includes deployment registration, runtime provenance, public browser smoke, actual copied-link smoke, later no-redeploy recheck and real-human session evidence.

No other track can substitute for a FAIL in this track.

## Critical-gate model

Explicit Owner blockers are hard requirements.

If available evidence contradicts a critical required property, the stage is `FAIL / BLOCKED` until resolved. Unrelated green checks do not make the contradiction disappear.

Status language must therefore be property-scoped rather than broad: `game core PASS`, `temporary runtime PASS`, `stable deployment pending`, `real-human friend test pending`, etc.

## Development sequence

### Foundation Run 01 — historical defended foundation

Established deterministic core, candidate-rule scenarios, projection/privacy boundary, accountless room lifecycle, reconnect, bots, Worker/Durable Object authority and browser feasibility.

### Run 02 — historical game/experience evidence split

Established the useful distinction between game truth and Owner-led experience truth and hardened multiple rules/UX/browser slices.

Its detailed execution plan is historical now; it is not the current roadmap.

### Friend Preview / external-readiness campaign — partially executed, gate failed

The campaign correctly required a stable public link and Owner acceptance before sending a candidate to a friend.

That stable-link gate was not actually satisfied even though later reporting claimed readiness. The 2026-09-15 incident reopens external readiness as P0.

### Run 05 — current presentation evolution + recovery

Run 05 has evolved the table toward a more physical digital-card language while preserving game authority.

Current order of work:

1. repair and prove the external deployment/friend trust boundary;
2. complete stable deploy + exact copied invite + later no-redeploy evidence;
3. complete the real Owner+friend test;
4. resume broad Owner-led visual/interaction evaluation;
5. pay presentation structure debt in bounded evidence-backed slices;
6. continue game-truth work independently where it remains material.

## Primary project risks

1. Treating one implementation's rules as canonical Polish Tysiąc.
2. Using Owner approval as rule/strategy validation when Owner lacks domain expertise.
3. Silently turning ambiguous edge cases into core invariants.
4. Building a rules framework instead of a good table.
5. Bots being legal but strategically unpleasant or inauthentic.
6. Hidden-state or seat-token leakage.
7. Mobile UX becoming a scaled desktop afterthought.
8. Confusing green automation with subjective experience quality.
9. Confusing bounded public availability with durable deployment.
10. Reporting an adjacent property as if it proved the exact Owner requirement.
11. Stale project documents or competing workflow paths becoming accidental authority.
12. Layered presentation patches creating hard-to-see cascade/containing-block regressions.

When uncertain, prefer the smallest reversible action that produces direct evidence for the exact question being asked. When evidence contradicts a critical requirement, stop and resolve the contradiction rather than narrating around it.
