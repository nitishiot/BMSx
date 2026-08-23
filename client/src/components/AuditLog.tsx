import { getAuditLog } from '../producerState';
import './AuditLog.css';

export function AuditLog() {
  const entries = getAuditLog();
  if (entries.length === 0) return null;

  return (
    <div className="audit-log">
      <h2>Audit log (PR-1)</h2>
      <ul>
        {entries.map((entry, i) => (
          <li key={i}>
            <span className="actor">{entry.actor}</span> — {entry.action} — {entry.target}
            {entry.reason ? ` — "${entry.reason}"` : ''} — {new Date(entry.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
