# AGENTS.md — Tysiąc The Game

## Read order before substantial work

1. `docs/EXECUTION_STATE.md` — current live state and priorities.
2. If an incident is OPEN, read the incident document before normal roadmap work.
3. `docs/DEPLOYMENT.md` — authority for public/stable/friend-link claims.
4. `docs/PROJECT.md` — durable product/architecture model.
5. Historical run/handoff files only when needed for archaeology.

Running behavior and executable evidence outrank plans. A newer explicit Owner requirement outranks a stale plan. When documents conflict, identify the current authority and repair the stale document rather than silently choosing one.

## Project intent

Build a professional browser-first Tysiąc table that works naturally on desktop and mobile, supports private multiplayer and bots, and can represent several real rule families without becoming a generic card-game framework.

A durable external multiplayer surface is part of the first useful product. A temporary public preview is not an acceptable substitute for a friend candidate.

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

The agent carries the technical/research burden. Do not require the Owner to program or translate agent uncertainty into technical work.

## Critical-gate law

An explicit Owner blocker is a hard requirement, not a preference to average against other green evidence.

If the Owner requires property X before progression and available evidence establishes not-X or does not establish X:

**the gate is FAIL / BLOCKED. Stop progression on that gate.**

Unrelated PASS results cannot vote away contradictory evidence.

Examples:

- `temporary / should expire automatically` contradicts a `persistent friend link` requirement;
- successful public smoke does not prove future availability;
- a harness-generated room URL does not prove the actual copied invite;
- Owner visual approval does not prove a rules profile authentic;
- a green local build does not prove a public deployment.

When new evidence contradicts a previous claim, withdraw the previous claim explicitly before continuing.

## Experimental control / Golden baseline law

An Owner-evaluated build may be designated as the current **Golden control specimen** in `docs/EXECUTION_STATE.md`.

Golden means "best current empirical control", not "perfect" or "final".

Hard rules:

- a newer branch, PR, commit, green CI run or successful preview does not supersede Golden by recency;
- an experiment must state its exact `baseline_sha`, exact candidate SHA, product-runtime delta, machine evidence and current Owner experience status;
- stack experiments only when the previous delta has earned promotion; otherwise branch new hypotheses from the control or treat prior work as a donor;
- if Owner evidence reports regression in an existing valued property, the candidate fails the experience gate as a whole even when that property was nominally "out of scope";
- do not tell the Owner to ignore a regression because it belongs to a later phase;
- before implementing a regression fix, establish the causal boundary when reasonably possible; if causality is still uncertain, label the change as a diagnostic hypothesis rather than a fix;
- when a hypothesis is falsified, quarantine or remove its derived work instead of letting green automation turn it into accidental authority;
- distinguish repository/validation-harness identity from product identity. `main` may advance operational tooling while an older immutable product SHA remains the actual Golden/stable candidate.

The current Golden SHA belongs only in `docs/EXECUTION_STATE.md`, not in this durable law.

## Verification-language contract

Claims such as `verified`, `safe`, `stable`, `persistent`, `ready`, `production`, `friend-ready`, `complete` or `PASS` must name the property and direct evidence supporting it.

Prefer scoped claims:

- `Foundation current head: PASS`;
- `temporary bounded runtime: PASS`;
- `exact candidate SHA checkout: PASS`;
- `account-owned non-temporary deployment: PASS`;
- `public provenance for SHA X: PASS`;
- `exact copied invite: PASS`;
- `same-origin later no-redeploy recheck: PASS`;
- `real-human friend test: pending`.

Do not infer one from another.

For `safe`, state the checked property, e.g. HTTPS origin, no seat-token leakage in the invite, hidden-hand separation. Do not imply universal security certification.

## Public deployment / friend-link rules

`docs/DEPLOYMENT.md` is the dedicated authority.

Hard rules:

- `wrangler deploy --temporary` is diagnostic preview infrastructure only;
- an unclaimed temporary URL must never be given to the Owner/friend as a durable candidate;
- stable deployment uses the account-owned authenticated normal deploy path;
- stable deployment must accept and checkout one exact immutable `candidate_sha` rather than relying on branch selection;
- the public runtime must report that exact SHA and deployment class;
- public multiplayer behavior and exact UI-copied invite are separate evidence checks;
- long-horizon evidence must recheck the same origin/SHA later **without redeploying**;
- automation cannot close the friend milestone: real Owner+friend create/copy/open/join/play evidence is mandatory;
- if stable deployment needs a one-time Owner credential/setup action, ask for that action explicitly rather than substituting a weaker mechanism.

Never expose Cloudflare credentials in chat, source, logs or issues.

## Three evidence tracks

### Game truth

Questions: rule/scoring correctness for the named profile, hidden-information/lifecycle invariants, strategic bot credibility and authentic Tysiąc gameplay.

Evidence: sources, reference probes, reversible project pins, executable scenarios/invariants/simulations and experienced-player sessions.

`PLAYOK_3P_800_CANDIDATE` means candidate behavior, not universal Polish Tysiąc.

### Experience truth

Questions: hierarchy, interaction reliability, causal feedback, desktop/mobile composition, onboarding and professional presentation quality.

Evidence: Owner natural use/reaction, real-device observation, recordings, screenshots and measurable interaction/layout tests.

Automation can defend mechanics but cannot certify taste or fun.

### Operations / external truth

Questions: what exact SHA/class is public, whether deployment is temporary or account-owned/non-temporary, whether the actual copied invite is safe/joinable, whether the same origin survives without redeploy and whether a real second human can actually use it.

These require direct operational evidence. Game or experience PASS cannot substitute for an external FAIL.

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

Core tests: focused rule scenarios, invariants, deterministic matches and simulations where signal justifies cost.

Presentation tests: viewport safety, hit-testing, interaction availability, transition observability, authoritative identity/handoff and reconnect behavior. Do not encode subjective taste into brittle pixel tests.

Deployment tests:

- machine-check temporary/stable/recheck separation;
- checkout exact `candidate_sha`;
- bind public runtime to exact SHA/class;
- test public Worker/assets;
- test hidden-state/credential separation;
- click the actual copy-link UI and use the exact emitted URL;
- later recheck the same origin without redeploy.

A test proving adjacent behavior must not be reported as proof of the target behavior.

## Technical-debt discipline

Pay debt when it materially reduces risk, ambiguity, iteration cost or future breakage. Do not use `cleanup` as permission for a blind rewrite.

Remove dead or misleading executable paths when their presence creates authority ambiguity; Git history is sufficient archival storage for obsolete infrastructure.

Large presentation/cascade cleanup should be bounded and evidence-backed, not mixed into P0 deployment recovery without necessity.

## Working style

Prefer small reversible evidence-producing slices. Keep durable docs current enough to function as authority rather than archaeology.

Do not make the Owner fill structured QA forms unless genuinely useful. Natural reactions, screenshots and recordings are valid experience evidence.

During a P0 incident, repair the failing trust boundary and its enabling technical/process debt before resuming speculative roadmap polish.

The 2026-09-15 friend-link incident remains OPEN until the complete stable-deployment + no-redeploy + real-human gate succeeds.
