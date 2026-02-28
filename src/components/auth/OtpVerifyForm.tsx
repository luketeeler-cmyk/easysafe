import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
  type KeyboardEvent,
  type ClipboardEvent,
} from 'react';
import { useAuthStore } from '../../stores/authStore';
import styles from './OtpVerifyForm.module.css';

const CODE_LENGTH = 6;

interface OtpVerifyFormProps {
  mode: 'signup' | 'forgot';
}

export function OtpVerifyForm({ mode }: OtpVerifyFormProps) {
  const pendingEmail = useAuthStore((s) => s.pendingEmail);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const signUp = useAuthStore((s) => s.signUp);
  const forgotPassword = useAuthStore((s) => s.forgotPassword);
  const setAuthStep = useAuthStore((s) => s.setAuthStep);

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ---- Auto-focus first input on mount ----------------------------- */
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  /* ---- Set a single digit ------------------------------------------ */
  const setDigit = useCallback(
    (index: number, value: string) => {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = value;
        return next;
      });
    },
    [],
  );

  /* ---- Handle input for each digit field --------------------------- */
  function handleInput(index: number, value: string) {
    /* Only allow single digit */
    const char = value.replace(/\D/g, '').slice(-1);
    setDigit(index, char);
    setError('');

    /* Auto-advance to next input when a digit is entered */
    if (char && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  /* ---- Handle keydown for backspace navigation --------------------- */
  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        /* Clear current digit */
        setDigit(index, '');
      } else if (index > 0) {
        /* Move to previous input and clear it */
        setDigit(index - 1, '');
        inputRefs.current[index - 1]?.focus();
      }
      e.preventDefault();
    }

    /* Arrow key navigation */
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  /* ---- Handle paste: distribute digits across inputs --------------- */
  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasted) return;

    const chars = pasted.slice(0, CODE_LENGTH).split('');
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((ch, i) => {
        next[i] = ch;
      });
      return next;
    });
    setError('');

    /* Focus the input after the last pasted digit, or the last one */
    const focusIndex = Math.min(chars.length, CODE_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  }

  /* ---- Submit ------------------------------------------------------ */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const code = digits.join('');
    if (code.length < CODE_LENGTH) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setBusy(true);
    const { error: authErr } = await verifyOtp(code);
    setBusy(false);

    if (authErr) {
      if (
        authErr.message.includes('expired') ||
        authErr.message.includes('invalid')
      ) {
        setError('Invalid or expired code. Please try again.');
      } else if (authErr.message.includes('rate')) {
        setError('Too many attempts. Please wait a moment and try again.');
      } else {
        setError(authErr.message);
      }
      /* Clear the inputs so the user can re-enter */
      setDigits(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
    /* On success the store navigates to the password step */
  }

  /* ---- Resend code ------------------------------------------------- */
  async function handleResend() {
    setError('');
    setResending(true);

    const { error: authErr } =
      mode === 'signup'
        ? await signUp(pendingEmail)
        : await forgotPassword(pendingEmail);

    setResending(false);

    if (authErr) {
      if (authErr.message.includes('rate')) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError(authErr.message);
      }
    }
  }

  /* ---- Back navigation --------------------------------------------- */
  function handleBack() {
    setAuthStep(mode === 'signup' ? 'signup-email' : 'forgot-email');
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <p className={styles.heading}>Check your email</p>
      <p className={styles.desc}>
        We sent a 6-digit code to{' '}
        <span className={styles.email}>{pendingEmail}</span>
      </p>

      {/* ---- OTP digit inputs ---------------------------------------- */}
      <div className={styles.otpRow}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            className={styles.otpInput}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            onChange={(e) => handleInput(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            disabled={busy}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>

      {/* ---- Error --------------------------------------------------- */}
      {error && <p className={styles.error}>{error}</p>}

      {/* ---- Submit -------------------------------------------------- */}
      <button type="submit" className={styles.btn} disabled={busy}>
        {busy ? 'Verifying\u2026' : 'Verify Code'}
      </button>

      {/* ---- Footer links -------------------------------------------- */}
      <div className={styles.links}>
        <button
          type="button"
          className={styles.link}
          onClick={handleResend}
          disabled={resending || busy}
        >
          {resending ? 'Resending\u2026' : 'Resend Code'}
        </button>
        <button
          type="button"
          className={styles.link}
          onClick={handleBack}
          disabled={busy}
        >
          &larr; Back
        </button>
      </div>
    </form>
  );
}
