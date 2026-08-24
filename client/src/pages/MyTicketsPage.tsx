import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { getMyTickets, getSession, type MyTicketOrder, type SessionView } from '../api';
import { AppNav } from '../components/AppNav';
import './MyTicketsPage.css';

// PHASE_1_CT_INCREMENT_SPEC.md §2.2 — every event this person holds
// tickets for, with each ticket's QR re-rendered from its token. The
// confirmation screen used to be the only place a QR ever appeared;
// closing that tab lost it. The token itself is the ticket (Ticket.qrCode
// is unique) — the image is generated client-side with the same `qrcode`
// package FestivalPage uses, so nothing needs to be stored or emailed
// (object storage is still an open decision, PHASE_1_CT_SPEC.md §8).
function formatMoney(minorUnits: number, currency: string) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(minorUnits / 100);
}

function formatWhen(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function MyTicketsPage() {
  const [session, setSession] = useState<SessionView | null>(null);
  const [checked, setChecked] = useState(false);
  const [orders, setOrders] = useState<MyTicketOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    getSession()
      .then((s) => {
        setSession(s);
        if (s) {
          return getMyTickets()
            .then(setOrders)
            .catch((err) => setError(err instanceof Error ? err.message : 'Could not load your tickets'));
        }
        return undefined;
      })
      .finally(() => setChecked(true));
  }, []);

  useEffect(() => {
    if (!orders) return;
    let cancelled = false;
    const tickets = orders.flatMap((o) => o.tickets);
    Promise.all(
      tickets.map(async (t) => [t.id, await QRCode.toDataURL(t.qrCode, { margin: 1, width: 180 })] as const),
    ).then((entries) => {
      if (!cancelled) setQrDataUrls(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [orders]);

  if (!checked) return <AppNav session={null} />;

  // Told plainly and pointed at the one shared sign-in page, rather than
  // this surface growing a login form of its own (.claude/rules/design.md).
  if (!session) {
    return (
      <>
        <AppNav session={null} />
        <div className="my-tickets">
          <p className="eyebrow">My tickets</p>
          <h1>Sign in to see your tickets.</h1>
          <p className="apply-sub">
            Your tickets are tied to your account. Sign in and they'll be here, QR codes and all.
          </p>
          <a className="submit-btn" href="/login?next=/tickets">Go to sign in</a>
        </div>
      </>
    );
  }

  return (
    <>
      <AppNav session={session} />
      <div className="my-tickets">
        <p className="eyebrow">My tickets</p>
        <h1>Your tickets.</h1>
        {error && <p className="saved-banner error">{error}</p>}

        {orders && orders.length === 0 && (
          <>
            <p className="apply-sub">
              Nothing here yet. Once you buy a ticket it shows up on this page — QR code included,
              so you never have to hunt for a confirmation screen again.
            </p>
            <a className="submit-btn" href="/#search">Browse festivals</a>
          </>
        )}

        {orders?.map((order) => (
          <section className="ticket-order" key={order.id}>
            <header className="ticket-order-head">
              <span>Ordered {formatWhen(order.createdAt)}</span>
              <span>{formatMoney(order.totalMinorUnits, order.currency)}</span>
            </header>
            <div className="ticket-grid">
              {order.tickets.map((t) => (
                <article className="ticket-card" key={t.id}>
                  <p className="ticket-festival">{t.festivalName ?? 'Festival'}</p>
                  <p className="ticket-event">{t.eventName ?? ''}</p>
                  {t.venue && (
                    <p className="ticket-venue">
                      {t.venue.name} — {t.venue.city}, {t.venue.country}
                    </p>
                  )}
                  {t.startsAt && <p className="ticket-when">{formatWhen(t.startsAt)}</p>}
                  <p className="ticket-zone">
                    {t.zoneName ? `${t.zoneName} — ` : ''}
                    {t.ticketTypeName}
                  </p>
                  {qrDataUrls[t.id] ? (
                    <img className="ticket-qr-image" src={qrDataUrls[t.id]} alt={`Scannable QR ticket ${t.qrCode}`} />
                  ) : (
                    <p className="ticket-qr-note">Generating QR code…</p>
                  )}
                  <p className="ticket-qr">{t.qrCode}</p>
                  {t.festivalId && (
                    <a className="ticket-link" href={`/festival/${t.festivalId}`}>Festival page</a>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
