import { useEffect, useState, type FormEvent } from 'react';
import {
  adminDecide,
  adminGetAuditLog,
  adminGetQueue,
  adminLogin,
  getAdminToken,
  resetAdminSession,
  type AuditLogEntry,
  type ProducerApplication,
} from '../api';
import './AdminConsole.css';

export function AdminConsole() {
  const [loggedIn, setLoggedIn] = useState(!!getAdminToken());
  const [email, setEmail] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [queue, setQueue] = useState<ProducerApplication[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function refresh() {
    try {
      const [q, log] = await Promise.all([adminGetQueue('pending'), adminGetAuditLog()]);
      setQueue(q);
      setAuditLog(log);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load admin data');
    }
  }

  useEffect(() => {
    if (loggedIn) refresh();
  }, [loggedIn]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError(null);
    try {
      await adminLogin(email);
      setLoggedIn(true);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  async function handleDecision(id: string, decision: 'approved' | 'rejected') {
    const reason = reasonById[id]?.trim();
    if (!reason) return;
    setBusyId(id);
    try {
      await adminDecide(id, decision, reason);
      await refresh();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Decision failed');
    } finally {
      setBusyId(null);
    }
  }

  function handleLogout() {
    resetAdminSession();
    setLoggedIn(false);
  }

  if (!loggedIn) {
    return (
      <div className="admin-console">
        <p className="eyebrow">Platform Admin</p>
        <h1>Sign in.</h1>
        <p className="admin-sub">
          PRD §5 P6 / §7 J7. No real admin identity provider exists yet
          (TBD #9/#11 — staffing/SLA) — this checks against a seeded
          <code>platform_admin</code> role assignment only.
        </p>
        {loginError && <div className="admin-error">{loginError}</div>}
        <form onSubmit={handleLogin} className="admin-login-form">
          <input
            type="email"
            required
            placeholder="admin@tag.local"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit">Sign in</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-console">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Platform Admin</p>
          <h1>Approval queue.</h1>
        </div>
        <button className="logout-link" onClick={handleLogout}>Sign out</button>
      </div>

      {loadError && <div className="admin-error">{loadError}</div>}

      {queue.length === 0 && <p className="admin-empty">No pending applications.</p>}

      <ul className="queue-list">
        {queue.map((app) => (
          <li key={app.id} className="queue-item">
            <div className="queue-item-head">
              <strong>{app.festivalName}</strong>
              <span className="queue-item-meta">
                {app.producerName} · {app.organisation} · {app.email}
              </span>
            </div>
            <input
              type="text"
              placeholder="Decision reason (required, becomes the AuditLogEntry.reason)"
              value={reasonById[app.id] ?? ''}
              onChange={(e) => setReasonById((r) => ({ ...r, [app.id]: e.target.value }))}
            />
            <div className="queue-actions">
              <button
                className="approve"
                disabled={busyId === app.id || !reasonById[app.id]?.trim()}
                onClick={() => handleDecision(app.id, 'approved')}
              >
                Approve
              </button>
              <button
                className="reject"
                disabled={busyId === app.id || !reasonById[app.id]?.trim()}
                onClick={() => handleDecision(app.id, 'rejected')}
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="audit-heading">Full audit log</h2>
      <ul className="audit-list">
        {auditLog.map((entry) => (
          <li key={entry.id}>
            <span className="actor">{entry.actorLabel}</span> — {entry.action}
            {entry.reason ? ` — "${entry.reason}"` : ''} — {new Date(entry.createdAt).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
