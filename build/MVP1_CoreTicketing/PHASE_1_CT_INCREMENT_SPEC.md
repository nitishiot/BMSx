# Phase 1 CT — Increment Spec: event visibility (Internal Ops roster + fan "My tickets")

**Status:** spec drafted 2026-08-24 (Opus session) — **not built**, awaiting
Nitish's review, per `.claude/rules/build.md`'s spec-before-code rule.
**Author:** drafted with Claude (Opus 5), 24 August 2026.
**Relationship to `PHASE_1_CT_SPEC.md`:** a **scope addition**, not a
replacement, per the `_INCREMENT` naming rule in `.claude/rules/build.md`.
Everything below assumes that spec's already-built Event & Catalogue,
Ticketing & Inventory and Orders & Cart modules, and
`PHASE_1_IO_SPEC.md`'s `OrgRole`/`Capability`/`StaffProfile` model.
**Tag reserved for sign-off:** none of its own — it rolls up into
`PHASE_1_CT_SPEC.md` §9's eventual whole-phase sign-off.

---

## 1. Objective

Events exist in the platform but nobody can see them as a set. A producer
sees only their own festivals; a fan sees only the festival page they
navigated to; Internal Ops has no view of what is actually on sale across
the platform at all; and a fan who has bought a ticket has no way back to
it once they close the confirmation screen — the QR is rendered once and
then unreachable. This increment adds the two views that close that: a
capability-gated **all-events roster** for Internal Ops, and a **"My
tickets"** page for the person who bought the tickets.

## 2. In scope

### 2.1 CT-15 — Internal Ops all-events roster (read-only)

- New capability `view_all_events` — *"View every festival and event
  across all producers, with allocation and sales counts."* Seeded to
  **Founder & Managing Director** and **Head of Product Development**,
  matching the two-role pattern `manage_org`/`view_survey_responses`
  already use. **VP Ticketing Strategy** is the natural third holder; no
  staff login is seeded for that role today, and when one exists the
  capability is grantable through the existing `manage_org` console UI
  with no code change — which is the genericity `PHASE_1_IO_SPEC.md` §8's
  exit check 4 already proves, not new work.
- New endpoint `GET /api/internal-ops/events`, gated on that capability
  (403 without it, 401 unauthenticated — same pattern as `/org-chart`).
  Returns, for every Festival on the platform: festival name, producer
  account (id + email), each Event with its Venue (name/city/country) and
  start/end, each Zone, and each TicketType with `priceMinorUnits`,
  `currency`, allocation `total`/`remaining`, and issued-ticket count.
- New Internal Ops console tab **"All events"**, rendered from the
  server-resolved `navLinks` array like every other tab (never a
  client-side capability→link map) — `view_all_events` maps to
  `{ key: 'all-events', label: 'All events' }` in `internalOps/auth.ts`'s
  `NAV_LINKS_BY_CAPABILITY`.

### 2.2 CT-16 — Fan "My tickets"

- New endpoint `GET /api/account/tickets`, requires a session; returns
  **only the caller's own** orders — the account id comes from the
  session, never from a request parameter (same structural rule as
  `/festivals/mine`).
- New page `/tickets` in `client/`: every event the signed-in person
  holds tickets for — festival, session (Event) + venue, zone, ticket
  type, order total, and **each ticket's QR re-rendered** client-side
  from its `qrCode` token with the same `qrcode` package `FestivalPage`
  already uses. Empty state links to Browse Festivals.
- `/tickets` joins the server-resolved `portals` list in
  `server/src/routes/auth.ts`'s `resolvePortals` for any signed-in
  account, so it appears in the Portals menu on every surface.
- The confirmation screen's action row gains a link to `/tickets` when
  the buyer is signed in, beside the two pills added on 2026-08-24.

### 2.3 Which orders count as "mine" (the non-obvious part)

Checkout is guest-capable: `orders.Order` carries a nullable `accountId`
**and** a `guestEmail`. So "my tickets" resolves as:

1. every order with `accountId = <session account>`; **plus**
2. every order whose `guestEmail` equals the account's email — **only if
   `Account.emailVerifiedAt` is non-null.**

Condition (2) is what lets a fan who checked out as a guest and
registered afterwards still find their tickets. The verified-email guard
is not decoration: without it, registering with an email someone else
used at guest checkout would hand over their tickets. Registration does
not currently verify email (`POST /auth/register` issues a session
immediately; verification exists only on the LP-14 survey path), so in
practice most self-registered accounts will match rule (1) only, until
email verification is wired into registration — **a real gap, stated
rather than assumed away** (see §5).

### 2.4 IO-6 — Assign a new hire to an org role

