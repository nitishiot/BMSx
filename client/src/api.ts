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
  safeRemove(ADMIN_TOKEN_KEY);
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
