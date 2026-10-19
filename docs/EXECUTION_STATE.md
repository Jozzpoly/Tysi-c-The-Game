# Execution state — live truth

**Last reviewed: 2026-10-19.** This is the current working entrypoint. Historical forensics as they stood on 2026-09-20 are preserved **verbatim** in [the September archive](archive/EXECUTION_STATE_2026-09-20.md). Later commits, CI runs, public deployments and Owner tests supersede any static claim here only for the specific property directly checked.

## Why this project exists

Tysiąc is a **real, playable three-player digital card table** for desktop and mobile, solo/bot and friend play — not a generic card framework, repository-cleanup exercise, or permanent R&D treadmill. Physical card continuity, permissive manipulation, visual quality, phone responsiveness, privacy of hands, reliable reconnect and faithful rule behavior all matter.

Product reality and ownership are separate:
- **Owner/experienced friend:** visual/interaction feel, relative quality of variants, real human usability.
- **Executable evidence:** rules/projections, network/session, rendered behavior and CI on exact SHAs.
- **Operations:** serving-origin revision, client bundle actually loaded, durable invite and cross-device session. A working Worker and a green CI are not full release certification.

## Current identities and boundaries

| Identity | Exact evidence / state |
| --- | --- |
| **Golden — Owner/Friend control B0** | `fddeafbe2ef9b416c52f98cc5c9814bb2fb84f89`; [PR #61](https://github.com/Jozzpoly/Tysi-c-The-Game/pull/61). Last materially Owner/friend-evaluated product; **do not overwrite or silently reinterpret**. |
| **Canonical stable URL** | `https://tysiac-the-game.jozzpoly.workers.dev/`. The `stable-candidate.txt` and `stable-recheck.json` selectors remain pinned to Golden as checked on 2026-10-19. **Fresh 19 Oct stable recheck PASS**: [run 39229733191](https://github.com/Jozzpoly/Tysi-c-The-Game/actions/runs/39229733191), validation harness `7240d408`, no redeployment. Served exact Golden, completed public game command, captured real UI-copied invitation, second automated join, and reconnect. This is NOT a human Owner/friend PASS or proof of an old browser tab's loaded bundle. |
| **Repository `main`** | Last independently green product+diagnostic head before documentation/recheck maintenance: `b0db27715db5d720cd1577f779a537b597ac0de8`, [Foundation run 39180890205](https://github.com/Jozzpoly/Tysi-c-The-Game/actions/runs/39180890205) PASS. Later doc/recheck maintenance exposed an **obsolete literal-wording assertion** in `deployment-contract-smoke`, now updated to verify both current authority and the unmodified September archive; revalidate latest Foundation. Further docs-only commits may advance HEAD without changing the product. **Main is not automatically the product to release**. |
| **Candidate: Golden + narrow safety fixes** | [PR #75](https://github.com/Jozzpoly/Tysi-c-The-Game/pull/75), branch `release/golden-secure-reconnect-candidate-2026-10-19`. Based **directly on Golden**, not B1/B2/C2. Candidate exact head `e622d5ca67548fd968ae9aadcfbc35a2bcc6cf49` is **Foundation PASS** ([run 39228579598](https://github.com/Jozzpoly/Tysi-c-The-Game/actions/runs/39228579598)). Exactly 10 changed files versus Golden: two targeted server/session fixes and their browser/unit tests, including the fixed transient-handoff observer; **zero Golden CSS or card-presentation components**. **Not deployed, not Owner-approved.** Its old-branch deploy selector still points to historical `52450baa...`; only today's main workflow/selector defines stable release authority. |
| **Pending experiment B1/B2** | [PR #62](https://github.com/Jozzpoly/Tysi-c-The-Game/pull/62) / [#63](https://github.com/Jozzpoly/Tysi-c-The-Game/pull/63) remain experimental, not promoted. The September comparison did not prove an automatic-play pacing difference; see archived forensics. |

## Material findings repaired on main (not yet proven on live stable)

1. **Transient network error erased an occupied seat token** in initial session recovery. [Issue #70](https://github.com/Jozzpoly/Tysi-c-The-Game/issues/70); [PR #72](https://github.com/Jozzpoly/Tysi-c-The-Game/pull/72) merged. Client now distinguishes an explicit `401 INVALID_CREDENTIAL` from transport/5xx failures and retries without removing the private token. Browser fault-injection on desktop and mobile passed Foundation. **This is code/CI proof, not field-verified live deployment**.
2. **Predictable multiplayer deals from a public 32-bit LCG seed.** [Issue #71](https://github.com/Jozzpoly/Tysi-c-The-Game/issues/71); [PR #73](https://github.com/Jozzpoly/Tysi-c-The-Game/pull/73) merged. Worker now injects cryptographically shuffled complete decks into the preserved deterministic core for initial, next-hand and optional four-nines redeals, including bot decisions. Unit and browser Foundation passed on the implementation branch. **Existing already-started rooms keep their old current hand; this is not retrospective protection**.
3. **Handoff-test false negative.** After identical FAILs on `main@f66d7faf` and transient passes on diagnostic branch, [run 39180372402](https://github.com/Jozzpoly/Tysi-c-The-Game/actions/runs/39180372402) captured a completed card transfer visible for ~25 ms before its CSS completion marker disappeared. [PR #69](https://github.com/Jozzpoly/Tysi-c-The-Game/pull/69) added forensics; [PR #74](https://github.com/Jozzpoly/Tysi-c-The-Game/pull/74) uses durable mutation-based completion proof without weakening game revision/single-card/physical-transition checks. Qualified on main; Golden-based candidate must test this separately.
4. **Jaskinia broken play-entry:** its generated GitHub Pages link for this repo was observed as "Site not found", while the production game lives on a Cloudflare Worker. Finding reported to [Jaskinia PR #4](https://github.com/Jozzpoly/Jozz-Cave-Workbench/pull/4), including cross-origin iframe localStorage/seat-continuity risk. **Jaskinia integration remains open**, not fixed by the Tysiąc Worker changes.

## Current gates — in order

1. **Exact Golden-derivative CI — PASS.** Candidate `e622d5ca` passed Foundation. The initial [run 39180788319](https://github.com/Jozzpoly/Tysi-c-The-Game/actions/runs/39180788319) FAILED solely at Golden's transient handoff polling check; fixed test observer qualified in [run 39228579598](https://github.com/Jozzpoly/Tysi-c-The-Game/actions/runs/39228579598). Do not confuse this with live deployed/Owner-certified behavior.
2. **Golden visual identity / Owner gate.** Compare genuinely fresh documents on same desktop and real mobile between B0 and its narrow candidate. The file diff excludes known card visual/style paths, but code diff alone is not a perception test. Preserve the accepted card rhythm and mobile feel.
3. **Actual public play / security boundary.** Exact-candidate public provenance, copied invite → independent friend join → shared command → refresh/reconnect, and the original September friend-link incident closeout. The old serving Worker is not repaired by merely merging `main`. Avoid leaking seat tokens through URLs, storage crossing or screenshots.
4. **Jaskinia direct access.** Play-entry should resolve to a **verified runtime**; not synthesized Pages. First test full-origin/top-level play and whether iframe storage partitioning could change the accountless session identity. Do not invent universal embed compatibility.
5. **Controlled repository cleanup.** Keep the Golden commit and historical forensic record. Repo has ~77 branches as of this audit, many diverged and some duplicate tips; don't delete by age or naming heuristics. Inventory and reduce refs only after proving reachable history and release requirements. Historical PRs are donors, not current work.

## Implementation and release laws

- **Never equate:** branch name, `main`, GitHub Pages, Cloudflare Worker, `stable-candidate.txt`, actually loaded browser JS, Golden, temporary URL or draft PR.
- **Stable release** requires exact selected SHA and `docs/DEPLOYMENT.md` contract. Never change selector or run stable deployment as a consequence of documentation cleanup, CI green, or speculative improvement.
- **Owner test** can be a short practical feel/visual test, not an obligation to finish a whole match. Rule accuracy is a different evidence channel.
- **Do not delete** or conflate experiments #61/#62/#63; do not reinstate discarded cadence hypothesis/PR #64 without new contrary evidence.
- **Medium and Jaskinia** should consume verifiable state (entry URL, exact runtime/client revision, actual launch path, status, known limitations), not derived guesses or hand-written duplicate deployment claims. Shared infrastructure must make the game easier to experience rather than becoming the project's purpose.

## Resume contract for any next agent

On `kontynuuj`: check fresh repository HEAD, current CI of #75, exact `stable-candidate.txt`, stable URL **if accessible**, and recent Owner decisions. Then move the highest-value unfinished proof forward. Document evidence class: **source / CI / deployed / human-tested / hypothesis**. Do not manufacture an all-green status or deploy to public Golden without release qualification.

For the precise historical September regression chronology and B0/B1/B2 timers/screenshot evidence, read [the preserved original execution snapshot](archive/EXECUTION_STATE_2026-09-20.md). For deployment procedure, see [DEPLOYMENT](DEPLOYMENT.md).
