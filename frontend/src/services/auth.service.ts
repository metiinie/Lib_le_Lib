import { api } from '@/lib/api';

export const authService = {
  requestOtp: async (identifier: string) => {
    // identifier can be phone or email based on backend implementation
    const response = await api.post('/auth/otp/request', { identifier });
    return response.data;
  },

  verifyOtp: async (identifier: string, code: string) => {
    const response = await api.post('/auth/otp/verify', { identifier, code });
    return response.data; // Expected to contain { token: string }
  },
};
