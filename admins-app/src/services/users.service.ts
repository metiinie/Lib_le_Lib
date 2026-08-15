import { api } from './api';
import { User, UserRole, AuditLog } from '../types';

export interface AdminStats {
  totalUsers: number;
  roles: {
    member: number;
    verification_officer: number;
    moderator: number;
    health_professional: number;
    admin: number;
  };
}

export const usersService = {
  getUsers: async (
    limit = 50,
    offset = 0,
    search?: string,
    role?: UserRole
  ): Promise<{ data: User[]; total: number; limit: number; offset: number }> => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    if (search && search.trim()) params.append('search', search.trim());
    if (role) params.append('role', role);

    const res = await api.get(`/users?${params.toString()}`);
    return res.data;
  },

  getAdminStats: async (): Promise<AdminStats> => {
    const res = await api.get('/users/admin/stats');
    return res.data;
  },

  getDashboardStats: async (): Promise<AdminStats> => {
    const res = await api.get('/users/admin/stats');
    return res.data;
  },

  updateUserRole: async (userId: string, role: UserRole) => {
    const res = await api.patch(`/users/${userId}/role`, { role });
    return res.data;
  },

  getAuditLogs: async (
    limit = 50,
    offset = 0
  ): Promise<{ data: AuditLog[]; total: number }> => {
    const res = await api.get(`/admin/audit-logs?limit=${limit}&offset=${offset}`);
    return res.data;
  },
};
