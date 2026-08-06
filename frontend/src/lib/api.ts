import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuthStore } from '@/state/auth.store';

function getBaseUrl(): string {
  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  }

  // Extract IP dynamically from Expo Metro bundler hostUri
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.developer?.tool;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:3000`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
}

export const API_URL = getBaseUrl();

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach Bearer token ──────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else if (config.headers) {
        (config.headers as any)['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor — transparent token refresh on 401 ───────────────
//
// When the access token expires (15 min) this interceptor:
//   1. Reads the refresh token from the store
//   2. Calls POST /auth/refresh
//   3. Stores the new access token + refresh token
//   4. Retries the original request with the new token
//
// If the refresh token is also expired (> 7 days of inactivity), the refresh
// call returns 401 and we call signOut(), which triggers the route guard in
// _layout.tsx to redirect the user to the login screen.
//
// We use a flag (_isRefreshing) to prevent multiple simultaneous refresh
// calls when several requests fail at once.

let _isRefreshing = false;
let _refreshSubscribers: Array<(token: string) => void> = [];

function onTokenRefreshed(newToken: string) {
  _refreshSubscribers.forEach((cb) => cb(newToken));
  _refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  _refreshSubscribers.push(cb);
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401s that have not already been retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If we have no access token at all, there's nothing to refresh —
    // avoid spurious sign-out during the hydration window.
    const { token: currentToken, refreshToken, setTokens, signOut } =
      useAuthStore.getState();

    if (!currentToken) {
      return Promise.reject(error);
    }

    // If a refresh is already in flight, queue this request until it's done
    if (_isRefreshing) {
      return new Promise((resolve) => {
        addRefreshSubscriber((newToken: string) => {
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    _isRefreshing = true;

    try {
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Call the refresh endpoint — this itself must NOT go through the
      // interceptor again, so we use a plain axios call (no auth header needed)
      const { data } = await axios.post(
        `${API_URL}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10_000 },
      );

      const newAccessToken: string = data.accessToken;
      const newRefreshToken: string = data.refreshToken;

      // Persist both tokens atomically
      setTokens(newAccessToken, newRefreshToken);

      // Notify all queued requests
      onTokenRefreshed(newAccessToken);

      // Retry the original request with the new token
      originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch {
      // Refresh failed (token expired or network error) — sign out
      _refreshSubscribers = [];
      signOut();
      return Promise.reject(error);
    } finally {
      _isRefreshing = false;
    }
  },
);
