# Living Slice Scene Contract

Status: INTERNAL architecture contract for the First Living Slice. Not production choreography and not Owner-ready.

## Purpose

The First Living Slice needs a presentation language that can preserve:

- action source;
- object identity;
- ownership;
- authority;
- causal consequence;
- initiative;
- mobile/desktop semantic parity;

without hard-coding one pixel layout or creating a second game-state authority.

This document defines the smallest semantic scene vocabulary needed for that work.

## Opponent presence thesis

Opponent presence should first emerge from **legible agency in the shared world**, not avatar theatre.

For an ordinary trick, the minimal useful social loop is:

`seat/source -> action -> changed shared situation -> constrained response -> resolution -> ownership -> new initiative`

A player should be able to feel that another actor exists because that actor:

- has a stable source in the scene;
- contributes an identifiable action;
- changes what can happen next;
- can gain/lose ownership of the trick consequence;
- participates in reciprocal turn structure.

Do not begin with faces, emotes, idle personality animation or fake human-like hesitation.

## Why this direction is plausible but not proven

Social-presence research broadly suggests that representation alone is insufficient and that behavioral contingency, mutual awareness and interdependence matter substantially.

This is used only as supporting theory.

Tysiac-specific questions remain empirical:

- how little source representation is enough;
- whether card origin/collection/initiative alone create useful presence;
- whether stronger actor representation later improves or distracts from strategic play.

## Semantic anchor registry

Anchors name **meaningful places/owners**, not visual components.

### `seat:{seat}`

Meaning:

Public spatial source/identity region for a player.

Carries:

- actor identity/name where appropriate;
- public card count / role context where appropriate;
- source/destination for public actions and ownership transfer;
- local initiative salience.

Must not expose private hand geometry or hidden card identity.

### `hand:self`

Meaning:

Viewer-local private workspace containing owned visible cards.

Carries:

- local topology;
- reorder/inspect/manipulation relations;
- source for local card play.

This anchor is viewer-private presentation state.

### `hand-card:{card}`

Meaning:

A specific viewer-visible owned card inside `hand:self`.

Exists only when the viewer is entitled to know the card identity.

May provide geometry for acquisition/transition overlays.

### `trick:shared`

Meaning:

Shared unresolved trick relation.

Not simply `center of screen`.

Carries:

- currently played public cards;
- order/source relationship;
- unresolved/closed state;
- closure/resolution staging.

### `trick-card:{seat}`

Meaning:

The public trick position belonging to the card played by a given seat.

This preserves action-source attribution without requiring fixed triangle geometry across platforms.

### `captured:{seat}`

Meaning:

Ownership region for cards/tricks captured by a seat.

It may be abstract or partially visible in final art direction.

It exists semantically so collection has a destination tied to winner ownership rather than disappearing into nowhere.

### `captured-value:{seat}`

Meaning:

The seat's current raw/publicly representable value accumulated during the **current hand** from captured card points and, where separately represented, other hand-local value sources.

For an ordinary trick, `trick.points` belongs causally here — not directly to the persistent match score.

The final product may combine or separate captured-card value and marriage value depending on what proves clearest, but the presentation must preserve the distinction between **hand-local value accumulation** and **match-score resolution**.

### `score:{seat}`

Meaning:

Persistent **match score** for a seat.

This anchor changes causally when canonical hand scoring changes `scores`, not every time a trick produces raw points.

At hand end, the eventual causal sentence may be:

`captured value + marriage value + contract result -> hand score delta -> match score`

Do not teach the false model `trick points -> match score` through animation.

### `initiative:{seat}`

Meaning:

The current locus from which the next meaningful action can begin.

This may map visually onto an existing seat/hand region rather than a separate component.

Do not implement it as a mandatory `YOUR TURN` badge merely because the semantic anchor exists.

## Derived geometry, not semantic anchors

Do not create anchors for:

- particle emitters;
- glow regions;
- tooltip positions;
- generic toast areas;
- easing paths;
- animation layers;
- fixed mobile/desktop coordinates.

Those are presentation choices derived from semantic anchors.

## Anchor registration principle

Presentation components may register current geometry for semantic anchors.

Example concept:

`semantic anchor -> current DOM/layout geometry`

The transition planner consumes the semantic relationship.

The platform/layout supplies the actual coordinates.

This allows:

- mobile and desktop to use different compositions;
- viewport change to alter geometry without changing scene meaning;
- reduced-motion mode to preserve source/destination semantics with shorter motion;
- future art direction to move components without rewriting causal choreography.

## First Living Slice transition plan

Conceptual input:

`presented before + viewer-safe events + authoritative after + anchor geometry`

Conceptual scene plan for local third-card closure:

1. **local source** — `hand-card:{card}` remains the identity source while manipulation is reversible;
2. **commit relation** — card commits toward `trick-card:{localSeat}` inside `trick:shared`;
3. **authority acceptance** — canonical `card-played` confirms public arrival;
4. **closure** — `trick-completed` closes `trick:shared` using canonical winner/points;
5. **ownership transfer** — the three public trick cards transition toward `captured:{winner}`;
6. **hand-local value consequence** — `trick.points` becomes associated with `captured-value:{winner}`;
7. **initiative transfer** — `initiative:{winner}` becomes the next active locus;
8. **settle** — transient overlays disappear and stable presentation converges to authoritative after-state.

The persistent `score:{winner}` does **not** change merely because this ordinary trick completed.

