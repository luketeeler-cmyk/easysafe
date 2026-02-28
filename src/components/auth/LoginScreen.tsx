import { useAuthStore } from '../../stores/authStore';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { OtpVerifyForm } from './OtpVerifyForm';
import { SetPasswordForm } from './SetPasswordForm';
import { ForgotForm } from './ForgotForm';
import styles from './LoginScreen.module.css';

/* ------------------------------------------------------------------ */
/*  Safe icon SVG (inline so no extra asset is needed)                 */
/* ------------------------------------------------------------------ */
function SafeIcon() {
  return (
    <div className={styles.iconWrap}>
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--text-on-accent)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Safe body */}
        <rect x="2" y="4" width="20" height="16" rx="2" />
        {/* Dial */}
        <circle cx="12" cy="12" r="3" />
        {/* Dial tick marks */}
        <line x1="12" y1="9" x2="12" y2="7" />
        <line x1="12" y1="17" x2="12" y2="15" />
        <line x1="9" y1="12" x2="7" y2="12" />
        <line x1="17" y1="12" x2="15" y2="12" />
        {/* Handle */}
        <line x1="19" y1="9" x2="19" y2="15" />
        {/* Legs */}
        <line x1="5" y1="20" x2="5" y2="22" />
        <line x1="19" y1="20" x2="19" y2="22" />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LoginScreen                                                        */
/* ------------------------------------------------------------------ */
export function LoginScreen() {
  const authStep = useAuthStore((s) => s.authStep);

  function renderForm() {
    switch (authStep) {
      case 'signin':
        return <SignInForm />;
      case 'signup-email':
        return <SignUpForm />;
      case 'signup-otp':
        return <OtpVerifyForm mode="signup" />;
      case 'signup-password':
        return <SetPasswordForm mode="create" />;
      case 'forgot-email':
        return <ForgotForm />;
      case 'forgot-otp':
        return <OtpVerifyForm mode="forgot" />;
      case 'forgot-password':
        return <SetPasswordForm mode="reset" />;
      default:
        return <SignInForm />;
    }
  }

  return (
    <div className={styles.backdrop}>
      <div className={styles.card}>
        <SafeIcon />
        <h1 className={styles.title}>EasySafe</h1>
        <p className={styles.subtitle}>Your secure firearms vault</p>
        {renderForm()}
      </div>
    </div>
  );
}
