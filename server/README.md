# TAG — Core-ticketing backend (Phase 1 slice)

First backend slice against `build/MVP1_CoreTicketing/PHASE_1_SPEC.md` §2/§4:
**Identity & Access** (Account, Role, RoleAssignment, Session, AuditLogEntry)
and the **Producer application → Platform Admin approval → free-tier event
setup** path (J7, PR-1). Node.js + Express + TypeScript + Prisma against
PostgreSQL 16, per the spec's confirmed stack. Redis, Virtual Queue,
Ticketing & Inventory, Orders & Cart, and Payments are **not built yet** —
later slices.

Two Postgres schemas in one Phase-1 instance, per ADR-005 (one owning
service per entity) and the spec's "one schema per module": `identity`
(Account/Role/RoleAssignment/Session/AuditLogEntry) and `catalogue`
(ProducerApplication/Festival). No foreign key crosses that boundary —
`ProducerApplication.accountId` and `Festival.producerAccountId` are plain
UUID columns, validated in application code, not the database.

**Auth is deliberately minimal for this slice**, not a finished Identity &
Access service: a bearer token is minted on producer-application submission
(`POST /api/producer-applications`) or admin login
(`POST /api/admin-auth/login`), stored in the `identity.Session` table. No
password, SSO, or MFA — that's real Identity & Access work the spec doesn't
require until a later slice. Admin login only succeeds for an account that
already holds the seeded `platform_admin` role (see `npm run seed`).

## Run it

Own Postgres 16 + Redis containers on non-default ports (`5433`/`6380`),
kept separate from any other project's containers already running on this
machine:

```bash
docker compose up -d
npm install
cp .env.example .env   # already present with matching defaults
npx prisma migrate dev --name init   # first run only
npm run seed                          # roles + platform_admin@tag.local
npm run dev                           # http://localhost:4000
```

## Routes

- `POST /api/producer-applications` — submit (creates Account + Session, returns bearer token)
- `GET /api/producer-applications/me` — own application status
- `GET /api/producer-applications/me/audit-log` — own audit trail (scoped to own application ids)
- `POST /api/festivals` — create (requires `producer` role)
- `GET /api/festivals/mine` — list own festivals only (RBAC exit check 7)
- `POST /api/admin-auth/login` — mint an admin session (requires existing `platform_admin` role assignment)
- `GET /api/admin/producer-applications?status=pending` — approval queue
- `POST /api/admin/producer-applications/:id/decision` — approve/reject, writes an `AuditLogEntry`, grants the `producer` `RoleAssignment` on approval
- `GET /api/admin/audit-log` — full audit trail

## Not built in this slice

Event & Catalogue (beyond Festival), Virtual Queue, Ticketing & Inventory,
Orders & Cart, Payments & Fees, Ancillary Bookings, Consent & Privacy,
Notifications — see `PHASE_1_SPEC.md` §2 for the full Phase 1 scope.
