import { useState } from 'react';
import { submitSurvey } from '../api';
import { FanNav } from '../components/FanNav';
import './SurveyPage.css';

// Question set sourced verbatim from the "Festival Fan Survey Proposal"
// doc (2026-08-24) — PHASE_1_CT_SPEC.md LP-14. The source listed the
// accommodation question twice under different rows; collapsed to one
// question here (flagged in the spec, not silently dropped).
type QuestionType = 'radio' | 'select' | 'text';

interface Question {
  key: string;
  label: string;
  type: QuestionType;
  options?: string[];
}

export const QUESTIONS: Question[] = [
  { key: 'origin', label: 'Are you domestic or international?', type: 'radio', options: ['Domestic', 'International'] },
  {
    key: 'accommodation',
    label: 'What type of accommodation did you book for your stay?',
    type: 'select',
    options: ['Hotel', 'Airbnb', 'Hostel', 'Staying with friends/family', 'Other'],
  },
  {
    key: 'transportToCity',
    label: "What mode of transportation did you use to arrive in the festival's city?",
    type: 'select',
    options: ['Flew', 'Train', 'Drove', 'Bus', 'Other'],
  },
  {
    key: 'transportToVenue',
    label: 'What mode of transportation did you use to arrive at the festival itself?',
    type: 'select',
    options: ['Rental car', 'Public transport', 'Rideshare/taxi', 'Walked', 'Shuttle', 'Other'],
  },
  {
    key: 'howHeard',
    label: 'How did you hear about us?',
    type: 'select',
    options: ['Social media (Facebook, Instagram)', 'Friends', 'Local businesses', 'Search engine', 'Other'],
  },
  {
    key: 'festivalsPerYear',
    label: 'How many festivals do you attend per year?',
    type: 'select',
    options: ['1', '2-3', '4-6', '7+'],
  },
  { key: 'cateredExperience', label: 'How would you feel if we catered to your entire festival experience?', type: 'text' },
  { key: 'oneAppPreference', label: 'Would you prefer booking everything through one app, or separately?', type: 'radio', options: ['One app', 'Separately', 'No preference'] },
  { key: 'rewardsMotivate', label: 'Would a rewards system motivate you to stick to one app?', type: 'radio', options: ['Yes', 'No', 'Maybe'] },
  { key: 'rewardsType', label: 'Would you prefer rewards as discounts, or opportunities to meet backstage with artists?', type: 'radio', options: ['Discounts', 'Backstage meet-ups', 'Both', 'Neither'] },
  { key: 'fanSocialPlatform', label: 'Would you use a social media platform exclusively for connecting with other fans?', type: 'radio', options: ['Yes', 'No', 'Maybe'] },
  { key: 'recommendationsEase', label: 'Was it easy to find recommendations on things to do outside the festival?', type: 'radio', options: ['Yes', 'No', 'Somewhat', "Didn't look"] },
];

export function SurveyPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set only after a failed submit attempt, so unanswered questions are
  // never highlighted before the fan has actually tried to submit.
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  function setAnswer(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  const missingKeys = QUESTIONS.filter((q) => !answers[q.key]).map((q) => q.key);
  const missingCount = missingKeys.length + (name ? 0 : 1) + (email ? 0 : 1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (missingCount > 0) {
      setAttemptedSubmit(true);
      setError(`Please answer the ${missingCount} highlighted question${missingCount > 1 ? 's' : ''} below.`);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await submitSurvey(email, name, answers);
      window.location.href = '/account';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit the survey. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <>
      <FanNav currentKey="survey" />
      <div className="survey-page">
      <p className="eyebrow">Help us build TAG</p>
      <h1>A 2-minute festival fan survey</h1>
      <p className="apply-sub">
        Your answers shape what we build next. Submitting creates a TAG account under the
        email you give us — you'll need to verify it before it's fully active.
      </p>

      <form onSubmit={handleSubmit}>
        {QUESTIONS.map((q) => (
          <div className={`survey-question${attemptedSubmit && !answers[q.key] ? ' unanswered' : ''}`} key={q.key}>
            <label>{q.label}</label>
            {q.type === 'text' && (
              <textarea value={answers[q.key] ?? ''} onChange={(e) => setAnswer(q.key, e.target.value)} rows={2} />
            )}
            {q.type === 'select' && (
              <select value={answers[q.key] ?? ''} onChange={(e) => setAnswer(q.key, e.target.value)}>
                <option value="" disabled>Choose one…</option>
                {q.options!.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
            {q.type === 'radio' && (
              <div className="survey-radio-group">
                {q.options!.map((opt) => (
                  <label key={opt} className="survey-radio-option">
                    <input
                      type="radio"
                      name={q.key}
                      value={opt}
                      checked={answers[q.key] === opt}
                      onChange={() => setAnswer(q.key, opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className={`survey-question${attemptedSubmit && !name ? ' unanswered' : ''}`}>
          <label>Your name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
        </div>

        <div className={`survey-question${attemptedSubmit && !email ? ' unanswered' : ''}`}>
          <label>Your email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>

        {error && <p className="saved-banner error">{error}</p>}
        <button type="submit" className="submit-btn" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit survey'}</button>
      </form>
      </div>
    </>
  );
}
