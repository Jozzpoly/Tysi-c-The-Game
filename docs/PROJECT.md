# Project model — Tysiąc The Game

Date: 2026-09-13

For current implementation/evidence truth, read `docs/EXECUTION_STATE.md` first.

## Product thesis

A modern digital table for the Tysiąc family, beginning with a very good 3-player auction game rather than a broad framework.

The useful first product is simple:

- open a link;
- play immediately on desktop or phone;
- play alone with two competent-enough bots;
- create a private table and send the link to friends;
- recover naturally from refresh/reconnect/mobile backgrounding;
- know which concrete rules the table uses.

No mandatory account system is required for the first product.

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
- current target: `PLAYOK_3P_800_CANDIDATE`;
- model a variant field only when evidence or a concrete unresolved scenario justifies it;
- named profiles are supported bundles, not arbitrary combinations guaranteed to work;
- knowledgeable-player/domain validation may later define another profile without mutating the PlayOK-targeted one;
- 2P and 4P remain separate future modes because their structures materially differ.

The Owner is not a rules oracle. Owner acceptance must never silently promote a candidate rule into reference truth.

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
- transient typed domain facts/events useful to presentation/adapters/tests.

Do not turn this into event sourcing without a demonstrated need.

### Rules representation

Use a concrete rules object grouped by evidenced concerns such as auction, exchange, trick, marriage, scoring, match and redeal/abort behavior.

Named profiles carry stable identity/version and normalized effective behavior. Variant fields should earn their existence through real rule-family conflicts or executable scenarios.

### Client / presentation

React + Vite SPA, responsive DOM/CSS/SVG-first UI.

Canonical human client boundary:

`SeatProjection + scoped GameEvents`

`GameTable` remains independent of local vs remote authority.

Desktop and mobile share product semantics but may compose the table differently. Both are equal-quality targets, not desktop-first plus a reduced mobile port.

The foundation must support professional:

- card/table art;
- animation and motion feedback;
- sound/haptics;
- richer explanation/history;
- accessible interaction;
- responsive compositions that preserve clear hit targets and information hierarchy.

Experience work is allowed to mature **in parallel** with unresolved gameplay/rule research. It must not duplicate game authority, encode uncertain rules as a second state machine or force irreversible art/layout decisions before evidence warrants them.

### Bots

Bots operate from the same seat observation + legal-command boundary as humans.

The current heuristic is an adequate automation/product baseline, not evidence of strategic quality. Improve it from measurable failures, domain reasoning and knowledgeable-player feedback. Owner enjoyment or frustration may identify an experience symptom, but cannot certify whether a move is strategically good Tysiąc.

### Online authority

Current-best: Cloudflare Worker + one SQLite-backed Durable Object `MatchRoom` per table.

`MatchRoom` owns authoritative hidden match state, accepted command revision, seat capability identity, reconnect persistence, server-owned bot turns and per-seat projection/event broadcasts.

Use hibernating WebSockets and snapshot/revision reconnect. Socket death is normal lifecycle, not exceptional corruption.

Room code is shareable identity; seat reconnect token is private authority. No mandatory accounts are needed yet.

D1/global persistence is not part of the first product. Add global identity/history/ranking only if product demand justifies it.

## Evidence model — two parallel tracks

The project no longer uses one linear "automation -> Owner gameplay -> polish" validation chain.

### Track A — game truth

Answers:

- profile rule identity and edge cases;
- legality/scoring correctness;
- authority/privacy/lifecycle correctness;
- strategic bot credibility;
- authentic gameplay quality for people who know Tysiąc.

Evidence hierarchy includes source documentation, reference behavior, explicit reversible pins, executable scenarios/invariants/simulations and knowledgeable-player sessions.

Owner feedback is **not** evidence that a rule, strategy or Tysiąc convention is correct.

### Track B — experience truth

Answers:

- information hierarchy and visual composition;
- touch/mouse interaction quality;
- causal feedback and comprehensibility;
- perceived pacing/motion;
- responsive desktop/mobile ergonomics;
- onboarding;
- visual/professional quality.

The Owner is the primary judgement source here. Natural reactions, recordings and screenshots are first-class evidence.

Automation supports this track only where the question is measurable: hit targets, overflow, interaction availability, transition observability, responsive bounds, reconnect state and similar mechanics. Green browser tests do not prove taste or feel.

### Integration rule

Neither track blocks the other by default. A presentation slice can proceed while a rule pin remains unresolved if the slice stays downstream of canonical projections/events and remains reversible. A gameplay claim cannot be upgraded merely because the interface feels good.

## Development sequence

### Foundation Run 01 — COMPLETE

Delivered and proved:

- deterministic 3P rules/game kernel;
- executable candidate-profile scenarios and invariants;
- playable heuristic bot baseline;
- projection/privacy/event boundary;
- one responsive desktop/mobile `GameTable`;
- anonymous solo/duo/trio room lifecycle;
- reconnect capabilities;
- server-owned bot turns;
- SQLite Durable Object authority + hibernating WebSockets;
- local and public Chrome multiplayer/reconnect evidence;
- guarded permanent/temporary deployment workflows.

### Run 02 — dual-track game + experience hardening

Run 02 no longer asks the Owner to validate Tysiąc gameplay they cannot reliably judge.

**Game-truth work** prioritizes high-risk PlayOK-sensitive behaviors, executable/reference evidence, bot credibility evidence and eventually knowledgeable real-human sessions.

**Experience-truth work** continuously iterates interaction, feedback, responsive composition and visual language with the Owner, on both desktop and real mobile devices.

The tracks converge through the same game core and projection boundary. A real-human duo/trio session is especially valuable once infrastructure is quiet enough that both authentic gameplay and presentation can be judged.

A durable public test surface should be introduced when repeated Owner/friend sessions justify it; temporary previews remain useful for bounded checks.

### Later maturity

As evidence accumulates, deepen rather than abruptly begin:

- professional card/table visual systems;
- richer animation/audio/haptics;
- accessibility;
- operational soak and durable deployment;
- additional validated rule profiles;
- stronger bots where they materially improve knowledgeable-player sessions.

"Later" does not mean experience work is deferred. It means final/high-cost polish should follow evidence rather than lock the project too early.

## Long-term possibilities, not commitments

- several reference-tested Polish/house profiles;
- restrained custom-table presets;
- imperfect-information search/stronger bots;
- rules learning/explanation tools;
- replay/debug capsules if a real debugging need justifies them;
- accounts, matchmaking/rankings only if product demand justifies global identity/state.

## Primary project risks

1. Treating one implementation's rules as canonical Polish Tysiąc.
2. Using Owner approval as gameplay/rule validation when the Owner lacks domain expertise.
3. Silently turning ambiguous edge cases into core invariants.
4. Building a rule framework instead of a good table.
5. Bots being legal but strategically unpleasant or inauthentic.
6. Hidden-state leakage through projections/feedback.
7. Mobile UX becoming a scaled desktop afterthought.
8. Confusing green automation with actual gameplay or experience quality.
9. Deferring experience work so long that technical structure hardens around poor interaction assumptions.
10. Conversely, locking expensive/final visual work to rule semantics that are still genuinely uncertain.

When uncertain, prefer the smallest reversible action that produces concrete game-truth or experience-truth evidence.