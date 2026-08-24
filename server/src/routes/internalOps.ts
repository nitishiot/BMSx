import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth } from '../auth';
import { loadStaffContext, requireAnyCapability, requireCapability, resolveNavLinks } from '../internalOps/auth';
import { buildFullTree, buildSubtree, type OrgRoleRow } from '../internalOps/tree';

export const internalOpsRouter = Router();

// Login/logout used to live here. Both moved to the unified
// `/api/auth/*` router (PHASE_1_IO_INCREMENT_SPEC.md §4/§5, revised
// 2026-08-24) once Nitish chose one real login for every persona —
// staff no longer authenticate through a staff-specific endpoint, they
// sign in the same way a fan or a Platform Admin does and RBAC decides
// what they see. This router keeps only the capability-gated staff data.

internalOpsRouter.get('/me', requireAuth, loadStaffContext, async (req, res) => {
  res.json({
    orgRole: { key: req.staff!.orgRoleKey, title: req.staff!.title },
    displayName: req.staff!.displayName,
    capabilities: req.staff!.capabilities,
    navLinks: resolveNavLinks(req.staff!.capabilities),
  });
});

// Deliberate deviation from PHASE_1_IO_SPEC.md §6's 4-endpoint sketch: no
// separate GET /dashboard. `view_product_roadmap`'s widget reuses
// client/src/featureManifest.ts's already-real, client-side data
// directly (nothing server-side to serve — duplicating it into this API
// would be the actual invented-content risk the spec warns against);
// `/me`'s capability list plus this endpoint's tree data are everything
// the other two widgets need. Noted in PROGRESS.md, not silently dropped.
internalOpsRouter.get('/org-chart', requireAuth, loadStaffContext, async (req, res) => {
  const caps = req.staff!.capabilities;
  // manage_org also unlocks the full tree (PHASE_1_IO_INCREMENT_SPEC.md
  // §2) — the org-admin UI needs to see the whole chart to edit it, same
  // reasoning as view_company_rollup's "superset" grant.
  // assign_new_hire likewise: naming a hire means picking the role to
  // name them against, which needs the chart (PHASE_1_CT_INCREMENT_SPEC.md
  // §2.4). Read-only either way — this endpoint writes nothing.
  const canSeeFullCompany =
    caps.includes('view_company_rollup') || caps.includes('manage_org') || caps.includes('assign_new_hire');
  if (!canSeeFullCompany && !caps.includes('view_engineering_roster')) {
    res.status(403).json({ error: 'Requires view_company_rollup, view_engineering_roster, manage_org, or assign_new_hire' });
    return;
  }

  const rows: OrgRoleRow[] = await prisma.orgRole.findMany({
    select: { id: true, key: true, title: true, department: true, personName: true, reportsToOrgRoleId: true, isTopLevel: true },
  });

  if (canSeeFullCompany) {
    res.json({ scope: 'company', tree: buildFullTree(rows) });
    return;
  }
  res.json({ scope: 'subtree', tree: buildSubtree(rows, req.staff!.orgRoleId) });
});

// [TBD: PHASE_1_IO_SPEC.md §10 item 3 — no real operational metrics source
// exists yet]. Returns an explicit placeholder rather than a fabricated
// number, gated the same as the org-chart rollup.
internalOpsRouter.get('/company-metrics', requireAuth, loadStaffContext, requireCapability('view_company_rollup'), async (_req, res) => {
  res.json({ metrics: null, note: 'No live operational data yet — see PHASE_1_IO_SPEC.md §10.' });
});

// ---------------------------------------------------------------------
// PHASE_1_IO_INCREMENT_SPEC.md §2/§5/§6 — org management, gated on
// manage_org (Founder & Managing Director, Head of Product Development
// only, per seedData.ts's ORG_ROLE_CAPABILITIES).
// ---------------------------------------------------------------------

internalOpsRouter.get('/capabilities', requireAuth, loadStaffContext, requireCapability('manage_org'), async (_req, res) => {
  const capabilities = await prisma.capability.findMany({ orderBy: { key: 'asc' } });
  res.json({ capabilities });
});

