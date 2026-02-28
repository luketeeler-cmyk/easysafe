import { useState, type FormEvent } from 'react';
import { useAuthStore } from '../../stores/authStore';
import styles from './SignInForm.module.css';

export function SignInForm() {
  const signIn = useAuthStore((s) => s.signIn);
  const setAuthStep = useAuthStore((s) => s.setAuthStep);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setBusy(true);
    const { error: authErr } = await signIn(email.trim(), password);
    setBusy(false);

    if (authErr) {
      /* Map common Supabase error codes to friendlier messages */
      if (authErr.message.includes('Invalid login credentials')) {
        setError('Incorrect email or password.');
      } else if (authErr.message.includes('Email not confirmed')) {
        setError('Please verify your email before signing in.');
      } else {
        setError(authErr.message);
      }
    }
    /* On success the session updates via onAuthStateChange */
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {/* ---- Email -------------------------------------------------- */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="signin-email">
          Email
        </label>
        <input
          id="signin-email"
          className={styles.input}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
        />
      </div>

      {/* ---- Password ----------------------------------------------- */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="signin-password">
          Password
        </label>
        <input
          id="signin-password"
          className={styles.input}
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
        />
      </div>

      {/* ---- Error -------------------------------------------------- */}
      {error && <p className={styles.error}>{error}</p>}

      {/* ---- Submit ------------------------------------------------- */}
      <button
        type="submit"
        className={styles.btn}
        disabled={busy}
      >
        {busy ? 'Signing in\u2026' : 'Sign In'}
      </button>

      {/* ---- Links -------------------------------------------------- */}
      <div className={styles.links}>
        <button
          type="button"
          className={styles.link}
          onClick={() => setAuthStep('signup-email')}
        >
          Create Account
        </button>
        <button
          type="button"
          className={styles.link}
          onClick={() => setAuthStep('forgot-email')}
        >
          Forgot Password?
        </button>
      </div>
    </form>
  );
}
