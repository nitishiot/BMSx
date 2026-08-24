import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth, createSession, invalidateSession } from '../auth';
import { resolveNavLinks, type NavLink } from '../internalOps/auth';

export const authRouter = Router();

// PHASE_1_IO_INCREMENT_SPEC.md §4/§5 (revised 2026-08-24) — ONE login for
// every persona. Replaces three divergent mechanisms that existed side by
// side: Internal Ops's password login, Platform Admin's email-only
// stand-in, and the Producer portal's no-login-at-all. RBAC decides what
// you can see *after* authentication; authentication itself is now the
// same for everyone. The older per-portal login routes still exist and
// still work (nothing that depended on them broke), but the client uses
// only this one — see PROGRESS.md.

const BCRYPT_COST = 10;

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Registration creates a *fan* account (the only self-service persona —
// producers still apply and get approved, staff/admin are seeded). An
// Account may already exist without a Credential (created by a survey
// submission or guest checkout); in that case registration sets the
// password on the existing account rather than failing, so a fan who took
// the survey first can still claim their account.
authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { email, name, password } = parsed.data;

  const existing = await prisma.account.findUnique({
    where: { email },
    include: { credential: true },
  });
  if (existing?.credential) {
    res.status(409).json({ error: 'An account with that email already exists. Sign in instead.' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const account = existing
    ? await prisma.account.update({ where: { id: existing.id }, data: { name } })
    : await prisma.account.create({ data: { email, name } });

  await prisma.credential.create({ data: { accountId: account.id, passwordHash } });

  const fanRole = await prisma.role.findUnique({ where: { key: 'fan' } });
  if (fanRole) {
    await prisma.roleAssignment.upsert({
      where: { accountId_roleId: { accountId: account.id, roleId: fanRole.id } },
      update: {},
      create: { accountId: account.id, roleId: fanRole.id, grantedBy: 'self-registration' },
    });
  }

  const token = await createSession(account.id);
  res.status(201).json({ token });
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const account = await prisma.account.findUnique({
    where: { email: parsed.data.email },
    include: { credential: true },
  });

  // One generic error for every failure mode (unknown email, account with
  // no password set yet, wrong password) — a login attempt must not be
  // usable to discover which emails exist.
  if (!account?.credential || !(await bcrypt.compare(parsed.data.password, account.credential.passwordHash))) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = await createSession(account.id);
  res.json({ token });
});

authRouter.post('/logout', requireAuth, async (req, res) => {
  await invalidateSession(req.sessionToken!);
  res.status(204).send();
});

export interface SessionView {
  account: { id: string; email: string; name: string; emailVerifiedAt: Date | null };
  roles: string[];
  staff: { orgRoleKey: string; title: string; displayName: string; capabilities: string[] } | null;
  navLinks: NavLink[];
  portals: { key: string; label: string; href: string }[];
  homeHref: string;
}

// Portal entry points, filtered by what this session may actually reach.
// This is the single server-side source of truth the nav renders from on
// every surface — the client never decides for itself which portals a
// session is entitled to see (.claude/rules/design.md's navigation rule).
function resolvePortals(roles: string[], isStaff: boolean, hasSurvey: boolean) {
  const portals: { key: string; label: string; href: string }[] = [];
  portals.push({ key: 'account', label: 'My account', href: '/account' });
  // PHASE_1_CT_INCREMENT_SPEC.md §2.2 — every signed-in account can reach
  // its own tickets; the endpoint scopes them to the session, so there is
  // nothing role-specific to gate here.
  portals.push({ key: 'tickets', label: 'My tickets', href: '/tickets' });
  if (!hasSurvey) portals.push({ key: 'survey', label: 'Fan survey', href: '/survey' });
  portals.push({ key: 'producer', label: 'Producer portal', href: '/producer' });
  if (roles.includes('platform_admin')) {
    portals.push({ key: 'admin', label: 'Platform Admin console', href: '/admin' });
  }
  if (isStaff) portals.push({ key: 'ops', label: 'Internal Ops', href: '/ops' });
  return portals;
}

// Where sign-in lands a session when no explicit ?next= was given.
// Resolved here, from the same roles/capabilities the portals list uses,
// rather than guessed client-side — Internal Ops staff go straight to the
// Ops console, a Platform Admin to the admin console, everyone else to
// their account (Nitish's ask, 2026-08-24). Highest-privilege surface the
// session can actually reach wins; ?next= still overrides it.
function resolveHomeHref(roles: string[], isStaff: boolean) {
  if (isStaff) return '/ops';
  if (roles.includes('platform_admin')) return '/admin';
  return '/account';
}

// The one endpoint every surface's nav calls. Returns identity + product
// RBAC (roles) + staff RBAC (capabilities) + the resolved nav/portal lists
// in a single round trip, so no page has to assemble that itself.
authRouter.get('/me', requireAuth, async (req, res) => {
  const account = await prisma.account.findUniqueOrThrow({ where: { id: req.account!.id } });
  const profile = await prisma.staffProfile.findUnique({
    where: { accountId: account.id },
    include: { orgRole: { include: { capabilities: { include: { capability: true } } } } },
  });
  const surveyResponse = await prisma.surveyResponse.findFirst({ where: { accountId: account.id } });

  const capabilities = profile?.orgRole.capabilities.map((c) => c.capability.key) ?? [];
  const view: SessionView = {
    account: {
      id: account.id,
      email: account.email,
      name: account.name,
      emailVerifiedAt: account.emailVerifiedAt,
    },
    roles: req.account!.roles,
    staff: profile
      ? {
          orgRoleKey: profile.orgRole.key,
          title: profile.orgRole.title,
          displayName: profile.displayName,
          capabilities,
        }
      : null,
    navLinks: resolveNavLinks(capabilities),
    portals: resolvePortals(req.account!.roles, !!profile, !!surveyResponse),
    homeHref: resolveHomeHref(req.account!.roles, !!profile),
  };
  res.json(view);
});
