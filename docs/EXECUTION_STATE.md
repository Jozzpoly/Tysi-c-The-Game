# Execution state — fresh critical restart

Date: 2026-09-12
Status: **live project truth for the next implementation run**

This document records the conclusions that survived a fresh re-derivation of the project. Earlier repository material remains useful history, but it is not authority where it conflicts with this file or with executable evidence.

## 1. Product thesis

Build a small, high-quality browser Tysiąc table that is frictionless to open and good enough to use with real people.

Initial product target:

- 3-player auction Tysiąc;
- instant browser entry on desktop and mobile;
- private friend table by link/code without mandatory account creation;
- bots as first-class seats, not a temporary testing hack;
- Human + Bot + Bot must be worth playing before multiplayer is considered complete;
- multiplayer must survive refresh, temporary disconnect and mobile backgrounding naturally;
- the game may later support several real Tysiąc rule families, but it is **not** a generic card-game engine and not an arbitrary rules DSL.

The UI should feel like one product across desktop and mobile, but it does not need to be the same layout squeezed to different sizes. Desktop may use the space for persistent context; mobile should prioritize the current trick, the hand and the current required decision.

## 2. Fresh rule-domain findings

There is no defensible single "Polish Tysiąc" profile.

Strong common structure across Kurnik/PlayOK, Pagat and modern implementations:

- 3 active players;
- 24 cards: 9, J, Q, K, 10, A in four suits;
- trick rank A > 10 > K > Q > J > 9;
- card points 11 / 10 / 4 / 3 / 2 / 0;
- 7 cards each + 3-card musik;
- compulsory 100 for forehand and auction with pass eliminating a bidder;
- winner takes/reveals the musik, then transfers one card to each opponent so all start play with 8 cards;
- declarer leads;
- marriages K+Q are worth 40/60/80/100 and establish trump;
- eight tricks;
- declarer receives plus/minus contract value; defenders receive their own trick/marriage score;
- race to approximately 1000 points.

Material real variation already demonstrated by sources or implementations:

- auction increments and permission to bid above 120;
- 800 vs 900 lock/barrel-style endgame rules;
- bomb availability, count and scoring;
- whether a void player must trump;
- stronger-card / overtrump obligations;
- redeal conditions and when four nines are checked;
- visibility of transferred cards;
- defender rounding at the exact half point;
- marriage eligibility/scoring edge cases;
- simultaneous win resolution;
- 2P and 4P structure.

Important source conflicts:

- Kurnik documents an **800** lock; Pagat's Polish section documents **900**; Mizerca uses **800**.
- Kurnik says defender scores round to tens with 5 upward; Mizerca documents 5 downward / 6 upward.
- Pagat explicitly reports Polish tables both with and without mandatory trumping when void.
- Kurnik allows first-trick marriage; Pagat confirms this as a Polish variation relative to its eastern baseline.

Therefore the old name `POLISH_3P_800_CANDIDATE` is too broad. The first reference target should be explicitly implementation/source scoped, provisionally **`PLAYOK_3P_800_CANDIDATE`**, because PlayOK/Kurnik gives us a concrete documented target and a possible black-box reference later. It must not be presented as canonical Polish Tysiąc.

### Still-open reference scenarios

Before calling the first profile reference-tested, resolve or explicitly pin behavior for:

1. face-up/face-down visibility of the two transferred cards;
2. exact four-nines check timing and whether a nine received in transfer counts;
3. final-contract upper bound after seeing the musik;
4. bomb timing, count and interaction with the 800 lock;
5. exact stronger-card obligation inside suit, trumping and overtrumping;
6. whether a declared marriage scores if its owner wins no trick in the hand;
7. simultaneous >=1000 winner resolution;
8. exact defender rounding at 5 for each intended profile.

The old question about "3P musik points awarded to the last trick" is not a separate 3P mechanic: after the declarer takes the three-card musik and transfers two cards, all 24 cards are in players' hands and are played. We must not double-count them.

Primary current references:

- Kurnik / PlayOK rules: https://www.kurnik.pl/tysiac/zasady.phtml
- Pagat 1000 / Polish Tysiąc: https://www.pagat.com/marriage/1000.html
- Mizerca Thousand rules: https://mizerca.com/en/thousand-rules

## 3. Rules architecture — revised

