import { useAuthStore } from '../stores/authStore';

/**
 * Convenience hook that exposes the full auth store.
 *
 * Usage:
 *   const { session, user, loading, signIn, signOut } = useAuth();
 */
export function useAuth() {
  return useAuthStore((s) => s);
}
