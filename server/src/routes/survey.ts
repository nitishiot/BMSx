import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { createSession } from '../auth';
import { createAndSendVerificationEmail } from '../identity/emailVerification';

export const surveyRouter = Router();

const submitSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  answers: z.record(z.string(), z.string()).refine((a) => Object.keys(a).length > 0, {
    message: 'At least one answer is required',
  }),
});

surveyRouter.post('/responses', async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { email, name, answers } = parsed.data;

  // `identity.Account` is shared across the producer/admin/fan flows (one
  // account per email, PR-1's model) — updating `name` on an existing
  // account (e.g. a producer who also fills out the survey under the same
  // email) intentionally keeps the most recently given name, same as any
  // profile-edit would.
  const account = await prisma.account.upsert({
    where: { email },
    update: { name },
    create: { email, name },
  });

  await prisma.surveyResponse.create({ data: { accountId: account.id, answers } });

  const token = await createSession(account.id);

  // Dev/demo-only: the stub email adapter has nowhere real to deliver the
  // verification link, so it's surfaced directly here rather than only in
  // a server log — not part of the real flow, flagged as such on the End
  // User page too (PHASE_1_CT_SPEC.md LP-14).
  const verificationTokenForDemo = account.emailVerifiedAt
    ? null
    : await createAndSendVerificationEmail(account.id, email);

  res.status(201).json({
    token,
    account: { id: account.id, email: account.email, name: account.name, emailVerifiedAt: account.emailVerifiedAt },
    verificationTokenForDemo,
  });
});
