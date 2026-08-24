import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth } from '../auth';
import { createAndSendVerificationEmail, verifyEmailToken } from '../identity/emailVerification';

export const accountRouter = Router();

// LP-14 End User page: the caller's own account state plus their latest
// survey response, if any — scoped to req.account.id, same pattern as
// every other "/me" route in this codebase (never a request parameter).
accountRouter.get('/me', requireAuth, async (req, res) => {
  const account = await prisma.account.findUniqueOrThrow({ where: { id: req.account!.id } });
  const surveyResponse = await prisma.surveyResponse.findFirst({
    where: { accountId: account.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({
    account: { id: account.id, email: account.email, name: account.name, emailVerifiedAt: account.emailVerifiedAt },
    surveyResponse,
  });
});

const verifySchema = z.object({ token: z.string().min(1) });

// No auth required — the token itself is the credential (a fan may click
// the verification link in a different browser/session than the one that
// submitted the survey).
accountRouter.post('/verify-email', async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const result = await verifyEmailToken(parsed.data.token);
  if (!result) {
    res.status(400).json({ error: 'Invalid or expired verification token' });
    return;
  }
  res.json({ verified: true });
});

// Dev/demo convenience only (PHASE_1_CT_SPEC.md LP-14 explicitly flags this
// as not a real flow) — lets a signed-in but unverified account request a
// fresh token without re-submitting the survey, since there's no real
// inbox to resend to.
accountRouter.post('/resend-verification', requireAuth, async (req, res) => {
  const account = await prisma.account.findUniqueOrThrow({ where: { id: req.account!.id } });
  if (account.emailVerifiedAt) {
    res.status(409).json({ error: 'Already verified' });
    return;
  }
  const verificationTokenForDemo = await createAndSendVerificationEmail(account.id, account.email);
  res.json({ verificationTokenForDemo });
});

// ---------------------------------------------------------------------
// PHASE_1_CT_INCREMENT_SPEC.md §2.2/§2.3 — the caller's own tickets.
// Scoped to the session's account id, never a request parameter (same
// rule as /festivals/mine). Checkout is guest-capable, so an order may
// carry only a guestEmail; those are matched too, but ONLY for an
// account whose email is verified — otherwise registering with an email
// someone else used at guest checkout would hand over their tickets.
// Cross-schema assembly in application code, no FK across boundaries
// (ADR-005).
// ---------------------------------------------------------------------
accountRouter.get('/tickets', requireAuth, async (req, res) => {
  const account = await prisma.account.findUniqueOrThrow({ where: { id: req.account!.id } });

  const orders = await prisma.order.findMany({
    where: {
      status: 'paid',
      OR: account.emailVerifiedAt
        ? [{ accountId: account.id }, { guestEmail: account.email }]
        : [{ accountId: account.id }],
    },
    orderBy: { createdAt: 'desc' },
    include: { lines: true },
  });

  const tickets = orders.length
    ? await prisma.ticket.findMany({ where: { orderId: { in: orders.map((o) => o.id) } }, orderBy: { issuedAt: 'asc' } })
    : [];

  const ticketTypes = tickets.length
    ? await prisma.ticketType.findMany({ where: { id: { in: [...new Set(tickets.map((t) => t.ticketTypeId))] } } })
    : [];
  const zones = ticketTypes.length
    ? await prisma.zone.findMany({
        where: { id: { in: [...new Set(ticketTypes.map((t) => t.zoneId))] } },
        include: { event: { include: { venue: true, festival: true } } },
      })
    : [];

  const zoneById = new Map(zones.map((z) => [z.id, z]));
  const ticketTypeById = new Map(ticketTypes.map((t) => [t.id, t]));

  res.json({
    orders: orders.map((order) => ({
      id: order.id,
      createdAt: order.createdAt,
      totalMinorUnits: order.totalMinorUnits,
      currency: order.currency,
      tickets: tickets
        .filter((t) => t.orderId === order.id)
        .map((t) => {
          const ticketType = ticketTypeById.get(t.ticketTypeId);
          const zone = ticketType ? zoneById.get(ticketType.zoneId) : undefined;
          return {
            id: t.id,
            qrCode: t.qrCode,
            issuedAt: t.issuedAt,
            ticketTypeName: ticketType?.name ?? 'Ticket',
            zoneName: zone?.name ?? null,
            eventName: zone?.event.name ?? null,
            startsAt: zone?.event.startsAt ?? null,
            festivalId: zone?.event.festival.id ?? null,
            festivalName: zone?.event.festival.name ?? null,
            venue: zone ? { name: zone.event.venue.name, city: zone.event.venue.city, country: zone.event.venue.country } : null,
          };
        }),
    })),
  });
});
