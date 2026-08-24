import { useEffect, useState, type FormEvent } from 'react';
import {
  createFestival,
  createVenue,
  createEvent,
  createZone,
  getMyFestivals,
  getMyEvents,
  type Festival,
  type CatalogueEvent,
} from '../api';
import '../pages/Apply.css';
import './EventSetup.css';

const EMPTY = { name: '', startDate: '', endDate: '', venue: '', description: '' };

const EMPTY_SESSION = {
  venueName: '',
  venueCity: '',
  venueCountry: '',
  venueCapacity: '',
  eventName: '',
  startsAt: '',
  endsAt: '',
  zoneName: 'GA',
  zoneCapacity: '',
  priceTier: 'standard',
};

export function EventSetup() {
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState<Festival | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [events, setEvents] = useState<CatalogueEvent[]>([]);
  const [sessionForm, setSessionForm] = useState(EMPTY_SESSION);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionSubmitting, setSessionSubmitting] = useState(false);

  useEffect(() => {
    getMyFestivals()
      .then((festivals) => setSaved(festivals[0] ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!saved) return;
    getMyEvents(saved.id)
      .then(setEvents)
      .catch(() => {});
  }, [saved]);

  function update<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateSession<K extends keyof typeof EMPTY_SESSION>(key: K, value: string) {
    setSessionForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const festival = await createFestival(form);
      setSaved(festival);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save event');
    } finally {
      setSubmitting(false);
    }
  }

  // Event & Catalogue sub-slice: venue → event → zone in one submit, since
  // Phase 1 has no separate venue-management screen yet (spec §2 — read
  // path only, producer-entered).
  async function handleAddSession(e: FormEvent) {
    e.preventDefault();
    if (!saved) return;
    setSessionSubmitting(true);
    setSessionError(null);
    try {
      const venue = await createVenue({
        name: sessionForm.venueName,
        city: sessionForm.venueCity,
        country: sessionForm.venueCountry,
        capacity: Number(sessionForm.venueCapacity),
      });
      const event = await createEvent(saved.id, {
        venueId: venue.id,
        name: sessionForm.eventName,
        startsAt: sessionForm.startsAt,
        endsAt: sessionForm.endsAt,
      });
      await createZone(event.id, {
        name: sessionForm.zoneName,
        capacity: Number(sessionForm.zoneCapacity),
        priceTier: sessionForm.priceTier,
      });
      setEvents(await getMyEvents(saved.id));
      setSessionForm(EMPTY_SESSION);
    } catch (err) {
      setSessionError(err instanceof Error ? err.message : 'Could not save session');
    } finally {
      setSessionSubmitting(false);
    }
  }

  return (
    <div className="event-setup">
      <p className="eyebrow">Free-Tier Event Setup</p>
      <h1>Set up your event.</h1>
      <p className="apply-sub">
        Customer booking, event setup, live sales dashboard — free-tier scope
        per J5. Ticket-type/inventory sale configuration is a later backend
        slice (Ticketing &amp; Inventory); Event &amp; Catalogue (venue,
        session, zone, artist lineup) is below.
      </p>

      {saved && (
        <div className="saved-banner">
          Event saved: {saved.name} ({new Date(saved.startDate).toLocaleDateString()}–
          {new Date(saved.endDate).toLocaleDateString()}) at {saved.venue}.
        </div>
      )}
      {error && <div className="saved-banner error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="fname">Festival name</label>
          <input id="fname" required value={form.name} onChange={(e) => update('name', e.target.value)} />
        </div>
        <div className="date-row">
          <div className="field">
            <label htmlFor="start">Start date</label>
            <input id="start" type="date" required value={form.startDate} onChange={(e) => update('startDate', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="end">End date</label>
            <input id="end" type="date" required value={form.endDate} onChange={(e) => update('endDate', e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="venue">Venue</label>
          <input id="venue" required value={form.venue} onChange={(e) => update('venue', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="desc">Description</label>
          <textarea id="desc" value={form.description} onChange={(e) => update('description', e.target.value)} />
        </div>
        <button className="submit-btn" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save event'}
        </button>
      </form>

      {saved && (
        <div className="catalogue-section">
          <h2>Sessions &amp; zones</h2>
          <p className="apply-sub">
            Add a dated session (Event &amp; Catalogue's "Event") with a
            venue and a ticketing zone — the read model Ticketing &amp;
            Inventory will sell against in a later slice.
          </p>

          {events.length > 0 && (
            <ul className="session-list">
              {events.map((ev) => (
                <li key={ev.id}>
                  <strong>{ev.name}</strong> at {ev.venue.name}, {ev.venue.city} —{' '}
                  {new Date(ev.startsAt).toLocaleString()} to {new Date(ev.endsAt).toLocaleString()}
                  {ev.zones.length > 0 && (
                    <span className="zone-tags">
                      {ev.zones.map((z) => (
                        <span className="zone-tag" key={z.id}>
                          {z.name} · {z.capacity} · {z.priceTier}
                        </span>
                      ))}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {sessionError && <div className="saved-banner error">{sessionError}</div>}

          <form onSubmit={handleAddSession}>
            <div className="date-row">
              <div className="field">
                <label htmlFor="vname">Venue name</label>
                <input id="vname" required value={sessionForm.venueName} onChange={(e) => updateSession('venueName', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="vcity">City</label>
                <input id="vcity" required value={sessionForm.venueCity} onChange={(e) => updateSession('venueCity', e.target.value)} />
              </div>
            </div>
            <div className="date-row">
              <div className="field">
                <label htmlFor="vcountry">Country</label>
                <input id="vcountry" required value={sessionForm.venueCountry} onChange={(e) => updateSession('venueCountry', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="vcap">Venue capacity</label>
                <input
                  id="vcap"
                  type="number"
                  min={1}
                  required
                  value={sessionForm.venueCapacity}
                  onChange={(e) => updateSession('venueCapacity', e.target.value)}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="ename">Session name</label>
              <input
                id="ename"
                required
                placeholder="Day 1 — Main Stage"
                value={sessionForm.eventName}
                onChange={(e) => updateSession('eventName', e.target.value)}
              />
            </div>
            <div className="date-row">
              <div className="field">
                <label htmlFor="estart">Starts</label>
                <input
                  id="estart"
                  type="datetime-local"
                  required
                  value={sessionForm.startsAt}
                  onChange={(e) => updateSession('startsAt', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="eend">Ends</label>
                <input
                  id="eend"
                  type="datetime-local"
                  required
                  value={sessionForm.endsAt}
                  onChange={(e) => updateSession('endsAt', e.target.value)}
                />
              </div>
            </div>
            <div className="date-row">
              <div className="field">
                <label htmlFor="zname">Zone name</label>
                <input id="zname" required value={sessionForm.zoneName} onChange={(e) => updateSession('zoneName', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="zcap">Zone capacity</label>
                <input
                  id="zcap"
                  type="number"
                  min={1}
                  required
                  value={sessionForm.zoneCapacity}
                  onChange={(e) => updateSession('zoneCapacity', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="ztier">Price tier</label>
                <input id="ztier" required value={sessionForm.priceTier} onChange={(e) => updateSession('priceTier', e.target.value)} />
              </div>
            </div>
            <button className="submit-btn" type="submit" disabled={sessionSubmitting}>
              {sessionSubmitting ? 'Saving…' : 'Add session'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
