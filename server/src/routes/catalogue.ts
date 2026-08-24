import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth, requireRole } from '../auth';

export const catalogueRouter = Router();

// --- Venues (shared catalogue data, producer-entered per spec §2) ---

const venueSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  capacity: z.number().int().positive(),
});

catalogueRouter.post('/venues', requireAuth, requireRole('producer'), async (req, res) => {
  const parsed = venueSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const venue = await prisma.venue.create({ data: parsed.data });
  res.status(201).json({ venue });
});

catalogueRouter.get('/venues', async (_req, res) => {
  const venues = await prisma.venue.findMany({ orderBy: { name: 'asc' } });
  res.json({ venues });
});

catalogueRouter.get('/venues/:venueId', async (req, res) => {
  const venue = await prisma.venue.findUnique({
    where: { id: String(req.params.venueId) },
    include: { seatMap: true },
  });
  if (!venue) {
    res.status(404).json({ error: 'Venue not found' });
    return;
  }
  res.json({ venue });
});

const seatMapSchema = z.object({ imageUrl: z.string().min(1) });

// Upsert — one seat map per venue. Stores a URL only; object storage
// product is [TBD: PHASE_1_SPEC.md §8].
catalogueRouter.post('/venues/:venueId/seat-map', requireAuth, requireRole('producer'), async (req, res) => {
  const parsed = seatMapSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const venue = await prisma.venue.findUnique({ where: { id: String(req.params.venueId) } });
  if (!venue) {
    res.status(404).json({ error: 'Venue not found' });
    return;
  }
  const seatMap = await prisma.seatMap.upsert({
    where: { venueId: venue.id },
    update: { imageUrl: parsed.data.imageUrl },
    create: { venueId: venue.id, imageUrl: parsed.data.imageUrl },
  });
  res.status(201).json({ seatMap });
});

// --- Artists ---

const artistSchema = z.object({ name: z.string().min(1), genre: z.string().optional() });

catalogueRouter.post('/artists', requireAuth, requireRole('producer'), async (req, res) => {
  const parsed = artistSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const artist = await prisma.artist.create({ data: parsed.data });
  res.status(201).json({ artist });
});

catalogueRouter.get('/artists', async (_req, res) => {
  const artists = await prisma.artist.findMany({ orderBy: { name: 'asc' } });
  res.json({ artists });
});

// --- Events (dated sessions within a producer's own Festival) ---

const eventSchema = z.object({
  venueId: z.string().min(1),
  name: z.string().min(1),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  description: z.string().optional(),
});

// Ownership check: an Event can only be created under a Festival the
// calling producer's own account owns — same PR-1 pattern as festivals.ts.
async function loadOwnedFestival(festivalId: string, accountId: string) {
  const festival = await prisma.festival.findUnique({ where: { id: festivalId } });
  if (!festival || festival.producerAccountId !== accountId) return null;
  return festival;
}

catalogueRouter.post('/festivals/:festivalId/events', requireAuth, requireRole('producer'), async (req, res) => {
  const festival = await loadOwnedFestival(String(req.params.festivalId), req.account!.id);
  if (!festival) {
    res.status(404).json({ error: 'Festival not found' });
    return;
  }
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const venue = await prisma.venue.findUnique({ where: { id: parsed.data.venueId } });
  if (!venue) {
    res.status(400).json({ error: 'Unknown venueId' });
    return;
  }
  const event = await prisma.event.create({
    data: {
      festivalId: festival.id,
      venueId: venue.id,
      name: parsed.data.name,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: new Date(parsed.data.endsAt),
      description: parsed.data.description,
    },
  });
  res.status(201).json({ event });
});

// Producer-scoped list (mirrors festivals.ts's /mine ownership pattern).
catalogueRouter.get('/festivals/:festivalId/events/mine', requireAuth, requireRole('producer'), async (req, res) => {
  const festival = await loadOwnedFestival(String(req.params.festivalId), req.account!.id);
  if (!festival) {
    res.status(404).json({ error: 'Festival not found' });
    return;
  }
  const events = await prisma.event.findMany({
    where: { festivalId: festival.id },
    include: { venue: true, zones: true, lineup: { include: { artist: true } } },
    orderBy: { startsAt: 'asc' },
  });
  res.json({ events });
});

// Public read path (spec §2: "Event & Catalogue ... read path only") —
// unauthenticated, used by fan-facing surfaces (landing/festival page).
catalogueRouter.get('/festivals/:festivalId/events', async (req, res) => {
  const events = await prisma.event.findMany({
    where: { festivalId: String(req.params.festivalId) },
    include: { venue: true, zones: true, lineup: { include: { artist: true } } },
    orderBy: { startsAt: 'asc' },
  });
  res.json({ events });
});

catalogueRouter.get('/events/:eventId', async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: String(req.params.eventId) },
    include: { venue: true, festival: true, zones: true, lineup: { include: { artist: true } } },
  });
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  res.json({ event });
});

async function loadOwnedEvent(eventId: string, accountId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { festival: true } });
  if (!event || event.festival.producerAccountId !== accountId) return null;
  return event;
}

// --- Zones (read model for Ticketing & Inventory to reference later) ---

const zoneSchema = z.object({
  name: z.string().min(1),
  capacity: z.number().int().positive(),
  priceTier: z.string().min(1),
});

catalogueRouter.post('/events/:eventId/zones', requireAuth, requireRole('producer'), async (req, res) => {
  const event = await loadOwnedEvent(String(req.params.eventId), req.account!.id);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  const parsed = zoneSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const zone = await prisma.zone.create({ data: { eventId: event.id, ...parsed.data } });
  res.status(201).json({ zone });
});

// --- Lineup (Event x Artist) ---

const lineupSchema = z.object({ artistId: z.string().min(1) });

catalogueRouter.post('/events/:eventId/artists', requireAuth, requireRole('producer'), async (req, res) => {
  const event = await loadOwnedEvent(String(req.params.eventId), req.account!.id);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  const parsed = lineupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const artist = await prisma.artist.findUnique({ where: { id: parsed.data.artistId } });
  if (!artist) {
    res.status(400).json({ error: 'Unknown artistId' });
    return;
  }
  const lineup = await prisma.eventArtist.upsert({
    where: { eventId_artistId: { eventId: event.id, artistId: artist.id } },
    update: {},
    create: { eventId: event.id, artistId: artist.id },
    include: { artist: true },
  });
  res.status(201).json({ lineup });
});
