import { useEffect, useState, type FormEvent } from 'react';
import {
  getOpsOrgChart,
  getOpsCompanyMetrics,
  getOpsCapabilities,
  getOpsSurveyResponses,
  createOpsOrgRole,
  createOpsCapability,
  grantOpsCapability,
  revokeOpsCapability,
  getSession,
  type SessionView,
  type OrgTreeNode,
  type OpsCapability,
  type OpsSurveyResponse,
} from '../api';
import { PRODUCER_FEATURE_MANIFEST } from '../featureManifest';
import { OrgTree, OrgForest } from '../components/OrgTree';
import { OpsEventRoster } from '../components/OpsEventRoster';
import { OpsNewHires } from '../components/OpsNewHires';
import { AppNav, AutoAppNav } from '../components/AppNav';
import './InternalOpsConsole.css';

// Flattens a company tree/subtree into a plain list — the org-admin
// screen needs a flat "pick a role" dropdown, the tree widget doesn't.
function flattenTree(tree: OrgTreeNode | OrgTreeNode[] | null): OrgTreeNode[] {
  if (!tree) return [];
  const roots = Array.isArray(tree) ? tree : [tree];
  const out: OrgTreeNode[] = [];
  function walk(node: OrgTreeNode) {
    out.push(node);
    node.children.forEach(walk);
  }
  roots.forEach(walk);
  return out;
}

// build/MVP2_InternalOps/PHASE_1_IO_SPEC.md — capability-driven dashboard:
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
      {tree && (Array.isArray(tree) ? <OrgForest nodes={tree} /> : <OrgTree node={tree} />)}
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

// PHASE_1_IO_INCREMENT_SPEC.md §2/§6 — org management, only reachable via
// nav for manage_org holders (server-resolved into me.navLinks, not a
// client-side guess — the page itself still calls the real
// manage_org-gated endpoints, so this is defence in depth, not the only
// gate).
function OrgRolesAdmin() {
  const [tree, setTree] = useState<OrgTreeNode | OrgTreeNode[] | null>(null);
  const [capabilities, setCapabilities] = useState<OpsCapability[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [roleKey, setRoleKey] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [roleDept, setRoleDept] = useState('');
  const [reportsTo, setReportsTo] = useState('');

  const [capKey, setCapKey] = useState('');
  const [capDesc, setCapDesc] = useState('');

  const [grantRoleId, setGrantRoleId] = useState('');
  const [grantCapId, setGrantCapId] = useState('');

  function reload() {
    Promise.all([getOpsOrgChart(), getOpsCapabilities()])
      .then(([chart, caps]) => {
        setTree(chart.tree);
        setCapabilities(caps);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load org admin data'));
  }

  useEffect(reload, []);

  const roles = flattenTree(tree);

  async function handleCreateRole(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    try {
      await createOpsOrgRole({
        key: roleKey.trim(),
        title: roleTitle.trim(),
        department: roleDept.trim() || undefined,
        reportsToOrgRoleId: reportsTo || null,
      });
      setRoleKey(''); setRoleTitle(''); setRoleDept(''); setReportsTo('');
      setStatus(`Created role "${roleTitle}".`);
      reload();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not create role');
    }
  }

  async function handleCreateCapability(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    try {
      await createOpsCapability({ key: capKey.trim(), description: capDesc.trim() });
      setCapKey(''); setCapDesc('');
      setStatus(`Created capability "${capKey}".`);
      reload();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not create capability');
    }
  }

  async function handleGrant(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    try {
      await grantOpsCapability(grantRoleId, grantCapId);
      setStatus('Capability granted.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not grant capability');
    }
  }

  async function handleRevoke() {
    setStatus(null);
    try {
      await revokeOpsCapability(grantRoleId, grantCapId);
      setStatus('Capability revoked (if it was granted).');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not revoke capability');
    }
  }

  return (
    <div className="ops-widget">
      <h2>Org roles admin</h2>
      <p className="ops-widget-note">
        Create/edit OrgRoles and Capabilities, and grant/revoke capability assignments — the
        console-driven alternative to editing seed data (PHASE_1_IO_INCREMENT_SPEC.md §2).
      </p>
      {error && <p className="saved-banner error">{error}</p>}
      {status && <p className="ops-widget-note ops-status">{status}</p>}

      <form className="ops-form" onSubmit={handleCreateRole}>
        <h3>Create org role</h3>
        <input placeholder="key (e.g. data_analyst)" value={roleKey} onChange={(e) => setRoleKey(e.target.value)} required />
        <input placeholder="title" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} required />
        <input placeholder="department (optional)" value={roleDept} onChange={(e) => setRoleDept(e.target.value)} />
        <select value={reportsTo} onChange={(e) => setReportsTo(e.target.value)}>
          <option value="">Reports to… (optional, top-level if blank)</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.title}{r.personName ? ` — ${r.personName}` : ''}</option>)}
        </select>
        <button type="submit" className="submit-btn">Create role</button>
      </form>

      <form className="ops-form" onSubmit={handleCreateCapability}>
        <h3>Create capability</h3>
        <input placeholder="key (e.g. view_finance_dashboard)" value={capKey} onChange={(e) => setCapKey(e.target.value)} required />
        <input placeholder="description" value={capDesc} onChange={(e) => setCapDesc(e.target.value)} required />
        <button type="submit" className="submit-btn">Create capability</button>
      </form>

      <form className="ops-form" onSubmit={handleGrant}>
        <h3>Grant / revoke capability</h3>
        <select value={grantRoleId} onChange={(e) => setGrantRoleId(e.target.value)} required>
          <option value="">Choose a role…</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.title}{r.personName ? ` — ${r.personName}` : ''}</option>)}
        </select>
        <select value={grantCapId} onChange={(e) => setGrantCapId(e.target.value)} required>
          <option value="">Choose a capability…</option>
          {capabilities.map((c) => <option key={c.id} value={c.id}>{c.key}</option>)}
        </select>
        <div className="ops-form-actions">
          <button type="submit" className="submit-btn">Grant</button>
          <button type="button" className="submit-btn secondary" onClick={handleRevoke} disabled={!grantRoleId || !grantCapId}>Revoke</button>
        </div>
      </form>

      <h3 className="ops-subheading">Current org chart</h3>
      {!tree && !error && <p className="ops-widget-note">Loading…</p>}
      {tree && (Array.isArray(tree) ? <OrgForest nodes={tree} /> : <OrgTree node={tree} />)}
    </div>
  );
}

