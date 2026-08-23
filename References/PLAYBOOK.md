# Project Playbook

A domain-agnostic operating manual for running a project with Claude Code as a
long-lived build/delivery partner. Extracted from what actually worked (and
what broke and got fixed) on the SENTINEX build — kept here, not in that
repo, because it belongs to *how you work*, not to *what that project is*.

**How to use this:** at the start of any new project, skim this file and pull
the sections that apply into that project's own `CLAUDE.md` and
`.claude/rules/*.md`, adapted to the domain. Don't copy it verbatim — it's a
pattern library, not a template to fill in blindly. When a new project
teaches you something this file doesn't cover, or proves one of these
patterns wrong, come back and amend it (see §12). This file is allowed to be
wrong in places; it is not allowed to go stale silently.

---

## 1. Operating Philosophy

Four commitments that everything else in this document serves:

- **Spec before code.** Nothing gets built without a written spec that exists
  *before* implementation starts. The spec is the contract; the conversation
  that produced it is not. If scope isn't written down, it isn't scope yet.
- **Live verification over assertion.** "It should work" is not evidence.
  Every claim of done is backed by a real run against a real system that the
  human can see (query output, a running UI, a live log) — not a description
  of what the code is supposed to do.
- **Measured vs. projected, always labeled.** A number is either MEASURED
  (came from a real run, at a stated scale) or PROJECTED (a capacity model,
  an estimate, an extrapolation). Never let the label blur, and never quote
  a projected number as if it were measured — especially not to an external
  evaluator, customer, or stakeholder.
- **One unit of work per session, signed off before the next begins.** Small
  increments with an explicit human approval gate beat large increments with
  an implicit one. Momentum is not evidence of correctness.

---

## 2. Session Continuity Mechanics

The single biggest failure mode in long AI-assisted projects is **context
loss between sessions** — re-deriving decisions already made, re-reading
documents already summarized, or silently drifting from a spec nobody
re-opened. The fix is a small set of files that carry state *for* the agent,
so a fresh session can resume without a human re-explaining everything.

**The pattern:**
- One **progress/handoff file** (e.g. `PROGRESS.md`) is the single source of
  session continuity: current status, what was just built, what's blocked,
  what's next, and a running **decisions log** (short, dated, one line each —
  "why we did X and not Y"). Every session starts by reading this file.
- One **pinned scope document** per major delivery unit (e.g. an MVP spec)
  that the agent is told never to re-derive from upstream source material
  (proposal PDFs, stakeholder docs, meeting notes). The pinned doc *is* the
  scope; if scope needs to change, that's a deliberate edit to the pinned
  doc, not a silent re-interpretation of the source material.
- Sub-unit specs (e.g. one per phase/sprint) are written **before**
  implementation, reference the pinned scope doc, and become the working
  contract for that unit only.
- A rule, stated explicitly in the project's agent config: *"Start every
  session by reading the handoff file, then the pinned spec. Never re-read
  the original source documents for scope."* This alone prevents the most
  expensive failure mode (re-litigating settled scope every session) and
  saves real token budget.

**Why it works:** the agent's context resets every session; the files don't.
Treat the filesystem as the persistent memory, and write to it deliberately.

---

## 3. Repo & Folder Architecture Conventions

A structure that separates concerns by *lifecycle stage* and *audience*,
not by file type:

- **Working drafts** — where new versions of anything get created. One
  subfolder per artifact category (e.g. `strategy/`, `analysis/`,
  `product/`), not one giant flat pile.
- **Curated finals / source of truth** — a separate folder holding the
  *approved* version of each artifact, promoted manually by the human, never
  auto-synced. When a document exists in both places, the agent starts from
  the curated copy, not the draft. This gives the human a deliberate
  promotion gate instead of "whichever file was touched last wins."
- **Archive** — superseded versions and duplicates go here and are never
  worked from again. Old versions are kept for history, not as a live
  reference — an agent that reads from `archive/` by accident produces
  subtly stale output.
