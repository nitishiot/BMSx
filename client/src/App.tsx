import { useEffect, useState } from 'react';
import { Apply } from './pages/Apply';
import { EventSetup } from './pages/EventSetup';
import { AdminConsole } from './pages/AdminConsole';
import { FestivalPage } from './pages/FestivalPage';
import { SurveyPage } from './pages/SurveyPage';
import { AccountPage } from './pages/AccountPage';
import { InternalOpsConsole } from './pages/InternalOpsConsole';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AuditLog } from './components/AuditLog';
import { RoadmapTeaser } from './components/RoadmapTeaser';
import { AutoAppNav } from './components/AppNav';
import { PRODUCER_FEATURE_MANIFEST } from './featureManifest';
import { getMyApplication, getProducerToken } from './api';
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


  if (!checked) return null;

  return (
    <div>
      <AutoAppNav />

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
  const path = window.location.pathname;
  const festivalMatch = path.match(/^\/festival\/([^/]+)/);
  if (festivalMatch) return <FestivalPage festivalId={festivalMatch[1]} />;
  if (path.startsWith('/survey')) return <SurveyPage />;
  if (path.startsWith('/account')) return <AccountPage />;
  if (path.startsWith('/ops')) return <InternalOpsConsole />;
  if (path.startsWith('/login')) return <LoginPage />;
  if (path.startsWith('/register')) return <RegisterPage />;
  if (path.startsWith('/admin')) return <AdminConsole />;
  // Producer portal moved off "/" (2026-08-24) — "/" is now the marketing
  // landing page, served from this same origin by vite.config.ts's
  // landingAtRoot plugin so the two share one session store.
  return <ProducerApp />;
}
