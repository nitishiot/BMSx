import { useEffect, useState, type FormEvent } from 'react';
import {
  getOpsToken,
  getOpsMe,
  getOpsOrgChart,
  getOpsCompanyMetrics,
  opsLogin,
  resetOpsSession,
  type OpsMe,
  type OrgTreeNode,
} from '../api';
import { PRODUCER_FEATURE_MANIFEST } from '../featureManifest';
import { OrgTree } from '../components/OrgTree';
import './InternalOpsConsole.css';

// build/MVP2_InternalOps/PHASE_2_SPEC.md — capability-driven dashboard:
// each widget below is gated purely on whether `me.capabilities` includes
// its key, never on the caller's specific role. Adding a role that grants
// an existing capability renders the matching widget automatically (spec
// exit check 4) — no new frontend code needed for that case; a genuinely
// new widget *type* still needs a new block here, same as any UI.
function RoadmapWidget() {
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});
  return (
    <div className="ops-widget">
      <h2>Product roadmap</h2>
      <p className="ops-widget-note">
        Reuses the real P1/P2 manifest sourced from TAG_PRD_v3.md §10 (same data the Producer
        portal's roadmap teaser shows). "Reviewed" is local to this browser session only — no
        backend persistence exists for this yet, so it never claims to be saved.
      </p>
      {PRODUCER_FEATURE_MANIFEST.map((f) => (
        <label key={f.id} className="roadmap-row">
          <input
            type="checkbox"
            checked={!!reviewed[f.id]}
            onChange={(e) => setReviewed((prev) => ({ ...prev, [f.id]: e.target.checked }))}
          />
          <span className="roadmap-icon">{f.icon}</span>
          <span>
            <span className="roadmap-title">{f.title}</span>
            <span className="roadmap-tier">{f.tier}</span>
            <p className="roadmap-desc">{f.desc}</p>
          </span>
        </label>
      ))}
    </div>
  );
}

function OrgTreeWidget({ title, note }: { title: string; note: string }) {
  const [tree, setTree] = useState<OrgTreeNode | OrgTreeNode[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOpsOrgChart()
      .then((res) => setTree(res.tree))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load org chart'));
  }, []);

  return (
    <div className="ops-widget">
      <h2>{title}</h2>
      <p className="ops-widget-note">{note}</p>
      {error && <p className="saved-banner error">{error}</p>}
      {!tree && !error && <p className="ops-widget-note">Loading…</p>}
      {tree && (Array.isArray(tree) ? tree.map((n) => <OrgTree key={n.id} node={n} />) : <OrgTree node={tree} />)}
    </div>
  );
}

function MetricsWidget() {
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    getOpsCompanyMetrics().then((res) => setNote(res.note));
  }, []);

  return (
    <div className="ops-widget">
      <h2>Company metrics</h2>
      <p className="ops-widget-note">{note ?? 'Loading…'}</p>
    </div>
  );
}

// The org-tree widget is one component whose *content* (subtree vs. full
// company) the server decides based on the caller's capabilities —
// `view_company_rollup` and `view_engineering_roster`/`manage_team` both
// resolve to the same underlying `/org-chart` call. Rendering both
// capabilities as independent widgets (a naive per-capability loop) would
// call that endpoint twice and show the identical tree under two
// headings for a role holding both, e.g. the Founder — so tree/metrics
// visibility is resolved once by priority, not iterated blindly. This is
// still capability-driven, not role-driven: any role granted these keys
// renders correctly, per spec exit check 4.
function DashboardWidgets({ capabilities }: { capabilities: string[] }) {
  const hasRollup = capabilities.includes('view_company_rollup');
  const hasRoster = capabilities.includes('view_engineering_roster') || capabilities.includes('manage_team');
  return (
    <>
      {capabilities.includes('view_product_roadmap') && <RoadmapWidget />}
      {hasRollup ? (
        <>
          <OrgTreeWidget title="Company org chart" note="Full company rollup — every team, both founders." />
          <MetricsWidget />
        </>
      ) : (
        hasRoster && <OrgTreeWidget title="Your team" note="Your reporting subtree, pulled live from the org chart." />
      )}
    </>
  );
}

export function InternalOpsConsole() {
  const [loggedIn, setLoggedIn] = useState(!!getOpsToken());
  const [email, setEmail] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [me, setMe] = useState<OpsMe | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!loggedIn) return;
    getOpsMe()
      .then(setMe)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Could not load your profile'));
  }, [loggedIn]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError(null);
    try {
      await opsLogin(email);
      setLoggedIn(true);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  function handleLogout() {
    resetOpsSession();
    setLoggedIn(false);
    setMe(null);
  }

  if (!loggedIn) {
    return (
      <div className="ops-console">
        <p className="eyebrow">TAG Internal Ops</p>
        <h1>Staff sign-in.</h1>
        <p className="apply-sub">
          build/MVP2_InternalOps/PHASE_2_SPEC.md §4 — no real staff identity provider exists yet;
          this checks against a seeded StaffProfile only, same stand-in pattern as the Platform
          Admin login.
        </p>
        {loginError && <p className="saved-banner error">{loginError}</p>}
        <form onSubmit={handleLogin}>
          <input type="email" required placeholder="you@tag.local" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit" className="submit-btn">Sign in</button>
        </form>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="ops-console">
        <p className="saved-banner error">{loadError}</p>
        <button className="submit-btn" onClick={handleLogout}>Sign out</button>
      </div>
    );
  }

  if (!me) return null;

  return (
    <div className="ops-console">
      <nav className="shell-nav">
        <a className="shell-logo" href="/">TAG<span>.</span></a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.9rem' }}>
          <span className="shell-tag">{me.displayName} · {me.orgRole.title}</span>
          <button className="reset-link" onClick={handleLogout}>Sign out</button>
        </div>
      </nav>
      <p className="eyebrow">Internal Ops</p>
      <h1>Welcome, {me.displayName}.</h1>

      <DashboardWidgets capabilities={me.capabilities} />
    </div>
  );
}
