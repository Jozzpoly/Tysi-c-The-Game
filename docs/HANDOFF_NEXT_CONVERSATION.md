# Handoff — fresh critical restart

Date: 2026-09-12

## Purpose

The next conversation must **not simply continue the current plan**.

Run a fresh, broad and critical reconstruction of the project from the beginning. Treat this repository and the previous conversation as research material and provisional evidence, not as authority.

The goal is to independently re-derive what Tysiąc The Game should be, how it should be built, what is actually known about the rules, and what the first implementation run should contain.

## Owner intent that should survive the restart

- Codename/project: **Tysiąc The Game**.
- Repository: `Jozzpoly/Tysi-c-The-Game`.
- Browser-first game working naturally across desktop and mobile.
- Cloud-hosted multiplayer; Cloudflare is the current candidate, not an unquestionable requirement.
- Bots are a first-class requirement.
- The game should eventually support multiple real variants / house-rule families of Tysiąc so players can find "their" version.
- Do not turn that flexibility into a generic card-game framework or a configuration monster.
- The intended friend/domain expert may provide rule feedback later, but may also be too busy. His response must not block progress.
- The Owner does not know Tysiąc rules well. Do not use Owner intuition as the rules oracle. The agent initially carries unusually large domain/research judgement in this project.
- Owner judgement remains authoritative for product value, feel, priorities and whether the game is worth using.
- Keep user-facing progress concise and navigable; the Owner expects to skip/scroll much of the detailed work.

## Existing repository material

Current files include:

- `README.md`
- `AGENTS.md`
- `docs/PROJECT.md`
- `docs/rules/POLISH_3P_800_CANDIDATE.md`
- issue #1: `Foundation Run 01 — Rules Architecture → Headless Match`

These are **provisional outputs from the first exploration**. Challenge them.

Do not preserve an architecture, stack choice, policy boundary, profile name, development order or rule interpretation merely because it is already written down.

## What the fresh run should redo

### 1. Reconstruct the actual product need

Re-derive the product thesis from Owner intent rather than from the current README.

Ask:
- What does "professional web Tysiąc" actually need to mean?
- What is essential for the friend use case?
- What makes desktop/mobile cross-play genuinely good rather than merely technically possible?
- Which long-term possibilities matter enough to protect now, and which are speculative scope creep?

### 2. Re-research the Tysiąc domain

Independently verify current rule sources and implementations.

Map:
- stable common structure;
- real regional/platform/house variants;
- ambiguities in published rules;
- behavior that requires black-box/reference testing;
- which differences are large enough to justify architecture-level variability.

Do not assume `POLISH_3P_800_CANDIDATE` is the correct first profile.

### 3. Re-evaluate the technical direction

Freshly assess:
- browser architecture;
- frontend technology;
- Cloudflare Worker / Durable Object suitability;
- persistence model;
- server authority and hidden information;
- reconnect/mobile lifecycle;
- bot execution model;
- deterministic/replay requirements;
- testing strategy;
- cost/operational simplicity.

The current Cloudflare + TypeScript direction is a candidate with prior evidence, not a mandatory answer.

### 4. Re-evaluate rules architecture from first principles

Challenge the current model of:

`Family Core → Policy domains → RulesProfile → EffectiveRulesSnapshot`

Determine whether this is genuinely the smallest useful abstraction or premature architecture.

Protect against both failure modes:
- hardcoding one table's rules;
- building a generic rules framework before a good game exists.

### 5. Re-evaluate the development sequence

Challenge the current sequence:

`headless hand → headless match → local table → MatchDO → resilience → friend build`

Keep it only if a fresh analysis still supports it.

The first implementation step should maximize information and falsifiability while minimizing irreversible architecture.

### 6. Rebuild the evidence model

Decide what should count as:
- documented evidence;
- reference behavior;
- executable rule evidence;
- simulation evidence;
- product/Owner evidence;
- friend/domain-oracle evidence.

Avoid claiming PASS/certification beyond the evidence.

## Fresh-run working rule

Before significant implementation:

1. read the current repo;
2. perform fresh external research where current facts matter;
3. explicitly list which existing conclusions survive, which weaken, and which fail;
4. revise repository truth accordingly;
5. only then begin the first long implementation run.

Do not spend the entire restart producing documentation. The purpose of the re-audit is to reach a **better execution state**, not to create a second pile of plans.

## Desired output of the restart

At the end of the fresh critical reconstruction, the project should have:

- a revised live product thesis;
- a revised map of proven/open rule questions;
- a defensible technical architecture or a justified replacement;
- a deliberately bounded rules-variability model;
- explicit risks and unknowns;
- one concrete long run to execute next;
- repository documentation updated so a later conversation can recover the state without relying on chat history.

## Important stance

The current project is a clean start. This is the best moment to discover that an earlier idea was wrong.

Prefer changing the plan now over protecting sunk reasoning.
