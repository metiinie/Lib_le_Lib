import { useAuthStore } from '@/state/auth.store';
import { useCallback } from 'react';

/**
 * useAuth — convenience hook for auth state and actions.
 *
 * signIn(token)                   — legacy single-token store (kept for compat)
 * signInWithTokens(at, rt)        — store both access + refresh tokens (use this)
 * signOut()                       — clear all tokens, route guard redirects to login
 */
export const useAuth = () => {
  const token = useAuthStore((state) => state.token);
  const setToken = useAuthStore((state) => state.setToken);
  const setTokens = useAuthStore((state) => state.setTokens);
  const signOut = useAuthStore((state) => state.signOut);

  /** @deprecated Use signInWithTokens — stores both tokens for 7-day refresh */
  const signIn = useCallback(
    (newToken: string) => {
      setToken(newToken);
    },
    [setToken],
  );

  /**
   * Store both access and refresh tokens atomically in SecureStore.
   * Call this after a successful login or after setPassword() during registration.
   */
  const signInWithTokens = useCallback(
    (accessToken: string, refreshToken: string) => {
      setTokens(accessToken, refreshToken);
    },
    [setTokens],
  );

  return {
    token,
    isAuthenticated: !!token,
    signIn,
    signInWithTokens,
    signOut,
  };
};