**Scope note:** this item is structurally an **Internal Ops** concern
(`MVP2_InternalOps`), not Core Ticketing. Filed here at Nitish's explicit
request (2026-08-24) so it ships with this increment, flagged plainly
rather than silently miscategorised — same precedent as
`PHASE_1_IO_INCREMENT_SPEC.md` §12, which carries a landing-page item for
the same reason.

An `OrgRole` already carries a nullable `personName` (added during the
`PHASE_1_IO_SPEC.md` build so the roster and org chart can show real
names). A role with `personName = null` is an **open position**; naming
someone against it is the hire. Today that is only editable by a
`manage_org` holder through the generic role-edit form, which is the
wrong shape for the actual task — recording a hire is a different, much
narrower act than restructuring the org.

- New capability `assign_new_hire` — *"Assign a person to an existing
  org role (record a new hire against an open position)."* Deliberately
  **separate from `manage_org`**: HR should be able to name a hire
  without also being able to create roles, delete capabilities, or
  re-parent the reporting tree. Seeded to **Founder & Managing
  Director**, **Head of Product Development**, and **HR** (`cao_hr`) —
  HR is the role that actually does this. `cao_hr` has no staff login
  seeded today, so it is not directly demoable; the grant is still made
  now so the intent is in the data rather than deferred to a code change
  later.
- New endpoint `PATCH /api/internal-ops/org-roles/:id/person`, body
  `{ personName: string | null }`. Accepts **either** `assign_new_hire`
  **or** `manage_org` (a `manage_org` holder can already do this through
  the generic PATCH; refusing them the narrow route would be arbitrary).
  Needs a `requireAnyCapability` helper alongside the existing
  `requireCapability` — the first place this codebase gates on more than
  one capability. `personName: null` clears the assignment (a role
  becoming vacant again), which is the same act in reverse, not a
  separate feature.
- New Internal Ops console tab **"New hires"**, rendered from the
  server-resolved `navLinks` (`assign_new_hire` →
  `{ key: 'hiring', label: 'New hires' }`). Lists every org role with its
  department, reporting line and current holder, **open positions
  first**, each with a name field and an Assign action; a filled role
  shows the current name with Reassign/Clear. Worked example from
  Nitish's request: create the role "AI Data Engineer" (existing
  `manage_org` flow), then assign **Paul John** to it here — the name
  then appears on that node in the org chart, which is the visible proof
  the two halves are the same data.
- **Only a name is collected in v1**, per Nitish's explicit instruction.
  No start date, contract, salary, personal contact details or documents
  — those are HR-record territory, and putting employee personal data on
  this console would need a DPDP/GDPR purpose and retention decision
  first. `[TBD: whether a real HR record ever belongs in this system at
  all, or is federated from an HR tool]`
- Naming a hire does **not** create a login. `StaffProfile`/`Credential`
  are separate acts (`PHASE_1_IO_SPEC.md` §4) — a named holder on the
  chart is structural data, not an account. Stated because the opposite
  is an easy and dangerous assumption: silently minting a staff account
  from a typed name would hand out real access.

## 3. Explicitly out of scope

- **Per-event ticket-holder lists for Internal Ops** (who bought what).
  Nitish chose the read-only aggregate roster over this. It would put
  real purchaser names/emails on an internal console, which needs a
  purpose-limitation and access decision under DPDP/GDPR first, not a
  capability flag added in passing.
- **Ops moderation actions on events** (hide/flag/suspend) — no policy
  exists for when Ops would use them.
- **A ticket-holder-only event content page** (line-up, timings, access
  info). None of that content exists in the data model; building the page
  would mean inventing copy.
- Ticket transfer, refund, resale, wallet passes, or emailed tickets
  (Notifications is unbuilt — `PHASE_1_CT_SPEC.md` §2).
- Producer-facing sales dashboards.

## 4. Components to be built

| # | Component | Location |
|---|---|---|
| 1 | `view_all_events` capability + grants | `server/src/internalOps/seedData.ts` |
| 2 | Nav-link mapping for the new capability | `server/src/internalOps/auth.ts` |
| 3 | `GET /internal-ops/events` | `server/src/routes/internalOps.ts` |
| 4 | `GET /account/tickets` | `server/src/routes/account.ts` |
| 5 | `/tickets` in `resolvePortals` | `server/src/routes/auth.ts` |
| 6 | "All events" console tab | `client/src/pages/InternalOpsConsole.tsx` |
| 7 | `MyTicketsPage` + route + CSS | `client/src/pages/MyTicketsPage.tsx`, `App.tsx` |
| 8 | Confirmation-screen link to `/tickets` | `client/src/pages/FestivalPage.tsx` |
| 9 | `assign_new_hire` capability + grants | `server/src/internalOps/seedData.ts` |
| 10 | `requireAnyCapability` + `hiring` nav link | `server/src/internalOps/auth.ts` |
| 11 | `PATCH /internal-ops/org-roles/:id/person` | `server/src/routes/internalOps.ts` |
| 12 | "New hires" console tab | `client/src/pages/InternalOpsConsole.tsx` |

