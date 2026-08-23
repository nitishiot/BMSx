# CLAUDE.md — TAG

Agent working rules for this repo. Adapted from `References/PLAYBOOK.md` and
`References/SENTINEX_WaysOfWorking_v1.html` (the SENTINEX project's ways of
working), scaled down for a small/solo project at an earlier stage.

**Auto-loaded alongside this file** (Claude Code's `@import` syntax pulls
these into context at session start — no manual "please read X" needed):

@PROGRESS.md
@.claude/rules/harness.md
@.claude/rules/build.md
@.claude/rules/product.md

Even so, this is context, not a hook — nothing here forces the first tool
call to actually be `git fetch origin main`. Treat the imports as removing
the excuse "I didn't see it," not as a guarantee the sync/budget gates ran.
If a session ever skips them, that's worth a decisions-log entry in
`PROGRESS.md` so the gap gets noticed, same as any other miss.

## What this project is

**TAG** — a full-stack **festival ticketing & 360° experience platform**
(ticketing, travel, accommodation, dining, merchandise, social/fan
engagement, vendor management). Scope is defined in the pinned PRD,
`TAG_PRD_v3.md` (v3, product/build spec — goals, personas, journeys,
architecture, P0/P1/P2 requirements; v3 adds the Platform Admin persona and
an RBAC requirement over v2). `archive/BMSx_PRD_v1_business_source.md`
is the earlier business/investor-facing doc (market, revenue model, funding)
that v2/v3 draw their market and revenue data from — read v3 for scope, not v1.
`TAG_PRD_v2.md` is superseded but kept in place (not yet moved to `archive/`).

**Fixed vocabulary — use exactly, never invent synonyms:**
- **TAG** — the product/company name. (The repo carried the interim name
  "BMSx" between 2026-08-23 and the rename pass of the same date; that name
  is retired — never reintroduce it. Historical decisions-log entries and
  `archive/` filenames keep it deliberately, as a record of what was.)
- **Festival Goers** — B2C end users / attendees.
- **Festival Clients & Suppliers** — B2B side: festival producers/promoters,
  local vendors, artists/management, local government & tourism boards.
- Domain nouns from the PRD (Festival, Ticket, Booking, Vendor, Merchandise,
  Rewards Points) — use the PRD's terms verbatim; don't rename them ad hoc
  when building.

## Current stage

**Phase 1 implementation underway.** `TAG_PRD_v3.md` and
`TAG_Architecture_v1.md` are drafts (not yet signed off), but Phase 1
itself (`build/MVP1_CoreTicketing/PHASE_1_SPEC.md`) is being built slice
by slice per its own sign-off protocol. Landing page slice: signed off.
Producer portal slice: built, awaiting sign-off. Core-ticketing backend:
not started. See `PROGRESS.md` → Status/Next steps for the live picture —
it's the authority on what's actually built, this paragraph is a summary.

**Legacy scaffold — archived.** The unrelated boarding-house/PG management
app (rooms, boarders, rent) from the repo's initial scaffold, before the
PRD pivot, was moved to `archive/legacy_boardinghouse_scaffold/` on
2026-08-23 (Nitish's decision, closing the open item from the same day —
see `PROGRESS.md` decisions log). Nothing is built on top of it or worked
from it — same as everything else in `archive/`. `landing/` (the static
landing page) is current and does match the PRD's product.

## Folder layout

