import { useEffect, useState } from 'react';
import { getOpsAllEvents, type OpsRosterFestival } from '../api';

// PHASE_1_CT_INCREMENT_SPEC.md §2.1 — every festival and event on the
// platform, across all producers, gated on view_all_events. Read-only and
// aggregate: allocation and issued counts, never who bought what (§3 —
// purchaser identity on an internal console is a DPDP/GDPR purpose
// decision, not a capability flag added in passing).
//
// Lives in components/ rather than inside InternalOpsConsole.tsx for the
// same reason OrgTree does: the console file is already long, and this
// widget has its own data fetch and no shared state with the page.
export function OpsEventRoster() {
  const [festivals, setFestivals] = useState<OpsRosterFestival[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOpsAllEvents()
      .then(setFestivals)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load the event roster'));
  }, []);

  if (error) return <p className="ops-error">{error}</p>;
  if (!festivals) return <p className="ops-note">Loading events…</p>;

  const totals = festivals.reduce(
    (acc, f) => {
      for (const e of f.events) {
        acc.events += 1;
        for (const z of e.zones) {
          for (const t of z.ticketTypes) {
            acc.issued += t.ticketsIssued;
            acc.remaining += t.allocationRemaining ?? 0;
          }
        }
      }
      return acc;
    },
    { events: 0, issued: 0, remaining: 0 },
  );

  const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <section className="ops-widget">
      <h2>All events</h2>
      <p className="ops-note">
        {festivals.length} festivals · {totals.events} sessions · {totals.issued} tickets issued ·{' '}
        {totals.remaining} still allocated. Every producer, real data only.
      </p>
      {/* Wide content inside the 720px console column scrolls in its own
          container — the page itself never scrolls horizontally
          (.claude/rules/design.md). */}
      <div className="ops-table-scroll">
        <table className="ops-table">
          <thead>
            <tr>
              <th>Festival</th>
              <th>Producer</th>
              <th>Session</th>
              <th>When</th>
              <th>Venue</th>
              <th>Zone</th>
              <th>Ticket type</th>
              <th>Price</th>
              <th>Issued</th>
              <th>Left</th>
            </tr>
          </thead>
          <tbody>
            {festivals.map((f) => {
              const producer = f.producer?.email ?? '—';
              if (f.events.length === 0) {
                return (
                  <tr key={f.id}>
                    <td>{f.name}</td>
                    <td>{producer}</td>
                    <td colSpan={8} className="ops-muted">No sessions set up yet</td>
                  </tr>
                );
              }
              return f.events.flatMap((e) => {
                const head = [f.name, producer, e.name, day(e.startsAt), `${e.venue.name}, ${e.venue.city}`];
                if (e.zones.length === 0) {
                  return [
                    <tr key={e.id}>
                      {head.map((cell, i) => <td key={i}>{cell}</td>)}
                      <td colSpan={5} className="ops-muted">No zones yet</td>
                    </tr>,
                  ];
                }
                return e.zones.flatMap((z) => {
                  if (z.ticketTypes.length === 0) {
                    return [
                      <tr key={z.id}>
                        {head.map((cell, i) => <td key={i}>{cell}</td>)}
                        <td>{z.name}</td>
                        <td colSpan={4} className="ops-muted">Nothing on sale</td>
                      </tr>,
                    ];
                  }
                  return z.ticketTypes.map((t) => (
                    <tr key={t.id}>
                      {head.map((cell, i) => <td key={i}>{cell}</td>)}
                      <td>{z.name}</td>
                      <td>{t.name}</td>
                      <td>{(t.priceMinorUnits / 100).toFixed(2)} {t.currency}</td>
                      <td>{t.ticketsIssued}</td>
                      <td>{t.allocationRemaining ?? '—'}</td>
                    </tr>
                  ));
                });
              });
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
