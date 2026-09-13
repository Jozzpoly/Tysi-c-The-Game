# Self-Teaching Domain Audit — Tysiac candidate rules

Status: research audit against the current executable candidate model. This is not a claim of final PlayOK authenticity and not a production UI specification.

## Purpose

Test the `self-teaching interaction` thesis against real Tysiac command/rule structure instead of applying it universally.

The audit asks for each operation:

- what can interaction behavior teach well?
- what needs concise rule explanation?
- what is strategy and should remain the player's judgement?
- what privacy/authority constraints limit presentation?

## Classification vocabulary

### EMBODY STRONGLY

The operation has a natural spatial/causal structure that should be carried primarily by objects, relationships and consequence.

Text can support but should not be required for routine use after initial discovery.

### BEHAVIOR + EXPLAIN

Interaction can teach part of the rule, but important domain semantics are conventional/arbitrary and deserve local explanation.

### EXPLAIN EXPLICITLY

Trying to encode the rule mainly as physical/visual behavior would likely be obscure or misleading.

The interface should still remain causally coherent, but prose/reference is a legitimate primary carrier of the rule.

### STRATEGY OUT OF SCOPE

The interface must not confuse legal operation with strategic recommendation.

---

# Auction / bidding

Canonical operations:

- bid by allowed increment/value;
- pass;
- auction winner becomes declarer and receives the talon;
- candidate bid ceiling depends on marriage value held.

## Classification

**BEHAVIOR + EXPLAIN**

## What interaction should teach

- whose initiative it is;
- current public bid/stake;
- that a new bid raises an existing obligation rather than being an arbitrary button value;
- that pass exits the active contest;
- that winning transfers the talon/declarer role to the winner;
- available bid values should reveal the legal range directly.

## What still needs explanation

- the commitment meaning of the bid;
- why the maximum may differ depending on marriages in hand;
- consequences of later contract failure.

## Strategy boundary

Do not visually imply `highest available bid = recommended`.

Legality and wisdom are different.

## Opportunity

The current product renders many numeric buttons and explanatory copy. A future scene can instead make bidding a visible escalation/ownership contest while retaining concise rule detail on demand.

---

# Talon reveal / acquisition

Canonical event:

- auction winner receives/reveals the talon according to the current flow.

## Classification

**EMBODY STRONGLY**

## What interaction should teach

- these specific cards entered the declarer's owned workspace;
- hand topology changed because of acquisition;
- the declarer now has the next obligation/choice.

A detached toast is unnecessary as the primary meaning carrier if the cards visibly join the hand.

---

# Exchange after talon

Canonical operation:

- declarer gives exactly one card to each opponent.

Public event exposes sender + recipients; each recipient privately learns the received card.

## Classification

**EMBODY STRONGLY**

This is one of the strongest candidates for spatial self-teaching.

## What interaction should teach

- two cards must leave the declarer's hand;
- one belongs to opponent A and one to opponent B;
- selection/order/recipient relation is visible before commit;
- transfer is not canonical until confirmed/accepted;
- after acceptance each opponent acquires ownership of their card.

## Privacy boundary

Other viewers must not learn card identities they are not entitled to know.

Motion, timing and card-face representation must preserve the same privacy boundary as the event model.

## Current-product weakness

The current UI explains recipient assignment textually as first selected -> one opponent, second selected -> the other.

A richer interaction should make the recipient relationship spatially explicit before commit rather than requiring memory of selection order.

---

# Bomb / withdraw

Canonical candidate operation:

- available only in a specific post-talon/pre-exchange window;
- ends the hand immediately;
- score effect depends on prior bombs.

## Classification

**EXPLAIN EXPLICITLY + STRONG CONFIRMATION**

## Why

This is rare, high-impact and largely conventional. There is little value in pretending it is discoverable from card material behavior.

## Interaction requirement

- deliberate entry into the action;
- consequence preview sufficient to understand severity;
- explicit commit/cancel;
- decisive result after authority acceptance.

This is a case where an explicit confirmation is good interaction, not a failure of embodiment.

---

# Four nines / optional redeal

Canonical candidate operation:

- private option after exchange and before contract;
- player may request redeal or continue;
- continuing should not expose the private condition to others.

## Classification

**EXPLAIN EXPLICITLY**

## Why

The rule is special-case convention and privacy-sensitive.

Trying to communicate it through environmental resistance or mysterious card behavior would likely be worse than concise local explanation.

## Interaction requirement

- option appears only to the entitled seat;
- explanation states consequence clearly;
- continue/redeal semantics are explicit;
- no public motion/timing leaks the private hand condition.

---

# Final contract

Canonical operation:

- declarer selects final commitment;
- cannot be below winning auction value;
- candidate ceiling is tied to held marriage capacity;
- failing it changes scoring.

## Classification

**BEHAVIOR + EXPLAIN**

## What interaction should teach

- final contract is a continuation/escalation of the bid, not a new unrelated number field;
- legal range is visible;
- lower bound is inherited from auction result;
- committing changes persistent stake/obligation state.

## What still needs explanation

- scoring consequence for failure;
- reason for upper cap where not obvious;
- any rule uncertainty in current candidate must not be disguised as final truth.

---

# Card play — basic acquisition and commit

Canonical operation:

- choose one viewer-owned card among current legal commands;
- possibly declare marriage with eligible card;
- command becomes canonical only after reducer/server acceptance.

## Classification

**EMBODY STRONGLY**

The motor/semantic path of `this card leaves my hand and enters shared play` should be one of the strongest interaction sentences in the product.

