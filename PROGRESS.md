# PROGRESS.md — TAG session continuity

Single source of session continuity. Read this first every session (after
the sync gate in `.claude/rules/harness.md`), before re-deriving anything.

## Status

**Landing-page slice signed off (2026-08-23, Sonnet session).** Demoed
live (served at `localhost:4173` from the actual `landing/index.html`,
then widened the structural section max-widths from 1000–1120px to 1800px
per Nitish's request — the fixed-width containers were leaving visible
gutters on wide screens; typographic max-widths on paragraphs/hero text
were left alone since those exist for line-length readability, not
whitespace). Nitish reviewed and said "sign-off, looks good." **This is a
slice sign-off, not the Phase 1 sign-off** — `PHASE_1_SPEC.md` §9 ties
Phase 1 sign-off to all of §6's exit checks passing (full guest-to-ticket
path against a real backend), which haven't been built yet. No `phase-1`
git tag yet — `.claude/rules/build.md` reserves that for the whole-phase
sign-off. Next slice: Producer portal.

**Phase 1 implementation started: landing page slice built (2026-08-23,
Sonnet session).** First implementation slice against `PHASE_1_SPEC.md`
(per its §4 "Build sequencing" — landing page first, backend later).
Nitish asked for a "features visible but greyed out" roadmap pattern on
the landing page; added to the spec as LP-13 (implementation-level, not a
PRD change). Stack confirmed: React + Vite + TypeScript / Node + Express +
TypeScript + Prisma against Postgres 16 — added to the spec's §4.

