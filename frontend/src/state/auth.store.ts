import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  signOut: () => void;
}

// Custom storage object for Zustand persist middleware supporting both Native and Web
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
      setToken: (token: string) => set({ token }),
      signOut: () => set({ token: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