// PHASE_1_CT_INCREMENT_SPEC.md §2.5 (IO-7) — a role must say where it
// sits. Either it reports to someone, or rootlessness is claimed
// explicitly with isTopLevel; leaving both out is rejected rather than
// silently producing another root on the company chart.
const createOrgRoleSchema = z
  .object({
    key: z.string().min(1),
    title: z.string().min(1),
    department: z.string().optional(),
    personName: z.string().optional(),
    reportsToOrgRoleId: z.string().uuid().nullable().optional(),
    isTopLevel: z.boolean().optional(),
  })
  .refine((v) => !!v.reportsToOrgRoleId || v.isTopLevel === true, {
    message: 'A role must report to someone, or be explicitly marked top-level',
    path: ['reportsToOrgRoleId'],
  })
  .refine((v) => !(v.reportsToOrgRoleId && v.isTopLevel), {
    message: 'A top-level role cannot also report to someone',
    path: ['isTopLevel'],
  });

internalOpsRouter.post('/org-roles', requireAuth, loadStaffContext, requireCapability('manage_org'), async (req, res) => {
  const parsed = createOrgRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.orgRole.findUnique({ where: { key: parsed.data.key } });
  if (existing) {
    res.status(409).json({ error: 'An OrgRole with that key already exists' });
    return;
  }
  const created = await prisma.orgRole.create({
    data: { ...parsed.data, isTopLevel: parsed.data.isTopLevel ?? false },
  });
  res.status(201).json({ orgRole: created });
});

const editOrgRoleSchema = z.object({
  title: z.string().min(1).optional(),
  department: z.string().nullable().optional(),
  personName: z.string().nullable().optional(),
  reportsToOrgRoleId: z.string().uuid().nullable().optional(),
});

internalOpsRouter.patch('/org-roles/:id', requireAuth, loadStaffContext, requireCapability('manage_org'), async (req, res) => {
  const parsed = editOrgRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const updated = await prisma.orgRole.update({ where: { id: String(req.params.id) }, data: parsed.data }).catch(() => null);
  if (!updated) {
    res.status(404).json({ error: 'OrgRole not found' });
    return;
  }
  res.json({ orgRole: updated });
});

const createCapabilitySchema = z.object({ key: z.string().min(1), description: z.string().min(1) });

internalOpsRouter.post('/capabilities', requireAuth, loadStaffContext, requireCapability('manage_org'), async (req, res) => {
  const parsed = createCapabilitySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.capability.findUnique({ where: { key: parsed.data.key } });
  if (existing) {
    res.status(409).json({ error: 'A Capability with that key already exists' });
    return;
  }
  const created = await prisma.capability.create({ data: parsed.data });
  res.status(201).json({ capability: created });
});

const grantSchema = z.object({ capabilityId: z.string().uuid() });

internalOpsRouter.post('/org-roles/:id/capabilities', requireAuth, loadStaffContext, requireCapability('manage_org'), async (req, res) => {
  const parsed = grantSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const created = await prisma.orgRoleCapability.upsert({
    where: { orgRoleId_capabilityId: { orgRoleId: String(req.params.id), capabilityId: parsed.data.capabilityId } },
    update: {},
    create: { orgRoleId: String(req.params.id), capabilityId: parsed.data.capabilityId },
  }).catch(() => null);
  if (!created) {
    res.status(404).json({ error: 'OrgRole or Capability not found' });
    return;
  }
  res.status(201).json({ granted: true });
});

internalOpsRouter.delete('/org-roles/:id/capabilities/:capabilityId', requireAuth, loadStaffContext, requireCapability('manage_org'), async (req, res) => {
  await prisma.orgRoleCapability.deleteMany({
    where: { orgRoleId: String(req.params.id), capabilityId: String(req.params.capabilityId) },
  });
  res.status(204).send();
});

// ---------------------------------------------------------------------
// PHASE_1_IO_INCREMENT_SPEC.md §2/§5/§6 — real fan survey responses
// (survey.SurveyResponse, persisted since LP-14), gated on
// view_survey_responses. Cross-schema join done in application code
// (accountId is a plain UUID, no FK — ADR-005), same pattern as every
// other identity/<module> boundary in this codebase.
// ---------------------------------------------------------------------
internalOpsRouter.get('/survey-responses', requireAuth, loadStaffContext, requireCapability('view_survey_responses'), async (_req, res) => {
  const responses = await prisma.surveyResponse.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  const accounts = await prisma.account.findMany({
    where: { id: { in: responses.map((r) => r.accountId) } },
    select: { id: true, name: true, email: true },
  });
  const accountById = new Map(accounts.map((a) => [a.id, a]));
  res.json({
    responses: responses.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      answers: r.answers,
      account: accountById.get(r.accountId) ?? null,
    })),
  });
});

