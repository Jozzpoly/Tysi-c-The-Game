# Tysiąc The Game

**Codename:** `Tysiąc The Game`

Browser-first Tysiąc for desktop and mobile: private friend tables, first-class bots and a small set of explicitly tested real rule profiles.

## Product thesis

Najpierw dobra gra i dobry stół. Elastyczność zasad ma chronić realne odmiany Tysiąca, a nie zamienić projektu w generic card-game framework.

Current target:

- 3-player auction Tysiąc;
- open link / private table without mandatory accounts;
- `solo`: Human + Bot + Bot;
- `duo`: Human + Human + Bot;
- `trio`: Human + Human + Human;
- desktop and mobile treated as equal product targets;
- reconnect/background/refresh treated as normal browser lifecycle.

## Current technical direction

Validated during Foundation Run 01 and subsequent Run 02 slices:

- deterministic TypeScript domain core;
- React + Vite client;
- one projection-driven `GameTable` for local and online play;
- Cloudflare Worker + one SQLite-backed Durable Object per table;
- hibernating WebSockets;
- server-authoritative hidden state with per-seat projections;
- anonymous room codes + private reconnect capabilities;
- scenario/invariant/simulation tests plus real Chrome desktop/mobile gates.

Cloudflare remains **current-best**, not an eternal requirement.

## Rules stance

There is no single defensible "Polish Tysiąc" ruleset.

The first concrete reference target is provisionally source-scoped as `PLAYOK_3P_800_CANDIDATE` (Kurnik/PlayOK family), with unresolved edge cases kept explicit and reference probes added when necessary.

Named profiles are tested bundles of supported behavior. We do not promise that every arbitrary combination of internal rule fields is valid.

## Current execution — two evidence tracks

**Foundation Run 01 is complete.** It established the rules/game kernel, responsive presentation boundary, bot baseline, private room lifecycle, reconnect identity, real MatchRoom authority and public Cloudflare/browser feasibility.

**Run 02** now advances two loops in parallel instead of asking one kind of evidence to prove everything:

### Game truth

Rules, legality/scoring, bot strategy and authentic Tysiąc gameplay are validated through source/reference evidence, executable tests/simulations and knowledgeable Tysiąc-player feedback.

The Owner does **not** know the game well enough to certify this track.

### Experience truth

Visual hierarchy, interaction/touch feel, feedback, perceived pacing, responsive composition, onboarding and professional presentation are iterated with the Owner as the primary product oracle.

Owner confusion is valuable UX evidence, but does not automatically mean the underlying rule is wrong.

The two tracks can progress concurrently. Presentation does not need to wait for all rule research to finish, provided it remains downstream of the canonical game state/projection boundary and does not hard-code uncertain rule semantics.

## Current Run 02 example

The first direct Owner-derived experience slice hardened mobile touch interaction after real play exposed unreliable-feeling taps and accidental text selection.

The defended contract now includes finger-sized controls, touch-safe cards and a directly hittable 5×2 layout for the temporary 10-card exchange hand. See [`docs/EXECUTION_STATE.md`](docs/EXECUTION_STATE.md) for current evidence.

## Live truth

- [`docs/EXECUTION_STATE.md`](docs/EXECUTION_STATE.md)
- [`docs/RUN_02.md`](docs/RUN_02.md)
- [`docs/PROJECT.md`](docs/PROJECT.md)
- [`AGENTS.md`](AGENTS.md)

Other useful context:

- [`docs/rules/PLAYOK_3P_800_CANDIDATE.md`](docs/rules/PLAYOK_3P_800_CANDIDATE.md)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

## Source of truth

Use the evidence source appropriate to the claim:

1. running code + executable tests/invariants for implementation behavior;
2. documented/reference evidence for rule identity;
3. knowledgeable-player evidence for authentic gameplay/strategy;
4. Owner observation for product experience, visual quality and feel;
5. current repository execution/product docs for project state;
6. historical chat/handoff material only as context.

Do not let green automation substitute for subjective experience judgement, and do not let Owner taste substitute for Tysiąc domain evidence.