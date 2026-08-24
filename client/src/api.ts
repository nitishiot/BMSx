// Real API client for the core-ticketing backend (server/). Since
// 2026-08-24 there is ONE session for every persona (see SESSION_TOKEN_KEY
// below) — authentication is uniform, RBAC decides what a session reaches.

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4000/api';

// The marketing landing page is now served at "/" from this same origin
// (see client/vite.config.ts's landingAtRoot plugin), so this is a plain
// relative path — no cross-origin hop, and the session below is genuinely
// shared with it.
export const LANDING_BASE = '/';

// ONE session token for every persona (2026-08-24). Replaces four
// separate keys (producer/admin/fan/ops) that let a browser hold four
// simultaneous, unrelated identities — which is exactly how an anonymous
// -looking landing page could sit beside a signed-in /account page.
// One login, one session, RBAC decides what it can reach.
const SESSION_TOKEN_KEY = 'tag_session';
// Read once at startup so a browser carrying pre-unification tokens
// doesn't silently keep behaving as if signed in under the old scheme.
const LEGACY_TOKEN_KEYS = ['tag_producer_token', 'tag_admin_token', 'tag_fan_token', 'tag_ops_token'];

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

// --- Unified session (one login for every persona) ---

export function getSessionToken(): string | null {
  return safeGet(SESSION_TOKEN_KEY);
}

// A browser that still holds any pre-unification token would otherwise
// keep acting signed-in under a scheme the server no longer issues.
// Cleared once, at module load, before anything reads a session.
(function clearLegacyTokens() {
  for (const key of LEGACY_TOKEN_KEYS) safeRemove(key);
})();

export interface SessionView {
  account: { id: string; email: string; name: string; emailVerifiedAt: string | null };
  roles: string[];
  staff: { orgRoleKey: string; title: string; displayName: string; capabilities: string[] } | null;
  navLinks: { key: string; label: string }[];
  portals: { key: string; label: string; href: string }[];
  // Where sign-in should land this session when no ?next= was given —
  // resolved server-side from the same RBAC as `portals`, so the client
  // never has to guess which surface a persona belongs on.
  homeHref: string;
}

// The single source of truth every nav renders from. Returns null when
// there's no valid session — an expired/invalidated token resolves to
// signed-out rather than throwing, and is cleared so the UI can't keep
// showing a stale identity.
export async function getSession(): Promise<SessionView | null> {
  const token = getSessionToken();
  if (!token) return null;
  try {
    return await request<SessionView>('/auth/me', {}, token);
  } catch {
    safeRemove(SESSION_TOKEN_KEY);
    return null;
  }
}

export async function login(email: string, password: string): Promise<void> {
  const { token } = await request<{ token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  safeSet(SESSION_TOKEN_KEY, token);
}

export async function register(email: string, name: string, password: string): Promise<void> {
  const { token } = await request<{ token: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, name, password }),
  });
  safeSet(SESSION_TOKEN_KEY, token);
}

