# Phase 1 IO — Increment Spec: RBAC nav, org management, real login

**Status:** built (2026-08-24), awaiting sign-off. Per
`.claude/rules/build.md`: not "done" until the three-step sign-off
protocol (real test, shown live, approved) is met — step 1 (real
end-to-end test) is closed, see `PROGRESS.md` → Status for detail; step
2/3 (shown live, approved) not yet done.
**Author:** drafted with Claude (Sonnet), 24 August 2026.
**Relationship to `PHASE_1_IO_SPEC.md`:** this is a **scope addition**, not
a replacement. `PHASE_1_IO_SPEC.md` is built (awaiting sign-off) and stays
as-is; this file layers new requirements on top of it rather than being
folded back into that spec, per the `_INCREMENT` naming rule in
`.claude/rules/build.md`. Everything below assumes `PHASE_1_IO_SPEC.md`'s
data model (`OrgRole`, `Capability`, `OrgRoleCapability`, `StaffProfile`)
and its three priority roles already exist.

**Scope note (§12):** §12 (landing-page search/near-you layout) is not an
Internal Ops item — structurally it belongs under `MVP1_CoreTicketing`
(`PHASE_1_CT_SPEC.md`, LP-1/LP-3). Filed here anyway at Nitish's explicit
request rather than a new `MVP1_CoreTicketing` increment file, so it's
flagged plainly rather than silently miscategorised.

---

## 1. Objective

Five gaps found while reviewing the Internal Ops Console live: (1) every
portal's nav shows every link to everyone, regardless of role — a Founder
-only dashboard link is visible to a CTO account; (2) org structure can
only be changed by editing seed data, not from the console; (3) the
Founder's org view is a plain nested list, not a real hierarchy diagram;
(4) fan survey responses are captured (per `PHASE_1_CT_SPEC.md` LP-14) but
never surfaced to any Internal Ops dashboard; (5) Internal Ops login is
still the email-only stand-in from `PHASE_1_IO_SPEC.md` §4 — no password,
no explicit logout. This increment closes all five.

## 2. In scope

