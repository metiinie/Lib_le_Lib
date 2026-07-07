import { create } from 'zustand';
import { cryptoService } from '../services/crypto.service';
import { api } from '@/lib/api';

interface ChatEncryptionState {
  isInitialized: boolean;
  deviceId: string | null;
  initialize: () => Promise<void>;
}

export const useChatEncryption = create<ChatEncryptionState>((set) => ({
  isInitialized: false,
  deviceId: null,
  initialize: async () => {
    try {
      const keys = await cryptoService.generateDeviceKeys();
      // Register public keys with backend
      const response = await api.post('/devices', keys);
      set({ isInitialized: true, deviceId: response.data?.deviceId || 'device_123' });
    } catch (err) {
      console.error('Failed to initialize E2E keys', err);
    }
  }
}));
