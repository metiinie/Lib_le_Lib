import { useQuery } from '@tanstack/react-query';
import { matchService, Match } from '@/services/match.service';

export const useMatches = () => {
  return useQuery<Match[], Error>({
    queryKey: ['matches'],
    queryFn: () => matchService.getMatches(),
  });
};
