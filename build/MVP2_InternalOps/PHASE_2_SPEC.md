# Phase 2 Spec — Internal Ops Console

**Status:** built (2026-08-24), awaiting sign-off. Per
`.claude/rules/build.md`: not "done" until the three-step sign-off
protocol (real test, shown live, approved) is met — steps 1 (real
end-to-end test) is closed, see §8; step 2/3 (shown live, approved) not
yet done — see `PROGRESS.md`.
**Author:** drafted with Claude (Sonnet/Opus), 24 August 2026. Promoted
into `build/` (from a root-level `TAG_InternalOps_v1.md`) on 2026-08-24
to follow the same phase-spec convention as `MVP1_CoreTicketing/`, per
`build/README.md`.
**Scope decision (2026-08-24):** this is a **separate system** from the
festival-ticketing product `TAG_PRD_v3.md` describes — internal staff
tooling (role-scoped dashboards over company operations), not a feature
for Festival Goers or Festival Clients & Suppliers. It does not amend the
PRD. It's still specced under `build/` (not left as a root-level
`TAG_<Topic>_vN.md`) because it's implementation-bound work that needs
the same spec-before-code/sign-off discipline as any other phase — "MVP"
here doesn't imply it's a phase *of the ticketing product*, only that
it's the second build track this repo is specced against.

---

## 1. Objective

Give every TAG staff member (per the org chart below) a login that lands
them on a dashboard scoped to their role — not a generic admin panel
everyone sees the same version of, and not one bespoke page per person.
The framework is generic (role → capability → dashboard widgets); this
v1 spec fully designs and scopes **three priority roles** to prove the
framework, with the remaining ~17 roles following the same pattern in a
later pass once the framework is validated.

## 2. Org chart (source: "FairFare Organization Chart", provided
2026-08-24; CONFIDENTIAL marking noted — Nitish confirmed real names may
be committed to this repo)

Reporting lines as shown on the chart, plus the one addition below:

**Under Founder & Managing Director (Ila Nicholson):**
CFO (Jon Abelarde) → 3× Analyst · CIO → Analyst · CAO → HR ·
Accounting (Gilroy & Gannon) · Legal (LK Sheilds) ·
VP Ticketing Strategy (TJ Chambers) ·
CTO (Satish Billakota) → VP of Tech (Khadir Fayaz) → FinTech → Jr Tech,
E-Commerce → Jr Tech, App Development → Cloud Team
Non-Executive Advisors: Jonathan McMorrow, David Lesshoff.

**Under Founder & Creative Director (Shane Mitchell):**
Branding Director (Malcolm Gaskin) → Marketing Manager → Corporate
Marketing; → Marketing Affiliates → Event Marketing ·
Events Manager → Lead Promoter → Event Coord; → Local Coord → Event Coord ·
Festivals Leader · Ticketing Operations Manager ·
Festival Specialist (Chris Prosser).
Non-Executive Advisors: Tommy Higgins, Steve Machin.

**Addition (requested 2026-08-24):** **Head of Product Development**
(Nitish Gupta), reporting to **CTO**, peer to VP of Tech.

