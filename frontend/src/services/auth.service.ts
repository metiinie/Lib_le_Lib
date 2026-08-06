import { api } from '@/lib/api';

/**
 * Auth service — wraps all backend authentication endpoints.
 *
 * OTP methods:    used during registration (phone verification, one-time)
 * Password methods: used for all subsequent logins
 */
export const authService = {
  // ── OTP (registration only) ──────────────────────────────────────────────

  /**
   * Request an OTP SMS to the given phone number.
   * Pass isSignUp=true for registration, false for legacy login (not used in new flow).
   * The backend field is `destination`.
   */
  requestOtp: async (destination: string, isSignUp: boolean) => {
    const response = await api.post('/auth/otp/request', { destination, isSignUp });
    return response.data as { message: string };
  },

  /**
   * Verify an OTP. During registration this returns a TEMP token pair.
   * The client carries `accessToken` to `setPassword()` — does NOT store in SecureStore yet.
   * Returns { accessToken, refreshToken, userId, isRegistration }.
   */
  verifyOtp: async (destination: string, code: string, isSignUp: boolean) => {
    const response = await api.post('/auth/otp/verify', { destination, code, isSignUp });
    return response.data as {
      accessToken: string;
      refreshToken: string;
      userId: string;
      isRegistration: boolean;
    };
  },

  // ── Password Login ───────────────────────────────────────────────────────

  /**
   * Login with phone + password for returning users.
   * Returns { accessToken, refreshToken, userId } to store in SecureStore.
   */
  login: async (phone: string, password: string) => {
    const response = await api.post('/auth/login', { phone, password });
    return response.data as {
      accessToken: string;
      refreshToken: string;
      userId: string;
    };
  },

  // ── Password Management ──────────────────────────────────────────────────

  /**
   * Set the permanent password after OTP verify during registration.
   * Call this with the temp accessToken in the Authorization header.
   * Returns a FINAL { accessToken, refreshToken, userId } to store in SecureStore.
   */
  setPassword: async (phone: string, password: string) => {
    const response = await api.post('/auth/password/set', { phone, password });
    return response.data as {
      accessToken: string;
      refreshToken: string;
      userId: string;
    };
  },

  /**
   * Initiate forgot-password flow. Sends SMS reset link to the registered phone.
   * Always returns success to prevent phone enumeration.
   */
  forgotPassword: async (phone: string) => {
    const response = await api.post('/auth/password/forgot', { phone });
    return response.data as { message: string };
  },

  /**
   * Apply a new password using the reset token from the SMS link.
   */
  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/auth/password/reset', { token, newPassword });
    return response.data as { message: string };
  },
};
