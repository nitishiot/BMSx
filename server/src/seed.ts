import 'dotenv/config';
import { prisma } from './db';
import { ORG_ROLES, CAPABILITIES, ORG_ROLE_CAPABILITIES } from './internalOps/seedData';

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

  // --- Internal Ops Console (build/MVP2_InternalOps/PHASE_2_SPEC.md) ---
  // Listed parent-before-child in seedData.ts so a single pass resolves
  // reportsToKey to an already-created row's id.
  const orgRoleIdByKey = new Map<string, string>();
  for (const role of ORG_ROLES) {
    const reportsToOrgRoleId = role.reportsToKey ? (orgRoleIdByKey.get(role.reportsToKey) ?? null) : null;
    const created = await prisma.orgRole.upsert({
      where: { key: role.key },
      update: { title: role.title, department: role.department, personName: role.personName, reportsToOrgRoleId },
      create: { key: role.key, title: role.title, department: role.department, personName: role.personName, reportsToOrgRoleId },
    });
    orgRoleIdByKey.set(role.key, created.id);
  }

  const capabilityIdByKey = new Map<string, string>();
  for (const cap of CAPABILITIES) {
    const created = await prisma.capability.upsert({
      where: { key: cap.key },
      update: { description: cap.description },
      create: { key: cap.key, description: cap.description },
    });
    capabilityIdByKey.set(cap.key, created.id);
  }

  for (const [roleKey, capKeys] of Object.entries(ORG_ROLE_CAPABILITIES)) {
    const orgRoleId = orgRoleIdByKey.get(roleKey)!;
    for (const capKey of capKeys) {
      const capabilityId = capabilityIdByKey.get(capKey)!;
      await prisma.orgRoleCapability.upsert({
        where: { orgRoleId_capabilityId: { orgRoleId, capabilityId } },
        update: {},
        create: { orgRoleId, capabilityId },
      });
    }
  }

  // Seed one staff login per priority role — same "any account holding
  // the right profile can mint itself a session" stand-in as adminAuth.ts
  // (PHASE_2_SPEC.md §4). Emails/names are env-overridable so this isn't
  // hardcoded to one demo identity.
  const staffSeeds: { orgRoleKey: string; email: string; displayName: string }[] = [
    {
      orgRoleKey: 'head_of_product_dev',
      email: process.env.INTERNAL_OPS_HEAD_OF_PRODUCT_EMAIL ?? 'nitish@tag.local',
      displayName: 'Nitish Gupta',
    },
    {
      orgRoleKey: 'cto',
      email: process.env.INTERNAL_OPS_CTO_EMAIL ?? 'cto@tag.local',
      displayName: 'Satish Billakota',
    },
    {
      orgRoleKey: 'founder_md',
      email: process.env.INTERNAL_OPS_FOUNDER_EMAIL ?? 'founder@tag.local',
      displayName: 'Ila Nicholson',
    },
  ];
  for (const staff of staffSeeds) {
    const account = await prisma.account.upsert({
      where: { email: staff.email },
      update: {},
      create: { email: staff.email, name: staff.displayName },
    });
    await prisma.staffProfile.upsert({
      where: { accountId: account.id },
      update: { orgRoleId: orgRoleIdByKey.get(staff.orgRoleKey)!, displayName: staff.displayName },
      create: { accountId: account.id, orgRoleId: orgRoleIdByKey.get(staff.orgRoleKey)!, displayName: staff.displayName },
    });
  }

  console.log(`Seeded Internal Ops: ${ORG_ROLES.length} org roles, ${CAPABILITIES.length} capabilities, ${staffSeeds.length} staff logins.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
