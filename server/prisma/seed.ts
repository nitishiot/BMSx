import { prisma } from "../src/lib/prisma";

async function main() {
  const roomA = await prisma.room.upsert({
    where: { number: "101" },
    update: {},
    create: { number: "101", floor: 1, capacity: 2, monthlyRent: 6500 },
  });
  const roomB = await prisma.room.upsert({
    where: { number: "102" },
    update: {},
    create: { number: "102", floor: 1, capacity: 1, monthlyRent: 9000 },
  });

  const boarder = await prisma.boarder.create({
    data: {
      name: "Aditi Sharma",
      email: "aditi.sharma@example.com",
      phone: "+91-9876543210",
      roomId: roomA.id,
    },
  });

  await prisma.room.update({ where: { id: roomA.id }, data: { status: "AVAILABLE" } });
  await prisma.room.update({ where: { id: roomB.id }, data: { status: "AVAILABLE" } });

  await prisma.payment.create({
    data: {
      boarderId: boarder.id,
      amount: 6500,
      dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    },
  });

  console.log("Seed complete");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
