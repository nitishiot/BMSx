# PROGRESS.md — BMSx session continuity

Single source of session continuity. Read this first every session (after
the sync gate in `.claude/rules/harness.md`), before re-deriving anything.

## Status

**Bootstrapping ways-of-working.** The SENTINEX playbook/ways-of-working
patterns (`References/`) have been adapted into `CLAUDE.md` and
`.claude/rules/{harness,build,product}.md`, plus the folder scaffold
(`build/`, `archive/`). No PRD-driven build work has started yet — that
begins once Nitish nudges to proceed and Phase 1 gets scoped and specced
under `build/`.

**Repo sync status (as of 2026-08-23, commit `075ba5a`):** local `main`,
current branch, and `origin/main` are identical. No divergence.

## What's built so far

- `CLAUDE.md` — project identity, vocabulary, stage, folder layout.
- `.claude/rules/harness.md` — session-start sync gate, repo guardrails.
- `.claude/rules/build.md` — phase-spec template, sign-off protocol, git/tag
  policy.
- `.claude/rules/product.md` — register, vocabulary, spec-handling rules.
- `build/README.md`, `archive/README.md` — folder-purpose docs.
- `README.md` — updated with the annotated structure tree at the top.
- **PRD reconciliation.** `References/TAG_PRD_v1.md` (a fuller product PRD
  that arrived via the `References/` copy, still under this repo's
  now-retired "TAG" name) was identified as a superset of the original
  `BMSx_PRD.md` — same market/revenue data, plus goals, personas, non-goals,
  landing-page requirements, user journeys, architecture, prioritised user
  stories, P0/P1/P2 requirements, success metrics, open questions, and a
  consolidated TBD list. Promoted to `BMSx_PRD_v2.md` (TAG→BMSx renamed
  throughout) as the new pinned scope doc; the original moved to
  `archive/BMSx_PRD_v1_business_source.md` via `git mv` (history preserved).

## What's blocked / open

- **Legacy scaffold decision (open, deferred by Nitish 2026-08-23).**
  `server/`/`client/` are an unrelated boarding-house/PG app from the
  original repo scaffold — not the platform the PRD describes. Three
  options were raised (archive & start fresh / repurpose in place / leave
  and build alongside); Nitish said to wait for a nudge. **Do not build on,
  repurpose, or delete this code until that decision lands.**
- **Sensitivity classification (open).** `archive/BMSx_PRD_v1_business_source.md`
  carries founder names; both PRDs carry financial figures. Both live in a
  public repo; repo-surface vs. internal-only hasn't been decided for this
  project. See `CLAUDE.md`.

## Next steps

1. **New session, next up: high-level comprehensive architecture diagram**
   — building on `BMSx_PRD_v2.md` §8's mermaid sketch, before Phase 1 gets
   specced. Nitish deliberately chose a fresh session for this rather than
   continuing here post-compact.
2. On go-ahead: scope Phase 1 against `BMSx_PRD_v2.md` (§13 already
   proposes a phasing: Phase 1 = landing-page optimisation + core ticketing
   P0, Europe), write `build/MVP1_<name>/PHASE_1_SPEC.md` before any
   implementation.
3. Resolve the legacy-scaffold decision before Phase 1 touches `client/`
   or `server/`.

## Decisions log

- **2026-08-23** — Adopted the SENTINEX playbook's ways-of-working for
  BMSx, scaled down (no automated hooks, no CI yet, NFR targets left `TBD`
  until a live system exists). Reason: Nitish asked to follow
  `References/PLAYBOOK.md` and `References/SENTINEX_WaysOfWorking_v1.html`
  before starting PRD-driven build work.
- **2026-08-23** — Confirmed `main` is the GitHub default branch and fully
  in sync with local (`075ba5a`, "Optimise landing page: SEO, performance,
  accessibility, analytics"). Widened the local fetch refspec (it had been
  scoped to only the working branch) so `git fetch origin` picks up `main`
  going forward.
- **2026-08-23** — Legacy boarding-house `server`/`client` scaffold: left
  untouched, decision on its fate deferred by Nitish. Documented in
  `CLAUDE.md` as a hard "do not touch" until resolved.
- **2026-08-23** — Promoted `References/TAG_PRD_v1.md` to `BMSx_PRD_v2.md`
  as the pinned scope doc, superseding `BMSx_PRD.md` (moved to
  `archive/BMSx_PRD_v1_business_source.md`). Reason: Nitish confirmed the
  TAG-named draft was the newer, more complete product spec (the original
  BMSx PRD is a subset — business/investor content only) and asked for it
  to be promoted with the retired "TAG" name renamed to "BMSx" throughout.
- **2026-08-23** — Committed the scaffold (`b776873`) and pushed to
  `origin/main` directly (not just the session branch), per the
  session-branch guardrail. Made the budget gate a literal per-session
  question (asking Nitish's session/weekly usage %) rather than only a
  described pattern, in both `CLAUDE.md` and `.claude/rules/harness.md` —
  Nitish flagged this needed to actually happen in new sessions, not just
  be documented.
- **2026-08-23** — Budget gate answered: session and weekly usage both
  under 20% — comfortable fit for the next task. Added model-tier
  selection as part of the budget gate in `harness.md` (state which tier
  fits a task and why, per task, not once) — Nitish asked for this to be a
  standing reminder.
