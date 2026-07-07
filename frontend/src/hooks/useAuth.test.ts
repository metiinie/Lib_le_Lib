import { act, renderHook } from '@testing-library/react-native';
import { useAuth } from './useAuth';
import { useAuthStore } from '../state/auth.store';

// Mock zustand store to prevent real async storage usage
jest.mock('zustand/middleware', () => {
  return {
    persist: (config: any) => config,
    createJSONStorage: () => null,
  };
});

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('useAuth', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({ token: null });
  });

  it('should initialize with null token', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should set token and authenticate user on signIn', () => {
    const { result } = renderHook(() => useAuth());
    
    act(() => {
      result.current.signIn('test-token');
    });

    expect(result.current.token).toBe('test-token');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should clear token and log out on signOut', () => {
    useAuthStore.setState({ token: 'test-token' });
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.isAuthenticated).toBe(true);
    
    act(() => {
      result.current.signOut();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
