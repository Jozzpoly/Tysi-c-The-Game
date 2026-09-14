# Friend Preview Campaign — external-facing candidate

Status: PLANNED / clean integration campaign.

## Mission

Prepare the first Tysiac build that can be sent to a friend without explanation, apology, developer framing, temporary-host warnings, QA chrome or obvious prototype aesthetics.

This is not a release-candidate campaign. It is the first serious external first-impression milestone.

The build must remain the real game and real runtime. Do not create demo theatre, scripted fake state or a beautiful isolated mock that bypasses canonical authority.

## Starting truth

The game/runtime foundation is comparatively strong: deterministic core, canonical legality/reducer, projection boundary, remote MatchRoom authority, reconnect, full solo-match rehearsals, desktop/mobile browser gates and tactile mechanical probes.

External-facing experience is not strong enough. Fresh Owner verdict on the current presentation is negative. Fresh tactile screenshots still read primarily as a competent test/game UI rather than a product worth proudly sending to another person.

Current experimental branches are donors, not merge targets:

- Run 03 / PR #17: Experience Foundation research and synthesis;
- PR #20: permissive hand / positive-affordance direction;
- PR #21: living-hand geometry, tactile motion and mobile finger visibility.

Do not merge those branches wholesale into this campaign. Selectively reproduce/import only mechanisms that earn their place.

## Governing product target

The first external user should encounter a modern, digital-first card game where:

- the hand and cards are primary instruments, not small controls below a dashboard;
- cards remain alive even when a specific game operation is illegal;
- legal actions are taught through positive feedforward and receptive relationships;
- ordinary play has causal continuity from hand to shared table to consequence;
- visual hierarchy, motion, sound and optional haptic feedback form one restrained sensory language;
- desktop and mobile are both first-class bodies, not one layout stretched into two sizes;
- routine states are quiet but inhabited; meaningful actions earn stronger feedback;
- all developer/test/revision/ruleset chrome is absent from the external-facing surface.

## Campaign phases

### P0 — consolidate truth and preview infrastructure

Create one clean integration branch from current main. Preserve Run 03 and tactile branches as donors. Remove dead/competing preview paths from the candidate. Establish one stable public preview route with direct entry into the game and no intermediary warning screen. Keep the existing foundation gates green.

Exit: one branch, one preview route, one known-good rollback point, no CI ambiguity.

### P1 — external first-impression specification + reference pass

Define what the friend should perceive in the first 10 seconds, first interaction, first minute and first completed trick/decision. Audit contemporary references by behavior and hierarchy rather than copying themes. Produce a small number of credible visual/compositional candidates before committing the runtime to another accidental aesthetic.

Exit: chosen visual hierarchy and composition direction for desktop and mobile, with explicit rejected alternatives.

### P2 — rebuild information architecture and spatial hierarchy

Recompose the real GameTable around cards, hand, shared action scene and opponent/source presence. De-emphasize dashboard strips, generic panels, empty table acreage, persistent helper copy and equal-weight status blocks. Decide card scale, hand territory, trick/action locus, score/contract hierarchy and responsive geometry separately for desktop and mobile.

Exit: screenshots already look intentionally product-designed before micro-animation or decorative polish.

### P3 — living hand + embodied control integration

Selectively import the best tactile mechanisms: permissive manipulation, viewer-local topology, continuous neighbor response, stable insertion intent, mobile finger visibility and truthful commit boundaries. Rework or discard anything that still feels slot-like, canned or mechanically clever but unpleasant.

Exit: handling cards is intrinsically inviting and does not depend on game legality to feel alive.

### P4 — First Living Slice

Implement the ordinary causal scene:

private hand -> play intent -> commit -> authoritative arrival -> trick closure -> winner/ownership -> collection -> point consequence -> next initiative -> settle.

Preserve identity and direction instead of teleporting between state snapshots. Opponent actions must read as originating from opponents. Routine turn state should increasingly emerge from scene hierarchy rather than banners.

Exit: one common trick closure feels coherent, readable and satisfying under repetition on desktop and mobile.

### P5 — visual identity / graphics polish

Polish the actual product system, not just assets: card anatomy and backs, typography, semantic palette, depth/shadows/occlusion, background/table field, opponent representation, spacing, iconography, score/value presentation, menus and major state transitions.

Avoid felt-table/poker-room identity, heavy wood/leather skeuomorphism, fantasy CCG language, sterile SaaS/dashboard composition and generic dark-glass/neon-premium styling.

Exit: screenshots can stand on their own without an explanation that the graphics are temporary.

### P6 — feedback, motion, sound and feel pass

Build one causal sensory grammar for contact, pickup, reorder, legal feedforward, commit, arrival, trick closure, collection, value transfer and settle. Preserve dynamic range: ordinary interaction remains responsive but restrained; important events keep headroom. Sound-off and reduced-motion must remain coherent. Mobile haptics, if used, are progressive enhancement at discrete thresholds rather than continuous vibration.

Exit: feedback improves control and causal understanding while also making repeated interaction pleasurable rather than noisy or exhausting.

### P7 — propagate the language through the full game

Bring auction, musik/exchange, marriage/trump, scoring, 800-lock and match resolution into the same hierarchy and sensory language. Do not polish rare rules more than common play, but do not allow any reachable state to fall back into obvious debug UI.

Exit: full authentic match is visually/interactionally coherent enough that the quality cliff between common and uncommon states is not embarrassing.

### P8 — external-readiness torture and rehearsal

Run real-runtime desktop and mobile rehearsal, full matches, reconnect/refresh, varied viewport sizes, slow/fast manipulation, illegal probes, repeated trick closure, sound off, reduced motion, latency/interruption and first-contact/incognito checks. Inspect screenshots and recordings rather than trusting test PASS alone.

Exit: no developer chrome, no broken layout, no warning/intermediary hosting page, no obvious interaction regression, stable public link, clean cold start.

### P9 — Owner acceptance and Friend Candidate freeze

Owner uses the candidate naturally without being coached toward implementation details. Raw reaction, hesitation and spontaneous manipulation matter more than a checklist. Fix material findings, then freeze a specific SHA as `Friend Candidate 1` with one stable URL and a rollback point.

Only after this gate is the build sent to the friend.

## External-ready gate

A candidate is not friend-ready merely because CI is green. It is friend-ready when the direct public link opens cleanly; the first screen contains no QA/test/revision/ruleset residue; the first action is obvious enough without a developer explanation; the hand invites manipulation; legal actions are positively discoverable without making other cards dead; an ordinary trick resolves as one causal scene; desktop and mobile each look intentional; a complete real match remains functional; repeated common feedback is not tiring; and the Owner is no longer embarrassed by the first impression.

## Evidence policy

Track A — game truth continues to use sources, invariants, scenario tests and rule probes.

Track B — experience truth uses fresh screenshots/recordings, Owner natural use, external first-contact behavior and measurable interaction mechanics.

Automation may reject regressions. It cannot certify taste, fun, materiality or pride-of-presentation.

## Scope guard

Do not add accounts, ranking, broad bot redesign, generic rigid-body physics, 2P/4P expansion or unrelated systems to make the build look larger.

The campaign wins by turning the existing authentic game into a coherent, satisfying external-facing experience.