- **Reference / read-only inputs** — source material (requirements docs,
  competitor benchmarks, research) that claims get checked against but that
  is never edited in place.
- **Build/technical work** — specs, prototypes, source code — kept separate
  from proposal/product/strategy artifacts even when they're the same
  project, because they have different registers, different audiences, and
  different lifecycles (code moves fast and gets refactored; a submitted
  proposal is frozen the moment it's submitted).
- **Harness config** (`.claude/`) — settings, rules split by concern (see
  §5), skills — kept separate from project content entirely.
- **Naming convention, stated once and followed everywhere**: e.g.
  `<Project>_<Topic>_vN.<ext>`. Versioning through the filename AND through
  git (see §6) is not redundant — the filename tells a human reader which
  version they're looking at without needing git blame.

**General principle:** every folder answers one question — "is this a draft,
a final, dead history, read-only input, or config?" — and nothing should be
ambiguous about which bucket it's in.

**Document it: the annotated structure tree.** Once the layout is decided,
write it down as a directory tree with an inline comment on every entry
explaining *what it's for* — not just its name. A folder name alone (e.g.
`phases/`) tells a reader nothing about intent; the same line with `← per-
phase working logs` does. Generic shape:

```
.
├── README.md                 ← this index
├── CLAUDE.md                 ← agent working rules + bootstrap
├── <OPERATING_MODEL>.md      ← living operating decisions (§4)
├── <SPEC>.md                 ← pinned scope / phase spec (§2)
├── decisions-log.md          ← design history
├── diagrams/                 ← interactive/visual references
│   └── *.html
├── skills/                   ← reusable agent procedures (§5)
│   └── <skill-name>/
├── integrations/              ← external system glue
│   └── <integration-name>/
├── data/                      ← sample / mock inputs only
│   ├── sample/
│   └── mock/
├── outputs/                    ← generated artefacts (not committed)
└── phases/                      ← per-phase / per-sprint working logs
    ├── phase-a-<name>/
    └── phase-b-<name>/
```

**This tree belongs at the top of every project's `README.md`, and gets
committed there before (or alongside) the first real commit of structure —
not added retroactively once the layout has already drifted.** It is a
*living* artifact (§4): update it in the same commit that adds, removes, or
repurposes a top-level folder, so it never lags what's actually on disk. A
stale structure tree is worse than none — it actively misdirects the next
reader (human or agent) into the wrong folder.

---

## 4. Build Discipline (Phase-Gated Delivery)

**The phase-spec template.** Every phase/sprint/increment gets its own spec
file, written *before* implementation, containing:
1. Objective (one paragraph, in plain language)
2. In scope / explicitly out of scope
3. Components to be built
4. Exit checks — concrete, measurable, checkable by someone who wasn't in
   the room
