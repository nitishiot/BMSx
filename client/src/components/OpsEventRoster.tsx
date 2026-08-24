import { useEffect, useState } from 'react';
import { getOpsAllEvents, type OpsRosterFestival } from '../api';

// PHASE_1_CT_INCREMENT_SPEC.md §2.1 — every festival and event on the
// platform, across all producers, gated on view_all_events. Read-only and
// aggregate: allocation and issued counts, never who bought what (§3 —
// purchaser identity on an internal console is a DPDP/GDPR purpose
// decision, not a capability flag added in passing).
//
// First pass rendered this as a ten-column table inside a horizontally
// scrolling container. That satisfied the letter of the wide-content rule
// in .claude/rules/design.md and still read as broken: a 1308px table in a
// 672px column showed six columns and hid the rest behind a scrollbar with
// no visual cue, in a bare grid unlike the card language used everywhere
// else. Rebuilt as nested cards that actually fit the 720px app column —
// festival → session → ticket type — so nothing scrolls sideways at all.
// Restructuring dense data to fit the column beats scrolling it.
function money(minorUnits: number, currency: string) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(minorUnits / 100);
}

function day(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

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
        acc.sessions += 1;
        for (const z of e.zones) {
          for (const t of z.ticketTypes) {
            acc.issued += t.ticketsIssued;
            acc.remaining += t.allocationRemaining ?? 0;
          }
        }
      }
      return acc;
    },
    { sessions: 0, issued: 0, remaining: 0 },
  );

  return (
    <section className="ops-widget">
      <h2>All events</h2>
      <p className="ops-note">
        Every producer on the platform, real data only — no invented figures.
      </p>

      <div className="roster-stats">
        {[
          ['Festivals', festivals.length],
          ['Sessions', totals.sessions],
          ['Tickets issued', totals.issued],
          ['Still allocated', totals.remaining],
        ].map(([label, value]) => (
          <div className="roster-stat" key={label as string}>
            <span className="roster-stat-value">{value}</span>
            <span className="roster-stat-label">{label}</span>
          </div>
        ))}
      </div>

      <ul className="roster-list">
        {festivals.map((f) => (
          <li className="roster-festival" key={f.id}>
            <header className="roster-festival-head">
              <div>
                <strong>{f.name}</strong>
                <span className="roster-dates">{day(f.startDate)} – {day(f.endDate)}</span>
              </div>
              <span className="roster-producer">{f.producer?.email ?? 'Producer unknown'}</span>
            </header>

            {f.events.length === 0 ? (
              <p className="roster-empty">No sessions set up yet.</p>
            ) : (
              f.events.map((e) => (
                <div className="roster-session" key={e.id}>
                  <div className="roster-session-head">
                    <span className="roster-session-name">{e.name}</span>
                    <span className="roster-session-meta">
                      {day(e.startsAt)} · {e.venue.name}, {e.venue.city} ({e.venue.country})
                    </span>
                  </div>
                  {e.zones.length === 0 ? (
                    <p className="roster-empty">No zones yet.</p>
                  ) : (
                    e.zones.map((z) => (
                      <div className="roster-zone" key={z.id}>
                        <span className="roster-zone-name">
                          {z.name} <span className="roster-tier">{z.priceTier}</span>
                        </span>
                        {z.ticketTypes.length === 0 ? (
                          <p className="roster-empty">Nothing on sale.</p>
                        ) : (
                          <ul className="roster-types">
                            {z.ticketTypes.map((t) => (
                              <li key={t.id}>
                                <span className="roster-type-name">{t.name}</span>
                                <span className="roster-type-price">{money(t.priceMinorUnits, t.currency)}</span>
                                <span className="roster-type-counts">
                                  <span className="roster-issued">{t.ticketsIssued} issued</span>
                                  <span className="roster-remaining">
                                    {t.allocationRemaining ?? '—'} of {t.allocationTotal ?? '—'} left
                                  </span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ))
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
