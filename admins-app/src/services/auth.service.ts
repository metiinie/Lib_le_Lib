import { api } from './api';
import { User, AuthResponse } from '../types';

export const authService = {
  requestOtp: async (destination: string, isSignUp = false) => {
    const cleanDestination = destination.trim().toLowerCase();
    const res = await api.post('/auth/otp/request', {
      destination: cleanDestination,
      isSignUp,
    });
    return res.data;
  },

  verifyOtp: async (destination: string, code: string, isSignUp = false): Promise<AuthResponse> => {
    const cleanDestination = destination.trim().toLowerCase();
    const cleanCode = code.trim();

    const res = await api.post('/auth/otp/verify', {
      destination: cleanDestination,
      code: cleanCode,
      isSignUp,
    });

    if (res.data?.accessToken) {
      sessionStorage.setItem('admin_access_token', res.data.accessToken);
      localStorage.removeItem('admin_access_token');
    }

    // Fetch full user identity & role from backend
    const user = await authService.getMe();
    return {
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken,
      user,
    };
  },

  getMe: async (): Promise<User> => {
    const res = await api.get('/users/me');
    return res.data;
  },

  logout: () => {
    sessionStorage.removeItem('admin_access_token');
    sessionStorage.removeItem('admin_user');
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_user');
  },
};

