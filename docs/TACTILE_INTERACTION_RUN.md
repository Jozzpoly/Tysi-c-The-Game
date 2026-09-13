# Tactile Interaction Run — hand-first experience rebuild

Date: 2026-09-14
Status: planned from Owner desktop + phone recordings after PR #20 preview
Scope: experience track only; no rule/core/authority redesign

## Why this run exists

The first tactile recovery was directionally useful but far from the intended experience.

Owner judgement after the preview:

> regression, but in the right direction — at least it is finally trying to move toward the requested interaction; there is still a very large amount of work.

That is the working truth for this run.

PR #20 proves several useful primitives — cards can be picked up, reordered, freely thrown and positively accepted by the table — but it still behaves too much like a UI list with drag attached to it. The next run must not continue by stacking more CSS effects and thresholds onto that prototype.

The target is a hand that feels like a small permissive physical toy inside the game:

- cards are always live objects, not enabled/disabled controls;
- rearranging is satisfying even when it has no gameplay consequence;
- surrounding cards react while one card is being moved;
- the hand continuously makes and removes space instead of snapping between slot states;
- dragging away from the hand is free exploration;
- useful game actions reveal themselves through positive response from the card/table;
- invalid/non-action gestures are not errors — the card simply remains physical and settles back;
- successful actions preserve visual continuity from hand -> table -> trick -> collection;
- desktop and phone may compose the same interaction differently;
- the canonical game remains authoritative and ignorant of presentation-only physical state.

## Evidence from the Owner recordings

Two fresh recordings were reviewed:

- desktop: ~149 s, 1918×906;
- phone portrait: ~99 s, 576×1280 recording.

Material findings:

1. **Direction improved, substrate did not.** A held card can leave the hand and follow mouse/finger, which is the first genuinely useful physical primitive. But the rest of the hand still behaves mostly as static slots.
2. **Reordering is discrete and weakly causal.** Neighbor cards do not convincingly open a gap, shift mass, or settle around the held card. The user manipulates an index more than a hand.
3. **Release/return is binary.** Free throws prove permissiveness but their return trajectory and settling are too canned to feel like one continuous object interaction.
4. **Action feedback is still threshold-shaped.** The current implementation decides throw intent from distance and then decorates the state. The desired behavior should emerge continuously from spatial proximity and action possibility.
5. **Phone is the harder truth.** Small width exposes fixed-slot assumptions, crowding and finger occlusion. The hand needs adaptive overlap/spread rather than a desktop row compressed into mobile.
6. **The 10-card exchange composition is a conceptual discontinuity.** Switching to a special 5×2 grid protects touch targets but stops feeling like the same hand. We need a hand model that can remain tactile with 6–10 cards instead of changing interaction metaphors.
7. **Card continuity ends too early.** Cards can be held, but successful play, trick landing, trick collection and hand compaction still read as UI/state transitions rather than one physical sequence.
8. **Classical UI still dominates the table.** Decision cards, text and panels remain useful scaffolding, but they compete with the physical interaction loop. They should progressively become secondary once the physical language can carry more meaning.

These are Owner-experience findings. They do not certify or challenge Tysiąc rule correctness.

---

# Execution model

This is a multi-level run. Do not treat the levels as a rigid waterfall: later-level observations may force bounded changes to an earlier substrate. However, do not jump ahead to expensive polish when a lower-level interaction contract is still unstable.

Each level has four evidence classes:

- **mechanical** — executable pointer/touch/browser contract;
- **render** — screenshots/recordings inspected for actual spatial behavior;
- **feel hypothesis** — current design intent, explicitly not proven by automation;
- **Owner evidence** — direct Owner use on desktop/phone.

Automation may defend mechanics. It must never declare tactile quality or visual taste PASS.

## Level 0 — preserve the experiment and reset the implementation strategy

Goals:

- keep PR #20 unmerged as the defended proof-of-direction;
- preserve exact pre-run and preview commits as comparison points;
- branch the deeper rebuild from the defended tactile head rather than modifying `main`;
- document the new interaction invariants before replacing implementation details.

Non-goals:

- no visual restyle;
- no core/rule changes;
- no attempt to make PR #20 itself the final architecture.