Keep the deterministic core, but reject the previous implication that seven policy classes are already the right abstraction.

### Keep

A pure TypeScript domain kernel with no React, network or Cloudflare dependencies.

Conceptually:

`State + Command + Rules + explicit randomness -> Result`

where `Result` contains the new state and domain facts needed by adapters/UI.

### Change

Start with **concrete rule data + phase-specific evaluators**, not a polymorphic policy framework.

A first rules object can be grouped by evidenced domains for readability (`auction`, `exchange`, `trick`, `marriage`, `scoring`, `match`, `redeal/abort`), but fields are introduced only when two real targets differ or when a known unresolved scenario must be pinned.

Do not build:

- inheritance between rule families;
- a generic rules DSL;
- arbitrary scripting;
- a combinatorial UI exposing every internal field;
- claims that every possible field combination is supported.

A named profile is a tested bundle of supported values. "Custom rules" can come later and may be restricted to known-safe combinations.

### Versioning

Keep versioned named profiles and pin a match to an immutable effective rules snapshot. A simple deterministic fingerprint of the normalized rules object is enough initially; no profile registry service is required.

## 4. Core / bot / hidden-information model

This survived strongly:

- one canonical legality evaluator;
- all actors submit the same domain commands;
- an online player or bot receives a **seat observation/projection**, never the authoritative hidden state;
- production online authority owns the full state;
- local single-player may run the same authority/core in-process without pretending that the browser is a remote server.

Bots have two distinct roles:

1. `RandomLegal` / deterministic scripted controllers for tests and simulation;
2. an early **heuristic playable bot** for the actual product.

Do not delay an enjoyable solo table until an advanced AI exists. Tysiąc is an imperfect-information game, but prior academic work shows a knowledge/rule-based player is a credible first direction; stronger search-based play can be evaluated later.

## 5. Technical architecture — current-best after re-audit

### Client

**TypeScript + React + Vite** survives.

Reason: the game is predominantly responsive UI/state presentation rather than a rendering-engine problem; React has more than enough capability, Cloudflare has a current first-class React/Vite path, and changing framework would not reduce a material risk.

Prefer DOM/CSS/SVG card UI over Canvas for the first product. Tap/click is the primary interaction; drag may be optional polish later. Never require hover.

### Online authority

**Cloudflare Worker + one Durable Object per active table** survives and is strengthened by current platform guidance.

Use:

