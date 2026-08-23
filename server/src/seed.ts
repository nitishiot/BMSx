import 'dotenv/config';
import { prisma } from './db';

async function main() {
  const roleKeys = ['fan', 'producer', 'platform_admin', 'vendor', 'affiliate'];
  for (const key of roleKeys) {
    await prisma.role.upsert({ where: { key }, update: {}, create: { key } });
  }

  const adminEmail = process.env.PLATFORM_ADMIN_SEED_EMAIL ?? 'admin@tag.local';
  const admin = await prisma.account.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, name: 'Platform Admin (seed)' },
  });
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { key: 'platform_admin' } });
  await prisma.roleAssignment.upsert({
    where: { accountId_roleId: { accountId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { accountId: admin.id, roleId: adminRole.id, grantedBy: 'seed' },
  });

  console.log(`Seeded roles and platform_admin account: ${adminEmail}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
