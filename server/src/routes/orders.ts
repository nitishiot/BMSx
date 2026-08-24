import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { optionalAuth } from '../auth';
import { reserveHold, releaseHold, InsufficientInventoryError } from '../inventory/holds';
import { authorize } from '../payments/stubAdapter';
import { computeFeeMinorUnits } from '../orders/pricing';

export const ordersRouter = Router();

// J1: cart creation is guest-usable — an authenticated fan's cart is tied
// to their account, an anonymous one is a bare Cart row a client tracks by
// id (no separate guest-token model needed for a cart that lives only
// until checkout or abandonment).
ordersRouter.post('/carts', optionalAuth, async (req, res) => {
  const cart = await prisma.cart.create({ data: { accountId: req.account?.id ?? null } });
  res.status(201).json({ cart });
});

async function priceCart(cartId: string) {
  const items = await prisma.cartItem.findMany({ where: { cartId } });
  const subtotalMinorUnits = items.reduce((sum, item) => sum + item.unitPriceMinorUnits * item.quantity, 0);
  const feeMinorUnits = computeFeeMinorUnits(subtotalMinorUnits);
  return { items, subtotalMinorUnits, feeMinorUnits, totalMinorUnits: subtotalMinorUnits + feeMinorUnits };
}

// Itemised cart view — exit check 3's "cart shows an itemised fee
// breakdown."
ordersRouter.get('/carts/:cartId', async (req, res) => {
  const cart = await prisma.cart.findUnique({ where: { id: String(req.params.cartId) } });
  if (!cart) {
    res.status(404).json({ error: 'Cart not found' });
    return;
  }
  const pricing = await priceCart(cart.id);
  res.json({ cart: { ...cart, ...pricing } });
});

const addItemSchema = z.object({
  ticketTypeId: z.string().min(1),
  quantity: z.number().int().positive(),
});

ordersRouter.post('/carts/:cartId/items', async (req, res) => {
  const cart = await prisma.cart.findUnique({ where: { id: String(req.params.cartId) } });
  if (!cart) {
    res.status(404).json({ error: 'Cart not found' });
    return;
  }
  if (cart.status !== 'open') {
    res.status(409).json({ error: 'Cart is no longer open' });
    return;
  }
  const parsed = addItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const ticketType = await prisma.ticketType.findUnique({ where: { id: parsed.data.ticketTypeId } });
  if (!ticketType) {
    res.status(400).json({ error: 'Unknown ticketTypeId' });
    return;
  }

  try {
    const cartItem = await prisma.$transaction(async (tx) => {
      const hold = await reserveHold(tx, {
        ticketTypeId: ticketType.id,
        cartId: cart.id,
        quantity: parsed.data.quantity,
      });
      return tx.cartItem.create({
        data: {
          cartId: cart.id,
          ticketTypeId: ticketType.id,
          holdId: hold.id,
          quantity: parsed.data.quantity,
          unitPriceMinorUnits: ticketType.priceMinorUnits,
        },
      });
    });
    const pricing = await priceCart(cart.id);
    res.status(201).json({ cartItem, cart: { ...cart, ...pricing } });
  } catch (err) {
    if (err instanceof InsufficientInventoryError) {
      res.status(409).json({ error: 'Insufficient inventory' });
      return;
    }
    throw err;
  }
});

ordersRouter.delete('/carts/:cartId/items/:itemId', async (req, res) => {
  const item = await prisma.cartItem.findUnique({ where: { id: String(req.params.itemId) } });
  if (!item || item.cartId !== String(req.params.cartId)) {
    res.status(404).json({ error: 'Cart item not found' });
    return;
  }
  await prisma.$transaction(async (tx) => {
    await releaseHold(tx, item.holdId);
    await tx.cartItem.delete({ where: { id: item.id } });
  });
  res.status(204).send();
});

const checkoutSchema = z.object({
  guestEmail: z.string().email().optional(),
  guestName: z.string().min(1).optional(),
});

// ADR-006 saga, stub payment leg (ADR-004 port/adapter — real PSP is
// [TBD: PHASE_1_SPEC.md §8]). On decline the cart's holds are left active
// (they'll lapse via reclaimExpired like any abandoned cart) rather than
// released immediately, so a fan can retry checkout on the same cart
// without losing their reservation mid-attempt.
ordersRouter.post('/carts/:cartId/checkout', optionalAuth, async (req, res) => {
  const cart = await prisma.cart.findUnique({ where: { id: String(req.params.cartId) } });
  if (!cart) {
    res.status(404).json({ error: 'Cart not found' });
    return;
  }
  if (cart.status !== 'open') {
    res.status(409).json({ error: 'Cart is no longer open' });
    return;
  }
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  if (!req.account && !parsed.data.guestEmail) {
    res.status(400).json({ error: 'guestEmail is required for a guest checkout' });
    return;
  }

  const pricing = await priceCart(cart.id);
  if (pricing.items.length === 0) {
    res.status(400).json({ error: 'Cart is empty' });
    return;
  }

  const currency = (await prisma.ticketType.findUnique({ where: { id: pricing.items[0].ticketTypeId } }))!.currency;
  const payment = await authorize({ amountMinorUnits: pricing.totalMinorUnits, currency });

  if (!payment.success) {
    res.status(402).json({ error: 'Payment declined', declineReason: payment.declineReason });
    return;
  }

  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        cartId: cart.id,
        accountId: req.account?.id ?? null,
        guestEmail: req.account ? null : parsed.data.guestEmail,
        guestName: req.account ? null : parsed.data.guestName,
        subtotalMinorUnits: pricing.subtotalMinorUnits,
        feeMinorUnits: pricing.feeMinorUnits,
        totalMinorUnits: pricing.totalMinorUnits,
        currency,
        status: 'paid',
        paymentIntentId: payment.paymentIntentId,
      },
    });

    for (const item of pricing.items) {
      const orderLine = await tx.orderLine.create({
        data: {
          orderId: createdOrder.id,
          ticketTypeId: item.ticketTypeId,
          quantity: item.quantity,
          unitPriceMinorUnits: item.unitPriceMinorUnits,
        },
      });
      await tx.hold.update({ where: { id: item.holdId }, data: { status: 'converted' } });
      for (let i = 0; i < item.quantity; i++) {
        await tx.ticket.create({
          data: {
            ticketTypeId: item.ticketTypeId,
            holdId: item.holdId,
            orderId: createdOrder.id,
            orderLineId: orderLine.id,
            holderName: req.account?.name ?? parsed.data.guestName ?? null,
          },
        });
      }
    }

    await tx.cart.update({ where: { id: cart.id }, data: { status: 'checked_out' } });
    return tx.order.findUnique({
      where: { id: createdOrder.id },
      include: { lines: true },
    });
  });

  const tickets = await prisma.ticket.findMany({ where: { orderId: order!.id } });
  res.status(201).json({ order, tickets });
});
