import { useEffect, useState, type FormEvent } from 'react';
import { createFestival, getMyFestivals, type Festival } from '../api';
import '../pages/Apply.css';
import './EventSetup.css';

const EMPTY = { name: '', startDate: '', endDate: '', venue: '', description: '' };

export function EventSetup() {
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState<Festival | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getMyFestivals()
      .then((festivals) => setSaved(festivals[0] ?? null))
      .catch(() => {});
  }, []);

  function update<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
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

  return (
    <div className="event-setup">
      <p className="eyebrow">Free-Tier Event Setup</p>
      <h1>Set up your event.</h1>
      <p className="apply-sub">
        Customer booking, event setup, live sales dashboard — free-tier scope
        per J5. Inventory/seat-map/ticket-type configuration is a later
        backend slice (spec §2, Event &amp; Catalogue).
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
    </div>
  );
}