1. **RBAC-aware navigation** across every client-rendered surface
   (`/survey`, `/account`, `/festival/:id`, `/` producer portal, `/admin`,
   `/ops`) — the nav a signed-in session sees lists only the
   portals/pages that session's actual identity (fan `Account`, producer
   `RoleAssignment`, `platform_admin` `RoleAssignment`, or staff
   `StaffProfile`/`OrgRole`) is entitled to reach. Within Internal Ops
   itself, this also gates page-level links, not just widgets — e.g. a
   CTO's nav never renders a link to a Founder-only page, even one they
   could theoretically reach by typing the URL (the API-level 403 from
   `PHASE_1_IO_SPEC.md` §8 exit-check-3 already blocks the data; this adds
   the same gating one level up, at the link itself).
   **Correction (2026-08-24, mid-build):** this item's first draft assumed
   the other portals didn't need cross-portal nav since they "don't
   cross-link to each other today" — Nitish reviewed live and pointed out
   that's the actual gap, not a reason to skip it: every `client/` surface
   now mounts a shared `PortalsMenu` component in its nav (same five
   -portal link set as landing's own dropdown), and the account/session
   slot always renders something (previously blank when a fan was signed
   out, inconsistent against landing's always-present dropdown). Also
   found and fixed while addressing this: every surface's nav bar was
   nested *inside* its page's max-width-capped content div, silently
   narrowing the nav to match (Producer portal was the one exception,
   full-bleed by accident) — restructured so nav is always a sibling of
   the capped content, never nested in it. See `.claude/rules/design.md`
   (new this session) for the standing rule this created.
2. **Org management for `manage_org` holders.** Founder & Managing
   Director and Head of Product Development get a new `manage_org`
   capability (Nitish's explicit call, both — an IC-level role holding an
   org-wide admin capability is a deliberate exception to the "capability
   maps to job level" pattern elsewhere in `PHASE_1_IO_SPEC.md`, not an
   oversight). Holding it unlocks a console UI to:
   - create/edit an `OrgRole` (title, department, reports-to)
   - create a `Capability`
   - grant/revoke a `Capability` on an `OrgRole`
   All through the real API — no more seed-data-only role creation.
3. **Org-chart tree visualisation** on the Founder's dashboard (and
   reused for the CTO's smaller subtree view) — a real hierarchy diagram,
   not the existing plain nested list, styled with the console's existing
   dark-theme tokens (same palette/pill language as the rest of
   `client/`, not a new visual system).
4. **Survey-response visibility.** A new `view_survey_responses`
   capability, granted to Founder & Managing Director and Head of Product
   Development, backing a dashboard widget that reads real
   `survey.SurveyResponse` rows (already persisted since `PHASE_1_CT_SPEC.md`
   LP-14 — this is a new read surface on existing data, not a new
   collection mechanism).
5. **Real username/password login + explicit logout for Internal Ops.**
   Replaces `PHASE_1_IO_SPEC.md` §4's "any account with a `StaffProfile`
   can mint itself a session" stand-in with an actual password check and
   a logout endpoint that invalidates the session server-side (not just a
   client-side token discard).

## 3. Explicitly out of scope (this increment)

- **Producer portal / Platform Admin console login** stay on their
  existing stand-in pattern (`adminAuth.ts`-style, no password). Same
  category of gap as Internal Ops's old login, but a separate system
  (`identity.RoleAssignment`, not `StaffProfile`) — real credentials there
  is a follow-on increment, not bundled into this one.
- **Password reset / forgot-password flow.** No email provider is chosen
  yet (`PHASE_1_CT_SPEC.md` §8 — same open TBD LP-14's verification email
  already carries); a reset flow needs that decision first. Until then, a
  forgotten password is a manual DB fix, acknowledged as a real gap.
- **Real staff SSO.** Carried over from `PHASE_1_IO_SPEC.md` §4/§10 — still
  a stand-in category, just a materially better one (real password check)
  than before.
- **The landing page (`landing/index.html`) showing "Signed in as X"
  instead of "Sign in / Portals."** Landing is a static file served from a
  separate origin from `client/` (`localhost:4173` vs `:5173` in dev; no
  shared domain decided for prod) — it cannot read a `client/`-side
  session today. Two real options exist and neither is decided:
  (a) a shared-parent-domain cookie once both are deployed under the same
  domain, or (b) landing makes a small authenticated API call on load.
  Flagged here as `[TBD: needs a deployment-topology decision before
  design, not just a code change]` — do not build a guess at this.
- **The other ~17 org-chart roles.** Still deferred per
  `PHASE_1_IO_SPEC.md` §4 — this increment's `manage_org` UI makes adding
  them a console action instead of a seed-data edit, but doesn't add them
  itself.

## 4. Data model additions

New in schema `internalops` (ADR-005 still applies — no FK into
`identity`):

```
StaffCredential
  id, accountId (unique, plain UUID -> identity.Account)
  passwordHash   (bcrypt; library TBD to whichever is already vetted for
                  Node — evidence-based pick at build time, not invented)
  createdAt, updatedAt
```

No change to `OrgRole`/`Capability`/`OrgRoleCapability`/`StaffProfile` —
this increment adds rows (a `manage_org` and a `view_survey_responses`
`Capability`, granted to the two roles named in §2) and gives the console
a way to add more, it doesn't reshape the model from `PHASE_1_IO_SPEC.md`.

## 5. API sketch

- `POST /api/internal-ops/login` — **changes** from email-only to
  email + password; rejects with a generic "invalid credentials" (never
  reveals whether the email exists) on either a wrong password or an
  account with no `StaffCredential` row yet (pre-migration accounts need
  a one-time password set — see §8 migration note).
- `POST /api/internal-ops/logout` — **new**; deletes the caller's
  `identity.Session` row server-side. Client discards its local token
  regardless, but the server-side row is what actually matters — a
  logged-out token must not keep working if replayed.
- `GET /api/internal-ops/me` — **extended**: response gains a `navLinks`
  array (resolved server-side from the caller's capabilities), so the
  client renders nav from data, not from a client-side capability→link
  map that could drift from the server's actual grants.
- `POST /api/internal-ops/org-roles`, `PATCH /api/internal-ops/org-roles/:id`
  — **new**, gated on `manage_org`.
- `POST /api/internal-ops/capabilities` — **new**, gated on `manage_org`.
- `POST /api/internal-ops/org-roles/:id/capabilities`,
  `DELETE /api/internal-ops/org-roles/:id/capabilities/:capabilityId` —
  **new**, gated on `manage_org`.
- `GET /api/internal-ops/survey-responses` — **new**, gated on
  `view_survey_responses`; paginated, no PII beyond what LP-14 already
  collects (name/email/answers).

Every other client surface (`/survey`, `/account`, `/festival/:id`, the
producer portal, `/admin`) gets an equivalent "what can this session
reach" signal added to its own existing `/me`-style endpoint, so the
shared nav component can render consistently — not a new endpoint per
surface, extending what's already there.

## 6. UI

- A shared nav component (extending the existing `FanNav` pattern used by
  Survey/Account/Festival pages, and the shell-nav pattern used by
  Producer portal/Admin console/Internal Ops) reads its owning surface's
  `/me`-equivalent response and renders only permitted links — including,
  for Internal Ops specifically, gating page-level links (e.g. "Org chart
  editor" only for `manage_org` holders), not only dashboard widgets.
- Internal Ops gets an "Org roles" admin screen (list/create/edit
  `OrgRole`, grant/revoke `Capability`) visible only to `manage_org`
  holders.
- Founder's dashboard org-tree widget becomes a real diagram — expandable
  /collapsible nodes, using the app's existing dark palette and pill/card
  visual language (`--bg-raised`, `--border-md`, `--accent` tokens already
  in `theme.css` — no new colour system introduced).
- A "Survey responses" widget/table on Founder & Head of Product
  Development dashboards, reading `GET /api/internal-ops/survey-responses`.
- A real Internal Ops login page (email + password fields, error state
  for invalid credentials) replacing the current email-only form; a
  visible "Sign out" action that calls the new logout endpoint.

## 7. Exit checks

1. Login rejects a wrong password and an unknown email with the same
   generic error (no user enumeration); a correct password issues a
   session. `StaffCredential.passwordHash` never contains a plaintext
   password (checked directly in the DB during verification, not assumed).
2. Logout invalidates the session server-side: the same token replayed
   against `GET /me` after logout returns 401, not a cached success.
3. Nav-link RBAC verified for at least: an unauthenticated visitor, a fan
   `Account`, a producer, a platform admin, and two different staff roles
   (one holding `manage_org`, one not) — each sees a different, correct
   link set; no role sees a link to a page its capabilities don't cover.
4. A `manage_org` holder creates a new `OrgRole` + `Capability` and grants
   it through the console UI (not a script) and it's immediately visible
   in `GET /org-chart`; a non-`manage_org` staff account gets 403 hitting
   the same endpoints directly.
5. Founder's org-tree widget renders the real 35-node hierarchy as an
   actual diagram (not a bulleted list) and matches the app's theme
   tokens in both light and dark mode, if both are supported by that
   point — otherwise whichever mode the console already commits to.
6. A real survey submission (via `/survey`) appears in the Founder's and
   Head of Product Development's "Survey responses" widget without a
   server restart or manual query; a staff role without
   `view_survey_responses` gets 403 hitting the endpoint directly and
   never sees the widget.

## 8. Migration note

Existing seeded staff accounts (`nitish@tag.local`, `cto@tag.local`,
`founder@tag.local`) predate `StaffCredential` and have no password set.
Before login switches to password-required, these three need a one-time
password set (seed script or a manual one-off) — flagged here so it isn't
discovered as a "login broken" surprise mid-build.

## 9. Non-functional targets

Per `.claude/rules/build.md` — same discipline as `PHASE_1_IO_SPEC.md` §9:
internal tool, ~20 staff users max, no meaningful load concern expected
but not asserted without measuring. Password hashing cost factor checked
against current bcrypt guidance at build time, not hardcoded from memory.

## 10. Open items

1. Landing-page cross-origin "Signed in as X" (§3) — needs a deployment
   -topology decision (shared domain vs. API call) before design. **Same
   root cause as item 5 below** — both stem from landing and `client/`
   being genuinely separate origins today.
2. Producer/Admin console real login — same category of gap, deferred to
   a later increment (§3).
3. Password reset flow — blocked on the same unresolved email-provider
   TBD as LP-14 (`PHASE_1_CT_SPEC.md` §8).
4. Real staff SSO — still deferred, carried over from `PHASE_1_IO_SPEC.md`.
5. **New (2026-08-24): single-domain architecture question.** Nitish
   noticed the TAG logo on any `client/` page didn't lead back to the
   actual landing page — it linked to `client/`'s own `/` (the Producer
   portal's root), a coincidence of routing, not the marketing page.
   Immediate fix applied: `client/src/api.ts`'s new `LANDING_BASE`
   constant (mirrors landing's existing `CLIENT_APP_BASE`) — every "TAG"
   logo link now points to landing's real origin. The deeper question
   Nitish raised — should landing and `client/` become one single web app
   (one port, one deploy) instead of two — is a real architecture
   decision, not resolved here: recommended keeping landing as a
   separate static build (preserves the deliberate LP-4 performance
   rationale from the 2026-08-23 decision) but serving both under one
   production domain via path-based routing once a hosting/deploy target
   is chosen (landing at `/`, `client/`'s surfaces at `/survey`,
   `/account`, `/festival/*`, `/apply`, `/admin`, `/ops`) — this would
   also resolve item 1 above for free, since same-domain means a shared
   cookie/session becomes possible. That's a hosting decision this repo
   has repeatedly deferred (no cloud/deploy target chosen yet, per
   `TAG_Architecture_v1.md`'s open TBDs) — flagged here for Nitish to
   decide, not assumed.

## 11. Landing-page search & near-you layout (see scope note above — not
an Internal Ops item)

Regression from this session's earlier width pass: `.search-inner` and
`.nearby-inner` were widened from `720px` to `1800px` to match the
Platform/Plans/Roadmap sections (2026-08-23 sign-off), but for these two
sections — sparse content (one input row; a title, a button, a card
strip) — the 1800px canvas reads as content stranded in opposite corners
rather than one coherent module. Nitish flagged this live: the search bar
should read as bigger/more prominent (it's "the highlight of the page"),
and Events Near You's heading/"Use my location"/result cards should sit
centred, not pinned to the two far edges of a near-empty wide row.

- **Search bar:** increase `.search-form`'s visual weight (larger input
  height/font-size, kept centred) rather than just widening its
  container — the fix is prominence, not just width, per how it was
  presented before the 1800px pass.
- **Events near you:** recentre `.nearby-inner`'s content — heading,
  "Use my location" control, and the result-card strip — instead of
  letting `justify-content:space-between`-style edge-anchoring spread them
  across the full 1800px canvas. Likely fix: cap an inner
  content wrapper back to a narrower centred width (matching the search
  section's proportions) while leaving the *section* background/canvas at
  1800px for visual consistency with its neighbours — needs a live check
  against how the search section actually resolves this, not assumed
  identical.

No backend/data change — CSS/layout only in `landing/index.html`.

### Exit check

Nitish confirms live (screenshot or local render) that the search bar
reads as prominent/centred and Events Near You reads as one centred
module, not two corner-anchored elements, at a wide (≥1440px) viewport —
same review pattern as every other landing-page change this project.

## 12. Sign-off

Per `.claude/rules/build.md`: not "done" until (1) a real end-to-end test
against a real system, (2) shown live to Nitish, (3) his explicit
approval.

- **Date:** _(blank until approved)_
- **Approver:** _(blank until approved)_
- **Tag:** `internal-ops-v1-increment-1`, applied to the commit where
  sign-off is granted.
