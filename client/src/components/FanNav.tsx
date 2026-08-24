import { useEffect, useState } from 'react';
import { getMyAccount, resetFanSession } from '../api';

// Shared top nav for the three Fan Web surfaces (Survey/Account/Festival
// pages) — shows "Signed in as {name}" top-right once a fan session
// exists (set right after a survey submission), matching the
// Producer-portal/Admin-console pattern of a persistent identity chip.
// Reuses .shell-nav/.shell-logo/.shell-tag/.reset-link from App.css,
// already loaded globally.
export function FanNav() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    getMyAccount().then((res) => setName(res?.account.name ?? null));
  }, []);

  return (
    <nav className="shell-nav">
      <a className="shell-logo" href="/">TAG<span>.</span></a>
      {name && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '.9rem' }}>
          <span className="shell-tag">Signed in as {name}</span>
          <button className="reset-link" onClick={() => { resetFanSession(); window.location.reload(); }}>Sign out</button>
        </div>
      )}
    </nav>
  );
}