Rather than scaffolding a fresh client from nothing, found and used the
existing `landing/index.html` (already flagged current in `CLAUDE.md`) as
the base — it's a well-built static marketing page, but was missing LP-1
(search), LP-3 (near-you), and real LP-7 (consent-gated analytics); its
`window.bmsxAnalytics` hook was also dead code (nothing ever defined that
global, so clicks tracked nowhere). Also found the 2026-08-23 BMSx→TAG
rename pass had missed this file: the nav logo and footer logo still
rendered literal "BMSx". Fixed all of it in place: TAG branding, a real
`window.tagAnalytics` with consent gating and a visible accept/decline
banner (LP-7), a structured genre+location search over a mock festival
dataset (LP-1, per spec §5's confirmed interpretation), a geolocation-with
-fallback "events near you" module (LP-3), and the LP-13 roadmap-teaser
grid (6 P1 fan-facing features, copy sourced directly from PRD §10 — no
invented copy). Verified live: installed Playwright in the scratchpad,
served the page, drove it headlessly — search returns exactly the
genre+location match (not a loose keyword match), the zero-result fallback
fires, near-you's country fallback works, roadmap renders all 6 tiles
correctly greyed with "Coming soon" badges, no BMSx text remains, zero
console errors, no horizontal overflow at 360px. Screenshots taken but not
saved into the repo (verification artifacts, not deliverables).
**Not yet done:** producer portal (spec §2's "minimal Producer portal");
no `chromium-cli` was available so a custom Playwright driver was
hand-written for this check — worth `/run-skill-generator` if landing-page
verification becomes a repeated step, per the `run` skill's own guidance.
This is one slice of Phase 1, not the whole phase — none of `PHASE_1_SPEC.md`
§6's exit checks are met yet (they need the full guest-to-ticket path
against a real backend); still "built, awaiting sign-off" at the
whole-phase level, and this slice itself hasn't been shown to Nitish yet.

**Phase 1 spec drafted, three of six open items resolved (2026-08-23,
Sonnet session).** `build/MVP1_CoreTicketing/PHASE_1_SPEC.md` exists —
objective, in/out of scope, components (modular monolith + Virtual
Queue/Ticketing & Inventory/Payments extracted per ADR-010), exit checks,
NFR targets. Not implemented, not signed off. Redis (cache tech) and the
LP-1 "semantic search" P0 interpretation are confirmed; the legacy
`client`/`server` scaffold is archived (see below). Object storage, PSP/
travel partner selection, and launch festival commitment remain open by
Nitish's choice — noted in "What's blocked / open". Ahead of the spec,
`TAG_PRD_v3.md` was created (RBAC/Platform Admin addition, see decisions
log) and is now the pinned scope doc; `TAG_PRD_v2.md` is superseded but
left in place. `TAG_Architecture_v1.md` got a small addendum
(Role/RoleAssignment/AuditLogEntry on Identity & Access;
ProducerApplication/VendorApplication/AffiliateApplication on their
owning services) — the `.html` render has not been regenerated since,
so treat it as behind the `.md` until re-rendered.

**Legacy boarding-house scaffold archived (2026-08-23).** `client/`,
`server/`, and `docker-compose.yml` moved via `git mv` to
`archive/legacy_boardinghouse_scaffold/`, closing the disposition
decision that had been open since the repo's PRD pivot. History
preserved; nothing repurposed or deleted.


**Ways-of-working scaffold in place.** The SENTINEX playbook/ways-of-working
patterns (`References/`) have been adapted into `CLAUDE.md` and
`.claude/rules/{harness,build,product}.md`, plus the folder scaffold
(`build/`, `archive/`). No PRD-driven build work has started yet — that
begins once Nitish nudges to proceed and Phase 1 gets scoped and specced
under `build/`.

**Architecture drafted (2026-08-23).** `TAG_Architecture_v1.md` and its
local rendered companion `TAG_Architecture_v1.html` now exist — six views
(system context, containers, domain/data model, critical-path sequences for
J1 and J2, cross-cutting concerns, decisions) derived from `TAG_PRD_v2.md`.
Draft, not signed off. Both decisions it was waiting on closed on 2026-08-23
(ADR-010 and the rename); Phase 1 scoping is the next step.

**Renamed to TAG (2026-08-23).** The repo-wide BMSx→TAG pass has run —
PRD (now `TAG_PRD_v2.md`), `CLAUDE.md`, `.claude/rules/*`, `README.md`,
`landing/` and the architecture doc. BMSx survives only as historical
record: this decisions log, `archive/` filenames, the `BMSx-synced` working
directory and the `nitishiot/BMSx` remote.

**Repo sync status (as of 2026-08-23, commit `6e964ec`):** local `main`,
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
  ADRs (all ten accepted), twelve consolidated TBDs. No
  technology, cloud, or vendor is named — deliberately deferred to the
  phase spec.
- **PRD reconciliation.** `References/TAG_PRD_v1.md` (a fuller product PRD
  that arrived via the `References/` copy, still under this repo's
  now-retired "TAG" name) was identified as a superset of the original
  `BMSx_PRD.md` — same market/revenue data, plus goals, personas, non-goals,
  landing-page requirements, user journeys, architecture, prioritised user
  stories, P0/P1/P2 requirements, success metrics, open questions, and a
  consolidated TBD list. Promoted to `TAG_PRD_v2.md` as the new pinned scope
  doc (briefly named `BMSx_PRD_v2.md`, until the rename of the same day
  reinstated TAG); the original moved to
  `archive/BMSx_PRD_v1_business_source.md` via `git mv` (history preserved).

## What's blocked / open

- **Sensitivity classification (open).** `archive/BMSx_PRD_v1_business_source.md`
  carries founder names; both PRDs carry financial figures. Both live in a
  public repo; repo-surface vs. internal-only hasn't been decided for this
  project. See `CLAUDE.md`.
- **Three of `PHASE_1_SPEC.md` §8's items stay open by Nitish's choice**
  (2026-08-23): object storage product (blocked on an unmade cloud/vendor
  decision, PRD §12 Q2 territory), PSP/travel-accommodation partner
  selection, launch festival/partner commitment. Build proceeds against
  the spec's stated TBDs/adapters meanwhile — these gate specific exit
  checks (§6 of the spec), not the start of implementation.

## Next steps

1. **Active: build the minimal Producer portal** (spec §2/§4) — React+
   Vite+TS, reusing the `TAG_FEATURE_MANIFEST` pattern from
   `landing/index.html` for its own `audience: 'producer'` roadmap tiles
   (Premium analytics, demand prediction, customer data access, marketing
   services — already present in the manifest, just unfiltered by the
   portal yet). Landing-page slice is signed off (see Status/decisions
   log) — this is the next slice in the sequence.
2. Then the core-ticketing backend (Identity & Access, Event & Catalogue,
   Virtual Queue, Ticketing & Inventory, Orders & Cart, Payments) — the
   landing page's search/near-you currently read `MOCK_FESTIVALS`; that's
   the seam where real API calls replace the mock once the backend exists.
3. The three open items (object storage, PSP/travel partner, launch
   festival) still need resolving before the exit checks that depend on
   them (spec §6, checks 3–4) — not before backend build starts.
4. Regenerate `TAG_Architecture_v1.html` from the `.md` next session that
   touches it — several sessions have now edited the `.md` only.
5. Open, not blocking: repo-surface classification (founder names, financial
   figures in a public repo), and whether the `BMSx-synced` folder and
   `nitishiot/BMSx` remote get renamed too — both deliberately left alone by
   the rename pass.

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
- **2026-08-23** — The 2026-08-23 decision above recorded that the local
  fetch refspec had been widened so `git fetch origin` picks up `main`. It
  had not persisted: `remote.origin.fetch` was still scoped to only the
  session branch, so `origin/main` went stale and the sync gate reported a
  false `1 0` divergence immediately after a successful push to `main`.
  Actually widened it this time (`+refs/heads/*:refs/remotes/origin/*`) and
  verified `0 0` after a fresh fetch. Lesson: the sync gate must verify the
  refspec, not just run `git fetch` — a narrow refspec makes the gate report
  confidently wrong answers.
- **2026-08-23** — Architecture v1 reviewed by Nitish: the HTML render was
  confirmed working (Mermaid diagrams draw correctly), closing the one
  item this session could not verify itself. The document remains a **draft,
  not signed off** — sign-off per `.claude/rules/build.md` needs the two
  open decisions resolved first. Nitish chose to take those decisions in the
  next session rather than this one, and to run that session on Sonnet, since
  writing a phase spec against an already-written architecture is
  well-specified work rather than judgement-heavy synthesis.
- **2026-08-23** — **ADR-010 decided: modular monolith with Virtual Queue,
  Ticketing & Inventory and Payments extracted**, in preference to the PRD
  §8 target of thirteen independently deployed serverless services. Reason:
  thirteen deploy pipelines before the first ticket sells is cost without
  benefit at current team size; ADR-005's one-owner-per-entity rule keeps
  later extraction cheap. ADR-010 moved from Open to Accepted in
  `TAG_Architecture_v1.md`/`.html`; the phase spec's component structure
  follows from it.
- **2026-08-23** — **BMSx→TAG rename pass run repo-wide**, closing the
  contradiction logged earlier the same day. Renamed: `BMSx_PRD_v2.md` →
  `TAG_PRD_v2.md` (via `git mv`), plus product-name occurrences in
  `CLAUDE.md`, `.claude/rules/{product,harness,build}.md`, `README.md`,
  `landing/index.html` and both architecture files. The vocabulary rule in
  `product.md` was inverted by hand, not substituted (`**BMSx** (never
  "TAG")` → the reverse). **Deliberately not renamed:** `client/`, `server/`
  (under the do-not-touch rule until their own decision lands),
  `archive/BMSx_PRD_v1_business_source.md` (superseded; renaming it would
  also collide with `References/TAG_PRD_v1.md`), the `BMSx-synced` folder and
  the `nitishiot/BMSx` remote (renaming either breaks working directories and
  every existing clone URL — Nitish's separate call), and the entries in this
  log, which are a record of what was decided when.
- **2026-08-23** — Budget gate answered: session and weekly usage both under
  45%. Model tier: Opus for the rename pass, because the inversions
  (`**BMSx** (never "TAG")`) and the judgement about which occurrences are
  historical record would go wrong under a blind substitution. Phase-1 spec
  work drops to Sonnet, per the original plan.
- **2026-08-23 (Sonnet session)** — Nitish asked to add RBAC with a Platform
  Admin role (approves vendors/producers/affiliates onto the platform;
  explicitly not end-user account management) ahead of the Phase 1 spec.
  Since no admin persona or RBAC requirement existed in `TAG_PRD_v2.md`,
  this was scope-change territory per `CLAUDE.md`'s spec-handling rule, so
  Nitish was asked how to capture it rather than silently folding it into
  the phase spec. He chose **amend the PRD first**: `TAG_PRD_v3.md` created
  (P6 Platform Admin persona, J7 approval journey, PR-1 RBAC requirement in
  §10, one new TBD on admin staffing/SLA) and promoted to pinned scope doc;
  all "pinned PRD" pointers repo-wide (`CLAUDE.md`, `.claude/rules/{harness,
  product}.md`, `README.md`) repointed from v2 to v3. `TAG_PRD_v2.md` is
  superseded but not moved to `archive/` yet (small enough diff, and v2 is
  still useful as a diff base). `TAG_Architecture_v1.md`'s View 3 ownership
  map got a matching addendum (Role/RoleAssignment/AuditLogEntry on Identity
  & Access; a ProducerApplication/VendorApplication/AffiliateApplication
  per owning service, keeping ADR-005's one-owner rule) since it was still
  draft/unsigned and editing in place was cheaper than a v2 architecture doc
  for a five-entity addition — flagged inline as following PR-1/P6/J7.
- **2026-08-23 (Sonnet session)** — Database choice for Phase 1: **PostgreSQL
  16**, one schema per monolith module plus its own instance for each of the
  three ADR-010-extracted services (Virtual Queue, Ticketing & Inventory,
  Payments). Reason: `TAG_Architecture_v1.md` View 2 already specifies
  "relational stores, per-service schemas"; Ticketing & Inventory's
  no-oversell requirement (ADR-007) needs real transactional guarantees a
  relational engine gives directly; the repo's legacy (unrelated,
  do-not-touch) scaffold already runs `postgres:16-alpine` in
  `docker-compose.yml`, which is noted only as existing tooling familiarity
  in the repo — not a reason to reuse any of that scaffold's code. Redis
  was proposed for the Virtual Queue/Inventory hot-counter cache but flagged
  `[TBD: confirm before implementation]` since nothing in the repo runs it
  yet — this is a proposal, not a made decision, unlike Postgres.
- **2026-08-23 (Sonnet session)** — Phase 1 spec drafted:
  `build/MVP1_CoreTicketing/PHASE_1_SPEC.md`, scoped against `TAG_PRD_v3.md`
  §13/§10/§6.1 and PR-1. Six open items flagged in the spec's §8 (cache
  tech, object storage product, LP-1 semantic-search interpretation, PSP/
  travel partner selection, launch festival commitment, legacy-scaffold
  disposition) — none block writing the spec, several block starting
  implementation. Not signed off; per `.claude/rules/build.md` status is
  "spec drafted," not "built."
- **2026-08-23 (Sonnet session)** — Worked through the Phase 1 spec's six
  open items with Nitish. **Resolved:** Redis confirmed as the Virtual
  Queue/Inventory cache technology (was a proposal, now decided);
  LP-1's "semantic search" P0 interpretation (Postgres full-text search,
  not a trained NLP model) confirmed; legacy `client`/`server`/
  `docker-compose.yml` scaffold archived to
  `archive/legacy_boardinghouse_scaffold/` via `git mv` — closes the
  disposition decision open since the PRD pivot. **Left open, by choice:**
  object storage product (genuinely blocked — no cloud provider named for
  anything in the platform yet, naming one just for object storage would
  be a decision made in isolation), PSP/travel-accommodation partner
  selection, and launch festival/partner commitment — all three are
  commercial/partnership calls with no evidence in this repo to draw on,
  and the spec's ADR-004 port/adapter pattern means build isn't blocked by
  leaving them TBD.
