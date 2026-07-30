import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { authService } from '../services/auth.service';

vi.mock('../services/auth.service', () => ({
  authService: {
    getMe: vi.fn().mockImplementation(() => Promise.reject(new Error('No session'))),
    logout: vi.fn(),
  },
}));

const TestConsumer = () => {
  const { user, isAuthenticated, loginSuccess, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Unauthenticated'}</span>
      <span data-testid="user-email">{user?.email || 'No Email'}</span>
      <button onClick={() => loginSuccess({ id: 'u1', email: 'admin@libr.org', role: 'admin', status: 'active', createdAt: '', updatedAt: '' }, 'token-123')}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('provides unauthenticated initial state when no token exists', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Unauthenticated');
  });

  it('updates state and storage on loginSuccess', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Login').click();
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user-email')).toHaveTextContent('admin@libr.org');
    expect(sessionStorage.getItem('admin_access_token')).toBe('token-123');
  });

  it('clears storage and resets state on logout', async () => {
    (authService.getMe as any).mockResolvedValueOnce({ id: 'u1', email: 'admin@libr.org', role: 'admin' });
    sessionStorage.setItem('admin_access_token', 'token-123');

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });

    await act(async () => {
      screen.getByText('Logout').click();
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Unauthenticated');
    expect(authService.logout).toHaveBeenCalled();
  });
});
