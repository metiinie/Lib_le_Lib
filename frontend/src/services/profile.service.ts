import { api } from '@/lib/api';
import { ProfileDto } from '@/lib/zod-schemas';

export const profileService = {
  createProfile: async (data: ProfileDto) => {
    const response = await api.post('/profiles/me', data);
    return response.data;
  },
  updateProfile: async (data: Partial<ProfileDto>) => {
    const response = await api.patch('/profiles/me', data);
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/profiles/me');
    return response.data;
  },
  getRegions: async () => {
    const response = await api.get<{ id: string; name: string }[]>('/regions');
    return response.data;
  },
};
