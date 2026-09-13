# Owner Collaboration Protocol for Experience Research

## Purpose

This project is also an experiment in high-quality AI/Owner co-design.

The Owner has explicitly high confidence in judging feel, liveliness, visual quality, responsiveness and interaction taste, while not claiming deep Tysiac domain expertise.

The process should exploit that asymmetry rather than forcing the Owner into formal UX language or rules certification.

## 1. Separate Owner authorities

### Owner is primary evidence for

- tactile/visual feel;
- responsiveness;
- perceived weight/directness;
- liveliness vs deadness;
- interaction character;
- frustration/pleasure;
- visual hierarchy;
- attention flow;
- whether a gesture feels natural or awkward;
- whether repeated action remains satisfying;
- overall product-quality impression.

### Owner is not required to certify

- exact Tysiac rule authenticity;
- strategic optimality;
- bot strength;
- network correctness;
- privacy/security;
- deterministic core invariants.

Those require separate evidence.

## 2. Owner language is data, not a deficiency

Raw phrases such as:

- `martwe`;
- `nie zauważyłem`;
- `dziwnie`;
- `za wolno`;
- `chcę to macać`;
- `za dużo się odpierdala`;
- `zajebiste`;
- `plastikowe`;
- `nie wiem gdzie patrzeć`

should be preserved verbatim before interpretation.

The agent may map them privately to hypotheses such as impact deficit, salience failure, temporal friction, causal fracture, sensory saturation, embodiment success or attention scatter.

Do not ask the Owner to translate instinct into design jargon unless needed.

## 3. Owner attention is expensive evidence

Do not send every intermediate prototype for testing.

A test should consume Owner attention only when:

- research question is explicit;
- competing hypotheses exist;
- fixture isolates meaningful variables;
- obvious implementation problems are removed;
- agent-side critical review has been performed;
- the remaining uncertainty is genuinely perceptual/behavioral.

If the answer can still be found through reasoning, code inspection, literature, automated tests, screenshots/artifacts, synthetic probes, browser torture or adversarial review, do that first.

## 4. Internal iteration ladder

The default workflow for substantial design/implementation work is:

`v1 -> test -> falsify -> extract evidence -> v2 -> test -> ... -> promote or change tactic`

The Owner should normally **not** see each intermediate version.

The agent is expected to spend its own implementation/research budget on internal iteration until one of these becomes true:

1. the candidate survives the relevant mechanical/semantic/browser/adversarial gates and the remaining uncertainty is genuinely human/perceptual;
2. another internal iteration is unlikely to add meaningful information;
3. repeated failures show that the current tactic/model is wrong, so the correct move is to change tactic rather than produce another cosmetic version.

### A version number is not progress

A new version is justified only when it changes a hypothesis, removes a demonstrated failure, tests a different mechanism, or materially strengthens evidence.

`v7` is not automatically better than `v3`.

### Failed versions are useful evidence

When a version fails:

- preserve the failure cause;
- distinguish product failure from harness failure;
- improve the candidate or the evidence instrument accordingly;
- do not lower thresholds merely to obtain green CI;
- keep rejected versions only when they remain useful evidence/donors.

### Do not ask the Owner to perform agent-side QA

Owner tests are not a replacement for:

- smoke tests;
- layout/hit tests;
- authority/privacy checks;
- repetition torture;
- screenshot/artifact review;
- obvious visual/interaction critique;
- comparing internal candidate variants;
- diagnosing bugs that can be reproduced without human taste.

The Owner should receive a candidate because **his perception is now the scarce missing instrument**, not because the agent wants another pair of eyes.

### Avoid endless perfectionism

Internal iteration should stop or change tactic when marginal information value collapses.

Do not create `v17` by tuning the same assumptions forever. If repeated versions fail for structurally similar reasons, move up a scale, change representation, redesign the experiment or revisit the hypothesis.

## 5. Do not overprepare forever

The opposite failure is research paralysis.

When:

- hypotheses are explicit;
- major known confounds are controlled;
- further analysis mostly repeats itself;
- internal candidates have survived the appropriate gates;
- the unknown is fundamentally `how does this feel under a human hand?`

then an Owner test becomes mandatory.

The gate protects attention, not implementation from falsification.

## 6. First-contact test

For genuinely new interaction:

- provide minimal necessary launch instructions;
- do not explain what the interaction is supposed to feel like;
- do not explain the intended discovery path;
- avoid variant names that prime judgement;
- capture first spontaneous actions and comments.

Evidence includes what the Owner **does not attempt**.

If an affordance is never discovered, that is evidence.

## 7. Behavioral evidence before retrospective explanation

