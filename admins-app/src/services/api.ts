import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token =
      sessionStorage.getItem('admin_access_token') ||
      localStorage.getItem('admin_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('admin_access_token');
      sessionStorage.removeItem('admin_user');
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_user');
      window.dispatchEvent(new Event('admin_unauthorized'));
    }
    return Promise.reject(error);
  }
);

