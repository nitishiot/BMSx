import { useState, type FormEvent } from 'react';
import { getSession, login } from '../api';
import { AutoAppNav } from '../components/AppNav';
import './AuthPage.css';

// One sign-in page for every persona (PHASE_1_IO_INCREMENT_SPEC.md §4/§5,
// revised 2026-08-24). A fan, a producer, a Platform Admin and Internal
// Ops staff all sign in here with the same form; RBAC decides where they
// can go afterwards, which is what `?next=` and the Portals menu use.
export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      // Honour ?next= so a redirect into sign-in returns you where you were.
      const next = new URLSearchParams(window.location.search).get('next');
      if (next && next.startsWith('/')) {
        window.location.href = next;
        return;
      }
      // Otherwise land on the surface this persona actually belongs on:
      // Internal Ops staff go straight to /ops, a Platform Admin to
      // /admin, a fan to /account. The destination is resolved by the
      // server (`homeHref` from GET /auth/me) alongside the portals list,
      // never guessed from roles here.
      const session = await getSession();
      window.location.href = session?.homeHref ?? '/account';
    } catch {
      // The API deliberately returns one generic message for every failure
      // mode so a login attempt can't be used to discover which emails
      // exist — surfaced verbatim rather than guessing at a reason.
      setError('Invalid email or password.');
      setBusy(false);
    }
  }

  return (
    <>
      <AutoAppNav />
      <div className="auth-page">
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in.</h1>
        <p className="auth-sub">
          One account for everything on TAG — tickets, your producer application, and staff tools.
          What you can reach after signing in depends on your role.
        </p>
        {error && <p className="saved-banner error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input id="login-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input id="login-password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="submit-btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="auth-alt">
          No account yet? <a href="/register">Create one</a>.
        </p>
      </div>
    </>
  );
}
