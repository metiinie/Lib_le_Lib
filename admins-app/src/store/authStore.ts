import { useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/auth.service';

export function useAuthStore() {
  const [user, setUser] = useState<User | null>(() => {
    const cached = sessionStorage.getItem('admin_user') || localStorage.getItem('admin_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token =
      sessionStorage.getItem('admin_access_token') ||
      localStorage.getItem('admin_access_token');

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    authService
      .getMe()
      .then((data) => {
        setUser(data);
        sessionStorage.setItem('admin_user', JSON.stringify(data));
      })
      .catch(() => {
        setUser(null);
        sessionStorage.removeItem('admin_access_token');
        sessionStorage.removeItem('admin_user');
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_user');
      })
      .finally(() => setLoading(false));

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('admin_unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('admin_unauthorized', handleUnauthorized);
    };
  }, []);

  const loginSuccess = (userData: User, token: string) => {
    sessionStorage.setItem('admin_access_token', token);
    sessionStorage.setItem('admin_user', JSON.stringify(userData));
    // Clear any legacy localStorage to ensure session boundary
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_user');
    setUser(userData);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    role: user?.role,
    isAdmin: user?.role === 'admin',
    isVerificationOfficer: user?.role === 'verification_officer' || user?.role === 'admin',
    isModerator: user?.role === 'moderator' || user?.role === 'admin',
    isHealthProfessional: user?.role === 'health_professional' || user?.role === 'admin',
    loginSuccess,
    logout,
  };
}

