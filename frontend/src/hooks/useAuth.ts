import { useAuthStore } from '@/state/auth.store';
import { useCallback } from 'react';

export const useAuth = () => {
  const token = useAuthStore((state) => state.token);
  const setToken = useAuthStore((state) => state.setToken);
  const signOut = useAuthStore((state) => state.signOut);

  const signIn = useCallback((newToken: string) => {
    setToken(newToken);
  }, [setToken]);

  return {
    token,
    isAuthenticated: !!token,
    signIn,
    signOut,
  };
};
