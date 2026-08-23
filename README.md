# BMSx

A full-stack **festival ticketing & 360° experience platform** — ticketing,
travel, accommodation, dining, merchandise, and fan/social engagement under
one platform. Product scope is defined in [`BMSx_PRD_v2.md`](BMSx_PRD_v2.md)
(pinned, v2, draft — not yet signed off). The original business/investor-facing
PRD is archived at [`archive/BMSx_PRD_v1_business_source.md`](archive/BMSx_PRD_v1_business_source.md).

**Current stage:** pre-build. See [`PROGRESS.md`](PROGRESS.md) for live
status and [`CLAUDE.md`](CLAUDE.md) for the working rules this repo follows.

## Project structure

```
BMSx-synced/
├── README.md              ← this file — opens with this same annotated tree
├── CLAUDE.md               ← agent working rules + bootstrap
├── PROGRESS.md             ← session continuity: status, next steps, decisions log
├── BMSx_PRD_v2.md          ← pinned scope doc (v2, draft)
├── .claude/
│   └── rules/
│       ├── harness.md      ← session mechanics: sync gate, git/repo guardrails
│       ├── build.md        ← phase-spec template, sign-off protocol, git/tag policy
│       └── product.md      ← product register/tone, vocabulary, spec-handling rules
├── References/              ← read-only inputs, never edited in place
│   ├── PLAYBOOK.md                    ← domain-agnostic ways-of-working source
│   └── SENTINEX_WaysOfWorking_v1.html ← the process CLAUDE.md is adapted from
├── build/                   ← phase specs, one subfolder per MVP, written before implementation
├── archive/                  ← superseded versions; never worked from again
│   └── BMSx_PRD_v1_business_source.md  ← superseded by BMSx_PRD_v2.md
├── landing/                  ← static landing page — current, matches the PRD
├── client/                   ← LEGACY — pre-PRD-pivot boarding-house scaffold, disposition TBD
├── server/                   ← LEGACY — pre-PRD-pivot boarding-house scaffold, disposition TBD
└── docker-compose.yml        ← LEGACY — Postgres for the boarding-house scaffold
```

This tree is updated in the same commit as any top-level structure change.

---

## Legacy scaffold (`server/`, `client/`, `docker-compose.yml`)

The sections below describe a **boarding-house/PG management app** — an
unrelated scaffold from before the repo pivoted to the BMSx festival
platform described in `BMSx_PRD_v2.md`. Kept as-is pending a decision on its
disposition (see `PROGRESS.md`). Do not treat this as the current product.

### Stack

- **Server**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL
- **Client**: React, TypeScript, Vite, React Router

## Getting started

### 1. Database

Start a local Postgres instance:

```bash
docker compose up -d
```

### 2. Server

```bash
cd server
cp .env.example .env
npm install
npm run prisma:migrate   # creates tables
npm run seed             # optional sample data
npm run dev              # http://localhost:4000
```

### 3. Client

```bash
cd client
npm install
npm run dev               # http://localhost:5173
```

The client dev server proxies `/api/*` requests to the server on port 4000.

## API overview

| Method | Path                         | Description                  |
|--------|------------------------------|-------------------------------|
| GET    | /api/rooms                   | List rooms with occupants     |
| POST   | /api/rooms                   | Create a room                 |
| GET    | /api/boarders                | List boarders                 |
| POST   | /api/boarders                | Create a boarder              |
| POST   | /api/boarders/:id/checkout   | Check a boarder out            |
| GET    | /api/payments                | List payments                 |
| POST   | /api/payments                | Create a payment (rent due)   |
| POST   | /api/payments/:id/mark-paid  | Mark a payment as paid        |
| GET    | /api/dashboard/summary       | Occupancy & payment summary   |

## Data model

- **Room** — number, floor, capacity, monthly rent, status (available/full/maintenance)
- **Boarder** — name, contact info, assigned room, check-in/out dates, status
- **Payment** — amount, due date, paid date, status (pending/paid/overdue), linked to a boarder