Exit condition:

- exact baseline is recoverable;
- long-run branch exists;
- interaction invariants are written and referenced by tests.

## Level 1 — interaction substrate, not animation pile

Replace the current growing collection of local booleans/thresholds with a small presentation-only interaction model.

Proposed conceptual states:

- `resting`
- `pressed`
- `held`
- `movingWithinHand`
- `movingOverTable`
- `actionAttracted`
- `accepted`
- `returning`
- `settling`

The exact names are not sacred. The important part is to have one explicit model that owns:

- pointer identity/capture;
- current and recent pointer positions;
- velocity estimate;
- held-card transform;
- hand insertion target;
- table/action attraction strength;
- release outcome;
- settling target and timing.

Core invariant:

> presentation may choose position, order and motion; `SeatProjection.ownHand` exclusively chooses which cards exist, and legal commands exclusively choose which gestures may commit game truth.

Engineering direction:

- keep this deterministic enough to rehearse from synthetic pointer paths;
- prefer a small spring/interpolation system over a general physics engine;
- use `requestAnimationFrame` only where continuous motion is materially useful;
- keep reduced-motion semantics explicit;
- never expose presentation state into server authority or replay truth.

Exit condition:

- one interaction state model drives mouse and touch;
- current reorder/free-throw/legal-throw behavior can be re-expressed through it;
- no regression to canonical authority, reconnect or tap/click fallback.

## Level 2 — make the hand itself alive

This is the first major experience level.

Required behaviors:

### Pickup

- card lifts from its exact resting pose instead of switching to a detached generic ghost;
- z-order, shadow, scale and slight tilt respond continuously;
- pickup offset respects where the finger/mouse grabbed the card;
- small pointer movement remains a tap, not an accidental reorder.

### Neighbor response

- cards adjacent to the moving card create a visible insertion gap;
- the gap moves continuously with the held card;
- neighbors shift before release, not only after order mutation;
- movement should have light spring/settling instead of synchronized CSS snapping.

### Reorder

- logical order commits only when appropriate, but visual preview is continuous;
- fast movement across several cards should not jitter between indices;
- crossing boundaries should feel like cards yielding space;
- lifting away from the hand freezes/reduces reorder influence instead of shuffling under a thrown card.

### Resting hand composition

- desktop may use a shallow fan and generous overlap;
- phone needs adaptive overlap/spread based on count and available width;
- 6, 7, 8, 9 and 10 cards must remain the same interaction metaphor;
- remove the special 10-card 5×2 interaction grid once an equally reliable tactile hand replacement exists;
- direct hit targets must remain defensible even when visual cards overlap.

### Free play

- any card can be pulled out of the hand at any phase where the hand exists;
- non-action release is never red/error/rejection;
- card returns to its current chosen position with physically coherent settling;
- a free throw may alter hand order if the player clearly moved it across the hand before throwing.

Exit condition:

- synthetic touch/mouse rehearsal demonstrates continuous insertion behavior;
- all cards remain manipulable when no game action is available;
- 6–10-card layouts remain usable at guarded desktop + phone widths;
- Owner preview shows materially more fun in simply rearranging cards before any table interaction is judged.

## Level 3 — positive affordance as a spatial field

Replace binary `distance crossed -> glow` language with continuous attraction generated by the table/action relationship.

Principle:

> nothing becomes dead or forbidden; useful possibilities gain response as the player approaches them.

Possible signals, to tune empirically:

- legal card warms slightly while held;
- table catch region becomes visible only as a useful card approaches;
- catch region expands/brightens with proximity;
- held card subtly aligns/rotates toward the landing pose;
- release inside a confident region commits;
- retreating removes the response smoothly;
- non-action cards can travel through the same space without error styling.

Do not rely on instructional copy as the primary affordance. Text may remain as onboarding fallback, but the object/table behavior should explain itself.

Exit condition:

- automation distinguishes free exploration from committed command without relying on a visible error state;
- table response varies continuously with spatial progress;
- Owner can discover throw-to-play without needing to read a sentence repeatedly.

## Level 4 — continuous card lifecycle

The hand cannot feel physical if successful actions immediately collapse back into ordinary UI updates.