*Chart image showed one duplicated row ("What type of accommodation did
you book" appears twice under different figures) — noted for the survey
spec below, not the org chart; unrelated duplication, flagged for
completeness, not silently corrected without saying so.*

## 3. In scope (this v1 pass)

- **Generic RBAC/dashboard framework**: an `OrgRole` hierarchy (mirrors
  the chart), a `Capability` catalogue, and role→capability grants that
  drive which dashboard widgets a logged-in staff member sees — adding a
  new role + capability grants should not require new frontend code for
  a widget type that already exists.
- **Three fully-specced roles**, chosen to exercise different capability
  domains and different levels of the hierarchy:
  1. **Head of Product Development** (new role, individual contributor
     level under CTO) — product/roadmap visibility.
  2. **CTO** (department head) — engineering team roster + status.
  3. **Founder & Managing Director** (top of hierarchy) — full-visibility
     rollup.
- Staff login (reuses Identity & Access's existing `Account`/`Session`,
  new role keys — see §5).
- RBAC negative test: a staff account can only reach its own
  role's dashboard/capabilities, never another's by URL manipulation.

## 4. Explicitly out of scope (this v1 pass)

- The other ~17 roles on the chart (CFO, CIO, CAO, HR, Legal, Accounting,
  VP Ticketing Strategy, VP of Tech, FinTech, E-Commerce, App Development,
  Jr Tech ×2, Cloud Team, Branding Director, Marketing Manager, Corporate
  Marketing, Marketing Affiliates, Event Marketing, Events Manager, Lead
  Promoter, Local Coord, Event Coord ×2, Festivals Leader, Ticketing
  Operations Manager, Festival Specialist) — same `OrgRole`/`Capability`
  pattern, deferred to a later pass once the framework is proven on the
  three above.
- Non-Executive Advisors — shown on the chart with no operational
  reports/capabilities implied; not given console access in this spec.
- Real business metrics/KPIs on any dashboard. No live ticket sales,
  infra, or financial data exists yet (Phase 1 hasn't shipped) — v1
  dashboards show **structural** data (org roster, role, capabilities,
  reports) with metric widgets stubbed and explicitly labelled
  `[TBD: real data source once operational]`, never invented numbers.
- SSO/real staff identity provider — same stand-in pattern as the
  existing Platform Admin login (`adminAuth.ts`): any account holding the
  right role can mint itself a session. Flagged as a stand-in, not real
  auth, same as that precedent.

## 5. Data model

New Postgres schema `internalops` (own module, ADR-005 — no FK crosses
into `identity`; `accountId` fields are plain UUID columns validated in
application code, same pattern as every other cross-module reference in
this codebase).

```
OrgRole
  id, key (unique, e.g. "head_of_product_dev", "cto", "founder_md")
  title, department
  reportsToOrgRoleId  (self-FK, nullable — null only for the two Founders)
  createdAt

Capability
  id, key (unique, e.g. "view_product_roadmap", "view_engineering_roster",
           "view_company_rollup", "manage_team")
  description

OrgRoleCapability   (join table: orgRoleId, capabilityId)

StaffProfile
  id, accountId (plain UUID -> identity.Account), orgRoleId, displayName
  createdAt
```

`identity.Account`/`Session` are reused as-is (no schema change there);
staff sign in the same way a producer or admin does — a session token,
just checked against `StaffProfile`/`OrgRole` instead of
`identity.RoleAssignment`. This deliberately does **not** reuse
`identity.Role`/`RoleAssignment` (the fan/producer/platform_admin RBAC
axis) — mixing product RBAC and internal-ops RBAC into one table would
blur two genuinely different concerns (ADR-005's one-owner rule applies
here too, just at the "which system owns this fact" level, not only the
schema level).

## 6. API sketch

- `POST /api/internal-ops/login` — same stand-in pattern as
  `adminAuthRouter`: an email with a `StaffProfile` gets a session token.
- `GET /api/internal-ops/me` — returns the caller's `OrgRole`,
  `displayName`, and resolved capability list (via `OrgRoleCapability`).
- `GET /api/internal-ops/dashboard` — returns widget data scoped to the
  caller's capabilities only; a capability the caller doesn't hold simply
  isn't included in the response (not a 403 per-widget — the whole
  response is already scoped).
- `GET /api/internal-ops/org-chart` — read-only tree (for a manager's
  "my reports" widget — e.g. CTO sees Head of Product Development +
  VP of Tech as direct reports).

## 7. Priority role dashboards (v1)

| Role | Key capabilities | v1 widgets (structural, not invented metrics) |
|---|---|---|
| Head of Product Development | `view_product_roadmap` | The existing P1/P2 roadmap manifest (`client/src/featureManifest.ts`, already real content sourced from PRD §10) rendered as an editable backlog view — reuses real data, invents nothing new. |
| CTO | `view_engineering_roster`, `manage_team` | Org-chart subtree rooted at CTO (Head of Product Development, VP of Tech → FinTech/E-Commerce/App Development → Jr Tech/Cloud Team), pulled live from `OrgRole.reportsToOrgRoleId`. |
| Founder & Managing Director | `view_company_rollup` (superset of all capabilities) | Full org tree rollup; a metrics panel present but explicitly rendered as `[TBD: no live operational data yet]` rather than a fabricated number. |

## 8. Exit checks

1. **Met.** A seeded `head_of_product_dev` account logs in and sees the
   roadmap widget; does not see the CTO's team-roster widget or the
   Founder's rollup. Verified live with Playwright.
2. **Met.** A seeded `cto` account sees its subtree (Head of Product
   Development + VP of Tech's branch, matching §2's chart) — verified via
   both a scripted HTTP walk and Playwright.
3. **Met.** RBAC negative test: Head of Product Development's account
   hitting `/org-chart` directly (no capability for it) gets a 403, not
   another role's data; unauthenticated requests get 401. Verified with
   real HTTP requests against seeded accounts, not asserted from the
   design.
4. **Met.** A synthetic 4th `OrgRole` + brand-new `Capability` (key never
   referenced anywhere in server/client code) was inserted via Prisma
   directly (equivalent to a seed-data addition) and logged in through
   the real API with zero backend code changes — `/me` correctly
   reflected the new role/capability, and the new node appeared in the
   CTO's subtree correctly. Verified with a script, then cleaned up
   (test-only rows removed after the run, not left in seed data).

**Bug found and fixed during exit-check-4 verification:** the client's
first widget-rendering pass mapped capabilities to widgets via a naive
per-capability loop, which double-rendered the org-tree widget (as both
"Your team" and "Company org chart") for any role holding both
`view_engineering_roster` and `view_company_rollup` — the Founder, by
design (§7's "superset"). Fixed by resolving tree/metrics visibility
once by priority (`view_company_rollup` wins) rather than iterating
capabilities blindly; still capability-driven, not role-driven, so exit
check 4's genericity claim still holds — confirmed by re-running that
check afterward.

## 9. Non-functional targets

Per `.claude/rules/build.md` — measured live once built; all `[TBD]`
until then, same discipline as `PHASE_1_SPEC.md`.

- Throughput/latency: `[TBD: internal tool, ~20 staff users max — likely
  no meaningful load concern, but not asserted without measuring]`.
- Index/query coverage: org-tree traversal (`reportsToOrgRoleId` chains)
  needs an index on that column — checked against `EXPLAIN` before
  sign-off, not assumed.

## 10. Open items

1. Real staff SSO/identity provider — currently a stand-in (§4), same
   category of gap as the Platform Admin login.
2. The other ~17 roles — deferred, not designed in this pass beyond "same
   pattern."
3. Real operational metrics sources (finance figures, engineering
   uptime, marketing conversion) — none exist yet; every metric widget in
   this v1 is structural (roster/roles), not numeric.

## 11. Sign-off

Per `.claude/rules/build.md`: not "done" until (1) a real end-to-end test
against a real system, (2) shown live to Nitish, (3) his explicit
approval.

- **Date:** _(blank until approved)_
- **Approver:** _(blank until approved)_
- **Tag:** `internal-ops-v1`, applied to the commit where sign-off is
  granted — deliberately not `phase-2`, since this isn't a phase of the
  ticketing product's own numbering (`phase-1` is reserved for
  `MVP1_CoreTicketing`'s whole-slice sign-off).
