import { useState, type FormEvent } from 'react';
import {
  getApplication,
  getStatus,
  simulateAdminDecision,
  submitApplication,
  type ApplicationStatus,
} from '../producerState';
import './Apply.css';

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  none: '',
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
};

interface ApplyProps {
  onApproved: () => void;
  onAuditChange: () => void;
}

export function Apply({ onApproved, onAuditChange }: ApplyProps) {
  const [status, setStatus] = useState<ApplicationStatus>(getStatus());
  const [producerName, setProducerName] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [email, setEmail] = useState('');
  const [festivalName, setFestivalName] = useState('');
  const application = getApplication();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submitApplication({ producerName, organisation, email, festivalName });
    setStatus('pending');
    onAuditChange();
  }

  function handleDecision(decision: 'approved' | 'rejected', reason: string) {
    simulateAdminDecision(decision, reason);
    setStatus(decision);
    onAuditChange();
    if (decision === 'approved') onApproved();
  }

  if (status !== 'none' && application) {
    return (
      <div className="apply">
        <p className="eyebrow">Producer Application</p>
        <h1>{application.festivalName}</h1>
        <div className="status-card">
          <span className={`status-pill ${status}`}>{STATUS_LABEL[status]}</span>
          <p style={{ color: 'var(--muted)', fontSize: '.875rem' }}>
            Submitted by {application.producerName} ({application.organisation}) on{' '}
            {new Date(application.submittedAt).toLocaleDateString()}.
          </p>

          {status === 'pending' && (
            <div className="admin-sim">
              <p className="sim-label">Admin simulation</p>
              <p className="sim-note">
                The real Platform Admin console (PRD §5 P6, §7 J7) isn't built
                yet — this is a stand-in so the application → approval → event
                -setup flow can be demonstrated end to end. Nothing here is
                real access control; the next backend slice replaces it.
              </p>
              <div className="actions">
                <button className="approve" onClick={() => handleDecision('approved', 'Meets vendor evidence bar (simulated)')}>
                  Approve (simulated)
                </button>
                <button className="reject" onClick={() => handleDecision('rejected', 'Incomplete evidence (simulated)')}>
                  Reject (simulated)
                </button>
              </div>
            </div>
          )}

          {status === 'approved' && (
            <div className="admin-sim">
              <p className="sim-label">Approved</p>
              <p className="sim-note">You can now set up your free-tier event.</p>
              <div className="actions">
                <button className="approve" onClick={onApproved}>Continue to event setup</button>
              </div>
            </div>
          )}

          {status === 'rejected' && (
            <p className="sim-note">
              Your application was rejected. Contact TAG support to reapply.
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
        <button className="submit-btn" type="submit">Submit application</button>
      </form>
    </div>
  );
}
