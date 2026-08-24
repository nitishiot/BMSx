# Phase 1 Spec — Core Ticketing (Europe)

**Scoped against:** `TAG_PRD_v3.md` §13 Phasing ("Phase 1 — landing page
optimisation + core ticketing P0 (Europe)"), §10 P0 list, §6.1 P0 landing
requirements, and PR-1 (RBAC). **Architecture basis:** `TAG_Architecture_v1.md`
(six views, ADR-001–010), specifically ADR-010's modular-monolith deployment
shape.
**Status:** built, awaiting sign-off criteria to even start — this document
is the spec, not yet an implementation. No sign-off until `.claude/rules/build.md`'s
three-step protocol (real end-to-end test, shown to Nitish, his approval) is met.
**Author:** drafted with Claude (Sonnet), 23 August 2026.

---

## 1. Objective

Ship a working landing page and a complete guest-to-confirmed-ticket
purchase path for one European festival, on a real (not mocked) payment
sandbox and a real database — proving the core commerce loop (search →
festival page → seat/zone selection → cart with itemised fees → guest or
authenticated checkout → payment → QR confirmation) end to end, plus the
minimum identity/role model needed to let one festival producer onboard,
get approved by a Platform Admin, and set up that festival. Everything else
in the PRD (subscriptions, rewards, recommendations, vendor app, community,
meal pre-booking, chatbot, dynamic pricing) is explicitly deferred.

## 2. In scope

**Landing page (PRD §6.1 P0 — LP-1 to LP-7)**
- LP-1 search bar (see §7 "Search implementation" below for the P0
  interpretation of "semantic").
- LP-2 above-the-fold 360° value proposition, CLS < 0.1.
- LP-3 "Events Near You" with graceful no-permission fallback.
- LP-4 performance budget (LCP < 2.5s, TTI < 3.5s, mid-range mobile/4G).
- LP-5 mobile-responsive layout, 360px minimum.
- LP-6 one primary CTA per module, click-through tracked.
- LP-7 analytics instrumentation, consent-gated per GDPR.
- **LP-1 real-catalogue wiring (added 2026-08-24, implementation-level, not
  a PRD scope change).** Once Event & Catalogue's public read API existed
  (§2 below), LP-1's search and LP-3's "Events Near You" were wired to it
  — `landing/index.html` fetches `GET /api/festivals/public` (a new public
  endpoint returning each Festival with its earliest Event's Venue
  city/country and first lineup artist's genre, when those exist) and
  merges the results with the illustrative `MOCK_FESTIVALS` demo set
  rather than replacing it, so both the six curated demo festivals and any
  producer-created festival are searchable. Falls back silently to
  mock-only data if the backend isn't reachable (landing stays usable as a
  static file on its own, consistent with LP-4's performance budget).
  Known gap, not fixed here: "Use my location" ranks by venue lat/lon,
  which nothing in the Producer portal collects yet — real festivals
  without coordinates simply won't surface via geolocation-based nearby
  search until that's added; they remain fully searchable via LP-1's text
  search.
- **LP-13 (added 2026-08-23, implementation-level, not a PRD scope change)
  — roadmap teaser.** Landing page and Producer portal both show tiles/nav
  entries for P1/P2 features (§10) as visibly present but locked/greyed,
  labelled "coming soon" — never a dead link, never styled identically to
  a working feature. Content is a fixed manifest sourced directly from
  PRD §10's P1/P2 lists (never invented copy). Landing shows fan-facing
  items: subscriptions/rewards, recommendations, community, meal
  pre-booking, AI chatbot. Producer portal shows: Premium analytics/
  demand prediction, customer data access, marketing services. This is a
  presentation-only addition — no new backend capability, no new PRD
  persona or requirement, so it doesn't need a PRD revision.

**Core ticketing (PRD §10 P0, journeys J1 and J2)**
- Event & Catalogue: Festival, Event, Artist, Venue, Zone, SeatMap (read
  path only — festival/event data for Phase 1 is admin/producer-entered,
  not synced from an external catalogue feed).
- Virtual Queue: queue position, admission tokens, fairness rules, 10-minute
  inventory return on drop-off (J2).
- Ticketing & Inventory: TicketType, Allocation, Hold, Ticket — hold-then-
  issue model, no overselling (ADR-007).
- Orders & Cart: Cart, Order, OrderLine, saga orchestration across
  inventory + payment (ADR-006).
- Payments & Fees: PaymentIntent, FeeLine, Refund — itemised fees at cart,
  PCI scope isolated to this service (ADR-003).
- Ancillary Bookings: **thin slice only** — one accommodation and one
  transport partner integration, skippable per J1, no partner marketplace.
- Consent & Privacy: ConsentRecord, GDPR consent capture gating any
  analytics/profiling use of LP-7's events.
- Notifications: transactional only (order confirmation, queue-position
  updates) — no marketing notifications.

**Identity & RBAC (PRD PR-1, P6, J7 — Producer path only)**
- Identity & Access: Account, Profile, Session, GuestToken, Role,
  RoleAssignment, AuditLogEntry.
- Roles built: `fan` (guest and authenticated), `producer`, `platform_admin`.
  `vendor` and `affiliate` roles are data-modelled (per the
  `TAG_Architecture_v1.md` ownership-map addition) but have no working
  application/approval UI in Phase 1 — see Out of scope.
- Producer application → Platform Admin approval queue → RoleAssignment
  grant → producer can create/configure exactly one festival's events
  (free-tier onboarding, J5's first step only — Premium features are P1).
- Every approve/reject/suspend action writes an `AuditLogEntry` (actor,
  target, timestamp, reason) — PR-1's acceptance criterion.
- A `producer`-scoped request cannot read or write another producer's
  festival data (PR-1 acceptance criterion, testable with two producer
  accounts).

## 3. Explicitly out of scope

- LP-8 to LP-12 (personalised recommendations, editorial carousel ranking,
  promotional banners, AI chatbot, A/B testing framework) — P1/P2 landing
  requirements.
- Subscriptions & Rewards, recommendation engine, Vendor Services (app +
  marketplace + pooling), Community & Social, meal pre-booking, AI chatbot —
  all P1 per §10.
- Vendor (P3) and Affiliate (P5) onboarding/approval — their application
  entities exist in the data model (architecture addendum) but are inert
  until the P1 vendor app and affiliate listing features ship. Platform
  Admin in Phase 1 approves **producers only**.
- Dynamic pricing/prediction, resale-abuse detection, NLG content
  generation, 360° seat views, India localisation, B2B white-label — P2.
- Full accommodation/transport marketplace — Phase 1 ships one partner per
  category as a proof of the ancillary-booking saga pattern, not a
  marketplace.
- Multiple festivals/producers at scale — Phase 1's exit checks require one
  real festival end to end; multi-festival load is a later phase's
  non-functional target, not this one's.

## 4. Components to be built

Per ADR-010: a **modular monolith** with module boundaries enforced in code
(separate schemas, no cross-module database access, ADR-005), and three
containers extracted to their own deployable/scalable unit because they
have a distinct scaling or compliance driver:

| Container | In monolith or extracted | Why |
|---|---|---|
| Event & Catalogue | Monolith module | Read-heavy, no independent scaling need yet at one-festival scale. |
| Identity & Access (incl. RBAC) | Monolith module | Every other module already calls it in-process; no burst driver. |
| Orders & Cart | Monolith module | Orchestrates in-process calls to Inventory/Payments/Ancillary. |
| Ancillary Bookings | Monolith module | Thin slice; no independent scaling need in Phase 1. |
| Consent & Privacy | Monolith module | Called synchronously by other modules; no burst driver. |
| Notifications | Monolith module | Transactional volume only in Phase 1 (no marketing sends). |
| **Virtual Queue** | **Extracted** | On-sale burst (A1) — must scale independently of the monolith. |
| **Ticketing & Inventory** | **Extracted** | Overselling is unrecoverable; isolating it keeps hold/decrement logic under its own load-tested unit. |
| **Payments & Fees** | **Extracted** | PCI-DSS scope isolation (ADR-003) — the monolith must never hold card data. |

**Client surfaces:** Landing + Fan Web (SSR/SSG, per LP-4's performance
budget), a minimal Producer portal (application submission + free-tier
event setup), a minimal Platform Admin console (approval queue + audit
log view). Fan Mobile App, Vendor App, and the full Producer/Affiliate
Portal are P1/later per the architecture's container view.

**Language & framework (confirmed 2026-08-23).** React + Vite + TypeScript
for every client surface; Node.js + Express + TypeScript + Prisma for the
monolith and each extracted service, all against PostgreSQL 16. Reason:
matches the pattern already proven runnable in this repo's tooling (the
now-archived legacy scaffold ran this exact combination against Postgres,
`archive/legacy_boardinghouse_scaffold/`) — no code or schema reused from
it, only the technology choice. This was left unnamed in
`TAG_Architecture_v1.md` by design (architecture stays vendor/language
-neutral); naming it here is exactly what that document deferred to this
spec.

**Build sequencing within Phase 1.** The spec's exit checks (§6) require
the full path end to end, but implementation proceeds surface-by-surface
rather than all at once. First slice: the landing page (LP-1 to LP-7,
LP-13) and a minimal Producer portal, both against stub/mock data —
proves the client surfaces and the LP-13 roadmap-teaser pattern before the
core-ticketing backend (Identity & Access, Event & Catalogue, Virtual
Queue, Ticketing & Inventory, Orders & Cart, Payments) is wired in. Later
slices replace the stubs with real API calls. This sequencing is a
build-order choice, not a scope change — every exit check in §6 still has
to pass before Phase 1 as a whole is "built," and none of the exit checks
are considered met by the landing-page slice alone.

**Data stores.**

- **PostgreSQL** (chosen) for every relational store — the monolith's
  per-module schemas and each extracted service's own database. Reasons:
  the architecture already specifies "relational stores, per-service
  schemas" (View 2); Ticketing & Inventory's no-oversell requirement
  (ADR-007) needs real transactional guarantees around hold/decrement,
  which a relational engine gives directly; the append-only
  `AuditLogEntry` table (PR-1) is a natural fit for row-level constraints
  preventing UPDATE/DELETE. `docker-compose.yml`'s legacy scaffold already
  runs `postgres:16-alpine` in this repo — noted only as existing tooling
  familiarity in the repo, not as a reason to reuse any of that scaffold's
  code or schema. **Version:** PostgreSQL 16, matching what's already
  proven in this repo's tooling. One schema per module in the monolith's
  single instance; Virtual Queue, Ticketing & Inventory, and Payments each
  get their own instance since they're separately deployed.
- **Redis** (confirmed 2026-08-23) for Virtual Queue position/token state
  and Ticketing & Inventory's hot allocation counters — the architecture's
  abstract "cache / hot inventory counters" store (View 2), named
  concretely here because Phase 1 needs a real technology choice.
  Low-latency counter operations at on-sale burst are the reason a cache
  is separate from Postgres at all. Not yet run anywhere else in this
  repo — first use of it is in this phase.
- **Object storage** for QR codes and seat-map assets — product
  `[TBD: S3-compatible vs. cloud-specific — gated by the unresolved cloud/
  vendor decision, PRD §12 Q2 territory]`.
- **Search:** Postgres full-text search (`tsvector`) over the Phase 1
  Event & Catalogue schema, not a dedicated search index or ML embedding
  service — see §7 for why.

## 5. Search implementation — P0 interpretation (confirmed 2026-08-23)

LP-1 asks for "natural-language semantic search" as P0. Read literally that
implies an embedding/NLP search stack, which PRD §10 places the platform's
NLP capability (`Semantic Search / NLG / Chatbot`, PRD §8 architecture) as
part of the **AI/Data platform**, a layer with no P0 commitment elsewhere
in §10. **Confirmed interpretation for Phase 1:** LP-1's acceptance
criterion ("indie rock in Dublin this weekend" → correct genre/location/date
filter) is met with structured query parsing over Postgres full-text
search, not a trained semantic model — the AI/Data platform's NLP
container stays P1/P2.

## 6. Exit checks

Concrete, checkable by someone who wasn't in the room, against one real
festival, on real infrastructure (not mocks):

1. A guest visits the landing page on a mid-range mobile profile over
   simulated 4G; LCP < 2.5s and TTI < 3.5s are measured (not assumed),
   CLS < 0.1 on the hero.
2. A query like "indie rock in Dublin this weekend" returns correctly
   filtered results per §5's interpretation; a zero-result query returns
   nearest alternatives, never a dead end.
3. A guest completes J1 end to end: search → festival page → seat/zone
   selection → cart shows an itemised fee breakdown → guest checkout →
   real payment-sandbox authorisation → confirmation screen with a
   scannable QR ticket and itinerary.
4. A simulated on-sale drives concurrent demand above allocation; the
   virtual queue shows fair, transparent position; dropped-off holds
   return inventory within 10 minutes (J2); **oversell count is zero** —
   verified by a real concurrency test, not asserted.
5. GDPR consent is captured before any LP-7 analytics event fires for
   profiling purposes; consent state is queryable per account.
6. A producer account submits an application; it appears in the Platform
   Admin console's queue; an admin approves it; an `AuditLogEntry` records
   actor/target/timestamp/reason; the producer can now create an event for
   their festival only.
7. A second, unapproved producer account cannot create events, and cannot
   read or write the first producer's festival data (RBAC negative test).
8. A rejected producer application is visibly rejected to the applicant,
   with a reason, and cannot create events.
9. All of the above demonstrated live to Nitish, per `.claude/rules/build.md`'s
   sign-off protocol — screenshots/logs from a real run, not a description
   of expected behaviour.

## 7. Non-functional targets

Per `.claude/rules/build.md` — measured live once there's a running system;
until then these are targets, not measurements, and are labelled as such.

- **Throughput:** one festival's on-sale, concurrency scale `[TBD: no
  committed launch festival yet, PRD §12 Q1 — pick a placeholder scale
  (e.g. 5,000 concurrent queue entrants) once a partner is confirmed, and
  load-test against that, not a guess]`.
- **Latency:** P50/P95/max — `[TBD: no live system yet]`; the landing-page
  budgets in LP-4 (LCP/TTI) are the only latency numbers fixed at spec time
  because they're PRD-mandated, not derived from this phase's own load
  testing.
- **Scale ceiling verified:** the on-sale concurrency figure above, once
  set, must be load-tested to failure, not just to the target — report the
  actual breaking point alongside the target.
- **Resilience:** Ticketing & Inventory and Payments must survive a
  restart mid-hold without losing or double-issuing a ticket — verified by
  a live kill-and-restart test during a simulated on-sale, not asserted
  from the saga design alone.
- **Backpressure:** Virtual Queue must degrade to a longer queue, never
  drop or misorder admission, when concurrent entrants exceed the tested
  ceiling.
- **Index/query coverage:** every hot query path introduced by this
  phase (event search, cart lookup by account, admin approval queue,
  audit log by actor/target) has a matching Postgres index — checked
  against `EXPLAIN` output before sign-off, not assumed from the schema.

## 8. Open items

Resolved 2026-08-23 (see `PROGRESS.md` decisions log for reasoning):
- Redis confirmed as the cache/hot-counter technology (§4).
- LP-1's "semantic search" interpretation confirmed (§5).
- Legacy `client`/`server` scaffold archived to
  `archive/legacy_boardinghouse_scaffold/` — no longer blocks anything.

Still open, deliberately left as TBD, proceed anyway:
1. **Object storage product** — blocked on the cloud/vendor decision
   (PRD §12 Q2 territory); no cloud provider has been named for anything
   else in the platform either, so this isn't picked in isolation.
2. **PSP and travel/accommodation partner selection** (PRD §12 Q2) — gates
   the one accommodation/one transport integration in §2 and the payment
   sandbox in exit check 3. ADR-004's port/adapter pattern means build can
   proceed against a stub adapter meanwhile.
3. **Launch festival/partner commitment** (PRD §12 Q1) — gates the
   throughput target in §7 and exit checks 3–4, which need one real
   festival's data. Placeholder scale to be picked once a partner lands.

## 9. Sign-off

Per `.claude/rules/build.md`: not "done" until (1) the exit checks in §6
are demonstrated against real infrastructure, (2) shown live to Nitish,
(3) his explicit approval. Until then, status is **"built, awaiting
sign-off,"** never "complete."

- **Date:** _(blank until approved)_
- **Approver:** _(blank until approved)_
- **Tag:** `phase-1`, applied to the commit where sign-off is granted.
