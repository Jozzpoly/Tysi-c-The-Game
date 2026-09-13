# Hand Field — Competing Hypothesis Matrix

Status: internal research design. No Owner-facing hand fixture is authorized by this document.

## Research question

When one card is reorganized inside the player's owned hand, what kind of neighbor response makes the hand feel like a coherent workspace **without sacrificing insertion precision, spatial memory or attention economy**?

The first Owner lab exposed a problem: reordering worked, but neighbors behaved too much like array slots changing index.

The alternative is not automatically `simulate rigid bodies`.

We need competing relational models.

## Shared assumptions

For the first internal hand-field research:

- card identity is stable;
- all non-held cards preserve their relative order;
- held-card low-level control law is treated as an independent variable and kept fixed during a neighbor-field comparison;
- canonical game state is not involved;
- reorder remains presentation-only;
- no sound/haptics;
- no legality/commit semantics;
- no target magnetism;
- hand geometry is normalized by card width and available workspace width;
- no candidate is allowed to infer strategic grouping automatically.

## H0 — Slot / index baseline

### Model

The hand is a discrete ordered list.

As the held card crosses an index threshold:

- target index changes;
- affected neighbor cards transition toward new slot positions;
- other cards remain on their slots.

This is conceptually close to the first lab.

### Strengths

- exact insertion outcome;
- low peripheral motion;
- easy keyboard/alternate-input parity;
- stable card spacing;
- predictable implementation.

### Failure prediction

- hand feels like UI sorting rather than a spatial workspace;
- insertion relation is discovered abruptly at threshold crossing;
- neighbors do not communicate pressure/space before the index changes;
- moving the card repeatedly feels corrective rather than exploratory.

### Why keep it

H0 is a necessary control. If richer fields do not improve behavior/feel enough to justify complexity, a polished slot model may be better.

---

## H1 — Local continuous deformation field

### Model

Held-card position continuously influences nearby neighbors.

A prospective insertion gap emerges before release.

Displacement falls with spatial/index distance from the local interaction zone.

Conceptual requirements:

- nearest neighbors yield most;
- farther cards increasingly preserve their landmarks;
- non-held order never inverts;
- the insertion gap is continuous and monotonic;
- total hand center/outer landmarks drift minimally;
- release settles rapidly into a stable topology.

### Potential formulation

For each neighbor `i`, start from stable anchor `x_i^0`.

A held-card prospective insertion coordinate `q` produces a signed displacement:

`delta_i = direction_i(q) * gap_strength_i(q) * falloff(distance_i(q))`

Candidate falloffs to compare internally:

- compact smoothstep with finite radius;
- Gaussian-like local field;
- index-distance exponential falloff.

The exact formula is not donor knowledge. Observable locality and stability are.

### Strengths

- hand can read as one relational object/system;
- future insertion becomes visible before release;
- materiality comes from relationships rather than large held-card lag;
- far landmarks can stay stable;
- likely compatible with user-owned topology.

### Failure prediction

- neighbors wiggle under tiny pointer noise;
- insertion gap feels rubbery/imprecise;
- user chases a moving target;
- local field adds motion but no comprehension;
- dense mobile hand has insufficient space for meaningful deformation;
- nearby card readability degrades.

---

## H2 — Global elastic fan

### Model

Movement of one card redistributes spacing/curvature across much of the hand.

The entire hand visibly compresses/expands as a connected structure.

### Purpose

This is an upper-bound comparison for collective embodiment, not the current favorite.

### Strengths

- strong sense of one connected body;
- dramatic spatial response;
- may make hand ownership/materiality obvious.

### Failure prediction

- destroys landmarks;
- excessive peripheral motion;
- every local reorder changes the whole visual field;
- poor spatial-memory support;
- fatigue under repeated organization;
- interaction becomes a fidget toy competing with gameplay.

H2 may teach us **how much collective response is too much** even if it never ships.

---

## H3 — Landmark-preserving segmented field

### Model

The hand contains weak, user-created or semantically stable regions.

Local deformation is strong within the active region but decays sharply across stable gaps/landmarks.

Important: the system does not invent strategic groups automatically in the first model.

Segments may arise only from:

- persistent user spacing;
- natural hand edges;
- explicit user action if later justified.

### Why investigate

Pure H1 assumes continuous locality is enough.

But if users use gaps/groups as memory structure, a field should respect those boundaries rather than smear them.

### Failure prediction

- regions become hidden modes/categories;
- gap semantics are ambiguous;
- too much structural persistence creates stale/cluttered hand layouts;
- novice does not understand why some cards yield differently.

H3 is later than H1 but important for donor-level cognitive workspace research.

---

# Mechanical observables

Internal metrics can reject pathological field behavior.

They cannot decide which hand feels alive.

## 1. Order preservation

Non-held neighbor order should never invert unintentionally.

`x_i < x_j` should remain true for stable ordered neighbors `i < j` unless the held card is being inserted between them.

## 2. Overlap violation

Measure unintended overlap beyond the designed resting fan overlap.

