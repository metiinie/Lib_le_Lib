import { useAuth } from '../context/AuthContext';

export function useAuthStore() {
  return useAuth();
}
