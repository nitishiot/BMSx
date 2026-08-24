import { AutoAppNav } from './AppNav';

// Kept as a thin alias so the Fan Web pages (Survey/Account/Festival)
// don't each need editing again — the actual nav is now the one shared
// AppNav every surface in client/ uses (.claude/rules/design.md). The
// old bespoke FanNav is gone: it showed a different nav from the other
// portals, and rendered nothing at all in its top-right slot when signed
// out, which is exactly the inconsistency Nitish flagged.
export function FanNav(_props: { currentKey?: string }) {
  return <AutoAppNav />;
}
