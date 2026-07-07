import axios from 'axios';
import { useAuthStore } from '@/state/auth.store';

// Define the base URL. In production, this should be an environment variable.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    // Basic 401 handling
    if (error.response?.status === 401) {
      // In a real app, you might attempt a token refresh here.
      // For now, we sign out on a hard 401.
      useAuthStore.getState().signOut();
    }
    return Promise.reject(error);
  }
);
