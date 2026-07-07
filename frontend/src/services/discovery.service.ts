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
    const profiles: DiscoveryProfile[] = response.data;
    // Client-side defensive check: ensure blocked users NEVER display
    return profiles.filter(p => !p.isBlocked);
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
