import { api } from '@/lib/api';

export interface DiscoveryProfile {
  id: string;
  nickname: string;
  age: number;
  gender: string;
  region: string;
  bio?: string;
  relationshipGoals: string[];
  photos: { id: string; blurhash: string; url?: string; revealGranted: boolean }[];
  isBlocked: boolean; // Managed by backend but kept here for client-side defense checks
}

export const discoveryService = {
  getProfiles: async (filters?: any): Promise<DiscoveryProfile[]> => {
    const response = await api.get('/discovery', { params: filters });
    const rawData = Array.isArray(response.data) ? response.data : [];
    
    // Client-side defensive check & field normalization
    const normalized: DiscoveryProfile[] = rawData
      .filter((p) => p && !p.isBlocked)
      .map((p) => {
        const id = p.id || p.userId || Math.random().toString(36).substring(7);
        const photos = Array.isArray(p.photos) && p.photos.length > 0
          ? p.photos
          : [
              {
                id: `ph_${id}`,
                blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
                url: p.primaryPhotoRef || undefined,
                revealGranted: p.isBlurred === false,
              },
            ];

        return {
          id,
          nickname: p.nickname || 'Member',
          age: typeof p.age === 'number' ? p.age : 25,
          gender: p.gender || 'Not specified',
          region: p.region || 'Nearby',
          bio: p.bio || '',
          relationshipGoals: Array.isArray(p.relationshipGoals) ? p.relationshipGoals : [],
          photos,
          isBlocked: false,
        };
      });

    return normalized;
  },

  likeProfile: async (targetId: string) => {
    const response = await api.post(`/interactions/${targetId}/like`);
    return response.data;
  },

  passProfile: async (targetId: string) => {
    const response = await api.post(`/interactions/${targetId}/pass`);
    return response.data;
  },

  blockProfile: async (targetId: string) => {
    const response = await api.post(`/interactions/${targetId}/block`);
    return response.data;
  },
};
