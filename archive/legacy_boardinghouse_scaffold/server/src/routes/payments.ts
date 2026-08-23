import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const router = Router();

const paymentInput = z.object({
  boarderId: z.string().min(1),
  amount: z.number().positive(),
  dueDate: z.coerce.date(),
  method: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

router.get("/", async (req, res) => {
  const status = req.query.status as string | undefined;
  const payments = await prisma.payment.findMany({
    where: status ? { status: status as "PENDING" | "PAID" | "OVERDUE" } : undefined,
    include: { boarder: true },
    orderBy: { dueDate: "asc" },
  });
  res.json(payments);
});

router.post("/", async (req, res) => {
  const parsed = paymentInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const payment = await prisma.payment.create({ data: parsed.data });
  res.status(201).json(payment);
});

router.post("/:id/mark-paid", async (req, res) => {
  const payment = await prisma.payment.update({
    where: { id: req.params.id },
    data: { status: "PAID", paidDate: new Date() },
  });
  res.json(payment);
});

router.patch("/:id", async (req, res) => {
  const parsed = paymentInput.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const payment = await prisma.payment.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(payment);
});

router.delete("/:id", async (req, res) => {
  await prisma.payment.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
