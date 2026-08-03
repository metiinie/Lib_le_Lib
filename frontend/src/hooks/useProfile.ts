import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profileService.getProfile(),
  });
};
