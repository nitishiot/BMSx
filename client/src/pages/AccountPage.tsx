import { useEffect, useState } from 'react';
import { getMyAccount, resendVerification, verifyEmail, type FanAccount, type SurveyResponseRecord } from '../api';
import { QUESTIONS } from './SurveyPage';
import { FanNav } from '../components/FanNav';
import './AccountPage.css';

// LP-14 End User page. States: no account (never took the survey) ->
// pending verification (default right after signup) -> verified.
export function AccountPage() {
  const [checked, setChecked] = useState(false);
  const [account, setAccount] = useState<FanAccount | null>(null);
  const [surveyResponse, setSurveyResponse] = useState<SurveyResponseRecord | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  async function load() {
    const result = await getMyAccount();
    setAccount(result?.account ?? null);
    setSurveyResponse(result?.surveyResponse ?? null);
    setChecked(true);
  }

  useEffect(() => {
    load();
  }, []);

  // Dev/demo-only shortcut (PHASE_1_CT_SPEC.md LP-14 flags this explicitly):
  // there's no real inbox to click a link in, so this requests a fresh
  // token and immediately redeems it, standing in for "the fan clicked
  // the email link."
  async function handleDemoVerify() {
    setVerifying(true);
    setVerifyError(null);
    try {
      const token = await resendVerification();
      if (!token) throw new Error('No verification token returned');
      await verifyEmail(token);
      await load();
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  }

  if (!checked) return null;

  if (!account) {
    return (
      <>
        <FanNav currentKey="account" />
        <div className="account-page">
          <h1>No account found</h1>
          <p className="apply-sub">Take the fan survey to create one.</p>
          <a className="link-btn" href="/survey">Go to the survey</a>
        </div>
      </>
    );
  }

  return (
    <>
      <FanNav currentKey="account" />
      <div className="account-page">
      <p className="eyebrow">Your account</p>
      <h1>{account.email}</h1>

      {!account.emailVerifiedAt ? (
        <div className="verify-banner">
          <p><strong>Email verification pending.</strong> We've "sent" a verification link — check the
          server log for it (no real email provider is connected in Phase 1, see spec §8).</p>
          <button className="submit-btn" onClick={handleDemoVerify} disabled={verifying}>
            {verifying ? 'Verifying…' : 'Dev demo: verify now'}
          </button>
          {verifyError && <p className="saved-banner error">{verifyError}</p>}
        </div>
      ) : (
        <p className="verified-banner">Email verified.</p>
      )}

      {surveyResponse && (
        <div className="survey-recap">
          <h2>Your survey answers</h2>
          {QUESTIONS.map((q) => (
            <div className="recap-row" key={q.key}>
              <span className="recap-label">{q.label}</span>
              <span className="recap-value">{surveyResponse.answers[q.key] ?? '—'}</span>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
