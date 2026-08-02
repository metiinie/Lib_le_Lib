import { create } from 'zustand';

interface PreferencesState {
  isDiscreetMode: boolean;
  isLowBandwidthMode: boolean;
  notificationsEnabled: boolean;
  photosVisibleToVerified: boolean;
  language: 'en' | 'am';
  setPreference: <K extends keyof Omit<PreferencesState, 'setPreference'>>(key: K, value: PreferencesState[K]) => void;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  isDiscreetMode: false,
  isLowBandwidthMode: false,
  notificationsEnabled: true,
  photosVisibleToVerified: true,
  language: 'en',
  setPreference: (key, value) => set((state) => ({ ...state, [key]: value })),
}));
