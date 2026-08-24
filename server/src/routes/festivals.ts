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

// Public read path (unauthenticated) — landing page LP-1 search / LP-3
// "Events Near You" wiring. City/country/genre come from the earliest
// linked Event's Venue and lineup, when one exists; Festival's own legacy
// `venue` free-text field is always included as a fallback for search.
festivalsRouter.get('/public', async (_req, res) => {
  const festivals = await prisma.festival.findMany({ orderBy: { startDate: 'asc' } });
  const enriched = await Promise.all(
    festivals.map(async (f) => {
      const event = await prisma.event.findFirst({
        where: { festivalId: f.id },
        orderBy: { startsAt: 'asc' },
        include: { venue: true, lineup: { include: { artist: true } } },
      });
      return {
        id: f.id,
        name: f.name,
        venue: f.venue,
        date: event?.startsAt ?? f.startDate,
        city: event?.venue.city ?? null,
        country: event?.venue.country ?? null,
        genre: event?.lineup[0]?.artist.genre ?? null,
      };
    }),
  );
  res.json({ festivals: enriched });
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

// Public single-festival read (J1: festival detail page). Registered last
// deliberately — Express matches routes in registration order, and this
// generic `:id` param would otherwise swallow `/public` and `/mine`.
festivalsRouter.get('/:id', async (req, res) => {
  const festival = await prisma.festival.findUnique({ where: { id: String(req.params.id) } });
  if (!festival) {
    res.status(404).json({ error: 'Festival not found' });
    return;
  }
  res.json({ festival });
});