// ---------------------------------------------------------------------
// PHASE_1_CT_INCREMENT_SPEC.md §2.4 — record a hire against an open
// position. Narrower than the generic role PATCH on purpose: HR names
// people, it doesn't restructure the org. Naming someone here creates
// NO login — StaffProfile/Credential stay separate acts.
// ---------------------------------------------------------------------
const assignPersonSchema = z.object({ personName: z.string().trim().min(1).max(120).nullable() });

internalOpsRouter.patch(
  '/org-roles/:id/person',
  requireAuth,
  loadStaffContext,
  requireAnyCapability('assign_new_hire', 'manage_org'),
  async (req, res) => {
    const parsed = assignPersonSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const updated = await prisma.orgRole
      .update({ where: { id: String(req.params.id) }, data: { personName: parsed.data.personName } })
      .catch(() => null);
    if (!updated) {
      res.status(404).json({ error: 'OrgRole not found' });
      return;
    }
    res.json({ orgRole: updated });
  },
);

// ---------------------------------------------------------------------
// PHASE_1_CT_INCREMENT_SPEC.md §2.1 — platform-wide event roster,
// read-only, gated on view_all_events. Assembled in application code
// across the catalogue / inventory / orders / identity schemas, which
// hold no FKs across their boundaries (ADR-005): each schema is queried
// in one bounded batch keyed by the previous level's id set, never once
// per row (§7's no-N+1 target).
// ---------------------------------------------------------------------
internalOpsRouter.get('/events', requireAuth, loadStaffContext, requireCapability('view_all_events'), async (_req, res) => {
  const festivals = await prisma.festival.findMany({
    orderBy: { startDate: 'asc' },
    include: { events: { orderBy: { startsAt: 'asc' }, include: { venue: true, zones: { orderBy: { name: 'asc' } } } } },
  });

  const zoneIds = festivals.flatMap((f) => f.events.flatMap((e) => e.zones.map((z) => z.id)));
  const ticketTypes = zoneIds.length
    ? await prisma.ticketType.findMany({ where: { zoneId: { in: zoneIds } }, include: { allocation: true } })
    : [];

  const ticketTypeIds = ticketTypes.map((t) => t.id);
  const issued = ticketTypeIds.length
    ? await prisma.ticket.groupBy({ by: ['ticketTypeId'], where: { ticketTypeId: { in: ticketTypeIds } }, _count: { _all: true } })
    : [];
  const issuedByTicketType = new Map(issued.map((row) => [row.ticketTypeId, row._count._all]));

  const producers = await prisma.account.findMany({
    where: { id: { in: [...new Set(festivals.map((f) => f.producerAccountId))] } },
    select: { id: true, name: true, email: true },
  });
  const producerById = new Map(producers.map((a) => [a.id, a]));

  const typesByZone = new Map<string, typeof ticketTypes>();
  for (const t of ticketTypes) {
    const list = typesByZone.get(t.zoneId) ?? [];
    list.push(t);
    typesByZone.set(t.zoneId, list);
  }

  res.json({
    festivals: festivals.map((f) => ({
      id: f.id,
      name: f.name,
      venue: f.venue,
      startDate: f.startDate,
      endDate: f.endDate,
      producer: producerById.get(f.producerAccountId) ?? null,
      events: f.events.map((e) => ({
        id: e.id,
        name: e.name,
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        venue: { name: e.venue.name, city: e.venue.city, country: e.venue.country },
        zones: e.zones.map((z) => ({
          id: z.id,
          name: z.name,
          capacity: z.capacity,
          priceTier: z.priceTier,
          ticketTypes: (typesByZone.get(z.id) ?? []).map((t) => ({
            id: t.id,
            name: t.name,
            priceMinorUnits: t.priceMinorUnits,
            currency: t.currency,
            allocationTotal: t.allocation?.totalQuantity ?? null,
            allocationRemaining: t.allocation?.remaining ?? null,
            ticketsIssued: issuedByTicketType.get(t.id) ?? 0,
          })),
        })),
      })),
    })),
  });
});
