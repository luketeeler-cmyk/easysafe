import { useState, type FormEvent } from 'react';
import { useAuthStore } from '../../stores/authStore';
import styles from './SetPasswordForm.module.css';

interface SetPasswordFormProps {
  mode: 'create' | 'reset';
}

export function SetPasswordForm({ mode }: SetPasswordFormProps) {
  const setPassword = useAuthStore((s) => s.setPassword);

  const [password, setPasswordVal] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    /* ---- Client-side validation ----------------------------------- */
    if (!password || !confirm) {
      setError('Please fill in both password fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    /* ---- Submit ---------------------------------------------------- */
    setBusy(true);
    const { error: authErr } = await setPassword(password);
    setBusy(false);

    if (authErr) {
      if (authErr.message.includes('weak') || authErr.message.includes('short')) {
        setError('Password is too weak. Please choose a stronger password.');
      } else {
        setError(authErr.message);
      }
    }
    /* On success the store updates session and AuthGate renders the app */
  }

  const heading =
    mode === 'create' ? 'Create Your Password' : 'Reset Your Password';
  const buttonLabel =
    mode === 'create' ? 'Set Password' : 'Reset Password';

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <p className={styles.heading}>{heading}</p>

      {/* ---- Password ------------------------------------------------ */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="set-password">
          Password
        </label>
        <input
          id="set-password"
          className={styles.input}
          type="password"
          autoComplete="new-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPasswordVal(e.target.value)}
          disabled={busy}
          autoFocus
        />
      </div>

      {/* ---- Confirm Password ---------------------------------------- */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="set-password-confirm">
          Confirm Password
        </label>
        <input
          id="set-password-confirm"
          className={styles.input}
          type="password"
          autoComplete="new-password"
          placeholder="Confirm your password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={busy}
        />
      </div>

      {/* ---- Hint ---------------------------------------------------- */}
      <p className={styles.hint}>Minimum 8 characters</p>

      {/* ---- Error --------------------------------------------------- */}
      {error && <p className={styles.error}>{error}</p>}

      {/* ---- Submit -------------------------------------------------- */}
      <button type="submit" className={styles.btn} disabled={busy}>
        {busy ? 'Setting password\u2026' : buttonLabel}
      </button>
    </form>
  );
}