Build visual continuity for:

1. hand pickup;
2. throw/commit;
3. landing at the player's table position;
4. opponent card arrival from opponent side;
5. completed trick pause/readability;
6. trick collection toward the winner;
7. next lead state;
8. hand compaction after the played card is truly gone.

Later in this level, extend the same language to:

- talon/musik entering the declarer's hand;
- two transferred cards leaving toward opponents;
- next hand/deal appearance.

Important sequencing:

- do not fake card continuity by delaying authority;
- authority updates remain immediate;
- presentation owns a short-lived visual token/ghost representing the transition after canonical ownership changes.

Exit condition:

- a full trick is visually traceable as a sequence of card objects rather than state replacement;
- no server sleeps or client prediction of legality;
- reconnect always resolves to canonical snapshot cleanly even if a local transition was in flight.

## Level 5 — reduce UI dominance around the physical loop

Only after the card language carries enough meaning, start removing scaffolding that competes with it.

Targets:

- compact/reposition `Twój ruch` text so it does not visually sit between hand and table;
- reduce large decision panels during ordinary card play;
- treat messages as transient table feedback where practical;
- preserve explicit controls for genuinely symbolic decisions (auction, contract, bomb, four nines) until a better interaction is proven;
- avoid turning every Tysiąc decision into a card-physics gimmick.

The table should become the dominant spatial scene; UI should explain exceptional decisions, not frame every second of play.

Exit condition:

- card manipulation path from hand to table is visually unobstructed;
- ordinary trick play can be understood mostly from table/card feedback;
- rule-heavy decisions remain clear rather than being hidden for aesthetic purity.

## Level 6 — desktop and phone become first-class variants

Do not make mobile a compressed desktop.

Desktop priorities:

- wider hand fan;
- richer hover/mouse pickup feedback;
- more table travel distance;
- larger readable trick spatiality;
- pointer velocity can influence subtle tilt/settling.

Phone priorities:

- thumb/finger occlusion-aware held-card lift (card may offset slightly above the finger);
- stable one-finger gesture ownership;
- large effective hit areas despite overlap;
- adaptive card spread based on count;
- bottom-safe-area handling;
- no accidental page scrolling/text selection/navigation gestures;
- successful portrait composition first; landscape is optional evidence, not a current requirement.

Shared invariant:

- same conceptual interaction model and game state;
- platform composition/tuning may differ.

Exit condition:

- repeated guarded desktop and 390-class phone tests;
- real-phone Owner use does not expose a different interaction metaphor or major hit-test instability.

## Level 7 — micro-feel and feedback hooks

Only after Levels 1–6 are structurally credible.

Tune:

- pickup latency/slop;
- spring stiffness/damping;
- insertion hysteresis;
- tilt from pointer velocity;
- shadow/elevation;
- landing compression/bounce;
- return arc/settling;
- trick collection acceleration;
- card-to-card spacing response.

Prepare but do not overcommit to:

- subtle card movement sounds;
- table/card impact sounds;
- optional mobile haptic hooks where browser/device support is defensible;
- final card art/backs.

No audio/haptic effect may substitute for missing visual causality.

Exit condition:

- parameters live in a coherent tuning surface rather than scattered magic numbers;
- reduced-motion path remains functional;
- feel changes can be A/B tuned without touching game logic.

## Level 8 — evidence campaign and falsification

Before Owner preview, attack the system rather than admire it.

Mechanical scenarios:

- tap vs tiny drag vs deliberate drag;
- very slow reorder;
- very fast reorder across the whole hand;
- reverse direction mid-drag;
- lift out and return without reordering;
- reorder then free throw then return;
- legal throw then cancel by moving away;
- legal throw commit;
- attempt same gesture with a non-legal card;
- pointer/touch cancel;
- browser losing focus mid-hold;
- authority revision while no gesture is active;
- authority revision immediately after a committed throw;
- next hand reset;
- 6–10 card counts;
- desktop/mouse and phone/touch.

Guard against:

- accidental game commands;
- duplicate commands;
- stale ghost cards;
- canonical/local order confusion;
- horizontal overflow;
- inaccessible overlapping card centers;
- text selection/callout;
- stuck pointer capture;
- broken reconnect after animation interruption.

