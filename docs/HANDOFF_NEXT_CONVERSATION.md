# Historical handoff — SUPERSEDED

Date created: 2026-09-12
Last authority correction: 2026-09-15

> **Do not execute this file as the current handoff.**
>
> It is retained only as project history. The project has since passed through Run 02, the Friend Preview campaign, Run 05 presentation work, and the 2026-09-15 friend-link incident/recovery.

For current continuation read, in this order:

1. `docs/EXECUTION_STATE.md` — current live state and P0 priority;
2. `docs/INCIDENT_2026-09-15_FRIEND_LINK.md` — open critical incident and acceptance gate;
3. `docs/DEPLOYMENT.md` — public/stable/friend-link evidence authority;
4. `AGENTS.md` — current Owner/agent, claim and critical-gate rules;
5. `docs/PROJECT.md` — durable architecture/product model.

`docs/RUN_02.md` is historical context. It must not be used as current execution authority.

## Historical purpose

This handoff originally requested a broad restart rather than blindly continuing the first exploratory plan. Useful surviving conclusions include:

- desktop and mobile as equal product targets;
- deterministic pure TypeScript game core;
- server-authoritative hidden state;
- projection-driven human/bot boundary;
- Cloudflare Worker + SQLite Durable Object as current-best online authority;
- explicit candidate rule profiles rather than a fake universal Polish canon;
- separation between game-truth and Owner-led experience evidence.

Those principles survived, but the current project state has evolved materially.

## Important later corrections

### Evidence now has three tracks

Run 02 established game truth and experience truth.

The friend-link incident demonstrated that operations/external truth must be first-class as well:

- deployment class;
- exact public candidate SHA;
- actual copied invite;
- later no-redeploy availability;
- real second-human use.

No other evidence track may substitute for a blocking external failure.

### Critical Owner gates are hard blockers

If an explicit Owner requirement conflicts with available evidence, progression stops until the contradiction is resolved. Green adjacent tests cannot promote the state to PASS.

### Temporary preview is not a friend candidate

`wrangler deploy --temporary` is diagnostic infrastructure only. Stable friend testing requires the account-owned non-temporary deployment path plus the acceptance ladder in `docs/DEPLOYMENT.md`.

### Candidate identity is immutable

Stable deployment must be tied to one exact full Git SHA. Branch names and workflow-definition SHA are insufficient identity evidence.

## Historical instruction — fulfilled

The original request to reread/research/rebuild the foundation was completed. Do not repeat that whole restart by default.

Current work is a bounded incident-driven recovery plus Run 05 continuation. Recover current authority, inspect current evidence and continue from there.
