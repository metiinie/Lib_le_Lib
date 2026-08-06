import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuthStore } from '@/state/auth.store';

function getBaseUrl(): string {
  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  }

  // Extract IP dynamically from Expo Metro bundler hostUri
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.developer?.tool;
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
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Only clear auth if we actually had a token — prevents background polls
      // (e.g. /verification/me/status) from logging the user out when the
      // access token hasn't finished hydrating from SecureStore yet.
      const currentToken = useAuthStore.getState().token;
      if (currentToken) {
        useAuthStore.getState().signOut();
      }
    }
    return Promise.reject(error);
  }
);
