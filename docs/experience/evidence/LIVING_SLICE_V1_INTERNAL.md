# Living Slice v1 — INTERNAL evidence

Status: **mechanical/browser PASS; experience FAIL-TO-PROMOTE**.

This record preserves what v1 actually demonstrated before later iterations change the fixture.

## Scope

`lab/experience/living-slice-v1.html`

Fixed scenario:

- two public opponent cards already in a trick;
- viewer-local seven-card hand;
- two legal heart plays and several illegal-to-play cards that remain manipulable;
- one local third-card play closes the trick;
- local player wins 25 card points;
- local captured-card value changes `40 -> 65`;
- persistent match score remains `340`;
- local player gains next initiative.

The fixture is branch-only research tooling, not product UI.

## Automated evidence

GitHub Actions:

- workflow: `Experience Research`;
- first run: `#1` / run id `34764541659`;
- head: `e7d5815c4c54316157430e3494f9c5a2a86a107a`;
- result: PASS.

The workflow ran:

1. Card Control apparatus check;
2. Hand Field apparatus check;
3. Workspace Reconcile check;
4. semantic Scene Plan check;
5. Living Slice browser torture on desktop `1440x900`;
6. Living Slice browser torture with mobile/touch emulation `390x844`.

Screenshots were retained as the `experience-research` workflow artifact.

## What v1 demonstrated mechanically

### Layout/hit geometry

PASS in both tested viewports:

- no horizontal overflow;
- seven-card hand fits;
- visible acquisition region exists for every overlapped card;
- card dimensions remain above the internal fixture minimum;
- physical mouse/touch acquisition works through ChromeDriver/CDP rather than DOM `.click()` substitution.

### Capability layering

PASS at mechanism level:

- `9C` can be reordered while illegal to authoritative `play`;
- reorder changes viewer-local topology without emitting a play commit;
- illegal `QS` play probe returns to the hand;
- illegal probe does not change trick, captured value or match score.

This is stronger than `playable = interactive` / `illegal = disabled`.

### Authority rejection

PASS at fixture-state level:

- legal `JH` can enter pending;
- injected authoritative rejection returns it to the hand;
- unrelated local topology survives;
- captured value remains `40`;
- match score remains `340`;
- existing trick remains `10H, KH`.

### Accepted closure

PASS at fixture-state level:

- `AH` enters pending;
- authority acceptance is distinct from contact/commit;
- trick completion follows acceptance;
- accepted card leaves the hand;
- trick cards collect/disappear through the resolution phase;
- captured-card value changes `40 + 25 -> 65`;
- match score remains `340`;
- next initiative becomes local;
- trace contains authority acceptance, trick completion, captured-value consequence and initiative transfer.

### Temporal trace

Representative desktop accepted sequence from CI:

- hold start ~2034 ms;
- commit/pending ~2398 ms;
- authority accept ~2539 ms;
- trick complete/resolving ~2710 ms;
- captured-value update ~3021 ms;
- settled/initiative ~3412 ms.

Mobile produced the same semantic order with small runtime timing differences.

These values are fixture timings, not product timing recommendations.

## Critical visual self-review

The generated desktop/mobile `ready` and `settled` screenshots were manually inspected after CI.

### Positive

- substantially less implementation-shaped than production `GameTable`;
- no dominant scoreboard/dashboard;
- local hand has much stronger compositional priority;
- opponent seats have stable public geography without avatars;
- match score is peripheral rather than the visual center;
- captured value is distinct from match score;
- mobile and desktop use the same semantic structure without literal pixel parity;
- card readability survives overlap.

### Material failures / weaknesses

#### 1. Shared scene remains too empty/neutral

The center reads as a clean research arena, but not yet as an inhabited game space.

Correct spatial semantics alone did not create enough perceptual life.

#### 2. Settled state loses too much residue

After collection, the shared space becomes almost blank.

Text says `Prowadzisz następną lewę` and captured value says `65`, but ownership/consequence is not embodied strongly enough in the resting composition.

This is a direct test of the persistent-consequence hypothesis: v1 currently preserves truth numerically more strongly than perceptually.

#### 3. Opponent presence is still mostly labels + prior cards

Stable seat geography exists, but the screenshot alone does not demonstrate meaningful action-source presence.

V1 begins after opponent plays, so the dynamic source -> action relationship is under-tested.

#### 4. Hand is visually prioritized but not yet a convincing living workspace

The hand is cleaner and more central than production, but the static frame still resembles a well-presented fan more than a personally structured cognitive topology.

The useful behavior exists mainly during manipulation, not in the resting visual organization.

#### 5. Visual character is deliberately restrained to the point of sterility

This was preferable to hiding mechanism problems behind polish, but it confirms the Owner-alignment audit: causal correctness is not sufficient for the desired `living / meaty / soul` target.

#### 6. Causal transition is insufficiently inspectable from artifacts

Only ready and settled frames were captured.

The most important perceptual interval — commit -> accepted arrival -> closure -> collection -> value consequence — needs internal mid-scene capture/inspection before any Owner-readiness claim.

## Verdict

**Do not expose v1 to the Owner as a test.**

V1 has earned its role as a mechanical integration probe, not as an experience candidate.

Its most important finding is negative:

> a semantically truthful, uncluttered, card-prioritized composition can still feel under-inhabited and lose too much causal residue after the transient scene ends.

## Required v2 direction

Do not solve this by adding generic particles/glow/avatars.

V2 should investigate:

1. stronger persistent ownership residue after trick capture;
2. stronger next-initiative state at the actor/hand locus rather than duplicated explanatory text;
3. opponent action-source staging that can be inspected without avatar theatre or fake think delay;
4. mid-scene evidence capture for pending, accepted/closure and collection/value phases;
5. richer but causally assigned visual/sensory response rather than global decorative activity;
6. preserving low dashboard density and the captured-value vs match-score distinction;
7. keeping the fixture narrow enough that mechanism failures remain diagnosable.

The next question is not `make v1 prettier`.

It is:

> what minimum persistent and transient embodiment makes causal truth feel inhabited without turning ordinary repeated play into spectacle?
