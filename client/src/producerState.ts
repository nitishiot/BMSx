// Mock J7/PR-1 state for the Producer portal demo slice. There is no
// Identity & Access, RBAC enforcement, or Platform Admin console yet
// (PHASE_1_SPEC.md — those are backend work, not built in this slice).
// Everything here is client-side only, resettable, and enforces nothing:
// it exists to demo the shape of the flow (application -> admin review ->
// approved -> event setup) ahead of the real backend replacing it.

export type ApplicationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface ProducerApplication {
  producerName: string;
  organisation: string;
  email: string;
  festivalName: string;
  submittedAt: string;
}

export interface AuditLogEntry {
  actor: string;
  action: 'submitted' | 'approved' | 'rejected';
  target: string;
  timestamp: string;
  reason?: string;
}

export interface EventDetails {
  festivalName: string;
  startDate: string;
  endDate: string;
  venue: string;
  description: string;
}

const KEYS = {
  status: 'tag_producer_application_status',
  application: 'tag_producer_application',
  auditLog: 'tag_producer_audit_log',
  event: 'tag_producer_event',
} as const;

function safeGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function safeSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode / blocked storage — state just won't persist
  }
}

export function getStatus(): ApplicationStatus {
  return safeGet<ApplicationStatus>(KEYS.status) ?? 'none';
}
export function getApplication(): ProducerApplication | null {
  return safeGet<ProducerApplication>(KEYS.application);
}
export function getAuditLog(): AuditLogEntry[] {
  return safeGet<AuditLogEntry[]>(KEYS.auditLog) ?? [];
}
export function getEvent(): EventDetails | null {
  return safeGet<EventDetails>(KEYS.event);
}

function appendAudit(entry: AuditLogEntry) {
  const log = getAuditLog();
  log.push(entry);
  safeSet(KEYS.auditLog, log);
}

export function submitApplication(app: Omit<ProducerApplication, 'submittedAt'>) {
  const full: ProducerApplication = { ...app, submittedAt: new Date().toISOString() };
  safeSet(KEYS.application, full);
  safeSet(KEYS.status, 'pending');
  appendAudit({
    actor: app.email,
    action: 'submitted',
    target: app.festivalName,
    timestamp: full.submittedAt,
  });
}

// Simulates the Platform Admin approval step (J7) until the real admin
// console exists. Labelled as a simulation everywhere it's surfaced.
export function simulateAdminDecision(decision: 'approved' | 'rejected', reason: string) {
  const app = getApplication();
  safeSet(KEYS.status, decision);
  appendAudit({
    actor: 'platform_admin (simulated)',
    action: decision,
    target: app?.festivalName ?? 'unknown',
    timestamp: new Date().toISOString(),
    reason,
  });
}

export function saveEvent(event: EventDetails) {
  safeSet(KEYS.event, event);
}

export function resetAll() {
  Object.values(KEYS).forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  });
}
