import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/summary", async (_req, res) => {
  const [totalRooms, occupiedRooms, activeBoarders, pendingPayments, overduePayments] =
    await Promise.all([
      prisma.room.count(),
      prisma.room.count({ where: { status: "FULL" } }),
      prisma.boarder.count({ where: { status: "ACTIVE" } }),
      prisma.payment.count({ where: { status: "PENDING" } }),
      prisma.payment.count({ where: { status: "OVERDUE" } }),
    ]);

  const outstandingAmount = await prisma.payment.aggregate({
    where: { status: { in: ["PENDING", "OVERDUE"] } },
    _sum: { amount: true },
  });

  res.json({
    totalRooms,
    occupiedRooms,
    activeBoarders,
    pendingPayments,
    overduePayments,
    outstandingAmount: outstandingAmount._sum.amount ?? 0,
  });
});

export default router;
