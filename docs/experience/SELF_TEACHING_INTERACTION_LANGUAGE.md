# Self-Teaching Interaction Language

Status: research model for learnability through interaction. No production tutorial or legality behavior is authorized by this document.

## Purpose

The Owner's requirement is stronger than `make the rules readable`:

> A player who does not know Tysiac should increasingly understand how to operate the game from the visual language, object behavior and consequences themselves, without being led by giant banners, arrows or a scripted tutorial path.

This does **not** mean the interface can teach all strategy implicitly.

The target is narrower and more defensible:

- routine operation becomes discoverable;
- important constraints can be probed safely;
- the purpose and likely consequence of actions are visible before commit where practical;
- feedback stays attached to cause;
- explanation appears locally when behavior alone is insufficient;
- expert freedom is not permanently reduced to protect novices.

## Working concept: safe epistemic probing

Users often learn interactive systems by trying things.

A good system can make those trials informative rather than dangerous or opaque.

**Safe epistemic probing** means:

1. the user can inspect or manipulate something reversibly;
2. the system responds immediately enough to reveal the relationship;
3. a routine constraint becomes perceivable before or at commit;
4. the user can cancel or recover without losing unrelated work/state;
5. if the reason is not inferable, a local explanation is available at the point of need;
6. the same underlying rule remains consistent after the guidance disappears from focal attention.

The purpose is not to prevent every mistake.

The purpose is to make exploratory mistakes **cheap, legible and educational**.

## Why neither tutorial banners nor pure hidden discovery is enough

### Tutorial/banner failure

A large instruction may tell the user exactly what to click while teaching almost nothing about the underlying interaction language.

The player succeeds because the overlay supplied the answer, not because the world became intelligible.

When the overlay disappears, knowledge may not transfer.

### Pure-discovery failure

A completely unexplained system can make arbitrary rules feel broken.

If a card simply refuses to move, the novice cannot know whether:

- the rule forbids it;
- the app missed input;
- the server is lagging;
- the card is disabled;
- a hidden mode is active.

`Let them figure it out` is not a design strategy when the system gives weak evidence.

## Six layers of interaction meaning

The research should distinguish these explicitly.

### 1. Affordance — `can I interact here?`

Signals interaction availability or ownership.

Examples:

- card responds to contact;
- cursor/hover changes where appropriate;
- touch target corresponds to visible object ownership;
- focused state is perceivable.

Affordance does not yet explain the purpose of an action.

### 2. Feedforward — `what would this action mean?`

Before commit, show or imply the likely operation/consequence.

Examples:

- lifting a card reveals a plausible destination relation;
- an insertion gap shows where reorder would settle;
- selecting a bid amount makes the resulting commitment legible before confirmation;
- a marriage-related action shows the affected suit/trump relation before irreversible commit where rules allow.

Djajadiningrat, Overbeeke and Wensveen explicitly distinguish feedforward from merely advertising that an action is possible: feedforward communicates the **purpose/meaning** of the action.

### 3. Reversible exploration — `can I inspect this without committing?`

The interface should provide a manipulation envelope in which the user can:

- touch;
- lift;
- inspect;
- move locally;
- reorder presentation;
- approach a target;
- back out.

This is not canonical game progress.

### 4. Constraint — `why does this possibility narrow here?`

Constraints should be expressed as close as practical to the object/action they constrain.

Possible channels:

- legal target becomes receptive while another remains inert;
- departure from the hand meets a semantic boundary;
- alternative legal cards become more legible;
- local relation refuses to form;
- a concise reason appears only after an informative failed probe.

Constraint behavior must not misrepresent a discrete game rule as literal physics if that metaphor creates wrong expectations.

### 5. Feedback — `what did my action just do?`

Feedback should be inherent/causally coupled where practical.

If a card was committed, the card itself should participate in showing the transition rather than a detached toast being the primary confirmation.

### 6. Explanation — `why did the system behave that way?`

Explanation is a fallback/support layer, not a failure.

Some Tysiac rules are arbitrary conventions. They may need prose.

The target is **local, contextual explanation after need is demonstrated**, not eliminating text at all costs.

## Guidance escalation ladder

Do not jump immediately to prose.

A candidate escalation model:

### Level 0 — quiet affordance

The system simply behaves consistently.

### Level 1 — local feedforward

The likely relation/target becomes visible while the user explores.

