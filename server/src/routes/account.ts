import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth } from '../auth';
import { createAndSendVerificationEmail, verifyEmailToken } from '../identity/emailVerification';

export const accountRouter = Router();

// LP-14 End User page: the caller's own account state plus their latest
// survey response, if any — scoped to req.account.id, same pattern as
// every other "/me" route in this codebase (never a request parameter).
accountRouter.get('/me', requireAuth, async (req, res) => {
  const account = await prisma.account.findUniqueOrThrow({ where: { id: req.account!.id } });
  const surveyResponse = await prisma.surveyResponse.findFirst({
    where: { accountId: account.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({
    account: { id: account.id, email: account.email, name: account.name, emailVerifiedAt: account.emailVerifiedAt },
    surveyResponse,
  });
});

const verifySchema = z.object({ token: z.string().min(1) });

// No auth required — the token itself is the credential (a fan may click
// the verification link in a different browser/session than the one that
// submitted the survey).
accountRouter.post('/verify-email', async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const result = await verifyEmailToken(parsed.data.token);
  if (!result) {
    res.status(400).json({ error: 'Invalid or expired verification token' });
    return;
  }
  res.json({ verified: true });
});

// Dev/demo convenience only (PHASE_1_CT_SPEC.md LP-14 explicitly flags this
// as not a real flow) — lets a signed-in but unverified account request a
// fresh token without re-submitting the survey, since there's no real
// inbox to resend to.
accountRouter.post('/resend-verification', requireAuth, async (req, res) => {
  const account = await prisma.account.findUniqueOrThrow({ where: { id: req.account!.id } });
  if (account.emailVerifiedAt) {
    res.status(409).json({ error: 'Already verified' });
    return;
  }
  const verificationTokenForDemo = await createAndSendVerificationEmail(account.id, account.email);
  res.json({ verificationTokenForDemo });
});
