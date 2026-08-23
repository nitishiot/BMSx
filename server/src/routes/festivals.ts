import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth, requireRole } from '../auth';

export const festivalsRouter = Router();

const createSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  venue: z.string().min(1),
  description: z.string().optional(),
});

// J5 step 1 (free-tier event setup). requireRole('producer') is the PR-1
// enforcement point: only an approved producer's session can reach this.
festivalsRouter.post('/', requireAuth, requireRole('producer'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { name, startDate, endDate, venue, description } = parsed.data;

  const festival = await prisma.festival.create({
    data: {
      producerAccountId: req.account!.id,
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      venue,
      description,
    },
  });

  res.status(201).json({ festival });
});

// Exit check 7 (RBAC negative test): scoped to req.account.id, never a
// query param — a second producer's token cannot read the first
// producer's festivals.
festivalsRouter.get('/mine', requireAuth, requireRole('producer'), async (req, res) => {
  const festivals = await prisma.festival.findMany({
    where: { producerAccountId: req.account!.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ festivals });
});
