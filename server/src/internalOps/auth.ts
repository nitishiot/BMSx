import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../db';

export interface StaffContext {
  orgRoleId: string;
  orgRoleKey: string;
  title: string;
  displayName: string;
  capabilities: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      staff?: StaffContext;
    }
  }
}

// Chains after requireAuth (req.account must already be set). Looks up
// the caller's StaffProfile — a plain-UUID reference into identity, no
// FK (ADR-005) — and attaches their resolved capability list. A caller
// with no StaffProfile is not staff at all, 403, not a 401 (they *are*
// authenticated, just not for this system) — PHASE_2_SPEC.md §5.
export async function loadStaffContext(req: Request, res: Response, next: NextFunction) {
  const profile = await prisma.staffProfile.findUnique({
    where: { accountId: req.account!.id },
    include: { orgRole: { include: { capabilities: { include: { capability: true } } } } },
  });
  if (!profile) {
    res.status(403).json({ error: 'No Internal Ops staff profile for this account' });
    return;
  }
  req.staff = {
    orgRoleId: profile.orgRole.id,
    orgRoleKey: profile.orgRole.key,
    title: profile.orgRole.title,
    displayName: profile.displayName,
    capabilities: profile.orgRole.capabilities.map((c) => c.capability.key),
  };
  next();
}

export function requireCapability(key: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.staff?.capabilities.includes(key)) {
      res.status(403).json({ error: `Requires capability: ${key}` });
      return;
    }
    next();
  };
}
