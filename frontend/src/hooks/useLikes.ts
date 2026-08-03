import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { discoveryService } from '@/services/discovery.service';

export interface LikeProfile {
  id: string;
  nickname: string;
  age: number;
  region: string;
  photos: { id: string; blurhash: string; url?: string; revealGranted: boolean }[];
}

export const useLikes = (type: 'received' | 'sent') => {
  const queryClient = useQueryClient();

  const query = useQuery<LikeProfile[], Error>({
    queryKey: ['likes', type],
    queryFn: async () => {
      const endpoint = type === 'received' ? '/swipes/received-likes' : '/swipes/sent-likes';
      const response = await api.get(endpoint);
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  const passMutation = useMutation({
    mutationFn: (targetId: string) => discoveryService.passProfile(targetId),
    onSuccess: (_, targetId) => {
      // Optimistically remove from received likes list
      queryClient.setQueryData(['likes', 'received'], (oldData: LikeProfile[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter(profile => profile.id !== targetId);
      });
      // Invalidate just to be sure
      queryClient.invalidateQueries({ queryKey: ['likes', 'received'] });
    },
  });

  return {
    ...query,
    passProfile: passMutation.mutateAsync,
    isPassing: passMutation.isPending,
  };
};