- **2026-08-23 (Sonnet session)** — Archiving the legacy scaffold: updated
  `CLAUDE.md`, `README.md`, and `archive/README.md`'s do-not-touch/open-
  decision language to reflect the archive; updated `.gitignore`'s
  `server/prisma/dev.db` entry to the new
  `archive/legacy_boardinghouse_scaffold/server/prisma/dev.db` path.
  README's setup instructions for the boarding-house app were dropped
  (its own commands referenced the old top-level paths) rather than
  rewritten for a path nobody should be running from.
- **2026-08-23 (Sonnet session)** — Discovered `.gitignore` had a blanket
  `build/` rule from the legacy scaffold's boilerplate. It was dead weight
  for its stated purpose (neither `client/`'s Vite build nor `server/`'s
  tsc build outputs to a directory literally named `build/` — both use
  `dist/`, already covered by its own rule) but was silently swallowing
  this repo's real `build/` phase-spec folder: `git log --all -- build/`
  showed **`build/README.md` had never actually been committed**, despite
  `PROGRESS.md`'s "What's built so far" list claiming it was, since the
  2026-08-23 scaffold session. Removed the `build/` line from `.gitignore`.
  `build/README.md` and this session's `build/MVP1_CoreTicketing/
  PHASE_1_SPEC.md` are now visible to `git status` for the first time and
  need to actually be committed and pushed before this session ends.
- **2026-08-23 (Sonnet session)** — Nitish asked to continue implementation
  in-session and to add a "features visible but greyed out" pattern to
  "the dashboard," clarified as the landing page. Confirmed stack (React+
  Vite+TS client, Node+Express+TS+Prisma server, matching the Postgres
  choice) and added it plus the greyed-tile pattern (as LP-13) to
  `PHASE_1_SPEC.md` before writing code, per "spec before code." Chose to
  extend the existing `landing/index.html` rather than scaffold a fresh
  React landing page, since `CLAUDE.md` already names it current and it's
  a strong, working asset — a static page also serves LP-4's performance
  budget better than adding framework overhead for a page that's mostly
  marketing content. React+Vite is still the plan for the Producer portal
  and Platform Admin console, which don't exist yet and need real
  interactivity/auth. Found and fixed two pre-existing bugs while there:
  the BMSx→TAG rename pass (logged 2026-08-23 above) had missed this file
  entirely (literal "BMSx" still in the nav and footer logos), and its
  analytics hook (`window.bmsxAnalytics`) was dead code that nothing ever
  defined. See PROGRESS.md → Status for what got built and verified.
- **2026-08-23 (Sonnet session)** — Landing-page slice demoed to Nitish two
  ways: first a published Artifact copy (content identical to
  `landing/index.html`, minus the outer `<html>/<head>/<body>` the
  Artifact wrapper supplies, `localStorage` calls wrapped in `try/catch`
  for the artifact sandbox — scratchpad-only, not committed to the repo),
  then — on request — the actual file served at `localhost:4173` via a
  plain Node static server, since Nitish wanted to view it locally rather
  than as a Claude-hosted link. While reviewing at a wide viewport, asked
  to remove the visible left/right gutters; widened `.banners`,
  `.platform-inner`, `.plans-inner`, `.roadmap-inner` from their
  1000–1120px caps to 1800px, leaving the hero/paragraph/search-box
  max-widths untouched (those keep body text at a readable line length,
  not artificial whitespace — conflating the two would have hurt
  readability to chase a width complaint that wasn't about them).
  Signed off after that fix. Per `.claude/rules/build.md`'s protocol (real
  run shown live, then explicit approval) — this closes both remaining
  steps for the landing-page slice specifically, not for Phase 1 as a
  whole (see Status).
