import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth, requireRole } from '../auth';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('platform_admin'));

adminRouter.get('/producer-applications', async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const applications = await prisma.producerApplication.findMany({
    where: status ? { status: status as 'pending' | 'approved' | 'rejected' } : undefined,
    orderBy: { submittedAt: 'desc' },
  });
  res.json({ applications });
});

const decisionSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().min(1),
});

// PR-1 acceptance criterion: this is the only place a producer RoleAssignment
// is granted, and the only place a decision AuditLogEntry is written.
adminRouter.post('/producer-applications/:id/decision', async (req, res) => {
  const parsed = decisionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { decision, reason } = parsed.data;
  const { id } = req.params;

  const application = await prisma.producerApplication.findUnique({ where: { id } });
  if (!application) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }
  if (application.status !== 'pending') {
    res.status(409).json({ error: `Application already ${application.status}` });
    return;
  }

  const updated = await prisma.producerApplication.update({
    where: { id },
    data: { status: decision, decidedAt: new Date(), decidedBy: req.account!.email, decisionReason: reason },
  });

  if (decision === 'approved') {
    const producerRole = await prisma.role.findUniqueOrThrow({ where: { key: 'producer' } });
    await prisma.roleAssignment.upsert({
      where: { accountId_roleId: { accountId: application.accountId, roleId: producerRole.id } },
      update: {},
      create: { accountId: application.accountId, roleId: producerRole.id, grantedBy: req.account!.email },
    });
  }

  await prisma.auditLogEntry.create({
    data: {
      actorLabel: req.account!.email,
      action: decision === 'approved' ? 'producer_application_approved' : 'producer_application_rejected',
      targetType: 'ProducerApplication',
      targetId: application.id,
      reason,
    },
  });

  res.json({ application: updated });
});

adminRouter.get('/audit-log', async (_req, res) => {
  const entries = await prisma.auditLogEntry.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  res.json({ entries });
});

// --- Producer suspend/reinstate (PR-1's "approve/reject/suspend" triad) ---

// Approved producers, each with their current RoleAssignment suspension
// state — the admin console's "Active producers" list.
adminRouter.get('/producers', async (_req, res) => {
  const applications = await prisma.producerApplication.findMany({
    where: { status: 'approved' },
    orderBy: { decidedAt: 'desc' },
  });
  const producerRole = await prisma.role.findUniqueOrThrow({ where: { key: 'producer' } });
  const assignments = await prisma.roleAssignment.findMany({
    where: { roleId: producerRole.id, accountId: { in: applications.map((a) => a.accountId) } },
  });
  const suspendedByAccountId = new Map(assignments.map((a) => [a.accountId, !!a.suspendedAt]));
  const producers = applications.map((app) => ({
    application: app,
    suspended: suspendedByAccountId.get(app.accountId) ?? false,
  }));
  res.json({ producers });
});

const suspendSchema = z.object({ reason: z.string().min(1) });

adminRouter.post('/accounts/:accountId/suspend', async (req, res) => {
  const parsed = suspendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { accountId } = req.params;
  const producerRole = await prisma.role.findUniqueOrThrow({ where: { key: 'producer' } });
  const assignment = await prisma.roleAssignment.findUnique({
    where: { accountId_roleId: { accountId, roleId: producerRole.id } },
  });
  if (!assignment || assignment.suspendedAt) {
    res.status(404).json({ error: 'No active producer role assignment for this account' });
    return;
  }

  await prisma.roleAssignment.update({
    where: { id: assignment.id },
    data: { suspendedAt: new Date(), suspendedBy: req.account!.email },
  });
  await prisma.auditLogEntry.create({
    data: {
      actorLabel: req.account!.email,
      action: 'producer_suspended',
      targetType: 'Account',
      targetId: accountId,
      reason: parsed.data.reason,
    },
  });
  res.json({ ok: true });
});

adminRouter.post('/accounts/:accountId/reinstate', async (req, res) => {
  const parsed = suspendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { accountId } = req.params;
  const producerRole = await prisma.role.findUniqueOrThrow({ where: { key: 'producer' } });
  const assignment = await prisma.roleAssignment.findUnique({
    where: { accountId_roleId: { accountId, roleId: producerRole.id } },
  });
  if (!assignment || !assignment.suspendedAt) {
    res.status(404).json({ error: 'No suspended producer role assignment for this account' });
    return;
  }

  await prisma.roleAssignment.update({
    where: { id: assignment.id },
    data: { suspendedAt: null, suspendedBy: null },
  });
  await prisma.auditLogEntry.create({
    data: {
      actorLabel: req.account!.email,
      action: 'producer_reinstated',
      targetType: 'Account',
      targetId: accountId,
      reason: parsed.data.reason,
    },
  });
  res.json({ ok: true });
});
