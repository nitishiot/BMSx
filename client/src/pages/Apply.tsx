import { useEffect, useState, type FormEvent } from 'react';
import { getMyApplication, submitApplication, type ApplicationStatus, type ProducerApplication } from '../api';
import './Apply.css';

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
};

interface ApplyProps {
  onApproved: () => void;
}

export function Apply({ onApproved }: ApplyProps) {
  const [application, setApplication] = useState<ProducerApplication | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [producerName, setProducerName] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [email, setEmail] = useState('');
  const [festivalName, setFestivalName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getMyApplication()
      .then((res) => {
        if (res?.application) setApplication(res.application);
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (application?.status === 'approved') onApproved();
  }, [application, onApproved]);

  // While pending, poll the real backend for the Platform Admin's decision
  // — approval now happens in the separate /admin console, not in this app.
  useEffect(() => {
    if (application?.status !== 'pending') return;
    const interval = setInterval(() => {
      getMyApplication().then((res) => {
        if (res?.application) setApplication(res.application);
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [application]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const app = await submitApplication({ producerName, organisation, email, festivalName });
      setApplication(app);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit application');
    } finally {
      setSubmitting(false);
    }
  }

  if (!loaded) return null;

  if (application) {
    return (
      <div className="apply">
        <p className="eyebrow">Producer Application</p>
        <h1>{application.festivalName}</h1>
        <div className="status-card">
          <span className={`status-pill ${application.status}`}>{STATUS_LABEL[application.status]}</span>
          <p style={{ color: 'var(--muted)', fontSize: '.875rem' }}>
            Submitted by {application.producerName} ({application.organisation}) on{' '}
            {new Date(application.submittedAt).toLocaleDateString()}.
          </p>

          {application.status === 'pending' && (
            <p className="sim-note">
              Waiting on Platform Admin review (PRD §5 P6, §7 J7). This page
              polls automatically — no action needed here.
            </p>
          )}

          {application.status === 'rejected' && (
            <p className="sim-note">
              Your application was rejected
              {application.decisionReason ? `: "${application.decisionReason}"` : '.'} Contact TAG support to
              reapply.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="apply">
      <p className="eyebrow">Producer Application</p>
      <h1>Bring your festival to TAG.</h1>
      <p className="apply-sub">
        Free-tier onboarding — customer booking, event setup, and a live sales
        dashboard. A Platform Admin reviews every application before you can
        create events (PR-1).
      </p>
      {error && <div className="saved-banner error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="producerName">Your name</label>
          <input id="producerName" required value={producerName} onChange={(e) => setProducerName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="organisation">Organisation</label>
          <input id="organisation" required value={organisation} onChange={(e) => setOrganisation(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="email">Contact email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="festivalName">Festival name</label>
          <input id="festivalName" required value={festivalName} onChange={(e) => setFestivalName(e.target.value)} />
        </div>
        <button className="submit-btn" type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit application'}
        </button>
      </form>
    </div>
  );
}