Several steps may overlap. The sequence expresses causality, not a mandatory duration ladder.

## Opponent action-source rules

### Stable source

Each opponent needs a stable public seat/source region even if the final representation is visually minimal.

The source should be recognizable over repeated turns.

### Action origin

A public opponent card should appear to originate from its seat/source relationship rather than materializing anonymously in the shared trick.

This does **not** mean animating the real hidden card from a visible opponent hand.

Use only viewer-safe public representation.

### Reciprocal consequence

Opponent action matters because it changes:

- trick composition;
- the local player's legal possibilities;
- eventual ownership;
- next initiative.

This behavioral consequence is more important than decorative actor animation.

### Winner collection

When an opponent wins, collection should move toward that opponent's ownership region just as local wins move toward the local ownership region.

Do not use incompatible causal laws for bots, remote humans and local humans.

### Initiative

Winning/turn ownership should become perceptible at the actor locus after resolution.

Routine initiative transfer should not require a detached central banner once the scene language is learned.

## Timing rules for actor presence

Do not create personality from fabricated waiting time.

### No fake think delay by default

Bot action timing should reflect real computation/presentation needs, not arbitrary `human-like` pauses added solely to make the bot feel alive.

If future product research deliberately tests pacing/personality, it must be a separate hypothesis.

### Network latency is not personality

Remote-human jitter/delay must not be presented as hesitation, confidence or emotional intent.

### Same causal grammar

Human and bot public actions share source -> shared scene -> consequence semantics.

Real transport/computation timing may differ; ownership law should not.

## Privacy / hidden-information invariants

Opponent presence must never leak private state through:

- origin geometry tied to hidden card position/order;
- animation path based on private card category before public reveal;
- different delays based on hidden decision/search complexity;
- sound variants derived from private information;
- hand deformation visible to other viewers;
- actor cues revealing private options such as four nines.

Only viewer-safe/public information can influence public choreography.

## Persistent presence without avatar theatre

After an action finishes, the actor may remain perceptually present through persistent game truth:

- public card count;
- captured-card ownership/value;
- match score;
- contract/declarer role;
- current initiative;
- other public persistent state.

This is stronger than keeping an avatar constantly animated.

## Mobile constraints

Opponent source regions must remain usable on narrow screens without consuming the vertical space needed for the private hand and shared trick.

Possible embodiment may be compact and peripheral.

The semantic requirements are source identity and ownership direction, not large portraits.

## Desktop constraints

Wider space may allow stronger spatial separation among actor regions and richer persistent public context.

Do not use extra width as permission for dashboard proliferation.

## Reduced-motion contract

Reduced motion may replace long travel with:

- shorter source-linked displacement;
- staged opacity/depth change;
- source/destination emphasis in causal order;
- stable persistent ownership update.

It must not collapse source attribution into instantaneous anonymous replacement.

## Adversarial risks

### Source over-animation

If every ordinary opponent card performs a long entrance, repeated play becomes theatrical and slow.

### Seat-anchor overgrowth

If actor regions accumulate portraits, badges, timers, score boxes and status labels, the game becomes a dashboard.

### Fake sociality

Breathing avatars, random delays or emotes can create surface `life` while actual actions remain anonymous and disconnected.

### Local-player bias

If only the local hand follows rich object/ownership laws while opponent actions teleport, the shared world uses inconsistent physics.

### Privacy leakage

More expressive opponent presentation creates more channels through which hidden information can leak.

### Network-personality confusion

Variable connection delay must not accidentally communicate fake psychology.

### Score-causality collapse

If ordinary trick points animate directly into persistent match score, the interface teaches the wrong scoring model even if all numbers are individually correct later.

## Internal research questions

### AP1 — minimum source attribution

What minimum visual/spatial treatment makes an opponent play read as `that actor did this`?

### AP2 — behavioral presence

Does clear action -> changed options -> reciprocal response create sufficient opponent presence before adding avatar representation?

### AP3 — ownership direction

Does trick collection toward winner meaningfully strengthen actor presence and causal comprehension?

### AP4 — initiative transfer

Can next actor readiness emerge from seat/hand state rather than a central turn banner?

### AP5 — repeated rhythm

Can source/action/collection remain readable after many tricks without becoming visual noise?

### AP6 — bot/human parity

Can the same grammar make bots and humans legible actors without fake-human timing?

### AP7 — value-layer comprehension

Can the scene communicate `trick points -> hand-local captured value` without implying an immediate match-score change?

## Failure conditions

Narrow this model if:

- source anchors consume too much composition for too little comprehension;
- players still cannot attribute actions without explicit text labels;
- collection direction adds movement but not understanding;
- opponent presence requires richer identity cues than the slice can support;
- scene grammar becomes slow under repetition;
- privacy-safe source representation feels too abstract or mechanical;
- mobile constraints make stable actor geography impractical;
- hand-local value and match-score layers remain perceptually confusable.

## Current conclusion

For the First Living Slice, opponent presence should be tested first as **causal/spatial agency**:

`stable source -> public action -> reciprocal consequence -> ownership -> initiative`

Avatar personality is intentionally deferred.

The semantic anchor registry is deliberately small. Add another anchor only when a concrete scene cannot preserve truth/causality without it.

The score/value correction is now explicit: ordinary trick points accumulate as hand-local captured value; persistent match score belongs to hand-resolution causality.
