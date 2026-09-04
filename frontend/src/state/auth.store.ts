import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  /** JWT access token — expires in 15 min. Never store without refreshToken. */
  token: string | null;
  /** JWT refresh token — expires after 7 days of inactivity. Stored in SecureStore. */
  refreshToken: string | null;
  /** True once the persist middleware has finished reading from SecureStore. */
  _hasHydrated: boolean;
  setToken: (token: string) => void;
  /** Stores both tokens atomically — always call this, never setToken alone. */
  setTokens: (accessToken: string, refreshToken: string) => void;
  /** Refreshes only the access token after a successful /auth/refresh call. */
  updateAccessToken: (accessToken: string) => void;
  signOut: () => void;
}

// Custom storage supporting both Native (SecureStore) and Web (localStorage)
const secureStorage = {
  getItem: (name: string): string | null | Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return typeof window !== 'undefined' ? localStorage.getItem(name) : null;
      } catch {
        return null;
      }
    }
    try {
      return SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void | Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') localStorage.setItem(name, value);
      } catch { }
      return;
    }
    try {
      return SecureStore.setItemAsync(name, value);
    } catch { }
  },
  removeItem: (name: string): void | Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') localStorage.removeItem(name);
      } catch { }
      return;
    }
    try {
      return SecureStore.deleteItemAsync(name);
    } catch { }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      _hasHydrated: Platform.OS === 'web',

      setToken: (token: string) => set({ token }),

      setTokens: (accessToken: string, refreshToken: string) =>
        set({ token: accessToken, refreshToken }),

      updateAccessToken: (accessToken: string) => set({ token: accessToken }),

      signOut: () => set({ token: null, refreshToken: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      // Persist both tokens so the 7-day refresh window survives app restarts
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state, error) => {
        useAuthStore.setState({ _hasHydrated: true });
      },
    }
  )
);

// Guarantee hydration state is initialized
if (useAuthStore.persist.hasHydrated()) {
  useAuthStore.setState({ _hasHydrated: true });
}
useAuthStore.persist.onFinishHydration(() => {
  useAuthStore.setState({ _hasHydrated: true });
});

