import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/auth.service';
import { useInactivityLogout } from '../hooks/useInactivityLogout';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  role?: UserRole;
  isAdmin: boolean;
  isVerificationOfficer: boolean;
  isModerator: boolean;
  isHealthProfessional: boolean;
  loginSuccess: (userData: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cached = sessionStorage.getItem('admin_user') || localStorage.getItem('admin_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  // Enforce 15-minute session inactivity auto-logout
  useInactivityLogout(logout, !!user, 15 * 60 * 1000);

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
        logout();
      })
      .finally(() => setLoading(false));

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('admin_unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('admin_unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const loginSuccess = (userData: User, token: string) => {
    sessionStorage.setItem('admin_access_token', token);
    sessionStorage.setItem('admin_user', JSON.stringify(userData));
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_user');
    setUser(userData);
  };

  const role = user?.role;

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    role,
    isAdmin: role === 'admin',
    isVerificationOfficer: role === 'verification_officer' || role === 'admin',
    isModerator: role === 'moderator' || role === 'admin',
    isHealthProfessional: role === 'health_professional' || role === 'admin',
    loginSuccess,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
