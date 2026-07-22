import { api } from '@/lib/api';

export const authService = {
  /**
   * Request an OTP. Pass isSignUp=true for registration, false for login.
   * The backend field is `destination` (not `identifier`).
   */
  requestOtp: async (destination: string, isSignUp: boolean) => {
    const response = await api.post('/auth/otp/request', { destination, isSignUp });
    return response.data;
  },

  /**
   * Verify an OTP. The backend field is `destination` (not `identifier`).
   * Returns { accessToken, refreshToken, userId }.
   */
  verifyOtp: async (destination: string, code: string, isSignUp: boolean) => {
    const response = await api.post('/auth/otp/verify', { destination, code, isSignUp });
    return response.data;
  },
};
