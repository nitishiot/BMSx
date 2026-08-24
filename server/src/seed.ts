import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from './db';
import { ORG_ROLES, CAPABILITIES, ORG_ROLE_CAPABILITIES } from './internalOps/seedData';

async function main() {
  const roleKeys = ['fan', 'producer', 'platform_admin', 'vendor', 'affiliate'];
  for (const key of roleKeys) {
    await prisma.role.upsert({ where: { key }, update: {}, create: { key } });
  }

  // Every seeded login-capable account gets a real password in the one
  // unified identity.Credential store (PHASE_1_IO_INCREMENT_SPEC.md §4,
  // revised) — no more email-only or no-password portals. Demo
  // placeholders, env-overridable, meant to be changed.
  const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD ?? 'changeme123';
  async function setPassword(accountId: string, plain: string) {
    const passwordHash = await bcrypt.hash(plain, 10);
    await prisma.credential.upsert({
      where: { accountId },
      update: { passwordHash },
      create: { accountId, passwordHash },
    });
  }

  const adminEmail = process.env.PLATFORM_ADMIN_SEED_EMAIL ?? 'admin@tag.local';
  const admin = await prisma.account.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, name: 'Platform Admin (seed)' },
  });
  await setPassword(admin.id, process.env.PLATFORM_ADMIN_SEED_PASSWORD ?? DEFAULT_PASSWORD);
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { key: 'platform_admin' } });
  await prisma.roleAssignment.upsert({
    where: { accountId_roleId: { accountId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { accountId: admin.id, roleId: adminRole.id, grantedBy: 'seed' },
  });

  console.log(`Seeded roles and platform_admin account: ${adminEmail}`);

  // --- Internal Ops Console (build/MVP2_InternalOps/PHASE_1_IO_SPEC.md) ---
  // Listed parent-before-child in seedData.ts so a single pass resolves
  // reportsToKey to an already-created row's id.
  const orgRoleIdByKey = new Map<string, string>();
  for (const role of ORG_ROLES) {
    const reportsToOrgRoleId = role.reportsToKey ? (orgRoleIdByKey.get(role.reportsToKey) ?? null) : null;
    const created = await prisma.orgRole.upsert({
      where: { key: role.key },
      update: { title: role.title, department: role.department, personName: role.personName, reportsToOrgRoleId, isTopLevel: role.isTopLevel ?? false },
      create: { key: role.key, title: role.title, department: role.department, personName: role.personName, reportsToOrgRoleId, isTopLevel: role.isTopLevel ?? false },
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
  // (PHASE_1_IO_SPEC.md §4). Emails/names are env-overridable so this isn't
  // hardcoded to one demo identity.
  const staffSeeds: { orgRoleKey: string; email: string; displayName: string; password: string }[] = [
    {
      orgRoleKey: 'head_of_product_dev',
      email: process.env.INTERNAL_OPS_HEAD_OF_PRODUCT_EMAIL ?? 'nitish@tag.local',
      displayName: 'Nitish Gupta',
      password: process.env.INTERNAL_OPS_HEAD_OF_PRODUCT_PASSWORD ?? 'changeme123',
    },
    {
      orgRoleKey: 'cto',
      email: process.env.INTERNAL_OPS_CTO_EMAIL ?? 'cto@tag.local',
      displayName: 'Satish Billakota',
      password: process.env.INTERNAL_OPS_CTO_PASSWORD ?? 'changeme123',
    },
    {
      orgRoleKey: 'founder_md',
      email: process.env.INTERNAL_OPS_FOUNDER_EMAIL ?? 'founder@tag.local',
      displayName: 'Ila Nicholson',
      password: process.env.INTERNAL_OPS_FOUNDER_PASSWORD ?? 'changeme123',
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
    // Staff passwords now live in the same identity.Credential store as
    // every other persona (the short-lived internalops.StaffCredential was
    // dropped in migration 20260824070000_unified_credential).
    await setPassword(account.id, staff.password);
  }

  console.log(`Seeded Internal Ops: ${ORG_ROLES.length} org roles, ${CAPABILITIES.length} capabilities, ${staffSeeds.length} staff logins.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
