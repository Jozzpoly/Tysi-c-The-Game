# Visual Information Architecture

Status: INTERNAL composition contract. Not final art direction and not a production layout specification.

## Purpose

The current foundation UI is structurally panel-shaped: topbar, equal scoreboard boxes, central table/status strip, decision panel and hand row.

That is useful for technical clarity but does not express the intended living experience.

This document defines how information should compete for visual attention before a final style/theme is selected.

## Core thesis

**Visual hierarchy should follow current causal relevance, not component permanence.**

The most important thing on screen changes over time:

- while deciding, the private instrument and possible relations matter most;
- during commit, attention follows the acted-on object;
- during consequence, the shared scene/result matters most;
- after settle, persistent state returns to quieter hierarchy.

Do not give every persistent datum a permanently strong panel merely because it exists.

## Three primary spatial layers

### 1. Private instrument layer

Primary object:

`hand:self`

Purpose:

- owned cards;
- personal topology;
- inspect/reorder/manipulate;
- source of local card actions;
- local legality/feedforward.

At rest:

Important but peripheral.

During local decision/manipulation:

May become the strongest visual region.

### 2. Shared action layer

Primary object:

`trick:shared` and later other shared scene relations.

Purpose:

- public action convergence;
- source attribution;
- unresolved shared state;
- resolution/ownership transfer;
- causal bridge between actors.

At rest:

Quiet and spacious enough to accept action.

During consequence:

Becomes primary focus.

### 3. Persistent public context layer

Includes:

- seat/source identity;
- score/value;
- contract/trump/role where relevant;
- card count;
- captured public consequence;
- initiative.

Purpose:

Maintain strategic orientation without competing with every action.

This layer should usually remain peripheral until a change makes part of it causally relevant.

## Hierarchy is relational

Avoid designing all information as independent blocks.

Examples:

- score belongs to a seat/owner, not an anonymous top scoreboard;
- initiative belongs to an actor locus, not necessarily a banner;
- captured value belongs to the winner region;
- trump belongs to the state of the shared game, not merely a text chip;
- legality belongs to the card/relation being considered, not a global instruction panel.

## Attention choreography

Working cycle:

`quiet orientation -> local possibility -> object focus -> causal transfer -> shared consequence -> persistent update -> next possibility -> quiet`

Visual hierarchy should support this cycle with composition, depth, local contrast and motion rather than global flashing.

## Do not equate stable with visually loud

Persistent information may remain available while visually quiet.

A stable element can be:

- smaller;
- lower contrast;
- spatially peripheral;
- revealed more strongly on relevant change/hover/focus;
- grouped with its semantic owner instead of living in a separate panel.

## Seat/source geography

Each actor should have a stable enough public geography that action source and consequence can be attributed.

This does not require a portrait panel.

A minimal seat locus may contain only:

- identity/name;
- public card count;
- compact score/state;
- current initiative emphasis when relevant.

When the actor acts, the locus becomes causally important and may temporarily gain visual weight.

## Score architecture

Current equal-width score boxes are foundation UI, not a product requirement.

Target properties:

- score remains attributable to a player;
- change reads as before -> delta -> after when meaningful;
- the cause of a change is perceptually connected to the score owner;
- routine stable scores do not dominate action space;
- important thresholds/locks may gain semantic emphasis only when relevant.

Do not animate every numeric change as a detached counting spectacle.

## Trump / contract / role

Current `status-strip` is a textual inventory of state.

Future composition should ask whether these facts can be spatially/visually embodied:

- declarer/contract may alter owner emphasis/risk state;
- trump may influence shared scene semantics/palette/material relation;
- current bid/contract may become stronger during the relevant phase and quieter during ordinary trick play.

Do not keep all phase metadata equally prominent across the whole match.

## Text placement

Text is valid where the information itself is symbolic or conventional.

Prefer:

- local explanation near the relation that needs explanation;
- persistent values near semantic owners;
- concise phase-specific explanation on demand;
- rules guide for arbitrary conventions.

Avoid:

- detached central prose as the glue between unrelated visuals;
- permanent instructional copy after the interaction has become understood;
- multiple simultaneous status sentences competing with the hand/scene.

## Card anatomy for INTERNAL Living Slice

The first integrated fixture needs cards good enough to test manipulation without pretending final art direction is solved.

Minimum quality target:

- unmistakable rank/suit identity under overlap;
- strong corner/index readability;
- enough depth/edge treatment to make pickup/layering legible;
- clean suit/rank hierarchy;
- good contrast in both resting and manipulated states;
- no final illustration/theme required;
- no generic browser-button appearance.

