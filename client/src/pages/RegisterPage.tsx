import { useState, type FormEvent } from 'react';
import { register } from '../api';
import { AutoAppNav } from '../components/AppNav';
import './AuthPage.css';

// Self-service registration creates a *fan* account — the only persona
// that signs itself up. Producers still apply and get approved by a
// Platform Admin (J7); staff and admin accounts are seeded. An account
// created earlier by a survey submission has no password yet; registering
// with that same email claims it rather than failing (server/src/routes/
// auth.ts's /register).
export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      await register(email, name, password);
      window.location.href = '/account';
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setError(
        message.includes('already exists')
          ? 'An account with that email already exists. Sign in instead.'
          : 'Could not create your account. Please check your details and try again.',
      );
      setBusy(false);
    }
  }

  return (
    <>
      <AutoAppNav />
      <div className="auth-page">
        <p className="eyebrow">Join TAG</p>
        <h1>Create your account.</h1>
        <p className="auth-sub">
          One account for tickets, stays, and everything else. Already took the fan survey with this
          email? Registering here claims that same account.
        </p>
        {error && <p className="saved-banner error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="reg-name">Your name</label>
            <input id="reg-name" type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="reg-email">Email</label>
            <input id="reg-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="reg-password">Password</label>
            <input id="reg-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="field-hint">At least 8 characters.</p>
          </div>
          <button type="submit" className="submit-btn" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        </form>
        <p className="auth-alt">
          Already have an account? <a href="/login">Sign in</a>.
        </p>
      </div>
    </>
  );
}
