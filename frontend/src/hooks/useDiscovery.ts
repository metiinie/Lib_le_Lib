import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discoveryService, DiscoveryProfile } from '@/services/discovery.service';

export const useDiscovery = (filters?: any) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['discoveryProfiles', filters],
    queryFn: () => discoveryService.getProfiles(filters),
  });

  const likeMutation = useMutation({
    mutationFn: (targetId: string) => discoveryService.likeProfile(targetId),
    onSuccess: (_, targetId) => {
      // Optimistically remove from discovery list
      queryClient.setQueryData(['discoveryProfiles', filters], (oldData: DiscoveryProfile[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter(profile => profile.id !== targetId);
      });
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });

  const passMutation = useMutation({
    mutationFn: (targetId: string) => discoveryService.passProfile(targetId),
    onSuccess: (_, targetId) => {
      queryClient.setQueryData(['discoveryProfiles', filters], (oldData: DiscoveryProfile[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter(profile => profile.id !== targetId);
      });
    },
  });

  return {
    ...query,
    likeProfile: likeMutation.mutateAsync,
    passProfile: passMutation.mutateAsync,
    isLiking: likeMutation.isPending,
    isPassing: passMutation.isPending,
  };
};
