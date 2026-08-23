import { useState, type FormEvent } from 'react';
import { getEvent, saveEvent, type EventDetails } from '../producerState';
import '../pages/Apply.css';
import './EventSetup.css';

const EMPTY: EventDetails = { festivalName: '', startDate: '', endDate: '', venue: '', description: '' };

export function EventSetup() {
  const existing = getEvent();
  const [form, setForm] = useState<EventDetails>(existing ?? EMPTY);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof EventDetails>(key: K, value: EventDetails[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    saveEvent(form);
    setSaved(true);
  }

  return (
    <div className="event-setup">
      <p className="eyebrow">Free-Tier Event Setup</p>
      <h1>Set up your event.</h1>
      <p className="apply-sub">
        Customer booking, event setup, live sales dashboard — free-tier scope
        per J5. Inventory/seat-map/ticket-type configuration is a later
        backend slice (spec §2, Event &amp; Catalogue).
      </p>

      {saved && <div className="saved-banner">Event details saved.</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="fname">Festival name</label>
          <input id="fname" required value={form.festivalName} onChange={(e) => update('festivalName', e.target.value)} />
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
        <button className="submit-btn" type="submit">Save event</button>
      </form>
    </div>
  );
}
