import { api } from '@/lib/api';

export interface UserMeDto {
  id: string;
  role: 'member' | 'verification_officer' | 'moderator' | 'admin' | 'health_professional';
  status: 'pending_verification' | 'active' | 'suspended' | 'banned' | 'deleted';
  phone?: string | null;
  email?: string | null;
}

export const userService = {
  getMe: async (): Promise<UserMeDto> => {
    const response = await api.get<UserMeDto>('/users/me');
    return response.data;
  },
};
