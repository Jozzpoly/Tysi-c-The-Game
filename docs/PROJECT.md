# Project model — Tysiąc The Game

Date: 2026-09-12

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
- friend/domain-expert validation can later define another profile without mutating the PlayOK-targeted one;
- 2P and 4P remain separate future modes because their structures materially differ.

## Architecture — current defended baseline

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
- transient domain facts/events where useful to presentation/adapters/tests.

Do not turn this into event sourcing without a demonstrated need.

### Rules representation

Use a concrete rules object grouped by evidenced concerns such as auction, exchange, trick, marriage, scoring, match and redeal/abort behavior.

Named profiles carry stable identity/version and normalized effective behavior. Variant fields should earn their existence through real rule-family conflicts or executable scenarios.

### Client / presentation

React + Vite SPA, responsive DOM/CSS/SVG-first UI.

Canonical human client boundary:

`SeatProjection + scoped GameEvents`

`GameTable` must remain independent of local vs remote authority.

Desktop and mobile share product semantics but may compose the table differently. Long-term both are equal-quality targets, not desktop-first plus a reduced mobile port.

The foundation must allow later professional:

- card/table art;
- animation and motion feedback;
- sound/haptics;
- richer explanation/history;
- accessible interaction;
- responsive compositions that preserve clear hit targets and information hierarchy.

### Bots

Bots operate from the same seat observation + legal-command boundary as humans.

Current heuristic is an adequate product baseline, not a final AI opponent. Improve it primarily when real human gameplay exposes concrete weaknesses.

### Online authority

Current-best: Cloudflare Worker + one SQLite-backed Durable Object `MatchRoom` per table.

`MatchRoom` owns:

- authoritative hidden match state;
- accepted command revision;
- seat capability identity;
- persistence needed for reconnect;
- server-owned bot turns;
- per-seat projection/event broadcasts.

Use hibernating WebSockets and snapshot/revision reconnect. Socket death is normal lifecycle, not exceptional corruption.

Room code is shareable identity; seat reconnect token is private authority. No mandatory accounts are needed yet.

D1/global persistence is not part of the first product. Add global identity/history/ranking only if product demand justifies it.

## Evidence model

Different evidence answers different questions.

### Rules

- source-documented behavior;
- observed reference behavior where useful;
- explicit project pin where legitimate variants disagree;
- executable profile scenarios.

### Core correctness

- scenario tests;
- invariants after transitions;
- deterministic seeded hands/matches;
- broad simulation/property testing where it adds signal.

### Platform/runtime

Foundation now has all of:

- local workerd/Vitest tests;
- desktop/mobile Chrome E2E;
- local remote-room/reconnect E2E;
- actual public Cloudflare Worker + Durable Object + assets deployment proof;
- public desktop↔mobile browser/WebSocket/reconnect proof.

This proves feasibility and current boundary correctness, not long-duration production operations.

### Product

Owner and target-player gameplay determine whether the table is understandable, pleasant and worth using. Product judgement does not replace rule evidence, and automated tests do not replace product judgement.

## Development sequence

### Foundation Run 01 — COMPLETE

Delivered and proved:

- deterministic 3P rules/game kernel;
- executable candidate profile scenarios and invariants;
- playable heuristic bot baseline;
- projection/privacy/event boundary;
- one responsive desktop/mobile `GameTable`;
- anonymous solo/duo/trio room lifecycle;
- reconnect capabilities;
- server-owned bot turns;
- SQLite Durable Object authority + hibernating WebSockets;
- local and public Chrome multiplayer/reconnect evidence;
- guarded permanent/temporary deployment workflows.

### Run 02 — gameplay / rules / product hardening

Primary question: **is the game correct enough, understandable enough and enjoyable enough for serious play?**

Work in this run should prioritize:

1. critical audit of unresolved PlayOK-sensitive behaviors;
2. implementation/tests for rule paths the target profile genuinely requires (especially bombs/redeals if confirmed);
3. complete solo-match Owner playability on both desktop and mobile;
4. better causal feedback/history/explanation where the player cannot understand what happened;
5. bot weaknesses found by real play rather than self-play metric chasing;
6. real-human duo/trio sessions once the rule/game loop is coherent;
7. real-device background/suspension/network transition testing;
8. permanent Cloudflare deployment only when we want a durable friend/Owner test surface.

Do not turn Run 02 into a visual-redesign project. Visual polish can improve obvious interaction blockers, but full art/animation polish should follow gameplay truth.

### Later — friend build / presentation quality

Once gameplay/rules withstand real use:

- stronger feedback/animation/audio/haptics;
- professional card/table visuals;
- accessibility pass;
- permanent deployment and operational soak;
- additional validated rule profiles;
- stronger bots if they materially improve play.

## Long-term possibilities, not commitments

- several reference-tested Polish/house profiles;
- restrained custom-table presets;
- imperfect-information search/stronger bots;
- rules learning/explanation tools;
- replay/debug capsules if a real debugging need justifies them;
- accounts, matchmaking/rankings only if product demand justifies global identity/state.

## Primary project risks

1. Treating one implementation's rules as canonical Polish Tysiąc.
2. Silently turning ambiguous edge cases into core invariants.
3. Building a rule framework instead of a good table.
4. Bots being legal but strategically unpleasant.
5. Hidden-state leakage through projections/feedback.
6. Mobile UX becoming a scaled desktop afterthought.
7. Overengineering persistence/replay/global state before a real need.
8. Confusing green automation with actual gameplay quality.
9. Polishing visuals before rule/interaction truth is stable.

When uncertain, prefer the smallest reversible action that produces concrete rule, runtime or gameplay evidence.