A dense hand may intentionally overlap, but the interaction should not create unreadable collisions outside the specified geometry.

## 3. Gap legibility

A prospective insertion relation should create a measurable local gap before release.

Too little = slot threshold remains hidden.

Too much = hand explodes around the pointer.

## 4. Far-landmark drift

Measure displacement of cards sufficiently far from the active region.

This is a direct mechanical proxy for `minimum necessary disturbance`.

## 5. Total disturbance

Normalize aggregate displacement of **unaffected** cards by card width.

This is not a quantity to minimize absolutely: H0 trivially wins if only local slots move.

Use it as a cost paired with gap/relationship benefit.

## 6. Locality ratio

Compare movement energy in nearest neighbors versus far neighbors.

H1 should strongly favor local response.

H2 intentionally distributes more globally.

## 7. Insertion monotonicity

As the held card moves smoothly left-to-right, prospective insertion index should evolve predictably and should not chatter near boundaries.

Hysteresis may be useful if it prevents threshold jitter, but must not create sticky hidden state.

## 8. Return stability

When the held card returns/cancels, unaffected landmarks should recover without oscillation or topology loss.

## 9. Hand-width sensitivity

Repeat normalized trajectories for representative:

- 7 cards;
- 8 cards;
- 10 cards;
- narrow mobile geometry;
- wider desktop geometry.

A field that only works in a spacious 8-card desktop fan is not a platform foundation.

## 10. New-card disturbance

Later subtest:

Insert one new card using several intake strategies and measure how much existing topology moves.

This is separate from reorder itself.

---

# Important confounds

## Held-card law

P1/P2/P3 card-body behavior can alter perceived hand-field response.

First compare fields with one restrained common held-card law.

Only later cross surviving object/field candidates.

## Visual depth

Shadow/lift can make a slot interaction feel more embodied without changing neighbor mechanics.

Hold it constant initially.

## Card art/readability

Different overlap and fan angles expose different rank/suit areas.

Mechanical candidate cannot be accepted if information becomes unreadable.

## Finger occlusion

Mobile field may appear worse because real finger hides the insertion zone.

Do not compensate with a different field before explicitly testing occlusion relief.

## Auto-sorting

No field comparison may silently reorder by suit/value.

That would test machine organization, not workspace mechanics.

---

# Internal synthetic trajectories

Candidate trajectories for a future hand-field bench:

### HF1 — one-slot move

Pick card 4 and move it smoothly between cards 5/6, then release.

### HF2 — multi-slot sweep

Move a middle card from near center to near left edge and back.

### HF3 — boundary hover

Hover slowly around an insertion boundary to detect chatter/hysteresis.

### HF4 — rapid reversal

Cross one prospective insertion then immediately reverse.

### HF5 — cancel

Open a gap then return to original topology without insertion.

### HF6 — narrow hand

Repeat HF1–HF5 under compressed mobile geometry.

### HF7 — edge card

Reorder first/last card where one-sided neighbor response differs.

## Synthetic rejection conditions

Reject internally if:

- non-held cards cross/invert;
- gap boundary chatters under tiny perturbation;
- far landmarks move substantially under local one-slot movement without deliberate global-field semantics;
- cancel fails to restore topology;
- field produces numerical oscillation/jitter;
- narrow geometry becomes geometrically impossible without a separate compression policy;
- insertion outcome is inconsistent with visual gap.

---

# Perceptual questions reserved for later human evidence

Instrumentation cannot decide:

- whether H1 feels like a connected hand or merely extra animation;
- whether H0 is actually preferable because it is crisp;
- whether H2's global response is delightful or exhausting;
- whether users trust the future insertion position;
- whether local deformation supports cognition;
- whether personal gaps become meaningful landmarks;
- whether hand movement steals attention from table/opponents;
- whether the interaction remains pleasurable after hundreds of reorders.

## Owner-test readiness

**NOT READY.**

Before any Owner-facing hand comparison:

1. implement and internally falsify H0/H1/H2 with a neutral held-card law;
2. validate geometry under 7/8/10-card and mobile/desktop conditions;
3. reduce to a small set of mechanically credible candidates;
4. integrate enough realistic card readability to avoid testing abstract rectangles;
5. define first-contact and repetition tasks separately;
6. decide whether personal ordering or only local-field feel is being tested in that fixture.

## Current research preference, not conclusion

H1 is currently the strongest hypothesis because it best matches:

- Owner evidence that slot-like reordering was too shallow;
- spatial-memory goal of preserving far landmarks;
- interaction-aesthetics goal of relational meatiness;
- attention goal of local rather than global motion.

H0 remains the essential baseline.

H2 is a valuable upper bound.

H3 becomes relevant only if stable user-created grouping actually emerges.

## Donor question

The transferable question is not `how should cards fan?`

It is:

> **How can a user-owned spatial workspace deform locally around direct manipulation while preserving learned landmarks, precise intent and minimum necessary disturbance?**

That question is credible for JV assemblies, JES editing surfaces, Multi World object/inventory spaces and other interactive workspaces.
