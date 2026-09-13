# Tysiąc The Game — Owner Experience Test Protocol v0

Status: exploratory test contract / Visual Foundation Run
Date: 2026-09-13

## Purpose

The Owner is not being asked to validate Tysiąc strategy or rule authenticity. The Owner is the primary source of evidence for **what the product communicates and feels like**.

The protocol exists to make raw, natural reactions useful without turning the Owner into a formal QA operator.

## Raw feedback is preferred

Useful Owner statements include:

- "nie zauważyłem, że bot zagrał";
- "nie wiem co się teraz stało";
- "to się ślimaczy";
- "martwe";
- "to jebnęło za mocno";
- "to było satysfakcjonujące";
- "nie chcę tego przycisku tutaj";
- "na telefonie zasłaniam to palcem";
- "przypadkiem zagrałem";
- "nie wiem skąd te punkty";
- "to wygląda jak debug UI";
- "to jest zajebiste, ale po dziesiątym razie wkurwia".

Do not require the Owner to name design principles.

## Translation ledger

Raw feedback is translated into a research category **after preserving the original wording**.

| Owner signal | Likely research category | First question to investigate |
| --- | --- | --- |
| "nie zauważyłem" | salience / attention routing | Was event too quiet, in wrong location, or competing with another cue? |
| "nie wiem co się stało" | causal legibility | Did cause, consequence or persistent trace disappear? |
| "nie wiem dlaczego" | explanation / causal trace | Did UI show result without source/reason? |
| "za szybko" | temporal legibility | Which beat needed hold time? |
| "za wolno" / "ślimaczy się" | temporal friction | Which beat is cosmetic tail blocking action? |
| "martwe" | impact deficit | Is commit, material motion, sound, haptic, spatial consequence or hierarchy missing? |
| "za dużo się dzieje" | sensory saturation | Which channels are redundant or competing? |
| "przypadkiem kliknąłem" | commitment ambiguity | Is possible/selected/committed distinction insufficient? |
| "nie wiem gdzie patrzeć" | hierarchy / attention routing | Are simultaneous focal points competing? |
| "zasłaniam palcem" | touch occlusion | Is critical acknowledgement hidden under touch? |
| "nie trafiam" | target ergonomics | Size, spacing, gesture precision or scroll conflict? |
| "to wygląda tanio/debugowo" | production impression | Typography, material, spacing, chrome, placeholder semantics or motion quality? |
| "to jest satysfakcjonujące" | positive primitive | Preserve exact primitive; immediately repetition-test it. |
| "to jest dziwne ale ciekawe" | exploratory signal | Isolate what is novel before smoothing it away. |

This table is diagnostic guidance, not an automatic verdict.

## Four test modes

### 1. First-contact test

Goal: discover what the interface communicates without learned compensation.

Owner gets no explanation beyond how to enter the fixture/game.

Capture:

- first place eyes go;
- first attempted action;
- hesitations;
- mistaken assumptions;
- what happened but went unnoticed;
- whether next action is obvious after consequence settles.

Do not correct the Owner during the first attempt unless blocked.

### 2. Torture repetition

Goal: kill novelty bias.

Repeat a common sequence roughly 10–30 times or until the Owner clearly has a stable reaction.

Ask only after some repetition:

- did satisfaction survive repetition?
- which beat began to feel slow?
- which cue became noise?
- which cue became useful muscle memory?
- did the player start trying to act before presentation allowed it?

A rare-event animation can survive being extravagant. A trick loop cannot rely on first-time spectacle.

### 3. Contrast test

Goal: compare one semantic variable at a time.

Examples:

- crisp vs elastic collection;
- tap vs lift/confirm vs drag;
- 180 ms vs 320 ms causal hold;
- score number source→destination vs in-place tick;
- sound off vs sound on;
- motion vs reduced motion.

Avoid comparing two entire art directions when the research question is one interaction primitive.

### 4. Interruption / recovery test

Goal: test persistent traces rather than animation memory.

During or immediately after an event:

- look away for ~1 s;
- switch attention to another part of screen;
- background/foreground phone later in real runtime;
- reconnect in production fixture later.

On return ask:

- what happened?
- whose turn is it?
- who won the trick?
- did score change?
- what is the contract/trump?

If answer requires replaying a transient animation in memory, persistent-state design is insufficient.

## Mobile torture matrix

Run future candidate UX under several physical conditions:

- one-handed thumb;
- two-handed relaxed hold;
- large-font / browser zoom sanity where supported;
- portrait 390-ish baseline;
- smaller viewport later;
- sound off;
- vibration unavailable;
- reduced motion;
- repeated fast taps;
- drag cancelled intentionally;
- accidental near-neighbor tap;
- brief phone background/resume after runtime integration.

Mobile success cannot depend on haptics or perfect audio environment.

## Desktop torture matrix

- mouse click;
- trackpad;
- hover available but never required for correctness;
- wide desktop and smaller laptop viewport;
- fast repeated card play;
- pointer movement distance to frequent actions;
- browser tab interruption/reconnect later.

Desktop can use hover and peripheral space, but the semantic feedback language should remain recognizable from mobile.

## Timing evidence

Do not ask only "which timing looks better?"

Observe behavior:

- Does Owner attempt the next input before animation unlocks?
- Does Owner miss who won if hold is shorter?
- Is a cosmetic tail still useful once next action is known?
- Does speeding a sequence to 2x preserve causality?
- At 0.5x, can we identify redundant beats?

Treat attempted early input as strong evidence that presentation is holding the player hostage.

## Sound / haptic evidence

Test channels separately and together.

1. visual only;
2. visual + sound;
3. visual + haptic where available;
4. all available channels.

If the event becomes incomprehensible with sound/haptic disabled, the visual language is under-specified.

If audio/haptic adds nothing detectable, remove or redesign it instead of keeping sensory decoration.

## Authority/rejection test

Every candidate direct-manipulation model should be tested under a simulated rejection or stale-state correction.

Success condition:

- initial touch response feels immediate;
- player has not been falsely told the game accepted the move;
- rejection reads as "my attempted action did not commit", not "the game rewound a move that already happened";
- authoritative current state remains obvious.

## What not to ask the Owner

Avoid questions such as:

- "is this rule correct?"
- "was the bot's strategy good?"
- "is this authentic PlayOK behavior?"

Those require different evidence.

Also avoid leading visual questions:

- "is the physical variant better?"
- "don't you think this animation is satisfying?"

Prefer an open prompt after exposure:

> Co zauważyłeś / co cię wkurwiło / co było dobre / czego nie rozumiałeś?

## Evidence record shape

For useful findings, preserve:

- fixture/build SHA or lab revision;
- device/viewport/input mode;
- sound/haptic/motion mode;
- exact Owner wording;
- observed behavior if relevant;
- classification hypothesis;
- proposed change;
- whether change is reversible;
- next falsification test.

Do not rewrite raw Owner language into polished product language and lose its signal.

## Promotion rule

A primitive can be considered for runtime promotion when:

- it produces a material positive Owner signal or fixes a repeated failure;
- it survives repetition appropriate to its frequency;
- it remains understandable with optional sensory channels unavailable;
- it has a reduced-motion strategy;
- it does not create accidental commit ambiguity;
- its causal trace survives the event settling;
- it can be implemented without compromising game authority/privacy.

One positive first impression is not enough.
