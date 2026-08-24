import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { createSession, requireAuth } from '../auth';

export const producerApplicationsRouter = Router();

const submitSchema = z.object({
  producerName: z.string().min(1),
  organisation: z.string().min(1),
  email: z.string().email(),
  festivalName: z.string().min(1),
});

// PR-1 / J7 step 1: a producer submits an application. No auth yet — this
// is the account-creation moment. Returns a bearer token so the client can
// poll its own application status afterwards.
producerApplicationsRouter.post('/', async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { producerName, organisation, email, festivalName } = parsed.data;

  const account = await prisma.account.upsert({
    where: { email },
    update: { name: producerName },
    create: { email, name: producerName },
  });

  const application = await prisma.producerApplication.create({
    data: { accountId: account.id, producerName, organisation, email, festivalName },
  });

  const token = await createSession(account.id);

  res.status(201).json({ token, application });
});

// J7: the applicant checks their own status. accountId is implied by the
// session token, never taken from the request body — the RBAC negative
// test (spec exit check 7) depends on this.
producerApplicationsRouter.get('/me', requireAuth, async (req, res) => {
  const application = await prisma.producerApplication.findFirst({
    where: { accountId: req.account!.id },
    orderBy: { submittedAt: 'desc' },
  });
  // Approved by decision, but the RoleAssignment behind it has since been
  // suspended — requireAuth already excludes it from req.account.roles, so
  // this just gives the client a reason to show instead of a raw 403.
  const suspended = application?.status === 'approved' && !req.account!.roles.includes('producer');
  res.json({ application, roles: req.account!.roles, suspended });
});

// Scoped audit trail for the Producer portal's own demo of PR-1 — only
// entries whose targetId is one of this account's own applications, never
// the full log (that's the admin console's /admin/audit-log).
producerApplicationsRouter.get('/me/audit-log', requireAuth, async (req, res) => {
  const applications = await prisma.producerApplication.findMany({
    where: { accountId: req.account!.id },
    select: { id: true },
  });
  const applicationIds = applications.map((a) => a.id);
  const entries = await prisma.auditLogEntry.findMany({
    where: {
      OR: [
        ...(applicationIds.length ? [{ targetType: 'ProducerApplication', targetId: { in: applicationIds } }] : []),
        { targetType: 'Account', targetId: req.account!.id },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ entries });
});
