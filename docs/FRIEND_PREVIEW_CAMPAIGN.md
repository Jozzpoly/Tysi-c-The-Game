# Friend Preview Campaign — external-facing candidate

Date updated: 2026-09-15
Status: **REOPENED / P0 EXTERNAL-READINESS FAILURE**

## Incident correction

The campaign originally contained the correct gate: P8 required a **stable public link**, and P9 required one stable URL + exact frozen SHA before the build could be sent to the friend.

That gate was not actually satisfied. A temporary unclaimed Cloudflare preview was later treated as if it fulfilled the stable-link requirement despite repository evidence that it should expire automatically.

Therefore:

- previous friend-readiness claims are invalidated;
- P8/P9 are **FAILED / REOPENED**;
- no temporary preview can close them;
- `docs/INCIDENT_2026-09-15_FRIEND_LINK.md` and `docs/DEPLOYMENT.md` now define the mandatory recovery gate.

This correction does not invalidate the useful visual/interaction work produced by the campaign. It invalidates the external-readiness conclusion.

## Mission

Prepare a real Tysiąc build that can be sent to a friend without explanation, apology, developer framing, temporary-host warnings, QA chrome or hidden infrastructure caveats.

The friend must receive the real game and real runtime, not demo theatre, a static mock or an expiring preview represented as durable.

The external candidate must be:

- visually credible enough for first contact;
- mechanically functional on desktop/mobile;
- server-authoritative with private hidden state;
- reachable through one account-owned non-temporary HTTPS origin;
- traceable to one exact candidate SHA;
- joinable through the **actual in-game copied invite**;
- still reachable on a later no-redeploy recheck;
- finally proven by a real Owner+friend session.

## Governing product target

The first external user should encounter a modern, digital-first card game where:

- the hand/cards are primary instruments, not small controls below a dashboard;
- cards remain alive even when a specific operation is illegal;
- legal actions are taught through positive feedforward and receptive relationships;
- ordinary play has causal continuity from hand to table to consequence;
- visual hierarchy and motion form one restrained sensory language;
- desktop and mobile are both first-class bodies;
- routine states are quiet but inhabited;
- developer/test/revision/ruleset chrome is absent from the external-facing surface;
- opening and joining the game is operationally boring: the link simply works.

## Campaign phases — corrected state

### P0 — consolidate truth and deployment authority

**REOPENED / ACTIVE P0**

Current recovery work must:

- maintain one current execution authority;
- remove misleading/competing publication paths;
- keep temporary preview explicitly diagnostic/expiring;
- establish `Stable Multiplayer Deploy` as the only friend-candidate publication path;
- bind public runtime to exact build SHA + deployment class;
- test the exact copied friend invite;
- provide a no-redeploy later recheck path;
- keep Foundation green.

Exit: one unambiguous stable deployment path, one exact candidate SHA, one public origin, direct evidence for each claimed property, no CI/workflow ambiguity.

### P1 — external first-impression specification

**SUBSTANTIALLY EXPLORED, NOT FINAL**

Define first 10 seconds, first interaction, first minute and first trick/decision. Use references by behavior/hierarchy rather than copied themes.

### P2 — information architecture / spatial hierarchy

**SUBSTANTIALLY IMPLEMENTED IN RUN 05, OWNER JUDGEMENT OPEN**

Cards, hand, shared action scene and opponent/source presence now carry more of the composition. Desktop and mobile have diverged intentionally where needed.

### P3 — living hand / embodied control

**IMPLEMENTED MECHANICALLY, OWNER FEEL JUDGEMENT OPEN**

Permissive manipulation, topology, insertion intent, mobile finger visibility and authoritative commit separation have executable browser evidence.

### P4 — first living slice

**IMPLEMENTED MECHANICALLY, OWNER EXPERIENCE JUDGEMENT OPEN**

The common causal path now has material arrival/resolve/collect/consequence/settled presentation and persistent captured ownership.

### P5 — visual identity / graphics polish

**PARTIAL / NOT FINAL**

Do not resume broad blind polish while P0 external readiness is failed. Owner visual evidence should drive the next major aesthetic pass.

### P6 — feedback / motion / feel

**PARTIAL / ITERATED**

Material deal, talon, exchange, marriage, trick and tactile-hand motion exist. Repeated feel still needs real Owner use.

### P7 — propagate language through full game

**PARTIAL / BROAD COVERAGE EXISTS**

Many reachable states have moved away from old debug/dashboard presentation. Do not claim complete experience coherence without Owner evidence.

### P8 — external-readiness torture and rehearsal

**FAILED / REOPENED**

Original intended exit included:

- no developer chrome;
- no broken layout;
- no intermediary hosting warning;
- no obvious interaction regression;
- **stable public link**;
- clean cold start.

The stable-link criterion was not satisfied. Temporary public smoke did not prove persistence.

Corrected P8 now additionally requires:

- account-owned authenticated normal deployment;
- owned-account deployment registration;
- exact SHA/deployment provenance;
- public Worker/assets/multiplayer checks;
- actual copied-invite check with a clean second client;
- short-window repeatability with no claim inflation;
- later no-redeploy recheck of the same origin/SHA.

### P9 — Owner acceptance and Friend Candidate freeze

**NOT REACHED**

P9 may begin only after corrected P8 evidence exists.

Then:

- Owner uses the exact stable candidate naturally;
- material visual/interaction findings are fixed;
- exact SHA + stable origin + rollback point are recorded;
- the Owner sends the real copied invite to the friend;
- the friend successfully joins/plays from a real external context;
- Owner reports success.

Only then is `Friend Candidate` a defensible state rather than a label.

## External-ready gate

A candidate is not friend-ready because CI is green or because a temporary public URL works right now.

It is friend-ready only when all three truth classes agree:

**game/runtime:** canonical game, hidden-state authority and real multiplayer remain functional;

**experience:** desktop/mobile first contact and interaction are acceptable to the Owner;

**operations/external:** account-owned non-temporary origin, exact SHA provenance, real copied invite, later no-redeploy availability and real friend use all succeed.

A FAIL in any blocking property keeps the external stage failed.

## Evidence policy

### Track A — game truth

Sources, reference observations, explicit pins, invariants/scenarios/simulations and knowledgeable-player evidence.

### Track B — experience truth

Fresh screenshots/recordings, Owner natural use, external first-contact behavior and measurable interaction mechanics.

### Track C — operations/external truth

Deployment mechanism, runtime provenance, public behavior, exact copied invite, elapsed-time no-redeploy evidence and real-human external use.

Automation may reject regressions. It cannot certify taste, fun or real-human success. A temporary mechanism cannot certify persistence by repeated short-lived smoke.

## Scope guard

Do not add accounts, ranking, broad bot redesign, generic physics, 2P/4P expansion or unrelated systems to make the external candidate look larger.

Do not use incident recovery as justification for rewriting the entire game.

Do remove or consolidate infrastructure/documentation that creates real authority ambiguity or repeatedly causes regressions.

The campaign wins when the existing authentic game becomes a coherent external-facing product **and the friend path is genuinely boring, stable and evidenced**.
