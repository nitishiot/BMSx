import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { createSession } from '../auth';
import { createAndSendVerificationEmail } from '../identity/emailVerification';

export const surveyRouter = Router();

const submitSchema = z.object({
  email: z.string().email(),
  answers: z.record(z.string(), z.string()).refine((a) => Object.keys(a).length > 0, {
    message: 'At least one answer is required',
  }),
});

// LP-14: guest submits the fan survey with an email, no other profile
// fields (per PHASE_1_SPEC.md's LP-14). `name` has no real value to draw
// on yet, so it's a placeholder derived from the email's local part —
// the End User page never shows it as if it were a real name.
function placeholderNameFromEmail(email: string): string {
  return email.split('@')[0];
}

surveyRouter.post('/responses', async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { email, answers } = parsed.data;

  const account = await prisma.account.upsert({
    where: { email },
    update: {},
    create: { email, name: placeholderNameFromEmail(email) },
  });

  await prisma.surveyResponse.create({ data: { accountId: account.id, answers } });

  const token = await createSession(account.id);

  // Dev/demo-only: the stub email adapter has nowhere real to deliver the
  // verification link, so it's surfaced directly here rather than only in
  // a server log — not part of the real flow, flagged as such on the End
  // User page too (PHASE_1_SPEC.md LP-14).
  const verificationTokenForDemo = account.emailVerifiedAt
    ? null
    : await createAndSendVerificationEmail(account.id, email);

  res.status(201).json({
    token,
    account: { id: account.id, email: account.email, emailVerifiedAt: account.emailVerifiedAt },
    verificationTokenForDemo,
  });
});
