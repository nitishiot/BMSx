// ADR-004 port/adapter, same honesty pattern as payments/stubAdapter.ts:
// no real transactional email provider is chosen yet (PHASE_1_SPEC.md §8
// territory). This stub creates a real, single-use verification token and
// logs the link that would have been emailed — swap this module for a
// real provider adapter once one is selected; nothing outside this file
// should assume a stub is in use.
import { prisma } from '../db';

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export async function createAndSendVerificationEmail(accountId: string, email: string): Promise<string> {
  const { token } = await prisma.emailVerificationToken.create({
    data: { accountId, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
  });
  // Stand-in for a real email send — logs where a real provider would
  // deliver the link, so the flow is exercisable without email infra.
  console.log(`[stub email] verification link for ${email}: /verify-email?token=${token}`);
  return token;
}

export async function verifyEmailToken(token: string): Promise<{ accountId: string } | null> {
  const record = await prisma.emailVerificationToken.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return null;

  await prisma.$transaction([
    prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.account.update({ where: { id: record.accountId }, data: { emailVerifiedAt: new Date() } }),
  ]);
  return { accountId: record.accountId };
}
