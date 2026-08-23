import { useEffect, useState } from 'react';
import { getMyAuditLog, type AuditLogEntry } from '../api';
import './AuditLog.css';

export function AuditLog() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    getMyAuditLog()
      .then(setEntries)
      .catch(() => setEntries([]));
  }, []);

  if (entries.length === 0) return null;

  return (
    <div className="audit-log">
      <h2>Audit log (PR-1)</h2>
      <ul>
        {entries.map((entry) => (
          <li key={entry.id}>
            <span className="actor">{entry.actorLabel}</span> — {entry.action}
            {entry.reason ? ` — "${entry.reason}"` : ''} — {new Date(entry.createdAt).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
