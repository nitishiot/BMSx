import { useState } from 'react';
import { Apply } from './pages/Apply';
import { EventSetup } from './pages/EventSetup';
import { AuditLog } from './components/AuditLog';
import { RoadmapTeaser } from './components/RoadmapTeaser';
import { PRODUCER_FEATURE_MANIFEST } from './featureManifest';
import { getStatus, resetAll } from './producerState';
import './theme.css';
import './App.css';

export default function App() {
  const [approved, setApproved] = useState(getStatus() === 'approved');
  const [auditVersion, setAuditVersion] = useState(0);
  const bumpAudit = () => setAuditVersion((v) => v + 1);

  function handleReset() {
    resetAll();
    setApproved(false);
    window.location.reload();
  }

  return (
    <div>
      <nav className="shell-nav">
        <a className="shell-logo" href="/">TAG<span>.</span></a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.9rem' }}>
          <span className="shell-tag">Producer Portal</span>
          <button className="reset-link" onClick={handleReset}>Reset demo state</button>
        </div>
      </nav>

      {approved ? (
        <EventSetup />
      ) : (
        <Apply
          onApproved={() => {
            setApproved(true);
            bumpAudit();
          }}
          onAuditChange={bumpAudit}
        />
      )}

      <AuditLog key={auditVersion} />

      <RoadmapTeaser features={PRODUCER_FEATURE_MANIFEST} />
    </div>
  );
}
