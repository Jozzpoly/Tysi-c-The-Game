# Constraint Semantics and Recovery

Status: cross-cutting research model. No production constraint visuals are selected here.

## Why this exists

`Constraint` has been used too broadly in Experience Foundation.

Different causes of non-action can look superficially similar while meaning very different things.

If the interface gives them the same sensory behavior, it destroys causal truth.

Example failure:

- game rule forbids a play;
- network authority is pending;
- finger hit the wrong card;
- a drag reached the edge of the device;
- a dangerous tool operation needs confirmation.

If every case feels like `sticky resistance`, the user cannot learn the system.

## Constraint classes

### C0 — body/input constraint

Source:

Human/device geometry or input capability.

Examples:

- thumb cannot comfortably reach a distant target;
- finger occludes a small relation;
- pointer leaves viewport;
- drag precision is limited by device/input.

Design response:

Improve embodiment, geometry or alternate input.

Do not explain this as a game rule.

### C1 — interaction-mechanism constraint

Source:

The current manipulation model.

Examples:

- card can rotate only within a bounded range while held;
- insertion field has a finite region;
- a reversible drag has a cancellation boundary.

Design response:

Make mechanism behavior consistent and predictable.

This is the closest class to a material/physical constraint.

### C2 — presentation/workspace constraint

Source:

Local UI organization rather than domain legality.

Examples:

- a card cannot occupy two local presentation slots simultaneously;
- a narrow mobile hand compresses spacing;
- a local grouping region has finite room.

Design response:

Expose spatial relation and alternative placement.

Do not pretend presentation geometry is canonical game law.

### C3 — domain legality constraint

Source:

Rules of Tysiac or another domain.

Examples:

- must follow suit;
- must beat when possible;
- contract cannot be lower than auction win;
- exchange requires one card to each opponent.

Design response:

Behavior may communicate the boundary, but the system must remain honest that this is a **rule**, not literal material resistance.

Use local explanation when conventional semantics are not inferable.

### C4 — authority/state constraint

Source:

Canonical state or remote authority.

Examples:

- command submitted and acceptance is pending;
- another actor currently owns initiative;
- command was rejected because authoritative state changed.

Design response:

Represent pending/initiative/rejection truthfully.

Do not make authority latency look like object mass or domain illegality.

### C5 — information/privacy constraint

Source:

Viewer is not entitled to know something.

Examples:

- opponent card identities;
- private four-nines option;
- exchange recipient card hidden from other seats.

Design response:

Preserve privacy across text, motion, timing, sound and geometry.

Do not communicate `hidden` as `unavailable because illegal`.

### C6 — safety/stability constraint

Source:

An action could materially threaten program/data safety or create an irreversible/destructive state beyond ordinary game play.

Tysiac has few examples; donor projects have many.

Design response may legitimately include:

- stronger confirmation;
- hard block;
- explicit warning;
- transactional preview.

This class justifies firmer paternalism than ordinary creative/game experimentation.

### C7 — strategic consequence, not a constraint

A legal but bad decision is **not** a UI constraint.

The system should normally allow it.

Do not use legality-style feedback to steer strategic choice unless an explicit coaching/assist feature is active.

## Constraint response vocabulary

The response should match the cause.

### Yield / physical resistance

Best suited to interaction/material boundaries where a material metaphor is honest.

Risky for arbitrary game rules.

### Non-receptive relationship

A source can still be manipulated, but a particular commit relation does not form.

Strong candidate for domain legality.

### Alternate-path salience

Nearby legal/available relationships become clearer after an invalid probe.

Useful for self-teaching if it does not become an answer sheet.

### Explicit local reason

Short prose near the failed relation.

Appropriate for conventional rules and exceptional cases.

### Pending hold

Object/action remains in a provisional semantic state while authority is pending.

Must be visually distinct from rule failure and material resistance.

### Rejection recovery

Attempted commit did not become canonical.

The system restores a stable truthful state while preserving unrelated workspace organization.

### Confirmation boundary

Appropriate for rare/destructive/high-cost operations, not routine movement.

## Gradient versus boundary

A major semantic risk is turning a discrete rule into a continuous physical force.

Example:

`this card is illegal to play`

is usually a **boundary**.

A gradually increasing spring resistance may imply:

`the farther you drag it, the less legal it becomes`.

That is false.

Possible better model:

- card remains physically owned and manipulable;
- play relation begins to form;
- the illegal destination fails to become receptive;
- legal relation(s) become clearer;
- if uncertainty persists, local rule explanation appears.

Material response can still acknowledge the failed relation without pretending legality is a continuous physical property.

## Constraint provenance

A mature experience layer should conceptually know **why** a relation is unavailable.

Not necessarily via one universal enum in production, but enough semantic provenance should exist to avoid one generic disabled treatment.

Potential presentation categories:

- `interaction-boundary`;
- `domain-illegal`;
- `authority-pending`;
- `other-actor-initiative`;
- `private/unknown`;
- `safety-confirmation`.

Do not expose internal taxonomy to players unless useful. It is for designing coherent responses.

## Disabled-state critique

A disabled button/card often collapses several meanings:

- unavailable now;
- not owned;
- not legal;
- not configured;
- waiting;
- forbidden forever.