// PHASE_1_IO_INCREMENT_SPEC.md §2/§6 — real SurveyResponse rows (persisted
// since LP-14), only reachable for view_survey_responses holders.
function SurveyResponsesWidget() {
  const [responses, setResponses] = useState<OpsSurveyResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    getOpsSurveyResponses()
      .then(setResponses)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load survey responses'));
  }, []);

  return (
    <div className="ops-widget">
      <h2>Survey responses</h2>
      <p className="ops-widget-note">
        Real fan survey submissions from the LP-14 flow — {responses ? responses.length : '…'} on record.
      </p>
      {error && <p className="saved-banner error">{error}</p>}
      {!responses && !error && <p className="ops-widget-note">Loading…</p>}
      {responses && responses.length === 0 && <p className="ops-widget-note">No survey responses yet.</p>}
      {responses?.map((r) => (
        <div key={r.id} className="survey-response-row">
          <button type="button" className="survey-response-summary" onClick={() => setOpenId(openId === r.id ? null : r.id)}>
            <span>{r.account?.name ?? 'Unknown'} · {r.account?.email ?? 'no email'}</span>
            <span className="org-tree-dept">{new Date(r.createdAt).toLocaleDateString()}</span>
          </button>
          {openId === r.id && (
            <dl className="survey-response-answers">
              {Object.entries(r.answers).map(([q, a]) => (
                <div key={q}>
                  <dt>{q}</dt>
                  <dd>{a}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      ))}
    </div>
  );
}

// PHASE_1_IO_INCREMENT_SPEC.md §2/§6 — page-level nav resolved from
// me.navLinks (server-computed from actual capabilities), not a
// client-side guess: a Founder/Head of Product sees "Org roles admin" and
// "Survey responses" tabs, a CTO sees neither, without any client code
// change when a new role is granted an existing capability (same
// genericity contract as the dashboard widgets).
type OpsView = 'dashboard' | 'org-admin' | 'survey-responses' | 'all-events' | 'hiring';

export function InternalOpsConsole() {
  const [session, setSession] = useState<SessionView | null>(null);
  const [checked, setChecked] = useState(false);
  const [view, setView] = useState<OpsView>('dashboard');

  useEffect(() => {
    getSession().then(setSession).finally(() => setChecked(true));
  }, []);

  const staff = session?.staff ?? null;

  if (!checked) return <AutoAppNav />;

  // The staff-only login form is gone — /ops is a destination behind the
  // one shared sign-in page now (PHASE_1_IO_INCREMENT_SPEC.md §4,
  // revised). A signed-in account with no StaffProfile is told plainly
  // rather than being offered a second, staff-specific login form.
  if (!staff) {
    return (
      <>
        <AppNav session={session} />
        <div className="ops-console">
          <p className="eyebrow">TAG Internal Ops</p>
          <h1>{session ? 'Not authorised.' : 'Sign in required.'}</h1>
          <p className="apply-sub">
            {session
              ? 'This console is for TAG staff. Your account has no Internal Ops staff profile, so there is nothing here for you.'
              : 'Sign in with a TAG staff account to reach the Internal Ops console.'}
          </p>
          {!session && <a className="submit-btn" href="/login?next=/ops">Go to sign in</a>}
        </div>
      </>
    );
  }

  const hasOrgAdmin = session!.navLinks.some((l) => l.key === 'org-admin');
  const hasSurveyResponses = session!.navLinks.some((l) => l.key === 'survey-responses');
  const hasAllEvents = session!.navLinks.some((l) => l.key === 'all-events');
  const hasHiring = session!.navLinks.some((l) => l.key === 'hiring');

  return (
    <>
      <AppNav session={session} />
      <div className="ops-console">
      <p className="eyebrow">Internal Ops</p>
      <h1>Welcome, {staff.displayName}.</h1>

      {(hasOrgAdmin || hasSurveyResponses || hasAllEvents || hasHiring) && (
        <div className="ops-tabs" role="tablist" aria-label="Internal Ops sections">
          <button type="button" role="tab" aria-selected={view === 'dashboard'} className={view === 'dashboard' ? 'ops-tab active' : 'ops-tab'} onClick={() => setView('dashboard')}>Dashboard</button>
          {hasOrgAdmin && (
            <button type="button" role="tab" aria-selected={view === 'org-admin'} className={view === 'org-admin' ? 'ops-tab active' : 'ops-tab'} onClick={() => setView('org-admin')}>Org roles admin</button>
          )}
          {hasSurveyResponses && (
            <button type="button" role="tab" aria-selected={view === 'survey-responses'} className={view === 'survey-responses' ? 'ops-tab active' : 'ops-tab'} onClick={() => setView('survey-responses')}>Survey responses</button>
          )}
          {hasAllEvents && (
            <button type="button" role="tab" aria-selected={view === 'all-events'} className={view === 'all-events' ? 'ops-tab active' : 'ops-tab'} onClick={() => setView('all-events')}>All events</button>
          )}
          {hasHiring && (
            <button type="button" role="tab" aria-selected={view === 'hiring'} className={view === 'hiring' ? 'ops-tab active' : 'ops-tab'} onClick={() => setView('hiring')}>New hires</button>
          )}
        </div>
      )}

      {view === 'dashboard' && <DashboardWidgets capabilities={staff.capabilities} />}
      {view === 'org-admin' && hasOrgAdmin && <OrgRolesAdmin />}
      {view === 'survey-responses' && hasSurveyResponses && <SurveyResponsesWidget />}
      {view === 'all-events' && hasAllEvents && <OpsEventRoster />}
      {view === 'hiring' && hasHiring && <OpsNewHires />}
      </div>
    </>
  );
}