The player should be able to inspect/manipulate own cards without accidentally committing them.

---

# Trick legality: follow / beat / trump / overtrump

Current executable candidate includes:

- must follow led suit when possible;
- while following, must beat current led-suit winner when possible;
- when void in led suit and trump exists, trump is compulsory;
- if trump is compulsory and trump already wins, overtrump when possible.

## Classification

**BEHAVIOR + EXPLAIN**

## Why

The system can expose the legal relation very effectively, but the rule hierarchy is a domain convention. Pure physical resistance risks making it mysterious.

## Candidate teaching sequence

1. all owned cards remain inspectable;
2. current legal relationships become perceptibly available;
3. an illegal card may be safely probed without canonical commit;
4. the commit relationship refuses to form or destination remains non-receptive;
5. legal alternatives gain local salience;
6. after demonstrated uncertainty, concise explanation names the actual rule;
7. repeated fluent use allows guidance to become quieter without changing semantics.

## Critical boundary

Do not make illegal cards look as if they are not owned or cannot be touched.

`Not legal to commit now` is different from `not interactive`.

## Test requirement

A novice should eventually be able to predict legal candidates before trying every card.

Transfer of learned rule is stronger evidence than one successful guided action.

---

# Marriage declaration

Canonical candidate semantics:

- K+Q of a suit creates marriage value;
- declaration occurs through an eligible play command;
- declaration sets that suit as trump and adds marriage points;
- suit values differ.

## Classification

**BEHAVIOR + EXPLAIN**

## What can be embodied

- visible relationship between the K/Q pair in the owned hand;
- an eligible declaration has distinct feedforward from ordinary play;
- declaration transforms persistent trump state;
- point/state consequence originates from the pair/action;
- played card still remains part of the normal card-play sentence.

## What should be explained

- the K+Q marriage convention;
- suit-specific point values;
- any timing eligibility rule not inferable from current state.

## Anti-pattern

Do not add a detached `MELD` button that teaches the player nothing about which cards create the possibility if a more local card/pair relation can express it.

---

# Trick resolution

Canonical event includes:

- full three plays;
- winning seat;
- points;
- trick index.

## Classification

**EMBODY STRONGLY**

This is a prime causal-scene candidate because the event already contains the truth needed for presentation.

## What interaction should teach

- which cards formed the trick;
- who won it;
- that the winner acquired its value;
- whose initiative leads next;
- score/captured state changed because of this trick.

A user should not need a toast to discover who won if the scene grammar is doing its job.

Text can still confirm exceptional ambiguity/accessibility.

---

# Hand scoring

Canonical event includes:

- score delta;
- resulting scores;
- declarer;
- contract;
- made/failed.

## Classification

**BEHAVIOR + EXPLAIN**

## What can be embodied

- contribution of captured-card points / marriages to raw outcome;
- made versus failed contract as a meaningful resolution;
- delta flows into persistent match score;
- locked/unchanged scores should not look like missing updates.

## What needs explicit explanation

- rounding rules;
- 800-lock semantics;
- exact contract-scoring convention;
- special-case bomb scoring.

Detailed arithmetic can be inspected on demand rather than occupying the table during ordinary play.

---

# Match completion

Canonical event includes winner/draw and final scores.

## Classification

**EMBODY STRONGLY + EXPLAIN SUMMARY**

The match ending should be perceptually decisive and causally linked to the final score transition.

A compact final summary can explain the terminal state without requiring the player to reconstruct every prior event.

---

# Cross-phase findings

## 1. The best self-teaching targets are relational

Operations like:

- acquire talon;
- move card from hand to shared play;
- give one card to each opponent;
- collect a trick;
- transfer initiative;

have strong spatial/causal structure and should carry much of their meaning through interaction.

## 2. Special rules deserve prose

Four nines, bomb scoring, rounding and lock thresholds are not failures if they require explicit explanation.

Forcing them into physical metaphors would reduce truthfulness.

## 3. Legality is a hybrid problem

Trick constraints can be behaviorally discoverable, but the hierarchy/rationale is conventional enough that local explanation remains important.

## 4. Strategy remains sovereign to the player

The UI may reveal consequence and legality. It should not make strategic desirability indistinguishable from availability.

## 5. Privacy is part of learnability truth

A self-explanatory animation that reveals hidden information is still wrong.

The same viewer-safe event/projection boundary must constrain motion, timing, labels and sound.

## 6. Current product overuses prose where embodiment is strong

Examples include exchange and card-play operation.

That prose is useful as a temporary scaffold, but the long-term target is to move routine meaning into object/space/scene behavior.

## 7. Current product prose is appropriate in several places

Bomb, four-nines and detailed scoring genuinely need explicit semantics.

The goal is not `remove text`; it is **spend text where the domain is actually conventional or complex**.

## Research portfolio produced by this audit

High-value later self-teaching experiments:

1. exchange recipient relation without selection-order prose;
2. trick-legality probing with full card ownership preserved;
3. marriage feedforward from card-pair relation;
4. trick winner/points/next initiative understood without toast;
5. score-resolution explanation that remains optional during ordinary play.

These should be designed only after the lower-level Card/Hand mechanics are sufficiently stable to avoid confounding learnability with poor manipulation.

## Current conclusion

The self-teaching goal survives contact with the actual Tysiac model, but in a narrower and stronger form:

> **Embody causal/spatial operations strongly; make constraints safely probeable; explain arbitrary conventions locally and honestly; never confuse legality with strategy.**

That is a more defensible target than `teach the whole game without text`.