- one DO as the coordination atom for one table/match;
- SQLite-backed Durable Objects (Cloudflare's recommended backend for new DOs);
- hibernating WebSockets for live connected tables;
- durable canonical snapshot/revision after accepted commands;
- reconnect by seat token + latest seat projection.

Do not introduce D1 initially. If later we need accounts, ratings, global history or discovery, a global database can be added then.

Do not require SQL schema complexity just because the DO backend is SQLite: the first match can persist a compact canonical state/snapshot using the storage API and evolve only if queryable history becomes valuable.

### Protocol

Turn-based gameplay does not need client prediction.

Minimum protocol properties:

- client command id;
- expected server revision;
- idempotent duplicate handling;
- server validation through the same core legality path;
- server broadcasts per-seat projections, not hidden state;
- reconnect performs state resync instead of trying to replay missed WebSocket packets perfectly.

Mobile suspension/disconnect is treated as normal lifecycle, not exceptional failure.

### Why not switch platform now

- Supabase/Firebase can provide realtime synchronization, auth and global persistence, but the authoritative single-room state machine would require extra coordination/functions/database policy compared with a DO that already is the room authority.
- A conventional Node/WebSocket server on Fly/Render/etc. is viable and familiar, but makes room placement, persistence, sleep/scale and operations our responsibility.
- No alternative currently gives enough product benefit to justify replacing the simpler per-room Durable Object model.

Cloudflare remains current-best, not a permanent requirement.

Current platform references:

- https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/
- https://developers.cloudflare.com/durable-objects/best-practices/websockets/
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/workers/framework-guides/web-apps/react/
- https://developers.cloudflare.com/workers/testing/

## 6. Testing and evidence

Replace the vague ladder "sources -> tests -> simulations -> certified" with evidence types that answer different questions.

### Rule evidence

- **documented** — source text explicitly states the behavior;
- **reference-observed** — behavior reproduced in an existing implementation;
- **pinned** — project deliberately selected a behavior where sources disagree;
- **executable** — scenario fixture proves our implementation does what the profile says.

### Core evidence

- example scenario tests for every material rule branch;
- invariants after every transition;
- deterministic seeded simulations with legal controllers;
- property-based/generative tests where useful (card conservation, legal action closure, terminal progress, no duplicate cards, score/accounting invariants).

Use Vitest for the pure core. `fast-check` is a good candidate for generative invariants. Cloudflare adapters should use the current Workers Vitest integration (`@cloudflare/vitest-plugin`) and later a small production-build integration harness.

### Product evidence

Only real browser play answers whether the table is understandable and pleasant. Owner gameplay is not a rules oracle, but it is primary evidence for feel, information hierarchy and friction.

Avoid the word **certified** unless there is a very explicit internal definition. Prefer statuses such as `candidate`, `scenario-tested`, `reference-tested`, `shipping`.

## 7. Revised development sequence

The previous sequence was directionally good but kept the product invisible for too long.

### Foundation Run 01 — now

Goal: reach a playable local table while preserving falsifiability.

1. Scaffold TypeScript/React/Vite + Vitest and a minimal Cloudflare-compatible project shell.
2. Implement cards, seats, deterministic shuffle/test RNG and the 3P hand state machine.
3. Implement only the rule fields needed by the first PlayOK/Kurnik-targeted candidate and already-evidenced variant pressure.
4. Build scenario fixtures for known rule conflicts and invariants.
5. Add `RandomLegal` and a minimal heuristic bot boundary.
6. Prove full headless hands and matches under seeded simulation.
7. Build a thin responsive Human + Bot + Bot local table immediately after the core is coherent.
8. Separately perform a tiny Durable Object/WebSocket deployment canary so infrastructure risk does not remain hypothetical.

Exit: we can actually play a complete local 3P match in the browser; core invariants survive simulation; online platform skeleton is proven deployable; open rule questions remain explicit rather than silently guessed.

### Run 02

Bind the same domain commands/seat projections to one Match Durable Object and support private Human + Human + Bot / Human + Human + Human tables.

### Run 03

Resilience and product hardening: refresh/reconnect, mobile backgrounding, weak connection behavior, responsive UX, share flow, friend/domain feedback and reference-rule probes.

## 8. Decisions from the old state

| Previous conclusion | Fresh verdict |
| --- | --- |
| Browser-first desktop + mobile | **KEEP** |
| 3-player auction Tysiąc first | **KEEP** |
| Bots first-class | **KEEP, strengthen** |
| TypeScript deterministic core | **KEEP** |
| React + Vite | **KEEP** |
| Cloudflare Worker + Match DO | **KEEP as current-best** |
| SQLite-backed DO | **KEEP, but do not overdesign SQL schema** |
| Server-authoritative hidden state | **KEEP for online; clarify local authority** |
| Human/bot same commands | **KEEP** |
| One canonical `legalActions`/legality authority | **KEEP** |
| Versioned named rules profiles | **KEEP** |
| Seven policy-domain architecture as a fixed boundary | **WEAKEN / simplify** |
| `POLISH_3P_800_CANDIDATE` as first canonical-ish profile | **REJECT / rename to source-scoped PlayOK candidate** |
| "official profiles are certified" language | **REJECT for now** |
| Headless hand -> headless match -> UI only afterwards | **CORRECT: get to thin playable UI sooner** |
| D1 reserved for future global state | **KEEP as possibility, not commitment** |
| Generic custom rules UI | **DEFER** |

## 9. Current risks

1. Mistaking a PlayOK/Kurnik profile for "the Polish rules".
2. Encoding uncertain edge cases as accidental core invariants.
3. Building an abstraction framework before a good local game exists.
4. Producing technically legal but stupid bots, making the first product unpleasant to evaluate.
5. Mobile UX being treated as scaled desktop rather than a distinct responsive composition.
6. Overengineering replay/event sourcing when snapshot + revision + deterministic tests are enough.
7. Waiting too long to deploy a real Durable Object canary.

## 10. Next action

Execute **Foundation Run 01**. Further research should now be demand-driven by a concrete rule scenario, implementation decision or failing test. Do not pause implementation for exhaustive rule archaeology.