```
BMSx-synced/
├── README.md              ← project overview; opens with this same annotated tree
├── CLAUDE.md               ← this file — agent working rules + bootstrap
├── PROGRESS.md             ← session continuity: status, next steps, decisions log
├── TAG_PRD_v3.md           ← pinned scope doc (v3, draft) — see "Spec handling" below
├── TAG_PRD_v2.md           ← superseded by v3 (adds Platform Admin persona + RBAC); kept in place, not archived yet
├── TAG_Architecture_v1.md   ← platform architecture (v1, draft) — derived from the PRD
├── TAG_Architecture_v1.html ← local rendered view of the same document
├── .claude/
│   └── rules/
│       ├── harness.md      ← session mechanics: sync gate, git/repo guardrails
│       ├── build.md        ← phase-spec template, sign-off protocol, git/tag policy
│       └── product.md      ← product register/tone, vocabulary, spec-handling rules
├── References/              ← read-only inputs, never edited in place
│   ├── PLAYBOOK.md                    ← domain-agnostic ways-of-working source
│   └── SENTINEX_WaysOfWorking_v1.html ← the process this file is adapted from
├── build/                   ← phase specs, one subfolder per MVP, written before implementation
│   ├── README.md            ← the phase-spec convention
│   └── MVP1_CoreTicketing/
│       └── PHASE_1_SPEC.md  ← Phase 1 spec, awaiting sign-off (not yet implemented)
├── archive/                  ← superseded versions; never worked from again
│   ├── README.md
│   ├── BMSx_PRD_v1_business_source.md  ← superseded by TAG_PRD_v2.md; kept as the source of market/revenue data
│   └── legacy_boardinghouse_scaffold/  ← former client/, server/, docker-compose.yml (see above)
├── landing/                  ← static landing page — current, matches the PRD
└── client/                   ← Producer portal (Phase 1 slice, React+Vite+TS) — current, not legacy
```

Update this tree (here and in `README.md`) in the same commit that adds,
removes, or repurposes a top-level folder.

## Spec handling

`TAG_PRD_v3.md` is the **pinned scope document**. Once a build phase
begins, work from it directly — don't re-derive scope from the original
Corporate Presentation or from the superseded `archive/BMSx_PRD_v1_business_source.md`
(useful only as historical business context: market sizing, revenue-split
model, funding/exit strategy). If scope needs to change, that's a
deliberate edit to the PRD (new version, see naming convention below), not
a silent re-interpretation during a build session.

## Naming convention

`TAG_<Topic>_vN.<ext>` for documents (e.g. `TAG_PRD_v3.md` for the next
PRD revision). Never overwrite an existing versioned doc in place — save as a new
`_vN` and leave the prior version untouched (superseded versions eventually
move to `archive/`, promoted there deliberately, not auto-synced).

## Standing rules (see `.claude/rules/*.md` for full detail)

- **Sync gate first.** `git fetch origin main` is the first tool call of
  every session before reading or claiming any status.
- **Budget gate every session.** Ask Nitish for current usage stats
  (session %, weekly %) at session start and before any costly step; state
  fit against both before proceeding. See `.claude/rules/harness.md`.
- **Spec before code.** No implementation without a written phase spec.
- **Live verification over assertion.** "Should work" isn't done; a real,
  demonstrable run is.
- **One phase per session, signed off before the next begins.**
- **Never force-push, never skip hooks, never commit secrets.**
- **Trunk-based on `main`**, tag at sign-off. No PR/CD ceremony until there's
  a second contributor or a real deploy target.

## Sensitivity — open item

`archive/BMSx_PRD_v1_business_source.md` names two proprietors (Ila
Nicholson & Shane Mitchell) and carries funding targets and exit-strategy
detail; `TAG_PRD_v3.md` (and the superseded v2) still carries the revenue-split model (45%/21%/17%/17%).
Both live in a **public** GitHub repo (`nitishiot/BMSx`). The playbook's
repo-surface / internal-only split (§8) hasn't been explicitly decided for
this project. Flagged here as `[TBD: repo-surface classification for
founder names & financial figures]` — raise with Nitish before either
document becomes submission-bound or externally shared.

## Memory taxonomy

If using persistent cross-session memory: **user** (Nitish's role/prefs —
see global `~/CLAUDE.md`), **feedback** (corrections/confirmed approaches,
with why), **project** (TAG-specific goals/constraints not derivable from
code/git), **reference** (pointers to external resources). Don't persist
what git/the repo already records.