### Level 2 — behavioral constraint

The attempted relation does not complete and nearby legal structure becomes clearer.

### Level 3 — local semantic hint

A short explanation appears near the relevant object/state.

Example conceptually:

`Musisz dołożyć ♥`

This is preferable to a global error banner because the explanation remains attached to the failed relation.

### Level 4 — optional deeper explanation

If the user wants to understand the rule, a secondary explanation can describe why.

Do not automatically expose strategic coaching as if it were rule explanation.

## Important distinction: operation, rule and strategy

### Operation

`How do I perform an action in this interface?`

The UI should strive to teach this largely through interaction language.

### Rule

`Why is this action legal/illegal or why did this consequence occur?`

Many rules can be made more legible through state/behavior, but some require concise prose.

### Strategy

`What should I choose to maximize my chance of winning?`

Do not pretend the interface can or should teach strategy purely through affordance.

A legal action may still be strategically terrible.

The UI must not collapse `allowed` into `recommended` unless an explicit assist/coaching mode exists later.

## Error taxonomy for learning

Not all errors deserve the same handling.

### Contact error

Wrong object or missed hit.

Response target: improve contact fidelity; do not explain game rules.

### Interpretation error

User misunderstood what a gesture/control means.

Response target: better feedforward/semantic contract.

### Constraint probe

User intentionally or accidentally tries a currently non-committable action.

Response target: safe resistance/non-completion + reason when needed.

### Canonical rejection

User crossed commit but authority rejected it.

Response target: truthful rejection/recovery. Do not disguise this as local cancel.

### Strategic mistake

The user made a legal but poor choice.

Response target: game consequence, not paternalistic prevention.

### Destructive/system-risk operation

Outside ordinary Tysiac play, some donor contexts may require confirmation or hard prevention.

This is where training-wheel-like restriction can be justified by real consequence, not novice status alone.

## Constraint-as-behavior: useful but dangerous

This project previously considered `physical resistance` for illegal cards.

Keep it as one candidate, not doctrine.

Risks include:

- implying that legality is continuous when the rule is discrete;
- making the UI feel sticky/broken;
- coercing the hand rather than informing it;
- overloading material physics with rule semantics;
- confusing game constraint with latency/controller resistance.

Alternative representations include:

- destination non-receptivity;
- relationship highlighting;
- local separation/failed binding;
- legal alternatives responding more clearly;
- card remaining manipulable but commit boundary refusing to form.

The correct mechanism must be tested, not assumed.

## Visibility of legal actions

`Only highlight legal cards` can solve immediate operation while harming learning if it becomes a permanent answer sheet.

Candidate progression:

1. all owned cards remain physically yours and inspectable;
2. current legal relationships are perceptibly different;
3. illegal commit attempts remain safely probeable;
4. local explanation reveals the relevant rule when the user demonstrates need;
5. repeated understanding may allow cues to become quieter, without changing the underlying interaction law.

This preserves agency and knowledge transfer better than simply disabling everything except the correct choice.

## Permissive learnability

The desired model is not `novice mode with less game`.

It is:

> **full semantic world, safe reversible probing, bounded protection from catastrophic/meaningless error, and help that appears in context without replacing the user's initiative.**

This aligns with the Owner's broader builder philosophy: systems should diagnose and inform rather than decide what kinds of experimentation are allowed, except where actual stability/safety requires harder boundaries.

## Progressive disclosure — use selectively

Research shows progressive disclosure can help rapid initial learning by reducing visible complexity, but it may also reduce awareness of broader possibilities and can be less appropriate for expert/power use.

Therefore do not make `hide complexity from novices` a universal rule.

Better candidates for Tysiac include **progressive explanation** and **progressive salience**:

- functionality remains semantically present;
- routine possibilities are readable;
- explanation depth increases only when needed;
- rarely relevant detail does not compete with the current action;
- expert pathways remain available.

## Progressive explanation

A useful layered explanation model may be:

### Layer A — object behavior

The interaction itself carries meaning.

### Layer B — microcopy

One short reason at the local failure/decision point.

### Layer C — compact rule detail

A user-requested explanation of the actual rule.

### Layer D — deeper reference

Optional help/rules reference.

The user chooses depth through need rather than being front-loaded with instruction.

## Learning consistency

A self-teaching interface must teach invariants that remain true.

Bad learning occurs if:

