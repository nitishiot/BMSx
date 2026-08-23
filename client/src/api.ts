// Real API client for the core-ticketing backend (server/), replacing the
// client-side simulation that used to live in producerState.ts. Two
// separate bearer tokens are kept in localStorage — a producer's own
// session, and (only on the /admin route) a Platform Admin's — mirroring
// the two distinct accounts PR-1 actually requires.

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4000/api';

const PRODUCER_TOKEN_KEY = 'tag_producer_token';
const ADMIN_TOKEN_KEY = 'tag_admin_token';

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode / blocked storage */
  }
}
function safeRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface ProducerApplication {
  id: string;
  accountId: string;
  producerName: string;
  organisation: string;
  email: string;
  festivalName: string;
  status: ApplicationStatus;
  submittedAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
  decisionReason: string | null;
}

export interface AuditLogEntry {
  id: string;
  actorLabel: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  createdAt: string;
}

export interface Festival {
  id: string;
  producerAccountId: string;
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  description: string | null;
  createdAt: string;
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error ? JSON.stringify(body.error) : `Request failed: ${res.status}`);
  }
  return body as T;
}

// --- Producer side ---

export function getProducerToken(): string | null {
  return safeGet(PRODUCER_TOKEN_KEY);
}

export async function submitApplication(input: {
  producerName: string;
  organisation: string;
  email: string;
  festivalName: string;
}): Promise<ProducerApplication> {
  const { token, application } = await request<{ token: string; application: ProducerApplication }>(
    '/producer-applications',
    { method: 'POST', body: JSON.stringify(input) },
  );
  safeSet(PRODUCER_TOKEN_KEY, token);
  return application;
}

export async function getMyApplication(): Promise<{ application: ProducerApplication | null; roles: string[] } | null> {
  const token = getProducerToken();
  if (!token) return null;
  return request('/producer-applications/me', {}, token);
}

export async function getMyAuditLog(): Promise<AuditLogEntry[]> {
  const token = getProducerToken();
  if (!token) return [];
  const { entries } = await request<{ entries: AuditLogEntry[] }>('/producer-applications/me/audit-log', {}, token);
  return entries;
}

export async function createFestival(input: {
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  description?: string;
}): Promise<Festival> {
  const token = getProducerToken();
  const { festival } = await request<{ festival: Festival }>('/festivals', { method: 'POST', body: JSON.stringify(input) }, token);
  return festival;
}

export async function getMyFestivals(): Promise<Festival[]> {
  const token = getProducerToken();
  if (!token) return [];
  const { festivals } = await request<{ festivals: Festival[] }>('/festivals/mine', {}, token);
  return festivals;
}

export function resetProducerSession() {
  safeRemove(PRODUCER_TOKEN_KEY);
}

// --- Platform Admin side ---

export function getAdminToken(): string | null {
  return safeGet(ADMIN_TOKEN_KEY);
}

export async function adminLogin(email: string): Promise<void> {
  const { token } = await request<{ token: string }>('/admin-auth/login', { method: 'POST', body: JSON.stringify({ email }) });
  safeSet(ADMIN_TOKEN_KEY, token);
}

export async function adminGetQueue(status?: ApplicationStatus): Promise<ProducerApplication[]> {
  const token = getAdminToken();
  const qs = status ? `?status=${status}` : '';
  const { applications } = await request<{ applications: ProducerApplication[] }>(`/admin/producer-applications${qs}`, {}, token);
  return applications;
}

export async function adminDecide(id: string, decision: 'approved' | 'rejected', reason: string): Promise<ProducerApplication> {
  const token = getAdminToken();
  const { application } = await request<{ application: ProducerApplication }>(
    `/admin/producer-applications/${id}/decision`,
    { method: 'POST', body: JSON.stringify({ decision, reason }) },
    token,
  );
  return application;
}

export async function adminGetAuditLog(): Promise<AuditLogEntry[]> {
  const token = getAdminToken();
  const { entries } = await request<{ entries: AuditLogEntry[] }>('/admin/audit-log', {}, token);
  return entries;
}

export function resetAdminSession() {
  safeRemove(ADMIN_TOKEN_KEY);
}