Visual/rehearsal evidence:

- capture held-card, insertion-gap, free-return, attraction, landing, completed-trick and collection states;
- inspect exact screenshots/short recordings, not only DOM assertions;
- compare against PR #20 baseline so visual regressions are visible.

Exit condition:

- narrow tactile gates PASS;
- full Foundation PASS on the exact preview head;
- screenshot/recording review has no known material mechanical defect;
- subjective quality remains explicitly Owner-unproven.

## Level 9 — Owner checkpoint, then branch based on evidence

Publish a temporary preview only after the defended head passes Level 8.

Ask Owner to judge only the experience surface:

- is simply moving cards fun yet?
- does the hand yield naturally when a card crosses it?
- does throw/return feel coherent rather than canned?
- does the table's positive response make sense without reading instructions?
- is phone manipulation better or merely smaller?
- what does the Owner instinctively try that the system still refuses or misunderstands?

Do not ask Owner to validate Tysiąc rules or bot strategy.

Then choose one of three outcomes:

- **direction PASS:** consolidate architecture, merge bounded slice, continue deeper polish;
- **direction PARTIAL:** keep substrate, redesign weak interaction(s), repeat preview;
- **direction FAIL:** preserve evidence, revert/replace experience layer without disturbing core.

---

# Testing cadence — avoid paying full CI cost for every tactile tweak

The current full Foundation gate is intentionally strong but expensive. This run should use evidence tiers deliberately.

### Tier A — micro checks

For implementation-only iterations:

- TypeScript/build sanity;
- deterministic interaction-model tests;
- focused pointer-path unit/scenario tests.

### Tier B — tactile browser rehearsal

At the end of each bounded tactile slice:

- permissive/free gesture smoke;
- reorder/insertion smoke;
- legal attraction/commit smoke;
- phone hit testing/layout checks.

### Tier C — full Foundation

Run at structural milestones, not after every tuning constant:

- core + worker + all browser gates;
- full remote solo desktop/mobile;
- reconnect;
- production build/dry-run deploy.

### Tier D — public Owner preview

Only for meaningful qualitative checkpoints.

A green Tier C defends mechanics; it does not replace Tier D judgement.

---

# Branch / merge strategy

- Keep `main` at the last defended non-tactile baseline until Owner accepts a tactile direction.
- Keep PR #20 as a recoverable proof-of-direction and comparison point.
- Create a child long-run branch from the defended PR #20 head for the deeper interaction-system rebuild.
- Do not accumulate the entire multi-level campaign as one giant unreviewable merge.
- At stable structural milestones, either:
  - consolidate into a clean bounded PR based on the accepted substrate; or
  - keep experimental work isolated if Owner evidence is still mixed.
- Never merge subjective direction merely because Foundation is green.

---

# Explicit non-goals for this run

- final card-face artwork;
- final table art/theme;
- advanced particle effects;
- broad rules redesign;
- bot-strategy overhaul;
- accounts/ranking;
- a generic rigid-body/physics engine;
- replacing all symbolic game decisions with gestures;
- claiming professional visual quality before Owner evidence supports it.

---

# Immediate execution sequence

1. Freeze and label PR #20 as tactile proof baseline.
2. Create long-run child branch.
3. Extract interaction state/model from `TactileHand` while preserving current commands and projection boundary.
4. Reproduce current behavior on the new substrate before adding new feel.
5. Implement continuous insertion-gap / neighbor-yield behavior.
6. Replace special 10-card grid with adaptive tactile hand once hit-test evidence permits it.
7. Rebuild free-return on the same motion substrate.
8. Rebuild legal-table attraction as continuous positive response.
9. Connect accepted throw to continuous table landing.
10. Add opponent arrival + trick collection continuity.
11. Reduce UI obstruction around ordinary trick play.
12. Tune desktop/mobile separately.
13. Run adversarial tactile evidence campaign.
14. Full Foundation on exact candidate head.
15. Temporary Owner preview and qualitative branch decision.

This sequence may be revised when evidence falsifies an assumption. Scope is a tool, not the objective: the objective is a genuinely playful, permissive, understandable card interaction foundation that can support later professional presentation work.