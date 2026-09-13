# Donor Concept Registry

## Purpose

Track candidate reusable interaction concepts without promoting them prematurely into universal project doctrine.

Status vocabulary:

- **SEED** — interesting formulation, little direct evidence;
- **SUPPORTED-IN-TYSIAC** — multiple Tysiac observations/experiments support it;
- **STRESS-TESTED-IN-TYSIAC** — survived repetition/failure/platform testing;
- **CROSS-PROJECT-CANDIDATE** — meaningfully re-expressed in another project;
- **DONOR** — demonstrated value in materially different contexts;
- **REJECTED / NARROWED** — evidence showed the claim was wrong or too broad.

No concept below is currently a DONOR.

---

## C01 — Reversible manipulation envelope

**Status:** SEED

### Claim

Users should often be able to acquire, inspect, move, reorganize or probe an object immediately inside a reversible interaction envelope before crossing a commitment boundary.

### Current support

- Owner repeatedly manipulated/reordered cards in the first embodiment lab even without gameplay consequence.
- Existing project philosophy strongly favors exploratory builder/world interaction.

### Risks

- envelope may create ambiguous commit;
- not appropriate for dangerous/expensive operations;
- reversible state may become visually indistinguishable from canonical state.

### Promotion test

Demonstrate a clear card interaction where exploration is rich and fast, accidental commit remains low, and latency/rejection remains truthful.

### Transfer targets

JV component manipulation, Multi World object handling, terrain/world editing.

---

## C02 — Progressive commitment

**Status:** SEED

### Claim

Commit should emerge progressively from action context rather than from hidden modes or premature inference.

Potential signals include direction, displacement, target relation, dwell, velocity and explicit final action where needed.

### Current support

The same card gesture must support reorder, inspect, play and cancel.

### Risks

- fuzzy thresholds;
- accidental commitment;
- behavior may be hard to learn if cues are weak.

### Promotion test

Users can move between reorder and play intent without mode switches and can predict commitment before it occurs.

---

## C03 — Constraint-as-behavior

**Status:** SEED

### Claim

Routine constraints should, where useful, be expressed through object/environment behavior before being explained by detached text.

### Current support

Owner explicitly wants a novice to learn how to act through visual language and feedback rather than banners/arrows.

### Risks

- arbitrary rules may have no natural physical mapping;
- mysterious resistance can be worse than explicit explanation;
- over-physicalization can misrepresent rules.

### Promotion test

A novice can discover a routine legality constraint through safe probing, with local prose required only as clarification.

---

## C04 — User-owned cognitive workspace

**Status:** SEED with strong theoretical support

### Claim

Spatial organization created by the user can become part of cognition and should not be casually destroyed by canonical refresh or automatic sorting.

### Current support

- Owner strongly values hand reordering.
- Distributed cognition, epistemic action and intelligent-use-of-space research provide external theoretical support.

### Risks

- stale/cluttered layouts;
- cross-device incompatibility;
- system needs sensible reset/sort mechanisms;
- not every ordering is meaningful.

### Promotion test

Observe stable personal organization practices emerging over repeated play and demonstrate that preserving them improves control/comprehension without harming onboarding.

### Transfer targets

JV builder staging, research/debug canvases, component palettes, world editing.

---

## C05 — Locally immediate, globally honest

**Status:** SEED / architecture-supported

### Claim

Local contact/manipulation can be immediate even when authoritative consequence is remote, delayed or asynchronous.

### Current support

Existing Tysiac architecture already separates canonical reducer/SeatProjection/GameEvent from client presentation. This creates a clean seam for testing the concept.

### Risks

- provisional state may look accepted;
- rollback can feel like history rewrite;
- optimistic interaction can leak hidden authority assumptions.

### Promotion test

Latency and rejection remain responsive without showing false accepted outcomes.

### Transfer targets

Multiplayer projects, cloud-backed tools, AI operations.

---

## C06 — Before/event/after causal choreography

**Status:** SEED / architecture-supported

### Claim

Presentation should bridge stable before-state and stable after-state using event-aware transient representation so persistent objects do not visually teleport through canonical updates.

### Current support

Current React rendering of an `after` SeatProjection alone cannot preserve a card's visual path from hand to trick.

### Risks

- transition layer becomes second state authority;
- queues become stale;
- reconnect becomes complicated;
- excessive animation slows gameplay.

### Promotion test

