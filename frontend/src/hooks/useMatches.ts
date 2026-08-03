import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchService, Match } from '@/services/match.service';

export const useMatches = () => {
  const queryClient = useQueryClient();

  const query = useQuery<Match[], Error>({
    queryKey: ['matches'],
    queryFn: () => matchService.getMatches(),
  });

  const unmatchMutation = useMutation({
    mutationFn: (matchId: string) => matchService.unmatch(matchId),
    onSuccess: (_, matchId) => {
      queryClient.setQueryData(['matches'], (oldData: Match[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter(m => m.id !== matchId);
      });
    },
  });

  const blockMutation = useMutation({
    mutationFn: (userId: string) => matchService.block(userId),
    onSuccess: (_, userId) => {
      queryClient.setQueryData(['matches'], (oldData: Match[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter(m => m.matchedUserId !== userId);
      });
    },
  });

  return {
    ...query,
    unmatch: unmatchMutation.mutateAsync,
    block: blockMutation.mutateAsync,
  };
};
