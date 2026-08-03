import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { discoveryService } from '@/services/discovery.service';

export interface LikeProfile {
  id: string;
  nickname: string;
  age: number;
  region: string;
  photos: { id: string; blurhash: string; url?: string; revealGranted: boolean }[];
  createdAt?: string;
  status?: 'Waiting' | 'Matched!';
}

export const useLikes = (type: 'received' | 'sent') => {
  const queryClient = useQueryClient();

  const query = useQuery<LikeProfile[], Error>({
    queryKey: ['likes', type],
    queryFn: async () => {
      const endpoint = type === 'received' ? '/swipes/received-likes' : '/swipes/sent-likes';
      const response = await api.get(endpoint);
      const rawData = Array.isArray(response.data) ? response.data : [];
      
      // Mock some data for the UI if it's missing from the backend response
      return rawData.map(p => ({
        ...p,
        createdAt: p.createdAt || new Date(Date.now() - Math.random() * 100000000).toISOString(),
        status: p.status || (Math.random() > 0.5 ? 'Waiting' : 'Matched!'),
      }));
    },
  });

  const passMutation = useMutation({
    mutationFn: (targetId: string) => discoveryService.passProfile(targetId),
    onSuccess: (_, targetId) => {
      queryClient.setQueryData(['likes', 'received'], (oldData: LikeProfile[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter(profile => profile.id !== targetId);
      });
      queryClient.invalidateQueries({ queryKey: ['likes', 'received'] });
    },
  });

  const likeBackMutation = useMutation({
    mutationFn: (targetId: string) => discoveryService.likeProfile(targetId),
    onSuccess: (_, targetId) => {
      queryClient.setQueryData(['likes', 'received'], (oldData: LikeProfile[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter(profile => profile.id !== targetId);
      });
      queryClient.invalidateQueries({ queryKey: ['likes', 'received'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (targetId: string) => {
      // Mock withdrawal API call for now since backend might not have this endpoint yet
      // await api.delete(`/swipes/${targetId}`);
      return { success: true };
    },
    onSuccess: (_, targetId) => {
      queryClient.setQueryData(['likes', 'sent'], (oldData: LikeProfile[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter(profile => profile.id !== targetId);
      });
      queryClient.invalidateQueries({ queryKey: ['likes', 'sent'] });
    },
  });

  return {
    ...query,
    passProfile: passMutation.mutateAsync,
    isPassing: passMutation.isPending,
    likeBack: likeBackMutation.mutateAsync,
    isLikingBack: likeBackMutation.isPending,
    withdrawLike: withdrawMutation.mutateAsync,
    isWithdrawing: withdrawMutation.isPending,
  };
};
