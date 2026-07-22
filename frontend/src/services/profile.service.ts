import { api } from '@/lib/api';
import { ProfileDto } from '@/lib/zod-schemas';

export const profileService = {
  createProfile: async (data: ProfileDto) => {
    const response = await api.post('/profiles/me', data);
    return response.data;
  },
  getRegions: async () => {
    const response = await api.get<{ id: string; name: string }[]>('/regions');
    return response.data;
  },
};
