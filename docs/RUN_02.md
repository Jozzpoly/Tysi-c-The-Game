# Run 02 — gameplay / rules / Owner-play hardening

Date: 2026-09-12

Foundation Run 01 is complete. Run 02 deliberately changes the main question from "does the architecture work?" to:

> **Is this Tysiąc implementation correct enough, understandable enough and enjoyable enough for serious Owner play on desktop and mobile?**

## Priorities

1. Resolve the highest-risk `PLAYOK_3P_800_CANDIDATE` uncertainties with fresh evidence and executable scenarios.
2. Implement missing target-profile rule paths only where evidence justifies them.
3. Make a complete solo match comfortable enough for repeated Owner gameplay.
4. Improve causal feedback/history/explanation when a player cannot understand why a move/result occurred.
5. Tune bots from real play findings rather than self-play metric chasing.
6. Keep desktop and mobile equally represented in every interaction/system change.
7. Use duo/trio real-human sessions once the rules/gameplay loop is coherent enough for their feedback to be meaningful.
8. Test actual phone background/suspension and weak-network transitions before treating the product as operationally resilient.

## First rule-risk queue

Re-audit rather than trusting old pins:

- bomb behavior: eligibility, score effect, timing/counting, 800 interaction;
- four-nines redeal: when it can be declared, whether received cards can create it, and score/deal consequences;
- post-musik final-contract ceiling / marriage capacity;
- strict trick obligation details (follow / beat / trump / overtrump);
- marriage scoring when declarer takes no later trick;
- unified Kurnik wording about musik cards / last trick and its 3-player meaning;
- transfer visibility, only if it affects real UX/reference identity.

## Product-risk queue

- can a player understand auction/exchange/contract/trick outcomes without knowing implementation details?
- are meld/trump changes visually and causally obvious?
- is scoring after each hand understandable?
- does the bot feel coherent rather than merely legal?
- do desktop and mobile preserve the same decision clarity even when composition differs?
- are complete-match pacing and transitions pleasant enough for repeated play?

## Evidence rules

Use explicit labels:

- **documented** — source states the behavior;
- **reference-observed** — black-box/reference implementation behavior observed;
- **pinned** — project chose one legitimate behavior where variants differ;
- **executable** — our tests prove what our implementation currently does.

Do not use "certified" for rule identity.

## Run 02 exit direction

Do not predefine a large feature checklist. Run 02 should be considered mature when:

- the high-risk target-profile ambiguities are either resolved or explicitly bounded;
- complete solo games survive serious Owner play on desktop and mobile without major rule/interaction confusion;
- rule-sensitive paths required by the target profile are executable;
- major gameplay feedback defects have been corrected;
- bot behavior is at least adequate under real Owner play;
- one real-human duo/trio session can be run without architecture work dominating the feedback.

Visual finalization is intentionally not an exit requirement.