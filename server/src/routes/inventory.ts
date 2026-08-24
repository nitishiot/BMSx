import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth, requireRole } from '../auth';

export const inventoryRouter = Router();

// Ownership check crosses into the `catalogue` schema by application-code
// query, not a DB FK (ADR-005) — same pattern as catalogue.ts's
// loadOwnedEvent, one hop further: Zone -> Event -> Festival.
async function loadOwnedZone(zoneId: string, accountId: string) {
  const zone = await prisma.zone.findUnique({
    where: { id: zoneId },
    include: { event: { include: { festival: true } } },
  });
  if (!zone || zone.event.festival.producerAccountId !== accountId) return null;
  return zone;
}

const ticketTypeSchema = z.object({
  name: z.string().min(1),
  priceMinorUnits: z.number().int().nonnegative(),
  currency: z.string().min(1).default('EUR'),
  totalQuantity: z.number().int().positive(),
});

// Producer-authored: a TicketType (and its starting Allocation) can only be
// created against a Zone under the calling producer's own Festival.
inventoryRouter.post('/zones/:zoneId/ticket-types', requireAuth, requireRole('producer'), async (req, res) => {
  const zone = await loadOwnedZone(String(req.params.zoneId), req.account!.id);
  if (!zone) {
    res.status(404).json({ error: 'Zone not found' });
    return;
  }
  const parsed = ticketTypeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { totalQuantity, ...ticketTypeData } = parsed.data;
  const ticketType = await prisma.ticketType.create({
    data: {
      zoneId: zone.id,
      ...ticketTypeData,
      allocation: { create: { totalQuantity, remaining: totalQuantity } },
    },
    include: { allocation: true },
  });
  res.status(201).json({ ticketType });
});

// Public read path — fan-facing checkout needs this to show what's
// sellable and how much is left, unauthenticated per spec §2.
inventoryRouter.get('/zones/:zoneId/ticket-types', async (req, res) => {
  const ticketTypes = await prisma.ticketType.findMany({
    where: { zoneId: String(req.params.zoneId) },
    include: { allocation: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ ticketTypes });
});

inventoryRouter.get('/ticket-types/:id', async (req, res) => {
  const ticketType = await prisma.ticketType.findUnique({
    where: { id: String(req.params.id) },
    include: { allocation: true },
  });
  if (!ticketType) {
    res.status(404).json({ error: 'TicketType not found' });
    return;
  }
  res.json({ ticketType });
});
