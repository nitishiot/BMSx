import { useEffect, useState } from 'react';
import { Apply } from './pages/Apply';
import { EventSetup } from './pages/EventSetup';
import { AdminConsole } from './pages/AdminConsole';
import { AuditLog } from './components/AuditLog';
import { RoadmapTeaser } from './components/RoadmapTeaser';
import { PRODUCER_FEATURE_MANIFEST } from './featureManifest';
import { getMyApplication, getProducerToken, resetProducerSession } from './api';
import './theme.css';
import './App.css';

function ProducerApp() {
  const [approved, setApproved] = useState(false);
  const [suspended, setSuspended] = useState(false);
  const [checked, setChecked] = useState(!getProducerToken());
  const [auditVersion, setAuditVersion] = useState(0);

  useEffect(() => {
    if (!getProducerToken()) return;
    getMyApplication()
      .then((res) => {
        setApproved(res?.application?.status === 'approved' && res.roles.includes('producer'));
        setSuspended(res?.suspended ?? false);
      })
      .finally(() => setChecked(true));
  }, []);

  function handleApproved() {
    setApproved(true);
    setAuditVersion((v) => v + 1);
  }

  function handleReset() {
    resetProducerSession();
    window.location.reload();
  }

  if (!checked) return null;

  return (
    <div>
      <nav className="shell-nav">
        <a className="shell-logo" href="/">TAG<span>.</span></a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.9rem' }}>
          <span className="shell-tag">Producer Portal</span>
          <button className="reset-link" onClick={handleReset}>Reset demo state</button>
        </div>
      </nav>

      {suspended ? (
        <div className="event-setup">
          <p className="eyebrow">Producer Application</p>
          <h1>Access suspended.</h1>
          <p className="apply-sub">
            A Platform Admin has suspended your producer access. Your
            existing festival and event data is unchanged, but you can't
            create or edit anything until it's reinstated. Contact TAG
            support if you believe this is a mistake.
          </p>
        </div>
      ) : approved ? (
        <EventSetup />
      ) : (
        <Apply onApproved={handleApproved} />
      )}

      <AuditLog key={auditVersion} />

      <RoadmapTeaser features={PRODUCER_FEATURE_MANIFEST} />
    </div>
  );
}

export default function App() {
  const isAdmin = window.location.pathname.startsWith('/admin');
  return isAdmin ? <AdminConsole /> : <ProducerApp />;
}
