# Run 04 — P1 external first-impression direction

Status: ACTIVE / first composition direction selected for implementation trial.

## External-user contract

This campaign is not trying to make the existing dashboard prettier. It is trying to make the real Tysiac runtime read as a coherent game before the player understands the implementation.

### First 10 seconds

The player should immediately perceive:

1. **my hand** — large enough to read, touch and mentally own;
2. **the shared action locus** — where cards go and where the current situation resolves;
3. **two opponents as sources of actions** — not merely score cells;
4. **what is currently relevant** — bid / exchange / play / result — without scanning several equal-weight panels;
5. a quiet but intentional product surface with no QA, revision, profile or test residue.

The first impression should not be `which panel do I read first?`.

### First interaction

The first available operation must have one visually dominant relation. During auction this means a compact contextual bidding instrument attached to the current scene, not a generic modal-like rectangle competing with the table. During trick play it means the hand itself communicates useful action possibilities.

### First minute

The player should see the scene evolve rather than switch between unrelated UI states:

auction -> musik/exchange -> contract -> first trick.

Common state changes should preserve spatial ownership and hierarchy. Instructional copy may help, but should not carry the entire interaction language.

### First completed trick

The intended causal reading is:

`source seat -> played card -> shared trick -> winner -> collection/value -> next initiative`.

Detached `toast + number change + new turn banner` is the fallback to avoid.

## Fresh current-product diagnosis

The current main presentation is mechanically capable but compositionally prototype-like:

- phase title and controls receive disproportionate top-of-screen importance;
- three equal scoreboard cards form a dashboard strip before the player reaches the table;
- opponents are weak labels/card-count indicators rather than action sources;
- the table spends substantial area as generic green background;
- status strip, trick, decision panel and hand read as stacked independent UI regions;
- decision panels frequently become the visual center of the product;
- cards outside a legal operation are visually disabled, collapsing object capability into legality;
- the private hand is below the table rather than functioning as a first-class territory within the play composition;
- QA/test/profile/revision information leaks into the player-facing surface;
- mobile mostly compresses the same hierarchy rather than changing embodiment deliberately.

These are structural problems. A palette/shadow pass alone would preserve the wrong hierarchy.

## Reference synthesis — principles, not skins

### Pokémon TCG Pocket

Useful:
- direct spatial mapping between hand objects and destinations;
- relationships become discoverable through local feedforward;
- mobile composition is treated as its own body.

Do not copy:
- broad grey-out as the default legality language;
- literal tabletop slots when Tysiac does not need them.

### Marvel Snap

Useful:
- card game designed around fast mobile comprehension rather than desktop inheritance;
- strong prioritization of the active playfield over surrounding product chrome;
- card presentation itself carries product identity.

Do not copy:
- IP spectacle or constant high-intensity visual treatment;
- lane-based spatial grammar that is unrelated to Tysiac.

### Balatro

Useful:
- very high information density can coexist with card/action primacy;
- cards remain visually tactile and desirable to manipulate even inside a numeric game;
- hierarchy is achieved through scale, proximity and action relevance rather than uniform panels.

Do not copy:
- button-heavy information clusters;
- deliberately retro/CRT visual identity.

### Hearthstone

Useful:
- source ownership is spatially obvious: opponent world, shared action field, own hand;
- cards physically travel into a shared scene and consequences are staged there;
- the board establishes a strong visual hierarchy before explanatory text.

Do not copy:
- fantasy board theatre;
- oversized decorative frame as the source of materiality.

## Composition alternatives

### A — literal card table

Three seats around a recognizable table, cards strongly obeying physical-table geometry.

Strengths:
- immediate conceptual model;
- easy source ownership;
- naturally spatial trick.

Rejected as primary direction because:
- easily drifts into felt/wood/poker-room identity;
- wastes scarce mobile area reproducing furniture;
- risks confusing physical imitation with good digital materiality.

Keep only the useful spatial intuition.

### B — compact competitive HUD

Small central play area surrounded by score, phase, contract and action modules.

Strengths:
- dense and efficient;
- easy to implement incrementally;
- conventional competitive-game readability.

Rejected because:
- it is fundamentally an improved version of the current failure;
- hand/cards become content inside UI rather than the primary instrument;
- decision panels continue to own attention;
- likely to become generic premium dashboard styling.

### C — action field + living hand

**Selected for the first authentic runtime trial.**

The screen is organized as three coupled territories:

1. **private territory** — the local hand, large, manipulable, persistent and personally ordered;
2. **shared action field** — current trick / musik transfer / bidding consequence / contract relation;
3. **source/periphery** — opponents, scores and persistent strategic state attached to their owners and quiet when not relevant.

The scene changes emphasis but does not replace itself with a different dashboard for every phase.

## Desktop composition contract

Provisional geometry, to be validated rather than treated as final pixels:

- local hand owns roughly the lower quarter to third of the useful viewport;
- opponent A and B occupy upper-left / upper-right source regions;
- shared trick/action locus remains visually central and has room for directional arrival/collection;
- scores live with seats instead of in an independent full-width strip;
- contract / trump / current bid form a compact shared-state cluster near the action locus and only gain emphasis when relevant;
- phase label becomes secondary scene context, not a large page heading;
- rules/new-game controls move to quiet peripheral utility space;
- contextual decision instruments appear near the object/relation they affect rather than as a permanent central panel.

Desktop may use hover/feedforward, but hover is never required for semantic correctness.

## Mobile composition contract

Mobile is not the desktop composition squeezed vertically.

- hand receives a materially larger bottom territory and must remain readable under thumb/finger occlusion;
- opponents become compact but meaningful source anchors in the upper region;
- current action field occupies the middle and can temporarily expand when consequence matters;
- score/contract state should collapse spatially rather than forming three mini dashboard cards;
- decisions use thumb-reachable contextual instruments without covering the hand relation they explain;
- the same semantic card may travel less distance after commit than on desktop if that improves repeated comfort while preserving object continuity;
- safe areas and browser chrome must not eat the active hand.

## Visual character boundary for P1/P2

Do not select a final theme yet.

The first implementation should already be neutral-but-quality enough that layout judgement is not dominated by prototype styling:

- digital-first, not literal felt/wood;
- cards light/readable against a deep low-noise field;
- fewer bordered rectangles;
- depth primarily communicates ownership/contact/active relation rather than decoration;
- semantic highlight is local and positive;
- typography has clear intensity levels instead of many equal labels;
- normal state is quiet; meaningful action gets the headroom.

## First implementation target

Before importing the tactile donor, recompose the real GameTable while preserving all commands and authority semantics.

P2-A should:

1. remove player-facing QA/test/revision/profile residue;
2. attach score/role to seat anchors;
3. move the hand into the main composition as private territory;
4. demote page-title/status-strip/dashboard hierarchy;
5. reduce generic central decision-panel dominance;
6. increase card/hand scale where available;
7. preserve existing buttons/commands as safe semantic fallback while changing their spatial hierarchy;
8. create distinct desktop/mobile composition rules.

Only after P2-A screenshots are credible should P3 import living-hand mechanisms. Otherwise tactile work will be judged inside another broken composition.

## Rejected shortcut

`current layout + new palette + nicer shadows + animation`

Rejected because it improves surface finish while preserving the principal hierarchy failure.

## Evidence gate

P1 is successful when the selected direction is specific enough to produce a meaningfully different runtime screenshot and when competing alternatives were rejected for product reasons rather than taste adjectives.

The next evidence must come from P2-A rendered desktop/mobile screenshots, not another design document.