5. Non-functional targets (see below) alongside the functional ones
6. A sign-off date field, filled in only after approval — its emptiness is
   itself informative (this phase isn't approved yet)

**The sign-off protocol.** A phase is not "done" until, in order:
1. An end-to-end test exercises the new deliverable against a live,
   real system (not a mock, not a unit test standing in for integration).
2. The live outcome is demonstrated to the human with real data they can
   see themselves — not a summary of what happened, the actual output.
3. The human explicitly approves.

Until all three happen, the honest status is *"built, awaiting sign-off,"*
never *"complete."* This distinction matters more than it looks — an agent
under time/token pressure will drift toward calling things done on
completion of code, not completion of proof. Naming the intermediate state
explicitly resists that drift.

**Non-functional requirements are not optional extras.** Every phase spec
states explicit targets for, at minimum:
- **Throughput** — at a stated scale (record the scale, not just the number).
- **Latency** — percentiles (P50/P95/max), not just an average or a happy-path
  anecdote.
- **Scale ceiling** — what size was actually verified, distinct from what
  size the system is claimed to eventually support.
- **Resilience** — what happens across a real restart/failure of a
  dependency: zero data loss, zero duplication, checked live, not assumed
  from "the design should be idempotent."
- **Backpressure** — no stage of a pipeline may block indefinitely; define
  the bounded/drop/degrade behavior explicitly.
- **Index/query coverage** — every new hot query path ships with a matching
  index (or equivalent), confirmed via the query planner, not assumed.

Every one of these gets **measured live**, not asserted from the design. A
target that hasn't been measured is a hypothesis, and the phase isn't signed
off on hypotheses.

**Staged load, not claimed load.** Never quote a production-scale number
(10x, 100x current test scale) as a benchmark until a staged load test has
actually stepped the load up and produced it. It's fine — expected, even —
to carry a *projected* production number in a spec, as long as it's labeled
projected and distinct from the measured dev-scale anchor it's extrapolated
from.

**Living "as-built" artifacts.** At major milestones (not every phase — that
would be too frequent to be worth the cost), update a small set of "as
actually built" diagrams/docs (architecture, data model, use cases) in
place. Git history is the version record; there's no need for a versioned
snapshot of these at every boundary — that's what the frozen phase-spec
snapshots are for (see next point).

**Frozen vs. living documents — know which is which.** Some documents are
frozen at approval and never touched again (a spec once signed off, a
submitted proposal). Others are living and updated in place to track
current reality (the as-built diagrams, the progress/handoff file). Mixing
the two up — editing a frozen spec after sign-off, or version-suffixing a
living doc every time it changes — creates confusion about which copy is
authoritative. Decide which kind a document is when you create it, and say
so.

---

## 5. Harness / Agent Configuration Conventions

- **Top-level project config** (e.g. `CLAUDE.md`) states: what the project
  is, the fixed vocabulary/names that must be used exactly (module names,
  product names — pick them once, use them everywhere, never invent
  synonyms), the current stage, the register/tone expected, folder layout,
  and pointers to reference material.
- **Rules split by concern, not dumped into one file.** A harness-wide rules
  file (git policy, settings-file gotchas, budget-gate protocol) is
  distinct from a build-phase rules file (which auto-loads only when
  working under the build directory) which is distinct from a
  product/writing-register rules file. Scoped auto-loading rules stay small
  and relevant instead of one file everyone has to re-read for context that
  doesn't apply to what they're doing right now.
- **Settings-file caveat, generalized:** if your harness rewrites a config
  file from in-memory state on certain approvals, any edit to that file
  must be the *last* file operation of a turn, and must be re-verified after
  any subsequent approval in the same session — otherwise your edit gets
  silently clobbered. This is a sharp edge worth documenting the first time
  you hit it, in whatever harness you're using.
- **Skills/reusable procedures** for repeated structured tasks (drafting a
  spec, defining metrics, running the stack) beat ad-hoc re-invented
  instructions each time the same kind of task comes up.

---

## 6. Git & Version Control Policy

- **Trunk-based development on a CI-gated main**, for a solo or small-team
  project: a fast, network-free check suite runs on every push; no external
  service dependencies in CI. Branches are reserved for genuinely risky
  experiments, not default workflow.
- **Tag at sign-off, not at arbitrary points.** Each approved phase/increment
  gets an annotated tag at the commit where it was signed off. This makes
  "what did we actually ship at milestone N" a one-command lookup forever,
  instead of a git-log archaeology exercise.
- **Documents are versioned through git too**, not only code — proposal
  drafts, specs, and visuals live in the same repo and go through the same
  commit discipline. Versioning a project means versioning everything that
  changes, not just the parts a compiler cares about.
- **Commit messages say what changed and why**, never a placeholder like
  "update." A commit message is the second-cheapest form of documentation
  you'll ever produce (after the code comment) — treat it as such.
- **Never force-push, never skip hooks, never commit secrets** — table
  stakes, but worth stating in the project config explicitly so an agent
  never "helpfully" does it under pressure to unblock itself.
- **No PR flow / CD until there's a second contributor or a real deploy
  target.** Don't build process ceremony the project doesn't need yet;
  add it when the actual triggering condition (a second contributor, a
  deploy target) shows up, not preemptively.

---

## 7. Token / Cost Budget Management

This matters specifically because AI-assisted build sessions have a real,
visible cost ceiling (context window, rate limits, spend), and running out
mid-task is worse than pacing deliberately.

- **The budget gate.** Before starting a new phase, or any step estimated
  at meaningfully large cost, the agent asks for current usage stats (session
  %, weekly %), estimates the step's cost against both, states whether it
  fits, and only proceeds on explicit go. This is a standing rule stated in
  the harness config, not something re-negotiated per task.
- **Track observed burn rates** as they happen (e.g. "connector layer +
  tests + live verify: ~20% of weekly quota, ~65-70% of a session window")
  so future estimates are grounded in this project's actual cost profile,
  not a generic guess.
- **Rule of thumb once you have a few data points:** the shorter window
  (e.g. a 5-hour session cap) usually binds before the longer one (weekly).
  Plan checkpoints to fit inside one short window at a comfortable margin
  (not 100% of it), and split a unit of work into sub-checkpoints when it
  doesn't fit — better to end a session cleanly at a natural boundary than
  to run out mid-step.
- **Model-tier selection is a budget decision, not just a capability one.**
  Reserve the most expensive/highest-capability tier for the tasks that
  actually need its judgment; use a mid-tier model as the default workhorse
  for well-specified, incremental build work. State this allocation
  decision explicitly so it doesn't drift task-by-task on vibes.
- **A spend backstop (credits/overage) is not a substitute for pacing.**
  Having a financial safety net changes what happens if you go over, not
  whether you should plan to stay under.

---

## 8. Sensitivity & Identifier Hygiene

Generalized pattern, regardless of what the sensitive identifiers actually
are (a customer name, a programme codename, an NDA'd partner, PII, etc.):

- Decide, explicitly and in writing, which locations are **repo-surface**
  (anything a wider or less-trusted audience might see: READMEs, repo
  name/description, commit messages, tags, CI files, issue/PR text, code
  and code comments, build docs) versus **internal-only** (working drafts,
  curated finals, reference material, the harness config itself).
- Sensitive identifiers live **only** in internal-only locations, using
  neutral/generic phrasing everywhere repo-surface ("a customer", "the
  programme", "an evaluator") instead.
- State the rule once, prominently, in the project config — and add a
  standing check: *before pushing anything new to a repo-surface location,
  check it for these identifiers.* This is cheap insurance against the
  identifiers leaking in through a careless commit message or a code
  comment written on autopilot.
- This rule generalizes to any classification boundary — public/private,
  export-controlled/not, PII/not — the mechanism (repo-surface vs.
  internal-only, checked before every push) is the reusable part.

---

## 9. Metrics & Success-Criteria Discipline

- Every product/delivery document that makes a claim of success ties back to
  a small, explicit set of: a **north-star metric**, a **KPI tree** under
  it, **guardrails** (things that must not regress while chasing the
  north star), and **anti-metrics** (ways the number could be gamed or
  become misleading — e.g. padding a registry with dead entries to inflate
  a count).
- Every phase/increment spec **cites which metric IDs its exit checks make
  measurable.** This is what turns "we hit our exit checks" into "we hit our
  exit checks, and here's how that connects to the thing we actually
  promised to deliver" — exit checks that don't trace to a named metric are
  a sign the spec drifted from the success criteria.
- Dev-scale and production-scale numbers are **two separate ladders**, never
  silently substituted for each other in a demo claim or a stakeholder
  conversation. A number achieved in dev is a dev number until it's been
  verified at production scale.

---

## 10. Memory Practices (for agent-assisted work specifically)

If your harness supports persistent cross-session memory, use a small typed
taxonomy rather than one undifferentiated notes pile:

- **user** — who the person is: role, expertise, standing preferences.
- **feedback** — a correction or confirmed approach the person gave, with
  the *why*, so future sessions apply the pattern instead of just the
  instance.
- **project** — ongoing goals/constraints that aren't derivable from the
  code or git history (e.g. an approved scope decision, a pacing agreement).
- **reference** — pointers to external resources (dashboards, tickets, URLs).

Rules of thumb: don't persist what the repo/git history already records
(code structure, past fixes) — that's derivable on demand and stale memory
is worse than no memory. Link related memories to each other so a session
that recalls one can find its neighbors. Check for an existing memory that
already covers a fact before creating a new one; update in place rather than
duplicating. Delete memories that turn out to be wrong — a stale "fact" an
agent trusts is more dangerous than a gap it has to ask about.

---

## 11. Templates & Checklists Appendix

**Phase-spec skeleton**
```
# Phase <N> Spec: <name>

## Objective
## In scope
## Out of scope
## Components to build
## Exit checks (functional)
## Non-functional targets
- Throughput (at scale: ___)
- Latency (P50/P95/max, bar: ___)
- Scale ceiling verified: ___
- Resilience (restart/replay integrity): ___
- Backpressure behavior: ___
- Index coverage for new query paths: ___
## Sign-off
Date: ___  Approved by: ___
```

**Sign-off checklist (apply before marking anything "complete")**
- [ ] End-to-end test run against a live system, not a mock
- [ ] Live outcome shown to the approving human, with real data they can see
- [ ] Explicit approval received (not inferred from silence)
- [ ] Every NFR target in the spec measured live, not asserted
- [ ] Status file / handoff doc updated
- [ ] Tag cut at the sign-off commit (if using git)

**Budget-gate checklist (before a costly step)**
- [ ] Current usage stats obtained (short-window %, longer-window %)
- [ ] Step cost estimated against both windows
- [ ] Estimate stated back to the human, with a fit/no-fit call
- [ ] Explicit go received before proceeding

**New-project bootstrap checklist**
- [ ] Top-level project config written (what/who/stage/register/vocabulary)
- [ ] Folder layout decided and stated (draft / final / archive / reference
      / build / config), each folder's question answered
- [ ] Repo-surface vs. internal-only boundary decided, if any sensitivity
      applies
- [ ] Progress/handoff file created; first "start of session" rule written
- [ ] Git policy decided (branching, tagging, CI) and stated
- [ ] Budget-gate rule stated, if working under a cost/rate ceiling
- [ ] Success-metrics framework drafted before the first delivery unit,
      not after
- [ ] README opens with an annotated directory tree (§3); updated in the
      same commit as any top-level structure change

---

## 12. Changelog

This file is meant to evolve. Every time a new project teaches something
this playbook didn't cover, or disproves something it claimed, add a dated
entry here and edit the relevant section in place (this file has no frozen
snapshots — see §4's frozen-vs-living distinction; this document is living).

- **2026-07-22** — Initial version, extracted from the SENTINEX project
  (an 18-month on-premise AI/OSINT platform build) after MVP1 shipped and
  MVP2 was about to begin. Source patterns: PROGRESS.md session-continuity
  file, phase-spec + sign-off protocol, NFR/measured-vs-projected
  discipline, repo-surface/internal-only sensitivity split, budget-gate
  protocol, metrics north-star/KPI/guardrail/anti-metric framework, typed
  memory taxonomy.
- **2026-07-22** — Added the annotated structure-tree convention to §3
  (directory tree with an inline purpose-comment on every entry, opening
  every project's README, updated in the same commit as any top-level
  structure change) and the matching bootstrap-checklist line in §11.
  Prompted by seeing the pattern used well on an unrelated project.
- **2026-07-22** — Added flow diagrams to `PLAYBOOK.html` for §2, §3, §5,
  §6, §7, §8, §9, §10 (session boundary, document lifecycle, config
  loading hierarchy, git timeline, budget-gate decision, sensitivity
  boundary, metrics tree, memory triage). Skipped §1/§4 (no sequence to
  show / already covered by the top-of-page Process Flow) and §11/§12
  (reference and log content). Diagrams are HTML-only — this file stays
  the portable text source; if you edit a diagrammed section here, check
  whether the corresponding SVG in PLAYBOOK.html needs updating too.
