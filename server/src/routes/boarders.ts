import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const router = Router();

const boarderInput = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(1),
  roomId: z.string().optional().nullable(),
  checkInDate: z.coerce.date().optional(),
});

router.get("/", async (req, res) => {
  const status = req.query.status as string | undefined;
  const boarders = await prisma.boarder.findMany({
    where: status ? { status: status as "ACTIVE" | "CHECKED_OUT" } : undefined,
    include: { room: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(boarders);
});

router.get("/:id", async (req, res) => {
  const boarder = await prisma.boarder.findUnique({
    where: { id: req.params.id },
    include: { room: true, payments: { orderBy: { dueDate: "desc" } } },
  });
  if (!boarder) return res.status(404).json({ error: "Boarder not found" });
  res.json(boarder);
});

router.post("/", async (req, res) => {
  const parsed = boarderInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const boarder = await prisma.boarder.create({ data: parsed.data });
  res.status(201).json(boarder);
});

router.patch("/:id", async (req, res) => {
  const parsed = boarderInput.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const boarder = await prisma.boarder.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(boarder);
});

router.post("/:id/checkout", async (req, res) => {
  const boarder = await prisma.boarder.update({
    where: { id: req.params.id },
    data: { status: "CHECKED_OUT", checkOutDate: new Date(), roomId: null },
  });
  res.json(boarder);
});

router.delete("/:id", async (req, res) => {
  await prisma.boarder.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
