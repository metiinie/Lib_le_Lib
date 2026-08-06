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
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return typeof window !== 'undefined' ? localStorage.getItem(name) : null;
      } catch {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') localStorage.setItem(name, value);
      } catch {}
      return;
    }
    try {
      await SecureStore.setItemAsync(name, value);
    } catch {}
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') localStorage.removeItem(name);
      } catch {}
      return;
    }
    try {
      await SecureStore.deleteItemAsync(name);
    } catch {}
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      _hasHydrated: false,

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
      onRehydrateStorage: () => () => {
        // Called after hydration finishes (success or fail).
        // Gates the root layout before making any routing decisions.
        useAuthStore.setState({ _hasHydrated: true });
      },
    }
  )
);
