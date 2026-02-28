import { useState, type FormEvent } from 'react';
import { useAuthStore } from '../../stores/authStore';
import styles from './SignUpForm.module.css';

export function SignUpForm() {
  const signUp = useAuthStore((s) => s.signUp);
  const setAuthStep = useAuthStore((s) => s.setAuthStep);

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email address.');
      return;
    }

    /* Basic email sanity check */
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    setBusy(true);
    const { error: authErr } = await signUp(trimmed);
    setBusy(false);

    if (authErr) {
      if (authErr.message.includes('rate limit')) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError(authErr.message);
      }
    }
    /* On success, the store navigates to the OTP step automatically */
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <p className={styles.heading}>Create Account</p>
      <p className={styles.desc}>
        Enter your email and we'll send a verification code.
      </p>

      {/* ---- Email -------------------------------------------------- */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="signup-email">
          Email
        </label>
        <input
          id="signup-email"
          className={styles.input}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
          autoFocus
        />
      </div>

      {/* ---- Error -------------------------------------------------- */}
      {error && <p className={styles.error}>{error}</p>}

      {/* ---- Submit ------------------------------------------------- */}
      <button type="submit" className={styles.btn} disabled={busy}>
        {busy ? 'Sending code\u2026' : 'Send Verification Code'}
      </button>

      {/* ---- Back link ---------------------------------------------- */}
      <p className={styles.footer}>
        Already have an account?{' '}
        <button
          type="button"
          className={styles.link}
          onClick={() => setAuthStep('signin')}
        >
          Sign In
        </button>
      </p>
    </form>
  );
}
