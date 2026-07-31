import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const router = Router();

const roomInput = z.object({
  number: z.string().min(1),
  floor: z.number().int(),
  capacity: z.number().int().positive(),
  monthlyRent: z.number().positive(),
  status: z.enum(["AVAILABLE", "FULL", "MAINTENANCE"]).optional(),
});

router.get("/", async (_req, res) => {
  const rooms = await prisma.room.findMany({
    include: { boarders: { where: { status: "ACTIVE" } } },
    orderBy: { number: "asc" },
  });
  res.json(rooms);
});

router.get("/:id", async (req, res) => {
  const room = await prisma.room.findUnique({
    where: { id: req.params.id },
    include: { boarders: true },
  });
  if (!room) return res.status(404).json({ error: "Room not found" });
  res.json(room);
});

router.post("/", async (req, res) => {
  const parsed = roomInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const room = await prisma.room.create({ data: parsed.data });
  res.status(201).json(room);
});

router.patch("/:id", async (req, res) => {
  const parsed = roomInput.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const room = await prisma.room.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(room);
});

router.delete("/:id", async (req, res) => {
  await prisma.room.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