**Cross-schema rule (ADR-005):** `catalogue`, `inventory`, `orders` and
`identity` hold no foreign keys across schema boundaries. Both endpoints
therefore assemble their result in application code from per-schema
queries keyed by plain UUIDs — the same pattern
`GET /internal-ops/survey-responses` already uses. No new cross-schema FK.

**Design rules (`.claude/rules/design.md`):** `/tickets` is a 720px app
content column; its nav is `<AppNav/>` as a **sibling** of the capped
content div; the all-events roster is wide content inside the 720px Ops
console, so it scrolls inside its own `overflow-x: auto` wrapper like
`OrgTree.tsx`'s `.org-chart-scroll`. No new colour tokens.

## 5. Known gaps, stated not hidden

1. **Registration doesn't verify email**, so rule 2.3(2) rarely fires
   today. Wiring the existing `identity/emailVerification.ts` adapter
   into `POST /auth/register` is the fix; it is a separate change with
   its own UX (a fan who can't use the site until they click a link that
   is currently only logged server-side, since no email provider is
   chosen — `PHASE_1_CT_SPEC.md` §8). `[TBD: verify-on-register, blocked
   on the same email-provider decision]`
2. **Order status.** Orders left `pending` by an abandoned checkout must
   not appear as tickets; the endpoint returns only orders that actually
   issued tickets.
3. The dev database holds test festivals created by earlier verification
   runs (three "Fan Web Test Festival" rows, three "UI Fest", two "Orders
   Test Festival", two "F"). The roster will show them, correctly — they
   are real rows. Cleaning them up is a separate, per-record decision for
   Nitish, not something this increment does.

## 6. Exit checks

Checkable by someone who wasn't in the room, against the real running
server + Postgres — not mocks.

1. Signing in as **Head of Product Development** shows an "All events"
   tab; signing in as **CTO** does not, and a direct
   `GET /internal-ops/events` with the CTO's session returns **403**;
   unauthenticated returns **401**.
2. The roster lists a festival created live during the check, with its
   event, venue, zone, ticket type, and an allocation count matching what
   was seeded for it.
3. Buying a ticket through `/festival/:id` while signed in, then opening
   `/tickets`, shows that festival/event/zone/ticket type and a QR image
   whose **decoded** payload equals the ticket's `qrCode` token (decoded
   with `jsQR`, as in the QR-rendering slice — not merely asserting an
   `<img>` exists).
4. A second signed-in account's `/tickets` does **not** show the first
   account's tickets.
5. An order left in `pending` (checkout abandoned before payment) does
   not appear on `/tickets`.
6. `/tickets` appears in the Portals menu for a signed-in fan and is
   absent for an anonymous visitor; an anonymous visit to `/tickets` is
   told plainly and pointed at `/login?next=/tickets`.
7. Creating an org role "AI Data Engineer" and assigning **Paul John**
   to it through the "New hires" tab makes that name appear on the role's
   node in the Company org chart, from real data — and clearing it
   returns the role to showing as an open position.
8. An account holding **neither** `assign_new_hire` nor `manage_org`
   (CTO) gets **403** from `PATCH /org-roles/:id/person` and sees no
   "New hires" tab.
9. Zero console errors across both surfaces; `tsc` clean on `client/` and
   `server/`; `vite build` clean.

## 7. Non-functional targets

- **Latency:** `[TBD: no live system yet]` — measured only once a real
  deploy target exists, per `.claude/rules/build.md`. Both endpoints are
  low-frequency internal/account reads, not hot paths.
- **Index/query coverage:** the roster must not issue a query per zone or
  per ticket type (N+1). It fetches each schema's rows in bounded batches
  keyed by id sets and joins in memory. `Order.accountId` is already
  indexed; `guestEmail` is not — add an index if 2.3(2) is retained.
- **Scale ceiling:** the roster is unpaginated in v1, which is honest at
  17 festivals and wrong at 1,700. `[TBD: pagination threshold — revisit
  before any real producer volume]`

## 8. Sign-off

*(date + approver, filled in only after the three-step protocol in
`.claude/rules/build.md`: real end-to-end test, shown live, approved.)*
