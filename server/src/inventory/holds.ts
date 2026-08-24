import type { Prisma } from '@prisma/client';
import { prisma } from '../db';

// Same 10-minute figure J2 uses for Virtual Queue drop-off (spec §2) —
// reused here as the cart hold's own TTL. Note: satisfying J2's exit check
// 4 itself still needs the Virtual Queue module (not built in this
// sub-slice); this only gives Ticketing & Inventory its own hold expiry.
export const HOLD_TTL_MS = 10 * 60 * 1000;

type Tx = Prisma.TransactionClient;

// Lazily reclaims any of this TicketType's holds that expired since the
// last touch — restores Allocation.remaining for each. Called before every
// attempt to reserve more, so `remaining` never stays wrong indefinitely
// even with no background job.
async function reclaimExpired(tx: Tx, ticketTypeId: string) {
  const expired = await tx.hold.findMany({
    where: { ticketTypeId, status: 'active', expiresAt: { lt: new Date() } },
  });
  for (const hold of expired) {
    await tx.hold.update({ where: { id: hold.id }, data: { status: 'expired' } });
    await tx.allocation.update({
      where: { ticketTypeId },
      data: { remaining: { increment: hold.quantity } },
    });
  }
}

export class InsufficientInventoryError extends Error {
  constructor() {
    super('Insufficient inventory');
  }
}

// ADR-007 no-oversell: the decrement is a single conditional UPDATE
// (`remaining >= quantity`) inside the transaction — Postgres row-level
// locking makes this safe under concurrent callers without needing
// SERIALIZABLE isolation; a read-then-write here would not be safe.
export async function reserveHold(
  tx: Tx,
  params: { ticketTypeId: string; cartId: string; quantity: number },
): Promise<{ id: string; expiresAt: Date }> {
  await reclaimExpired(tx, params.ticketTypeId);

  const updated = await tx.allocation.updateMany({
    where: { ticketTypeId: params.ticketTypeId, remaining: { gte: params.quantity } },
    data: { remaining: { decrement: params.quantity } },
  });
  if (updated.count === 0) {
    throw new InsufficientInventoryError();
  }

  const expiresAt = new Date(Date.now() + HOLD_TTL_MS);
  const hold = await tx.hold.create({
    data: {
      ticketTypeId: params.ticketTypeId,
      cartId: params.cartId,
      quantity: params.quantity,
      status: 'active',
      expiresAt,
    },
  });
  return { id: hold.id, expiresAt };
}

// Releases an active hold back to Allocation.remaining — used on cart-item
// removal and cart abandonment.
export async function releaseHold(tx: Tx, holdId: string): Promise<void> {
  const hold = await tx.hold.findUnique({ where: { id: holdId } });
  if (!hold || hold.status !== 'active') return;
  await tx.hold.update({ where: { id: holdId }, data: { status: 'released' } });
  await tx.allocation.update({
    where: { ticketTypeId: hold.ticketTypeId },
    data: { remaining: { increment: hold.quantity } },
  });
}
