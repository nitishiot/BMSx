import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { createSession } from '../auth';

export const adminAuthRouter = Router();

const loginSchema = z.object({ email: z.string().email() });

// Phase 1 has no real admin identity provider yet (PRD TBD #9/#11, staffing
// / SLA). This is a deliberately minimal stand-in: any email that already
// holds the platform_admin role (seeded via `npm run seed`) can mint itself
// a session. Real admin auth (SSO/password/MFA) is out of scope for this
// slice — flagged, not silently built as if it were real.
adminAuthRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const account = await prisma.account.findUnique({
    where: { email: parsed.data.email },
    include: { roleAssignments: { include: { role: true } } },
  });
  const isAdmin = account?.roleAssignments.some((a) => a.role.key === 'platform_admin') ?? false;
  if (!account || !isAdmin) {
    res.status(403).json({ error: 'No platform_admin account with that email' });
    return;
  }
  const token = await createSession(account.id);
  res.json({ token });
});