One production interaction preserves identity and causality while reconnect/rejection cleanly cancel transient presentation.

---

## C07 — Semantic / motor / causal directness

**Status:** SEED with strong theoretical support

### Claim

"Directness" must be treated as at least three distinct properties:

- motor directness — body motion maps directly to controlled representation;
- semantic directness — action directly expresses the intended operation;
- causal directness — outcome visibly follows from the operation.

### Why useful

This prevents naive doctrine such as "dragging is always more direct than a tool".

### Promotion test

Use the distinction to resolve a real design conflict in Tysiac and at least one other project.

---

## C08 — Interaction fidelity

**Status:** SEED framework

### Claim

Truthfulness can be diagnosed through distinct fidelities: contact, control, intent, constraint, authority, state, causality, temporal order, identity, ownership, uncertainty, workspace, attention, sensory channels, recovery and privacy.

### Risk

Becoming a bureaucratic checklist.

### Promotion test

Use only selected axes to diagnose an interaction more accurately than generic `UX feels wrong`, and show that the diagnosis predicts a useful fix.

---

## C09 — Failure dignity

**Status:** SEED

### Claim

Cancel, reject, correction, reconnect and interruption should remain first-class members of the same interaction language, not generic error aftermath.

### Distinctions

- cancel = successful reversible exploration ending;
- reject = attempted commit not accepted;
- correction = prior local prediction/inference replaced by authority;
- reconnect = causal history may be incomplete, current authority dominates.

### Promotion test

Users can explain what remains true after each failure mode without being shown a developer-style error state.

---

## C10 — Quiet-life feedback

**Status:** SEED with external theoretical support

### Claim

An interface can feel alive through readiness, persistent state and responsive relationships without constant ambient animation.

### Support

Calm/peripheral interaction research suggests information can remain available in the periphery and move to focal attention when needed.

### Risks

- too quiet becomes dead;
- too subtle becomes invisible;
- game contexts legitimately need excitement.

### Promotion test

A quiet game state feels inhabited and readable, while major events retain significant attention headroom.

---

## C11 — Persistent causal trace

**Status:** SEED

### Claim

Meaningful actions should often leave a stable trace in the post-event state, reducing dependence on transient alerts and memory.

Examples:

- ownership territory changes;
- current leader is spatially apparent;
- user organization persists;
- contract/trump state affects stable composition.

### Risks

- visual accumulation/clutter;
- state may become too historical rather than current.

### Promotion test

Users can recover after brief interruption without replaying transient feedback.

---

## C12 — Dynamic reality tradeoff

**Status:** SEED with strong theoretical support

### Claim

Use real-world physical/body/environment knowledge as a starting prior, then deliberately violate it when expressive power, efficiency, ergonomics, accessibility or digital capability justifies the tradeoff.

### Why useful

Protects `Interaction Physics` from becoming literal simulation doctrine.

### Promotion test

At least one successful Tysiac interaction should be demonstrably better because it violates physical-card reality while retaining intuitive control.

---

## C13 — Inherent-first, augmented-when-needed

**Status:** SEED with strong theoretical support

### Claim

Prefer feedback/feedforward inherent to the manipulated object/action where it can safely convey meaning; add explicit augmented information for abstract or otherwise ambiguous facts.

### Risk

Romanticizing implicit interaction and hiding rules.

### Promotion test

A repeated routine action is understandable primarily through object behavior, while exceptional/abstract details remain explicitly explainable.

---

## C14 — Skill headroom

**Status:** SEED

### Claim

A mature interaction should not only be discoverable; it should leave room for users to become faster, more confident and more expressive through practice.

### Risk

Expert affordances can undermine beginner clarity or accessibility.

### Promotion test

Repeated interaction produces measurable behavioral fluency without requiring increasingly arbitrary shortcuts.

---

## C15 — Semantic parity, platform-specific embodiment

**Status:** SEED

### Claim

Desktop and mobile should share gameplay semantics and truth constraints but may use different gestures, geometry, timing and sensory channels.

### Promotion test

The same underlying card action feels native on both platforms without one being a scaled imitation of the other.

---

## Registry discipline

For each future Owner test:

1. state which concepts are actually under test;
2. record observations before interpretation;
3. update status only when evidence changes;
4. explicitly narrow or reject concepts when evidence contradicts them;
5. do not add a new concept merely to rename an existing idea.

The registry should remain small enough to be useful.