// Invalidates the session server-side before discarding the local token —
// discarding only the local copy would leave a replayable session row.
export async function logout(): Promise<void> {
  const token = getSessionToken();
  try {
    if (token) await request('/auth/logout', { method: 'POST' }, token);
  } finally {
    safeRemove(SESSION_TOKEN_KEY);
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
  return safeGet(SESSION_TOKEN_KEY);
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
  safeSet(SESSION_TOKEN_KEY, token);
  return application;
}

export async function getMyApplication(): Promise<{ application: ProducerApplication | null; roles: string[]; suspended: boolean } | null> {
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

export interface Venue {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity: number;
}

export interface Zone {
  id: string;
  eventId: string;
  name: string;
  capacity: number;
  priceTier: string;
}

export interface CatalogueEvent {
  id: string;
  festivalId: string;
  venueId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  description: string | null;
  venue: Venue;
  zones: Zone[];
}

export async function createVenue(input: { name: string; city: string; country: string; capacity: number }): Promise<Venue> {
  const token = getProducerToken();
  const { venue } = await request<{ venue: Venue }>('/catalogue/venues', { method: 'POST', body: JSON.stringify(input) }, token);
  return venue;
}

export async function createEvent(
  festivalId: string,
  input: { venueId: string; name: string; startsAt: string; endsAt: string; description?: string },
): Promise<CatalogueEvent> {
  const token = getProducerToken();
  const { event } = await request<{ event: CatalogueEvent }>(
    `/catalogue/festivals/${festivalId}/events`,
    { method: 'POST', body: JSON.stringify(input) },
    token,
  );
  return event;
}

export async function getMyEvents(festivalId: string): Promise<CatalogueEvent[]> {
  const token = getProducerToken();
  const { events } = await request<{ events: CatalogueEvent[] }>(`/catalogue/festivals/${festivalId}/events/mine`, {}, token);
  return events;
}

export async function createZone(eventId: string, input: { name: string; capacity: number; priceTier: string }): Promise<Zone> {
  const token = getProducerToken();
  const { zone } = await request<{ zone: Zone }>(`/catalogue/events/${eventId}/zones`, { method: 'POST', body: JSON.stringify(input) }, token);
  return zone;
}

export function resetProducerSession() {
  safeRemove(SESSION_TOKEN_KEY);
}

// --- Platform Admin side ---

export function getAdminToken(): string | null {
  return safeGet(SESSION_TOKEN_KEY);
}

export async function adminLogin(email: string): Promise<void> {
  const { token } = await request<{ token: string }>('/admin-auth/login', { method: 'POST', body: JSON.stringify({ email }) });
  safeSet(SESSION_TOKEN_KEY, token);
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

export interface ActiveProducer {
  application: ProducerApplication;
  suspended: boolean;
}

export async function adminGetProducers(): Promise<ActiveProducer[]> {
  const token = getAdminToken();
  const { producers } = await request<{ producers: ActiveProducer[] }>('/admin/producers', {}, token);
  return producers;
}

export async function adminSuspendProducer(accountId: string, reason: string): Promise<void> {
  const token = getAdminToken();
  await request(`/admin/accounts/${accountId}/suspend`, { method: 'POST', body: JSON.stringify({ reason }) }, token);
}

export async function adminReinstateProducer(accountId: string, reason: string): Promise<void> {
  const token = getAdminToken();
  await request(`/admin/accounts/${accountId}/reinstate`, { method: 'POST', body: JSON.stringify({ reason }) }, token);
}

export function resetAdminSession() {
  safeRemove(SESSION_TOKEN_KEY);
}

// --- Fan Web (J1: guest-to-ticket) ---
// No auth required for any of these — carts are guest-usable per spec §2.
// Ticket/inventory/cart types mirror server/src/routes/{inventory,orders}.ts.

export interface Allocation {
  totalQuantity: number;
  remaining: number;
}

export interface TicketType {
  id: string;
  zoneId: string;
  name: string;
  priceMinorUnits: number;
  currency: string;
  allocation: Allocation | null;
}

export interface CartItem {
  id: string;
  cartId: string;
  ticketTypeId: string;
  holdId: string;
  quantity: number;
  unitPriceMinorUnits: number;
}

export interface CartView {
  id: string;
  accountId: string | null;
  status: 'open' | 'checked_out' | 'abandoned';
  items: CartItem[];
  subtotalMinorUnits: number;
  feeMinorUnits: number;
  totalMinorUnits: number;
}

export interface Ticket {
  id: string;
  ticketTypeId: string;
  orderId: string;
  orderLineId: string;
  holderName: string | null;
  qrCode: string;
  issuedAt: string;
}

export interface Order {
  id: string;
  cartId: string;
  guestEmail: string | null;
  guestName: string | null;
  subtotalMinorUnits: number;
  feeMinorUnits: number;
  totalMinorUnits: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
}

export async function getPublicFestival(id: string): Promise<Festival> {
  const { festival } = await request<{ festival: Festival }>(`/festivals/${id}`);
  return festival;
}

export async function getPublicEvents(festivalId: string): Promise<CatalogueEvent[]> {
  const { events } = await request<{ events: CatalogueEvent[] }>(`/catalogue/festivals/${festivalId}/events`);
  return events;
}

export async function getZoneTicketTypes(zoneId: string): Promise<TicketType[]> {
  const { ticketTypes } = await request<{ ticketTypes: TicketType[] }>(`/inventory/zones/${zoneId}/ticket-types`);
  return ticketTypes;
}

const CART_ID_KEY = 'tag_cart_id';

export function getCartId(): string | null {
  return safeGet(CART_ID_KEY);
}

export function clearCartId() {
  safeRemove(CART_ID_KEY);
}

export async function ensureCart(): Promise<string> {
  const existing = getCartId();
  if (existing) return existing;
  const { cart } = await request<{ cart: { id: string } }>('/orders/carts', { method: 'POST', body: '{}' });
  safeSet(CART_ID_KEY, cart.id);
  return cart.id;
}

export async function getCart(cartId: string): Promise<CartView> {
  const { cart } = await request<{ cart: CartView }>(`/orders/carts/${cartId}`);
  return cart;
}

export async function addCartItem(cartId: string, ticketTypeId: string, quantity: number): Promise<CartView> {
  const { cart } = await request<{ cart: CartView }>(
    `/orders/carts/${cartId}/items`,
    { method: 'POST', body: JSON.stringify({ ticketTypeId, quantity }) },
  );
  return cart;
}

export async function removeCartItem(cartId: string, itemId: string): Promise<void> {
  await fetch(`${API_BASE}/orders/carts/${cartId}/items/${itemId}`, { method: 'DELETE' });
}

// --- LP-14: fan survey -> End User account ---
// A third bearer token, distinct from the producer/admin ones, for the
// same reason those are kept separate — this is a different account
// signing in from a different browsing context (Fan Web), not the same
// session as any producer/admin login on the same machine.

export function getFanToken(): string | null {
  return safeGet(SESSION_TOKEN_KEY);
}

export function resetFanSession() {
  safeRemove(SESSION_TOKEN_KEY);
}

export interface FanAccount {
  id: string;
  email: string;
  name: string;
  emailVerifiedAt: string | null;
}

export interface SurveyResponseRecord {
  id: string;
  accountId: string;
  answers: Record<string, string>;
  createdAt: string;
}

export async function submitSurvey(
  email: string,
  name: string,
  answers: Record<string, string>,
): Promise<{ account: FanAccount; verificationTokenForDemo: string | null }> {
  const result = await request<{ token: string; account: FanAccount; verificationTokenForDemo: string | null }>(
    '/survey/responses',
    { method: 'POST', body: JSON.stringify({ email, name, answers }) },
  );
  safeSet(SESSION_TOKEN_KEY, result.token);
  return { account: result.account, verificationTokenForDemo: result.verificationTokenForDemo };
}

export async function getMyAccount(): Promise<{ account: FanAccount; surveyResponse: SurveyResponseRecord | null } | null> {
  const token = getFanToken();
  if (!token) return null;
  return request('/account/me', {}, token);
}

export async function verifyEmail(token: string): Promise<void> {
  await request('/account/verify-email', { method: 'POST', body: JSON.stringify({ token }) });
}

// Dev/demo-only convenience (no real inbox to resend to) — PHASE_1_CT_SPEC.md
// LP-14 flags this explicitly as not part of the real flow.
export async function resendVerification(): Promise<string | null> {
  const token = getFanToken();
  const { verificationTokenForDemo } = await request<{ verificationTokenForDemo: string | null }>(
    '/account/resend-verification',
    { method: 'POST' },
    token,
  );
  return verificationTokenForDemo;
}

export async function checkout(
  cartId: string,
  input: { guestEmail: string; guestName?: string },
): Promise<{ order: Order; tickets: Ticket[] }> {
  const result = await request<{ order: Order; tickets: Ticket[] }>(
    `/orders/carts/${cartId}/checkout`,
    { method: 'POST', body: JSON.stringify(input) },
  );
  clearCartId();
  return result;
}

// --- Internal Ops Console (build/MVP2_InternalOps/PHASE_1_IO_SPEC.md) ---
// Login/logout/me all moved to the unified session above — staff sign in
// the same way everyone else does. What remains here is the staff-only,
// capability-gated data these dashboards read.

function getOpsToken(): string | null {
  return getSessionToken();
}

export interface OrgTreeNode {
  id: string;
  key: string;
  title: string;
  department: string | null;
  personName: string | null;
  children: OrgTreeNode[];
}

export async function getOpsOrgChart(): Promise<{ scope: 'subtree' | 'company'; tree: OrgTreeNode | OrgTreeNode[] }> {
  const token = getOpsToken();
  return request('/internal-ops/org-chart', {}, token);
}

export async function getOpsCompanyMetrics(): Promise<{ metrics: null; note: string }> {
  const token = getOpsToken();
  return request('/internal-ops/company-metrics', {}, token);
}

// --- Internal Ops org management (manage_org only) ---
// PHASE_1_IO_INCREMENT_SPEC.md §2/§5/§6.

export interface OpsCapability {
  id: string;
  key: string;
  description: string;
}

export async function getOpsCapabilities(): Promise<OpsCapability[]> {
  const token = getOpsToken();
  const { capabilities } = await request<{ capabilities: OpsCapability[] }>('/internal-ops/capabilities', {}, token);
  return capabilities;
}

export interface CreateOrgRoleInput {
  key: string;
  title: string;
  department?: string;
  personName?: string;
  reportsToOrgRoleId?: string | null;
}

export async function createOpsOrgRole(input: CreateOrgRoleInput): Promise<void> {
  const token = getOpsToken();
  await request('/internal-ops/org-roles', { method: 'POST', body: JSON.stringify(input) }, token);
}

export async function createOpsCapability(input: { key: string; description: string }): Promise<void> {
  const token = getOpsToken();
  await request('/internal-ops/capabilities', { method: 'POST', body: JSON.stringify(input) }, token);
}

export async function grantOpsCapability(orgRoleId: string, capabilityId: string): Promise<void> {
  const token = getOpsToken();
  await request(`/internal-ops/org-roles/${orgRoleId}/capabilities`, {
    method: 'POST',
    body: JSON.stringify({ capabilityId }),
  }, token);
}

export async function revokeOpsCapability(orgRoleId: string, capabilityId: string): Promise<void> {
  const token = getOpsToken();
  await request(`/internal-ops/org-roles/${orgRoleId}/capabilities/${capabilityId}`, { method: 'DELETE' }, token);
}

// --- Internal Ops survey-response visibility (view_survey_responses only) ---

export interface OpsSurveyResponse {
  id: string;
  createdAt: string;
  answers: Record<string, string>;
  account: { id: string; name: string; email: string } | null;
}

export async function getOpsSurveyResponses(): Promise<OpsSurveyResponse[]> {
  const token = getOpsToken();
  const { responses } = await request<{ responses: OpsSurveyResponse[] }>('/internal-ops/survey-responses', {}, token);
  return responses;
}

// --- PHASE_1_CT_INCREMENT_SPEC.md §2.1 — platform-wide event roster ---
// (view_all_events only; the endpoint enforces it, this is just the read)

export interface OpsRosterTicketType {
  id: string;
  name: string;
  priceMinorUnits: number;
  currency: string;
  allocationTotal: number | null;
  allocationRemaining: number | null;
  ticketsIssued: number;
}

export interface OpsRosterFestival {
  id: string;
  name: string;
  venue: string;
  startDate: string;
  endDate: string;
  producer: { id: string; name: string; email: string } | null;
  events: {
    id: string;
    name: string;
    startsAt: string;
    endsAt: string;
    venue: { name: string; city: string; country: string };
    zones: { id: string; name: string; capacity: number; priceTier: string; ticketTypes: OpsRosterTicketType[] }[];
  }[];
}

export async function getOpsAllEvents(): Promise<OpsRosterFestival[]> {
  const token = getOpsToken();
  const { festivals } = await request<{ festivals: OpsRosterFestival[] }>('/internal-ops/events', {}, token);
  return festivals;
}

// --- PHASE_1_CT_INCREMENT_SPEC.md §2.4 — record a hire against a role ---
// Passing null clears the assignment (the role becomes an open position).

export async function assignOpsPerson(orgRoleId: string, personName: string | null): Promise<void> {
  const token = getOpsToken();
  await request(`/internal-ops/org-roles/${orgRoleId}/person`, {
    method: 'PATCH',
    body: JSON.stringify({ personName }),
  }, token);
}

// --- PHASE_1_CT_INCREMENT_SPEC.md §2.2 — the caller's own tickets ---
// Scoped server-side to the session; there is no account parameter to
// pass, by design.

export interface MyTicket {
  id: string;
  qrCode: string;
  issuedAt: string;
  ticketTypeName: string;
  zoneName: string | null;
  eventName: string | null;
  startsAt: string | null;
  festivalId: string | null;
  festivalName: string | null;
  venue: { name: string; city: string; country: string } | null;
}

export interface MyTicketOrder {
  id: string;
  createdAt: string;
  totalMinorUnits: number;
  currency: string;
  tickets: MyTicket[];
}

export async function getMyTickets(): Promise<MyTicketOrder[]> {
  const token = getSessionToken();
  const { orders } = await request<{ orders: MyTicketOrder[] }>('/account/tickets', {}, token);
  return orders;
}