For direct-manipulation objects this is especially damaging.

A card that cannot legally be committed should not necessarily become a grey dead rectangle.

The player still owns it, can inspect it and may need it to understand *why* another card is legal.

## Capability layering

A new synthesis finding from the current production `GameTable` is that **operation-specific illegality must not erase unrelated object capabilities**.

Current foundation UI models cards primarily as buttons. During trick play, a card that is not in the legal `play` command set is effectively disabled. That was a reasonable foundation implementation because click-to-play was the only important card operation.

It is not a sufficient model for a living hand.

A card can simultaneously be:

- **owned** by the player;
- **inspectable**;
- **reorderable** inside private workspace;
- **groupable** or spatially organizable;
- **movable within a reversible manipulation envelope**;
- but **not currently commit-eligible for `play`**.

Therefore the experience layer should reason in terms of capabilities/relations rather than one binary `enabled/disabled` property.

Conceptual example:

`card capability set = { inspect, reorder, group, probe-play-relation }`

while:

`commit relation: play(card -> trick) = domain-illegal`

The object stays alive. The forbidden relation does not become receptive.

This distinction is especially important for self-teaching: the user can test the world without losing access to the object merely because one semantic action is unavailable.

### Donor implication

The same distinction applies outside cards:

- a JV component may be movable/inspectable even when a particular topology connection is invalid;
- a JES object may remain manipulable even when one tool operation is unavailable;
- a Multi World object may be held/rotated while a placement/ownership action is rejected;
- an NPC debug entity may remain inspectable while one command is unavailable due to authority or state.

### Failure mode

Capability layering must not become an excuse to let users accidentally commit forbidden actions.

The point is **preserve unrelated agency**, not blur the commit boundary.

## Error elimination versus error recovery

Research on ecological interface design and minimalist instruction supports a useful correction:

> Reliable interaction should not be defined as eliminating every human error.

People adapt, explore and sometimes need failed attempts to understand the system.

Design goals include:

- prevent catastrophic states where justified;
- make important boundaries visible;
- make ordinary exploratory errors cheap;
- support diagnosis;
- support recovery;
- preserve stable context so the user can learn from the attempt.

## Recovery invariants

After failure/rejection/cancel, preserve as much unrelated truth as possible.

### Identity

The same object remains recognizable.

### Workspace

Unrelated user organization remains intact.

### Cause

The user can still understand what attempt failed.

### Authority

Current canonical state wins.

### Initiative

Who/what can act next is clear.

### Privacy

Recovery does not reveal hidden information.

## Cross-project relevance

### Tysiac

Differentiate illegal play, cancel, server reject, opponent turn and private option.

### Jozz Vehicle

Differentiate geometric constraint, snap rule, invalid topology, simulation authority and actual program-safety boundary.

### JES

Differentiate material/world resistance, tool-range constraint, unavailable operation and safety/stability constraint.

### Multi World

Differentiate collision, ownership, network authority, item rule and local manipulation limit.

### Live NPC

Differentiate `agent cannot perceive`, `agent chose not to act`, `world rejected action`, and `action still pending` in debug/causal presentation.

## Research hypotheses

### C-H1 — provenance-specific feedback

Users recover/learn faster when different constraint causes use distinct but related feedback rather than one generic disabled/reject state.

### C-H2 — domain boundary without dead ownership

A player can understand illegal play while the card remains fully inspectable/manipulable inside the hand.

### C-H3 — local explanation after probe

A local reason shown after an invalid commit probe produces stronger rule understanding than a permanent disabled state with no causal explanation.

### C-H4 — preserved workspace after rejection

Recovery that preserves unrelated hand topology reduces disorientation versus global hand rebuild.

### C-H5 — capability layering

Preserving unrelated object capabilities while blocking only the invalid semantic relation improves agency and learnability without increasing accidental commits, compared with globally disabling the object.

## Failure conditions

Narrow this taxonomy if:

- users cannot perceive meaningful differences among feedback classes;
- the taxonomy causes gratuitous visual variation;
- provenance is expensive to maintain and does not improve diagnosis/recovery;
- explicit text consistently outperforms behavior for a particular rule;
- separate treatments make the product feel inconsistent rather than causally clear;
- capability layering creates ambiguous commit boundaries or increases unintended actions.

The purpose is not one visual effect per class.

The purpose is to avoid **semantically different causes becoming perceptually indistinguishable**.

## Current conclusion

Constraint truth is part of interaction truth.

The interface should communicate not only `no`, but where useful **what kind of no this is** — body, mechanism, rule, authority, privacy or safety — without forcing the user to read developer diagnostics.

Objects should also retain unrelated valid capabilities when one specific relation is unavailable.

This is a strong candidate donor concept, but remains SEED until real experiments show value.

## Research references informing this document

- Don Norman, physical/logical/cultural constraints and visible conceptual models.
- Rasmussen and Ecological Interface Design, behavior-shaping constraints/boundaries and support for error recovery.
- Djajadiningrat/Wensveen/Overbeeke, action-function coupling through feedforward and feedback.
- Carroll minimalist/exploratory learning work, errors and recovery as learning opportunities.
