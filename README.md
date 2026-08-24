# TAG

A full-stack **festival ticketing & 360° experience platform** — ticketing,
travel, accommodation, dining, merchandise, and fan/social engagement under
one platform. Product scope is defined in [`TAG_PRD_v3.md`](TAG_PRD_v3.md)
(pinned, v3, draft — not yet signed off; supersedes `TAG_PRD_v2.md`, kept in
place). The original business/investor-facing
PRD is archived at [`archive/BMSx_PRD_v1_business_source.md`](archive/BMSx_PRD_v1_business_source.md).

**Current stage:** pre-build. See [`PROGRESS.md`](PROGRESS.md) for live
status and [`CLAUDE.md`](CLAUDE.md) for the working rules this repo follows.

## Project structure

```
BMSx-synced/
├── README.md              ← this file — opens with this same annotated tree
├── CLAUDE.md               ← agent working rules + bootstrap
├── PROGRESS.md             ← session continuity: status, next steps, decisions log
├── TAG_PRD_v3.md           ← pinned scope doc (v3, draft)
├── TAG_PRD_v2.md           ← superseded by v3; kept in place, not archived yet
├── TAG_Architecture_v1.md   ← platform architecture (v1, draft) — 6 views + ADRs
├── TAG_Architecture_v1.html ← same content, rendered for reading (Mermaid via CDN)
├── TAG_InternalOps_v1.md    ← internal staff RBAC/dashboard console spec (v1, draft) — separate system, not a PRD phase
├── .claude/
│   └── rules/
│       ├── harness.md      ← session mechanics: sync gate, git/repo guardrails
│       ├── build.md        ← phase-spec template, sign-off protocol, git/tag policy
│       └── product.md      ← product register/tone, vocabulary, spec-handling rules
├── References/              ← read-only inputs, never edited in place
│   ├── PLAYBOOK.md                    ← domain-agnostic ways-of-working source
│   └── SENTINEX_WaysOfWorking_v1.html ← the process CLAUDE.md is adapted from
├── build/                   ← phase specs, one subfolder per MVP, written before implementation
│   └── MVP1_CoreTicketing/PHASE_1_SPEC.md  ← Phase 1 spec, awaiting sign-off
├── archive/                  ← superseded versions; never worked from again
│   ├── BMSx_PRD_v1_business_source.md  ← superseded by TAG_PRD_v2.md
│   └── legacy_boardinghouse_scaffold/  ← former client/, server/, docker-compose.yml (see below)
├── landing/                  ← static landing page — current, matches the PRD
├── client/                   ← Producer portal + Platform Admin console (Phase 1 slice, React+Vite+TS)
└── server/                   ← core-ticketing backend (Phase 1 slice, Node+Express+TS+Prisma/Postgres)
```

This tree is updated in the same commit as any top-level structure change.

---

## Producer portal + Platform Admin console (`client/`) and core-ticketing backend (`server/`)

Phase 1 slice — see `client/README.md`, `server/README.md`, and
`build/MVP1_CoreTicketing/PHASE_1_SPEC.md` §2/§4. `client/` now calls a real
backend (`server/`, Node+Express+TS+Prisma/Postgres) instead of the
localStorage simulation the first client-only slice used — Identity &
Access (Account/Role/RoleAssignment/AuditLogEntry), producer application →
Platform Admin approval → free-tier event setup, all against a real
database. Most of Phase 1's other backend modules (Event & Catalogue
beyond Festival, Virtual Queue, Ticketing & Inventory, Orders & Cart,
Payments) aren't built yet. No relation to the archived boarding-house
`client/`/`server/` below; these are fresh apps at the same paths, current
and in active development.

## Legacy scaffold (archived)

`archive/legacy_boardinghouse_scaffold/` holds a **boarding-house/PG
management app** (Node/Express/Prisma/PostgreSQL server, React/Vite
client) — an unrelated scaffold from before the repo pivoted to the TAG
festival platform described in `TAG_PRD_v3.md`. Archived 2026-08-23
(`PROGRESS.md` decisions log); not the current product, not worked from,
not built on top of. Its own setup instructions, if ever needed, are
preserved in its git history at the pre-archive `client/`/`server/` paths.
