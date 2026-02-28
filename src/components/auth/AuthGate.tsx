import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { LoginScreen } from './LoginScreen';

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const session = useAuthStore((s) => s.session);
  const loading = useAuthStore((s) => s.loading);
  const settingPassword = useAuthStore((s) => s.settingPassword);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  /* ---- Loading spinner ------------------------------------------- */
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100dvh',
          backgroundColor: 'var(--bg)',
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          style={{ animation: 'spin 0.8s linear infinite' }}
        >
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="var(--od)"
            strokeWidth="3"
            strokeDasharray="80"
            strokeDashoffset="60"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  /* ---- Not logged in, or still setting password ------------------- */
  if (!session || settingPassword) {
    return <LoginScreen />;
  }

  /* ---- Authenticated --------------------------------------------- */
  return <>{children}</>;
}
