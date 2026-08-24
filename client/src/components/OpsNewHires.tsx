import { useEffect, useState } from 'react';
import { assignOpsPerson, getOpsOrgChart, type OrgTreeNode } from '../api';

// PHASE_1_CT_INCREMENT_SPEC.md §2.4 — record a hire against an open
// position. A role with no `personName` is an open position; naming
// someone fills it, and clearing the name reopens it. Gated on
// assign_new_hire (or manage_org) server-side; the tab is only reachable
// when the server's resolved navLinks say so.
//
// Only a name is collected, deliberately: this is not an HR record (no
// start date, contract, or contact details — §2.4's DPDP/GDPR note), and
// naming someone here grants them no login at all. StaffProfile and
// Credential remain separate, explicit acts.
export function OpsNewHires() {
  const [tree, setTree] = useState<OrgTreeNode | OrgTreeNode[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function reload() {
    getOpsOrgChart()
      .then((chart) => setTree(chart.tree))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load org roles'));
  }
  useEffect(reload, []);

  const roles = flatten(tree);
  // Open positions first — filling one is why someone opens this tab.
  // Filled roles stay listed so a wrong name can be corrected.
  const ordered = [...roles].sort(
    (a, b) => (a.personName ? 1 : 0) - (b.personName ? 1 : 0) || a.title.localeCompare(b.title),
  );
  const openCount = roles.filter((r) => !r.personName).length;

  async function assign(role: OrgTreeNode, personName: string | null) {
    setStatus(null);
    setBusyId(role.id);
    try {
      await assignOpsPerson(role.id, personName);
      setStatus(
        personName
          ? `Assigned ${personName} to ${role.title}.`
          : `Cleared ${role.title} — it's an open position again.`,
      );
      setNames((n) => ({ ...n, [role.id]: '' }));
      reload();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not save that assignment');
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <p className="ops-error">{error}</p>;

  return (
    <section className="ops-widget">
      <h2>New hires</h2>
      <p className="ops-note">
        {openCount} open {openCount === 1 ? 'position' : 'positions'} of {roles.length} roles.
        Naming someone here records them on the org chart — it does not create a login for them.
      </p>
      {status && <p className="ops-status">{status}</p>}
      <ul className="hire-list">
        {ordered.map((role) => (
          <li className={role.personName ? 'hire-row filled' : 'hire-row'} key={role.id}>
            <div className="hire-role">
              <strong>{role.title}</strong>
              <span className="ops-muted">{role.department ?? 'No department'}</span>
            </div>
            {role.personName ? (
              <div className="hire-actions">
                <span className="hire-holder">{role.personName}</span>
                <button
                  type="button"
                  className="submit-btn secondary"
                  disabled={busyId === role.id}
                  onClick={() => assign(role, null)}
                >
                  Clear
                </button>
              </div>
            ) : (
              <form
                className="hire-actions"
                onSubmit={(e) => {
                  e.preventDefault();
                  const name = (names[role.id] ?? '').trim();
                  if (name) assign(role, name);
                }}
              >
                <input
                  aria-label={`New hire name for ${role.title}`}
                  placeholder="New hire's name"
                  value={names[role.id] ?? ''}
                  onChange={(e) => setNames((n) => ({ ...n, [role.id]: e.target.value }))}
                />
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={busyId === role.id || !(names[role.id] ?? '').trim()}
                >
                  Assign
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function flatten(tree: OrgTreeNode | OrgTreeNode[] | null): OrgTreeNode[] {
  if (!tree) return [];
  const roots = Array.isArray(tree) ? tree : [tree];
  const out: OrgTreeNode[] = [];
  const walk = (node: OrgTreeNode) => {
    out.push(node);
    node.children.forEach(walk);
  };
  roots.forEach(walk);
  return out;
}
