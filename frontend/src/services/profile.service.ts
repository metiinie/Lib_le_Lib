import { api } from '@/lib/api';
import { ProfileDto } from '@/lib/zod-schemas';

export const profileService = {
  createProfile: async (data: ProfileDto) => {
    const response = await api.post('/profiles', data);
    return response.data;
  },
};
