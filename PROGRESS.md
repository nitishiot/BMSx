# PROGRESS.md — TAG session continuity

Single source of session continuity. Read this first every session (after
the sync gate in `.claude/rules/harness.md`), before re-deriving anything.

## Status

**LP-14 UI fixes: color contrast, theme consistency, name capture,
unanswered-question highlighting — built, awaiting sign-off (2026-08-24,
Sonnet session, same session as the initial LP-14 build below).** Nitish
reviewed the survey page live and flagged three issues, addressed in
order:

1. **Select dropdown text unreadable** — the native dropdown popup
   rendered light text on a white background. Root cause: no CSS
   `color-scheme` was set anywhere in `client/`, so browsers defaulted
   native-control rendering to light regardless of the page's actual
   (dark) theme. Fixed globally in `theme.css` — `color-scheme: light`
   on the base `:root`, `color-scheme: dark` in both the
   `prefers-color-scheme: dark` and `[data-theme="dark"]` blocks, kept in
   sync with the existing token blocks rather than hardcoded once.
2. **Inconsistent look vs. the rest of the app** — the survey's submit
   button and radio inputs had no styling applied at all (plain browser
   defaults), and `SurveyPage.css` referenced a `--panel` CSS variable
   that doesn't exist anywhere in `theme.css` (silently falling back to a
   hardcoded, non-theme colour). Fixed by reusing the `.submit-btn`
   pattern already established in `Apply.css` (pill, `--accent`
   background, white text — same as landing's `.btn-primary`) across
   `SurveyPage`, `AccountPage`, and `FestivalPage`'s previously-unstyled
   buttons (Pay/Add to cart/Checkout — a pre-existing gap in those pages
   from earlier this session, not new); switched `--panel`/hardcoded
   fallbacks to the real `--bg-raised`/`--border-md` tokens; radio inputs
   are now visually hidden (not `display:none`, stays keyboard/
   screen-reader accessible) with the whole pill filling `--accent` on
   `:checked` via `:has()`, matching the pill-button visual language used
   everywhere else in TAG rather than a bare native radio dot.
3. **Highlight unanswered questions** — previously one generic error
   banner. Now every unanswered question (including name/email) gets a
   `--bad`-coloured border + tinted background after a failed submit
   attempt, and the error banner states the count. Along the way, found
   and removed the native HTML5 `required` attribute on the name/email
   inputs — it was silently blocking form submission (and thus the
   custom validation/highlighting) before `handleSubmit` ever ran,
   whenever those two fields were empty; validation is now unified
   entirely through the custom JS path so all 14 fields get the same
   treatment.

Also, per a separate request: the survey now collects a **name** field
(previously only email — `Account.name` was a placeholder derived from
the email's local part). A new shared `FanNav` component
(`client/src/components/FanNav.tsx`) shows "Signed in as {name}" top
-right, reusing the `.shell-nav`/`.shell-tag` pattern already used by the
Producer portal/Admin console — wired into `SurveyPage`, `AccountPage`,
and `FestivalPage`. Backend: `survey.ts`'s schema requires `name`; the
account `upsert` sets/updates it (documented cross-concern: `Account` is
shared with producer/admin identity, so the most recently given name
wins on re-submission under the same email).

Verified with Playwright (dark-mode context, matching Nitish's actual
browser — an earlier check had run in light mode by Playwright's
default and hadn't caught the dropdown issue for that reason): computed
`color-scheme: dark` confirmed on the select; submit button confirmed
pill-shaped with a real background colour; submitting with everything
empty highlights all 14 fields with an accurate count in the error text;
answering one field drops the highlighted count correctly; full
submission shows "Signed in as {name}" in the nav afterward; zero
console errors. Re-ran the original survey-flow, edge-case, and
FestivalPage checkout Playwright/HTTP scripts from the initial LP-14
build to confirm no regressions — all still pass. Typecheck and
production build clean on `client/`; server typecheck clean.
**Not yet shown to Nitish live for a final look.**

**LP-14 fan survey + End User account flow: built, awaiting sign-off
(2026-08-24, Sonnet session).** Implements the spec drafted earlier this
session. New Postgres: `identity.EmailVerificationToken` +
`Account.emailVerifiedAt` (identity schema, extends the existing model),
`survey.SurveyResponse` (new `survey` schema, ADR-005 — no FK into
`identity`). `server/src/identity/emailVerification.ts` is the stubbed
ADR-004 adapter — creates a real single-use token, "sends" it by logging
the link server-side (no real provider chosen, spec §8 territory).

Routes: `POST /api/survey/responses` (email + 12 answers → upserts
`Account`, creates `SurveyResponse`, issues a session, returns a
demo-only verification token), `GET /api/account/me`,
`POST /api/account/verify-email`, `POST /api/account/resend-verification`
(demo-only convenience, 409s if already verified).

Client: `SurveyPage.tsx` (`/survey`) renders the 12 questions from the
provided doc (collapsed one duplicated accommodation question — flagged
in the spec, not silently dropped) plus an email field; `AccountPage.tsx`
(`/account`) is the End User page — no-account / pending-verification
(with a labelled dev-only "verify now" shortcut, since there's no real
inbox) / verified states, plus a survey-answers recap. Landing page gets
an LP-14 CTA link ("Help us build TAG") pointing to Fan Web's `/survey`.

Verified two ways against the real running `server/` + Postgres: (1) a
Playwright run driving the actual browser through landing → survey →
submit → End User page pending state → dev-verify → verified state →
reload persists — zero console errors; (2) a scripted HTTP walk covering
validation (empty answers, bad email both 400), an invalid/expired token
(400), token single-use (reusing a spent token 400s), resend-after-
verified (409), and `GET /me` correctly reflecting both the verified
timestamp and the stored survey response. Typecheck and production build
(`tsc -b && vite build`) both clean on `client/`; server typecheck clean.
**Not yet shown to Nitish live.**

**Two new specs drafted, not built (2026-08-24, Sonnet session): TAG
Internal Ops Console v1, and LP-14 (fan survey → End User account) in
`PHASE_1_SPEC.md`.** Nitish shared a "Festival Fan Survey Proposal" doc
and a "FairFare Organization Chart" (marked CONFIDENTIAL, ~20 real
names), asking for RBAC + a dashboard per org-chart role, plus the survey
→ signup flow, plus a new "Head of Product Development" role for himself
under CTO. Before writing anything, raised three points given the repo is
public: (1) real names in a public repo — he confirmed committing them is
fine; (2) the org-chart roles (CFO/HR/Marketing/Engineering) are internal
staff tooling, a different axis from the product's existing personas
(Festival Goers/Clients/Platform Admin) — he confirmed this should be a
**separate system spec**, not a PRD revision; (3) ~20 roles × a bespoke
dashboard each is large — he confirmed scoping a generic framework fully
specced for 3 priority roles first, the rest deferred to the same
pattern later.

`build/MVP2_InternalOps/PHASE_2_SPEC.md` (initially drafted at repo root
as `TAG_InternalOps_v1.md`, promoted into `build/` later the same session
per Nitish's request, following `build/README.md`'s phase-spec naming —
see decisions log) specs: an `OrgRole`/`Capability`/
`OrgRoleCapability`/`StaffProfile` data model in a new `internalops`
schema (reuses `identity.Account`/`Session` for login, doesn't reuse
`identity.Role`/`RoleAssignment` — that's the product's fan/producer/
platform_admin RBAC axis, a deliberately separate concern from staff
RBAC); a capability-driven dashboard API so a new role doesn't need new
frontend code; and three fully-specced priority roles — Head of Product
Development (Nitish, new), CTO, Founder & Managing Director — chosen to
span an individual-contributor level, a department head, and the top of
the hierarchy. Flagged explicitly: no real business metrics exist yet
(no live sales/infra), so v1 dashboards are structural (org roster,
roles, capabilities) with metric widgets marked `[TBD]` rather than
invented numbers.

LP-14 in `PHASE_1_SPEC.md` specs the fan survey (12 questions from the
provided doc — noted one duplicate row in the source and collapsed it,
flagged rather than silently dropped) → guest submits with email →
`identity.Account` upserted, `SurveyResponse` stored (new `survey`
schema) → account enters a **pending email verification** state, not
immediately usable. Email verification is stubbed (ADR-004 port/adapter,
same honesty pattern as the payment stub — no real provider chosen,
verification link logged server-side rather than emailed) — real
provider selection flagged `[TBD]`, same territory as the other
unresolved partner decisions in spec §8. A new End User page
(`/account`) shows the pending/verified state.

**Neither is built yet — specs only, both awaiting Nitish's review before
implementation starts**, per "spec before code."

**Real QR rendering: signed off (2026-08-24, Sonnet session).** Nitish
reviewed live at `localhost:5173/festival/9b1cab0e-8561-42d6-98e1-97d2b46ddbe7`
(his own screenshot: confirmation screen for "Fan Web Test Festival"
showing a real rendered QR code above the ticket's token) and said "looks
good." **Sub-slice sign-off**, same caveat as every other item this
session — Phase 1 sign-off (§9) still needs Virtual Queue, a real PSP,
and the other unbuilt modules.

Nitish picked this as the next item after signing off the
Fan Web checkout UI. Corrected a mischaracterisation from earlier in this
session: the confirmation screen's tickets previously showed the opaque
`qrCode` text token with a note saying real QR rendering was blocked on
the object-storage product decision (spec §8). That conflated two things
— *persisting* a QR image (needs storage, still TBD) and *generating* one
(a pure client-side computation, no storage involved at all). Rendering
was never actually blocked; corrected in `PHASE_1_SPEC.md`, not silently
fixed.

Added `qrcode` (+ `@types/qrcode`) to `client/`. `FestivalPage.tsx`'s
confirmation screen now encodes each ticket's `qrCode` token into a real
PNG QR image client-side (`QRCode.toDataURL`), rendered inline; the raw
token stays visible as a small text caption underneath for reference. No
backend change — `Ticket.qrCode` was already a real unique token, only
the confirmation screen's rendering changed.

Verified live with Playwright, and — going a step further than "an image
tag appeared" — actually decoded the rendered QR: extracted the `<img>`'s
PNG data URL, decoded its pixels with `jsQR`, and confirmed the decoded
text exactly matches the ticket's `qrCode` token. Typecheck and
production build (`tsc -b && vite build`) both clean. **Not yet shown to
Nitish live.**

**Fan Web checkout UI + Ticketing & Inventory/Orders & Cart backend:
signed off together (2026-08-24, Sonnet session).** Nitish reviewed both
live at `localhost:5173` — screenshots of the real "Summer with Linkin"
festival page (created in an earlier session; its event card correctly
shows "No tickets on sale for this zone yet" since no ticket types exist
for it) and the full Fan Web Test Festival flow (ticket selection → cart
with itemised €45.00/€4.50/€49.50 → guest checkout as
`chetan@abc.com` → confirmation screen with the issued ticket and its
qrCode token) — and said "looks good. consider it sign-off." This covers
both sub-slices from this session (the Orders & Cart/Ticketing &
Inventory backend and the Fan Web UI built on top of it), not the whole
Ticketing & Inventory + Orders & Cart item from spec §2/§4's original
list — Virtual Queue and a real PSP are still separate, unbuilt pieces.

**Slice sign-off, not Phase 1 sign-off** — same caveat as every prior
slice; §9 still needs all of §6's exit checks, which still need Virtual
Queue and a real Payments/PSP integration. No `phase-1` tag.

**Fan Web checkout UI: built, awaiting sign-off (2026-08-24, Sonnet
session, same session as the Ticketing & Inventory + Orders & Cart
backend below).** Nitish asked to build the UI next. New page
`client/src/pages/FestivalPage.tsx`, served at `/festival/:id` — a third
pathname-routed surface in the existing Producer-portal Vite app (`App.tsx`
now checks `/festival/`, `/admin`, else Producer portal), not a separate
app, matching the minimal-routing pattern already in use. Implements J1's
guest-to-ticket path: browse the festival's Events/Zones/TicketTypes
(fetched via the existing public catalogue/inventory read endpoints) →
"Add to cart" (calls the Orders & Cart API built earlier this session) →
itemised cart panel (subtotal/fee/total) → guest checkout form (email
required, name optional, no account) → stub-PSP payment → confirmation
screen listing issued tickets with an opaque `qrCode` token per ticket,
explicitly labelled as not a real scannable QR image (object storage/QR
rendering is still `[TBD: PHASE_1_SPEC.md §8]`).

Added one new backend endpoint, `GET /api/festivals/:id` (public,
`server/src/routes/festivals.ts`) — the festival detail page needs a
single-festival read the existing `/public` (list) and `/mine`
(producer-scoped) routes didn't provide. Registered **last** in the router
deliberately: Express matches routes in registration order, and a generic
`:id` param registered earlier would have swallowed `/public`/`/mine`
literal-path requests — caught this while writing the route, not after.

`landing/index.html`'s `resultCardHTML` now sends a real (backend-sourced)
festival's "View festival" link to `FAN_WEB_BASE/festival/{id}`
(`FAN_WEB_BASE = 'http://localhost:5173'`, `[TBD: prod Fan Web origin —
likely the same domain as landing once deployed]`); the six illustrative
mock festivals keep the pre-existing `#app` placeholder, since there's no
real inventory behind them to check out against. This is the fix for the
gap Nitish flagged during the Event & Catalogue sign-off review earlier
this session ("View festival doesn't go anywhere") — it now does, for any
real festival with a session/zone/ticket type set up.

Verified two ways, both against the real running `server/` + Postgres —
not mocks: (1) an HTTP setup script creates a real producer → festival →
venue → event → zone → ticket type (5-unit allocation); (2) a Playwright
run drives the actual `localhost:5173/festival/:id` page in a real
browser: ticket type and remaining-count render correctly → "Add to cart"
→ cart panel shows correct itemised subtotal (€45.00) / fee (€4.50, 10%
placeholder) / total (€49.50) → checkout form → stub-PSP payment →
confirmation screen with 1 issued ticket and its `qrCode` token rendered →
zero console errors. A second Playwright run against the actual static
`landing/index.html` (served at `localhost:4173`) confirmed a real
festival's card now links to the Fan Web page with the correct id, and
(checked directly against `resultCardHTML` in-page, not via search text —
the dev DB has accumulated enough real test festivals from prior sessions
that the zero-match fallback can legitimately surface real festivals for
almost any query now, which made asserting the negative case via search
text the wrong check) that a mock-only festival still renders the `#app`
placeholder. Typecheck and production build (`tsc -b && vite build`) both
clean on `client/`. **Not yet shown to Nitish live.**

**Core-ticketing backend, Ticketing & Inventory + Orders & Cart (backend
only): built, awaiting sign-off (2026-08-24, Sonnet session).** Next
sub-slice after the three signed off earlier the same session. Nitish
chose "Orders & Cart" as the next item; scoped down to backend-only after
flagging that Orders & Cart can't function without sellable inventory (not
built) and a payment step (PSP still unresolved, spec §8) — he picked the
backend-first option over also building a new fan-facing checkout UI in
the same pass (no Fan Web surface exists at all yet).

New Postgres schemas `inventory` (`TicketType`, `Allocation`, `Hold`,
`Ticket`) and `orders` (`Cart`, `CartItem`, `Order`, `OrderLine`), no FK
across either schema boundary per ADR-005 — same pattern as
`identity`/`catalogue`. `server/src/inventory/holds.ts` implements the
hold-then-issue, no-oversell model (ADR-007): reserving a hold is a single
conditional `UPDATE Allocation SET remaining = remaining - qty WHERE
remaining >= qty`, safe under concurrent callers via Postgres row locking
without needing SERIALIZABLE isolation; expired holds are reclaimed
lazily (checked before every new reservation) rather than via a background
job — flagged as a scoping choice, not a gap that blocks this slice.
`server/src/payments/stubAdapter.ts` is a labelled ADR-004 port/adapter
stand-in (always authorises, except a magic decline-amount hook for
testing) — real PSP selection is still open (spec §8). Fee itemisation
(`server/src/orders/pricing.ts`) uses a placeholder 10% rate, explicitly
flagged as not a real business number (no fee schedule exists in the PRD).

New routes: `POST/GET /api/inventory/zones/:zoneId/ticket-types` (producer
-owned, same ownership-chain pattern as catalogue.ts's zones — Zone ->
Event -> Festival.producerAccountId), `GET /api/inventory/ticket-types/:id`
(public); `POST /api/orders/carts` (guest-usable — `optionalAuth`, a new
auth.ts middleware alongside `requireAuth`, attaches an account if a valid
token is present but never rejects an anonymous request), `GET
/api/orders/carts/:cartId` (itemised subtotal/fee/total), `POST`/`DELETE
.../items`, `POST .../checkout`.

Verified with a scripted HTTP walk against the real running `server/` +
Postgres (not mocks): full producer setup (application → approval →
festival → venue → event → zone → ticket type) → RBAC negative test
(second producer 404s creating a ticket type on the first producer's
zone) → guest cart created with no auth → item added, itemised pricing
checked (subtotal/fee/total) → allocation correctly decremented →
checkout via the stub adapter → 2 tickets issued with qrCodes → cart
marked `checked_out` → re-checkout on the same cart correctly rejected
(409) → simulated payment decline correctly surfaces as 402 → **10
concurrent requests for 1 unit each against a 5-unit allocation: exactly 5
succeeded, exactly 5 rejected, `remaining` ended at exactly 0, never
negative** (ADR-007's no-oversell requirement, exercised with real
concurrency, not asserted) → separate run: removing a cart item correctly
releases its hold back to `Allocation.remaining`. Typecheck clean on
`server/`. **Not yet shown to Nitish live** — per `.claude/rules/build.md`,
status stays "built, awaiting sign-off." No client/UI change in this
sub-slice.

**Three sub-slices signed off together (2026-08-24, Sonnet session): Event
& Catalogue, RBAC suspend/reinstate, and the landing-page catalogue
wiring.** Nitish reviewed the landing search live at `localhost:4173`
(screenshot: searching "summer" correctly returns his real "Summer with
Linkin" festival with its real London/UK/30 Aug 2026 data) and said
"consider this a sign off." He also flagged that clicking "View festival"
doesn't go anywhere — expected and pre-existing, not a regression: that
link has always been a placeholder (`href="#app"`) since the original
landing-page slice, since a real festival detail page needs Orders & Cart
(J1's search → festival page → seat/zone selection → cart flow, spec §2),
which isn't built yet. Logged as a known follow-on, not fixed here.

**Slice sign-off, not Phase 1 sign-off** — same caveat as every prior
slice; Phase 1 sign-off per spec §9 still needs all of §6's exit checks,
which need Virtual Queue, Ticketing & Inventory, Orders & Cart, and
Payments (none built yet). No `phase-1` tag — `.claude/rules/build.md`
reserves that for the whole-phase sign-off, not individual sub-slices.

**Landing page LP-1 wired to the real Event & Catalogue API (2026-08-24,
Sonnet session).** Nitish reviewed the Event & Catalogue sub-slice live,
created a real festival ("Summer with Linkin" at "Wembley, London"), and
found it didn't show up in the landing page's search — expected, since
LP-1/LP-3 still read the hardcoded `MOCK_FESTIVALS` array from the
original landing-page slice, with no connection to the backend built
since. Added as an explicit spec item (`PHASE_1_SPEC.md` §2, "LP-1
real-catalogue wiring") rather than just fixed silently, so it stays
tracked as built scope.

New public endpoint `GET /api/festivals/public` (`server/src/routes/
festivals.ts`) — unauthenticated, returns every Festival with its
earliest linked Event's Venue city/country and first lineup artist's
genre (all nullable — most demo festivals created so far have no Event
attached yet). `landing/index.html` now fetches this on load and merges
the results with the illustrative `MOCK_FESTIVALS` set (real data added,
not replacing the curated demo entries) into a `CATALOGUE_FESTIVALS`
array; search and the zero-result fallback now run against that merged
set, with `resultCardHTML` and the genre/location matchers guarding for
the null fields real data can have. Fetch failures (backend not running)
are swallowed silently — landing stays usable as a static file on its own
per LP-4.

**Known, documented gap — not fixed here:** LP-3 "Use my location" still
only ranks the six mock festivals, because nothing in the Producer portal
collects venue lat/lon yet; real festivals stay fully findable via LP-1
text search, just not via geolocation-based nearby ranking. Flagged in
the spec addition, not silently left out.

Verified live with Playwright against the actual static file (served at
`localhost:4173`, the same server Nitish reviewed on) + the real running
backend: searching "Linkin" surfaces the real "Summer with Linkin"
festival with its real city/country/date; the existing mock-data search
("indie rock in dublin") still returns correctly, confirming no
regression to the already-signed-off landing-page slice. Zero console
errors.

**Core-ticketing backend, RBAC suspend/reinstate: built, awaiting sign-off
(2026-08-24, Sonnet session, same session as Event & Catalogue above).**
Closes a gap in the existing PR-1 implementation: spec §2 says "every
approve/reject/**suspend** action writes an `AuditLogEntry`," but
`admin.ts` only ever implemented approve/reject — there was no way to
revoke an already-approved producer's access. Nitish confirmed this scope
over the alternative (opening vendor/affiliate onboarding, which spec §3
explicitly marks out of Phase 1 — not done).

Schema: `RoleAssignment` gets `suspendedAt`/`suspendedBy` (migration
`20260824013611_role_suspension`) — a suspended assignment is kept, not
deleted, so grant history survives a suspend/reinstate cycle.
`requireAuth` (`server/src/auth.ts`) now excludes suspended assignments
when computing `req.account.roles`, so a suspended producer loses
producer-scoped access immediately, no re-login required.

API: `POST /admin/accounts/:accountId/suspend` and `.../reinstate`
(reason required, writes `AuditLogEntry` with `targetType: 'Account'`),
`GET /admin/producers` (approved producers + current suspension state for
the admin console's list). `GET /producer-applications/me` now also
returns `suspended: boolean` so the Producer portal can show a clear
"access suspended" message instead of a raw 403 from every downstream
call; `GET /producer-applications/me/audit-log` now includes
`Account`-targeted entries (the suspend/reinstate ones) alongside the
existing `ProducerApplication`-targeted ones.

Client: Admin console gets an "Active producers" list (mirrors the
approval queue's UI pattern — required reason, Suspend/Reinstate button).
Producer portal (`App.tsx`) renders a dedicated "Access suspended" screen
instead of falling through to the approval-status card, which would have
misleadingly still shown "Approved" with no indication access was pulled.

Verified two ways against the real running `server/` + Postgres: (1) a
scripted HTTP walk (approve → suspend → confirm `/me` reports suspended
and the `producer` role is gone → confirm a suspended producer's `POST
/festivals` is blocked with 403 → confirm the admin producers list and the
producer's own audit log both reflect it → reinstate → confirm access and
role return) — all checks passed; (2) a Playwright run driving both the
Producer portal and Admin console UIs through the same flow — passed with
zero console errors on either page. **Not yet shown to Nitish live** —
same protocol as Event & Catalogue above; he's chosen to sign off both
sub-slices together in one session once both are demoed.

**Core-ticketing backend, Event & Catalogue sub-slice: built, awaiting
sign-off (2026-08-24, Sonnet session).** Second sub-slice of the
core-ticketing backend (spec §2/§4), scoped to Event & Catalogue beyond
Festival — Venue, Artist, Event, EventArtist (lineup), Zone, SeatMap — all
added to the existing `catalogue` Postgres schema (migration
`20260824011227_event_catalogue`), read-path-only/producer-entered per
spec §2. `Festival` (built in the first sub-slice) is unchanged.

API: `server/src/routes/catalogue.ts`, mounted at `/api/catalogue`. Same
RBAC pattern as `festivals.ts` — producer-scoped writes check ownership
through `Festival.producerAccountId` (for Events) or through the owning
Event's Festival (for Zones and lineup entries), never a request
parameter; public unauthenticated GETs exist for the eventual landing-page
wiring. Venues and Artists are shared catalogue data (any producer can
create them), matching how they'll actually be used once more than one
festival exists.

Client: `EventSetup.tsx` (Producer portal) extended with a "Sessions &
zones" section — after a Festival is saved, the producer can add a
venue + dated session (Event) + ticketing zone in one submit, and see
previously-added sessions listed with their zone tags.

Verified two ways, both against the real running `server/` + Postgres —
not mocks: (1) a scripted HTTP client walking the full API (submit →
approve → create festival → venue → event → zone → artist → lineup →
public read → RBAC negative test: a second, separately-approved producer
gets a 404 trying to create an event under the first producer's festival)
— all checks passed; (2) a Playwright run driving the actual Producer
portal and Admin console UIs end to end (application → approval in a
separate browser context → event setup → add session — venue/event/zone
created and rendered) — passed with zero console errors on either page.

The Playwright UI run caught a real bug the HTTP-level script didn't: the
event-creation route doesn't return `venue` in its response (no `include`
on that `create` call), but the client was optimistically appending the
just-created event to its list assuming `event.venue.name` existed,
throwing on render. Fixed by refetching the event list from the server
after a successful add instead of constructing an incomplete object
client-side — cheap and correct, since Event & Catalogue is a read-heavy,
low-frequency-write module (no need for an optimistic-update
micro-optimisation here).

**Not yet shown to Nitish live** — per `.claude/rules/build.md`, status
stays "built, awaiting sign-off" until he reviews it running (both dev
servers are up: client `localhost:5173`/`:5173/admin`, server
`localhost:4000`) and approves. Landing page's `MOCK_FESTIVALS` search
still isn't wired to this — that's a deliberately separate follow-on (see
Next steps), not part of this sub-slice's scope.

**Core-ticketing backend, first sub-slice: signed off (2026-08-23, Sonnet
session).** Nitish reviewed live at `localhost:5173`/`localhost:5173/admin`
(his own screenshot shows the admin queue and a growing audit log — his
approvals plus this session's Playwright test runs) and said "Consider
this a sign off as well." **Slice sign-off, not Phase 1 sign-off** — same
caveat as the other two client-surface slices; Phase 1 sign-off per spec §9
still needs all of §6's exit checks, which need the rest of the backend
(Event & Catalogue, Virtual Queue, Ticketing & Inventory, Orders & Cart,
Payments) built. No `phase-1` tag yet. Build/verification detail below.

While reviewing, Nitish also asked to widen the landing page's "Find your
next festival" search + Events Near You section — it was still capped at
`max-width:720px` from before the earlier landing-page width pass (which
widened the sibling Platform/Plans/Roadmap sections to 1800px but missed
this one), so it read as a narrow island between wide sections despite
being "the highlight of the page." Widened `.search-inner` and
`.nearby-inner` to `max-width:1800px` to match; kept the search input row
itself capped at 720px via a new `.search-form{max-width:720px;margin:0
auto}` rule so the search box doesn't stretch to full width, only the
section canvas and result cards do. Verified visually at a 1920px
viewport — the section's left/right edges now line up with the Platform
section below it.

**Core-ticketing backend, first sub-slice: built, awaiting sign-off
(2026-08-23, Sonnet session).** New `server/` app (Node+Express+TS+Prisma,
confirmed stack) plus its own `docker-compose.yml` running PostgreSQL 16 +
Redis on non-default ports (`5433`/`6380`) — deliberately not the
`sentinel-postgres`/`sentinel-redis` containers already running on this
machine for an unrelated project. Scope: Identity & Access (Account, Role,
RoleAssignment, Session, AuditLogEntry) and the producer application →
Platform Admin approval → free-tier event-setup path (PR-1, P6, J5, J7),
against two real Postgres schemas (`identity`, `catalogue`, per ADR-005 —
no FK crosses the schema boundary). This is a deliberately scoped **first
sub-slice** of the much larger "core-ticketing backend" item in
`PHASE_1_SPEC.md` §2/§4 — Event & Catalogue beyond Festival, Virtual Queue,
Ticketing & Inventory, Orders & Cart, Payments, Ancillary Bookings, Consent
& Privacy, and Notifications are still unbuilt; picked this slice because
it's the seam the Producer portal's existing localStorage simulation
(`producerState.ts`, now deleted) was already built against.

Rewired `client/` off that simulation entirely: `src/api.ts` replaces it,
calling the real backend with bearer-token sessions. Apply.tsx no longer
has a self-approval button — a real, separate **Platform Admin console**
now exists at `client/src/pages/AdminConsole.tsx`, served at the `/admin`
route of the same Vite app (login by email against a seeded
`platform_admin` role, approval queue with a required decision-reason
field, full audit log view). The Producer portal's own page polls its
application status every 4s while pending, since approval now happens in
a different browser tab/session, not inline.

Verified live end-to-end with Playwright, driving two separate browser
contexts (producer + admin) against the real running `server/` +
Postgres — not mocks: producer submits → appears in the admin queue →
admin approves with a reason → producer's tab picks up the approval via
polling and switches to event setup → event POSTed and saved for real →
producer's own audit log shows the real `AuditLogEntry` → a second,
unapproved producer stays stuck at "pending" with no way to self-approve
(RBAC negative test, exit check 7 — enforced structurally: `/festivals`
and `/festivals/mine` require the `producer` role and are always scoped to
the calling account, never a request parameter). Typecheck clean on both
`client/` and `server/`. Zero console errors. Screenshots taken
(scratchpad, not committed). **Not yet shown to Nitish** — per
`.claude/rules/build.md`, status stays "built, awaiting sign-off" until
that happens and he approves.

Notable build-time decision: `npm install` in `server/` pulled Prisma 7 by
default, which replaces the classic `datasource { url = env(...) }` schema
with a new adapter-based `prisma.config.ts` model unrelated to anything
this session was doing — pinned to Prisma 5 (stable, matches the schema
this slice was written against) rather than adopt that migration mid-slice.

**Producer portal slice signed off (2026-08-23, Sonnet session).** Fresh
`client/` app (React+Vite+TS, confirmed stack) at the repo root — same
path the archived boarding-house app used to occupy, unrelated code.
Built per spec §2/§4: application form (J7) → simulated Platform Admin
approval (clearly labelled — no Identity & Access/RBAC backend exists yet,
this is a client-side stand-in, not real access control) → free-tier event
setup (J5) → an audit log rendering PR-1's actor/action/target/timestamp/
reason shape → producer-audience LP-13 roadmap tiles (Premium analytics,
AI demand prediction, marketing services, personalised event page — P1/P2
per PRD §10, copy not invented). Verified live with Playwright against the
Vite dev server before the demo: typecheck clean, full flow (submit →
approve → save event) works end to end, audit log accumulates both
entries, zero console errors. Nitish then reviewed live at `localhost:5173`
himself (submitted his own application, approved it, saved an event) and
signed off. **Slice sign-off, not Phase 1 sign-off** — same caveat as the
landing page (§9 needs all of §6's exit checks, which need the real
backend). No `phase-1` tag yet.

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
- **Core-ticketing backend, first sub-slice** — `server/` (Identity &
  Access + producer application/approval/event-create, Node+Express+TS+
  Prisma/Postgres 16 in Docker) and `client/` rewired off its former
  localStorage simulation onto that real backend, plus a genuine Platform
  Admin console at `/admin`. Signed off.
- **Core-ticketing backend, Event & Catalogue sub-slice** — Venue, Artist,
  Event, EventArtist, Zone, SeatMap added to the `catalogue` schema;
  `server/src/routes/catalogue.ts`; Producer portal's `EventSetup.tsx`
  extended to author sessions/zones. Signed off.
- **Core-ticketing backend, RBAC suspend/reinstate** — `RoleAssignment`
  suspension state, `/admin/accounts/:id/suspend`+`/reinstate`,
  `/admin/producers`, Admin console "Active producers" list, Producer
  portal suspended-access screen. Signed off.
- **Landing page ↔ real catalogue wiring** — `GET /api/festivals/public`;
  `landing/index.html`'s LP-1 search and zero-result fallback now run
  against real + mock festivals merged. Signed off. LP-3 near-you stays
  mock-only (documented gap — no venue geocoding yet); "View festival"
  stays a placeholder link pending Orders & Cart (pre-existing, not new).

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

1. **LP-14 (fan survey → End User account) built, awaiting sign-off** —
   see Status. `build/MVP2_InternalOps/PHASE_2_SPEC.md` (staff RBAC/
   dashboard console) is still spec-only, not started — Nitish's next
   priority call once LP-14 is reviewed.
2. **The rest of the core-ticketing backend.** Ticketing &
   Inventory + Orders & Cart backend, the Fan Web checkout UI
   (`/festival/:id`), and its real QR rendering were all built and signed
   off this session — J1 (search → festival page → zone/ticket selection
   → cart → guest checkout → confirmation with a real scannable QR) now
   runs end to end against real infrastructure, demoable live at
   `localhost:5173/festival/:id`. Still needed: Virtual Queue
   (admission gating ahead of purchase — exit check 4 needs this), a real
   Payments/PSP integration (currently a stub adapter — exit check 3's
   "real payment-sandbox authorisation" needs this), Ancillary Bookings,
   Consent & Privacy, Notifications (spec §2/§4).
3. LP-3 "Use my location" nearby search still only ranks the six mock
   festivals — needs venue lat/lon collection (not built anywhere yet)
   before real festivals can be ranked geographically, not just found via
   text search.
4. The three open items (object storage, PSP/travel partner, launch
   festival) still need resolving before the exit checks that depend on
   them (spec §6, checks 3–4) — not before further backend build starts.
5. Regenerate `TAG_Architecture_v1.html` from the `.md` next session that
   touches it — several sessions have now edited the `.md` only.
6. Open, not blocking: repo-surface classification (founder names, financial
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
- **2026-08-23 (Sonnet session)** — Built the Producer portal as a fresh
  `client/` app (`npm create vite@latest client -- --template react-ts`),
  reoccupying the path the archived boarding-house app used to hold —
  unrelated code, that archive stays untouched. RBAC/J7 isn't backed by a
  real Identity & Access service yet, so the Platform Admin approval step
  is a labelled client-side simulation (`producerState.ts`) rather than
  something silently pretending to be real access control — every place
  it's shown says explicitly that it's a stand-in. Lifted the audit-log
  render from the Apply page up to the app shell after finding it
  vanished once a producer reached event setup (component unmount), which
  would have undercut the point of demoing PR-1's audit trail at all.
  Verified live with Playwright (typecheck, full submit→approve→save
  flow, audit log accumulation, zero console errors) but not yet shown to
  Nitish — same sign-off protocol as the landing page, one step behind it.
- **2026-08-23 (Sonnet session)** — Nitish reviewed the Producer portal
  live at `localhost:5173` (his own screenshots: submitted an application
  as "John Dean / Carnival Ticketing / Tomorrow fun land", approved it via
  the simulated admin action, saved event dates 11–16 Aug 2026 at "Central
  park, Ireland") and signed off. Both Phase 1 client-surface slices
  (landing page, Producer portal) are now signed off; next slice is the
  core-ticketing backend. Asked to wait for his `/compact` before doing
  anything further this session.
- **2026-08-23 (Sonnet session, post-compact)** — Nitish said "go ahead
  now" to resume the core-ticketing backend. Given the size of the full
  item (Identity & Access, Event & Catalogue, Virtual Queue, Ticketing &
  Inventory, Orders & Cart, Payments, Ancillary Bookings, Consent &
  Privacy, Notifications — spec §2/§4), made the call to scope a **first
  sub-slice** rather than attempt all of it in one pass: Identity & Access
  + the producer application/approval/event-create path, since that's the
  exact seam the already-built Producer portal's localStorage simulation
  was standing in for. This keeps the demo-after-every-build cadence
  Nitish asked for intact rather than producing one enormous, harder-to-
  review slice.
- **2026-08-23 (Sonnet session)** — Found `sentinel-postgres`/
  `sentinel-redis`/`sentinel-kafka`/`sentinel-minio` Docker containers
  already running on this machine, from an unrelated project. Gave `server/`
  its own `docker-compose.yml` on non-default ports (Postgres `5433`, Redis
  `6380`) rather than reusing or port-clashing with those — this repo's
  data must stay isolated from whatever that other project is doing.
- **2026-08-23 (Sonnet session)** — `npm install` in a fresh `server/`
  pulled Prisma 7 by default, which turned out to require a new
  adapter-based `prisma.config.ts` (the classic `datasource { url =
  env(...) }` schema syntax is rejected outright). That migration is
  unrelated to this slice's actual work, so pinned to Prisma 5 (last
  stable major before the change) instead of adopting it mid-slice —
  revisit the Prisma version deliberately in a later session, not as a
  side effect of an unpinned `npm install`.
- **2026-08-23 (Sonnet session)** — Removed the Producer portal's
  self-approval "Admin simulation" buttons entirely now that a real
  Platform Admin exists — a producer's own session must never be able to
  approve itself, even for a demo. Built a genuinely separate console
  (`/admin` route, its own login, its own bearer token) instead, so the
  approval step in the demo is a different account approving a different
  account's application, matching what PR-1 actually requires.
- **2026-08-24 (Sonnet session)** — Budget gate answered: session and
  weekly usage both under 10%. Model tier: Sonnet, per the standing plan
  for well-specified build work following an already-written spec — RBAC
  extension work Nitish flagged as next is judged the same tier for now
  since PR-1's RBAC shape is already decided (spec §2/§10), it's applying
  an existing pattern to more roles/routes, not fresh design; revisit if
  that turns out wrong once the actual scope is seen.
- **2026-08-24 (Sonnet session)** — Scoped **Event & Catalogue** as its own
  sub-slice of the core-ticketing backend rather than folding it into a
  bigger pass, continuing the same incremental sub-slice pattern as
  Identity & Access. Data model choice: `Event` is a dated session within
  a `Festival` (e.g. one day / one stage) — `Festival`'s existing
  `name`/`startDate`/`endDate`/`venue` fields (frozen, signed off in the
  first sub-slice) were left untouched rather than reshaped around the new
  entities, so `Festival.venue` stays a plain string while the new `Venue`
  model is the real catalogue entity `Event` points to — a known, harmless
  duplication rather than a breaking change to already-signed-off scope.
  `Venue`/`Artist` modelled as shared catalogue data (any producer can
  create them) rather than producer-owned, since that's how they'll
  actually be used once more than one festival exists on the platform.
- **2026-08-24 (Sonnet session)** — A Playwright run driving the actual
  Producer portal UI (not just an HTTP-level script) caught a real bug an
  HTTP-only check had missed: `EventSetup.tsx` crashed on render after
  adding a session because the event-creation API response doesn't
  include `venue`, but the client was optimistically appending an
  incomplete object assuming `event.venue.name` existed. Confirms the
  standing pattern from earlier slices — UI-level Playwright verification
  catches integration bugs that pass at the API-contract level alone; kept
  doing both checks rather than treating the scripted API walk as
  sufficient on its own.
- **2026-08-24 (Sonnet session)** — Asked Nitish to disambiguate "RBAC" as
  the next task before building, since one reading (vendor/affiliate
  onboarding) is explicitly out of Phase 1 scope per spec §3, and would
  need a deliberate spec change first rather than a silent extension. He
  confirmed the other reading: producer suspend/revoke, closing the gap
  between spec §2's "approve/reject/suspend" language and `admin.ts`'s
  actual (approve/reject-only) implementation. Design choice: suspension
  is state on `RoleAssignment` (`suspendedAt`/`suspendedBy`), not a status
  on `ProducerApplication` — keeps the application's approval record as
  history (they *were* approved) while access control lives where
  `requireAuth` already looks. Added a `reinstate` endpoint alongside
  suspend, even though the spec only names the triad up to "suspend" — a
  suspend with no way back would have made the feature nearly impossible
  to demo or test sanely, and reinstating is just clearing the same two
  columns, not new design.
- **2026-08-24 (Sonnet session)** — Nitish asked to sign off the Event &
  Catalogue and RBAC suspend/reinstate sub-slices together rather than one
  at a time. Both stay "built, awaiting sign-off" until that joint review
  happens — Next steps updated accordingly, no separate sign-off attempted
  for either individually.
- **2026-08-24 (Sonnet session)** — While reviewing Event & Catalogue live,
  Nitish found his newly-created festival didn't appear in landing search
  — the landing page still read `MOCK_FESTIVALS`, never connected to the
  backend. Asked whether to wire it now or queue it; he chose now, and
  separately asked for it to be recorded in `PHASE_1_SPEC.md` itself (not
  just `PROGRESS.md`) so what's built stays tracked at the spec level —
  added as "LP-1 real-catalogue wiring," same pattern as LP-13. Added a
  new public `GET /festivals/public` endpoint rather than reusing any
  producer-scoped route; merged real data into the existing
  `MOCK_FESTIVALS` array (renamed in-use variable to `CATALOGUE_FESTIVALS`)
  instead of replacing it, so the already-signed-off landing-page slice's
  demo search behaviour doesn't regress. Left LP-3 near-you on mock data
  only and said so explicitly in the spec, rather than quietly shipping a
  "near you" feature that can't actually rank real festivals (no venue
  lat/lon is collected anywhere yet) — flagging a known gap beats a
  feature that looks like it works but silently doesn't for real data.
- **2026-08-24 (Sonnet session)** — Nitish reviewed the landing search
  live at `localhost:4173` (his own screenshot: searching "summer" returns
  his real "Summer with Linkin" festival) and signed off all three
  sub-slices from this session together — Event & Catalogue, RBAC
  suspend/reinstate, landing-catalogue wiring. He flagged "View festival"
  not going anywhere; confirmed as pre-existing/expected (placeholder link
  since the original landing-page slice, needs Orders & Cart), not a
  regression — logged as a next-steps item rather than fixed inline, since
  fixing it means building a real festival detail page, out of scope for
  a sign-off review. No `phase-1` tag — these are sub-slice sign-offs, per
  `.claude/rules/build.md`'s reservation of that tag for whole-phase
  sign-off.
- **2026-08-24 (Sonnet session)** — Asked Nitish to pick the next
  core-ticketing item; he chose Orders & Cart. Since Orders & Cart per
  spec §2 orchestrates inventory + payment and neither existed, asked him
  to confirm scope before building: backend-only (Ticketing & Inventory +
  Orders & Cart APIs, stub payment adapter) vs. also building a new
  fan-facing checkout UI in the same pass. He chose backend-only. Design
  choice for no-oversell (ADR-007): a single conditional `UPDATE
  Allocation SET remaining = remaining - qty WHERE remaining >= qty`
  inside a transaction, not SELECT-then-check-then-UPDATE — the latter has
  a race window under concurrent requests that Postgres row-level locking
  closes for the conditional-UPDATE form even at default READ COMMITTED
  isolation. Verified with a real 10-concurrent-request test against a
  5-unit allocation before considering ADR-007 satisfied, not just
  reasoned about. Hold expiry (10-minute figure, reusing J2's language) is
  reclaimed lazily rather than via a background job — a deliberate scope
  cut for this sub-slice, noted in `PHASE_1_SPEC.md`, not silently
  dropped. Fee itemisation uses a placeholder 10% rate since no fee
  schedule exists in the PRD — flagged as `[TBD]` rather than invented as
  if real, per `CLAUDE.md`'s evidence-over-adjectives rule.
- **2026-08-24 (Sonnet session)** — Built the Fan Web checkout UI as a
  third pathname-routed surface (`/festival/:id`) inside the existing
  Producer-portal Vite app, rather than a new standalone app — matches the
  established minimal-routing pattern (`App.tsx` already branches on
  `/admin`) and avoids standing up a second toolchain for what's still a
  Phase-1-scale surface. Spec's "Fan Web (SSR/SSG)" framing is aspirational
  for later; this is client-rendered, same trade-off already made and
  documented for the static `landing/` page's own scope. Found and fixed a
  real route-ordering bug while adding the new `GET /api/festivals/:id`
  endpoint: a first draft registered it between `/public` and `/mine`
  believing Express matches literal segments before params — it doesn't,
  it matches registration order, so `/mine` would have been silently
  swallowed by `:id`. Caught before running any test, by re-reading how
  Express routing actually works, not discovered via a failing test.
- **2026-08-24 (Sonnet session)** — Fan Web checkout UI and the Ticketing
  & Inventory/Orders & Cart backend signed off together after Nitish
  reviewed both live and said "looks good. consider it sign-off." Per
  `.claude/rules/build.md`'s three-step protocol this closes step 2/3 for
  both sub-slices from this session — real end-to-end tests (Playwright +
  scripted HTTP, logged above) had already closed step 1. No `phase-1` tag
  — sub-slice sign-off, same reservation as every prior slice this
  project.
- **2026-08-24 (Sonnet session)** — Nitish picked "QR rendering" as the
  next item. Caught and corrected a scoping error made earlier this same
  session: `PHASE_1_SPEC.md`'s Fan Web UI entry had said real QR
  rendering was blocked on the object-storage product decision (§8) —
  wrong, that TBD is about *persisting* a QR asset (e.g. for email), not
  *generating* one, and generation needs no storage at all. Built it as a
  pure client-side computation (`qrcode` npm package) rather than waiting
  on an unrelated open decision. Verification went one step further than
  usual: rather than just asserting an `<img>` tag rendered, decoded the
  actual PNG pixel data with `jsQR` and confirmed the decoded text matches
  the ticket's token exactly — proves the QR is genuinely scannable, not
  just image-shaped.
- **2026-08-24 (Sonnet session)** — Real QR rendering signed off after
  Nitish reviewed the confirmation screen live and said "looks good."
  Closes step 2/3 of `.claude/rules/build.md`'s protocol — step 1 (real
  end-to-end test) was already closed by the Playwright + jsQR decode
  verification logged above.
- **2026-08-24 (Sonnet session)** — Before writing the Internal Ops /
  survey specs, raised the standing sensitivity flag from `CLAUDE.md`
  (public repo, real names) proactively rather than waiting for it to be
  raised — the org chart supplied was itself marked CONFIDENTIAL, which
  made this the concrete moment that open item warned about. Nitish
  confirmed real names are fine to commit for this repo; the `[TBD:
  repo-surface classification]` item in `CLAUDE.md` stays open in general
  (this was a decision for this specific document, not a blanket
  resolution of that item) — worth re-raising if a future document
  crosses into "submission-bound or externally shared" territory per that
  item's own wording.
- **2026-08-24 (Sonnet session)** — Nitish asked to promote
  `TAG_InternalOps_v1.md` into `build/`, following the phase-spec naming
  convention. Moved to `build/MVP2_InternalOps/PHASE_2_SPEC.md` via
  `git mv` (history preserved). Note added to the spec's own header: this
  doesn't reverse the earlier scope decision that Internal Ops is a
  separate system from the ticketing product (not a PRD phase) — it's
  filed under `build/` for the spec-before-code/sign-off discipline that
  folder exists to enforce, which applies to any implementation-bound
  work in this repo, not only phases of the product PRD's own numbering.
  Tag reserved for its eventual sign-off is `internal-ops-v1`, not
  `phase-2`, to keep that distinction visible even after the file move.
- **2026-08-24 (Sonnet session)** — Built LP-14 (fan survey → End User
  account) per its spec, written earlier this session. Design choices
  made while implementing, not pre-decided in the spec: `Account.name`
  has no real value to draw on from a survey (only email is collected),
  so it's set to a placeholder derived from the email's local part rather
  than left null — changing `Account.name` to nullable would have been a
  wider, riskier change touching the producer/admin flows that already
  depend on it being present. Kept the demo-only verify shortcut
  (`POST /account/resend-verification` + immediate `verify-email` call)
  clearly labelled in both the UI copy and the code comments as not part
  of the real flow, matching the spec's own instruction not to let a
  stand-in pass as real functionality.
- **2026-08-24 (Sonnet session)** — Fixed three UI issues Nitish flagged
  live on the survey page (dropdown contrast, theme consistency, missing
  per-question validation feedback) plus a fourth request (name capture +
  a persistent "Signed in as" nav). Root-caused the dropdown bug properly
  rather than patching around it: no `color-scheme` CSS property existed
  anywhere in `client/`, so native controls always rendered with the
  browser's light-mode default irrespective of the page's actual dark
  theme — fixed at the token-block level in `theme.css`, not just on the
  one `<select>` that was reported. While fixing the highlighting request,
  found the native `required` attribute on two inputs was silently
  short-circuiting the custom submit handler (and thus the highlighting)
  whenever those specific fields were the empty ones — removed it in
  favour of one unified validation path, rather than leaving two
  different validation systems fighting each other. First verification
  pass of the dropdown fix ran in Playwright's default light-mode context
  and reported false-negative-adjacent results (looked fine, but wasn't
  testing the actual reported scenario) — re-ran with an explicit
  `colorScheme: 'dark'` browser context to match Nitish's real browser
  before considering the fix confirmed.
