import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth, createSession } from '../auth';
import { loadStaffContext, requireCapability } from '../internalOps/auth';
import { buildFullTree, buildSubtree, type OrgRoleRow } from '../internalOps/tree';

export const internalOpsRouter = Router();

// Same stand-in pattern as adminAuthRouter (PHASE_2_SPEC.md §4): any
// account with a seeded StaffProfile can mint itself a session. Real
// staff SSO is [TBD] — flagged there, not silently built as if real.
const loginSchema = z.object({ email: z.string().email() });

internalOpsRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const account = await prisma.account.findUnique({ where: { email: parsed.data.email } });
  const profile = account ? await prisma.staffProfile.findUnique({ where: { accountId: account.id } }) : null;
  if (!account || !profile) {
    res.status(403).json({ error: 'No Internal Ops staff profile for that email' });
    return;
  }
  const token = await createSession(account.id);
  res.json({ token });
});

internalOpsRouter.get('/me', requireAuth, loadStaffContext, async (req, res) => {
  res.json({
    orgRole: { key: req.staff!.orgRoleKey, title: req.staff!.title },
    displayName: req.staff!.displayName,
    capabilities: req.staff!.capabilities,
  });
});

// Deliberate deviation from PHASE_2_SPEC.md §6's 4-endpoint sketch: no
// separate GET /dashboard. `view_product_roadmap`'s widget reuses
// client/src/featureManifest.ts's already-real, client-side data
// directly (nothing server-side to serve — duplicating it into this API
// would be the actual invented-content risk the spec warns against);
// `/me`'s capability list plus this endpoint's tree data are everything
// the other two widgets need. Noted in PROGRESS.md, not silently dropped.
internalOpsRouter.get('/org-chart', requireAuth, loadStaffContext, async (req, res) => {
  const caps = req.staff!.capabilities;
  if (!caps.includes('view_company_rollup') && !caps.includes('view_engineering_roster')) {
    res.status(403).json({ error: 'Requires view_company_rollup or view_engineering_roster' });
    return;
  }

  const rows: OrgRoleRow[] = await prisma.orgRole.findMany({
    select: { id: true, key: true, title: true, department: true, personName: true, reportsToOrgRoleId: true },
  });

  if (caps.includes('view_company_rollup')) {
    res.json({ scope: 'company', tree: buildFullTree(rows) });
    return;
  }
  res.json({ scope: 'subtree', tree: buildSubtree(rows, req.staff!.orgRoleId) });
});

// [TBD: PHASE_2_SPEC.md §10 item 3 — no real operational metrics source
// exists yet]. Returns an explicit placeholder rather than a fabricated
// number, gated the same as the org-chart rollup.
internalOpsRouter.get('/company-metrics', requireAuth, loadStaffContext, requireCapability('view_company_rollup'), async (_req, res) => {
  res.json({ metrics: null, note: 'No live operational data yet — see PHASE_2_SPEC.md §10.' });
});
