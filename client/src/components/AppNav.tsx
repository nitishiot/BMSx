import { useEffect, useRef, useState } from 'react';
import { getSession, logout, LANDING_BASE, type SessionView } from '../api';

// THE nav for every page in client/ (.claude/rules/design.md's navigation
// rule). Same three zones everywhere, in the same places, matching the
// landing page's own nav exactly:
//   left   — TAG logo, always links to the landing page at "/"
//   centre — the marketing menu (Browse Festivals / Features / Platform /
//            Pricing), present on every page, deep-linking to landing's
//            sections; same-origin now, so these are plain anchors
//   right  — signed out: "Sign in" + "Register" (two distinct links, not
//            one combined control — Nitish's explicit call)
//            signed in:  the user's name + an RBAC-filtered Portals menu
//                        + Sign out
//
// Portal entitlements are NOT decided here: `session.portals` is resolved
// server-side in server/src/routes/auth.ts from the caller's real roles
// and staff capabilities, so the client can't drift from what the API
// actually permits.
const CENTRE_LINKS = [
  { href: '/#search', label: 'Browse Festivals' },
  { href: '/#banners', label: 'Features' },
  { href: '/#platform', label: 'Platform' },
  { href: '/#plans', label: 'Pricing' },
];

function PortalsDropdown({ session }: { session: SessionView }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const here = window.location.pathname;
  const links = session.portals.filter((p) => !here.startsWith(p.href));
  if (links.length === 0) return null;

  return (
    <div className="fan-nav-dropdown" ref={ref}>
      <button
        type="button"
        className="fan-nav-dropdown-toggle"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
      >
        Portals <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul className="fan-nav-dropdown-menu" role="menu">
          {links.map((link) => (
            <li key={link.key} role="none">
              <a role="menuitem" href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AppNav({ session, onSignedOut }: { session: SessionView | null; onSignedOut?: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    if (onSignedOut) onSignedOut();
    else window.location.href = LANDING_BASE;
  }

  return (
    <nav className="shell-nav">
      <a className="shell-logo" href={LANDING_BASE}>TAG<span>.</span></a>

      <button
        className="shell-nav-toggle"
        aria-expanded={menuOpen}
        aria-controls="shell-centre-links"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        onClick={() => setMenuOpen((o) => !o)}
      >
        ☰
      </button>

      <ul className={menuOpen ? 'shell-centre-links open' : 'shell-centre-links'} id="shell-centre-links">
        {CENTRE_LINKS.map((l) => (
          <li key={l.href}><a href={l.href}>{l.label}</a></li>
        ))}
      </ul>

      <div className="shell-nav-right">
        {session ? (
          <>
            <span className="shell-tag">{session.staff ? `${session.account.name} · ${session.staff.title}` : session.account.name}</span>
            <PortalsDropdown session={session} />
            <button className="reset-link" onClick={handleLogout}>Sign out</button>
          </>
        ) : (
          <>
            <a className="shell-nav-link" href="/login">Sign in</a>
            <a className="shell-nav-cta" href="/register">Register</a>
          </>
        )}
      </div>
    </nav>
  );
}

// Convenience wrapper for pages that don't already hold the session:
// fetches it once and renders the same nav. Pages that need the session
// for their own logic should fetch it themselves and use <AppNav/> above,
// so it isn't requested twice.
export function AutoAppNav() {
  const [session, setSession] = useState<SessionView | null>(null);
  const [, setChecked] = useState(false);
  useEffect(() => {
    getSession().then(setSession).finally(() => setChecked(true));
  }, []);
  return <AppNav session={session} />;
}
