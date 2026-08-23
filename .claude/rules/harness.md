# Harness rules — session mechanics

Loaded every session alongside `CLAUDE.md`. Covers how a session starts and
the repo-state guardrails that apply regardless of what phase of work is
underway. Adapted from SENTINEX (`References/SENTINEX_WaysOfWorking_v1.html`,
Part A/Pillar III and Part B/Phase 1) — no automated hooks exist for this
project yet, so these are stated rules, not enforced ones. Revisit once
build tooling exists and repeated misses justify a hook.

## Session start (first tool call, no exceptions)

1. `git fetch origin main` — before reading anything or answering any
   "where are we" question. A local clone can go stale silently; never
   answer status from an unfetched tree, and state which commit a status
   was read at.
2. Check divergence: `git rev-list --left-right --count HEAD...origin/main`.
   - Behind → `git status --porcelain`, check for collisions, `pull --ff-only`,
     then re-read `PROGRESS.md` (post-fetch).
   - Even → continue.
3. Read `PROGRESS.md`, then `TAG_PRD_v3.md` (or the active phase spec
   under `build/`, if one exists). Never re-read the original Corporate
   Presentation, the superseded `TAG_PRD_v2.md`, or
   `archive/BMSx_PRD_v1_business_source.md` for scope — v3 is pinned.

## Token / budget gate

Adapted from `References/PLAYBOOK.md` §7. At the **start of a new session**,
and before any step estimated at meaningfully large cost (a new phase, a
large refactor, a big multi-file generation): ask Nitish for his current
usage stats (session %, weekly %), state whether the planned step fits
against both, and proceed only on his go. This is a standing question, not
a one-off — ask it again each new session, not just the first time this
rule was written.

Track observed burn rates here as real data points accumulate, so future
estimates are grounded in this project's own cost profile rather than a
generic guess:
- *(none recorded yet — first entry goes here once a build phase has run)*

**Model-tier selection is part of the budget gate, not a separate call.**
When starting a task, say which model tier fits it and why — reserve the
highest-capability tier for judgment-heavy work (synthesising the PRD into
an architecture, resolving an ambiguous scope question, a hard debugging
session); default to a mid-tier workhorse for well-specified, incremental
build work (CRUD endpoints, routine component work, following an already
-written phase spec). State this per task, not once at project start —
different sessions need different tiers.

## Guardrails (generalized from SENTINEX's hard-won list)

- **Stale local `main`.** Before merging, `git merge-base main origin/main`
  — an empty result means local `main` doesn't share history with the real
  branch (e.g. an old snapshot baked into a fresh clone/container). Never
  answer that with `--allow-unrelated-histories` or a force-push: rename the
  stale branch aside, rebuild from `origin/main`.
- **Session-branch trap.** Work committed only to a throwaway
  `claude/<slug>` branch is invisible to every future session and, on
  ephemeral containers, can be lost entirely on reclaim. Before a session
  ends: `git push origin HEAD:main` (lands on the trunk) **and**
  `git push -u origin HEAD` (keeps the session branch in sync). Verify with
  `git rev-list --left-right --count HEAD...origin/main` — must read `0 0`.
  Don't call work "pushed" until it does.
- **The cold-resume trap.** A session re-entered long after it last ran
  re-pays its entire accumulated context on the first turn back (cache
  expiry). If a session hit a usage limit, treat it as over — start fresh
  rather than resuming, and if a resume is unavoidable, answer and stop
  (no further tool calls) rather than continuing to work in it.
- **Never assume a running dev server is current.** If/when a dev server
  exists for TAG, check what it's actually serving (build SHA, start time)
  before treating its output as evidence of current code — a stale server
  that "looks" fine is a documented SENTINEX failure mode.

## Repo-surface hygiene

Before pushing anything new to a repo-surface location (README, commit
messages, tags, CI config, PR/issue text, code/code comments), check it
against the sensitivity note in `CLAUDE.md` — currently an open item for
TAG (founder names in the archived business PRD, financial figures in
both PRDs).

## Delegation pattern

Large payload, small answer: use a subagent for visual verification,
repo-wide search, or reading something long to answer one question — its
context doesn't amortise against the main session. Delegate breadth, not
judgement that needs the main thread's accumulated context.
