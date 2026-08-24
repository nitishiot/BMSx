import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { prisma } from './db';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export async function invalidateSession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}

export async function createSession(accountId: string): Promise<string> {
  const token = randomUUID();
  await prisma.session.create({
    data: {
      accountId,
      token,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return token;
}

export interface AuthedAccount {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      account?: AuthedAccount;
      // Set alongside req.account by requireAuth — lets a logout endpoint
      // invalidate the exact session row without re-parsing the header.
      sessionToken?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) {
    res.status(401).json({ error: 'Missing bearer token' });
    return;
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { account: { include: { roleAssignments: { include: { role: true } } } } },
  });

  if (!session || session.expiresAt < new Date()) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }

  // A suspended RoleAssignment is kept for history but excluded here — a
  // suspended producer's session immediately loses producer-scoped access,
  // no re-login required.
  req.account = {
    id: session.account.id,
    email: session.account.email,
    name: session.account.name,
    roles: session.account.roleAssignments.filter((a) => !a.suspendedAt).map((a) => a.role.key),
  };
  req.sessionToken = token;
  next();
}

// Orders & Cart is guest-usable (J1) — attaches req.account when a valid
// bearer token is present, but never rejects an anonymous request. Distinct
// from requireAuth, which always demands a token.
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) {
    next();
    return;
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { account: { include: { roleAssignments: { include: { role: true } } } } },
  });

  if (session && session.expiresAt >= new Date()) {
    req.account = {
      id: session.account.id,
      email: session.account.email,
      name: session.account.name,
      roles: session.account.roleAssignments.filter((a) => !a.suspendedAt).map((a) => a.role.key),
    };
  }
  next();
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.account?.roles.includes(role)) {
      res.status(403).json({ error: `Requires role: ${role}` });
      return;
    }
    next();
  };
}
