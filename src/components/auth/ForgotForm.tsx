import { useState, type FormEvent } from 'react';
import { useAuthStore } from '../../stores/authStore';
import styles from './ForgotForm.module.css';

export function ForgotForm() {
  const forgotPassword = useAuthStore((s) => s.forgotPassword);
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
    const { error: authErr } = await forgotPassword(trimmed);
    setBusy(false);

    if (authErr) {
      if (authErr.message.includes('rate')) {
        setError('Too many requests. Please wait a moment and try again.');
      } else if (authErr.message.includes('not found') || authErr.message.includes('no user')) {
        setError('No account found with that email address.');
      } else {
        setError(authErr.message);
      }
    }
    /* On success the store navigates to the forgot-otp step automatically */
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <p className={styles.heading}>Reset Password</p>
      <p className={styles.desc}>
        Enter your email to receive a verification code.
      </p>

      {/* ---- Email -------------------------------------------------- */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="forgot-email">
          Email
        </label>
        <input
          id="forgot-email"
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
        {busy ? 'Sending code\u2026' : 'Send Reset Code'}
      </button>

      {/* ---- Back link ---------------------------------------------- */}
      <p className={styles.footer}>
        <button
          type="button"
          className={styles.link}
          onClick={() => setAuthStep('signin')}
          disabled={busy}
        >
          &larr; Back to Sign In
        </button>
      </p>
    </form>
  );
}