- early tutorial mode uses different gestures than real play;
- novice auto-sort later disappears and destroys learned card locations;
- illegal cards are disabled visually at first but later require interpreting behavioral constraints;
- different phases reuse the same feedback for different semantics;
- mobile and desktop teach contradictory commit boundaries.

The safest onboarding is often the **real system with better support**, not a fake simplified world.

## Attention cost

Guidance consumes attention.

The interface should spend that budget near uncertainty.

If the player already demonstrates fluent behavior, repeated hints should retreat toward the periphery.

If hesitation/repeated invalid probes appear, local guidance may increase.

This suggests future adaptive support based on observable interaction, but no AI inference system is justified yet.

## Learning from recovery

Minimalist-instruction research emphasizes error recognition and recovery as learning opportunities rather than aberrations.

This aligns strongly with our `failure dignity` concept.

A good recovery should expose:

- what remained true;
- what failed to commit;
- why when necessary;
- what can be tried next.

Do not instantly reset everything so completely that the user cannot see the relation between attempt and failure.

## Safe probe versus hidden command

A system should avoid making exploration itself dangerous.

If touching/dragging an object can immediately trigger an irreversible command, the user cannot learn its behavior safely.

This is one reason `reversible manipulation envelope -> progressive commitment` remains a high-value donor candidate.

## Research hypotheses

### L1 — behavioral-first constraint

Can a novice discover a routine legality relationship through safe probing before reading explanation?

### L2 — local explanation timing

Does explanation triggered after the first meaningful failed probe teach better than permanent rule text or preemptive instruction?

### L3 — permissive versus restricted visibility

Does keeping the full hand interactable/inspectable while differentiating commit legality support better rule understanding than disabling illegal cards completely?

### L4 — progressive salience

Can guidance become quieter with demonstrated familiarity without destabilizing learned interaction?

### L5 — transfer

After learning one rule/phase through the interaction language, can the player correctly infer another structurally similar situation?

Transfer is stronger evidence than merely succeeding once.

### L6 — recovery as learning

Can rejected/cancelled actions improve understanding because the system preserves enough causal residue to diagnose what happened?

## Owner evidence later

A future novice/self-teaching test should avoid coaching the Owner through the task.

Useful evidence includes:

- first attempted action;
- hesitation before contact;
- whether the Owner probes alternatives;
- repeated invalid attempt versus immediate model correction;
- whether text was read before or after trying;
- whether the same rule error repeats later;
- spontaneous verbal model (`aha, czyli...`);
- successful transfer to a new but related state;
- whether guidance feels informative versus paternalistic.

The Owner's lack of deep Tysiac knowledge is an advantage for this specific research question.

It is not evidence for strategic correctness.

## Donor candidates

If supported, useful cross-project concepts include:

- **safe epistemic probing**;
- **progressive explanation rather than progressive restriction**;
- **behavior-first, prose-on-demand guidance**;
- **failure dignity as a learning channel**;
- **full semantic world with reversible exploration envelope**;
- **guidance that retreats without changing underlying laws**.

Potential transfer targets:

- JV builder constraints and component topology;
- JES material/world tools;
- Multi World object interaction;
- Live NPC/debug interfaces where causal inspection should teach system behavior.

## Failure conditions

Narrow or reject this model if:

- behavior-first cues remain too ambiguous for arbitrary rules;
- users interpret rule resistance as broken input;
- local hints are consistently missed;
- full permissive visibility creates excessive novice search burden;
- progressive salience creates inconsistent behavior;
- explicit concise instruction proves clearer and cheaper for a specific operation;
- probing slows ordinary expert play.

The goal is not to abolish instruction. It is to make **interaction itself carry as much durable meaning as it responsibly can**.

## Research references informing this document

- Djajadiningrat, Overbeeke & Wensveen (DIS 2002), feedforward and inherent feedback.
- Wensveen, Djajadiningrat & Overbeeke (DIS 2004), coupling action/function through feedback and feedforward.
- Carroll & Carrithers (CACM 1984), Training Wheels in a User Interface.
- Carroll (2014 retrospective), Minimalist Instruction: user initiative, error recognition, diagnosis and recovery.
- Van Oostendorp et al. / exploratory-learning work on direct-manipulation interfaces.
- Forsey et al. (2024/2025), Progressive Disclosure through Layered Interfaces and context-dependent learnability tradeoffs.