Avoid using low opacity as the primary legality language because it makes owned cards look dead.

### Face cards

For internal research, typographic K/Q/J identity is sufficient if instantly readable.

Do not spend early research cycles on final face-card illustration.

### Card backs

Opponent backs need enough identity to read as hidden cards owned by a source seat.

They must not imply the exact private ordering/geometry of an opponent hand.

## Color semantics

Do not overload one accent color with unrelated meanings.

Potential semantic dimensions include:

- suit identity;
- actor ownership;
- current initiative;
- legal/receptive relation;
- authority pending/rejection;
- score consequence;
- rare event significance.

These should not all become `green = good / red = bad`.

Color should reinforce structure already visible through position/form/state.

## Depth semantics

Depth can communicate relation without adding panels:

- resting hand layer;
- acquired/lifted card;
- pending/committed transfer;
- shared trick plane;
- collection/settle.

Avoid decorative 3D perspective that makes card identity or hit testing harder.

## Mobile composition constraints

Long-term product is not a compressed desktop.

Working spatial priorities:

- private hand receives strong lower-screen ergonomic priority;
- shared action region stays visible above/around the hand without requiring long thumb travel for every semantic operation;
- opponent/source loci remain compact and stable toward upper/peripheral regions;
- persistent public context should attach to actors/state rather than consume a permanent dashboard header;
- active hand manipulation may temporarily expand upward or separate cards to solve occlusion;
- finger occlusion must be treated as real geometry even though screen recordings cannot show it.

Do not fix exact percentages before a real rendered/body test.

## Desktop composition constraints

Desktop is not enlarged mobile.

Working opportunities:

- wider stable private workspace;
- stronger spatial separation among actors;
- larger shared scene with shorter perceptual crowding;
- peripheral persistent information without modal panels;
- hover/feedforward without correctness dependency;
- richer simultaneous inspection.

Risks:

- filling unused width with chrome;
- making the product look like a dashboard;
- excessive pointer travel;
- losing card focus because too much information becomes persistent.

## Responsive semantic invariants

Across mobile and desktop, preserve:

- local player hand as private instrument;
- stable actor source identity;
- shared action locus;
- ownership direction;
- score/value ownership;
- current initiative;
- source -> consequence causal path.

Geometry can change radically while those meanings remain.

## Persistent consequence

After an action, ask which changed truth deserves to remain visible.

Good persistent candidates:

- changed score/value;
- card count;
- contract/trump;
- captured public value where strategically relevant;
- current initiative;
- role/obligation.

Bad default:

keeping every historical animation/result as a permanent trace.

Persistence serves orientation and decision, not visual archaeology.

## Quiet-life design

A resting screen should not look dead simply because nothing is moving.

It can feel alive through:

- clear object ownership;
- poised spatial relations;
- subtle depth/material readiness;
- stable hierarchy;
- visible possibility;
- evidence of previous consequence in current state.

Do not solve quiet-life with looping idle motion.

## Debug-tool bias

Future internal fixtures need enough composition/card quality that `looks like a dev demo` does not dominate judgement.

But neutral research visuals must avoid smuggling in a complete style direction.

Research fixture target:

**product-grade clarity and interaction craft, intentionally incomplete identity.**

## Failure conditions

Narrow/revise this architecture if:

- dynamic hierarchy makes stable information hard to find;
- seat-linked state requires too much gaze travel;
- mobile actor geography steals space from the private hand;
- removing equal scoreboard/status panels decreases strategic orientation;
- card anatomy that improves tactility reduces glance readability;
- dynamic focus becomes visual noise under rapid play;
- persistent consequence accumulates clutter;
- desktop becomes empty or mobile becomes cramped because semantic invariants are too rigid.

## Internal questions for First Living Slice

### V1 — hand dominance

Can the private hand be visually rich/important during decision without stealing consequence focus after commit?

### V2 — source attribution

Can compact opponent loci establish origin/ownership without portraits or large panels?

### V3 — score causality

Can points remain readable while score UI becomes less globally dominant?

### V4 — legality

Can legal relation be visible without dimming/disabling the whole illegal card?

### V5 — stable orientation

After the trick settles, can a user quickly answer:

- who won?
- what changed?
- whose turn/initiative is next?
- where is my hand?

without reading a central textual recap?

## Current conclusion

The visual system should be organized around **private instrument, shared causal scene and quiet persistent public context**.

The final visual identity remains open.

Do not start full GameTable redesign from this document alone. It exists to constrain the first internal Living Slice and later integrated composition research.
