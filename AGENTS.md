# AGENTS.md — Tysiąc The Game

## Read order before substantial work

1. `docs/EXECUTION_STATE.md` — current live state and priorities.
2. If an incident is OPEN, read the incident document before continuing normal roadmap work.
3. `docs/DEPLOYMENT.md` — authority for public/stable/friend-link claims.
4. `docs/RUN05_PHYSICAL_TABLE_V2.md` — active presentation direction.
5. `docs/PROJECT.md` — durable product/architecture model.

Running behavior and executable evidence outrank plans. A newer explicit Owner requirement outranks a stale plan. When documents conflict, stop treating the conflict as harmless context: identify the current authority and fix the stale document.

## Project intent

Build a professional browser-first Tysiąc table that works naturally on desktop and mobile, supports private multiplayer and bots, and can represent several real rule families without becoming a generic card-game framework.

The current external-readiness goal includes a real, durable, account-owned multiplayer surface that can be sent to another human. A temporary public preview is not an acceptable substitute.

## Owner / agent model

The Owner does **not** know Tysiąc rules well enough to validate exact rule identity, strategic bot quality or authentic Tysiąc gameplay. Never treat Owner approval, silence or enjoyment as proof of those things.

The Owner **is the primary product oracle for experience truth**:

- visual hierarchy, composition and taste;
- mouse/touch feel and ergonomics;
- feedback, causality and comprehensibility;
- perceived motion/pacing;
- desktop/mobile presentation quality;
- onboarding and first-contact quality;
- whether the table feels coherent, polished and worth using.

The agent carries the technical/research burden. Do not require the Owner to program or to translate agent uncertainty into technical work.

## Critical-gate law

An explicit Owner blocker is a hard requirement, not a preference to average against other green evidence.

If the Owner requires property X before progression and available evidence establishes not-X or does not establish X:

**the gate is FAIL / BLOCKED. Stop progression on that gate.**

Unrelated PASS results cannot vote away contradictory evidence.

Examples:

- `temporary / should expire automatically` contradicts a `persistent friend link` requirement;
- a successful public browser smoke does not prove future availability;
- a generated room URL in a harness does not prove the actual copied invite;
- a visually good Owner session does not prove a rule profile is authentic;
- a green local build does not prove a public deployment.

When new evidence contradicts a previous claim, withdraw the previous claim explicitly before continuing.

## Verification-language contract

Never use broad status words as decoration.

Claims such as `verified`, `safe`, `stable`, `persistent`, `ready`, `production`, `friend-ready`, `complete` or `PASS` must name the property and the direct evidence supporting it.

Prefer scoped claims:

- `Foundation current head: PASS`;
- `temporary bounded runtime: PASS`;
- `account-owned non-temporary deployment mechanism: PASS`;
- `exact copied invite: PASS`;
- `same-origin later no-redeploy recheck: PASS`;
- `real-human friend test: pending`.

Do not infer one from another.

For `safe`, state the property actually checked: e.g. no seat-token leakage in share URL, HTTPS origin, hidden-hand separation. Do not imply universal security certification.

## Public deployment / friend-link rules

`docs/DEPLOYMENT.md` is the dedicated authority.

Hard rules:

- `wrangler deploy --temporary` is diagnostic preview infrastructure only;
- an unclaimed temporary URL must never be given to the Owner/friend as a durable candidate;
- stable candidate deployment uses the account-owned authenticated normal deploy path;
- the exact public runtime must identify its expected Git SHA and deployment class;
- public multiplayer behavior and the exact UI-copied invite are separate evidence checks;
- long-horizon evidence must recheck the same origin/SHA later **without redeploying**;
- automation cannot close the friend milestone: the real Owner+friend create/copy/open/join/play test is mandatory;
- if the stable deployment requires a one-time Owner credential/setup action, ask for that action explicitly rather than substituting a weaker deployment mode.

Do not expose Cloudflare API credentials in chat, source, logs or issues.

## Evidence tracks

### Game truth

Questions:

- are rules, legality and scoring correct for the named profile?
- does authority preserve hidden information and lifecycle invariants?
- are bots strategically credible enough?
- does the game feel authentic to knowledgeable Tysiąc players?

Evidence:

- source documentation;
- reference behavior/probes;
- explicit reversible project pins;
- executable scenarios, invariants and simulations;
- experienced Tysiąc-player sessions.

`PLAYOK_3P_800_CANDIDATE` means candidate behavior, not canonical Polish Tysiąc.

### Experience truth

Questions:

- can the player see and understand what matters?
- do interactions feel reliable and intentional?
- are actions/consequences perceptible?
- does desktop/mobile composition work naturally?
- does the product look and feel progressively more professional?

Evidence:

- Owner play/reaction;
- real-device observation/recordings;
- browser interaction/layout tests;
- screenshots/visual review;
- accessibility/touch measurements where useful.

Automation can defend measurable UX mechanics but cannot certify taste or fun.

### Operations / external truth

Questions:

- what exact SHA/deployment class is public?
- is the deployment temporary or account-owned/non-temporary?
- does the actual copied invite contain only safe shareable room identity?
- can a clean second client join and remain isolated?
- does the same origin/SHA remain available later without redeploy?
- can a real second human actually use it?

These questions require direct operational evidence. Local game/experience PASS does not prove them.

## Defended architecture

Preserve unless concrete evidence justifies change:

- browser-first desktop/mobile as equal targets;
- deterministic TypeScript domain core independent of React/network/Cloudflare;
- one canonical legality/reducer implementation;
- named/versioned rule profiles with immutable effective match snapshot;
- `SeatProjection + scoped GameEvents` as human presentation boundary;
- server-authoritative hidden state;
- one SQLite-backed Durable Object `MatchRoom` per table;
- room code as shareable identity and opaque seat token as private authority;
- hibernating WebSockets + snapshot/revision reconnect;
- same domain command model for humans/bots;
- fast authority with client-side presentation pacing.

Avoid duplicated server/client rules, client prediction, generic rules DSL, event sourcing or server sleeps unless evidence overturns the baseline.

## Testing discipline

Tests must prove the exact property they claim.

Core tests: focused rule scenarios, invariants, deterministic matches, simulations where signal justifies cost.

Presentation tests: viewport safety, hit-testing, interaction availability, transition observability, authoritative identity/handoff, reconnect behavior. Do not encode subjective taste into brittle pixel tests.

Deployment tests:

- machine-check temporary/stable workflow separation;
- bind public runtime to exact SHA/class;
- test real public Worker/assets;
- test hidden-state/credential separation;
- click the actual copy-link UI and use the exact emitted URL;
- later recheck the same origin without redeploy.

A test that proves an adjacent behavior must not be reported as proof of the target behavior.

## Technical-debt discipline

Pay debt when it materially reduces risk, ambiguity, iteration cost or future breakage. Do not use `cleanup` as permission for a blind rewrite.

Current known presentation debt includes the layered Run04/Run05 CSS cascade. Audit selector ownership and superseded layers first, then consolidate in bounded slices with existing geometry/browser evidence preserved.

Remove dead or misleading executable paths when their continued presence creates authority ambiguity; Git history is sufficient archival storage for obsolete workflow implementations.

## Working style

Prefer small reversible evidence-producing slices. Keep durable docs current and short enough to function as authority rather than archaeology.

Do not make the Owner fill structured QA forms unless genuinely useful. Natural reactions, screenshots and recordings are valid experience evidence.

During a P0 incident, repair the failing trust boundary and its enabling technical/process debt before resuming speculative roadmap polish.

Current P0 friend-link incident remains OPEN until the complete stable-deployment + no-redeploy + real-human gate succeeds.
