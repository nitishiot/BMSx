# PROGRESS.md — BMSx session continuity

Single source of session continuity. Read this first every session (after
the sync gate in `.claude/rules/harness.md`), before re-deriving anything.

## Status

**Ways-of-working scaffold in place.** The SENTINEX playbook/ways-of-working
patterns (`References/`) have been adapted into `CLAUDE.md` and
`.claude/rules/{harness,build,product}.md`, plus the folder scaffold
(`build/`, `archive/`). No PRD-driven build work has started yet — that
begins once Nitish nudges to proceed and Phase 1 gets scoped and specced
under `build/`.

**Architecture drafted (2026-08-23).** `TAG_Architecture_v1.md` and its
local rendered companion `TAG_Architecture_v1.html` now exist — six views
(system context, containers, domain/data model, critical-path sequences for
J1 and J2, cross-cutting concerns, decisions) derived from `BMSx_PRD_v2.md`.
Draft, not signed off. Phase 1 scoping is the next step.

**Repo sync status (as of 2026-08-23, commit `b8f3ef7`):** local `main`,
current branch, and `origin/main` were identical at session start (`0 0`).

## What's built so far

- `CLAUDE.md` — project identity, vocabulary, stage, folder layout.
- `.claude/rules/harness.md` — session-start sync gate, repo guardrails.
- `.claude/rules/build.md` — phase-spec template, sign-off protocol, git/tag
  policy.
- `.claude/rules/product.md` — register, vocabulary, spec-handling rules.
- `build/README.md`, `archive/README.md` — folder-purpose docs.
- `README.md` — updated with the annotated structure tree at the top.
- **Platform architecture v1** — `TAG_Architecture_v1.md` (source of truth)
  plus `TAG_Architecture_v1.html` (local read-only render; Mermaid loads
  from a CDN, so it needs a connection to draw diagrams). Six views, ten
  ADRs (nine accepted, ADR-010 open), fourteen consolidated TBDs. No
  technology, cloud, or vendor is named — deliberately deferred to the
  phase spec.
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

1. **Review `TAG_Architecture_v1.md`.** Two things need Nitish's decision
   before Phase 1 can be specced: **ADR-010** (deployment granularity —
   modular monolith with Queue/Inventory/Payments extracted, versus the PRD's
   full serverless-microservices target) and the **BMSx→TAG rename pass**
   across the PRD, rules files, README and landing page.
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
- **2026-08-23** — Considered adding a `SessionStart` hook to automate the
  `git fetch origin main` sync-check step, after discussing that
  `CLAUDE.md`'s `@import`s guarantee the sync/budget gate text is *present*
  in context but not that it's *acted on*. Decided to hold off: no session
  has run under this scaffold yet, so there's no evidence of a prose-rule
  miss to justify it (unlike SENTINEX, which built hooks only after prose
  demonstrably failed twice), and most of what the gate needs — Nitish's
  actual usage %, confirmation the handoff was understood — isn't
  hookable anyway. Revisit if a session is ever seen skipping the gate.
- **2026-08-23** — Drafted `TAG_Architecture_v1.md` + `.html` (six views:
  system context, container, domain/data model, J1+J2 sequences,
  cross-cutting concerns, decisions/ADRs). Two views from the proposed
  outline were dropped at Nitish's direction: the enumerated event-backbone
  publish/subscribe catalogue, and the Phase-1 build subset (the latter
  moves into the phase spec). HTML is local-only — no Artifact published.
  The document names no cloud, framework, or vendor: PSP and travel/stay
  partners are unselected (PRD §12 Q2), so they are modelled as ports with
  adapters rather than guessed at.
- **2026-08-23** — Product name reverting **BMSx → TAG**, per Nitish. The
  architecture document is written as TAG; the PRD, `CLAUDE.md`,
  `.claude/rules/product.md`, `README.md` and `landing/` still say BMSx and
  still describe TAG as retired. This contradiction is deliberate and
  temporary — the repo-wide rename is a separate pass Nitish scheduled for
  after this first build. Until it runs, TAG and BMSx mean the same product.
- **2026-08-23** — Flagged in the architecture (ADR-010, open): building
  thirteen independently deployed serverless services before the first ticket
  sells is cost without benefit at current team size. Recommended a modular
  monolith with Virtual Queue, Ticketing & Inventory, and Payments extracted.
  Left as Nitish's decision, not assumed.
- **2026-08-23** — Budget gate: asked at session start, not answered before
  the go-ahead came. Work proceeded on the explicit "go ahead" instruction.
  Model tier stated and used: Opus, for PRD-to-architecture synthesis;
  Phase-1 implementation work should drop to a mid-tier model.