Prefer sequence:

1. recording / interaction trace;
2. raw Owner comments during use;
3. immediate short reaction;
4. only then optional discussion of why.

Retrospective explanations are useful but can rationalize behavior after the fact.

## 8. Blind comparison where useful

When comparing candidates:

- neutral labels (`A`, `B`, `C`) over persuasive names (`Premium`, `Physical`, `Fast`);
- vary one meaningful dimension where possible;
- randomize order if order/novelty could bias judgement;
- avoid telling the Owner which candidate the agent prefers.

Do not force ranking if useful primitives exist across variants.

## 9. First impression and fatigue are separate tests

A candidate can win first contact and fail after twenty repetitions.

Record separately:

### First-contact quality

- discovery;
- delight;
- clarity;
- immediate material impression.

### Repetition quality

- irritation;
- accumulated delay;
- motor fatigue;
- sensory saturation;
- skill growth;
- boredom;
- desire to keep touching the system.

Both matter.

## 10. Interrupt the interaction deliberately

Later-stage tests should include relevant subsets of:

- look away for one second;
- switch tab/app;
- resume;
- reject one action;
- inject latency;
- rotate/change viewport where relevant;
- repeat fast input;
- intentionally cancel;
- intentionally make a mistake.

The goal is to test the language under broken attention, not only ideal flow.

## 11. Record action, not just outcome

For manipulation studies, useful evidence may include:

- touch/pointer path;
- pickup position;
- velocity;
- correction count;
- accidental selections;
- release location;
- reorder frequency;
- dwell before commit;
- repeated attempts;
- which screen regions are ignored.

Do not over-instrument early prototypes if instrumentation changes feel.

## 12. Agent responsibility after Owner test

The Owner should not have to write a formal report.

The agent should:

1. inspect the complete recording;
2. align behavior with raw comments;
3. distinguish demonstrated findings from inference;
4. identify confounds;
5. update research hypotheses;
6. reject/narrow/promote candidate donor concepts;
7. decide what can be solved without another Owner test;
8. prepare the next experiment only when justified.

## 13. Agent responsibility before Owner test

The agent should not behave as a menu generator that sends unresolved implementation choices upward.

Before Owner testing, the agent should:

- synthesize research into a small set of meaningful candidates;
- eliminate mechanically, semantically or visually weak candidates;
- perform internal version loops;
- protect cross-platform and system-truth constraints;
- identify the exact uncertainty that requires Owner perception;
- present a test only when it can change a real decision.

## 14. Owner disagreement is high-value evidence

If the Owner says a technically elegant interaction feels wrong, do not defend the implementation using theory.

Investigate the conflict.

Possible outcomes:

- implementation failed the theory;
- theory is irrelevant to this context;
- Owner response is novelty/context dependent;
- a hidden variable dominates;
- the intended experiential target is wrong.

Theory explains evidence; it does not overrule evidence.

## 15. Blind Owner feedback is still useful

The Owner may skip project explanations and test without understanding implementation or rules.

For experience research this can be a feature:

- less priming;
- stronger first-contact evidence;
- closer to actual player perception.

Treat blind feedback as unsuitable only for questions requiring domain knowledge.

## 16. Separate taste from correctness

A candidate can be:

- correct but disliked;
- delightful but wrong;
- clear but generic;
- expressive but fatiguing;
- beautiful but authority-dishonest.

Record axes independently.

Do not allow `Owner liked it` to certify architecture/rules correctness.

Do not allow automated correctness to certify experience quality.

## 17. Preserve rejected prototypes as evidence selectively

Rejected variants may contain useful primitives.

Preserve:

- research question;
- variable;
- evidence;
- reason for rejection;
- any primitive worth recovering.

Do not keep rejected implementation in the main lineage by inertia.

## 18. Testing cadence

No fixed number of conversations or prototypes.

A research stage may require many internal versions and zero Owner tests, followed by one high-information Owner session.

Cadence is determined by information value, not the desire to show progress.

## 19. Cross-project collaboration donor

This protocol itself may become donor material if it works.

Potential future uses include JV builder feel iterations, Multi World manipulation, JES world-edit interaction and Live NPC debug/inspection UX.

Promotion condition:

The process must demonstrably reduce low-value Owner testing while increasing the quality, coherence and interpretability of the tests that remain.

## Current state

Living Slice V1 was mechanically healthy but rejected internally as too neutral/dead.

V2 strengthened causal semantics, persistent consequence and desktop geography but exposed an invisible opponent-source transition once the evidence harness became stricter.

V3 is currently under internal falsification with an explicit `source establish -> flight -> arrival` contract. It is **not Owner-ready**.
