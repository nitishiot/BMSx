import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  addCartItem,
  checkout,
  ensureCart,
  getCart,
  getPublicEvents,
  getPublicFestival,
  getZoneTicketTypes,
  removeCartItem,
  type CartView,
  type CatalogueEvent,
  type Festival,
  type Order,
  type Ticket,
  type TicketType,
} from '../api';
import { FanNav } from '../components/FanNav';
import './FestivalPage.css';

function formatMoney(minorUnits: number, currency: string): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(minorUnits / 100);
}

interface Props {
  festivalId: string;
}

// J1's guest-to-ticket path: browse this festival's sessions/zones ->
// pick ticket quantities -> itemised cart -> guest checkout (stub PSP,
// ADR-004) -> confirmation with per-ticket QR tokens. No account required
// at any step, per spec §2's guest checkout requirement.
export function FestivalPage({ festivalId }: Props) {
  const [festival, setFestival] = useState<Festival | null>(null);
  const [events, setEvents] = useState<CatalogueEvent[]>([]);
  const [ticketTypesByZone, setTicketTypesByZone] = useState<Record<string, TicketType[]>>({});
  const [cart, setCart] = useState<CartView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyZoneId, setBusyZoneId] = useState<string | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);
  const [step, setStep] = useState<'browse' | 'checkout' | 'confirmation'>('browse');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [confirmation, setConfirmation] = useState<{ order: Order; tickets: Ticket[] } | null>(null);
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const f = await getPublicFestival(festivalId);
        if (cancelled) return;
        setFestival(f);
        const ev = await getPublicEvents(festivalId);
        if (cancelled) return;
        setEvents(ev);

        const zoneIds = ev.flatMap((e) => e.zones.map((z) => z.id));
        const entries = await Promise.all(
          zoneIds.map(async (zoneId) => [zoneId, await getZoneTicketTypes(zoneId)] as const),
        );
        if (cancelled) return;
        setTicketTypesByZone(Object.fromEntries(entries));

        const cartId = await ensureCart();
        const loadedCart = await getCart(cartId);
        if (cancelled) return;
        if (loadedCart.status === 'open') setCart(loadedCart);
      } catch {
        if (!cancelled) setLoadError("Couldn't load this festival. It may not exist, or the backend isn't reachable.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [festivalId]);

  const ticketTypeLookup = useMemo(() => {
    const map = new Map<string, { ticketType: TicketType; zoneName: string; eventName: string }>();
    for (const event of events) {
      for (const zone of event.zones) {
        for (const tt of ticketTypesByZone[zone.id] ?? []) {
          map.set(tt.id, { ticketType: tt, zoneName: zone.name, eventName: event.name });
        }
      }
    }
    return map;
  }, [events, ticketTypesByZone]);

  async function handleAddToCart(ticketType: TicketType) {
    setCartError(null);
    setBusyZoneId(ticketType.zoneId);
    try {
      const cartId = await ensureCart();
      const updated = await addCartItem(cartId, ticketType.id, 1);
      setCart(updated);
      const refreshed = await getZoneTicketTypes(ticketType.zoneId);
      setTicketTypesByZone((prev) => ({ ...prev, [ticketType.zoneId]: refreshed }));
    } catch {
      setCartError('Could not reserve that ticket — it may have just sold out. Try a smaller quantity.');
    } finally {
      setBusyZoneId(null);
    }
  }

  async function handleRemoveItem(itemId: string) {
    if (!cart) return;
    await removeCartItem(cart.id, itemId);
    const updated = await getCart(cart.id);
    setCart(updated);
    // Removing an item releases its hold — refresh affected zones' remaining counts.
    const zoneIds = new Set(events.flatMap((e) => e.zones.map((z) => z.id)));
    const entries = await Promise.all(
      [...zoneIds].map(async (zoneId) => [zoneId, await getZoneTicketTypes(zoneId)] as const),
    );
    setTicketTypesByZone(Object.fromEntries(entries));
  }

  // Encodes each ticket's qrCode token into a real scannable QR image,
  // client-side — no asset persistence involved, so this isn't gated on
  // the object storage decision (spec §8) the way a stored/emailed QR
  // asset would be.
  useEffect(() => {
    if (!confirmation) return;
    let cancelled = false;
    Promise.all(
      confirmation.tickets.map(async (t) => [t.id, await QRCode.toDataURL(t.qrCode, { margin: 1, width: 180 })] as const),
    ).then((entries) => {
      if (!cancelled) setQrDataUrls(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [confirmation]);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!cart) return;
    setCheckoutError(null);
    setCheckingOut(true);
    try {
      const result = await checkout(cart.id, { guestEmail, guestName: guestName || undefined });
      setConfirmation(result);
      setStep('confirmation');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed';
      setCheckoutError(message.includes('declined') || message.includes('Payment') ? 'Payment was declined. Please try again.' : message);
    } finally {
      setCheckingOut(false);
    }
  }

  if (loadError) {
    return (
      <>
        <FanNav />
        <div className="festival-page">
          <p className="saved-banner error">{loadError}</p>
        </div>
      </>
    );
  }

  if (!festival) {
    return (
      <>
        <FanNav />
        <div className="festival-page">Loading festival…</div>
      </>
    );
  }

  if (step === 'confirmation' && confirmation) {
    return (
      <>
      <FanNav />
      <div className="festival-page">
        <p className="eyebrow">Order confirmed</p>
        <h1>You're going to {festival.name}.</h1>
        <p className="apply-sub">
          A confirmation has been recorded for {confirmation.order.guestEmail}. This is a Phase 1
          demo — no real email/notification is sent yet (Notifications module isn't built).
        </p>
        <div className="ticket-grid">
          {confirmation.tickets.map((t) => {
            const info = ticketTypeLookup.get(t.ticketTypeId);
            return (
              <div className="ticket-card" key={t.id}>
                <p className="ticket-event">{info?.eventName ?? festival.name}</p>
                <p className="ticket-zone">{info?.zoneName ?? ''} — {info?.ticketType.name ?? 'Ticket'}</p>
                {qrDataUrls[t.id] ? (
                  <img className="ticket-qr-image" src={qrDataUrls[t.id]} alt={`Scannable QR ticket ${t.qrCode}`} />
                ) : (
                  <p className="ticket-qr-note">Generating QR code…</p>
                )}
                <p className="ticket-qr">{t.qrCode}</p>
              </div>
            );
          })}
        </div>
      </div>
      </>
    );
  }

  if (step === 'checkout' && cart) {
    return (
      <>
      <FanNav />
      <div className="festival-page">
        <p className="eyebrow">Guest checkout</p>
        <h1>Confirm your order</h1>
        <div className="cart-summary">
          {cart.items.map((item) => {
            const info = ticketTypeLookup.get(item.ticketTypeId);
            return (
              <p key={item.id}>
                {item.quantity} × {info?.ticketType.name ?? 'Ticket'} — {formatMoney(item.unitPriceMinorUnits * item.quantity, info?.ticketType.currency ?? 'EUR')}
              </p>
            );
          })}
          <p>Subtotal: {formatMoney(cart.subtotalMinorUnits, 'EUR')}</p>
          <p>Fees: {formatMoney(cart.feeMinorUnits, 'EUR')} <span className="fee-note">(placeholder rate — see spec §8)</span></p>
          <p className="cart-total">Total: {formatMoney(cart.totalMinorUnits, 'EUR')}</p>
        </div>
        <form onSubmit={handleCheckout}>
          <div className="field">
            <label>Email</label>
            <input type="email" required value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Name (optional)</label>
            <input value={guestName} onChange={(e) => setGuestName(e.target.value)} />
          </div>
          {checkoutError && <p className="saved-banner error">{checkoutError}</p>}
          <p className="fee-note">
            Payment goes through a stub sandbox adapter — no real PSP is connected yet (spec §8).
          </p>
          <button type="submit" className="submit-btn" disabled={checkingOut}>{checkingOut ? 'Processing…' : `Pay ${formatMoney(cart.totalMinorUnits, 'EUR')}`}</button>
          <button type="button" className="link-btn" onClick={() => setStep('browse')}>Back</button>
        </form>
      </div>
      </>
    );
  }

  return (
    <>
    <FanNav />
    <div className="festival-page">
      <p className="eyebrow">Festival</p>
      <h1>{festival.name}</h1>
      <p className="apply-sub">{festival.venue} · {new Date(festival.startDate).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>

      {events.length === 0 && <p className="apply-sub">No sessions have been published for this festival yet.</p>}

      {events.map((event) => (
        <div className="event-block" key={event.id}>
          <h2>{event.name}</h2>
          <p className="apply-sub">{event.venue.name}, {event.venue.city}</p>
          {event.zones.map((zone) => (
            <div className="zone-block" key={zone.id}>
              <h3>{zone.name} <span className="zone-tag">{zone.priceTier}</span></h3>
              {(ticketTypesByZone[zone.id] ?? []).length === 0 && <p className="apply-sub">No tickets on sale for this zone yet.</p>}
              {(ticketTypesByZone[zone.id] ?? []).map((tt) => {
                const remaining = tt.allocation?.remaining ?? 0;
                return (
                  <div className="ticket-type-row" key={tt.id}>
                    <div>
                      <p className="tt-name">{tt.name}</p>
                      <p className="tt-price">{formatMoney(tt.priceMinorUnits, tt.currency)} · {remaining > 0 ? `${remaining} left` : 'Sold out'}</p>
                    </div>
                    <button
                      className="submit-btn"
                      disabled={remaining <= 0 || busyZoneId === zone.id}
                      onClick={() => handleAddToCart(tt)}
                    >
                      {busyZoneId === zone.id ? 'Adding…' : 'Add to cart'}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}

      {cartError && <p className="saved-banner error">{cartError}</p>}

      {cart && cart.items.length > 0 && (
        <div className="cart-panel">
          <h2>Your cart</h2>
          {cart.items.map((item) => {
            const info = ticketTypeLookup.get(item.ticketTypeId);
            return (
              <div className="cart-line" key={item.id}>
                <span>{item.quantity} × {info?.ticketType.name ?? 'Ticket'}</span>
                <span>{formatMoney(item.unitPriceMinorUnits * item.quantity, info?.ticketType.currency ?? 'EUR')}</span>
                <button type="button" className="link-btn" onClick={() => handleRemoveItem(item.id)}>Remove</button>
              </div>
            );
          })}
          <p>Subtotal: {formatMoney(cart.subtotalMinorUnits, 'EUR')}</p>
          <p>Fees: {formatMoney(cart.feeMinorUnits, 'EUR')}</p>
          <p className="cart-total">Total: {formatMoney(cart.totalMinorUnits, 'EUR')}</p>
          <button className="submit-btn" onClick={() => setStep('checkout')}>Checkout</button>
        </div>
      )}
    </div>
    </>
  );
}
